import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const AUTO_ADVANCE_MS = 3200;

// Literal class names (not template-built) so Tailwind's JIT scanner picks
// them up at build time — admin sets desktopFocus/mobileFocus per slide in
// Content Management → Hero / Banner, this maps that to the matching
// object-position utility for each breakpoint.
const MOBILE_FOCUS_CLASS = { top: "object-top", center: "object-center", bottom: "object-bottom" };
const DESKTOP_FOCUS_CLASS = { top: "md:object-top", center: "md:object-center", bottom: "md:object-bottom" };

/**
 * Admin-controlled hero carousel — auto-rotates through slides, each with
 * its own desktop (wide) and mobile (portrait) image, dot navigation for
 * manual control, swipe support on touch. The FIRST slide's image is eager
 * + fetchpriority=high (it's the page's LCP element); the rest lazy-load
 * since they're not visible on initial paint.
 */
export default function HeroCarousel({ slides, fallbackHeadline }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const count = slides.length;

  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(next, AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [next, paused, count]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  if (!count) return null;

  return (
    <section
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h1 className="sr-only">{fallbackHeadline}</h1>
      {/* Images are pre-cropped server-side to exactly this ratio (3:4
          portrait / 16:9 landscape — see scripts/refit-hero-images.mjs), so
          object-cover here fills the frame edge-to-edge with zero surprise
          cropping and zero letterbox gaps. */}
      <div className="relative w-full overflow-hidden aspect-[3/4] md:aspect-[16/9]" style={{ background: "var(--navy)" }}>
        {/* mode="sync" (not "popLayout") keeps the outgoing slide mounted and
            painted underneath while the incoming one fades in on top, so
            there's never a frame with nothing rendered — popLayout could
            unmount the old slide a beat before the new one finished loading,
            flashing the container's bare background through. */}
        <AnimatePresence mode="sync">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Link to="/products" className="block w-full h-full">
              <picture>
                {slides[index].mobileImage && <source media="(max-width: 767px)" srcSet={slides[index].mobileImage} />}
                <img
                  src={slides[index].desktopImage || slides[index].mobileImage}
                  alt={fallbackHeadline}
                  fetchpriority={index === 0 ? "high" : undefined}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className={`w-full h-full object-cover ${MOBILE_FOCUS_CLASS[slides[index].mobileFocus] || "object-center"} ${DESKTOP_FOCUS_CLASS[slides[index].desktopFocus] || "md:object-center"}`}
                />
              </picture>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Arrows — desktop only, subtle */}
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => goTo(index - 1)}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 items-center justify-center hover:bg-white transition-colors z-10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2E4B" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => goTo(index + 1)}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 items-center justify-center hover:bg-white transition-colors z-10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2E4B" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </>
        )}

        {/* Dots — the "scroll option" to jump directly to a slide */}
        {count > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === index ? 22 : 7,
                  height: 7,
                  background: i === index ? "var(--gold)" : "rgba(255,255,255,0.6)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
