import React, { useEffect, useRef, useState } from "react";

export default function AnimatedCounter({ to, suffix = "", prefix = "", duration = 2 }) {
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;
    const end = parseInt(to.toString().replace(/\D/g, ""), 10);
    const totalFrames = Math.round(duration * 60);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.min(Math.round(eased * end), end));
      if (frame >= totalFrames) clearInterval(timer);
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [hasAnimated, to, duration]);

  const formatted = count >= 1000 ? count.toLocaleString("en-IN") : count;

  return (
    <span ref={ref}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
