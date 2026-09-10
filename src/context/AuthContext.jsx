import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
            data: { name: name || "there", code: "WELCOME100", discountText: "₹100 OFF your first order", minOrder: 599 },
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

  // Turns a raw Firebase Auth error into something the user (and whoever's
  // debugging a report from them) can actually act on. Was previously only
  // done for the popup path — the redirect path (mobile/Safari) had no
  // try/catch at all, so any failure here (blocked storage, unauthorized
  // domain, private-browsing mode) surfaced as nothing happening rather
  // than an error, which is exactly the "randomly doesn't work" complaint.
  const explainGoogleSignInError = (err) => {
    console.error("Google sign-in error:", err.code, err.message);
    if (err.code === "auth/unauthorized-domain") {
      return `This domain (${window.location.hostname}) isn't authorized for Google sign-in yet — add it under Firebase Console → Authentication → Settings → Authorized domains.`;
    }
    if (err.code === "auth/web-storage-unsupported" || err.code === "auth/operation-not-supported-in-this-environment") {
      return "Google sign-in needs cookies/site storage enabled. If you're in Private Browsing mode, or have \"Prevent Cross-Site Tracking\" strictly blocking this site, please turn that off for this site and try again.";
    }
    if (err.code === "auth/network-request-failed") {
      return "Network error — please check your connection and try again.";
    }
    return err.message || "Google login failed. Please try again.";
  };

  // Always try the popup first, on every platform including mobile/Safari.
  //
  // This used to force redirect-only on mobile/Safari because
  // signInWithPopup's cross-window handshake ran through the default
  // *.firebaseapp.com auth domain, which Safari's Intelligent Tracking
  // Prevention treats as third-party and silently blocks — the popup would
  // open and just never resolve.
  //
  // Now that authDomain points at our own connected domain
  // (jaishreedryfruits.com — first-party), that specific problem is gone.
  // Popup is also the MORE reliable option on iOS Safari specifically:
  // signInWithRedirect requires the "a sign-in is pending" flag to survive
  // a full-page navigation away to accounts.google.com and back, and iOS
  // Safari is well known for dropping that state on the return trip —
  // symptom: redirects to Google, comes back, but never actually logs in,
  // with no error at all since nothing technically "failed". A popup never
  // navigates the main page away, so there's no round-trip state to lose.
  //
  // Redirect is kept only as the fallback for when a popup is genuinely
  // blocked or unsupported (e.g. an in-app WebView like WhatsApp/Instagram's
  // built-in browser, which Google itself refuses to sign in through
  // regardless of popup vs redirect — that shows Google's own
  // "this browser may not be secure" page and needs the user to open the
  // site in their actual browser app, not something we can code around).
  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await createUserDoc(res.user);
      toast.success(`Welcome, ${res.user.displayName}!`);
      return res;
    } catch (err) {
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/operation-not-supported-in-this-environment"
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (err2) {
          throw new Error(explainGoogleSignInError(err2));
        }
        return; // page navigates away; result is picked up by getRedirectResult on return
      }
      if (err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user") {
        return; // user closed it — not a real error, no toast needed
      }
      throw new Error(explainGoogleSignInError(err));
    }
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
    // Completes the redirect-based Google sign-in started in loginWithGoogle
    // on mobile — runs once on mount when the browser navigates back from
    // Google's auth page.
    getRedirectResult(auth)
      .then(async (res) => {
        if (res?.user) {
          await createUserDoc(res.user);
          toast.success(`Welcome, ${res.user.displayName}!`);
        }
      })
      .catch((err) => {
        if (err?.code && err.code !== "auth/no-current-user") {
          toast.error(explainGoogleSignInError(err), { duration: 6000 });
        }
      });
  }, []);

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
