import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const handler = () => {
      const nearBottom =
        window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 500;
      setVisible(window.scrollY > 500 && !nearBottom);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed bottom-20 md:bottom-8 left-0 right-0 flex justify-center z-[80] pointer-events-none"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="pointer-events-auto">
            <Link
              to="/products"
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-bold shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)",
                color: "#1B2E4B",
                boxShadow: "0 8px 32px rgba(201,168,76,0.45), 0 2px 8px rgba(0,0,0,0.15)",
                backdropFilter: "blur(10px)",
              }}
            >
              <ShoppingBag size={16} />
              Shop Premium Dry Fruits
              {totalItems > 0 && (
                <span className="bg-brand-brown text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
