/**
 * Post-build prerender step.
 *
 * CRA ships an empty <div id="root"> — crawlers that don't execute JS (and
 * even ones that do, like Googlebot, on a budget) see no real content. This
 * script boots a local static server against the freshly-built `build/`
 * folder, drives a headless Chromium through every important route, waits
 * for an explicit "this page's real data has rendered" signal (never a bare
 * timeout — see the data-prerender-ready attribute in ProductDetail.jsx /
 * Products.jsx), and writes the fully-rendered HTML back into build/<route>/
 * index.html. Firebase Hosting serves a matching static file before falling
 * through to the SPA rewrite, so these become real crawlable pages while the
 * app remains a normal client-rendered SPA for everything else.
 *
 * Failure handling is per-page, never all-or-nothing: a broken/missing
 * product does not block the other 100+ pages from deploying. Every skip is
 * recorded in build/prerender-report.json for the CI workflow to turn into
 * (deduplicated, auto-closing) GitHub issues.
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { spawn } = require("child_process");
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const BUILD_DIR = path.join(__dirname, "..", "build");
// Render into a scratch dir first, NOT into build/ directly — if we overwrite
// build/index.html mid-run, `serve -s` starts serving that (now route-specific)
// snapshot as the SPA fallback for every route prerendered afterwards, so
// later pages load already-populated-but-wrong markup and our "wait for
// footer" check resolves instantly against stale content instead of the real
// page. Keeping build/ untouched until the very end avoids that self-corruption.
const STAGING_DIR = path.join(__dirname, "..", ".prerender-staging");
const PORT = 5050;
const BASE = `http://localhost:${PORT}`;

// ── Load .env manually (no dotenv dependency needed for a handful of KEY=VALUE lines) ──
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const STATIC_ROUTES = [
  "/", "/products", "/about", "/contact", "/faq", "/blog", "/sourcing",
  "/track-order", "/shipping", "/returns", "/privacy", "/terms",
];

const CATEGORY_ROUTES = [
  "Almonds", "Cashews", "Pistachios", "Walnuts", "Raisins", "Dates",
  "Figs", "Apricots", "Combo Packs", "Gift Hampers", "Seeds", "Mixed Nuts",
].map((c) => `/products?category=${encodeURIComponent(c)}`);

// Routes whose content depends on the async products fetch — must wait for
// the explicit data-prerender-ready marker, never a generic network-idle wait.
function needsDataReadyMarker(route) {
  return route.startsWith("/product/") || route.startsWith("/products");
}

async function fetchProductsForPrerender() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = spawn("npx", ["serve", "-s", BUILD_DIR, "-l", String(PORT)], {
      stdio: "pipe",
    });
    let ready = false;
    const onData = (data) => {
      if (!ready && data.toString().toLowerCase().includes("accepting connections")) {
        ready = true;
        resolve(server);
      }
    };
    server.stdout.on("data", onData);
    server.stderr.on("data", onData);
    server.on("error", reject);
    // `serve` doesn't always print the exact string above on every version —
    // fall back to "assume ready" after 3s so we don't hang forever.
    setTimeout(() => { if (!ready) { ready = true; resolve(server); } }, 3000);
  });
}

function routeToFilePath(route) {
  const clean = route.split("?")[0].split("#")[0];
  if (clean === "/") return path.join(STAGING_DIR, "index.html");
  // Query-param routes (category pages) all share one path — encode the
  // query into the directory name so each variant gets its own static file.
  const suffix = route.includes("?")
    ? "__" + route.split("?")[1].replace(/[^a-zA-Z0-9=_-]/g, "_")
    : "";
  return path.join(STAGING_DIR, clean.replace(/^\//, ""), suffix, "index.html");
}

async function prerenderRoute(browser, route, expectedText) {
  const page = await browser.newPage();
  const result = { route, status: "ok" };
  try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });

    if (needsDataReadyMarker(route)) {
      await page.waitForSelector('[data-prerender-ready="true"]', { timeout: 15000 });
    } else {
      await page.waitForSelector("footer", { timeout: 8000 });
    }

    const bodyText = await page.evaluate(() => document.body.innerText || "");
    if (expectedText && !bodyText.includes(expectedText)) {
      result.status = "mismatch";
      result.reason = `Expected text "${expectedText}" not found in rendered page — possible wrong/stale content (cloaking risk).`;
      return result;
    }
    if (bodyText.trim().length < 50) {
      result.status = "mismatch";
      result.reason = "Rendered page has almost no visible text — likely a broken render.";
      return result;
    }

    const html = await page.content();
    const filePath = routeToFilePath(route);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html);
    result.filePath = path.relative(STAGING_DIR, filePath);
  } catch (err) {
    result.status = "timeout";
    result.reason = err.message;
  } finally {
    await page.close();
  }
  return result;
}

async function main() {
  console.log("[prerender] fetching product catalogue for route list + content checks...");
  let products = [];
  try {
    products = await fetchProductsForPrerender();
  } catch (err) {
    console.error("[prerender] FATAL — could not fetch products, aborting prerender (build/deploy will continue with plain SPA output):", err.message);
    process.exit(0); // Non-fatal to the overall build — just skip prerendering entirely this run. Explicit exit for the same reason as below.
  }

  const productRoutes = products.map((p) => ({ route: `/product/${p.id}`, expectedText: p.name }));
  const allRoutes = [
    ...STATIC_ROUTES.map((r) => ({ route: r, expectedText: null })),
    ...CATEGORY_ROUTES.map((r) => ({ route: r, expectedText: null })),
    ...productRoutes,
  ];

  fs.rmSync(STAGING_DIR, { recursive: true, force: true }); // clean up any leftover from a crashed previous run

  console.log(`[prerender] starting static server on port ${PORT}...`);
  const server = await startStaticServer();

  console.log(`[prerender] launching headless browser for ${allRoutes.length} routes...`);
  // `--disable-dev-shm-usage` matters a lot in CI containers, which often
  // give /dev/shm far less space than a real machine — Chrome can hang or
  // crash without it. An explicit launch timeout means a broken CI
  // environment fails fast and loud instead of silently hanging until the
  // job's outer timeout kills it with no useful error.
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    timeout: 30000,
  });

  const results = [];
  for (const { route, expectedText } of allRoutes) {
    const r = await prerenderRoute(browser, route, expectedText);
    results.push(r);
    console.log(`[prerender] ${r.status.padEnd(8)} ${route}${r.reason ? " — " + r.reason : ""}`);
  }

  await browser.close();
  server.kill("SIGKILL");

  // Only now — after every route has been rendered against the untouched
  // original build/ — copy the successful snapshots into build/. This is
  // the step that would otherwise corrupt later routes if done mid-run.
  console.log("[prerender] copying successful snapshots from staging into build/...");
  copyDirRecursive(STAGING_DIR, BUILD_DIR);
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });

  const report = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    timeout: results.filter((r) => r.status === "timeout"),
    mismatch: results.filter((r) => r.status === "mismatch"),
  };
  fs.writeFileSync(path.join(BUILD_DIR, "prerender-report.json"), JSON.stringify(report, null, 2));
  console.log(`[prerender] done — ${report.ok}/${report.total} pages prerendered. ${report.timeout.length} timeouts, ${report.mismatch.length} mismatches (see build/prerender-report.json).`);

  // The actual prerender work is done at this point, but something —
  // `npx serve`'s child process, or a lingering Firestore gRPC channel from
  // the Firebase SDK — keeps Node's event loop alive, so the process never
  // exits on its own. In GitHub Actions this manifests as: script logs
  // "done", then the job hangs silently for the full 30-minute timeout with
  // zero further output. Forcing exit here is the standard fix for this
  // exact class of bug in one-off Node CLI scripts.
  process.exit(0);
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

main();
