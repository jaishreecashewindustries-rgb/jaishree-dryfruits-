import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/helpers";

const IDLE_MS = 30 * 60 * 1000;   // 30 minutes idle with items in cart
const SNOOZE_KEY = "jsd_cart_reminder_snoozed";
const SNOOZE_MS = 6 * 60 * 60 * 1000; // don't show again for 6 hours after dismiss

export default function AbandonedCartReminder() {
  const { items, subtotal, totalItems } = useCart();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const location = useLocation();

  // Don't show on cart/checkout pages
  const isCartFlow = ["/cart", "/checkout"].includes(location.pathname);

  const isSnoozed = () => {
    const ts = localStorage.getItem(SNOOZE_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < SNOOZE_MS;
  };

  const resetTimer = () => {
    clearTimeout(timerRef.current);
    if (items.length === 0 || isCartFlow || isSnoozed()) return;
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, IDLE_MS);
  };

  // Reset timer whenever cart changes or user moves
  useEffect(() => {
    resetTimer();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, location.pathname]);

  // Track user activity — any interaction resets the idle timer
  useEffect(() => {
    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    const handler = () => resetTimer();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, location.pathname]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
  };

  const whatsappText = encodeURIComponent(
    `Hi! I left some items in my cart on Jai Shree Dryfruits and need help completing my order.\n\nItems:\n${items.map((i) => `• ${i.name} (${i.variant}) × ${i.qty} — ₹${i.price * i.qty}`).join("\n")}\n\nTotal: ₹${subtotal}`
  );

  if (!visible || items.length === 0 || isCartFlow) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[200] shadow-2xl"
          style={{ borderRadius: 20, overflow: "hidden" }}
          role="alertdialog"
          aria-label="You have items in your cart"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: "linear-gradient(135deg, #1B2E4B, #243D63)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={14} className="text-white" />
              </div>
              <div>
                <p className="text-white text-xs font-bold tracking-wide">Still thinking?</p>
                <p className="text-white/60 text-[10px]">{totalItems} item{totalItems > 1 ? "s" : ""} waiting in your cart</p>
              </div>
            </div>
            <button onClick={dismiss} className="text-white/40 hover:text-white transition-colors ml-2">
              <X size={16} />
            </button>
          </div>

          {/* Items preview */}
          <div className="bg-white px-5 py-4">
            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.id}-${item.variantId}`} className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-brown truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.variant} × {item.qty}</p>
                  </div>
                  <p className="text-xs font-bold text-brand-gold flex-shrink-0">{formatPrice(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4 pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-base font-bold text-brand-brown">{formatPrice(subtotal)}</p>
            </div>

            <div className="flex gap-2">
              <Link
                to="/cart"
                onClick={dismiss}
                className="flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #1B2E4B, #243D63)" }}
              >
                <ShoppingCart size={13} /> Complete Order
              </Link>
              <a
                href={`https://wa.me/917568577968?text=${whatsappText}`}
                target="_blank"
                rel="noreferrer"
                onClick={dismiss}
                className="flex items-center justify-center gap-1.5 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
                title="Need help? Chat with us"
              >
                <MessageCircle size={13} /> Help?
              </a>
            </div>

            <p className="text-center text-[10px] text-gray-400 mt-2">
              Use <span className="font-bold text-brand-gold">WELCOME15</span> for 15% off your first order
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
