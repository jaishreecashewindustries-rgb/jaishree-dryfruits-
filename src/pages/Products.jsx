import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronDown, Search } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { SkeletonCard } from "../components/SkeletonCard";
import SEO from "../components/SEO";
import { PRODUCT_CATEGORIES } from "../utils/helpers";
import { useProducts } from "../context/ProductsContext";
import { useSiteSettings } from "../context/SiteSettingsContext";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
];

export default function Products() {
  const { products: DEMO_PRODUCTS, loading: productsLoading } = useProducts();
  const { categories: liveCategories, productsHeader } = useSiteSettings() || {};
  // Category tiles/photos are admin-managed (Category Management page);
  // fall back to the static name list until Firestore data loads.
  const categoryList = liveCategories?.length ? liveCategories : PRODUCT_CATEGORIES.map((name) => ({ name }));
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState("featured");

  const activeCategory = params.get("category") || "";
  const activeBadge = params.get("badge") || "";
  const activeGoal = params.get("goal") || "";
  const search = params.get("search") || "";
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeWeight, setActiveWeight] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [seoOpen, setSeoOpen] = useState(false);

  const setCategory = (c) => {
    const p = new URLSearchParams(params);
    if (c) p.set("category", c); else p.delete("category");
    setParams(p);
  };

  const weightOptions = useMemo(() => {
    const set = new Set();
    DEMO_PRODUCTS.forEach((p) => p.variants.forEach((v) => set.add(v.weight)));
    return [...set].sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [DEMO_PRODUCTS]);

  const filtered = useMemo(() => {
    let list = [...DEMO_PRODUCTS];
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (activeBadge) list = list.filter((p) => p.badge === activeBadge);
    if (activeGoal) list = list.filter((p) => Array.isArray(p.goals) && p.goals.includes(activeGoal));
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
    if (activeWeight) list = list.filter((p) => p.variants.some((v) => v.weight === activeWeight));
    if (inStockOnly) list = list.filter((p) => p.variants.some((v) => v.stock > 0));
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
  }, [DEMO_PRODUCTS, activeCategory, activeBadge, activeGoal, search, priceRange, sort, activeWeight, inStockOnly]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Reset pagination whenever the active filter set changes, not on every
  // render — otherwise "Load More" clicks would immediately get wiped out
  // by the next filtered-array recompute.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, activeBadge, activeGoal, search, activeWeight, inStockOnly, priceRange[1], sort]);

  const resetFilters = () => {
    setParams({});
    setPriceRange([0, 5000]);
    setInStockOnly(false);
    setActiveWeight("");
    setVisibleCount(PAGE_SIZE);
  };

  const GOAL_LABELS = { heart: "Heart Health", brain: "Brain Power", energy: "Energy Boost", immunity: "Immunity", weight: "Weight Loss", bones: "Bone Strength", skin: "Skin & Hair", kids: "Kids" };
  const pageTitle = activeCategory || (activeGoal ? GOAL_LABELS[activeGoal] || activeGoal : "") || activeBadge || (search ? `"${search}"` : "All Products");

  // Collection Hero image: the selected category's own banner when one is
  // set from Admin > Categories, otherwise the site-wide "All Products"
  // header image, falling back to the original stock photo if neither is
  // configured yet.
  const activeCategoryData = activeCategory ? categoryList.find((c) => c.name === activeCategory) : null;
  const heroImage = activeCategoryData?.headerImage || (!activeCategory ? productsHeader?.image : "") ||
    "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=1600&q=80";
  const heroSubtitle = !activeCategory && productsHeader?.subtitle
    ? productsHeader.subtitle
    : (activeCategory ? `Premium ${activeCategory.toLowerCase()}, sourced direct.` : "");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen" data-prerender-ready={productsLoading ? "false" : "true"}>
      <SEO
        title={pageTitle !== "All Products" ? `${pageTitle} — Buy Online` : "All Products — Premium Dry Fruits"}
        description={`Buy premium ${pageTitle.toLowerCase()} online. FSSAI certified, free shipping above ₹499. Direct from Kashmir, California & Iran. Delivered across India.`}
        // Only ?category=X is a real indexed page (see CATEGORY_ROUTES in
        // scripts/prerender.js) — ?search=/?badge=/?goal= produce thin,
        // near-infinite URL variations that would otherwise self-canonicalize
        // and dilute crawl signal per Bing/Google's duplicate-URL guidance.
        canonical={activeCategory ? `https://jaishreedryfruits.com/products?category=${encodeURIComponent(activeCategory)}` : "https://jaishreedryfruits.com/products"}
        noIndex={!!(search || activeBadge || activeGoal)}
        breadcrumb={[
          { name: "Home", url: "https://jaishreedryfruits.com/" },
          { name: pageTitle, url: "https://jaishreedryfruits.com/products" },
        ]}
        itemList={filtered.map((p) => ({ name: p.name, url: `https://jaishreedryfruits.com/product/${p.id}` }))}
      />
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-6">
        <span>Home</span> <span className="mx-2">/</span>
        <span className="text-brand-brown font-medium">{pageTitle}</span>
      </div>

      {/* ── Collection Hero — image + title only, no promo/shipping copy ──
          Image managed from Admin > Categories (per-category banner, or the
          site-wide "All Products" header when no category is selected). ── */}
      <div className="relative rounded-2xl overflow-hidden mb-8" style={{ aspectRatio: "21/6", background: "var(--navy)" }}>
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif font-extrabold text-2xl md:text-4xl text-white">
            {(!activeCategory && productsHeader?.title) || pageTitle}
          </h1>
          {heroSubtitle && (
            <p className="text-white/70 text-sm mt-1.5 hidden md:block">{heroSubtitle}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-semibold text-brand-brown text-xs mb-3 uppercase tracking-[2px]">Categories</h3>
              <div className="space-y-0.5">
                <button
                  onClick={() => setCategory("")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!activeCategory ? "font-semibold" : "text-gray-500 hover:bg-brand-cream/50"}`}
                  style={!activeCategory ? { background: "var(--cream)", color: "var(--navy)" } : undefined}
                >
                  All Products ({DEMO_PRODUCTS.length})
                </button>
                {categoryList.map(({ name: c }) => {
                  const count = DEMO_PRODUCTS.filter((p) => p.category === c).length;
                  if (!count) return null;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === c ? "font-semibold" : "text-gray-500 hover:bg-brand-cream/50"}`}
                      style={activeCategory === c ? { background: "var(--cream)", color: "var(--navy)" } : undefined}
                    >
                      {c} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-brand-brown text-xs mb-3 uppercase tracking-[2px]">Price Range</h3>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full accent-brand-gold"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>₹0</span><span>Up to ₹{priceRange[1]}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-brand-brown text-xs mb-3 uppercase tracking-[2px]">Collections</h3>
              <div className="space-y-0.5">
                {["Best Seller", "New", "Premium", "Limited"].map((b) => (
                  <button
                    key={b}
                    onClick={() => { const p = new URLSearchParams(params); if (activeBadge === b) p.delete("badge"); else p.set("badge", b); setParams(p); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeBadge === b ? "font-semibold" : "text-gray-500 hover:bg-brand-cream/50"}`}
                    style={activeBadge === b ? { background: "var(--cream)", color: "var(--navy)" } : undefined}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-brand-brown text-xs mb-3 uppercase tracking-[2px]">Pack Size</h3>
              <div className="flex flex-wrap gap-1.5">
                {weightOptions.map((w) => (
                  <button
                    key={w}
                    onClick={() => setActiveWeight(activeWeight === w ? "" : w)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeWeight === w ? "border-brand-gold bg-brand-cream text-brand-brown" : "border-gray-200 text-gray-500 hover:border-brand-gold"}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-brand-brown text-xs mb-3 uppercase tracking-[2px]">Availability</h3>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer min-h-[44px]">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-brand-gold w-4 h-4" />
                In Stock Only
              </label>
            </div>

            {(activeCategory || activeBadge || activeGoal || search || activeWeight || inStockOnly || priceRange[1] < 5000) && (
              <button onClick={resetFilters} className="w-full text-center text-xs font-semibold text-brand-gold hover:underline py-2">
                Reset Filters
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar — compact: product count + sort only (title lives in the Collection Hero above) */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <p className="text-sm text-gray-500">{filtered.length} products found</p>
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
          {(activeCategory || activeBadge || activeGoal || search || activeWeight || inStockOnly) && (
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
              {activeWeight && (
                <span className="flex items-center gap-1.5 bg-brand-cream border border-brand-gold/30 text-brand-brown text-xs px-3 py-1.5 rounded-full font-medium">
                  {activeWeight}
                  <button onClick={() => setActiveWeight("")}><X size={12} /></button>
                </span>
              )}
              {inStockOnly && (
                <span className="flex items-center gap-1.5 bg-brand-cream border border-brand-gold/30 text-brand-brown text-xs px-3 py-1.5 rounded-full font-medium">
                  In Stock Only
                  <button onClick={() => setInStockOnly(false)}><X size={12} /></button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {visible.map((p, i) => (
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
              {hasMore && (
                <div className="text-center mt-10">
                  <button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="btn-outline px-8 py-3">
                    Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24">
              <Search size={36} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">No products found</p>
              <button onClick={resetFilters} className="mt-4 btn-outline">
                Clear Filters
              </button>
            </div>
          )}

          {/* SEO content — collapsed by default, doesn't interrupt shopping */}
          {!productsLoading && filtered.length > 0 && (
            <div className="mt-14 pt-6 border-t border-gray-100">
              <button
                onClick={() => setSeoOpen((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-brand-gold transition-colors"
              >
                About {pageTitle} <ChevronDown size={14} className={`transition-transform ${seoOpen ? "rotate-180" : ""}`} />
              </button>
              {seoOpen && (
                <p className="text-sm text-gray-500 leading-relaxed mt-3 max-w-3xl">
                  Shop premium {pageTitle.toLowerCase()} online at Jai Shree Dryfruits — sourced direct from origin
                  farms in Kashmir, California &amp; Iran, FSSAI certified, lab-tested for purity, and vacuum-sealed
                  fresh. Free shipping on orders above ₹499, delivered across India within 2–5 business days.
                </p>
              )}
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
                {categoryList.map((c) => c.name).filter((c) => DEMO_PRODUCTS.some((p) => p.category === c)).map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setFiltersOpen(false); }}
                    className={`px-3 py-2 rounded-lg text-sm border ${activeCategory === c ? "border-brand-gold bg-brand-cream text-brand-gold font-semibold" : "border-gray-200 text-gray-600"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase pt-2">Pack Size</p>
              <div className="flex flex-wrap gap-2">
                {weightOptions.map((w) => (
                  <button
                    key={w}
                    onClick={() => setActiveWeight(activeWeight === w ? "" : w)}
                    className={`px-3 py-2 rounded-full text-sm border ${activeWeight === w ? "border-brand-gold bg-brand-cream text-brand-gold font-semibold" : "border-gray-200 text-gray-600"}`}
                  >
                    {w}
                  </button>
                ))}
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase pt-2">Availability</p>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer min-h-[44px]">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-brand-gold w-4 h-4" />
                In Stock Only
              </label>

              <div className="flex gap-3 mt-4">
                <button onClick={() => { resetFilters(); setFiltersOpen(false); }} className="btn-outline flex-1">Reset</button>
                <button onClick={() => setFiltersOpen(false)} className="btn-primary flex-1">Apply Filters</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
