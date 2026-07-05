import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Tag, Truck, Lock, Package, RotateCcw, CheckCircle2, X, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useCart } from "../context/CartContext";
import { useCoins, COINS_RULES } from "../context/CoinsContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatPrice } from "../utils/helpers";
import toast from "react-hot-toast";

// Fallback hardcoded coupons (used if Firestore is empty) — mirrors Checkout.jsx
const FALLBACK_COUPONS = [
  { code: "WELCOME100", type: "flat", value: 100, minOrder: 599, maxUses: 1 },
  { code: "FLAT150",    type: "flat", value: 150, minOrder: 1499, maxUses: null },
  { code: "FLAT300",    type: "flat", value: 300, minOrder: 2999, maxUses: null },
];

export default function Cart() {
  const { items, removeFromCart, updateQty, subtotal, shipping, total } = useCart();
  const { tr } = useLanguage();
  const { user } = useAuth();
  const { coins, coinsWorth, redeemCoins } = useCoins() || {};
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [coinsApplied, setCoinsApplied] = useState(false);
  const [coinsDiscount, setCoinsDiscount] = useState(0);
  const [coinsRedeemed, setCoinsRedeemed] = useState(0);
  const [coinsLoading, setCoinsLoading] = useState(false);

  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.floor(subtotal * appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;
  const discount = couponDiscount;
  const finalTotal = Math.max(0, total - discount - coinsDiscount);

  // Coins guardrails
  const coinsUnlocked = subtotal >= COINS_RULES.minCartValue && !appliedCoupon && !!user && (coins || 0) >= COINS_RULES.minRedeem;
  const maxCoinsToRedeem = Math.min(coins || 0, Math.ceil(COINS_RULES.maxRedeemValue / COINS_RULES.redeemRate)); // 2,000
  const coinsPotentialValue = parseFloat((maxCoinsToRedeem * COINS_RULES.redeemRate).toFixed(2));

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

  const handleRemoveCoins = () => {
    setCoinsApplied(false);
    setCoinsDiscount(0);
    setCoinsRedeemed(0);
    toast("JS Coins removed");
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (appliedCoupon) {
      toast.error("Remove current coupon first");
      return;
    }
    setCouponLoading(true);
    try {
      // Look up by code only — an admin-managed coupon must always win over
      // the hardcoded fallback, even when it's been deactivated or its
      // value edited, otherwise deactivating e.g. WELCOME100 in the admin
      // dashboard silently does nothing on the live site because it still
      // matches a FALLBACK_COUPONS entry with the same code.
      const q = query(collection(db, "coupons"), where("code", "==", code));
      const snap = await getDocs(q);
      let coupon = null;
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (!data.active) {
          toast.error("This coupon is no longer active");
          setCouponLoading(false);
          return;
        }
        // Check expiry — expiry is stored as a Firestore Timestamp, not a
        // plain date string, so it needs .toDate() before comparing.
        const expiryDate = data.expiry?.toDate ? data.expiry.toDate() : (data.expiry ? new Date(data.expiry) : null);
        if (expiryDate && expiryDate < new Date()) {
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
          id: snap.docs[0].id,
          code: data.code,
          type: data.discountType || "percent",
          value: data.discountValue || data.discount || 10,
          minOrder: data.minOrder || 0,
        };
      } else {
        // No admin-managed coupon with this code exists — fall back to hardcoded
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
    toast("Coupon removed — JS Coins now available");
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
          <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={`${item.id}-${item.variantId}`}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="card-luxury p-4 flex gap-4"
            >
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
                  <motion.button whileTap={{ scale: 0.85 }} className="qty-btn" onClick={() => updateQty(item.id, item.variantId, item.qty - 1)}><Minus size={12} /></motion.button>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={item.qty}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-8 text-center font-semibold text-sm inline-block"
                    >
                      {item.qty}
                    </motion.span>
                  </AnimatePresence>
                  <motion.button whileTap={{ scale: 0.85 }} className="qty-btn" onClick={() => updateQty(item.id, item.variantId, item.qty + 1)}><Plus size={12} /></motion.button>
                  <span className="ml-auto text-sm font-bold text-brand-brown">{formatPrice(item.price * item.qty)}</span>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* JS Coins Vault */}
          {user && (
            <div className="card-luxury p-4">
              <p className="text-sm font-semibold text-brand-brown mb-1 flex items-center gap-2">
                <span className="text-base">🪙</span> JS Coins Vault
              </p>
              {!coinsUnlocked && !coinsApplied && (
                <div className="mt-2 space-y-1">
                  {!user && <p className="text-xs text-gray-400">Sign in to use your coins</p>}
                  {user && (coins || 0) < COINS_RULES.minRedeem && (
                    <p className="text-xs text-gray-400">You have {coins || 0} coins — earn {COINS_RULES.minRedeem - (coins || 0)} more to redeem</p>
                  )}
                  {user && (coins || 0) >= COINS_RULES.minRedeem && appliedCoupon && (
                    <p className="text-xs text-amber-600 font-medium">Cannot combine coins with a coupon code</p>
                  )}
                  {user && (coins || 0) >= COINS_RULES.minRedeem && !appliedCoupon && subtotal < COINS_RULES.minCartValue && (
                    <p className="text-xs text-gray-400">Add ₹{COINS_RULES.minCartValue - subtotal} more to unlock coins (min ₹{COINS_RULES.minCartValue} cart)</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">You have <span className="font-bold text-brand-brown">{coins || 0} coins</span> · Worth ₹{coinsWorth || 0}</p>
                </div>
              )}
              {coinsUnlocked && !coinsApplied && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-3">
                    <span className="font-bold text-brand-brown">{(coins || 0).toLocaleString()} Coins Available</span>
                    {" · "}Worth up to <span className="font-bold text-emerald-700">₹{coinsPotentialValue}</span> on this order
                  </p>
                  <button
                    onClick={handleApplyCoins}
                    disabled={coinsLoading}
                    className="w-full text-xs font-semibold py-2.5 px-4 border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white transition-all duration-200 disabled:opacity-60"
                  >
                    {coinsLoading ? "Applying..." : `Apply ${maxCoinsToRedeem} Coins — Save ₹${coinsPotentialValue}`}
                  </button>
                </div>
              )}
              {coinsApplied && (
                <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <div>
                    <p className="text-xs font-bold text-emerald-700">{coinsRedeemed} JS Coins Applied</p>
                    <p className="text-xs text-emerald-600">₹{coinsDiscount} off this order</p>
                  </div>
                  <button onClick={handleRemoveCoins} className="text-emerald-500 hover:text-red-500 transition-colors ml-2">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

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
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>− {formatPrice(couponDiscount)}</span>
                </div>
              )}
              {coinsApplied && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>JS Coins ({coinsRedeemed})</span>
                  <span>− ₹{coinsDiscount}</span>
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
              state={{ discount: couponDiscount, appliedCoupon: appliedCoupon?.code || null, coinsDiscount, coinsRedeemed }}
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
