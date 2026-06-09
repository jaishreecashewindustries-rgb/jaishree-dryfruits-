import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, Search, Menu, X, Heart, ChevronDown, LogOut, LayoutDashboard, Package, Truck, Award, Phone, BookOpen, Leaf, HelpCircle, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { PRODUCT_CATEGORIES } from "../utils/helpers";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, userProfile, isAdmin, logout } = useAuth();
  const { totalItems, toggleCart } = useCart();
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
    setExploreMenuOpen(false);
    setUserMenuOpen(false);
  }, [location]);

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
      {/* Festival banner */}
      <div className="relative overflow-hidden text-center text-xs font-bold py-1.5 px-4 tracking-widest uppercase"
        style={{ background: "linear-gradient(90deg, #0D1B2A, #1B2E4B, #C9A84C, #1B2E4B, #0D1B2A)", color: "#F0DFA0", letterSpacing: "2.5px" }}>
        <span className="relative z-10">Monsoon Sale &mdash; Use <span className="underline decoration-brand-gold">MONSOON20</span> for 20% Off &nbsp;&middot;&nbsp; Limited Period</span>
        <span className="absolute inset-0 promo-shine-sweep opacity-30" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", width: "40%" }} />
      </div>

      {/* Top announcement bar — single scrolling line on mobile */}
      <div className="bg-brand-brown text-brand-gold text-xs py-2 px-4 overflow-hidden">
        <div className="hidden sm:flex items-center justify-center gap-6">
          <span className="flex items-center gap-1.5 whitespace-nowrap"><Truck size={11} /> Free Shipping on orders above ₹499</span>
          <span className="text-brand-gold/25">|</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap"><Award size={11} /> 100% Premium Quality Guaranteed</span>
          <span className="text-brand-gold/25">|</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone size={11} /> +91 75685 77968</span>
        </div>
        {/* Mobile: marquee scroll */}
        <div className="sm:hidden flex items-center">
          <div className="animate-[marquee_18s_linear_infinite] flex items-center gap-8 whitespace-nowrap font-medium tracking-wide">
            <span className="flex items-center gap-1.5"><Truck size={11} /> Free Shipping above ₹499</span>
            <span className="text-brand-gold/30">·</span>
            <span className="flex items-center gap-1.5"><Award size={11} /> 100% Premium Quality</span>
            <span className="text-brand-gold/30">·</span>
            <span className="flex items-center gap-1.5"><Phone size={11} /> +91 75685 77968</span>
            <span className="text-brand-gold/30">·</span>
            <span className="flex items-center gap-1.5"><Truck size={11} /> Free Shipping above ₹499</span>
            <span className="text-brand-gold/30">·</span>
            <span className="flex items-center gap-1.5"><Award size={11} /> 100% Premium Quality</span>
            <span className="text-brand-gold/30">·</span>
            <span className="flex items-center gap-1.5"><Phone size={11} /> +91 75685 77968</span>
          </div>
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
            <Logo />

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="nav-link text-sm">Home</Link>

              {/* Shop dropdown */}
              <div className="relative" onMouseEnter={() => setShopMenuOpen(true)} onMouseLeave={() => setShopMenuOpen(false)}>
                <button className="nav-link text-sm flex items-center gap-1">
                  Shop <ChevronDown size={14} className={`transition-transform ${shopMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {shopMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 animate-fade-in z-50">
                    <Link to="/products" className="block text-sm font-semibold text-brand-gold mb-3 hover:underline">
                      All Products
                    </Link>
                    <div className="grid grid-cols-2 gap-1">
                      {PRODUCT_CATEGORIES.slice(0, 8).map((c) => (
                        <Link key={c} to={`/products?category=${c}`} className="text-xs text-gray-600 hover:text-brand-gold hover:bg-brand-cream px-2 py-1 rounded transition-all">
                          {c}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
                      <Link to="/products?badge=Best Seller" className="text-xs text-brand-gold font-bold uppercase tracking-wider hover:underline block">Best Sellers</Link>
                      <Link to="/products?badge=New" className="text-xs text-brand-brown font-bold uppercase tracking-wider hover:underline block">New Arrivals</Link>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/products?category=Gift Hampers" className="nav-link text-sm">Gift Hampers</Link>

              {/* Explore dropdown */}
              <div className="relative" onMouseEnter={() => setExploreMenuOpen(true)} onMouseLeave={() => setExploreMenuOpen(false)}>
                <button className="nav-link text-sm flex items-center gap-1">
                  Explore <ChevronDown size={14} className={`transition-transform ${exploreMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {exploreMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white shadow-2xl border border-gray-100 p-4 animate-fade-in z-50">
                    <Link to="/blog" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-brand-brown group">
                      <BookOpen size={15} className="text-brand-gold" />
                      <span className="group-hover:translate-x-0.5 transition-transform">Our Blog</span>
                    </Link>
                    <Link to="/sourcing" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-brand-brown group">
                      <Leaf size={15} className="text-brand-gold" />
                      <span className="group-hover:translate-x-0.5 transition-transform">Sourcing Story</span>
                    </Link>
                    <Link to="/faq" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-brand-brown group">
                      <HelpCircle size={15} className="text-brand-gold" />
                      <span className="group-hover:translate-x-0.5 transition-transform">FAQ</span>
                    </Link>
                    <Link to="/about" className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-brand-brown group">
                      <Sparkles size={15} className="text-brand-gold" />
                      <span className="group-hover:translate-x-0.5 transition-transform">About Us</span>
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/contact" className="nav-link text-sm">Contact</Link>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* Language switcher */}
              <div className="hidden md:block"><LanguageSwitcher /></div>
              {/* Search */}
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:bg-brand-cream rounded-lg transition-colors">
                <Search size={20} className="text-brand-brown" />
              </button>

              {/* Wishlist (desktop) */}
              {user && (
                <Link to="/dashboard/wishlist" className="hidden md:block p-2 hover:bg-brand-cream rounded-lg transition-colors">
                  <Heart size={20} className="text-brand-brown" />
                </Link>
              )}

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
                  <User size={18} /> Login
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
                placeholder="Search almonds, cashews, gift hampers..."
                className="input-field flex-1"
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
              <Link to="/blog" className="block py-2 text-sm font-medium text-brand-brown">Blog</Link>
              <Link to="/sourcing" className="block py-2 text-sm font-medium text-brand-brown">Our Sourcing Story</Link>
              <Link to="/faq" className="block py-2 text-sm font-medium text-brand-brown">FAQ</Link>
              <Link to="/about" className="block py-2 text-sm font-medium text-brand-brown">About</Link>
              <Link to="/contact" className="block py-2 text-sm font-medium text-brand-brown">Contact</Link>
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
