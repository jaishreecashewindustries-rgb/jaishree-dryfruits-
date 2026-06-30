import React, { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice } from "../utils/helpers";
import { useProducts } from "../context/ProductsContext";
import ProductCard from "../components/ProductCard";

export default function SearchResults() {
  const { products: DEMO_PRODUCTS } = useProducts();
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();

  const results = useMemo(() => {
    if (!q) return [];
    const lower = q.toLowerCase();
    return DEMO_PRODUCTS.filter((p) =>
      p.name?.toLowerCase().includes(lower) ||
      p.category?.toLowerCase().includes(lower) ||
      p.description?.toLowerCase().includes(lower) ||
      p.tags?.some((t) => t.toLowerCase().includes(lower))
    );
  }, [DEMO_PRODUCTS, q]);

  // Popular suggestions if no results
  const suggestions = ["Almonds", "Cashews", "Pistachios", "Walnuts", "Dates", "Gift Hampers"];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-gray-400 hover:text-brand-brown transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Search size={18} className="text-brand-gold" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-brand-brown truncate">
              {q ? `"${q}"` : "Search"}
            </h1>
            <p className="text-xs text-gray-400">
              {q ? `${results.length} result${results.length !== 1 ? "s" : ""} found` : "Search for dry fruits, nuts, gift hampers…"}
            </p>
          </div>
        </div>

        {!q ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Search size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 mb-6">What are you looking for?</p>
            <div className="flex flex-wrap justify-center gap-2 px-4">
              {suggestions.map((s) => (
                <Link
                  key={s}
                  to={`/search?q=${encodeURIComponent(s)}`}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-brand-gold hover:text-brand-gold transition-colors"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Search size={48} className="text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-500 mb-2">No results for "{q}"</h2>
            <p className="text-gray-400 text-sm mb-6">Try searching for almonds, cashews, pistachios, or gift hampers</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6 px-4">
              {suggestions.map((s) => (
                <Link
                  key={s}
                  to={`/search?q=${encodeURIComponent(s)}`}
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-brand-gold hover:text-brand-gold transition-colors"
                >
                  {s}
                </Link>
              ))}
            </div>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              Browse All Products
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {results.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
