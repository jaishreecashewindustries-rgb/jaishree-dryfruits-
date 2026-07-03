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
  signInWithCustomToken,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";
import toast from "react-hot-toast";

// Same Cloud Functions backend used by Checkout.jsx/Footer.jsx.
const FUNCTIONS_BASE_URL =
  process.env.REACT_APP_FUNCTIONS_BASE_URL ||
  "http://127.0.0.1:5001/jaishreedryfruits-973dd/asia-south1";

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
      const name = firebaseUser.displayName || extraData.name || "";
      await setDoc(ref, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name,
        photoURL: firebaseUser.photoURL || "",
        phone: "",
        role: "customer",
        address: {},
        wishlist: [],
        loyaltyPoints: 0,
        createdAt: serverTimestamp(),
        ...extraData,
      });
      // Best-effort — never block account creation on the welcome email.
      if (firebaseUser.email) {
        fetch(`${FUNCTIONS_BASE_URL}/sendTemplatedEmail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: firebaseUser.email, toName: name, template: "welcome", data: { name: name || "there" } }),
        }).catch(() => {});
        // Welcome coupon — sent as a separate email a moment later rather than
        // crammed into the welcome email, so each message stays focused.
        fetch(`${FUNCTIONS_BASE_URL}/sendTemplatedEmail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: firebaseUser.email,
            toName: name,
            template: "coupon",
            data: { name: name || "there", code: "WELCOME15", discountText: "15% OFF your first order", minOrder: 299 },
          }),
        }).catch(() => {});
      }
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

  // ── Email OTP — passwordless login + OTP-based password reset ──
  // Backed by Cloud Functions (sendEmailOTP/verifyEmailOTP in functions/index.js),
  // not Firebase Auth's built-in email-link flow — a 6-digit code the user
  // types back in, matching the phone-OTP UX already on this page.
  const sendEmailOTP = async (email, purpose) => {
    const res = await fetch(`${FUNCTIONS_BASE_URL}/sendEmailOTP`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not send verification code");
  };

  const verifyEmailOTPLogin = async (email, code) => {
    const res = await fetch(`${FUNCTIONS_BASE_URL}/verifyEmailOTP`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, purpose: "login" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Invalid code");
    await signInWithCustomToken(auth, data.token);
    toast.success("Welcome back!");
  };

  const verifyEmailOTPReset = async (email, code, newPassword) => {
    const res = await fetch(`${FUNCTIONS_BASE_URL}/verifyEmailOTP`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, purpose: "reset", newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Invalid code");
    toast.success("Password updated — sign in with your new password.");
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
        sendEmailOTP,
        verifyEmailOTPLogin,
        verifyEmailOTPReset,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
