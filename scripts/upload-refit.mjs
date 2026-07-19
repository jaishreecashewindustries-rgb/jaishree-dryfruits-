import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyB99uqHkQkG87qN89mFr65pW2vG8Q3GuN4",
  authDomain: "jaishreedryfruits-973dd.firebaseapp.com",
  projectId: "jaishreedryfruits-973dd",
  storageBucket: "jaishreedryfruits-973dd.firebasestorage.app",
  messagingSenderId: "341935442574",
  appId: "1:341935442574:web:9b46c9578302e20db357df",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

const names = [
  "hero-desktop-1-goodness.webp", "hero-mobile-1-goodness.webp",
  "hero-desktop-2-notevery.webp", "hero-mobile-2-notevery.webp",
  "hero-desktop-3-goodfood.webp", "hero-mobile-3-goodfood.webp",
];

async function main() {
  const email = `hero-refit-${Date.now()}@jaishreedryfruits-script.local`;
  await createUserWithEmailAndPassword(auth, email, "TempUpload123!");
  const results = {};
  for (const n of names) {
    const buf = fs.readFileSync(`C:/Users/DELL/Downloads/hero-refit/${n}`);
    const storageRef = ref(storage, `content/hero/${n}`);
    await uploadBytes(storageRef, buf, { contentType: "image/webp" });
    const url = await getDownloadURL(storageRef);
    results[n] = url;
    console.log(`${n} -> ${url}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
