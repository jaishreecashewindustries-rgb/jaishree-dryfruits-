import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const createUserDoc = async (firebaseUser, extraData = {}) => {
    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || extraData.name || "",
        photoURL: firebaseUser.photoURL || "",
        phone: "",
        role: "customer",
        address: {},
        wishlist: [],
        loyaltyPoints: 0,
        createdAt: serverTimestamp(),
        ...extraData,
      });
    }
    const updated = await getDoc(ref);
    return updated.data();
  };

  const loginWithEmail = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    toast.success("Welcome back!");
    return res;
  };

  const registerWithEmail = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: name });
    await createUserDoc(res.user, { displayName: name });
    toast.success("Account created successfully!");
    return res;
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    await createUserDoc(res.user);
    toast.success(`Welcome, ${res.user.displayName}!`);
    return res;
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    toast.success("Logged out successfully");
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
    toast.success("Password reset email sent!");
  };

  // ── Phone OTP ──────────────────────────────────────────────────────────
  const recaptchaVerifierRef = useRef(null);
  const confirmationResultRef = useRef(null);

  const sendPhoneOTP = async (phoneNumber) => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    }
    confirmationResultRef.current = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
  };

  const verifyPhoneOTP = async (code) => {
    if (!confirmationResultRef.current) {
      throw new Error("Your OTP session expired — please request a new code");
    }
    const res = await confirmationResultRef.current.confirm(code);
    await createUserDoc(res.user, { phone: res.user.phoneNumber || "" });
    toast.success("Phone verified — welcome!");
    return res;
  };

  const isAdmin = userProfile?.role === "admin";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await createUserDoc(firebaseUser);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        sendPhoneOTP,
        verifyPhoneOTP,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
