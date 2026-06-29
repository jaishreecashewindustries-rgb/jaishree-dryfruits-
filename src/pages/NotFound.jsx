import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #F4F6FF 0%, #F4F0E8 100%)" }}>
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.p
          className="font-serif text-[120px] leading-none font-light text-brand-gold opacity-20 select-none"
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          404
        </motion.p>
        <div className="-mt-8">
          <div className="w-16 h-px mx-auto mb-6" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          <h1 className="font-serif text-3xl text-brand-brown font-semibold mb-3">Page Not Found</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            The page you are looking for may have been moved or does not exist. Let us guide you back to our premium collection.
          </p>
          <div className="flex gap-3 justify-center">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/" className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-brand-brown/20 text-brand-brown hover:bg-brand-cream transition-colors">
                <Home size={15} /> Go Home
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/products" className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
                <ShoppingBag size={15} /> Shop Now
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
