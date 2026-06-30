import React, { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { Package, Heart, LogOut, Coins, Building2, CheckCircle2, Truck, Star, ChevronRight, RotateCcw } from "lucide-react";
import { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useCoins, COINS_RULES } from "../context/CoinsContext";
import { useWishlist } from "../context/WishlistContext";
import { DEMO_PRODUCTS, formatPrice, formatDate, getStatusStyle, ORDER_STATUSES } from "../utils/helpers";
import toast from "react-hot-toast";

const TABS = [
  { id: "orders",    label: "Allocation History", icon: Package },
  { id: "coins",     label: "JS Coins Vault",     icon: Coins },
  { id: "corporate", label: "Corporate Profile",  icon: Building2 },
  { id: "wishlist",  label: "Wishlist",           icon: Heart },
  { id: "returns",   label: "Returns",            icon: RotateCcw },
];

const RETURN_REASONS = [
  "Damaged or spoiled product",
  "Wrong item received",
  "Quality not as expected",
  "Ordered by mistake",
  "Other",
];

// Tracking timeline stages
const TIMELINE_STAGES = [
  { key: "pending",    label: "Order Locked",                    icon: CheckCircle2, desc: "Your allocation is confirmed and queued for grading" },
  { key: "processing", label: "Hand-Grading at Jaipur Floor",   icon: Star,         desc: "Our artisans are inspecting and hand-sorting your batch" },
  { key: "shipped",    label: "Air Express Dispatch",           icon: Truck,         desc: "Nitrogen-sealed package dispatched via Air Express" },
  { key: "delivered",  label: "Delivered",                      icon: CheckCircle2, desc: "Your allocation has arrived" },
];

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function UserDashboard() {
  const { user, userProfile, logout } = useAuth();
  const { coins: balance, coinsWorth, history: transactions, loading: coinsLoading } = useCoins() || {};
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const wishlistProducts = DEMO_PRODUCTS.filter((p) => wishlistIds.includes(p.id));
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Corporate profile state
  const [corpProfile, setCorpProfile] = useState({ company: "", gstin: "" });
  const [corpSaving, setCorpSaving] = useState(false);
  const [gstinError, setGstinError] = useState("");

  // Return requests state
  const [returns, setReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [returnForm, setReturnForm] = useState({ orderId: "", reason: RETURN_REASONS[0], details: "", resolution: "refund" });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user?.uid]);

  useEffect(() => {
    if (!user || tab !== "returns") return;
    const fetchReturns = async () => {
      setLoadingReturns(true);
      try {
        const q = query(collection(db, "return_requests"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setReturns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setReturns([]);
      } finally {
        setLoadingReturns(false);
      }
    };
    fetchReturns();
  }, [user?.uid, tab]);

  useEffect(() => {
    if (!user || tab !== "corporate") return;
    const fetchCorp = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setCorpProfile({ company: d.gstinCompany || "", gstin: d.gstin || "" });
        }
      } catch {}
    };
    fetchCorp();
  }, [user?.uid, tab]);

  if (!user) return <Navigate to="/login" state={{ from: "/dashboard" }} />;

  const saveCorpProfile = async () => {
    const g = corpProfile.gstin.trim().toUpperCase();
    if (g && !GSTIN_REGEX.test(g)) {
      setGstinError("Invalid GSTIN format — please verify your 15-character GST number");
      return;
    }
    setGstinError("");
    setCorpSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        gstinCompany: corpProfile.company.trim(),
        gstin: g,
        updatedAt: new Date(),
      }, { merge: true });
      toast.success("Corporate profile saved — GSTIN will auto-fill at checkout");
    } catch {
      toast.error("Could not save profile");
    } finally {
      setCorpSaving(false);
    }
  };

  const submitReturn = async () => {
    if (!returnForm.orderId.trim()) {
      toast.error("Please enter the Order ID");
      return;
    }
    if (!returnForm.details.trim()) {
      toast.error("Please describe the issue");
      return;
    }
    setSubmittingReturn(true);
    try {
      const docRef = await addDoc(collection(db, "return_requests"), {
        userId: user.uid,
        userEmail: user.email,
        orderId: returnForm.orderId.trim(),
        reason: returnForm.reason,
        details: returnForm.details.trim(),
        resolution: returnForm.resolution,
        status: "pending",
        createdAt: new Date(),
      });
      setReturns((r) => [{ id: docRef.id, userId: user.uid, userEmail: user.email, orderId: returnForm.orderId.trim(), reason: returnForm.reason, details: returnForm.details.trim(), resolution: returnForm.resolution, status: "pending", createdAt: new Date() }, ...r]);
      setReturnForm({ orderId: "", reason: RETURN_REASONS[0], details: "", resolution: "refund" });
      toast.success("Return request submitted — we'll review it within 24 hours");
    } catch {
      toast.error("Could not submit return request");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getTimelineStage = (status) => {
    const idx = TIMELINE_STAGES.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-screen pb-36 md:pb-10">
      {/* Header */}
      <div className="text-white rounded-none p-6 mb-8 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #1B2E4B 0%, #0B3D2E 100%)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #C9A84C, #E8C97A)", color: "#1B2E4B" }}>
          {userProfile?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Hello, {userProfile?.displayName || "Connoisseur"}!</h1>
          <p className="text-white/60 text-sm">{user.email}</p>
          <p className="text-sm font-semibold mt-1 flex items-center gap-1.5" style={{ color: "#E8C97A" }}>
            🪙 {(balance || 0).toLocaleString()} JS Coins Available
            &nbsp;·&nbsp;
            Worth ₹{coinsWorth || 0} on your next allocation over ₹{COINS_RULES.minCartValue}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-56 flex-shrink-0">
          <div className="bg-white border border-gray-100 p-3 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                  tab === id
                    ? "text-white"
                    : "text-gray-600 hover:text-brand-brown"
                }`}
                style={tab === id ? { background: "#0B3D2E" } : {}}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-all mt-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {/* ── ALLOCATION HISTORY ── */}
          {tab === "orders" && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-brown mb-5">Allocation History</h2>
              {loadingOrders ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100">
                  <Package size={48} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">No allocations yet</p>
                  <Link to="/products" className="btn-primary">Begin Your First Allocation</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const stageIdx = getTimelineStage(order.status);
                    const isExpanded = expandedOrder === order.id;
                    return (
                      <div key={order.id} className="card-luxury">
                        {/* Order header */}
                        <div
                          className="p-5 cursor-pointer flex items-start justify-between gap-3"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <div className="flex gap-3 items-start flex-1 min-w-0">
                            <div className="flex gap-1.5 flex-shrink-0">
                              {order.items?.slice(0, 2).map((item, i) => (
                                <img key={i} src={item.image} alt={item.name} className="w-12 h-12 object-cover" />
                              ))}
                              {(order.items?.length || 0) > 2 && (
                                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                  +{order.items.length - 2}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-brand-brown text-sm">
                                Allocation #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                              <p className="font-bold text-brand-brown mt-0.5">{formatPrice(order.total)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-semibold px-3 py-1 ${getStatusStyle(order.status)}`}>
                              {ORDER_STATUSES.find((s) => s.value === order.status)?.label || order.status}
                            </span>
                            <ChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded: timeline + items */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                            {/* Tracking timeline */}
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Tracking Timeline</p>
                            <div className="relative">
                              {TIMELINE_STAGES.map((stage, idx) => {
                                const done = idx <= stageIdx;
                                const active = idx === stageIdx;
                                return (
                                  <div key={stage.key} className="flex gap-3 mb-4 last:mb-0">
                                    <div className="flex flex-col items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                        done ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-300"
                                      } ${active ? "ring-2 ring-emerald-300 ring-offset-2" : ""}`}>
                                        <stage.icon size={14} />
                                      </div>
                                      {idx < TIMELINE_STAGES.length - 1 && (
                                        <div className={`w-px flex-1 mt-1 mb-0 min-h-[20px] ${done && idx < stageIdx ? "bg-emerald-400" : "bg-gray-200"}`} />
                                      )}
                                    </div>
                                    <div className="pb-2">
                                      <p className={`text-sm font-semibold ${done ? "text-brand-brown" : "text-gray-400"}`}>{stage.label}</p>
                                      <p className={`text-xs mt-0.5 ${active ? "text-emerald-600 font-medium" : "text-gray-400"}`}>{stage.desc}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Items */}
                            <div className="mt-5 border-t border-gray-100 pt-4 space-y-2">
                              {order.items?.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <img src={item.image} alt={item.name} className="w-8 h-8 object-cover flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-brand-brown text-xs leading-tight">{item.name}</p>
                                      <p className="text-xs text-gray-400">{item.variant} × {item.qty}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold">{formatPrice(item.price * item.qty)}</span>
                                    <Link
                                      to={`/product/${item.id}`}
                                      className="text-[10px] font-semibold px-2 py-1 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white transition-colors"
                                    >
                                      Passport
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* GSTIN note */}
                            {order.gstin && (
                              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                                GST Invoice: <span className="font-semibold text-brand-brown">{order.gstinCompany}</span> · {order.gstin}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── JS COINS VAULT ── */}
          {tab === "coins" && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold text-brand-brown">JS Coins Vault</h2>

              {/* Hero balance card */}
              <div className="p-8 text-center"
                style={{ background: "linear-gradient(135deg, #1B2E4B 0%, #243D63 100%)", border: "1px solid rgba(201,168,76,0.25)" }}>
                <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-3" style={{ color: "rgba(232,201,122,0.5)" }}>
                  Total Balance
                </p>
                <p className="font-serif text-7xl font-light mb-1" style={{ color: "#E8C97A" }}>
                  {(balance || 0).toLocaleString()}
                </p>
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>JS Coins</p>
                <p className="font-serif text-xl mb-6" style={{ color: "#E8C97A" }}>
                  Worth ₹{coinsWorth || 0} on your next allocation over ₹{COINS_RULES.minCartValue}
                </p>

                {/* Earn rates */}
                <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto border-t pt-6" style={{ borderColor: "rgba(232,201,122,0.15)" }}>
                  {[
                    { val: "1 Coin", sub: "per ₹1 spent" },
                    { val: `₹2.50`,  sub: "per 100 coins" },
                    { val: "₹50",    sub: "max per order" },
                  ].map(r => (
                    <div key={r.sub} className="text-center">
                      <p className="font-serif text-lg font-light" style={{ color: "#E8C97A" }}>{r.val}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{r.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility note */}
              {(balance || 0) < COINS_RULES.minRedeem ? (
                <div className="border border-amber-200 bg-amber-50 p-4 text-center">
                  <p className="text-amber-700 text-sm font-medium">
                    Earn {COINS_RULES.minRedeem - (balance || 0)} more coins to unlock redemption
                  </p>
                  <Link to="/products" className="text-xs text-amber-600 underline mt-1 block">Shop Now to Earn Coins</Link>
                </div>
              ) : (
                <div className="border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-emerald-700 text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Your coins are ready to redeem — apply them at checkout on orders ≥ ₹{COINS_RULES.minCartValue}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Up to {Math.min(balance || 0, Math.ceil(COINS_RULES.maxRedeemValue / COINS_RULES.redeemRate)).toLocaleString()} coins (₹{Math.min(coinsWorth || 0, COINS_RULES.maxRedeemValue).toFixed(2)}) can be applied per transaction
                  </p>
                </div>
              )}

              {/* Expiry note */}
              <p className="text-xs text-gray-400 text-center">
                Coins are valid for 90 days from the date of earning. Expired coins are forfeited.
              </p>

              {/* Transaction history */}
              <div className="card-luxury overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-brand-brown">Transaction History</h3>
                  <span className="text-xs text-gray-400">{(transactions || []).length} entries</span>
                </div>
                {coinsLoading ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
                ) : (transactions || []).length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    No transactions yet — start shopping to earn coins!
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {(transactions || []).slice(0, 30).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-brand-brown">{tx.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {tx.createdAt?.toDate?.().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) || "—"}
                          </p>
                        </div>
                        <span className={`font-bold text-sm tabular-nums ${tx.type === "earn" ? "text-emerald-600" : "text-red-500"}`}>
                          {tx.type === "earn" ? "+" : "−"}{tx.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CORPORATE PROFILE ── */}
          {tab === "corporate" && (
            <div className="card-luxury p-6 max-w-lg">
              <h2 className="font-serif text-2xl font-bold text-brand-brown mb-1">Corporate Profile</h2>
              <p className="text-sm text-gray-400 mb-6">
                Save your GSTIN once — it auto-fills at checkout for ITC-eligible enterprise allocations.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                    Legal Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Enterprises Pvt Ltd"
                    value={corpProfile.company}
                    onChange={e => setCorpProfile(p => ({ ...p, company: e.target.value }))}
                    className="gstin-input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                    GSTIN — 15-Digit GST Number
                  </label>
                  <input
                    type="text"
                    placeholder="22AAAAA0000A1Z5"
                    value={corpProfile.gstin}
                    onChange={e => {
                      const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
                      setCorpProfile(p => ({ ...p, gstin: v }));
                      if (gstinError) setGstinError("");
                    }}
                    className="gstin-input w-full font-mono tracking-widest"
                    maxLength={15}
                  />
                  {gstinError && <p className="text-xs text-red-500 mt-1.5">{gstinError}</p>}
                  {corpProfile.gstin.length === 15 && GSTIN_REGEX.test(corpProfile.gstin) && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Valid GSTIN format
                    </p>
                  )}
                  {corpProfile.gstin.length > 0 && corpProfile.gstin.length < 15 && (
                    <p className="text-xs text-gray-400 mt-1.5">{15 - corpProfile.gstin.length} characters remaining</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <button
                    onClick={saveCorpProfile}
                    disabled={corpSaving}
                    className="btn-primary w-full"
                  >
                    {corpSaving ? "Saving..." : "Save Corporate Profile"}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-3">
                    Your GSTIN is stored securely and used only for tax invoice generation
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── WISHLIST ── */}
          {tab === "wishlist" && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-brown mb-5">
                Wishlist
                {wishlistProducts.length > 0 && (
                  <span className="text-base text-gray-400 font-normal ml-2">
                    ({wishlistProducts.length})
                  </span>
                )}
              </h2>
              {wishlistProducts.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100">
                  <Heart size={48} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">Your wishlist is empty</p>
                  <Link to="/products" className="btn-primary">Browse Allocations</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {wishlistProducts.map((product) => (
                    <div key={product.id} className="card-luxury p-4 flex gap-3 items-start">
                      <Link to={`/product/${product.id}`} className="flex-shrink-0">
                        <img src={product.images?.[0]} alt={product.name} className="w-20 h-20 object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-brand-gold font-semibold uppercase tracking-wide">{product.category}</p>
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-semibold text-brand-brown text-sm leading-snug hover:text-brand-gold transition-colors mt-0.5">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="font-bold text-brand-brown mt-1">{formatPrice(product.variants?.[0]?.price)}</p>
                        <div className="flex gap-2 mt-2">
                          <Link to={`/product/${product.id}`} className="text-xs btn-primary px-3 py-1.5">View</Link>
                          <button
                            onClick={() => removeFromWishlist(product.id)}
                            className="text-xs px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RETURNS ── */}
          {tab === "returns" && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-brown mb-5">Return Requests</h2>

              <div className="card-luxury p-5 mb-6">
                <h3 className="font-semibold text-brand-brown text-sm mb-4">Request a Return / Refund</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Order ID</label>
                    <input
                      type="text"
                      placeholder="e.g. ORD-2026-00123"
                      value={returnForm.orderId}
                      onChange={(e) => setReturnForm((f) => ({ ...f, orderId: e.target.value }))}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Reason</label>
                    <select
                      value={returnForm.reason}
                      onChange={(e) => setReturnForm((f) => ({ ...f, reason: e.target.value }))}
                      className="input-field w-full"
                    >
                      {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Details</label>
                    <textarea
                      rows={3}
                      placeholder="Describe what went wrong..."
                      value={returnForm.details}
                      onChange={(e) => setReturnForm((f) => ({ ...f, details: e.target.value }))}
                      className="input-field w-full resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Preferred Resolution</label>
                    <div className="flex gap-3">
                      {["refund", "replacement"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReturnForm((f) => ({ ...f, resolution: r }))}
                          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wide border transition-colors ${
                            returnForm.resolution === r
                              ? "bg-brand-brown text-white border-brand-brown"
                              : "border-gray-200 text-gray-500 hover:border-brand-gold"
                          }`}
                        >
                          {r === "refund" ? "Refund" : "Replacement"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={submitReturn}
                    disabled={submittingReturn}
                    className="btn-primary w-full mt-2"
                  >
                    {submittingReturn ? "Submitting..." : "Submit Return Request"}
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-brand-brown text-sm mb-3">Your Requests</h3>
              {loadingReturns ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : returns.length === 0 ? (
                <div className="text-center py-10 bg-white border border-gray-100">
                  <RotateCcw size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No return requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {returns.map((r) => (
                    <div key={r.id} className="card-luxury p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-semibold text-brand-brown text-sm">Order {r.orderId}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                          r.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          r.status === "rejected" ? "bg-red-100 text-red-600" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{r.reason} — {r.resolution}</p>
                      <p className="text-xs text-gray-400 mt-1">{r.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
