import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/helpers";
import { useProducts } from "../context/ProductsContext";

export default function Wishlist() {
  const { products: DEMO_PRODUCTS } = useProducts();
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const products = DEMO_PRODUCTS.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-400 hover:text-brand-brown transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Heart size={22} className="text-red-500" fill="currentColor" />
          <div>
            <h1 className="text-xl font-bold text-brand-brown">My Wishlist</h1>
            <p className="text-xs text-gray-400">{products.length} saved item{products.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <Heart size={56} className="text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-500 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 text-sm mb-6">Tap the ♡ on any product to save it here</p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag size={16} /> Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {products.map((product) => {
                const variant = product.variants?.[0];
                return (
                  <motion.div
                    key={product.id}
                    layout
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group"
                  >
                    <Link to={`/product/${product.id}`} className="block relative">
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.badge && (
                        <span className="absolute top-2 left-2 bg-brand-gold text-brand-brown text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {product.badge}
                        </span>
                      )}
                    </Link>
                    <div className="p-3">
                      <Link to={`/product/${product.id}`}>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{product.category}</p>
                        <p className="font-semibold text-sm text-brand-brown leading-snug mb-2 line-clamp-2">{product.name}</p>
                      </Link>
                      {variant && (
                        <p className="text-brand-gold font-bold text-sm mb-3">{formatPrice(variant.price)}
                          <span className="text-gray-400 font-normal text-xs ml-1">/ {variant.weight}</span>
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => variant && addToCart({ ...product, variant: variant.weight, price: variant.price })}
                          className="flex-1 py-2 rounded-lg text-xs font-bold bg-brand-brown text-white hover:bg-brand-gold hover:text-brand-brown transition-colors"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => removeFromWishlist(product.id)}
                          className="p-2 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
