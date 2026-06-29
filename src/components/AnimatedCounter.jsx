import React, { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export default function AnimatedCounter({ to, suffix = "", prefix = "", duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = parseInt(to.toString().replace(/\D/g, ""), 10);
    const totalFrames = Math.round(duration * 60);
    const step = end / totalFrames;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.min(Math.round(eased * end), end);
      setCount(start);
      if (frame >= totalFrames) clearInterval(timer);
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [isInView, to, duration]);

  const formatted = count >= 1000 ? count.toLocaleString("en-IN") : count;

  return (
    <span ref={ref}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
