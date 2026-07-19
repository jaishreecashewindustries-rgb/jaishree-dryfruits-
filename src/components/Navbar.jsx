import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, User, Search, Menu, X, Heart, ChevronDown, LogOut, LayoutDashboard, Package, Compass, BookOpen, MapPin, HelpCircle, Truck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useProducts } from "../context/ProductsContext";
import { PRODUCT_CATEGORIES, formatPrice } from "../utils/helpers";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

const RECENT_SEARCHES_KEY = "jsd_recent_searches";
const TRENDING_SEARCHES = ["Almonds", "Cashews", "Pistachios", "Gift Hampers", "Dates"];

function loadRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || []; } catch { return []; }
}
function saveRecentSearch(term) {
  const cur = loadRecentSearches().filter((t) => t.toLowerCase() !== term.toLowerCase());
  const next = [term, ...cur].slice(0, 5);
  try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
  return next;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, userProfile, isAdmin, logout } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const { tr } = useLanguage();
  const { siteContent, categories } = useSiteSettings() || {};
  const trustItems = siteContent?.trust?.items || [];
  const navigate = useNavigate();
  const location = useLocation();
  const { products } = useProducts();
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    if (searchOpen) setRecentSearches(loadRecentSearches());
  }, [searchOpen]);

  // Predictive matches — filters the already-loaded catalogue client-side
  // (no extra network call / search index needed) against name and category.
  const liveMatches = searchQuery.trim().length >= 2
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const runSearch = (term) => {
    if (!term.trim()) return;
    setRecentSearches(saveRecentSearch(term.trim()));
    navigate(`/products?search=${encodeURIComponent(term.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  useEffect(() => {
    // rAF-throttled + passive — an unthrottled, non-passive scroll listener
    // firing setState on every scroll event was a real source of jank.
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setShopMenuOpen(false);
    setUserMenuOpen(false);
    setMobileCategoriesOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useBodyScrollLock(menuOpen);

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(searchQuery);
  };

  return (
    <>
      {/* Header block — announcement bar + main nav frozen together at the
          top of the viewport, so the promo strip doesn't disappear on scroll. */}
      <div className="sticky top-0 z-50">
        {/* ── Announcement Bar — one clean, brand-colour bar (was two mismatched
               marquees stacked, in a dark-green gradient that didn't match the
               site's actual navy/gold palette anywhere else) ── */}
        <div className="overflow-hidden bg-brand-brown">
          <div
            className="marquee-track flex items-center whitespace-nowrap py-2"
            style={{ width: "max-content" }}
          >
            {(() => {
              const messages = [
                tr("freeDeliveryBanner"),
                tr("fssaiBanner"),
                tr("yearsBanner"),
                ...trustItems.map((t) => `${t.icon} ${t.text}`),
              ];
              return [...messages, ...messages];
            })().map((msg, i) => (
              <span key={i} className="inline-flex items-center text-[11px] font-semibold tracking-wide text-white/90 px-6">
                {msg}
                <span className="ml-6 text-brand-gold">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Main navbar */}
        <nav className={`transition-shadow duration-300 bg-white ${scrolled ? "shadow-md" : ""}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu toggle */}
            <button
              className="md:hidden w-11 h-11 flex items-center justify-center"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={24} className="text-brand-brown" /> : <Menu size={24} className="text-brand-brown" />}
            </button>

            {/* Logo — image only, brand name is baked into the artwork.
                Absolutely centered on mobile so it stays dead-center regardless of
                the hamburger/search/cart icon widths on either side. */}
            <Link to="/" className="flex items-center group absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0">
              <img
                src="/logo.png"
                alt="Jai Shree Dry Fruits"
                style={{ height: 52, width: "auto" }}
                className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="nav-link text-sm">{tr("home")}</Link>

              {/* Shop dropdown */}
              <div className="relative" onMouseEnter={() => setShopMenuOpen(true)} onMouseLeave={() => setShopMenuOpen(false)}>
                <button className="nav-link text-sm flex items-center gap-1">
                  {tr("shop")} <ChevronDown size={14} className={`transition-transform duration-300 ${shopMenuOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {shopMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50"
                    >
                      <Link to="/products" className="block text-sm font-semibold text-brand-gold mb-3 hover:underline">
                        {tr("products")}
                      </Link>
                      <div className="grid grid-cols-2 gap-1">
                        {PRODUCT_CATEGORIES.slice(0, 8).map((c) => (
                          <Link key={c} to={`/products?category=${c}`} className="text-xs text-gray-600 hover:text-brand-gold hover:bg-brand-cream px-2 py-1 rounded transition-all">
                            {c}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-gray-100 mt-3 pt-3">
                        <Link to="/products?badge=Best Seller" className="text-xs text-brand-warm font-semibold hover:underline block mb-1">🔥 {tr("bestSellers")}</Link>
                        <Link to="/products?badge=New" className="text-xs text-green-600 font-semibold hover:underline block">✨ {tr("newArrivals")}</Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Explore dropdown */}
              <div className="relative" onMouseEnter={() => setExploreMenuOpen(true)} onMouseLeave={() => setExploreMenuOpen(false)}>
                <button className="nav-link text-sm flex items-center gap-1">
                  {tr("explore")} <ChevronDown size={14} className={`transition-transform duration-300 ${exploreMenuOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {exploreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50"
                    >
                      {[
                        { to: "/sourcing", label: tr("sourcingStory"), icon: <MapPin size={14} /> },
                        { to: "/blog", label: tr("ourBlog"), icon: <BookOpen size={14} /> },
                        { to: "/track-order", label: tr("trackOrder"), icon: <Truck size={14} /> },
                        { to: "/faq", label: tr("faqs"), icon: <HelpCircle size={14} /> },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:text-brand-gold hover:bg-brand-cream transition-all"
                        >
                          {item.icon} {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/products?category=Gift Hampers" className="nav-link text-sm">{tr("giftHampers")}</Link>
              <Link to="/about" className="nav-link text-sm">{tr("about")}</Link>
              <Link to="/contact" className="nav-link text-sm">{tr("contact")}</Link>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* Search */}
              <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Search" className="w-11 h-11 flex items-center justify-center hover:bg-brand-cream rounded-lg transition-colors">
                <Search size={20} className="text-brand-brown" />
              </button>

              {/* Wishlist (desktop) */}
              {user && (
                <Link to="/wishlist" aria-label="Wishlist" className="hidden md:flex w-11 h-11 items-center justify-center hover:bg-brand-cream rounded-lg transition-colors">
                  <Heart size={20} className="text-brand-brown" />
                </Link>
              )}

              {/* Cart */}
              <button onClick={toggleCart} aria-label="Cart" className="relative w-11 h-11 flex items-center justify-center hover:bg-brand-cream rounded-lg transition-colors">
                <ShoppingCart size={20} className="text-brand-brown" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-gold text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>

              {/* User menu */}
              {user ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} aria-label="Account menu" aria-expanded={userMenuOpen} className="flex items-center gap-2 min-w-[44px] min-h-[44px] px-2 hover:bg-brand-cream rounded-lg transition-colors">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 bg-brand-gold rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(userProfile?.displayName || user.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <ChevronDown size={12} className="hidden md:block text-gray-500" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 animate-fade-in z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-brand-brown truncate">{userProfile?.displayName || "User"}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-brand-cream hover:text-brand-brown transition-colors">
                        <Package size={16} /> {tr("myOrders")}
                      </Link>
                      <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-brand-cream hover:text-brand-brown transition-colors">
                        <User size={16} /> {tr("myProfile")}
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-gold font-semibold hover:bg-brand-cream transition-colors">
                          <LayoutDashboard size={16} /> {tr("adminDashboard")}
                        </Link>
                      )}
                      <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                        <LogOut size={16} /> {tr("signOut")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-1 text-sm font-medium text-brand-brown hover:text-brand-gold transition-colors p-2 md:px-3 md:py-2 hover:bg-brand-cream rounded-lg">
                  <User size={20} className="md:hidden" />
                  <User size={18} className="hidden md:block" />
                  <span className="hidden md:inline">{tr("account")}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search bar overlay — predictive matches from the loaded catalogue,
            recent searches (localStorage), trending searches, empty state */}
        {searchOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 animate-slide-up">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr("searchPlaceholder")}
                className="input-field flex-1"
                style={{ fontSize: "16px" }}
                aria-label="Search products"
              />
              <button type="submit" className="btn-primary py-3 px-6">{tr("searchBtn")}</button>
            </form>

            <div className="max-w-2xl mx-auto">
              {searchQuery.trim().length >= 2 ? (
                liveMatches.length > 0 ? (
                  <ul className="mt-2 divide-y divide-gray-100">
                    {liveMatches.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/product/${p.id}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                          className="flex items-center gap-3 py-2.5 min-h-[44px] hover:bg-brand-cream transition-colors rounded-lg px-2"
                        >
                          <img src={p.images?.[0]} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-brand-brown truncate">{p.name}</span>
                            <span className="block text-xs text-gray-400">{p.category}</span>
                          </span>
                          <span className="text-sm font-bold text-brand-brown flex-shrink-0">{formatPrice(p.variants?.[0]?.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-4 text-sm text-gray-400 text-center">
                    No products found for "{searchQuery}" — try Almonds, Cashews, or Gift Hampers.
                  </p>
                )
              ) : (
                <div className="pt-3 pb-1 space-y-3">
                  {recentSearches.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Recent Searches</p>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => runSearch(t)}
                            className="text-xs font-semibold px-3 py-2 min-h-[36px] rounded-full bg-gray-100 text-gray-600 hover:bg-brand-cream transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Trending Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => runSearch(t)}
                          className="text-xs font-semibold px-3 py-2 min-h-[36px] rounded-full bg-brand-cream text-brand-brown hover:bg-brand-gold hover:text-white transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        </nav>
      </div>

      {/* Mobile menu — full-screen overlay from the very top (marquee/trust bar height varies,
          so this can't rely on the nav's own height); carries its own header with logo + close. */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] bg-white animate-slide-up flex flex-col">
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 flex-shrink-0">
            <button className="w-11 h-11 flex items-center justify-center -ml-1" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X size={24} className="text-brand-brown" />
            </button>
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center">
              <img src="/logo.png" alt="Jai Shree Dry Fruits" style={{ height: 44, width: "auto" }} />
            </Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)} aria-label="Cart" className="w-11 h-11 flex items-center justify-center -mr-1 relative">
              <ShoppingCart size={22} className="text-brand-brown" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>
              )}
            </Link>
          </div>
          <div className="px-4 py-3 space-y-0.5 overflow-y-auto overscroll-contain flex-1 min-h-0">
            <Link to="/" className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors">
              <Compass size={17} className="text-brand-gold" /> {tr("home")}
            </Link>
            <button
              type="button"
              onClick={() => setMobileCategoriesOpen((v) => !v)}
              className="w-full flex items-center justify-between min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors"
            >
              <span className="flex items-center gap-3"><Package size={17} className="text-brand-gold" /> {tr("allProducts")}</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${mobileCategoriesOpen ? "rotate-180" : ""}`} />
            </button>
            <motion.div
              initial={false}
              animate={{ height: mobileCategoriesOpen ? "auto" : 0, opacity: mobileCategoriesOpen ? 1 : 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div className="pl-9 pr-2 pb-2 grid grid-cols-3 gap-3">
                {PRODUCT_CATEGORIES.map((c) => {
                  const catData = categories?.find((x) => x.name === c);
                  return (
                    <Link key={c} to={`/products?category=${c}`} className="flex flex-col items-center gap-1.5 text-center group">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-cream flex-shrink-0 border border-transparent group-active:border-brand-gold transition-colors">
                        {catData?.img && <img src={catData.img} alt="" loading="lazy" className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[11px] text-gray-600 group-active:text-brand-gold transition-colors leading-tight">{c}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
            <Link to="/products?category=Gift Hampers" className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors">
              <ShoppingCart size={17} className="text-brand-gold" /> {tr("giftHampers")}
            </Link>
            {user && (
              <Link to="/wishlist" className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors">
                <Heart size={17} className="text-brand-gold" /> {tr("wishlist")}
              </Link>
            )}
            <Link to="/track-order" className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors">
              <Truck size={17} className="text-brand-gold" /> {tr("trackOrder")}
            </Link>

            <div className="border-t border-gray-100 my-1.5" />

            <Link to="/about" className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors">
              <BookOpen size={17} className="text-brand-gold" /> {tr("about")}
            </Link>
            <Link to="/sourcing" className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors">
              <MapPin size={17} className="text-brand-gold" /> {tr("sourcingStory")}
            </Link>
            <Link to="/blog" className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors">
              <BookOpen size={17} className="text-brand-gold" /> {tr("ourBlog")}
            </Link>
            <Link to="/contact" className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors">
              <HelpCircle size={17} className="text-brand-gold" /> {tr("contact")}
            </Link>
            <Link to="/faq" className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-sm font-semibold text-brand-brown active:bg-brand-cream transition-colors">
              <HelpCircle size={17} className="text-brand-gold" /> {tr("faqs")}
            </Link>
          </div>

          {/* Account CTA — always visible, never scrolls out of view */}
          {!user && (
            <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-brand-brown" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-brown">Sign in for a faster checkout</p>
                  <p className="text-xs text-gray-400">Track orders, save wishlist &amp; earn JS Coins</p>
                </div>
              </div>
              <Link to="/login" className="btn-primary text-center block py-3 text-sm">{tr("loginRegister")}</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
