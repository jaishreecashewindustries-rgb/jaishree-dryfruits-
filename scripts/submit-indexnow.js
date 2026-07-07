/**
 * Pings Bing's IndexNow API with every URL from the just-deployed sitemap.xml
 * — this is what lets a new/changed page get crawled within minutes instead
 * of waiting on Bing's normal periodic sitemap re-check. Must run AFTER
 * `firebase deploy`, not before, since IndexNow verifies ownership by
 * fetching the key file live from the site.
 *
 * IndexNow key file lives at public/<key>.txt (deployed as-is via CRA's
 * public/ passthrough) — this key must match exactly.
 */
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://jaishreedryfruits.com";
const INDEXNOW_KEY = "2295ac308e32d9eb034cd2fba8780d3f";
const BUILD_DIR = path.join(__dirname, "..", "build");

function extractUrlsFromSitemap() {
  const xml = fs.readFileSync(path.join(BUILD_DIR, "sitemap.xml"), "utf8");
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map((m) => m[1].replace(/&amp;/g, "&"));
}

async function main() {
  const urlList = extractUrlsFromSitemap();
  if (urlList.length === 0) {
    console.error("[indexnow] no URLs found in sitemap.xml — aborting");
    process.exit(1);
  }

  const body = {
    host: new URL(SITE_URL).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    // IndexNow returns 200 or 202 on success, with an empty body — never JSON.
    if (res.ok) {
      console.log(`[indexnow] submitted ${urlList.length} URLs successfully (HTTP ${res.status})`);
    } else {
      const text = await res.text().catch(() => "");
      console.error(`[indexnow] submission failed: HTTP ${res.status} ${text}`);
    }
  } catch (err) {
    console.error("[indexnow] request failed:", err.message);
  }
}

main();
