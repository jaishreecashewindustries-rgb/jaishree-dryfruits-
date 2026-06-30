import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import SEO from "../components/SEO";
import { PRODUCT_CATEGORIES } from "../utils/helpers";
import { useProducts } from "../context/ProductsContext";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
];

export default function Products() {
  const { products: DEMO_PRODUCTS } = useProducts();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState("featured");

  const activeCategory = params.get("category") || "";
  const activeBadge = params.get("badge") || "";
  const activeGoal = params.get("goal") || "";
  const search = params.get("search") || "";
  const [priceRange, setPriceRange] = useState([0, 5000]);

  const setCategory = (c) => {
    const p = new URLSearchParams(params);
    if (c) p.set("category", c); else p.delete("category");
    setParams(p);
  };

  const filtered = useMemo(() => {
    let list = [...DEMO_PRODUCTS];
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (activeBadge) list = list.filter((p) => p.badge === activeBadge);
    if (activeGoal) list = list.filter((p) => Array.isArray(p.goals) && p.goals.includes(activeGoal));
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
    list = list.filter((p) => {
      const minPrice = Math.min(...p.variants.map((v) => v.price));
      return minPrice >= priceRange[0] && minPrice <= priceRange[1];
    });
    switch (sort) {
      case "price-low": return [...list].sort((a, b) => a.variants[0].price - b.variants[0].price);
      case "price-high": return [...list].sort((a, b) => b.variants[0].price - a.variants[0].price);
      case "rating": return [...list].sort((a, b) => b.rating - a.rating);
      default: return list;
    }
  }, [DEMO_PRODUCTS, activeCategory, activeBadge, activeGoal, search, priceRange, sort]);

  const GOAL_LABELS = { heart: "Heart Health", brain: "Brain Power", energy: "Energy Boost", immunity: "Immunity", weight: "Weight Loss", bones: "Bone Strength", skin: "Skin & Hair", kids: "Kids" };
  const pageTitle = activeCategory || (activeGoal ? GOAL_LABELS[activeGoal] || activeGoal : "") || activeBadge || (search ? `"${search}"` : "All Products");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <SEO
        title={pageTitle !== "All Products" ? `${pageTitle} — Buy Online` : "All Products — Premium Dry Fruits"}
        description={`Buy premium ${pageTitle.toLowerCase()} online. FSSAI certified, free shipping above ₹499. Direct from Kashmir, California & Iran. Delivered across India.`}
      />
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-6">
        <span>Home</span> <span className="mx-2">/</span>
        <span className="text-brand-brown font-medium">{pageTitle}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-semibold text-brand-brown text-sm mb-3 uppercase tracking-wide">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setCategory("")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${!activeCategory ? "bg-brand-gold text-white font-semibold" : "text-gray-600 hover:bg-brand-cream hover:text-brand-brown"}`}
                >
                  All Products ({DEMO_PRODUCTS.length})
                </button>
                {PRODUCT_CATEGORIES.map((c) => {
                  const count = DEMO_PRODUCTS.filter((p) => p.category === c).length;
                  if (!count) return null;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeCategory === c ? "bg-brand-gold text-white font-semibold" : "text-gray-600 hover:bg-brand-cream hover:text-brand-brown"}`}
                    >
                      {c} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-brand-brown text-sm mb-3 uppercase tracking-wide">Price Range</h3>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full accent-brand-gold"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₹0</span><span>Up to ₹{priceRange[1]}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-brand-brown text-sm mb-3 uppercase tracking-wide">Collections</h3>
              <div className="space-y-1">
                {["Best Seller", "New", "Premium", "Limited"].map((b) => (
                  <button
                    key={b}
                    onClick={() => { const p = new URLSearchParams(params); if (activeBadge === b) p.delete("badge"); else p.set("badge", b); setParams(p); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeBadge === b ? "bg-brand-gold text-white font-semibold" : "text-gray-600 hover:bg-brand-cream"}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="font-serif text-2xl font-bold text-brand-brown">{pageTitle}</h1>
              <p className="text-sm text-gray-500">{filtered.length} products found</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFiltersOpen(true)}
                className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:border-brand-gold transition-colors"
              >
                <SlidersHorizontal size={16} /> Filters
              </button>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pr-8 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active filters */}
          {(activeCategory || activeBadge || activeGoal || search) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {activeCategory && (
                <span className="flex items-center gap-1.5 bg-brand-cream border border-brand-gold/30 text-brand-brown text-xs px-3 py-1.5 rounded-full font-medium">
                  {activeCategory}
                  <button onClick={() => setCategory("")}><X size={12} /></button>
                </span>
              )}
              {activeGoal && (
                <span className="flex items-center gap-1.5 bg-brand-cream border border-brand-gold/30 text-brand-brown text-xs px-3 py-1.5 rounded-full font-medium">
                  {GOAL_LABELS[activeGoal] || activeGoal}
                  <button onClick={() => { const p = new URLSearchParams(params); p.delete("goal"); setParams(p); }}><X size={12} /></button>
                </span>
              )}
              {activeBadge && (
                <span className="flex items-center gap-1.5 bg-brand-cream border border-brand-gold/30 text-brand-brown text-xs px-3 py-1.5 rounded-full font-medium">
                  {activeBadge}
                  <button onClick={() => { const p = new URLSearchParams(params); p.delete("badge"); setParams(p); }}><X size={12} /></button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-500 font-medium">No products found</p>
              <button onClick={() => { setParams({}); setPriceRange([0, 5000]); }} className="mt-4 btn-outline">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setFiltersOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-brand-brown">Filters</h3>
              <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Categories</p>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCT_CATEGORIES.filter((c) => DEMO_PRODUCTS.some((p) => p.category === c)).map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setFiltersOpen(false); }}
                    className={`px-3 py-2 rounded-lg text-sm border ${activeCategory === c ? "border-brand-gold bg-brand-cream text-brand-gold font-semibold" : "border-gray-200 text-gray-600"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button onClick={() => setFiltersOpen(false)} className="btn-primary w-full mt-4">Apply Filters</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
