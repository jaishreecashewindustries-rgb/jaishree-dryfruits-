import React, { useState, useEffect } from "react";
import { X, ShoppingCart, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/helpers";

/*
  MobileCartSheet — slides up from the bottom on mobile when user taps
  Add to Cart or Buy Now on a ProductCard.
  Props:
    product  — the full product object
    open     — boolean
    onClose  — function
*/
export default function MobileCartSheet({ product, open, onClose }) {
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Reset on each open
  useEffect(() => {
    if (open) {
      setSelectedVariant(product?.variants?.[0]);
      setQty(1);
      setAdded(false);
    }
  }, [open, product]);

  // Close on backdrop click / escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variant: selectedVariant.weight,
      price: selectedVariant.price,
      image: product.images?.[0],
    });
    setAdded(true);
    setTimeout(onClose, 800);
  };

  const handleBuyNow = () => {
    addToCart({
      id: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variant: selectedVariant.weight,
      price: selectedVariant.price,
      image: product.images?.[0],
    });
    onClose();
    navigate("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${product.name} to cart`}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl"
        style={{
          background: "#F4F0E8",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
          backfaceVisibility: "hidden",
          perspective: "1000px",
          maxHeight: "88vh",
          overflowY: "auto",
          paddingBottom: "env(safe-area-inset-bottom, 20px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pt-3 pb-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            <img
              src={product.images?.[0]}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
              style={{ border: "1.5px solid rgba(201,168,76,0.2)" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-0.5">{product.category}</p>
              <h3 className="font-serif text-base font-semibold text-brand-brown leading-snug">{product.name}</h3>
              <p
                key={selectedVariant?.id}
                className="price-fade font-serif text-lg font-semibold text-brand-brown mt-1"
              >
                {formatPrice(selectedVariant?.price)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 flex-shrink-0 mt-0.5"
              aria-label="Close"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Variant selector */}
          {product.variants?.length > 1 && (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[3px] text-gray-400 mb-2.5">Size / Weight</p>
              <div className="flex gap-2 flex-wrap">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className="flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: selectedVariant?.id === v.id ? "#C9A84C" : "#E5E7EB",
                      background: selectedVariant?.id === v.id ? "rgba(201,168,76,0.08)" : "#fff",
                    }}
                  >
                    <span className="text-sm font-semibold text-brand-brown">{v.weight}</span>
                    <span
                      key={v.id + "-price"}
                      className="price-fade text-xs text-gray-500 mt-0.5"
                    >
                      {formatPrice(v.price)}
                    </span>
                    {v.perDay && (
                      <span className="text-[10px] text-gray-400 italic mt-0.5 font-serif">{v.perDay.split("·")[1]?.trim()}</span>
                    )}
                  </button>
                ))}
              </div>
              {selectedVariant?.perDay && (
                <p className="text-[11px] text-gray-400 italic mt-2.5 font-serif">{selectedVariant.perDay}</p>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-gray-400 mb-2.5">Quantity</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-brand-brown text-lg font-semibold hover:bg-brand-cream transition-colors"
                >−</button>
                <span className="w-10 text-center font-semibold text-brand-brown text-sm">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(10, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-brand-brown text-lg font-semibold hover:bg-brand-cream transition-colors"
                >+</button>
              </div>
              <p className="text-sm font-semibold text-brand-brown font-serif">
                = {formatPrice(selectedVariant?.price * qty)}
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={added}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all"
              style={{
                background: added ? "#22C55E" : "linear-gradient(135deg, #243D63, #1B2E4B)",
                color: "#fff",
              }}
            >
              <ShoppingCart size={15} />
              {added ? "Added!" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #C9A84C, #E2C06A)",
                color: "#1B2E4B",
              }}
            >
              <Zap size={15} />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
