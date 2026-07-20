import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, ShoppingCart, BellRing, CheckCircle2, Minus, Plus, Truck } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice, discountPercent, per100g } from "../utils/helpers";
import toast from "react-hot-toast";

// Design-system Product Card (spec §6): image + hover-swap image, wishlist,
// rating, 2-line name, short descriptor, price/MRP/%off, weight chips,
// Quick Add → post-add quantity stepper, stock indicator, badges.
export default function ProductCard({ product }) {
  const { addToCart, updateQty, items } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { tr } = useLanguage();
  const { user } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const wishlisted = isWishlisted(product.id);

  const outOfStock = (selectedVariant?.stock ?? 1) <= 0;

  // Already-in-cart line for this exact variant — drives the post-add
  // quantity stepper so the card always reflects real cart state instead
  // of a local "just added" flag that could drift from it.
  const cartLine = items?.find?.((c) => c.id === product.id && c.variantId === selectedVariant?.id);
  const inCartQty = cartLine?.qty || 0;

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
  };

  const handleStepQty = (e, delta) => {
    e.stopPropagation();
    if (!cartLine) return;
    const next = inCartQty + delta;
    if (next <= 0) { updateQty(product.id, selectedVariant.id, 0); return; }
    if (next > selectedVariant.stock) return;
    updateQty(product.id, selectedVariant.id, next);
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
  const lowStock = !outOfStock && selectedVariant?.stock != null && selectedVariant.stock <= 10;
  // Demo/seed data often repeats the same URL as a placeholder second
  // image — skip the crossfade entirely when it isn't actually different,
  // there's nothing to reveal on hover.
  const secondaryImage = product.images?.[1] && product.images[1] !== product.images[0] ? product.images[1] : null;

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
          {secondaryImage ? (
            // Two real, distinct images — crossfade wrapper only exists in
            // this case, so single-image products (the common case) render
            // the plain non-absolute <img> below instead, same as before.
            <div className="relative w-full h-full">
              <img
                src={product.images?.[0]}
                alt={product.name}
                className="w-full h-full object-contain product-image-zoom absolute inset-0 transition-opacity duration-300 md:group-hover:opacity-0"
                loading="lazy"
              />
              <img
                src={secondaryImage}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain absolute inset-0 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hidden md:block"
                loading="lazy"
              />
            </div>
          ) : (
            <img
              src={product.images?.[0]}
              alt={product.name}
              className="w-full h-full object-contain product-image-zoom"
              loading="lazy"
            />
          )}
        </Link>

        {/* Label — one quiet text tag, non-interactive overlay */}
        {(label || outOfStock) && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 bg-white/90 text-brand-brown">
              {outOfStock ? "Out of Stock" : label}
            </span>
          </div>
        )}

        {/* Wishlist — standalone button, never inside <a>. 44×44 tap target
            (spec §9) via padding, icon itself stays visually compact. */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center hover:scale-110 transition-transform z-10"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <span className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
            <Heart size={15} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </span>
        </button>
      </div>

      {/* ── Info ── plain div, Link only on the title text ─────────────────── */}
      <div className="pt-3 flex flex-col flex-1">
        <Link
          to={`/product/${product.id}`}
          className="font-serif font-bold text-brand-brown text-base leading-tight mb-1 hover:text-brand-gold transition-colors block line-clamp-2 min-h-[2.6em]"
        >
          {product.name}
        </Link>

        {product.shortDescription && (
          <p className="text-xs text-gray-500 mb-1.5 line-clamp-1">{product.shortDescription}</p>
        )}

        {/* Rating — non-interactive display */}
        <div className="flex items-center gap-1 mb-2 pointer-events-none">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={12}
              className={s <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}
            />
          ))}
          <span className="text-xs font-semibold text-gray-500 ml-1">({product.reviewCount})</span>
        </div>

        {/* Variant selector — standalone buttons, NOT inside any <a> */}
        {product.variants?.length > 1 && (
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {product.variants.map((v, i) => (
              <button
                key={v.id || `${product.id}-${i}`}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                  selectedVariant?.id === v.id
                    ? "border-brand-brown bg-brand-cream text-brand-brown font-bold"
                    : "border-gray-200 text-gray-500 hover:border-brand-brown"
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
                className="font-serif text-brand-brown font-extrabold text-lg inline-block"
                style={{ transformOrigin: "center", display: "inline-block" }}
              >
                {formatPrice(selectedVariant?.price)}
              </motion.span>
            </AnimatePresence>
            {selectedVariant?.originalPrice > selectedVariant?.price && (
              <>
                <span className="text-xs text-gray-400 line-through">{formatPrice(selectedVariant.originalPrice)}</span>
                {discount >= 5 && <span className="text-xs font-bold text-green-600">{discount}% OFF</span>}
              </>
            )}
          </div>
          {per100gValue != null && (
            <p className="text-[11px] font-medium text-gray-500 mt-0.5">₹{per100gValue} / 100g</p>
          )}

          {/* Stock indicator */}
          {!outOfStock && (
            <p className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${lowStock ? "text-orange-600" : "text-green-600"}`}>
              <CheckCircle2 size={11} />
              {lowStock ? `Only ${selectedVariant.stock} left` : "In Stock"}
            </p>
          )}

          {product.expressDelivery && (
            <p className="text-[11px] font-semibold text-blue-600 mt-1 flex items-center gap-1">
              <Truck size={11} /> Express Delivery
            </p>
          )}

          {/* Quick Add / post-add quantity stepper — 44px min height (spec §9) */}
          <div className="mt-2.5">
            {outOfStock ? (
              <button
                type="button"
                onClick={handleNotifyMe}
                disabled={notifying}
                className={`w-full min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${notifying ? "is-loading" : ""}`}
                style={{ background: notified ? "#1B2E4B" : "var(--bg2)", color: notified ? "#fff" : "var(--navy)", border: "1.5px solid var(--navy)" }}
              >
                {notified ? <><CheckCircle2 size={14} /> We'll notify you</> : <><BellRing size={14} /> Notify Me</>}
              </button>
            ) : inCartQty > 0 ? (
              <div className="flex items-center justify-between border-2 border-brand-brown rounded-full overflow-hidden min-h-[44px]">
                <button type="button" onClick={(e) => handleStepQty(e, -1)} aria-label="Decrease quantity" className="w-11 h-11 flex items-center justify-center hover:bg-brand-cream transition-colors flex-shrink-0">
                  <Minus size={15} />
                </button>
                <span className="font-bold text-brand-brown text-sm">{inCartQty} in cart</span>
                <button type="button" onClick={(e) => handleStepQty(e, 1)} aria-label="Increase quantity" disabled={inCartQty >= selectedVariant.stock} className="w-11 h-11 flex items-center justify-center hover:bg-brand-cream transition-colors flex-shrink-0 disabled:opacity-30">
                  <Plus size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                aria-label={tr("addToCart")}
                className="btn-sheen w-full min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 bg-brand-brown text-white hover:bg-brand-gold hover:text-brand-navy transition-all"
              >
                <ShoppingCart size={14} /> Quick Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
