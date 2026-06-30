import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/helpers";

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeFromCart, updateQty, subtotal, shipping, total, totalItems } = useCart();

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop — z-[55] above bottom nav, below sidebar */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[55] animate-fade-in" onClick={closeCart} />
      )}

      {/* Sidebar — z-[60] sits above mobile bottom nav (z-50) */}
      <div className={`fixed top-0 right-0 h-dvh w-full sm:w-[420px] bg-white z-[60] shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-brand-brown">
          <div className="flex items-center gap-2 text-white">
            <ShoppingBag size={20} />
            <h2 className="font-serif text-lg font-semibold">Your Cart</h2>
            {totalItems > 0 && (
              <span className="bg-brand-gold text-white text-xs px-2 py-0.5 rounded-full">{totalItems}</span>
            )}
          </div>
          <button onClick={closeCart} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        {/* Free shipping progress */}
        {subtotal < 499 && subtotal > 0 && (
          <div className="px-5 py-3 bg-brand-cream">
            <p className="text-xs text-brand-brown">
              Add <span className="font-bold text-brand-gold">{formatPrice(499 - subtotal)}</span> more for FREE shipping!
            </p>
            <div className="mt-1.5 bg-white rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-brand-gold rounded-full transition-all duration-500"
                style={{ width: `${Math.min((subtotal / 499) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
        {subtotal >= 499 && subtotal > 0 && (
          <div className="px-5 py-2 bg-green-50 text-green-700 text-xs font-semibold text-center">
            🎉 You've unlocked FREE shipping!
          </div>
        )}

        {/* Items */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag size={56} className="text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Add some premium dry fruits!</p>
              <button onClick={closeCart} className="mt-6 btn-primary">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.id}-${item.variantId}`} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-brand-brown leading-tight truncate">{item.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>
                  <p className="text-brand-gold font-bold text-sm mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button className="qty-btn w-7 h-7 text-base" onClick={() => updateQty(item.id, item.variantId, item.qty - 1)}>
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                      <button className="qty-btn w-7 h-7 text-base" onClick={() => updateQty(item.id, item.variantId, item.qty + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id, item.variantId)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 bg-white space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={`font-medium ${shipping === 0 ? "text-green-600" : ""}`}>
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-brand-brown font-bold text-base border-t border-gray-100 pt-2 mt-2">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link to="/checkout" onClick={closeCart} className="btn-primary w-full flex items-center justify-center gap-2">
              Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/cart" onClick={closeCart} className="block text-center text-sm text-brand-brown hover:text-brand-gold transition-colors">
              View Cart Details
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
