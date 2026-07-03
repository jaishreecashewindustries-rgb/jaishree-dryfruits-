import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { CheckCircle, ChevronRight, Lock, Package, CreditCard, Banknote, MapPin, Loader2, AlertCircle, CheckCircle2, ShoppingCart, ChevronDown, Tag, Coins, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db, verifyAuth } from "../firebase/config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import emailjs from "@emailjs/browser";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useCoins, COINS_RULES } from "../context/CoinsContext";
import { formatPrice } from "../utils/helpers";
import toast from "react-hot-toast";

const STEPS = ["Address", "Payment", "Confirm"];

// Fallback hardcoded coupons (used if Firestore is empty) — mirrors Cart.jsx
const FALLBACK_COUPONS = [
  { code: "WELCOME15", type: "percent", value: 15, minOrder: 299, maxUses: 1 },
  { code: "CASHEW10",  type: "percent", value: 10, minOrder: 199, maxUses: null },
  { code: "MONSOON20", type: "percent", value: 20, minOrder: 499, maxUses: null },
  { code: "FLAT50",    type: "flat",    value: 50, minOrder: 499, maxUses: null },
];

const PAY_METHODS = [
  { id: "razorpay", label: "UPI / Cards / Net Banking", desc: "Powered by Razorpay — GPay, PhonePe, Visa, Mastercard, EMI", Icon: CreditCard },
  { id: "cod",      label: "Cash on Delivery",          desc: "Pay ₹0 now, pay when your order arrives at your door",    Icon: Banknote },
];

// ── India Post Pincode API (free, no API key needed) ──
async function lookupPincode(pin) {
  if (pin.length !== 6 || !/^\d{6}$/.test(pin)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return { city: po.District, state: po.State };
    }
    return null;
  } catch {
    return null;
  }
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar","Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Delhi","Jammu & Kashmir",
  "Ladakh","Lakshadweep","Puducherry",
];

export default function Checkout() {
  const location = useLocation();
  const {
    discount: discountFromCart = 0,
    appliedCoupon: couponFromCart = null,
    coinsDiscount: coinsDiscountFromCart = 0,
    coinsRedeemed: coinsRedeemedFromCart = 0,
  } = location.state || {};

  const [step, setStep] = useState(0);
  const [gstinOpen, setGstinOpen] = useState(false);
  const [gstinData, setGstinData] = useState({ company: "", gstin: "" });
  const [gstinError, setGstinError] = useState("");
  const [address, setAddress] = useState({
    name: "", email: "", phone: "", address: "", landmark: "",
    city: "", state: "", pincode: "", country: "India",
  });
  const [pinLoading, setPinLoading] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [payMethod, setPayMethod] = useState("razorpay");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Phone OTP verification — uses a secondary Firebase Auth instance so it
  // never disturbs an already-logged-in user's session
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const recaptchaVerifierRef = useRef(null);
  const confirmationResultRef = useRef(null);

  // Coupon — applicable directly from Checkout, pre-filled if already applied on Cart
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(couponFromCart);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState(FALLBACK_COUPONS);

  // Show customers which coupons they can use right now
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "coupons"), where("active", "==", true)));
        if (!snap.empty) {
          setAvailableCoupons(snap.docs.map((d) => {
            const data = d.data();
            return { code: data.code, type: data.discountType || "percent", value: data.discountValue || data.discount || 10, minOrder: data.minOrder || 0 };
          }));
        }
      } catch {
        // keep fallback coupons
      }
    })();
  }, []);

  // JS Coins — applicable directly from Checkout, pre-filled if already applied on Cart
  const [coinsApplied, setCoinsApplied] = useState(coinsRedeemedFromCart > 0);
  const [coinsDiscount, setCoinsDiscount] = useState(coinsDiscountFromCart);
  const [coinsRedeemed, setCoinsRedeemed] = useState(coinsRedeemedFromCart);
  const [coinsLoading, setCoinsLoading] = useState(false);

  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const { coins, coinsWorth, earnCoinsForOrder, redeemCoins } = useCoins();

  const discount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.floor(subtotal * appliedCoupon.value / 100)
      : appliedCoupon.value
    : discountFromCart;

  const coinsUnlocked = subtotal >= COINS_RULES.minCartValue && !appliedCoupon && !!user && (coins || 0) >= COINS_RULES.minRedeem;
  const maxCoinsToRedeem = Math.min(coins || 0, Math.ceil(COINS_RULES.maxRedeemValue / COINS_RULES.redeemRate));
  const coinsPotentialValue = parseFloat((maxCoinsToRedeem * COINS_RULES.redeemRate).toFixed(2));

  const handleApplyCoupon = async (codeOverride) => {
    const code = (codeOverride ?? couponInput).trim().toUpperCase();
    if (!code) return;
    if (appliedCoupon) { toast.error("Remove current coupon first"); return; }
    setCouponLoading(true);
    try {
      const q = query(collection(db, "coupons"), where("code", "==", code), where("active", "==", true));
      const snap = await getDocs(q);
      let coupon = null;
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (data.expiry && new Date(data.expiry) < new Date()) {
          toast.error("This coupon has expired"); setCouponLoading(false); return;
        }
        if (data.maxUses && (data.usedCount || 0) >= data.maxUses) {
          toast.error("This coupon has reached its usage limit"); setCouponLoading(false); return;
        }
        coupon = { code: data.code, type: data.discountType || "percent", value: data.discountValue || data.discount || 10, minOrder: data.minOrder || 0 };
      } else {
        coupon = FALLBACK_COUPONS.find(c => c.code === code) || null;
      }
      if (!coupon) { toast.error("Invalid coupon code"); setCouponLoading(false); return; }
      if (subtotal < coupon.minOrder) { toast.error(`Minimum order ₹${coupon.minOrder} required for this coupon`); setCouponLoading(false); return; }
      setAppliedCoupon(coupon);
      toast.success(`Coupon applied — ${coupon.type === "percent" ? `${coupon.value}% off` : `₹${coupon.value} off`}!`);
    } catch {
      const coupon = FALLBACK_COUPONS.find(c => c.code === code);
      if (coupon) {
        if (subtotal < coupon.minOrder) toast.error(`Minimum order ₹${coupon.minOrder} required`);
        else { setAppliedCoupon(coupon); toast.success(`Coupon applied — ${coupon.value}${coupon.type === "percent" ? "%" : "₹"} off!`); }
      } else {
        toast.error("Invalid coupon code");
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponInput(""); toast("Coupon removed"); };

  const handleApplyCoins = async () => {
    if (!coinsUnlocked || coinsApplied) return;
    setCoinsLoading(true);
    const result = await redeemCoins(maxCoinsToRedeem);
    if (result?.success) {
      setCoinsApplied(true);
      setCoinsDiscount(result.discount);
      setCoinsRedeemed(result.coinsUsed);
      toast.success(`${result.coinsUsed} JS Coins applied — ₹${result.discount} off!`);
    } else {
      toast.error(result?.message || "Could not apply coins");
    }
    setCoinsLoading(false);
  };

  const handleRemoveCoins = () => { setCoinsApplied(false); setCoinsDiscount(0); setCoinsRedeemed(0); toast("JS Coins removed"); };

  const finalTotal = Math.max(0, total - discount - coinsDiscount);

  const handleAddr = async (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: "" }));

    // Changing the phone number invalidates any previous OTP verification
    if (name === "phone") {
      setPhoneVerified(false);
      setOtpSent(false);
      setOtp(["", "", "", "", "", ""]);
    }

    // Pincode auto-fill
    if (name === "pincode") {
      setPinVerified(false);
      setPinError("");
      if (value.length === 6 && /^\d{6}$/.test(value)) {
        setPinLoading(true);
        const result = await lookupPincode(value);
        setPinLoading(false);
        if (result) {
          setAddress(prev => ({ ...prev, city: result.city, state: result.state }));
          setPinVerified(true);
          toast.success(`Pincode verified — ${result.city}, ${result.state}`);
        } else {
          setPinError("Invalid PIN code or not serviceable. Please check.");
        }
      }
    }
  };

  const handleSendCheckoutOTP = async () => {
    const digits = address.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setFieldErrors(prev => ({ ...prev, phone: "Enter a valid 10-digit Indian mobile number" }));
      return;
    }
    setOtpLoading(true);
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(verifyAuth, "checkout-recaptcha-container", { size: "invisible" });
      }
      confirmationResultRef.current = await signInWithPhoneNumber(verifyAuth, `+91${digits}`, recaptchaVerifierRef.current);
      setOtpSent(true);
      toast.success("OTP sent to your mobile number");
    } catch (err) {
      toast.error(err.message?.replace("Firebase: ", "").split(" (auth/")[0] || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`checkout-otp-${i + 1}`)?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`checkout-otp-${i - 1}`)?.focus();
  };

  const handleVerifyCheckoutOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setOtpLoading(true);
    try {
      await confirmationResultRef.current.confirm(code);
      // Discard this throwaway session immediately — it only existed to
      // prove the customer has access to this number, not to log them in.
      await verifyAuth.signOut();
      setPhoneVerified(true);
      setVerifiedPhone(address.phone.replace(/\D/g, ""));
      toast.success("Phone number verified!");
    } catch (err) {
      toast.error(err.message?.replace("Firebase: ", "").split(" (auth/")[0] || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setOtpLoading(false);
    }
  };

  const validateAddress = () => {
    const errors = {};
    if (!address.name.trim()) errors.name = "Full name is required";
    if (!address.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\s/g, ""))) errors.phone = "Enter a valid 10-digit Indian mobile number";
    else if (!phoneVerified || verifiedPhone !== address.phone.replace(/\D/g, "")) errors.phone = "Please verify your mobile number with OTP";
    if (user === null && !address.email.trim()) errors.email = "Email is required for order updates";
    else if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) errors.email = "Enter a valid email address";
    if (!address.address.trim()) errors.address = "Street address is required";
    if (!address.city.trim()) errors.city = "City is required";
    if (!address.state.trim()) errors.state = "State is required";
    if (!address.pincode.trim()) errors.pincode = "PIN code is required";
    else if (!/^\d{6}$/.test(address.pincode)) errors.pincode = "PIN code must be 6 digits";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveOrder = async (paymentId = null) => {
    const order = {
      userId: user?.uid || "guest",
      userEmail: user?.email || address.email || "",
      customerName: address.name,
      customerPhone: address.phone,
      items: items.map(i => ({ id: i.id, name: i.name, variant: i.variant, qty: i.qty, price: i.price, image: i.image })),
      address,
      paymentMethod: payMethod,
      paymentId: paymentId || null,
      coupon: appliedCoupon || null,
      discount,
      coinsRedeemed: coinsRedeemed || 0,
      coinsDiscount: coinsDiscount || 0,
      subtotal,
      shipping,
      total: finalTotal,
      status: paymentId ? "confirmed" : "pending",
      gstin: gstinData.gstin.trim() || null,
      gstinCompany: gstinData.company.trim() || null,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, "orders"), order);
    return ref.id;
  };

  // Sent client-side via EmailJS — no Cloud Functions/Eventarc involved,
  // so it isn't affected by the asia-south1 Firestore-trigger region
  // limitation. Template variables match the EmailJS "Order Confirmation"
  // template: email, order_id, orders[] (name/units/price), cost.shipping/tax
  const sendOrderConfirmationEmail = async (orderId, paymentId) => {
    const to = address.email || user?.email;
    if (!to) return;
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) return;
    try {
      await emailjs.send(serviceId, templateId, {
        email: to,
        to_name: address.name,
        order_id: orderId.slice(0, 8).toUpperCase(),
        orders: items.map(i => ({ name: `${i.name} (${i.variant})`, units: i.qty, price: i.price * i.qty })),
        cost: { shipping: shipping || 0, tax: 0 },
        order_total: finalTotal,
        shipping_address: `${address.address}, ${address.city}, ${address.state} - ${address.pincode}`,
        payment_status: paymentId ? "Paid and confirmed" : "Placed (Cash on Delivery)",
      }, { publicKey });
    } catch (err) {
      console.warn("Order confirmation email failed:", err);
      // non-critical — never block checkout on email failure
    }
  };

  // Ad platform conversion signal, fired once per successful order (both COD
  // and Razorpay paths) — call before clearCart() empties `items`.
  const trackPurchase = (oid) => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "Purchase", {
        content_ids: items.map((i) => i.id),
        value: finalTotal,
        currency: "INR",
      });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "purchase", {
        transaction_id: oid,
        value: finalTotal,
        currency: "INR",
        items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })),
      });
    }
  };

  const handleRazorpay = () => {
    const key = process.env.REACT_APP_RAZORPAY_KEY;
    if (!key || key.includes("REPLACE")) {
      toast.error("Payment gateway not configured. Please use Cash on Delivery.", { duration: 4000 });
      return;
    }
    const options = {
      key,
      amount: finalTotal * 100,
      currency: "INR",
      name: "Jai Shree Dry Fruits",
      description: `Order — ${items.length} item${items.length > 1 ? "s" : ""}`,
      image: "/logo.png",
      prefill: { name: address.name, contact: address.phone, email: user?.email || address.email || "" },
      notes: { address: `${address.address}, ${address.city}, ${address.state} - ${address.pincode}`, coupon: appliedCoupon || "none" },
      theme: { color: "#C9A84C" },
      handler: async (response) => {
        setLoading(true);
        try {
          const oid = await saveOrder(response.razorpay_payment_id);
          await earnCoinsForOrder(finalTotal);
          setCoinsEarned(Math.floor(finalTotal));
          setOrderId(oid);
          trackPurchase(oid);
          clearCart();
          sendOrderConfirmationEmail(oid, response.razorpay_payment_id);
          setStep(3);
        } catch (err) {
          toast.error("Order save failed. Contact support with payment ID: " + response.razorpay_payment_id);
        } finally {
          setLoading(false);
        }
      },
      modal: { ondismiss: () => toast("Payment cancelled. Try again anytime.") },
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (r) => toast.error("Payment failed: " + (r.error?.description || "Try again")));
      rzp.open();
    } catch {
      toast.error("Payment gateway unavailable. Please use Cash on Delivery.");
    }
  };

  const handlePlaceOrder = async () => {
    if (payMethod === "razorpay") { handleRazorpay(); return; }
    setLoading(true);
    try {
      const oid = await saveOrder();
      await earnCoinsForOrder(finalTotal);
      setCoinsEarned(Math.floor(finalTotal));
      setOrderId(oid);
      trackPurchase(oid);
      clearCart();
      sendOrderConfirmationEmail(oid, null);
      setStep(3);
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (step === 3) {
    const customerWAText = encodeURIComponent(
      `Hi! Your order #${orderId?.slice(0, 8).toUpperCase()} has been placed successfully with Jai Shree Dryfruits 🎉\n\nItems: ${items.map((i) => `${i.name} (${i.variant}) × ${i.qty}`).join(", ")}\nTotal: ₹${finalTotal}\n\nExpected delivery: 3–5 business days. We'll send you tracking details soon.\n\nThank you for shopping with us! 🌰`
    );

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-brand-cream/30 flex items-start justify-center px-4 py-12">
        <div className="max-w-xl w-full">

          {/* Success card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Top band */}
            <div className="px-8 py-10 text-center"
              style={{ background: "linear-gradient(160deg, #0D1B35, #1A2744)" }}>
              <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center rounded-full"
                style={{ background: "rgba(201,168,76,0.15)", border: "2px solid rgba(201,168,76,0.4)" }}>
                <CheckCircle size={36} className="text-brand-gold" />
              </div>
              <h1 className="font-serif text-3xl font-normal text-white mb-2">Order Confirmed!</h1>
              <p className="text-white/60 text-sm">Thank you, {address.name.split(" ")[0]}. Your order is placed.</p>
              <div className="inline-block mt-3 font-mono text-xs text-brand-gold bg-white/10 border border-brand-gold/30 px-4 py-1.5 rounded-lg">
                #{orderId?.slice(0, 8).toUpperCase()}
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-5">

              {/* Coins earned */}
              {coinsEarned > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: "linear-gradient(135deg, #FDF8EC, #FFF9E6)", border: "1px solid rgba(201,168,76,0.25)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #C9A84C, #9E7A2E)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 6v2m0 8v2M9.5 9.5c0-1.1.9-2 2.5-2s2.5.9 2.5 2-1 1.5-2.5 2-2.5.9-2.5 2 .9 2 2.5 2 2.5-.9 2.5-2"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-brand-brown text-sm">You earned {coinsEarned} JS Coins!</p>
                    <p className="text-xs text-gray-500 mt-0.5">Worth <span className="font-semibold text-brand-gold">₹{parseFloat((coinsEarned * 0.025).toFixed(2))} off</span> your next order</p>
                  </div>
                </div>
              )}

              {/* Order items */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Items Ordered</p>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-brown truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.variant} × {item.qty}</p>
                    </div>
                    <p className="text-sm font-bold text-brand-gold flex-shrink-0">{formatPrice(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              {/* Delivery info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Delivering to</p>
                  <p className="text-xs font-semibold text-brand-brown">{address.name}</p>
                  <p className="text-xs text-gray-500">{address.city}, {address.state}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expected delivery</p>
                  <p className="text-xs font-semibold text-brand-brown">3–5 business days</p>
                  <p className="text-xs text-gray-500">{payMethod === "cod" ? "Cash on Delivery" : "Prepaid (Online)"}</p>
                </div>
              </div>

              {/* WhatsApp confirmation to customer */}
              <div className="p-4 rounded-2xl border border-green-100 bg-green-50/50">
                <p className="text-xs text-green-700 font-semibold mb-1">📱 Get confirmation on WhatsApp</p>
                <p className="text-xs text-green-600 mb-3">Save your order details directly to your WhatsApp for easy reference.</p>
                <a
                  href={`https://wa.me/917568577968?text=${customerWAText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 text-white text-xs font-semibold py-2.5 rounded-xl w-full transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  Send Order Details to WhatsApp
                </a>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Link to="/dashboard" className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-sm">
                  <Package size={15} /> Track Order
                </Link>
                <Link to="/products" className="flex-1 btn-outline flex items-center justify-center gap-2 py-3 text-sm">
                  Shop More
                </Link>
              </div>

              <p className="text-center text-xs text-gray-400">
                Questions? WhatsApp us at <a href="https://wa.me/917568577968" className="text-brand-gold font-semibold">+91 75685 77968</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Your cart is empty</p>
          <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen pb-28 md:pb-10">
      <h1 className="font-serif text-3xl font-normal text-brand-brown mb-8">Checkout</h1>

      {/* Progress */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i <= step ? "text-brand-gold" : "text-gray-300"}`}>
              <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold border-2 transition-all
                ${i < step ? "bg-brand-gold border-brand-gold text-white"
                : i === step ? "border-brand-gold text-brand-gold bg-white"
                : "border-gray-200 text-gray-300 bg-white"}`}>
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden md:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${i < step ? "bg-brand-gold" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
        <AnimatePresence mode="wait">

          {/* ── Step 0: Address ── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="card-luxury p-6">
              <h2 className="font-serif text-xl font-normal text-brand-brown mb-6">Delivery Address</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Full Name — Required */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input name="name" value={address.name} onChange={handleAddr}
                    placeholder="As on Aadhaar / delivery note"
                    className={`input-field ${fieldErrors.name ? "border-red-400" : ""}`} />
                  {fieldErrors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.name}</p>}
                </div>

                {/* Phone — Required, OTP-verified */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                      <input name="phone" value={address.phone} onChange={handleAddr}
                        type="tel" maxLength={10} placeholder="10-digit mobile"
                        disabled={phoneVerified}
                        className={`input-field pl-10 ${fieldErrors.phone ? "border-red-400" : ""} ${phoneVerified ? "bg-green-50" : ""}`} />
                    </div>
                    {phoneVerified ? (
                      <span className="flex items-center gap-1.5 px-3 text-xs font-semibold text-green-600 whitespace-nowrap">
                        <ShieldCheck size={15} /> Verified
                      </span>
                    ) : !otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendCheckoutOTP}
                        disabled={otpLoading || !/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, ""))}
                        className="btn-outline text-xs px-4 whitespace-nowrap disabled:opacity-40"
                      >
                        {otpLoading ? "Sending..." : "Send OTP"}
                      </button>
                    ) : null}
                  </div>
                  {fieldErrors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.phone}</p>}

                  {otpSent && !phoneVerified && (
                    <div className="mt-3 p-3 bg-brand-cream/60 rounded-xl">
                      <p className="text-xs text-gray-600 mb-2">Enter the 6-digit OTP sent to +91{address.phone}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          {otp.map((d, i) => (
                            <input
                              key={i}
                              id={`checkout-otp-${i}`}
                              value={d}
                              onChange={(e) => handleOtpDigit(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              maxLength={1}
                              inputMode="numeric"
                              className="w-9 h-10 text-center border border-gray-200 rounded-lg text-sm font-semibold focus:border-brand-gold focus:outline-none"
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleVerifyCheckoutOTP}
                          disabled={otpLoading || otp.join("").length !== 6}
                          className="btn-primary text-xs px-4 py-2.5 whitespace-nowrap disabled:opacity-40"
                        >
                          {otpLoading ? "..." : "Verify"}
                        </button>
                      </div>
                      <button type="button" onClick={handleSendCheckoutOTP} disabled={otpLoading} className="text-[11px] text-brand-gold hover:underline mt-2">
                        Resend OTP
                      </button>
                    </div>
                  )}
                </div>
                <div id="checkout-recaptcha-container" />

                {/* Email — Required for guests, optional for logged in */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Email {!user && <span className="text-red-400">*</span>}
                    {user && <span className="text-gray-400 font-normal">(optional)</span>}
                  </label>
                  <input name="email" value={user ? (user.email || address.email) : address.email}
                    onChange={handleAddr} type="email"
                    disabled={!!user?.email}
                    placeholder={user?.email || "For order updates"}
                    className={`input-field ${user?.email ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""} ${fieldErrors.email ? "border-red-400" : ""}`} />
                  {fieldErrors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.email}</p>}
                </div>

                {/* Street Address — Required */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Flat / House / Street <span className="text-red-400">*</span>
                  </label>
                  <input name="address" value={address.address} onChange={handleAddr}
                    placeholder="House no., building, street name"
                    className={`input-field ${fieldErrors.address ? "border-red-400" : ""}`} />
                  {fieldErrors.address && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.address}</p>}
                </div>

                {/* Landmark — Optional */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Landmark <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input name="landmark" value={address.landmark} onChange={handleAddr}
                    placeholder="Near temple, school, mall etc."
                    className="input-field" />
                </div>

                {/* PIN Code — Required, triggers auto-fill */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    PIN Code <span className="text-red-400">*</span>
                    <span className="text-gray-400 font-normal ml-1">(auto-fills city & state)</span>
                  </label>
                  <div className="relative">
                    <input name="pincode" value={address.pincode} onChange={handleAddr}
                      type="text" maxLength={6} placeholder="6-digit PIN"
                      className={`input-field pr-10 ${pinError ? "border-red-400" : pinVerified ? "border-green-400" : ""} ${fieldErrors.pincode ? "border-red-400" : ""}`} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {pinLoading && <Loader2 size={14} className="animate-spin text-brand-gold" />}
                      {!pinLoading && pinVerified && <CheckCircle2 size={14} className="text-green-500" />}
                      {!pinLoading && pinError && <AlertCircle size={14} className="text-red-400" />}
                      {!pinLoading && !pinVerified && !pinError && address.pincode.length > 0 && <MapPin size={14} className="text-gray-300" />}
                    </div>
                  </div>
                  {pinError && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{pinError}</p>}
                  {pinVerified && <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={11} />Pincode verified</p>}
                  {(fieldErrors.pincode && !pinError) && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.pincode}</p>}
                </div>

                {/* City — Required, auto-filled */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    City / District <span className="text-red-400">*</span>
                  </label>
                  <input name="city" value={address.city} onChange={handleAddr}
                    placeholder="Auto-filled from PIN"
                    className={`input-field ${fieldErrors.city ? "border-red-400" : ""}`} />
                  {fieldErrors.city && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.city}</p>}
                </div>

                {/* State — Required, auto-filled, also a dropdown */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    State <span className="text-red-400">*</span>
                  </label>
                  <select name="state" value={address.state} onChange={handleAddr}
                    className={`input-field bg-white ${fieldErrors.state ? "border-red-400" : ""}`}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {fieldErrors.state && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.state}</p>}
                </div>

                {/* Country — Fixed */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Country</label>
                  <input name="country" value="India" disabled
                    className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 flex items-start gap-2">
                <MapPin size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600">
                  Enter your 6-digit PIN code — city and state will auto-fill. We deliver pan-India via Delhivery & Shiprocket.
                </p>
              </div>

              {/* ── GSTIN Accordion ── */}
              <div className="mt-5 border border-gray-100 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setGstinOpen(o => !o)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-brand-cream/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-brown">Register Corporate GSTIN for Tax Credit</p>
                    <p className="text-xs text-gray-400 mt-0.5">Optional — for ITC-eligible corporate purchases</p>
                  </div>
                  <ChevronDown
                    size={16}
                    className="text-brand-gold flex-shrink-0 transition-transform duration-300"
                    style={{ transform: gstinOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {gstinOpen && (
                  <div className="px-5 pb-6 pt-2 bg-[#FDFAF3]">
                    <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                      Your GSTIN will be printed on the tax invoice. Input Tax Credit (ITC) will be
                      claimable against GSTIN <span className="font-semibold text-brand-brown">08AAACJ0240A1ZH</span> (Jai Shree Dryfruits, Jaipur).
                    </p>
                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                          Legal Company Name
                        </label>
                        <input
                          className="gstin-input"
                          placeholder="As registered with the GST Council"
                          value={gstinData.company}
                          onChange={e => {
                            setGstinData(d => ({ ...d, company: e.target.value }));
                            setGstinError("");
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                          15-Digit GSTIN
                        </label>
                        <input
                          className="gstin-input"
                          placeholder="e.g. 27AADCB2230M1ZT"
                          maxLength={15}
                          value={gstinData.gstin}
                          onChange={e => {
                            const val = e.target.value.toUpperCase();
                            setGstinData(d => ({ ...d, gstin: val }));
                            if (val.length > 0 && val.length < 15) setGstinError("GSTIN must be exactly 15 characters");
                            else if (val.length === 15 && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val)) setGstinError("Invalid GSTIN format");
                            else setGstinError("");
                          }}
                        />
                        {gstinError && (
                          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle size={11} /> {gstinError}
                          </p>
                        )}
                        {gstinData.gstin.length === 15 && !gstinError && (
                          <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Valid GSTIN format
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => { if (validateAddress()) setStep(1); }}
                className="btn-primary mt-6 flex items-center gap-2">
                Continue to Payment <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ── Step 1: Payment ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="card-luxury p-6">
              <h2 className="font-serif text-xl font-normal text-brand-brown mb-5">Payment Method</h2>
              <div className="space-y-3">
                {PAY_METHODS.map((m) => (
                  <label key={m.id}
                    className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all ${payMethod === m.id ? "border-brand-gold bg-amber-50/20" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="pay" value={m.id} checked={payMethod === m.id}
                      onChange={() => setPayMethod(m.id)} className="accent-brand-gold" />
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}>
                      <m.Icon size={16} className="text-brand-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-brown text-sm">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </div>
                    {m.id === "razorpay" && (
                      <span className="ml-auto text-xs font-bold text-brand-gold border border-brand-gold/30 px-2 py-0.5">RECOMMENDED</span>
                    )}
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 border border-gray-100">
                <Lock size={12} className="text-gray-400" />
                <p className="text-xs text-gray-400">All payments are 256-bit SSL encrypted via Razorpay — PCI-DSS Level 1</p>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(0)} className="btn-outline">← Back</button>
                <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                  Review Order <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Review & Place Order ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="card-luxury p-6">
              <h2 className="font-serif text-xl font-normal text-brand-brown mb-5">Review Your Order</h2>
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={`${item.id}-${item.variantId}`} className="flex gap-3 bg-gray-50 p-3 border border-gray-100">
                    <img src={item.image} alt="" className="w-14 h-14 object-cover flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-brown">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.variant} × {item.qty}</p>
                    </div>
                    <p className="font-bold text-brand-gold text-sm whitespace-nowrap">{formatPrice(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              {/* Address summary */}
              <div className="bg-brand-cream p-4 mb-4 border border-gray-100">
                <p className="text-xs font-bold text-brand-brown uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin size={11} className="text-brand-gold" /> Delivering To
                </p>
                <p className="text-sm text-gray-700 font-medium">{address.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{address.phone}</p>
                <p className="text-xs text-gray-500 mt-0.5">{address.address}{address.landmark ? `, ${address.landmark}` : ""}</p>
                <p className="text-xs text-gray-500">{address.city}, {address.state} — {address.pincode}</p>
              </div>

              {/* Payment method summary */}
              <div className="bg-gray-50 p-3 mb-5 border border-gray-100 flex items-center gap-3">
                <CreditCard size={14} className="text-brand-gold" />
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-brand-brown">Payment:</span>&nbsp;
                  {payMethod === "razorpay" ? "UPI / Card / Net Banking (Razorpay)" : "Cash on Delivery"}
                </p>
                <button onClick={() => setStep(1)} className="ml-auto text-xs text-brand-gold hover:underline">Change</button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline">← Back</button>
                <button onClick={handlePlaceOrder} disabled={loading}
                  className="btn-primary flex items-center gap-2 flex-1 justify-center">
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Processing...</>
                    : <><Lock size={15} /> {payMethod === "razorpay" ? "Pay" : "Place Order"} — {formatPrice(finalTotal)}</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* ── Order Summary Sidebar ── */}
        <div className="card-luxury p-5 h-fit sticky top-24">
          <h3 className="font-serif font-normal text-brand-brown mb-4 text-base border-b border-gray-100 pb-3">Order Summary</h3>

          {/* Coupon */}
          <div className="mb-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 rounded-lg text-xs">
                <span className="flex items-center gap-1.5 text-green-700 font-semibold">
                  <Tag size={12} /> {appliedCoupon.code} applied
                </span>
                <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-red-500"><X size={13} /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Coupon code"
                  className="input-field flex-1 text-xs py-2"
                />
                <button onClick={() => handleApplyCoupon()} disabled={couponLoading || !couponInput.trim()} className="btn-outline text-xs px-3 py-2 whitespace-nowrap disabled:opacity-50">
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>
            )}

            {/* Available coupons — tap to auto-fill & apply */}
            {!appliedCoupon && availableCoupons.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {availableCoupons.map((c) => {
                  const eligible = subtotal >= c.minOrder;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      disabled={!eligible || couponLoading}
                      onClick={() => { setCouponInput(c.code); handleApplyCoupon(c.code); }}
                      className={`w-full flex items-center justify-between border border-dashed rounded-lg px-3 py-2 text-left transition-colors ${
                        eligible
                          ? "border-brand-gold/40 bg-brand-cream/50 hover:bg-brand-cream cursor-pointer"
                          : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold text-brand-brown">
                        <Tag size={11} className="text-brand-gold" /> {c.code}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                        {c.minOrder > 0 ? ` · min ₹${c.minOrder}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* JS Coins */}
          {user && (
            <div className="mb-4">
              {coinsApplied ? (
                <div className="flex items-center justify-between bg-amber-50 border border-brand-gold/30 px-3 py-2 rounded-lg text-xs">
                  <span className="flex items-center gap-1.5 text-brand-gold font-semibold">
                    <Coins size={12} /> {coinsRedeemed} JS Coins applied
                  </span>
                  <button onClick={handleRemoveCoins} className="text-brand-gold hover:text-red-500"><X size={13} /></button>
                </div>
              ) : coinsUnlocked ? (
                <button
                  onClick={handleApplyCoins}
                  disabled={coinsLoading}
                  className="w-full flex items-center justify-between bg-amber-50 border border-brand-gold/30 px-3 py-2 rounded-lg text-xs hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <span className="flex items-center gap-1.5 text-brand-gold font-semibold">
                    <Coins size={12} /> {coinsLoading ? "Applying..." : `Use ${maxCoinsToRedeem} Coins — Save ₹${coinsPotentialValue}`}
                  </span>
                </button>
              ) : (
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Coins size={11} /> You have {coins || 0} JS Coins (worth ₹{coinsWorth || 0}) — {appliedCoupon ? "remove coupon to use coins" : `min ₹${COINS_RULES.minCartValue} cart & ${COINS_RULES.minRedeem} coins required to redeem`}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={`${item.id}-${item.variantId}`} className="flex justify-between text-gray-500">
                <span className="truncate pr-2">{item.name} × {item.qty}</span>
                <span className="flex-shrink-0">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-gray-600 mt-2">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Coupon ({appliedCoupon?.code})</span>
                <span>− {formatPrice(discount)}</span>
              </div>
            )}
            {coinsDiscount > 0 && (
              <div className="flex justify-between text-brand-gold font-medium">
                <span>JS Coins</span>
                <span>− {formatPrice(coinsDiscount)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-brand-brown text-base mt-1">
              <span>Total</span><span>{formatPrice(finalTotal)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
            <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={11} /> Earn {Math.floor(finalTotal)} JS Coins on this order
            </p>
            <p className="text-xs text-gray-400 flex items-start gap-1.5">
              <Lock size={11} className="flex-shrink-0 mt-0.5 text-brand-gold" />
              Secured by Razorpay. Card details never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
