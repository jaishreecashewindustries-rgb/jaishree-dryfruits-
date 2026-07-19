import sharp from "sharp";
import fs from "fs";
import https from "https";

const DL_DIR = "C:/Users/DELL/Downloads/hero-refit";
fs.mkdirSync(DL_DIR, { recursive: true });

const DESKTOP_TARGET = { width: 1600, height: 900 }; // 16:9
const MOBILE_TARGET = { width: 900, height: 1200 };  // 3:4

const jobs = [
  { url: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-desktop-1-goodness.webp?alt=media", name: "hero-desktop-1-goodness.webp", target: DESKTOP_TARGET },
  { url: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-desktop-2-notevery.webp?alt=media", name: "hero-desktop-2-notevery.webp", target: DESKTOP_TARGET },
  { url: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-desktop-3-goodfood.webp?alt=media", name: "hero-desktop-3-goodfood.webp", target: DESKTOP_TARGET },
  { url: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-mobile-1-goodness.webp?alt=media", name: "hero-mobile-1-goodness.webp", target: MOBILE_TARGET },
  { url: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-mobile-2-notevery.webp?alt=media", name: "hero-mobile-2-notevery.webp", target: MOBILE_TARGET },
  { url: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-mobile-3-goodfood.webp?alt=media", name: "hero-mobile-3-goodfood.webp", target: MOBILE_TARGET },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => { res2.pipe(file); file.on("finish", () => file.close(resolve)); });
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", reject);
  });
}

async function main() {
  for (const j of jobs) {
    const rawPath = `${DL_DIR}/raw-${j.name}`;
    const outPath = `${DL_DIR}/${j.name}`;
    await download(j.url, rawPath);
    await sharp(rawPath)
      .resize(j.target.width, j.target.height, { fit: "cover", position: "attention" })
      .webp({ quality: 80 })
      .toFile(outPath);
    const size = fs.statSync(outPath).size;
    console.log(`${j.name}: ${j.target.width}x${j.target.height}, ${(size / 1024).toFixed(0)}KB`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
