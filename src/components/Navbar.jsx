import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, User, Search, Menu, X, Heart, ChevronDown, LogOut, LayoutDashboard, Package, Compass, BookOpen, MapPin, HelpCircle, Truck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { PRODUCT_CATEGORIES } from "../utils/helpers";
import LanguageSwitcher from "./LanguageSwitcher";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

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
  const { siteContent } = useSiteSettings() || {};
  const trustItems = siteContent?.trust?.items || [];
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
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
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* ── Announcement Bar — one clean, brand-colour bar (was two mismatched
             marquees stacked, in a dark-green gradient that didn't match the
             site's actual navy/gold palette anywhere else) ── */}
      <div className="overflow-hidden bg-brand-brown">
        <div
          className="marquee-track flex items-center whitespace-nowrap py-2"
          style={{ width: "max-content" }}
        >
          {[
            ...[
              "Free Delivery on Orders Above ₹499",
              "FSSAI Certified · Direct from Source Farms",
              "25+ Years in Gangauri Bazar, Jaipur",
            ],
            ...trustItems.map((t) => `${t.icon} ${t.text}`),
          ].flatMap((msg) => [msg, msg]).map((msg, i) => (
            <span key={i} className="inline-flex items-center text-[11px] font-semibold tracking-wide text-white/90 px-6">
              {msg}
              <span className="ml-6 text-brand-gold">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu toggle */}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
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
                  Shop <ChevronDown size={14} className={`transition-transform duration-300 ${shopMenuOpen ? "rotate-180" : ""}`} />
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
                        <Link to="/products?badge=Best Seller" className="text-xs text-brand-warm font-semibold hover:underline block mb-1">🔥 Best Sellers</Link>
                        <Link to="/products?badge=New" className="text-xs text-green-600 font-semibold hover:underline block">✨ New Arrivals</Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Explore dropdown */}
              <div className="relative" onMouseEnter={() => setExploreMenuOpen(true)} onMouseLeave={() => setExploreMenuOpen(false)}>
                <button className="nav-link text-sm flex items-center gap-1">
                  Explore <ChevronDown size={14} className={`transition-transform duration-300 ${exploreMenuOpen ? "rotate-180" : ""}`} />
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
                        { to: "/sourcing", label: "Sourcing Story", icon: <MapPin size={14} /> },
                        { to: "/blog", label: "Our Blog", icon: <BookOpen size={14} /> },
                        { to: "/track-order", label: "Track Order", icon: <Truck size={14} /> },
                        { to: "/faq", label: "FAQs", icon: <HelpCircle size={14} /> },
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

              <Link to="/products?category=Gift Hampers" className="nav-link text-sm">Gift Hampers</Link>
              <Link to="/about" className="nav-link text-sm">About</Link>
              <Link to="/contact" className="nav-link text-sm">{tr("contact")}</Link>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* Search */}
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:bg-brand-cream rounded-lg transition-colors">
                <Search size={20} className="text-brand-brown" />
              </button>

              {/* Wishlist (desktop) */}
              {user && (
                <Link to="/wishlist" className="hidden md:block p-2 hover:bg-brand-cream rounded-lg transition-colors">
                  <Heart size={20} className="text-brand-brown" />
                </Link>
              )}

              {/* Language switcher (desktop) */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {/* Cart */}
              <button onClick={toggleCart} className="relative p-2 hover:bg-brand-cream rounded-lg transition-colors">
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
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-2 hover:bg-brand-cream rounded-lg transition-colors">
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
                        <Package size={16} /> My Orders
                      </Link>
                      <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-brand-cream hover:text-brand-brown transition-colors">
                        <User size={16} /> My Profile
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-gold font-semibold hover:bg-brand-cream transition-colors">
                          <LayoutDashboard size={16} /> Admin Dashboard
                        </Link>
                      )}
                      <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="hidden md:flex items-center gap-1 text-sm font-medium text-brand-brown hover:text-brand-gold transition-colors px-3 py-2 hover:bg-brand-cream rounded-lg">
                  <User size={18} /> {tr("account")}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search bar overlay */}
        {searchOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 animate-slide-up">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${tr("search")} almonds, cashews, gift hampers...`}
                className="input-field flex-1"
                style={{ fontSize: "16px" }}
              />
              <button type="submit" className="btn-primary py-3 px-6">Search</button>
            </form>
          </div>
        )}

      </nav>

      {/* Mobile menu — full-screen overlay from the very top (marquee/trust bar height varies,
          so this can't rely on the nav's own height); carries its own header with logo + close. */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] bg-white animate-slide-up flex flex-col">
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 flex-shrink-0">
            <button className="p-2 -ml-2" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X size={24} className="text-brand-brown" />
            </button>
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center">
              <img src="/logo.png" alt="Jai Shree Dry Fruits" style={{ height: 44, width: "auto" }} />
            </Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)} className="p-2 -mr-2 relative">
              <ShoppingCart size={22} className="text-brand-brown" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>
              )}
            </Link>
          </div>
          <div className="px-4 py-3 space-y-0.5 overflow-y-auto overscroll-contain flex-1 min-h-0">
            <Link to="/" className="flex items-center gap-3 py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors">
              <Compass size={17} className="text-brand-gold" /> Home
            </Link>
            <button
              type="button"
              onClick={() => setMobileCategoriesOpen((v) => !v)}
              className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors"
            >
              <span className="flex items-center gap-3"><Package size={17} className="text-brand-gold" /> All Products</span>
              <ChevronDown size={16} className={`transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileCategoriesOpen && (
              <div className="pl-9 grid grid-cols-2 gap-x-2">
                {PRODUCT_CATEGORIES.map((c) => (
                  <Link key={c} to={`/products?category=${c}`} className="block py-1.5 text-sm text-gray-600 active:text-brand-gold transition-colors">
                    {c}
                  </Link>
                ))}
              </div>
            )}
            <Link to="/products?category=Gift Hampers" className="flex items-center gap-3 py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors">
              <ShoppingCart size={17} className="text-brand-gold" /> Gift Hampers
            </Link>
            {user && (
              <Link to="/wishlist" className="flex items-center gap-3 py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors">
                <Heart size={17} className="text-brand-gold" /> Wishlist
              </Link>
            )}
            <Link to="/track-order" className="flex items-center gap-3 py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors">
              <Truck size={17} className="text-brand-gold" /> Track Order
            </Link>

            <div className="border-t border-gray-100 my-1.5" />

            <Link to="/about" className="flex items-center gap-3 py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors">
              <BookOpen size={17} className="text-brand-gold" /> About
            </Link>
            <Link to="/sourcing" className="flex items-center gap-3 py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors">
              <MapPin size={17} className="text-brand-gold" /> Sourcing Story
            </Link>
            <Link to="/blog" className="flex items-center gap-3 py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors">
              <BookOpen size={17} className="text-brand-gold" /> Our Blog
            </Link>
            <Link to="/contact" className="flex items-center gap-3 py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors">
              <HelpCircle size={17} className="text-brand-gold" /> Contact
            </Link>
            <Link to="/faq" className="flex items-center gap-3 py-2.5 px-2 rounded-lg text-sm font-medium text-brand-brown active:bg-brand-cream transition-colors">
              <HelpCircle size={17} className="text-brand-gold" /> FAQs
            </Link>
          </div>

          {/* Language + Login always visible, never scrolls out of view */}
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 space-y-2.5 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            <LanguageSwitcher mobile />
            {!user && (
              <Link to="/login" className="btn-primary text-center block py-2.5 text-sm rounded-lg">Login / Register</Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
