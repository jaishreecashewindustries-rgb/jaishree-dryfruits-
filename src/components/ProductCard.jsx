import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Heart, ShoppingCart, Eye } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice, discountPercent } from "../utils/helpers";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variant: selectedVariant.weight,
      price: selectedVariant.price,
      image: product.images?.[0],
    });
  };

  const discount = selectedVariant?.originalPrice
    ? discountPercent(selectedVariant.originalPrice, selectedVariant.price)
    : 0;

  const badgeColors = {
    "Best Seller": "badge-gold",
    Premium: "bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded-full",
    New: "badge-new",
    Limited: "bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full",
    Sale: "badge-sale",
  };

  return (
    <Link to={`/product/${product.id}`} className="card-luxury group relative flex flex-col h-full">
      {/* Image */}
      <div className="relative overflow-hidden bg-brand-cream aspect-square flex-shrink-0">
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="w-full h-full object-cover product-image-zoom"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && (
            <span className={badgeColors[product.badge] || "badge-gold"}>{product.badge}</span>
          )}
          {discount >= 5 && (
            <span className="badge-sale">-{discount}%</span>
          )}
        </div>
        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlist(!wishlist); }}
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <Heart size={16} className={wishlist ? "fill-red-500 text-red-500" : "text-gray-400"} />
        </button>
        {/* Quick actions overlay */}
        <div className="absolute inset-x-0 bottom-0 flex gap-2 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-brand-brown text-white text-xs font-semibold py-2 rounded-lg hover:bg-brand-gold transition-colors flex items-center justify-center gap-1"
          >
            <ShoppingCart size={14} /> Add to Cart
          </button>
          <div className="w-10 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Eye size={15} className="text-brand-brown" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-brand-gold font-semibold uppercase tracking-wide mb-1">{product.category}</p>
        <h3 className="font-serif font-semibold text-brand-brown text-base leading-tight mb-2 group-hover:text-brand-gold transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={13}
              className={s <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
        </div>

        {/* Variant selector */}
        {product.variants?.length > 1 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={(e) => { e.preventDefault(); setSelectedVariant(v); }}
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
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-brand-brown font-bold text-lg">{formatPrice(selectedVariant?.price)}</span>
            {selectedVariant?.originalPrice && (
              <span className="text-gray-400 text-sm line-through ml-2">{formatPrice(selectedVariant.originalPrice)}</span>
            )}
          </div>
          {selectedVariant?.stock <= 5 && selectedVariant?.stock > 0 && (
            <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              Only {selectedVariant.stock} left!
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
