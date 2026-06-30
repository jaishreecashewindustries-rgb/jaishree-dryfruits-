import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { DEMO_PRODUCTS } from "../utils/helpers";

const ProductsContext = createContext({ products: DEMO_PRODUCTS, loading: true, refresh: () => {} });
export const useProducts = () => useContext(ProductsContext);

// Live product catalogue — Firestore "products" collection (managed via
// /admin/products) merged with the built-in demo catalogue as a fallback
// for any product the admin hasn't replaced/added yet. Without this, admin
// product edits never reach the storefront.
export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "products"));
      if (!snap.empty) {
        const live = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const liveIds = new Set(live.map((p) => p.id));
        const demoOnly = DEMO_PRODUCTS.filter((p) => !liveIds.has(p.id));
        setProducts([...live, ...demoOnly]);
      }
    } catch {
      // keep demo fallback silently — storefront still works offline/pre-auth
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, refresh: fetchProducts }}>
      {children}
    </ProductsContext.Provider>
  );
}
