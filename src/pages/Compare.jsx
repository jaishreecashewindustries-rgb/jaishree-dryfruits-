import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Check, X, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { DEMO_PRODUCTS, formatPrice } from "../utils/helpers";
import { useCart } from "../context/CartContext";

const per100g = (price, weight) => { const g = parseFloat(weight); return g ? Math.round(price / g * 100) : null; };

const COMPARE_ROWS = [
  { label: "Category",     key: (p) => p.category || "—" },
  { label: "Rating",       key: (p) => p.rating ? `${p.rating} / 5 (${p.reviewCount} reviews)` : "—" },
  { label: "Price (250g)", key: (p) => { const v = p.variants?.find(v => v.weight === "250g") || p.variants?.[0]; return v ? formatPrice(v.price) : "—"; } },
  { label: "Per 100g",     key: (p) => { const v = p.variants?.find(v => v.weight === "250g") || p.variants?.[0]; return v ? `₹${per100g(v.price, v.weight) || "—"}` : "—"; } },
  { label: "In Stock",     key: (p) => p.inStock !== false ? "Yes" : "No", isBoolean: true },
  { label: "Origin",       key: (p) => p.origin || "India" },
  { label: "Shelf Life",   key: (p) => p.shelfLife || "12 months" },
  { label: "Certifications", key: (p) => p.certifications?.join(", ") || "FSSAI Certified" },
  { label: "Processing",   key: (p) => p.processing || "Natural, no additives" },
  { label: "Packaging",    key: (p) => p.packaging || "Vacuum-sealed pouch" },
];

export default function Compare() {
  const [params] = useSearchParams();
  const ids = (params.get("ids") || "").split(",").filter(Boolean);
  const { addToCart } = useCart();

  const products = ids.map((id) => DEMO_PRODUCTS.find((p) => p.id === id)).filter(Boolean);

  if (products.length < 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center pb-32">
        <p className="text-gray-400 mb-4">Select at least 2 products to compare.</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const colW = products.length === 2 ? "w-1/2" : "w-1/3";

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/products" className="text-gray-400 hover:text-brand-brown transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-brand-brown">Product Comparison</h1>
          <p className="text-xs text-gray-400">Comparing {products.length} products side by side</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 overflow-x-auto">
        <table className="w-full min-w-[480px]">
          {/* Product image row */}
          <thead>
            <tr>
              <th className="w-28 md:w-40 py-4 text-left">
                <span className="text-xs text-gray-400 font-normal">Features</span>
              </th>
              {products.map((p) => (
                <th key={p.id} className={`${colW} py-4 px-2 text-center`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <Link to={`/product/${p.id}`}>
                      <img
                        src={p.images?.[0]}
                        alt={p.name}
                        className="w-20 h-20 md:w-28 md:h-28 object-cover rounded-2xl shadow-md hover:scale-105 transition-transform"
                      />
                    </Link>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{p.category}</p>
                    <Link to={`/product/${p.id}`}>
                      <p className="font-semibold text-sm text-brand-brown text-center leading-snug hover:text-brand-gold transition-colors">
                        {p.name}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={10} className={s <= Math.round(p.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const v = p.variants?.[0];
                        if (v) addToCart({ id: p.id, name: p.name, variant: v.weight, price: v.price, image: p.images?.[0] });
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-brown text-white hover:bg-brand-gold hover:text-brand-brown transition-colors mt-1"
                    >
                      <ShoppingCart size={11} /> Add to Cart
                    </button>
                  </motion.div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Comparison rows */}
          <tbody>
            {COMPARE_ROWS.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                <td className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 md:w-40">
                  {row.label}
                </td>
                {products.map((p) => {
                  const val = row.key(p);
                  const isYes = val === "Yes";
                  const isNo = val === "No";
                  return (
                    <td key={p.id} className="py-3 px-2 text-center">
                      {row.isBoolean ? (
                        isYes
                          ? <Check size={16} className="text-green-500 mx-auto" />
                          : <X size={16} className="text-red-400 mx-auto" />
                      ) : (
                        <span className="text-sm text-gray-700">{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
