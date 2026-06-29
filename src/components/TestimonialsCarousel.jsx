import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const SLIDE_VARIANTS = {
  enter: (dir) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0, scale: 0.95 }),
  center: { x: "0%", opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0, scale: 0.95 }),
};

export default function TestimonialsCarousel({ testimonials }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);

  const go = useCallback((newIdx, direction) => {
    setDir(direction);
    setIdx(newIdx);
  }, []);

  const prev = () => go((idx - 1 + testimonials.length) % testimonials.length, -1);
  const next = useCallback(() => go((idx + 1) % testimonials.length, 1), [idx, testimonials.length, go]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 4800);
    return () => clearInterval(t);
  }, [next, paused]);

  const t = testimonials[idx];
  if (!t) return null;

  // Show 3 cards on desktop: center + partial sides
  const getVisible = () => {
    const len = testimonials.length;
    return [-1, 0, 1].map(offset => testimonials[(idx + offset + len) % len]);
  };
  const visible = getVisible();

  return (
    <div
      className="relative px-4 md:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Desktop: 3-card layout */}
      <div className="hidden md:flex items-center justify-center gap-4 max-w-5xl mx-auto">
        {visible.map((item, i) => {
          const isCenter = i === 1;
          return (
            <motion.div
              key={item.name + item.text.slice(0, 10)}
              animate={{
                scale: isCenter ? 1 : 0.9,
                opacity: isCenter ? 1 : 0.5,
                y: isCenter ? 0 : 12,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative rounded-2xl p-6 flex-shrink-0"
              style={{
                width: isCenter ? 340 : 280,
                background: isCenter
                  ? "linear-gradient(145deg, #fff 0%, #FDFAF3 100%)"
                  : "linear-gradient(145deg, #f9f9fb 0%, #f4f6ff 100%)",
                border: `1px solid ${isCenter ? "rgba(201,168,76,0.25)" : "rgba(201,168,76,0.08)"}`,
                boxShadow: isCenter ? "0 12px 40px rgba(27,46,75,0.1)" : "0 2px 8px rgba(27,46,75,0.04)",
              }}
            >
              {/* Quote mark */}
              <Quote size={24} style={{ color: "rgba(201,168,76,0.25)" }} className="mb-3" />
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(item.rating || 5)].map((_, j) => (
                  <Star key={j} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">"{item.text}"</p>
              <div className="border-t border-brand-gold/10 pt-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-brand-brown text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.city}</p>
                </div>
                <span
                  className="text-[10px] px-2 py-1 rounded-lg font-medium"
                  style={{ background: "rgba(201,168,76,0.1)", color: "#9E7A2E", border: "1px solid rgba(201,168,76,0.2)" }}
                >
                  {item.product}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: single card with slide animation */}
      <div className="md:hidden relative overflow-hidden" style={{ minHeight: 220 }}>
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={idx}
            custom={dir}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="rounded-2xl p-5 mx-auto"
            style={{
              maxWidth: 340,
              background: "linear-gradient(145deg, #fff 0%, #FDFAF3 100%)",
              border: "1px solid rgba(201,168,76,0.2)",
              boxShadow: "0 8px 30px rgba(27,46,75,0.08)",
            }}
          >
            <Quote size={22} style={{ color: "rgba(201,168,76,0.25)" }} className="mb-2" />
            <div className="flex gap-0.5 mb-2">
              {[...Array(t.rating || 5)].map((_, j) => (
                <Star key={j} size={12} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">"{t.text}"</p>
            <div className="border-t border-brand-gold/10 pt-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-brand-brown text-sm">{t.name}</p>
                <p className="text-xs text-gray-400">{t.city}</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "rgba(201,168,76,0.1)", color: "#9E7A2E", border: "1px solid rgba(201,168,76,0.2)" }}>
                {t.product}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next buttons */}
      <button
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(201,168,76,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
        aria-label="Previous review"
      >
        <ChevronLeft size={16} style={{ color: "#1B2E4B" }} />
      </button>
      <button
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(201,168,76,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
        aria-label="Next review"
      >
        <ChevronRight size={16} style={{ color: "#1B2E4B" }} />
      </button>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => go(i, i > idx ? 1 : -1)}
            animate={{ width: i === idx ? 20 : 8, opacity: i === idx ? 1 : 0.35 }}
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
            className="h-2 rounded-full"
            style={{ background: "#C9A84C" }}
            aria-label={`Go to review ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
