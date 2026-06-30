import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitCompare, Trash2 } from "lucide-react";
import { useCompare } from "../context/CompareContext";
import { useProducts } from "../context/ProductsContext";

export default function CompareBar() {
  const { products: DEMO_PRODUCTS } = useProducts();
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  if (compareIds.length === 0) return null;

  const products = compareIds.map((id) => DEMO_PRODUCTS.find((p) => p.id === id)).filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[90] pointer-events-none"
      >
        <div
          className="max-w-3xl mx-auto mb-0 md:mb-4 mx-4 pointer-events-auto"
          style={{ margin: "0 1rem 0 1rem" }}
        >
          <div
            className="rounded-2xl md:rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #1B2E4B, #0D1B35)", border: "1px solid rgba(201,168,76,0.3)" }}
          >
            <GitCompare size={18} className="text-brand-gold flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto no-scrollbar">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2 py-1 flex-shrink-0">
                  <img src={p.images?.[0]} alt={p.name} className="w-7 h-7 rounded-lg object-cover" />
                  <span className="text-white text-xs font-medium max-w-[80px] truncate">{p.name}</span>
                  <button onClick={() => removeFromCompare(p.id)} className="text-white/50 hover:text-white ml-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {compareIds.length < 3 && (
                <div className="flex-shrink-0 w-10 h-9 border border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/30 text-xs">
                  +
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {compareIds.length >= 2 && (
                <Link
                  to={`/compare?ids=${compareIds.join(",")}`}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-brand-brown"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #E8C97A)" }}
                >
                  Compare
                </Link>
              )}
              <button onClick={clearCompare} className="text-white/40 hover:text-white/80 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
