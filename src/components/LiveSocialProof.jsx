import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Star } from "lucide-react";

const NOTIFICATIONS = [
  { name: "Rahul K.",    city: "Delhi",      product: "Premium Almonds",       variant: "500g",  id: "premium-almonds",    ago: "2 min ago" },
  { name: "Priya S.",    city: "Mumbai",     product: "Whole Cashews W320",    variant: "250g",  id: "whole-cashews",      ago: "4 min ago" },
  { name: "Ananya P.",   city: "Bengaluru",  product: "Irani Pistachios",      variant: "500g",  id: "irani-pistachios",   ago: "6 min ago" },
  { name: "Vikram M.",   city: "Pune",       product: "Kashmiri Walnuts",      variant: "500g",  id: "kashmiri-walnuts",   ago: "3 min ago" },
  { name: "Sunita V.",   city: "Jaipur",     product: "Royal Gift Hamper",     variant: "1kg",   id: "royal-gift-hamper",  ago: "8 min ago" },
  { name: "Deepak J.",   city: "Kolkata",    product: "Premium Almonds",       variant: "1kg",   id: "premium-almonds",    ago: "5 min ago" },
  { name: "Meera T.",    city: "Ahmedabad",  product: "Whole Cashews W320",    variant: "500g",  id: "whole-cashews",      ago: "1 min ago" },
  { name: "Arjun N.",    city: "Hyderabad",  product: "Irani Pistachios",      variant: "250g",  id: "irani-pistachios",   ago: "7 min ago" },
  { name: "Kavya R.",    city: "Chennai",    product: "Kashmiri Walnuts",      variant: "1kg",   id: "kashmiri-walnuts",   ago: "9 min ago" },
  { name: "Rohit A.",    city: "Lucknow",    product: "Royal Gift Hamper",     variant: "2kg",   id: "royal-gift-hamper",  ago: "11 min ago" },
];

const SHOW_AFTER_MS   = 18000;   // first popup: 18 seconds after page load
const INTERVAL_MS     = 28000;   // subsequent: every 28 seconds
const DISPLAY_MS      = 5800;    // each toast shows for 5.8 seconds
const SNOOZE_KEY      = "jsd_proof_snoozed";
const SNOOZE_MS       = 2 * 60 * 60 * 1000; // 2 hours

const HIDDEN_PATHS = ["/checkout", "/cart", "/login", "/admin"];

export default function LiveSocialProof() {
  const [current, setCurrent] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const idxRef  = useRef(Math.floor(Math.random() * NOTIFICATIONS.length));
  const location = useLocation();

  const isHidden = HIDDEN_PATHS.some(p => location.pathname.startsWith(p));

  const isSnoozed = () => {
    const ts = localStorage.getItem(SNOOZE_KEY);
    return ts && Date.now() - Number(ts) < SNOOZE_MS;
  };

  const showNext = () => {
    if (isSnoozed()) return;
    idxRef.current = (idxRef.current + 1) % NOTIFICATIONS.length;
    setCurrent(NOTIFICATIONS[idxRef.current]);
    setTimeout(() => setCurrent(null), DISPLAY_MS);
  };

  useEffect(() => {
    if (isHidden) return;
    const first = setTimeout(showNext, SHOW_AFTER_MS);
    const interval = setInterval(showNext, INTERVAL_MS);
    return () => { clearTimeout(first); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const dismiss = () => {
    setCurrent(null);
    setDismissed(true);
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
  };

  if (isHidden || dismissed) return null;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.name + current.product}
          initial={{ opacity: 0, x: -80, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -60, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="fixed bottom-24 md:bottom-6 left-4 z-[180] max-w-[300px] w-[calc(100vw-32px)] md:w-72 pointer-events-auto"
          style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(201,168,76,0.18)" }}
        >
          {/* Gold top accent line */}
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #C9A84C, #E2C06A, #C9A84C)" }} />

          <div className="bg-white px-4 py-3.5 flex items-start gap-3">
            {/* Bag icon */}
            <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: "linear-gradient(135deg, #1B2E4B, #243D63)" }}>
              <ShoppingBag size={15} className="text-brand-gold" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-brand-brown leading-tight">
                {current.name} <span className="font-normal text-gray-400">from {current.city}</span>
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                Just bought{" "}
                <Link
                  to={`/product/${current.id}`}
                  className="font-semibold text-brand-brown hover:text-brand-gold transition-colors"
                >
                  {current.product}
                </Link>{" "}
                <span className="text-gray-400">({current.variant})</span>
              </p>
              {/* Stars + time */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {[1,2,3,4,5].map(s => <Star key={s} size={9} className="fill-amber-400 text-amber-400" />)}
                <span className="text-[10px] text-gray-400 ml-0.5">{current.ago}</span>
              </div>
            </div>

            {/* Dismiss */}
            <button onClick={dismiss} className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5 p-0.5">
              <X size={13} />
            </button>
          </div>

          {/* Pulse progress bar */}
          <motion.div
            className="h-[2px]"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: DISPLAY_MS / 1000, ease: "linear" }}
            style={{ transformOrigin: "left", background: "linear-gradient(90deg, #C9A84C, #E2C06A)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
