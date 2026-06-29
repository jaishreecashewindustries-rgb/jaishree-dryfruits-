import React, { useEffect, useRef } from "react";

/*
  Luxury cursor — thin gold crosshair (Hermès / Bottega style).
  Uses vanilla RAF + CSS transform for zero-jank, zero-library rendering.
  Expands to a filled circle on hover over interactive elements.
  Renders on ALL pages including Login (mounted at App root).
*/
export default function CustomCursor() {
  const cursorRef = useRef(null);
  const pos = useRef({ x: -200, y: -200 });
  const smoothPos = useRef({ x: -200, y: -200 });
  const hovering = useRef(false);
  const raf = useRef(null);
  const visible = useRef(false);

  useEffect(() => {
    // Touch devices: do nothing
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const el = cursorRef.current;
    if (!el) return;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        el.style.opacity = "1";
      }
    };

    const onOver = (e) => {
      const hit = e.target.closest("a,button,[role=button],label,select,input,textarea,[data-hover]");
      hovering.current = !!hit;
    };

    const onLeave = () => { el.style.opacity = "0"; visible.current = false; };

    const lerp = (a, b, t) => a + (b - a) * t;
    const SPEED = 0.14;

    const tick = () => {
      smoothPos.current.x = lerp(smoothPos.current.x, pos.current.x, SPEED);
      smoothPos.current.y = lerp(smoothPos.current.y, pos.current.y, SPEED);
      el.style.transform = `translate(${smoothPos.current.x}px,${smoothPos.current.y}px) translate(-50%,-50%)`;

      if (hovering.current) {
        el.classList.add("cursor-hover");
      } else {
        el.classList.remove("cursor-hover");
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Don't render on touch devices at all
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          *, *::before, *::after { cursor: none !important; }
        }
        .lux-cursor {
          position: fixed;
          top: 0; left: 0;
          width: 24px; height: 24px;
          pointer-events: none;
          z-index: 999999;
          opacity: 0;
          will-change: transform;
          transition: opacity 0.2s ease;
        }
        .lux-cursor::before,
        .lux-cursor::after {
          content: '';
          position: absolute;
          background: #C9A84C;
          transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
        }
        /* Horizontal bar */
        .lux-cursor::before {
          width: 18px; height: 1px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }
        /* Vertical bar */
        .lux-cursor::after {
          width: 1px; height: 18px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }
        /* Center dot */
        .lux-cursor-dot {
          position: absolute;
          top: 50%; left: 50%;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #C9A84C;
          transform: translate(-50%, -50%);
          transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
        }
        /* Hover: collapse cross → filled circle */
        .lux-cursor.cursor-hover::before {
          width: 0; height: 0;
        }
        .lux-cursor.cursor-hover::after {
          width: 0; height: 0;
        }
        .lux-cursor.cursor-hover .lux-cursor-dot {
          width: 28px; height: 28px;
          background: rgba(201,168,76,0.18);
          border: 1.5px solid rgba(201,168,76,0.7);
        }
        @media (prefers-reduced-motion: reduce) {
          .lux-cursor { display: none !important; }
          *, *::before, *::after { cursor: auto !important; }
        }
      `}</style>
      <div ref={cursorRef} className="lux-cursor">
        <div className="lux-cursor-dot" />
      </div>
    </>
  );
}
