import React, { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";

const CompareContext = createContext(null);
export const useCompare = () => useContext(CompareContext);

const MAX = 3;

export function CompareProvider({ children }) {
  const [compareIds, setCompareIds] = useState([]);

  const addToCompare = (productId) => {
    if (compareIds.includes(productId)) return;
    if (compareIds.length >= MAX) {
      toast.error(`Max ${MAX} products can be compared at once`);
      return;
    }
    setCompareIds((prev) => [...prev, productId]);
    toast.success("Added to compare", { icon: "⚖️", duration: 1500 });
  };

  const removeFromCompare = (productId) => {
    setCompareIds((prev) => prev.filter((id) => id !== productId));
  };

  const clearCompare = () => setCompareIds([]);

  const isInCompare = (productId) => compareIds.includes(productId);

  return (
    <CompareContext.Provider value={{ compareIds, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}
