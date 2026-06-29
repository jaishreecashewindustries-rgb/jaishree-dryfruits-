import React from "react";
import { motion } from "framer-motion";
import { Shield, Truck, RotateCcw, Award, Phone } from "lucide-react";

const ITEMS = [
  { icon: Shield, text: "100% Pure & Natural" },
  { icon: Truck, text: "Free Shipping ₹499+" },
  { icon: Award, text: "FSSAI Certified" },
  { icon: RotateCcw, text: "7-Day Easy Returns" },
  { icon: Phone, text: "24/7 WhatsApp Support" },
  { icon: Shield, text: "Secure Payments" },
  { icon: Award, text: "Est. 1999 · Jaipur" },
  { icon: Truck, text: "Pan-India Delivery" },
];

export default function TrustBar() {
  return (
    <div className="overflow-hidden py-2.5 border-y border-brand-gold/15"
      style={{ background: "linear-gradient(90deg, #F4F0E8, #FBF8F2, #F4F0E8)" }}>
      <motion.div
        className="flex gap-0 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-6">
            <item.icon size={13} className="text-brand-gold flex-shrink-0" />
            <span className="text-xs font-semibold text-brand-brown uppercase tracking-wider">
              {item.text}
            </span>
            <span className="text-brand-gold/30 ml-4">◆</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
