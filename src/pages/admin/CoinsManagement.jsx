import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { COINS_RULES } from "../../context/CoinsContext";
import { Coins, TrendingUp, Users, Gift, Edit2, Save, X } from "lucide-react";
import toast from "react-hot-toast";

const RULE_FIELDS = [
  { key: "perOrderRupee", label: "Coins per ₹1 spent", step: "0.1" },
  { key: "signup", label: "Signup bonus (coins)", step: "1" },
  { key: "review", label: "Review bonus (coins)", step: "1" },
  { key: "referral", label: "Referral bonus (coins)", step: "1" },
  { key: "birthday", label: "Birthday bonus (coins)", step: "1" },
  { key: "redeemRate", label: "₹ value per coin (redeem rate)", step: "0.001" },
  { key: "minRedeem", label: "Minimum coins to redeem", step: "1" },
  { key: "minCartValue", label: "Minimum cart value to unlock (₹)", step: "1" },
  { key: "maxRedeemValue", label: "Max discount per order (₹)", step: "1" },
];

export default function CoinsManagement() {
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [editingRules, setEditingRules] = useState(false);
  const [rulesForm, setRulesForm] = useState(COINS_RULES);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => { load(); }, []);

  const startEditRules = () => { setRulesForm({ ...COINS_RULES }); setEditingRules(true); };

  const saveRules = async () => {
    setSavingRules(true);
    try {
      const cleaned = Object.fromEntries(
        RULE_FIELDS.map((f) => [f.key, Number(rulesForm[f.key])])
      );
      await setDoc(doc(db, "settings", "coins"), cleaned, { merge: true });
      Object.assign(COINS_RULES, cleaned);
      setEditingRules(false);
      toast.success("JS Coins rules updated — live on the website now");
    } catch (e) {
      toast.error("Failed to save rules");
    } finally {
      setSavingRules(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [bSnap, tSnap] = await Promise.all([
        getDocs(collection(db, "coins")),
        getDocs(query(collection(db, "coin_transactions"), orderBy("createdAt", "desc"))),
      ]);
      setBalances(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTransactions(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
    setLoading(false);
  };

  const totalCoins = balances.reduce((a, b) => a + (b.balance || 0), 0);
  const totalEarned = transactions.filter(t => t.type === "earn").reduce((a, t) => a + (t.amount || 0), 0);
  const totalRedeemed = transactions.filter(t => t.type === "redeem").reduce((a, t) => a + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-brown">JS Coins — Loyalty Programme</h1>
        <p className="text-sm text-gray-400">Manage customer loyalty rewards</p>
      </div>

      {/* Rules Banner */}
      <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, #1B2E4B, #243D63)", border: "1px solid rgba(201,168,76,0.3)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-brand-gold text-xs font-bold tracking-widest uppercase">Current Rewards Rules</p>
          {!editingRules && (
            <button onClick={startEditRules} className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors">
              <Edit2 size={12} /> Edit
            </button>
          )}
        </div>

        {!editingRules ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Per ₹1 Spent", val: `${COINS_RULES.perOrderRupee} Coin` },
              { label: "Signup Bonus", val: `${COINS_RULES.signup} Coins` },
              { label: "Review Bonus", val: `${COINS_RULES.review} Coins` },
              { label: "Redeem Rate", val: `₹${COINS_RULES.redeemRate}/Coin` },
            ].map(r => (
              <div key={r.label} className="text-center">
                <p className="font-serif text-2xl font-normal text-white mb-1">{r.val}</p>
                <p className="text-white/40 text-xs uppercase tracking-wider">{r.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {RULE_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1">{f.label}</label>
                  <input
                    type="number"
                    step={f.step}
                    value={rulesForm[f.key]}
                    onChange={(e) => setRulesForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-white/10 text-white border border-white/20 focus:border-brand-gold focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={saveRules} disabled={savingRules} className="flex items-center gap-2 bg-brand-gold text-brand-brown font-semibold px-4 py-2 rounded-lg text-sm">
                <Save size={14} /> {savingRules ? "Saving..." : "Save & Publish Live"}
              </button>
              <button onClick={() => setEditingRules(false)} className="flex items-center gap-2 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm border border-white/20">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", val: balances.length, icon: Users, color: "#1B2E4B" },
          { label: "Coins in Circulation", val: totalCoins.toLocaleString("en-IN"), icon: Coins, color: "#C9A84C" },
          { label: "Total Earned", val: totalEarned.toLocaleString("en-IN"), icon: TrendingUp, color: "#27ae60" },
          { label: "Total Redeemed", val: totalRedeemed.toLocaleString("en-IN"), icon: Gift, color: "#e74c3c" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: s.color + "15" }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <p className="font-bold text-2xl text-brand-brown">{s.val}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0" style={{ borderBottom: "2px solid #E2E8F0" }}>
        {["overview", "transactions"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${tab === t ? "text-brand-brown border-b-2 border-brand-gold -mb-0.5" : "text-gray-400"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* User Balances */}
      {tab === "overview" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : balances.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Coins size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No coins data yet. Customers earn coins when they place orders.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Email</th><th>Balance</th><th>Value (₹)</th></tr></thead>
              <tbody>
                {balances.sort((a, b) => (b.balance || 0) - (a.balance || 0)).map(b => (
                  <tr key={b.id}>
                    <td className="text-sm">{b.email || b.userId}</td>
                    <td><span className="coin-badge">🪙 {b.balance || 0}</span></td>
                    <td className="text-green-600 font-semibold">₹{Math.floor((b.balance || 0) * COINS_RULES.redeemRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Transactions */}
      {tab === "transactions" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No transactions yet</div>
          ) : (
            <table className="admin-table">
              <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead>
              <tbody>
                {transactions.slice(0, 50).map(t => (
                  <tr key={t.id}>
                    <td className="text-xs truncate max-w-[120px]">{t.userId}</td>
                    <td><span className={`text-xs px-2 py-1 font-semibold rounded ${t.type === "earn" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{t.type}</span></td>
                    <td className={`font-bold ${t.type === "earn" ? "text-green-600" : "text-red-500"}`}>{t.type === "earn" ? "+" : "-"}{t.amount}</td>
                    <td className="text-xs text-gray-500">{t.description}</td>
                    <td className="text-xs text-gray-400">{t.createdAt?.toDate?.().toLocaleDateString("en-IN") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
