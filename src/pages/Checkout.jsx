import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { CheckCircle, ChevronRight, Lock, Package, CreditCard, Banknote, MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useCoins } from "../context/CoinsContext";
import { formatPrice } from "../utils/helpers";
import toast from "react-hot-toast";

const ADMIN_WA = process.env.REACT_APP_ADMIN_WA || "917568577968";
const STEPS = ["Address", "Payment", "Confirm"];

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

function sendAdminWhatsApp({ orderId, customerName, phone, items, total, address, paymentMethod }) {
  const lines = [
    `*New Order — Jai Shree Dry Fruits*`,
    `Order ID: #${orderId.slice(0, 8).toUpperCase()}`,
    `Customer: ${customerName} (+91${phone.replace(/^0|^\+91/, "")})`,
    `Payment: ${paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}`,
    ``,
    `*Items:*`,
    ...items.map(i => `• ${i.name} (${i.variant}) × ${i.qty} — ₹${i.price * i.qty}`),
    ``,
    `Total: ₹${total}`,
    `Ship to: ${address.address}, ${address.city}, ${address.state} - ${address.pincode}`,
  ].join("\n");
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines)}`, "_blank");
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
  const { discount = 0, appliedCoupon = null } = location.state || {};

  const [step, setStep] = useState(0);
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

  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const { earnCoinsForOrder } = useCoins();

  const finalTotal = Math.max(0, total - discount);

  const handleAddr = async (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: "" }));

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

  const validateAddress = () => {
    const errors = {};
    if (!address.name.trim()) errors.name = "Full name is required";
    if (!address.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\s/g, ""))) errors.phone = "Enter a valid 10-digit Indian mobile number";
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
      subtotal,
      shipping,
      total: finalTotal,
      status: paymentId ? "confirmed" : "pending",
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, "orders"), order);
    return ref.id;
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
      image: "/logo192.png",
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
          clearCart();
          sendAdminWhatsApp({ orderId: oid, customerName: address.name, phone: address.phone, items, total: finalTotal, address, paymentMethod: "Online" });
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
      clearCart();
      sendAdminWhatsApp({ orderId: oid, customerName: address.name, phone: address.phone, items, total: finalTotal, address, paymentMethod: "COD" });
      setStep(3);
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1B2E4B, #243D63)" }}>
            <CheckCircle size={36} className="text-brand-gold" />
          </div>
          <h1 className="font-serif text-3xl font-normal text-brand-brown mb-2">Order Confirmed</h1>
          <div className="w-10 h-px mx-auto mb-4" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          <p className="text-gray-500 mb-1 text-sm">Thank you, {address.name}.</p>
          <p className="text-xs text-gray-400 mt-1 mb-5 font-mono bg-gray-50 px-3 py-1.5 inline-block border border-gray-200">
            Order ID: #{orderId?.slice(0, 8).toUpperCase()}
          </p>
          {coinsEarned > 0 && (
            <div className="mb-5 p-4 border border-brand-gold/30 bg-amber-50/50">
              <p className="text-sm font-semibold text-brand-brown">
                You earned <span className="text-brand-gold font-bold">{coinsEarned} JS Coins</span> on this order!
              </p>
              <p className="text-xs text-gray-500 mt-0.5">= ₹{Math.floor(coinsEarned * 0.25)} off your next order</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Order confirmation sent to <strong>{user?.email || address.email}</strong>.<br />
            Expected delivery: <strong>3–5 business days</strong>.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard" className="btn-primary">Track Order</Link>
            <Link to="/products" className="btn-outline">Shop More</Link>
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
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
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

          {/* ── Step 0: Address ── */}
          {step === 0 && (
            <div className="card-luxury p-6">
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

                {/* Phone — Required */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                    <input name="phone" value={address.phone} onChange={handleAddr}
                      type="tel" maxLength={10} placeholder="10-digit mobile"
                      className={`input-field pl-10 ${fieldErrors.phone ? "border-red-400" : ""}`} />
                  </div>
                  {fieldErrors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.phone}</p>}
                </div>

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

              <button onClick={() => { if (validateAddress()) setStep(1); }}
                className="btn-primary mt-6 flex items-center gap-2">
                Continue to Payment <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 1: Payment ── */}
          {step === 1 && (
            <div className="card-luxury p-6">
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
            </div>
          )}

          {/* ── Step 2: Review & Place Order ── */}
          {step === 2 && (
            <div className="card-luxury p-6">
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
            </div>
          )}
        </div>

        {/* ── Order Summary Sidebar ── */}
        <div className="card-luxury p-5 h-fit sticky top-24">
          <h3 className="font-serif font-normal text-brand-brown mb-4 text-base border-b border-gray-100 pb-3">Order Summary</h3>
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
                <span>Coupon ({appliedCoupon})</span>
                <span>− {formatPrice(discount)}</span>
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
