import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB99uqHkQkG87qN89mFr65pW2vG8Q3GuN4",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "jaishreedryfruits-973dd.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "jaishreedryfruits-973dd",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "jaishreedryfruits-973dd.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "341935442574",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:341935442574:web:9b46c9578302e20db357df",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-FQ4730WZ17",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
