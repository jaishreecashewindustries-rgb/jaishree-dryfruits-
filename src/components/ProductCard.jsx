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

  // One quiet text label, not a colored badge — "Best Seller" beats a
  // percentage-off callout when both exist, since price already shows the strike-through.
  const label = product.badge || (discount >= 5 ? `${discount}% OFF` : null);

  return (
    /**
     * Single outer div — no anchor wraps interactive elements.
     * Each clickable zone is either a plain <Link> with no children buttons,
     * or a standalone <button>. Zero nested <a><button> in the entire tree.
     */
    <div className="group relative flex flex-col h-full">

      {/* ── Image ─── plain Link, only contains img + non-interactive overlays ── */}
      <div className="relative overflow-hidden bg-brand-cream aspect-square flex-shrink-0">
        <Link to={`/product/${product.id}`} className="block w-full h-full" tabIndex={-1}>
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="w-full h-full object-contain product-image-zoom"
            loading="lazy"
          />
        </Link>

        {/* Label — one quiet text tag, non-interactive overlay */}
        {(label || outOfStock) && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 bg-white/90 text-brand-brown">
              {outOfStock ? "Out of Stock" : label}
            </span>
          </div>
        )}

        {/* Wishlist — standalone button, never inside <a> */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform z-10"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={15} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"} />
        </button>

        {/* Add to cart — always-visible icon button, not hover-only, so it
            actually works on mobile (no hover state on touch). */}
        <button
          type="button"
          onClick={outOfStock ? handleNotifyMe : handleAddToCart}
          disabled={outOfStock && (notifying || notified)}
          aria-label={outOfStock ? "Notify me when back in stock" : tr("addToCart")}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 z-10"
          style={{ background: justAdded || notified ? "#1B2E4B" : "#fff", color: justAdded || notified ? "#fff" : "#1B2E4B" }}
        >
          {outOfStock
            ? (notified ? <CheckCircle2 size={15} /> : <BellRing size={15} />)
            : (justAdded ? <CheckCircle2 size={15} /> : <ShoppingCart size={15} />)}
        </button>
      </div>

      {/* ── Info ── plain div, Link only on the title text ─────────────────── */}
      <div className="pt-3 flex flex-col flex-1">
        <Link
          to={`/product/${product.id}`}
          className="font-serif font-semibold text-brand-brown text-base leading-tight mb-1 hover:text-brand-gold transition-colors block"
        >
          {product.name}
        </Link>

        {/* Rating — non-interactive display */}
        <div className="flex items-center gap-1 mb-2 pointer-events-none">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={12}
              className={s <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">({product.reviewCount})</span>
        </div>

        {/* Variant selector — standalone buttons, NOT inside any <a> */}
        {product.variants?.length > 1 && (
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {product.variants.map((v, i) => (
              <button
                key={v.id || `${product.id}-${i}`}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className={`text-[11px] px-2 py-0.5 border transition-all ${
                  selectedVariant?.id === v.id
                    ? "border-brand-brown text-brand-brown font-semibold"
                    : "border-gray-200 text-gray-400 hover:border-brand-brown"
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
