import React, { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { Package, User, Heart, MapPin, LogOut, Star, ChevronRight, Coins } from "lucide-react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useCoins, COINS_RULES } from "../context/CoinsContext";
import { formatPrice, formatDate, getStatusStyle, ORDER_STATUSES } from "../utils/helpers";

const TABS = [
  { id: "orders", label: "My Orders", icon: Package },
  { id: "coins", label: "JS Coins", icon: Coins },
  { id: "profile", label: "Profile", icon: User },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "address", label: "Address", icon: MapPin },
];

export default function UserDashboard() {
  const { user, userProfile, logout } = useAuth();
  const { coins: balance, history: transactions, loading: coinsLoading, redeemCoins } = useCoins();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user?.uid]);

  if (!user) return <Navigate to="/login" state={{ from: "/dashboard" }} />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <div className="bg-brand-brown text-white rounded-2xl p-6 mb-8 flex items-center gap-4">
        <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {userProfile?.displayName?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Hello, {userProfile?.displayName || "Customer"}!</h1>
          <p className="text-white/60 text-sm">{user.email}</p>
          <p className="text-brand-gold text-xs font-semibold mt-1 flex items-center gap-1.5">
            <Coins size={12} /> {balance} JS Coins &nbsp;&middot;&nbsp; Worth ₹{Math.floor(balance * COINS_RULES.redeemRate)}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-3 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-brand-gold text-white" : "text-gray-600 hover:bg-brand-cream hover:text-brand-brown"}`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all mt-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {tab === "orders" && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-brown mb-5">My Orders</h2>
              {loadingOrders ? (
                <div className="space-y-3">
                  {[1,2,3].map((i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl">
                  <Package size={48} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">No orders yet</p>
                  <Link to="/products" className="btn-primary mt-4 inline-block">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="card-luxury p-5">
                      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-brand-brown text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusStyle(order.status)}`}>
                          {ORDER_STATUSES.find((s) => s.value === order.status)?.label || order.status}
                        </span>
                      </div>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <img key={i} src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                        ))}
                        {(order.items?.length || 0) > 3 && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">+{order.items.length - 3}</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-brand-brown">{formatPrice(order.total)}</p>
                        <button className="text-xs text-brand-gold hover:underline flex items-center gap-1">
                          View Details <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "coins" && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold text-brand-brown">JS Coins — My Rewards</h2>

              {/* Balance card */}
              <div className="rounded-2xl p-8 text-center"
                style={{ background: "linear-gradient(135deg, #1B2E4B 0%, #243D63 100%)", border: "1px solid rgba(201,168,76,0.3)" }}>
                <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-3">Total Balance</p>
                <p className="font-serif text-6xl font-bold text-brand-gold mb-2">{balance}</p>
                <p className="text-white/60 text-sm mb-6">JS Coins = ₹{Math.floor(balance * COINS_RULES.redeemRate)} Discount Value</p>
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                  {[
                    { label: "On Signup", val: `${COINS_RULES.signup}` },
                    { label: "Per ₹1 Spent", val: "1 Coin" },
                    { label: "Per Review", val: `${COINS_RULES.review}` },
                  ].map(r => (
                    <div key={r.label} className="text-center border-t border-white/10 pt-4">
                      <p className="font-serif text-2xl font-normal text-white mb-1">{r.val}</p>
                      <p className="text-white/40 text-xs uppercase tracking-wider">{r.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Redeem section */}
              {balance >= COINS_RULES.minRedeem && (
                <div className="card-luxury p-6">
                  <h3 className="font-serif text-lg font-bold text-brand-brown mb-1">Redeem Your Coins</h3>
                  <p className="text-sm text-gray-400 mb-4">Min. {COINS_RULES.minRedeem} coins required. 1 coin = ₹{COINS_RULES.redeemRate} off.</p>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder={`Enter coins (max ${balance})`}
                      min={COINS_RULES.minRedeem}
                      max={balance}
                      value={redeemAmount}
                      onChange={e => setRedeemAmount(e.target.value)}
                      className="input-field flex-1 text-sm"
                    />
                    <button
                      onClick={async () => {
                        const amt = parseInt(redeemAmount);
                        if (!amt || amt < COINS_RULES.minRedeem) return;
                        await redeemCoins(amt, "Manual redemption from dashboard");
                        setRedeemAmount("");
                      }}
                      className="btn-gold px-5 py-2 text-sm"
                    >
                      Redeem {redeemAmount ? `→ Save ₹${Math.floor(parseInt(redeemAmount) * COINS_RULES.redeemRate)}` : ""}
                    </button>
                  </div>
                </div>
              )}
              {balance < COINS_RULES.minRedeem && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-amber-700 text-sm font-medium flex items-center justify-center gap-2">
                    <Coins size={14} /> Earn {COINS_RULES.minRedeem - balance} more coins to unlock redemption
                  </p>
                  <Link to="/products" className="text-xs text-amber-600 underline mt-1 block">Shop Now to Earn Coins</Link>
                </div>
              )}

              {/* Transaction history */}
              <div className="card-luxury overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-serif text-base font-bold text-brand-brown">Transaction History</h3>
                </div>
                {coinsLoading ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    <p>No transactions yet. Start shopping to earn coins!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {transactions.slice(0, 20).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-brand-brown">{tx.description}</p>
                          <p className="text-xs text-gray-400">
                            {tx.createdAt?.toDate?.().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) || "—"}
                          </p>
                        </div>
                        <span className={`font-bold text-sm flex items-center gap-1 ${tx.type === "earn" ? "text-green-600" : "text-red-500"}`}>
                          {tx.type === "earn" ? "+" : "-"}{tx.amount}
                          <Coins size={11} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="card-luxury p-6">
              <h2 className="font-serif text-2xl font-bold text-brand-brown mb-5">My Profile</h2>
              <div className="space-y-4 max-w-md">
                {[
                  { label: "Full Name", value: userProfile?.displayName || "" },
                  { label: "Email", value: user.email },
                  { label: "Phone", value: userProfile?.phone || "Not added" },
                  { label: "Member Since", value: formatDate(userProfile?.createdAt) || "Recently joined" },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">{f.label}</span>
                    <span className="text-sm font-medium text-brand-brown">{f.value}</span>
                  </div>
                ))}
                <button className="btn-outline mt-4">Edit Profile</button>
              </div>
            </div>
          )}

          {tab === "wishlist" && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-brown mb-5">My Wishlist</h2>
              <div className="text-center py-16 bg-white rounded-2xl">
                <Heart size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">Your wishlist is empty</p>
                <Link to="/products" className="btn-primary mt-4 inline-block">Browse Products</Link>
              </div>
            </div>
          )}

          {tab === "address" && (
            <div className="card-luxury p-6">
              <h2 className="font-serif text-2xl font-bold text-brand-brown mb-5">Saved Addresses</h2>
              {userProfile?.address && Object.keys(userProfile.address).length > 0 ? (
                <div className="p-4 border border-gray-200 rounded-xl">
                  <p className="font-semibold text-brand-brown">{userProfile.address.name}</p>
                  <p className="text-sm text-gray-500">{userProfile.address.address}</p>
                  <p className="text-sm text-gray-500">{userProfile.address.city}, {userProfile.address.state} - {userProfile.address.pincode}</p>
                </div>
              ) : (
                <div className="text-center py-10">
                  <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No addresses saved yet</p>
                  <p className="text-xs text-gray-300 mt-1">Addresses are saved automatically when you place an order</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
