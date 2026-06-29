import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const WishlistContext = createContext(null);
export const useWishlist = () => useContext(WishlistContext);

const LS_KEY = "jsd_wishlist";

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
  });
  const [syncing, setSyncing] = useState(false);

  // On login — merge localStorage wishlist into Firestore, then load from Firestore
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function syncWithFirestore() {
      setSyncing(true);
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const remoteIds = snap.exists() ? (snap.data().wishlist || []) : [];
        const localIds = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
        // Merge: union of remote + local
        const merged = Array.from(new Set([...remoteIds, ...localIds]));
        if (!cancelled) {
          setWishlistIds(merged);
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
          // Persist merged back to Firestore if changed
          if (merged.length !== remoteIds.length) {
            await updateDoc(ref, { wishlist: merged });
          }
        }
      } catch {
        // Firestore unavailable — use localStorage only
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }
    syncWithFirestore();
    return () => { cancelled = true; };
  }, [user?.uid]);

  // On logout — keep localStorage, clear state
  useEffect(() => {
    if (!user) {
      const local = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      setWishlistIds(local);
    }
  }, [user]);

  const addToWishlist = useCallback(async (productId) => {
    const updated = [...wishlistIds, productId];
    setWishlistIds(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    toast.success("Added to wishlist", {
      icon: "♥",
      style: { background: "#3E2723", color: "white" },
      iconTheme: { primary: "#E53E3E", secondary: "white" },
    });
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { wishlist: arrayUnion(productId) });
      } catch {}
    }
  }, [wishlistIds, user]);

  const removeFromWishlist = useCallback(async (productId) => {
    const updated = wishlistIds.filter((id) => id !== productId);
    setWishlistIds(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    toast("Removed from wishlist", { icon: "🗑️" });
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { wishlist: arrayRemove(productId) });
      } catch {}
    }
  }, [wishlistIds, user]);

  const toggleWishlist = useCallback((productId) => {
    if (wishlistIds.includes(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  }, [wishlistIds, addToWishlist, removeFromWishlist]);

  const isWishlisted = useCallback((productId) => wishlistIds.includes(productId), [wishlistIds]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, isWishlisted, toggleWishlist, addToWishlist, removeFromWishlist, syncing }}>
      {children}
    </WishlistContext.Provider>
  );
}
