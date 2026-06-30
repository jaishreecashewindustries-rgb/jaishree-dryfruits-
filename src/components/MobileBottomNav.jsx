import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, ShoppingCart, User, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/products", icon: ShoppingBag, label: "Shop" },
  { to: "/wishlist", icon: Heart, label: "Wishlist", isWishlist: true },
  { to: "/cart", icon: ShoppingCart, label: "Cart", isCart: true },
  { to: "/dashboard", icon: User, label: "Account", isUser: true },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { totalItems, toggleCart } = useCart();
  const { wishlistIds } = useWishlist() || {};
  const wishlistCount = wishlistIds?.length || 0;

  const isActive = (item) => {
    if (item.to === "/") return location.pathname === "/";
    if (item.to === "/products") {
      return location.pathname === "/products" && !location.search.includes("search=");
    }
    if (item.isCart) return location.pathname === "/cart";
    if (item.to === "/dashboard") return location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/login");
    return location.pathname.startsWith(item.to);
  };

  return (
    <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t border-brand-gold/20 shadow-[0_-4px_30px_rgba(201,168,76,0.15)]" />

      <div className="relative flex items-center justify-around px-2 py-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const { to, icon: Icon, label, isCart, isWishlist } = item;
          const active = isActive(item);
          const badgeCount = isCart ? totalItems : isWishlist ? wishlistCount : 0;

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
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {badgeCount > 9 ? "9+" : badgeCount}
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
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide transition-colors ${active ? "text-brand-gold" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
