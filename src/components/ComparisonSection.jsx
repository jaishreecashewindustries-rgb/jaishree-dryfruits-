import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const OURS = [
  "Never touched by bare hands",
  "Direct from source, no middleman",
  "Sealed fresh, not an open bin",
  "No additives or preservatives",
  "Whole pieces, never broken bits",
  "NABL lab-tested for purity",
];

export default function ComparisonSection({ productImage }) {
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-20 md:gap-6 items-center px-4">
      {/* Ours — real product photo, checklist stacked below it (no cramped overlay) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-center gap-6 md:gap-8"
      >
        <div className="relative flex-shrink-0" style={{ width: "min(200px, 55vw)" }}>
          <div className="relative rounded-full overflow-hidden" style={{ aspectRatio: "1/1", boxShadow: "0 16px 40px rgba(27,46,75,0.18)" }}>
            {productImage && <img src={productImage} alt="Jai Shree Dryfruits" className="w-full h-full object-cover" />}
          </div>
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
            style={{ background: "var(--navy)", color: "var(--gold)" }}
          >
            Jai Shree Dryfruits
          </div>
        </div>
        <ul className="space-y-2.5">
          {OURS.map((p, i) => (
            <motion.li
              key={p}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
              className="flex items-center gap-2.5 text-sm text-brand-brown"
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--gold)" }}>
                <Check size={11} color="#fff" strokeWidth={3} />
              </span>
              {p}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Ordinary — plain generic pouch silhouette */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="relative mx-auto"
        style={{ width: "min(180px, 50vw)" }}
      >
        <div
          className="relative rounded-full overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: "1/1", background: "linear-gradient(160deg, #d8dce1, #b9c0c7)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80 px-6 text-center">Regular Dry Fruits</p>
        </div>
        <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center bg-white" style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
          <X size={18} className="text-red-400" strokeWidth={3} />
        </div>
      </motion.div>
    </div>
  );
}
