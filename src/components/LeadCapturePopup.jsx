import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Tag } from "lucide-react";
import toast from "react-hot-toast";

const HIDDEN_PATHS = ["/checkout", "/cart", "/login", "/admin"];

export default function LeadCapturePopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const location = useLocation();
  const isHidden = HIDDEN_PATHS.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    if (isHidden) return;
    const dismissed = sessionStorage.getItem("lead_popup_dismissed");
    if (dismissed) return;
    // Show after 18 seconds
    const timer = setTimeout(() => setOpen(true), 18000);
    // Also show on exit intent
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !sessionStorage.getItem("lead_popup_dismissed")) {
        setOpen(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHidden]);

  const dismiss = () => {
    setOpen(false);
    sessionStorage.setItem("lead_popup_dismissed", "1");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast.success("Coupon code sent! Check your email.");
    setTimeout(() => {
      dismiss();
    }, 2500);
  };

  if (isHidden) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            className="fixed z-[301] inset-0 flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
              style={{ background: "linear-gradient(135deg, #1B2E4B 0%, #0B3D2E 100%)" }}>
              {/* Gold shimmer top bar */}
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C)" }} />

              <button onClick={dismiss}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10">
                <X size={20} />
              </button>

              <div className="px-8 py-8">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -5, 0] }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)" }}
                  >
                    <Gift size={28} className="text-brand-gold" />
                  </motion.div>
                </div>

                {!submitted ? (
                  <>
                    <h2 className="font-serif text-2xl text-white text-center font-semibold mb-1">
                      Exclusive 15% Off
                    </h2>
                    <p className="text-white/60 text-sm text-center mb-6">
                      Join 50,000+ families. Get your first order discount delivered to your inbox.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Your email address"
                        required
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                      />
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl font-semibold text-sm text-brand-brown"
                        style={{ background: "linear-gradient(135deg, #C9A84C, #E8C96A)" }}
                      >
                        Claim My 15% Discount
                      </motion.button>
                    </form>

                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Tag size={12} className="text-white/30" />
                      <p className="text-white/30 text-xs">No spam. Unsubscribe anytime.</p>
                    </div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-4"
                  >
                    <p className="text-2xl mb-2">✓</p>
                    <h3 className="font-serif text-xl text-white mb-1">Welcome to Jai Shree Family!</h3>
                    <p className="text-white/60 text-sm">Use code <span className="text-brand-gold font-bold">WELCOME15</span> at checkout</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
