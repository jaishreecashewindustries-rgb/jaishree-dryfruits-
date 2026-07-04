import React, { useState } from "react";
import { Package, Search, CheckCircle2, Clock, Truck, MapPin, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { formatPrice } from "../utils/helpers";
import { Link } from "react-router-dom";

const STATUS_STEPS = [
  { key: "pending",    label: "Order Placed",      icon: Package },
  { key: "confirmed",  label: "Confirmed",         icon: CheckCircle2 },
  { key: "processing", label: "Being Prepared",    icon: Clock },
  { key: "shipped",    label: "Out for Delivery",  icon: Truck },
  { key: "delivered",  label: "Delivered",         icon: MapPin },
];

function getStatusIndex(status) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 1 : idx;
}

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    const id = orderId.trim();
    if (!id) { setError("Please enter your Order ID"); return; }
    setLoading(true); setError(""); setOrder(null);
    try {
      // The order number shown to the customer (email, WhatsApp, confirmation
      // screen) IS the Firestore document ID for orders placed after this
      // fix — see Checkout.jsx's generateOrderCode(). Firestore rules allow
      // a direct get-by-ID for anyone (same trust model as a magic link),
      // but not an unauthenticated query/list, so this only works as a
      // direct doc lookup, not a where() query.
      const snap = await getDoc(doc(db, "orders", id.toUpperCase()));
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() });
      } else {
        setError("Order not found. Please check the ID from your confirmation message.");
      }
    } catch {
      setError("Something went wrong. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 pb-32 md:pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-400 hover:text-brand-brown transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-10 h-10 rounded-full bg-brand-brown/10 flex items-center justify-center">
            <Truck size={18} className="text-brand-brown" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-brown">Track Your Order</h1>
            <p className="text-xs text-gray-400">Enter your Order ID for live status</p>
          </div>
        </div>

        {/* Search box */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Order ID</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => { setOrderId(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            placeholder="e.g. ABC12345 (from your WhatsApp confirmation)"
            className="input-field w-full mb-4"
          />
          {error && <p className="text-sm text-red-500 mb-3 flex items-center gap-1"><span>⚠️</span> {error}</p>}
          <button
            onClick={handleTrack}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={16} />}
            {loading ? "Tracking…" : "Track Order"}
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Your Order ID was sent via WhatsApp after placing your order.
          </p>
        </div>

        {/* Result */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            {/* Order meta */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Order ID</p>
                <p className="font-bold text-brand-brown font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                order.status === "delivered"  ? "bg-green-100 text-green-700" :
                order.status === "shipped"    ? "bg-blue-100 text-blue-700"  :
                order.status === "processing" ? "bg-orange-100 text-orange-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>{order.status || "pending"}</span>
            </div>

            {/* Timeline */}
            <div className="relative pl-12 mb-8">
              <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gray-100" />
              {STATUS_STEPS.map((step, i) => {
                const current = getStatusIndex(order.status);
                const done = i <= current;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center gap-4 mb-5 last:mb-0 relative">
                    <div className={`absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      done ? "bg-brand-gold text-brand-brown shadow-md" : "bg-gray-100 text-gray-300"
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${done ? "text-brand-brown" : "text-gray-300"}`}>{step.label}</p>
                      {i === current && (
                        <p className="text-[10px] text-brand-gold font-medium">● Current status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Items */}
            <div className="border-t border-gray-50 pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Order Items</p>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.variant} × {item.qty}</p>
                    </div>
                    <p className="text-sm font-bold text-brand-brown">{formatPrice(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                <span className="font-bold text-gray-700 text-sm">Order Total</span>
                <span className="font-bold text-brand-gold text-base">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Address */}
            {order.address && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 flex gap-2">
                <MapPin size={12} className="text-brand-gold mt-0.5 flex-shrink-0" />
                <span>{order.address.address}, {order.address.city}, {order.address.state} — {order.address.pincode}</span>
              </div>
            )}
          </motion.div>
        )}

        <div className="text-center mt-8 text-sm text-gray-400">
          Need help?{" "}
          <a href="https://wa.me/917568577968" target="_blank" rel="noreferrer" className="text-brand-gold font-semibold">
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
