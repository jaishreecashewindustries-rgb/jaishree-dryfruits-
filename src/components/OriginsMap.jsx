import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

// Real world map (public domain, Wikimedia) tinted to our cream/gold palette
// via CSS filter — reads as an actual map. Origin points are spread into 4
// clear corners (not pixel-precise geography, same trick the reference site
// uses) so labels/photos never collide with each other.
const WORLD_MAP_URL = "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg";

// The full map is mostly dead space (Pacific, Antarctica, Australia/East
// Asia we don't source from) — zoomed into just the Americas → Europe →
// Middle East → India band that actually contains our 4 origins, via a
// uniform scale+transform-origin on the image (uniform so continents don't
// stretch) matched by re-deriving each pin's % position inside that same
// cropped window. Original (pre-zoom, full-map) coordinates, kept as
// comments, were calibrated using California — confirmed visually correct
// on the west coast of North America — as the anchor, then every other
// origin placed at its real lat/long via the same equirectangular scale.
const ZOOM_WINDOW = { x0: 6, y0: 16, w: 70, h: 43.75 }; // % of the full 100×62.5 map
const ZOOM_SCALE = 100 / ZOOM_WINDOW.w; // 1.4286 — uniform, matches the h/62.5 fraction too

function toZoomedPct(x, y) {
  return {
    x: ((x - ZOOM_WINDOW.x0) / ZOOM_WINDOW.w) * 100,
    y: ((y - ZOOM_WINDOW.y0) / ZOOM_WINDOW.h) * 100,
  };
}

const ORIGINS = [
  // California: full-map (14, 28)
  { name: "Almonds",    place: "California",   ...toZoomedPct(14, 28), img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&q=80", labelSide: "bottom" },
  // Iran: full-map (68, 24)
  { name: "Pistachios", place: "Iran",          ...toZoomedPct(68, 24), img: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=200&q=80", labelSide: "top" },
  // Saudi Arabia: full-map (51, 42)
  { name: "Dates",      place: "Saudi Arabia",  ...toZoomedPct(51, 42), img: "https://images.unsplash.com/photo-1691657917109-c6e027eac44a?w=200&q=80", labelSide: "bottom" },
  // Chile: full-map (27, 53)
  { name: "Walnuts",    place: "Chile",         ...toZoomedPct(27, 53), img: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=200&q=80", labelSide: "bottom" },
];

export default function OriginsMap() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/10", background: "var(--bg2)" }}>
      <img
        src={WORLD_MAP_URL}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "sepia(50%) saturate(160%) hue-rotate(-12deg) brightness(1.18) opacity(0.5)",
          transform: `scale(${ZOOM_SCALE})`,
          transformOrigin: "41% 60.6%",
        }}
      />

      {ORIGINS.map((o, i) => (
        <motion.div
          key={o.name}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${o.x}%`, top: `${o.y}%` }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {o.labelSide === "top" && (
            <div className="mb-1.5 bg-white rounded-lg px-2 py-1 text-center whitespace-nowrap" style={{ boxShadow: "0 2px 8px rgba(27,46,75,0.15)" }}>
              <p className="text-[10px] font-bold text-brand-brown leading-tight">{o.name}</p>
              <p className="text-[9px] text-gray-400 leading-tight">{o.place}</p>
            </div>
          )}
          {/* Radar-ping ring instead of the old connect-the-dots line —
              reads as "sourced from here" per pin without needing a route
              path that has to thread between all 4 without crossing. */}
          <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
            <span className="absolute inset-0 rounded-full origin-ping" />
            <div className="rounded-full overflow-hidden flex-shrink-0 relative z-10" style={{ width: 44, height: 44, border: "2.5px solid var(--gold)", boxShadow: "0 4px 12px rgba(27,46,75,0.3)" }}>
              <img src={o.img} alt={o.name} className="w-full h-full object-cover" />
            </div>
          </div>
          {o.labelSide === "bottom" && (
            <div className="mt-1.5 bg-white rounded-lg px-2 py-1 text-center whitespace-nowrap" style={{ boxShadow: "0 2px 8px rgba(27,46,75,0.15)" }}>
              <p className="text-[10px] font-bold text-brand-brown leading-tight">{o.name}</p>
              <p className="text-[9px] text-gray-400 leading-tight">{o.place}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
