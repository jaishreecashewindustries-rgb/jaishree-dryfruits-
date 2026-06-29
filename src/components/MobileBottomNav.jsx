import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingBag, Search, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/products", icon: ShoppingBag, label: "Shop" },
  { icon: Search, label: "Search", isSearch: true },
  { to: "/cart", icon: ShoppingCart, label: "Cart", isCart: true },
  { to: "/dashboard", icon: User, label: "Account", isUser: true },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, toggleCart } = useCart();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (item) => {
    if (item.isSearch) return searchOpen;
    // Home: exact match only
    if (item.to === "/") return location.pathname === "/" && !searchOpen;
    // Shop: only active when on /products with no search query
    if (item.to === "/products") {
      return location.pathname === "/products" && !location.search.includes("search=") && !searchOpen;
    }
    // Cart: handled by isCart button, active when on /cart page
    if (item.isCart) return location.pathname === "/cart";
    // Account
    if (item.to === "/dashboard") return location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/login");
    return location.pathname.startsWith(item.to);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSearchOpen(false)}>
          <div
            className="mt-auto mb-[72px] mx-4 mb-20 rounded-2xl overflow-hidden"
            style={{ background: "#fff" }}
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="flex items-center gap-3 px-4 py-3">
              <Search size={18} className="text-brand-gold flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search dry fruits, nuts…"
                className="flex-1 outline-none text-brand-brown placeholder-gray-400"
                style={{ background: "transparent", fontSize: "16px" }}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")}>
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </form>
            <div className="border-t border-gray-100 px-4 py-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Popular</p>
              <div className="flex flex-wrap gap-2 pb-2">
                {["Almonds", "Cashews", "Walnuts", "Pistachios", "Gift Hampers"].map(term => (
                  <button
                    key={term}
                    onClick={() => { navigate(`/products?search=${term}`); setSearchOpen(false); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-brand-gold hover:text-brand-gold transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Glass background */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t border-brand-gold/20 shadow-[0_-4px_30px_rgba(201,168,76,0.15)]" />

        <div className="relative flex items-center justify-around px-2 py-2 pb-safe">
          {NAV_ITEMS.map((item) => {
            const { to, icon: Icon, label, isCart, isSearch } = item;
            const active = isActive(item);

            if (isSearch) {
              return (
                <button
                  key={label}
                  onClick={() => setSearchOpen(s => !s)}
                  className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 group"
                >
                  <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                    active
                      ? "bg-brand-gold shadow-lg shadow-brand-gold/30 scale-110"
                      : "group-active:scale-95"
                  }`}>
                    {active ? <X size={22} strokeWidth={2.5} className="text-white" /> : <Icon size={22} strokeWidth={1.8} className="text-gray-500 group-hover:text-brand-gold transition-colors" />}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wide transition-colors ${active ? "text-brand-gold" : "text-gray-400"}`}>
                    {label}
                  </span>
                </button>
              );
            }

            if (isCart) {
              return (
                <button
                  key={label}
                  onClick={toggleCart}
                  className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 group"
                >
                  <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                    active
                      ? "bg-brand-gold shadow-lg shadow-brand-gold/30 scale-110"
                      : "group-active:scale-95"
                  }`}>
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.5 : 1.8}
                      className={active ? "text-white" : "text-gray-500 group-hover:text-brand-gold transition-colors"}
                    />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                        {totalItems > 9 ? "9+" : totalItems}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wide transition-colors ${active ? "text-brand-gold" : "text-gray-400"}`}>
                    {label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={label}
                to={to}
                className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 group"
              >
                <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                  active
                    ? "bg-brand-gold shadow-lg shadow-brand-gold/30 scale-110"
                    : "group-active:scale-95"
                }`}>
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? "text-white" : "text-gray-500 group-hover:text-brand-gold transition-colors"}
                  />
                </div>
                <span className={`text-[10px] font-semibold tracking-wide transition-colors ${active ? "text-brand-gold" : "text-gray-400"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
