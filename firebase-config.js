// ============================================================
// PURE NUTS — Firebase Configuration
// ============================================================
// Sirf yahan apna Firebase config paste karo
// Firebase Console → Project Settings → Your Apps → Web App
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Admin email — jo email Firebase Auth mein register karoge
const ADMIN_EMAIL = "admin@purenuts.com";

// Razorpay Key (baad mein add karo)
const RAZORPAY_KEY = "YOUR_RAZORPAY_KEY";

// WhatsApp number (orders ke liye)
const WHATSAPP_NUMBER = "919999999999";

// Free delivery threshold
const FREE_DELIVERY_ABOVE = 499;
const DELIVERY_CHARGE = 60;

// GST rate
const GST_RATE = 0; // dry fruits = 0% GST currently
