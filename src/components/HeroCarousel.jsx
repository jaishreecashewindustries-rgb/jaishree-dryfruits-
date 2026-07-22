import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const AUTO_ADVANCE_MS = 3200;

// The hero images already fill the frame exactly (pre-cropped to this
// component's own aspect ratio), so plain object-position has zero slack
// to move anything — that's why the old top/center/bottom dropdown had no
// visible effect no matter what an admin picked. A fixed zoom creates real
// slack, and transform-origin (driven by the admin's 0-100 slider) decides
// which part of that zoomed image stays anchored — this is genuine
// cropping, independent of whether the source image matches the frame.
const CROP_ZOOM = 1.08;

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

  // Preload every slide's image up front — there are only ever 2-3 of them,
  // so the cost is trivial, and it's what actually fixed the "blue screen"
  // on transition: without it, an un-fetched image starts its opacity
  // fade-in with nothing painted yet, so the container's background shows
  // through for a beat until the browser finishes loading it.
  useEffect(() => {
    slides.forEach((s) => {
      if (s.desktopImage) { const img = new Image(); img.src = s.desktopImage; }
      if (s.mobileImage) { const img = new Image(); img.src = s.mobileImage; }
    });
  }, [slides]);

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
      <div className="relative w-full overflow-hidden aspect-[3/4] md:aspect-[16/9]" style={{ background: "var(--cream)" }}>
        {/* mode="sync" (not "popLayout") keeps the outgoing slide mounted and
            painted underneath while the incoming one fades in on top, so
            there's never a frame with nothing rendered — popLayout could
            unmount the old slide a beat before the new one finished loading,
            flashing the container's bare background through. Slow, gentle
            crossfade + a whisper of continued zoom (Ken Burns) reads as
            unhurried/premium rather than a hard cut. */}
        <AnimatePresence mode="sync">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }, scale: { duration: 3.5, ease: "easeOut" } }}
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
                  className="w-full h-full object-cover hero-crop-img"
                  style={{
                    "--hero-zoom": CROP_ZOOM,
                    "--hero-focus-y-mobile": `${slides[index].mobileFocusY ?? 50}%`,
                    "--hero-focus-y-desktop": `${slides[index].desktopFocusY ?? 50}%`,
                  }}
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
