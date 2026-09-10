import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  // REACT_APP_FIREBASE_AUTH_DOMAIN is set to our own domain
  // (jaishreedryfruits.com), NOT the default *.firebaseapp.com — Safari's
  // Intelligent Tracking Prevention treats firebaseapp.com as a third-party
  // tracker and silently drops the storage the signInWithRedirect Google
  // login handshake needs, so the redirect never completes on Safari
  // (mobile and desktop). Firebase Hosting already serves /__/auth/handler
  // and /__/auth/iframe on our own connected custom domain, so pointing
  // authDomain at it makes the whole flow first-party and Safari-safe.
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Firebase config is missing. Create a .env file (see .env.example) with REACT_APP_FIREBASE_* values before running the build."
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Secondary app instance — used only for one-off phone OTP verification
// (e.g. confirming a checkout phone number) so it never touches or
// replaces the main `auth` session of an already-logged-in user.
const verifyApp = getApps().some(a => a.name === "phone-verify")
  ? getApps().find(a => a.name === "phone-verify")
  : initializeApp(firebaseConfig, "phone-verify");
export const verifyAuth = getAuth(verifyApp);

export default app;
