import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Tag, Truck, Lock, Package, RotateCcw, CheckCircle2, X } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/helpers";
import toast from "react-hot-toast";

// Fallback hardcoded coupons (used if Firestore is empty)
const FALLBACK_COUPONS = [
  { code: "WELCOME15", type: "percent", value: 15, minOrder: 299, maxUses: 1 },
  { code: "CASHEW10",  type: "percent", value: 10, minOrder: 199, maxUses: null },
  { code: "MONSOON20", type: "percent", value: 20, minOrder: 499, maxUses: null },
  { code: "FLAT50",    type: "flat",    value: 50, minOrder: 499, maxUses: null },
];

export default function Cart() {
  const { items, removeFromCart, updateQty, subtotal, shipping, total } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.floor(subtotal * appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;
  const finalTotal = Math.max(0, total - discount);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (appliedCoupon) {
      toast.error("Remove current coupon first");
      return;
    }
    setCouponLoading(true);
    try {
      // Try Firestore first
      const q = query(
        collection(db, "coupons"),
        where("code", "==", code),
        where("active", "==", true)
      );
      const snap = await getDocs(q);
      let coupon = null;
      if (!snap.empty) {
        const data = snap.docs[0].data();
        // Check expiry
        if (data.expiry && new Date(data.expiry) < new Date()) {
          toast.error("This coupon has expired");
          setCouponLoading(false);
          return;
        }
        // Check maxUses
        if (data.maxUses && (data.usedCount || 0) >= data.maxUses) {
          toast.error("This coupon has reached its usage limit");
          setCouponLoading(false);
          return;
        }
        coupon = {
          code: data.code,
          type: data.discountType || "percent",
          value: data.discountValue || data.discount || 10,
          minOrder: data.minOrder || 0,
        };
      } else {
        // Fall back to hardcoded
        coupon = FALLBACK_COUPONS.find(c => c.code === code) || null;
      }

      if (!coupon) {
        toast.error("Invalid coupon code");
        setCouponLoading(false);
        return;
      }
      if (subtotal < coupon.minOrder) {
        toast.error(`Minimum order ₹${coupon.minOrder} required for this coupon`);
        setCouponLoading(false);
        return;
      }
      setAppliedCoupon(coupon);
      const saving = coupon.type === "percent"
        ? `${coupon.value}% off`
        : `₹${coupon.value} off`;
      toast.success(`Coupon applied — ${saving}!`);
    } catch (e) {
      // Firestore error — fall back to hardcoded
      const coupon = FALLBACK_COUPONS.find(c => c.code === code);
      if (coupon) {
        if (subtotal < coupon.minOrder) {
          toast.error(`Minimum order ₹${coupon.minOrder} required`);
        } else {
          setAppliedCoupon(coupon);
          toast.success(`Coupon applied — ${coupon.value}${coupon.type === "percent" ? "%" : "₹"} off!`);
        }
      } else {
        toast.error("Invalid coupon code");
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast("Coupon removed");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <ShoppingBag size={72} className="text-gray-200 mb-4" />
        <h2 className="font-serif text-2xl font-bold text-brand-brown mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const FREE_SHIPPING_THRESHOLD = 499;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-screen">
      <h1 className="font-serif text-3xl font-bold text-brand-brown mb-4">Shopping Cart</h1>

      {/* Free shipping progress bar */}
      <div className="p-4 mb-6" style={{ background: progress >= 100 ? "linear-gradient(135deg, #0D4B2C, #166534)" : "linear-gradient(135deg, #1A2744, #1B2E4B)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-white text-sm font-semibold">
            {progress >= 100
              ? <span className="flex items-center gap-2"><CheckCircle2 size={14} /> Free delivery unlocked!</span>
              : `Add ${formatPrice(remaining)} more for FREE delivery`}
          </p>
          <span className="text-white/60 text-xs">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-white/15 overflow-hidden">
          <div className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: progress >= 100 ? "#4ade80" : "linear-gradient(90deg, #E8C97A, #C9A84C)" }} />
        </div>
        {progress < 100 && (
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-white/40 text-xs">₹0</span>
            <span className="text-white/40 text-xs flex items-center gap-1"><Truck size={10} /> Free at ₹{FREE_SHIPPING_THRESHOLD}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={`${item.id}-${item.variantId}`} className="card-luxury p-4 flex gap-4">
              <Link to={`/product/${item.id}`}>
                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover flex-shrink-0" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link to={`/product/${item.id}`} className="font-semibold text-brand-brown hover:text-brand-gold transition-colors text-sm">{item.name}</Link>
                    <p className="text-xs text-gray-500">{item.variant}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id, item.variantId)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="font-bold text-brand-gold mt-1">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.variantId, item.qty - 1)}><Minus size={12} /></button>
                  <span className="w-8 text-center font-semibold text-sm">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.variantId, item.qty + 1)}><Plus size={12} /></button>
                  <span className="ml-auto text-sm font-bold text-brand-brown">{formatPrice(item.price * item.qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="card-luxury p-4">
            <p className="text-sm font-semibold text-brand-brown mb-3 flex items-center gap-2"><Tag size={15} /> Promo Code</p>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
                <div>
                  <p className="text-xs font-bold text-green-700 tracking-wider">{appliedCoupon.code}</p>
                  <p className="text-xs text-green-600">
                    {appliedCoupon.type === "percent" ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} off`}
                    &nbsp;— Saving {formatPrice(discount)}
                  </p>
                </div>
                <button onClick={removeCoupon} className="text-green-500 hover:text-red-500 transition-colors ml-2">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                    className="input-field text-sm py-2.5 flex-1"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="bg-brand-gold text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-gold-dark transition-colors disabled:opacity-60"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
                <p className="text-xs text-brand-gold mt-2 font-medium">Try WELCOME15 for 15% off your first order</p>
              </>
            )}
          </div>

          {/* Order summary */}
          <div className="card-luxury p-5">
            <h2 className="font-serif text-lg font-bold text-brand-brown mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              {items.map((item) => (
                <div key={`${item.id}-${item.variantId}`} className="flex justify-between text-gray-500">
                  <span className="truncate pr-2">{item.name} × {item.qty}</span>
                  <span className="flex-shrink-0">{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 flex justify-between text-gray-600">
                <span>Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={`font-medium ${shipping === 0 ? "text-green-600" : ""}`}>
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>− {formatPrice(discount)}</span>
                </div>
              )}
              {subtotal < 499 && (
                <p className="text-xs text-blue-500">Add {formatPrice(499 - subtotal)} more for free shipping</p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-brand-brown text-base">
                <span>Total</span><span>{formatPrice(finalTotal)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              state={{ discount, appliedCoupon: appliedCoupon?.code || null }}
              className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/products" className="block text-center text-xs text-gray-400 hover:text-brand-brown transition-colors mt-3">
              ← Continue Shopping
            </Link>
          </div>

          {/* Trust */}
          <div className="border border-gray-100 p-4 space-y-2.5">
            {[
              { Icon: Lock,      text: "Secure checkout — 256-bit SSL encryption" },
              { Icon: Package,   text: "Free shipping on orders above ₹499" },
              { Icon: RotateCcw, text: "7-day hassle-free returns" },
            ].map(({ Icon, text }) => (
              <p key={text} className="flex items-center gap-2 text-xs text-gray-500">
                <Icon size={13} className="text-brand-gold flex-shrink-0" />
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
