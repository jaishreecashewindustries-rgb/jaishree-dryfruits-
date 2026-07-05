import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";

// ── JS Coins Rules — 2.5% sweet-spot math ──
// This object is mutated in place (not reassigned) once the live values load
// from settings/coins in Firestore — every file that imports COINS_RULES
// reads its properties at call-time, so the mutation is picked up everywhere
// automatically without needing every consumer to switch to the useCoins()
// hook. Defaults here are the fallback until that doc loads (or if it's empty).
export const COINS_RULES = {
  perOrderRupee: 1,          // 1 coin per ₹1 spent (earn 1,000 coins on ₹1,000 order)
  signup: 50,                // 50 coins on signup
  review: 20,                // 20 coins per review
  referral: 100,             // 100 coins per referral
  birthday: 200,             // 200 coins on birthday
  redeemRate: 0.025,         // 100 coins = ₹2.50  (1 coin = ₹0.025)
  minRedeem: 100,            // minimum 100 coins to redeem
  minCartValue: 999,         // cart must be ≥ ₹999 to unlock redemption
  maxRedeemValue: 50,        // hard ceiling: max ₹50 discount per transaction (= 2,000 coins)
};

const CoinsContext = createContext(null);
export const useCoins = () => useContext(CoinsContext);

export function CoinsProvider({ children }) {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rulesVersion, setRulesVersion] = useState(0);

  // Load the admin-editable rules once on mount — independent of login state,
  // since even guests need the correct minCartValue/redeemRate to see accurate
  // "earn X coins" messaging before they sign in.
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "coins"));
        if (snap.exists()) {
          Object.assign(COINS_RULES, snap.data());
          setRulesVersion((v) => v + 1);
        }
      } catch (e) {
        console.warn("Coins rules load error:", e);
      }
    })();
  }, []);

  // Load coins when user logs in
  useEffect(() => {
    if (!user) { setCoins(0); setHistory([]); return; }
    loadCoins();
  }, [user]);

  async function loadCoins() {
    if (!user) return;
    setLoading(true);
    try {
      const ref = doc(db, "coins", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCoins(snap.data().balance || 0);
      } else {
        // New user — award signup bonus
        await setDoc(ref, { balance: COINS_RULES.signup, userId: user.uid, email: user.email });
        setCoins(COINS_RULES.signup);
        await addCoinTransaction(user.uid, COINS_RULES.signup, "earn", "Welcome bonus — Account created");
      }
      loadHistory();
    } catch (e) {
      console.warn("Coins load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    if (!user) return;
    try {
      const q = query(
        collection(db, "coin_transactions"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
  }

  async function addCoinTransaction(uid, amount, type, description) {
    try {
      await addDoc(collection(db, "coin_transactions"), {
        userId: uid,
        amount,
        type, // "earn" | "redeem" | "expire"
        description,
        createdAt: new Date(),
      });
    } catch (e) {}
  }

  // Award coins for order
  async function earnCoinsForOrder(orderTotal) {
    if (!user) return;
    const earned = Math.floor(orderTotal * COINS_RULES.perOrderRupee);
    if (earned <= 0) return;
    try {
      await updateDoc(doc(db, "coins", user.uid), { balance: increment(earned) });
      await addCoinTransaction(user.uid, earned, "earn", `Order reward — ₹${orderTotal} spent`);
      setCoins(c => c + earned);
    } catch (e) {}
  }

  // Award coins for review
  async function earnCoinsForReview() {
    if (!user) return;
    try {
      await updateDoc(doc(db, "coins", user.uid), { balance: increment(COINS_RULES.review) });
      await addCoinTransaction(user.uid, COINS_RULES.review, "earn", "Review submitted — thank you");
      setCoins(c => c + COINS_RULES.review);
    } catch (e) {}
  }

  // Redeem coins — enforces hard ceiling of ₹50 per transaction
  async function redeemCoins(amount) {
    if (!user || coins < COINS_RULES.minRedeem || amount > coins) return { success: false, message: "Insufficient coins" };
    const maxCoins = Math.ceil(COINS_RULES.maxRedeemValue / COINS_RULES.redeemRate); // 2,000
    const capped = Math.min(amount, maxCoins);
    const discount = parseFloat((capped * COINS_RULES.redeemRate).toFixed(2));
    try {
      await updateDoc(doc(db, "coins", user.uid), { balance: increment(-capped) });
      await addCoinTransaction(user.uid, capped, "redeem", `Redeemed ${capped} coins — ₹${discount} applied`);
      setCoins(c => c - capped);
      return { success: true, discount, coinsUsed: capped, message: `₹${discount} discount applied!` };
    } catch (e) {
      return { success: false, message: "Redemption failed" };
    }
  }

  // Worth in ₹ — exact to 2 decimal places (e.g. 1,500 coins = ₹37.50)
  const coinsWorth = parseFloat((coins * COINS_RULES.redeemRate).toFixed(2));
  const coinsValue = coinsWorth; // alias kept for backwards compatibility

  return (
    <CoinsContext.Provider value={{ coins, coinsValue, coinsWorth, history, loading, earnCoinsForOrder, earnCoinsForReview, redeemCoins, COINS_RULES, rulesVersion, loadHistory }}>
      {children}
    </CoinsContext.Provider>
  );
}
