import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export default function ImageLightbox({ images = [], alt = "" }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setActive((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft") setActive((p) => (p - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, images.length]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Main image — object-contain (not cover) so non-square product photos
          display in full instead of being cropped to fit the square frame. */}
      <div className="relative group cursor-zoom-in w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden" onClick={() => setOpen(true)}>
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={images[active]}
            alt={alt}
            loading="eager"
            fetchpriority="high"
            className="w-full h-full object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
          <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>

      {/* Thumbnails — side-scrollable row */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 bg-gray-50 transition-all ${
                active === i ? "border-brand-gold shadow-md" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt="" loading="lazy" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <button className="absolute top-5 right-5 text-white/70 hover:text-white z-10 p-2" onClick={() => setOpen(false)}>
              <X size={28} />
            </button>
            {images.length > 1 && (
              <>
                <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                  onClick={() => setActive((p) => (p - 1 + images.length) % images.length)}>
                  <ChevronLeft size={24} />
                </button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                  onClick={() => setActive((p) => (p + 1) % images.length)}>
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <AnimatePresence mode="wait">
              <motion.img
                key={active}
                src={images[active]}
                alt={alt}
                className="relative z-10 max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === active ? "bg-brand-gold w-5" : "bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
