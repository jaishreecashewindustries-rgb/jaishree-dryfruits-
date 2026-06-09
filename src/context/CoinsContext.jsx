import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";

// ── JS Coins Rules ──
export const COINS_RULES = {
  perOrderRupee: 1,        // 1 coin per ₹1 spent
  signup: 50,              // 50 coins on signup
  review: 20,              // 20 coins per review
  referral: 100,           // 100 coins per referral
  birthday: 200,           // 200 coins on birthday
  redeemRate: 0.25,        // 1 coin = ₹0.25 discount
  minRedeem: 100,          // minimum 100 coins to redeem
};

const CoinsContext = createContext(null);
export const useCoins = () => useContext(CoinsContext);

export function CoinsProvider({ children }) {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Redeem coins
  async function redeemCoins(amount) {
    if (!user || coins < COINS_RULES.minRedeem || amount > coins) return { success: false, message: "Insufficient coins" };
    try {
      await updateDoc(doc(db, "coins", user.uid), { balance: increment(-amount) });
      await addCoinTransaction(user.uid, amount, "redeem", `Redeemed for discount — ₹${amount * COINS_RULES.redeemRate} applied`);
      setCoins(c => c - amount);
      const discount = amount * COINS_RULES.redeemRate;
      return { success: true, discount, message: `₹${discount} discount applied!` };
    } catch (e) {
      return { success: false, message: "Redemption failed" };
    }
  }

  const coinsValue = Math.floor(coins * COINS_RULES.redeemRate);

  return (
    <CoinsContext.Provider value={{ coins, coinsValue, history, loading, earnCoinsForOrder, earnCoinsForReview, redeemCoins, COINS_RULES, loadHistory }}>
      {children}
    </CoinsContext.Provider>
  );
}
