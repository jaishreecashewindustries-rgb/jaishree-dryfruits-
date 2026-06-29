import React from "react";
import { motion, AnimatePresence } from "framer-motion";

function SlotDigit({ digit }) {
  return (
    <span style={{ display: "inline-block", overflow: "hidden", height: "1.25em", verticalAlign: "bottom", position: "relative" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 460, damping: 32, mass: 0.75 }}
          style={{ display: "block" }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function SlotCounter({ value, className = "" }) {
  return (
    <span className={className} aria-label={value}>
      {String(value).split("").map((char, i) =>
        /\d/.test(char) ? (
          <SlotDigit key={i} digit={char} />
        ) : (
          <span key={i}>{char}</span>
        )
      )}
    </span>
  );
}
