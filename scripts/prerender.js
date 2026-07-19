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
const { spawn, execFileSync } = require("child_process");
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
const SITE_URL = "https://jaishreedryfruits.com";

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

// Must match the slugs in src/pages/CityLanding.jsx (CITIES) — kept as a
// plain string list here for the same CJS/ESM reason as DEMO_ONLY_PRODUCTS.
const CITY_ROUTES = [
  "mumbai", "delhi", "bangalore", "hyderabad", "chennai", "pune", "kolkata",
  "ahmedabad", "surat", "jaipur", "lucknow", "kanpur", "nagpur", "indore",
  "thane", "bhopal", "visakhapatnam", "patna", "vadodara", "ghaziabad",
  "coimbatore", "kochi", "chandigarh", "ludhiana", "agra", "nashik",
  "faridabad", "meerut", "rajkot", "varanasi", "amritsar", "prayagraj",
  "ranchi", "jodhpur", "gwalior", "vijayawada", "madurai", "raipur",
  "kota", "guwahati", "dehradun", "jabalpur", "aurangabad", "noida", "mysore",
].map((c) => `/dry-fruits-delivery/${c}`);

// Routes whose content depends on the async products fetch — must wait for
// the explicit data-prerender-ready marker, never a generic network-idle wait.
function needsDataReadyMarker(route) {
  return route.startsWith("/product/") || route.startsWith("/products") || route.startsWith("/dry-fruits-delivery/");
}

// Demo-catalogue products that only ever live in src/utils/helpers.js
// (DEMO_PRODUCTS), never written to Firestore unless an admin edits them.
// This script runs as plain CommonJS post-build and can't `require()` an ES
// module source file, so the id/name pairs needed for routing + prerender's
// title-match check are kept in sync here by hand. Without this, these
// pages were never in the sitemap and never prerendered — Googlebot saw a
// blank JS shell for them, same class of bug the prerendering step exists
// to prevent everywhere else.
const DEMO_ONLY_PRODUCTS = [
  { id: "p2", name: "Whole Cashews W320" },
  { id: "p3", name: "Iranian Green Pistachios" },
  { id: "p4", name: "Kashmiri Walnuts (Akhrot)" },
  { id: "p5", name: "Royal Gift Hamper" },
  { id: "p6", name: "Premium Mix Dry Fruits" },
];

// Built-in seed blog posts (src/pages/Blog.jsx SEED_POSTS) — same CJS/ESM
// mismatch reason as DEMO_ONLY_PRODUCTS above prevents requiring that file
// directly. Individual /blog/:id pages were never prerendered at all before
// this (only the /blog listing was) — Googlebot saw a blank shell for every
// single blog post.
const SEED_BLOG_IDS = [
  "almond-benefits", "cashew-grades-explained", "diwali-gifting-guide",
  "walnuts-brain-food", "dates-ramadan", "dry-fruits-for-kids",
];

async function fetchBlogRoutesForPrerender(db) {
  let firestoreIds = [];
  try {
    const snap = await getDocs(collection(db, "blog_posts"));
    firestoreIds = snap.docs.filter((d) => d.data().published).map((d) => d.id);
  } catch {
    // keep seed-only if Firestore read fails — non-fatal
  }
  const allIds = [...new Set([...SEED_BLOG_IDS, ...firestoreIds])];
  return allIds.map((id) => ({ route: `/blog/${id}`, expectedText: null }));
}

async function fetchProductsForPrerender(db) {
  const snap = await getDocs(collection(db, "products"));
  const live = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const liveIds = new Set(live.map((p) => p.id));
  const demoOnly = DEMO_ONLY_PRODUCTS.filter((p) => !liveIds.has(p.id));
  return [...live, ...demoOnly];
}

function waitForPort(port, timeoutMs) {
  const net = require("net");
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => { socket.destroy(); resolve(); });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() >= deadline) reject(new Error(`Timed out waiting for port ${port}`));
        else setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

async function startStaticServer() {
  const server = spawn("npx", ["serve", "-s", BUILD_DIR, "-l", String(PORT)], {
    stdio: "pipe",
    shell: process.platform === "win32",
  });
  let spawnError = null;
  server.on("error", (e) => { spawnError = e; });
  // `serve`'s "Accepting connections" stdout line isn't consistent across
  // versions/platforms — polling the port for an actual TCP accept is the
  // only reliable readiness signal (fixed timeouts were flaky on Windows,
  // where npx's extra shell/cmd.exe hop can push startup past 3s).
  await waitForPort(PORT, 20000).catch((e) => { throw spawnError || e; });
  return server;
}

function routeToFilePath(route, baseDir = STAGING_DIR) {
  const clean = route.split("?")[0].split("#")[0];
  if (clean === "/") return path.join(baseDir, "index.html");
  // Query-param routes (category pages) all share one path — encode the
  // query into the directory name so each variant gets its own static file.
  const suffix = route.includes("?")
    ? "__" + route.split("?")[1].replace(/[^a-zA-Z0-9=_-]/g, "_")
    : "";
  return path.join(baseDir, clean.replace(/^\//, ""), suffix, "index.html");
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

    // Framer Motion's whileInView animations (used throughout Home.jsx and
    // elsewhere) start at opacity:0 and only fire once their element
    // scrolls into the viewport — which never happens here since Puppeteer
    // never scrolls. Without this, every below-the-fold whileInView section
    // gets captured frozen at opacity:0 in the static HTML Google actually
    // crawls (confirmed via Search Console's URL Inspection screenshot
    // cutting off content mid-page). Scrolling through in steps before
    // capture lets every section's IntersectionObserver fire for real.
    await page.setViewport({ width: 1280, height: 1024 });
    await page.evaluate(async () => {
      const step = Math.floor(window.innerHeight * 0.8);
      const height = document.body.scrollHeight;
      for (let y = 0; y < height; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 350));
      }
      await new Promise((r) => setTimeout(r, 300));
      // Some elements (the hero) use scroll-linked parallax (useScroll/
      // useTransform), not a one-time whileInView trigger — their opacity
      // is a direct function of current scroll position, so ending the pass
      // scrolled to the bottom left the hero itself captured at opacity:0.
      // Scrolling back to top restores those to their correct top-of-page
      // state without undoing the once:true whileInView reveals below.
      // Framer Motion's useScroll(target: ref) measures the target
      // element's bounding rect against the viewport on scroll/resize
      // events — jumping straight back to 0 can leave it holding a stale
      // progress value from the last measured position. A tiny nudge forces
      // a fresh scroll event (and thus a fresh measurement) at the final
      // resting position.
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
      window.scrollTo(0, 2);
      await new Promise((r) => setTimeout(r, 150));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 500));
    });

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

    // Safety net: anything in the app that reads window.location (canonical
    // tags, og:url, tracking pixel config, etc.) sees this local staging
    // server's address while prerendering, not the real domain. A bug here
    // once shipped a canonical tag pointing at localhost:5050 to every page
    // in production, which Google could never resolve — this rewrite catches
    // that whole class of mistake even if a future component makes it again.
    const html = (await page.content())
      .split(BASE).join(SITE_URL)
      // Meta Pixel's fbevents.js reads window.location.hostname at init time
      // and injects its own config-fetch <script src="...&domain=..."> tag —
      // during prerendering that freezes in "domain=localhost" too.
      .split("domain=localhost&").join(`domain=${new URL(SITE_URL).hostname}&`)
      // Google Ads' gtag conversion pixel does the same thing but bakes the
      // page URL in as a URL-encoded query param (url=http%3A%2F%2Flocalhost...),
      // which the plain BASE->SITE_URL replace above doesn't match at all —
      // found this leaking into the live homepage's static snapshot.
      .split(encodeURIComponent(BASE)).join(encodeURIComponent(SITE_URL));
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

// Priorities for the static routes — matches the hand-maintained sitemap.xml
// this replaces. Anything not listed here (individual product pages) gets
// a sensible default below.
const STATIC_PRIORITIES = {
  "/": "1.0",
  "/products": "0.9",
  "/about": "0.6",
  "/contact": "0.6",
  "/faq": "0.5",
  "/blog": "0.6",
  "/sourcing": "0.5",
  "/track-order": "0.3",
  "/shipping": "0.3",
  "/returns": "0.3",
};

// sitemap.xml used to be a hand-maintained static file in public/ — it went
// stale (zero individual /product/:id URLs ever listed, so Google had to
// rely on discovering them via crawled links instead of the sitemap) and had
// unescaped spaces in category query strings (e.g. "category=Combo Packs"),
// which isn't valid inside a <loc> per the sitemap spec. Generating it here
// from the same route list already used for prerendering means it can never
// drift from what's actually on the site again.
const NOINDEX_ROUTES = ["/privacy", "/terms"]; // must match `noIndex` on these pages' <SEO> — no point listing pages we told Google not to index

function generateSitemap(routes) {
  // Bing's guidelines explicitly call out <lastmod> as a freshness signal
  // it uses to decide how often to re-crawl a URL — every entry regenerates
  // on every build, so "now" is an honest value (this file is rewritten
  // fresh each deploy, never hand-edited/stale).
  const lastmod = new Date().toISOString().split("T")[0];
  // Routes are already correctly percent-encoded where it matters (see
  // CATEGORY_ROUTES' encodeURIComponent above) — just XML-escape the
  // remaining sitemap-unsafe character (&) and prefix with the real domain.
  const urls = routes
    .filter(({ route }) => !NOINDEX_ROUTES.includes(route))
    .map(({ route }) => {
      const routePath = route.split("?")[0];
      const isCategory = route.includes("category=");
      const priority = isCategory ? "0.7" : (STATIC_PRIORITIES[routePath] || (routePath.startsWith("/product/") ? "0.8" : "0.7"));
      const loc = (SITE_URL + route).replace(/&/g, "&amp;");
      return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`;
    });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(BUILD_DIR, "sitemap.xml"), xml);
}

// Google Merchant Center product feed (RSS 2.0 / Google Shopping spec) —
// built from the exact same Product JSON-LD (<script id="sd-product">)
// SEO.jsx already injects into every prerendered product page, rather than
// re-deriving product data a third time. Guarantees the feed can never drift
// from what's actually live on the page Google/shoppers see.
function xmlEscape(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateMerchantFeed(productRoutes) {
  const items = [];
  for (const { route } of productRoutes) {
    const filePath = routeToFilePath(route, BUILD_DIR);
    if (!fs.existsSync(filePath)) continue;
    const html = fs.readFileSync(filePath, "utf8");
    const match = html.match(/<script[^>]*id="sd-product"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) continue;
    let sd;
    try { sd = JSON.parse(match[1]); } catch { continue; }
    if (!sd?.name || !sd?.offers?.price) continue;

    const id = route.replace("/product/", "");
    const availability = sd.offers.availability?.includes("OutOfStock") ? "out_of_stock" : "in_stock";
    const image = Array.isArray(sd.image) ? sd.image[0] : sd.image;

    items.push(`    <item>
      <g:id>${xmlEscape(id)}</g:id>
      <title>${xmlEscape(sd.name)}</title>
      <description>${xmlEscape((sd.description || "").slice(0, 5000))}</description>
      <link>${xmlEscape(SITE_URL + route)}</link>
      <g:image_link>${xmlEscape(image)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${sd.offers.price} INR</g:price>
      <g:brand>${xmlEscape(sd.brand?.name || "Jai Shree Dryfruits")}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>Food, Beverages &amp; Tobacco &gt; Food Items &gt; Nuts &amp; Seeds</g:google_product_category>
    </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Jai Shree Dryfruits — Product Feed</title>
    <link>${SITE_URL}</link>
    <description>Premium dry fruits product feed for Google Merchant Center</description>
${items.join("\n")}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(BUILD_DIR, "product-feed.xml"), xml);
  console.log(`[prerender] generated product-feed.xml with ${items.length} products`);
}

async function main() {
  console.log("[prerender] fetching product catalogue for route list + content checks...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  let products = [];
  let blogRoutes = [];
  try {
    products = await fetchProductsForPrerender(db);
    blogRoutes = await fetchBlogRoutesForPrerender(db);
  } catch (err) {
    console.error("[prerender] FATAL — could not fetch products, aborting prerender (build/deploy will continue with plain SPA output):", err.message);
    process.exit(0); // Non-fatal to the overall build — just skip prerendering entirely this run. Explicit exit for the same reason as below.
  }

  const productRoutes = products.map((p) => ({ route: `/product/${p.id}`, expectedText: p.name }));
  const allRoutes = [
    ...STATIC_ROUTES.map((r) => ({ route: r, expectedText: null })),
    ...CATEGORY_ROUTES.map((r) => ({ route: r, expectedText: null })),
    ...CITY_ROUTES.map((r) => ({ route: r, expectedText: null })),
    ...productRoutes,
    ...blogRoutes,
  ];

  fs.rmSync(STAGING_DIR, { recursive: true, force: true }); // clean up any leftover from a crashed previous run

  // Defensive: a previous local run's `serve` process can occasionally
  // outlive its parent (npx spawns a grandchild `server.kill()` doesn't
  // always reach), squatting on the port so the next run's server silently
  // fails to bind and every route then fails with ERR_CONNECTION_REFUSED.
  // Never an issue in CI (fresh container each run) — only needed locally.
  try { execFileSync("bash", ["-c", `lsof -ti:${PORT} | xargs -r kill -9`]); } catch {}

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

  console.log("[prerender] generating sitemap.xml from the live route list...");
  generateSitemap(allRoutes);

  console.log("[prerender] generating product-feed.xml for Google Merchant Center...");
  generateMerchantFeed(productRoutes);

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
