import React, { useEffect, useRef } from "react";

/* Pure Canvas 3D particle + orb scene — no external deps */
export default function Hero3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let W, H;

    /* ── Resize ─────────────────────────────────────────── */
    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── Particles ──────────────────────────────────────── */
    const PARTICLE_COUNT = 90;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.8 + 0.1,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      r: Math.random() * 1.8 + 0.5,
    }));

    /* ── 3D Orbs ────────────────────────────────────────── */
    const ORBS = [
      { cx: 0.72, cy: 0.5,  r: 120, phase: 0,    speed: 0.4, ampX: 0.04, ampY: 0.03, color1: "#C9A84C", color2: "#7A5010" },
      { cx: 0.18, cy: 0.35, r: 60,  phase: 2.1,  speed: 0.6, ampX: 0.03, ampY: 0.04, color1: "#E8C97A", color2: "#9E7A2E" },
      { cx: 0.6,  cy: 0.75, r: 45,  phase: 1.2,  speed: 0.9, ampX: 0.025, ampY: 0.03, color1: "#C9A84C", color2: "#3E2723" },
      { cx: 0.85, cy: 0.25, r: 35,  phase: 3.5,  speed: 1.1, ampX: 0.02,  ampY: 0.025, color1: "#FFD700", color2: "#9E7A2E" },
      { cx: 0.12, cy: 0.7,  r: 28,  phase: 0.8,  speed: 1.3, ampX: 0.03,  ampY: 0.02, color1: "#E8C97A", color2: "#4A3010" },
    ];

    /* ── Ring ───────────────────────────────────────────── */
    const RING = { cx: 0.72, cy: 0.5, rx: 90, ry: 30, phase: 0, speed: 0.35, ampX: 0.04, ampY: 0.03 };

    let t = 0;
    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, W, H);

      /* Background glow spots */
      const grd1 = ctx.createRadialGradient(W * 0.72, H * 0.5, 0, W * 0.72, H * 0.5, W * 0.45);
      grd1.addColorStop(0, "rgba(201,168,76,0.12)");
      grd1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd1;
      ctx.fillRect(0, 0, W, H);

      const grd2 = ctx.createRadialGradient(W * 0.2, H * 0.4, 0, W * 0.2, H * 0.4, W * 0.3);
      grd2.addColorStop(0, "rgba(232,201,122,0.07)");
      grd2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd2;
      ctx.fillRect(0, 0, W, H);

      /* Particles */
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        const alpha = 0.2 + p.z * 0.5;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r * p.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,201,122,${alpha})`;
        ctx.fill();
      });

      /* Connecting lines between nearby particles */
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const dx = (particles[i].x - particles[j].x) * W;
          const dy = (particles[i].y - particles[j].y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x * W, particles[i].y * H);
            ctx.lineTo(particles[j].x * W, particles[j].y * H);
            ctx.strokeStyle = `rgba(201,168,76,${0.06 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      /* Orbs */
      ORBS.forEach(orb => {
        const x = (orb.cx + Math.sin(t * orb.speed + orb.phase) * orb.ampX) * W;
        const y = (orb.cy + Math.cos(t * orb.speed * 0.7 + orb.phase) * orb.ampY) * H;
        const r = orb.r;

        /* Shadow glow */
        const shadow = ctx.createRadialGradient(x, y + r * 0.6, r * 0.1, x, y, r * 1.6);
        shadow.addColorStop(0, "rgba(201,168,76,0.15)");
        shadow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = shadow;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
        ctx.fill();

        /* Main sphere gradient */
        const lightX = x - r * 0.35;
        const lightY = y - r * 0.35;
        const grad = ctx.createRadialGradient(lightX, lightY, r * 0.05, x, y, r);
        grad.addColorStop(0, "#FFF8DC");
        grad.addColorStop(0.25, orb.color1);
        grad.addColorStop(0.7, orb.color2);
        grad.addColorStop(1, "#1C0A00");
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        /* Specular highlight */
        const spec = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, r * 0.4);
        spec.addColorStop(0, "rgba(255,255,220,0.55)");
        spec.addColorStop(1, "rgba(255,255,220,0)");
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = spec;
        ctx.fill();
      });

      /* Rotating ring around main orb */
      const rx = (RING.cx + Math.sin(t * RING.speed + RING.phase) * RING.ampX) * W;
      const ry = (RING.cy + Math.cos(t * RING.speed * 0.7 + RING.phase) * RING.ampY) * H;
      const angle = t * 0.5;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, RING.rx, RING.ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201,168,76,0.35)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      /* Second ring offset */
      ctx.rotate(1.1);
      ctx.beginPath();
      ctx.ellipse(0, 0, RING.rx * 0.75, RING.ry * 0.75, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(232,201,122,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
