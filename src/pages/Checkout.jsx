import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, ChevronRight, Lock } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/helpers";
import toast from "react-hot-toast";

const STEPS = ["Address", "Payment", "Review"];

export default function Checkout() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ name: "", phone: "", address: "", city: "", state: "", pincode: "", country: "India" });
  const [payMethod, setPayMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleAddr = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const order = {
        userId: user?.uid || "guest",
        userEmail: user?.email || address.email || "",
        customerName: address.name,
        items: items.map((i) => ({ id: i.id, name: i.name, variant: i.variant, qty: i.qty, price: i.price, image: i.image })),
        address,
        paymentMethod: payMethod,
        subtotal,
        shipping,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "orders"), order);
      setOrderId(ref.id);
      clearCart();
      setStep(3);
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-brand-brown mb-2">Order Placed!</h1>
          <p className="text-gray-500 mb-1">Thank you for your order 🎉</p>
          <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 px-3 py-1.5 rounded-lg inline-block">Order ID: #{orderId?.slice(0, 8).toUpperCase()}</p>
          <p className="text-sm text-gray-500 mb-8">We'll send you a confirmation email and WhatsApp message shortly. Expected delivery: 3–5 business days.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard" className="btn-brown">Track Order</Link>
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
          <p className="text-gray-400 mb-4">Your cart is empty</p>
          <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      <h1 className="font-serif text-3xl font-bold text-brand-brown mb-8">Checkout</h1>

      {/* Progress steps */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i <= step ? "text-brand-gold" : "text-gray-300"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i < step ? "bg-brand-gold border-brand-gold text-white" : i === step ? "border-brand-gold text-brand-gold" : "border-gray-200 text-gray-300"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-sm font-medium hidden md:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${i < step ? "bg-brand-gold" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 0: Address */}
          {step === 0 && (
            <div className="card-luxury p-6">
              <h2 className="font-serif text-xl font-bold text-brand-brown mb-5">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "name", label: "Full Name", full: true, required: true },
                  { name: "phone", label: "Phone Number", type: "tel", required: true },
                  { name: "address", label: "Address / Street", full: true, required: true },
                  { name: "city", label: "City", required: true },
                  { name: "state", label: "State", required: true },
                  { name: "pincode", label: "PIN Code", required: true },
                  { name: "country", label: "Country" },
                ].map((f) => (
                  <div key={f.name} className={f.full ? "sm:col-span-2" : ""}>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">{f.label} {f.required && <span className="text-red-400">*</span>}</label>
                    <input
                      name={f.name}
                      value={address[f.name]}
                      onChange={handleAddr}
                      type={f.type || "text"}
                      required={f.required}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => { if (!address.name || !address.phone || !address.address || !address.city || !address.pincode) { toast.error("Please fill all required fields"); return; } setStep(1); }}
                className="btn-primary mt-6 flex items-center gap-2"
              >
                Continue to Payment <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="card-luxury p-6">
              <h2 className="font-serif text-xl font-bold text-brand-brown mb-5">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", icon: "💰" },
                  { id: "upi", label: "UPI Payment", desc: "Google Pay, PhonePe, Paytm", icon: "📱" },
                  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay", icon: "💳" },
                  { id: "netbanking", label: "Net Banking", desc: "All major banks supported", icon: "🏦" },
                ].map((m) => (
                  <label key={m.id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${payMethod === m.id ? "border-brand-gold bg-brand-cream" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="pay" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} className="accent-brand-gold" />
                    <span className="text-xl">{m.icon}</span>
                    <div>
                      <p className="font-semibold text-brand-brown text-sm">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="btn-outline">← Back</button>
                <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                  Review Order <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="card-luxury p-6">
              <h2 className="font-serif text-xl font-bold text-brand-brown mb-5">Review Your Order</h2>
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={`${item.id}-${item.variantId}`} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                    <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-brown">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.variant} × {item.qty}</p>
                    </div>
                    <p className="font-bold text-brand-gold text-sm">{formatPrice(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="bg-brand-cream rounded-xl p-4 mb-4 text-sm space-y-1">
                <p className="font-semibold text-brand-brown mb-2">Shipping to:</p>
                <p className="text-gray-600">{address.name} — {address.phone}</p>
                <p className="text-gray-600">{address.address}, {address.city}, {address.state} - {address.pincode}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline">← Back</button>
                <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                  <Lock size={16} /> {loading ? "Placing Order..." : `Place Order — ${formatPrice(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="card-luxury p-5 h-fit sticky top-24">
          <h3 className="font-serif font-bold text-brand-brown mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={`${item.id}-${item.variantId}`} className="flex justify-between text-gray-500">
                <span className="truncate pr-2">{item.name} × {item.qty}</span>
                <span>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-gray-600">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-brand-brown">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
