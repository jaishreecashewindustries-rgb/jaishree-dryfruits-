import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, Search, Menu, X, Heart, ChevronDown, LogOut, LayoutDashboard, Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { PRODUCT_CATEGORIES } from "../utils/helpers";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, userProfile, isAdmin, logout } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const { tr } = useLanguage();
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
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

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
      {/* ── Premium Announcement Bar ────────────────────────────────────── */}
      <div
        className="overflow-hidden"
        style={{
          background: "linear-gradient(90deg, #071E14 0%, #0B3D2E 40%, #0D4A35 60%, #071E14 100%)",
          borderBottom: "1px solid rgba(201,168,76,0.18)",
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <div
          className="marquee-track-luxury flex items-center whitespace-nowrap"
          style={{ width: "max-content" }}
        >
          {[
            "COMPLIMENTARY PREMIUM AIR EXPRESS DISPATCH ON ALLOCATIONS ABOVE ₹1,200",
            "REGISTER CORPORATE GSTIN AT CHECKOUT FOR ENTERPRISE TAX CREDIT",
            "FRESHLY SORTED · SINGLE-ORIGIN HARVEST · DIRECT FROM FARM",
            "COMPLIMENTARY PREMIUM AIR EXPRESS DISPATCH ON ALLOCATIONS ABOVE ₹1,200",
            "REGISTER CORPORATE GSTIN AT CHECKOUT FOR ENTERPRISE TAX CREDIT",
            "FRESHLY SORTED · SINGLE-ORIGIN HARVEST · DIRECT FROM FARM",
          ].map((msg, i) => (
            <span key={i} className="inline-flex items-center">
              <span
                className="font-serif italic"
                style={{ color: "#E8C97A", fontSize: 13, letterSpacing: "0.2em", padding: "0 2.5rem" }}
              >
                {msg}
              </span>
              <span style={{ color: "rgba(201,168,76,0.4)", fontSize: 8 }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu toggle */}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} className="text-brand-brown" /> : <Menu size={24} className="text-brand-brown" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/logo.png"
                alt="Jai Shree Dry Fruits"
                style={{ width: 40, height: 40, objectFit: "contain" }}
                className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col items-start">
                <span className="font-serif text-xl md:text-2xl font-bold text-brand-brown tracking-wide leading-none group-hover:text-brand-gold transition-colors">
                  JAI SHREE
                </span>
                <span className="text-[10px] md:text-xs font-semibold text-brand-gold tracking-[0.25em] uppercase">
                  Dryfruits
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="nav-link text-sm">{tr("home")}</Link>

              {/* Shop dropdown */}
              <div className="relative" onMouseEnter={() => setShopMenuOpen(true)} onMouseLeave={() => setShopMenuOpen(false)}>
                <button className="nav-link text-sm flex items-center gap-1">
                  Shop <ChevronDown size={14} className={`transition-transform ${shopMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {shopMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 animate-fade-in z-50">
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
                  </div>
                )}
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-slide-up">
            <div className="px-4 py-4 space-y-1">
              <Link to="/" className="block py-2 text-sm font-medium text-brand-brown">Home</Link>
              <Link to="/products" className="block py-2 text-sm font-medium text-brand-brown">All Products</Link>
              {PRODUCT_CATEGORIES.slice(0, 6).map((c) => (
                <Link key={c} to={`/products?category=${c}`} className="block py-2 pl-4 text-sm text-gray-600 hover:text-brand-gold">
                  → {c}
                </Link>
              ))}
              <Link to="/products?category=Gift Hampers" className="block py-2 text-sm font-medium text-brand-brown">Gift Hampers</Link>
              <Link to="/about" className="block py-2 text-sm font-medium text-brand-brown">About</Link>
              <Link to="/contact" className="block py-2 text-sm font-medium text-brand-brown">Contact</Link>
              {user && (
                <Link to="/wishlist" className="block py-2 text-sm font-medium text-brand-brown">Wishlist</Link>
              )}
              <Link to="/track-order" className="block py-2 text-sm font-medium text-brand-brown">Track Order</Link>

              <div className="pt-3 mt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Language / भाषा</p>
                <LanguageSwitcher mobile />
              </div>

              {!user && (
                <Link to="/login" className="block mt-3 btn-primary text-center">Login / Register</Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
