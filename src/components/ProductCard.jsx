import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, ShoppingCart, BellRing, CheckCircle2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice, discountPercent, per100g } from "../utils/helpers";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { tr } = useLanguage();
  const { user } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [justAdded, setJustAdded] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const wishlisted = isWishlisted(product.id);

  const outOfStock = (selectedVariant?.stock ?? 1) <= 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({
      id: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variant: selectedVariant.weight,
      price: selectedVariant.price,
      image: product.images?.[0],
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleNotifyMe = async (e) => {
    e.stopPropagation();
    if (notifying || notified) return;
    const email = user?.email || window.prompt("Enter your email — we'll let you know when this is back in stock:");
    if (!email) return;
    setNotifying(true);
    try {
      await addDoc(collection(db, "stock_notifications"), {
        email,
        productId: product.id,
        productName: product.name,
        variant: selectedVariant?.weight || "",
        notified: false,
        createdAt: serverTimestamp(),
      });
      setNotified(true);
      toast.success("We'll email you when it's back!");
    } catch {
      toast.error("Could not save your request — please try again");
    } finally {
      setNotifying(false);
    }
  };

  const discount = selectedVariant?.originalPrice
    ? discountPercent(selectedVariant.originalPrice, selectedVariant.price)
    : 0;

  const per100gValue = selectedVariant ? per100g(selectedVariant.price, selectedVariant.weight) : null;

  const badgeColors = {
    "Best Seller": "badge-gold",
    Premium: "bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded-full",
    New: "badge-new",
    Limited: "bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full",
    Sale: "badge-sale",
  };

  return (
    /**
     * Single outer div — no anchor wraps interactive elements.
     * Each clickable zone is either a plain <Link> with no children buttons,
     * or a standalone <button>. Zero nested <a><button> in the entire tree.
     */
    <div className="card-luxury group relative flex flex-col h-full">

      {/* ── Image ─── plain Link, only contains img + non-interactive overlays ── */}
      <div className="relative overflow-hidden bg-brand-cream aspect-square flex-shrink-0">
        <Link to={`/product/${product.id}`} className="block w-full h-full" tabIndex={-1}>
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="w-full h-full object-cover product-image-zoom"
            loading="lazy"
          />
        </Link>

        {/* Badges — non-interactive overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {product.badge && <span className={badgeColors[product.badge] || "badge-gold"}>{product.badge}</span>}
          {discount >= 5 && <span className="badge-sale">-{discount}%</span>}
          {outOfStock && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-gray-700 text-white">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist — standalone button, never inside <a> */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"} />
        </button>

        {/* Quick-add bar — standalone, positioned over image, NOT inside any <a> */}
        <div
          className="absolute inset-x-0 bottom-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10"
          style={{ background: "linear-gradient(to top, rgba(11,61,46,0.92), rgba(11,61,46,0.7))" }}
        >
          {outOfStock ? (
            <button
              type="button"
              onClick={handleNotifyMe}
              disabled={notifying || notified}
              className="w-full flex items-center justify-center gap-1.5 text-white font-semibold py-2 rounded-lg text-xs transition-all duration-300"
              style={{ background: notified ? "#22C55E" : "rgba(255,255,255,0.15)" }}
            >
              {notified ? <CheckCircle2 size={13} /> : <BellRing size={13} />}
              {notified ? "We'll notify you" : notifying ? "Saving..." : "Notify Me"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-1.5 text-white font-semibold py-2 rounded-lg text-xs transition-all duration-300"
              style={{ background: justAdded ? "#22C55E" : "rgba(255,255,255,0.15)" }}
            >
              <ShoppingCart size={13} />
              {justAdded ? "Added ✓" : tr("addToCart")}
            </button>
          )}
        </div>
      </div>

      {/* ── Info ── plain div, Link only on the title text ─────────────────── */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-brand-gold font-semibold uppercase tracking-wide mb-1">
          {product.category}
        </p>

        {/* Title is the only Link in the info section — no buttons inside */}
        <Link
          to={`/product/${product.id}`}
          className="font-serif font-semibold text-brand-brown text-base leading-tight mb-2 hover:text-brand-gold transition-colors block"
        >
          {product.name}
        </Link>

        {/* Rating — non-interactive display */}
        <div className="flex items-center gap-1 mb-3 pointer-events-none">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={13}
              className={s <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
        </div>

        {/* Variant selector — standalone buttons, NOT inside any <a> */}
        {product.variants?.length > 1 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  selectedVariant?.id === v.id
                    ? "border-brand-gold bg-brand-cream text-brand-gold font-semibold"
                    : "border-gray-200 text-gray-500 hover:border-brand-gold"
                }`}
              >
                {v.weight}
              </button>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 flex-wrap" style={{ perspective: 400 }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={selectedVariant?.id}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-brand-brown font-semibold text-lg inline-block"
                style={{ transformOrigin: "center", display: "inline-block" }}
              >
                {formatPrice(selectedVariant?.price)}
              </motion.span>
            </AnimatePresence>
            {selectedVariant?.originalPrice > selectedVariant?.price && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(selectedVariant.originalPrice)}</span>
            )}
          </div>
          {per100gValue != null && (
            <p className="text-[11px] text-gray-400 mt-0.5">₹{per100gValue} / 100g</p>
          )}
        </div>
      </div>
    </div>
  );
}
