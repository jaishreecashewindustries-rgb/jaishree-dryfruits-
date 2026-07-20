import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check } from "lucide-react";
import { formatPrice } from "../utils/helpers";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

/**
 * "Frequently Bought Together" — current product + up to 2 complementary
 * items from OTHER categories (not more of the same thing — that's what
 * "Related Products" below already covers). Checkbox per item, running
 * total, and a real "you save" figure computed from each variant's actual
 * originalPrice vs price (no fabricated bundle-only discount).
 */
export default function ProductBundle({ product, selectedVariant, allProducts }) {
  const { addToCart } = useCart();

  const suggestions = useMemo(() => {
    return allProducts
      .filter((p) => p.id !== product.id && p.category !== product.category)
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 2);
  }, [allProducts, product]);

  const bundleItems = useMemo(() => [
    { product, variant: selectedVariant, isMain: true },
    ...suggestions.map((p) => ({ product: p, variant: p.variants[0], isMain: false })),
  ], [product, selectedVariant, suggestions]);

  const [checked, setChecked] = useState(() => new Set(bundleItems.map((_, i) => i)));

  if (suggestions.length === 0) return null;

  const selected = bundleItems.filter((_, i) => checked.has(i));
  const total = selected.reduce((s, it) => s + it.variant.price, 0);
  const savings = selected.reduce((s, it) => s + Math.max(0, (it.variant.originalPrice || it.variant.price) - it.variant.price), 0);

  const toggle = (i) => {
    if (i === 0) return; // main product always included
    setChecked((c) => {
      const next = new Set(c);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const addAllToCart = () => {
    selected.forEach((it) => {
      addToCart({
        id: it.product.id,
        variantId: it.variant.id,
        name: it.product.name,
        variant: it.variant.weight,
        price: it.variant.price,
        image: it.product.images?.[0],
      });
    });
    toast.success(`${selected.length} items added to cart`);
  };

  return (
    <div className="mb-16">
      <h2 className="font-serif text-2xl font-bold text-brand-brown mb-1">Frequently Bought Together</h2>
      <p className="text-sm text-gray-500 mb-6">Complete your order — customers often add these too.</p>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-3 flex-wrap">
        {bundleItems.map((it, i) => (
          <React.Fragment key={it.product.id}>
            <button
              type="button"
              onClick={() => toggle(i)}
              disabled={i === 0}
              className={`flex items-center gap-3 border-2 rounded-2xl p-3 text-left transition-all min-w-[220px] ${checked.has(i) ? "border-brand-gold bg-brand-cream" : "border-gray-200"} ${i === 0 ? "cursor-default" : ""}`}
            >
              <span className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 ${checked.has(i) ? "bg-brand-gold border-brand-gold" : "border-gray-300"}`}>
                {checked.has(i) && <Check size={13} className="text-white" />}
              </span>
              <img src={it.product.images?.[0]} alt={it.product.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-brand-brown truncate">{it.product.name}{it.isMain ? " (this item)" : ""}</span>
                <span className="block text-xs text-gray-500">{it.variant.weight} — {formatPrice(it.variant.price)}</span>
              </span>
            </button>
            {i < bundleItems.length - 1 && <span className="text-gray-300 text-xl hidden md:block">+</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div>
          <p className="text-sm text-gray-500">Total for {selected.length} item{selected.length === 1 ? "" : "s"}</p>
          <p className="font-serif font-extrabold text-2xl text-brand-brown">
            {formatPrice(total)}
            {savings > 0 && <span className="ml-2 text-sm font-bold text-green-600">You save {formatPrice(savings)}</span>}
          </p>
        </div>
        <button onClick={addAllToCart} className="btn-brown btn-sheen rounded-full px-6 py-3.5 flex items-center justify-center gap-2 font-bold">
          <ShoppingCart size={16} /> Add All to Cart
        </button>
        {suggestions.length > 0 && (
          <Link to={`/product/${suggestions[0].id}`} className="text-xs text-gray-400 hover:text-brand-gold transition-colors">
            View {suggestions[0].name} →
          </Link>
        )}
      </div>
    </div>
  );
}
