import React from "react";

/* Static CSS orb scene — identical visual to the canvas version, zero JS loop */
export default function Hero3D() {
  return (
    <div className="w-full h-full relative overflow-hidden" aria-hidden="true">

      {/* Ambient background glow */}
      <div style={{
        position: "absolute", top: "50%", left: "72%",
        width: 420, height: 420, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,168,76,0.13) 0%, transparent 68%)",
        transform: "translate(-50%,-50%) translate3d(0,0,0)",
        willChange: "transform", backfaceVisibility: "hidden",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "38%", left: "19%",
        width: 220, height: 220, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,201,122,0.08) 0%, transparent 70%)",
        transform: "translate(-50%,-50%) translate3d(0,0,0)",
        willChange: "transform", backfaceVisibility: "hidden",
        pointerEvents: "none",
      }} />

      {/* Main gold orb */}
      <div style={{
        position: "absolute", top: "50%", left: "72%",
        width: 240, height: 240, borderRadius: "50%",
        background: "radial-gradient(circle at 32% 32%, #FFF8DC 0%, #C9A84C 28%, #7A5010 65%, #1C0A00 100%)",
        transform: "translate(-50%,-50%) translate3d(0,0,0)",
        boxShadow: "0 0 80px 24px rgba(201,168,76,0.18), inset 0 0 0 0 transparent",
        willChange: "transform", backfaceVisibility: "hidden",
      }} />
      {/* Specular highlight */}
      <div style={{
        position: "absolute", top: "50%", left: "72%",
        width: 240, height: 240, borderRadius: "50%",
        background: "radial-gradient(circle at 32% 32%, rgba(255,255,220,0.52) 0%, rgba(255,255,220,0) 45%)",
        transform: "translate(-50%,-50%) translate3d(0,0,0)",
        willChange: "transform", backfaceVisibility: "hidden",
        pointerEvents: "none",
      }} />

      {/* Decorative rings */}
      <div style={{
        position: "absolute", top: "50%", left: "72%",
        width: 290, height: 96,
        border: "2.5px solid rgba(201,168,76,0.34)",
        borderRadius: "50%",
        transform: "translate(-50%,-50%) rotate(-22deg) translate3d(0,0,0)",
        willChange: "transform", backfaceVisibility: "hidden",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "72%",
        width: 218, height: 72,
        border: "1px solid rgba(232,201,122,0.18)",
        borderRadius: "50%",
        transform: "translate(-50%,-50%) rotate(14deg) translate3d(0,0,0)",
        willChange: "transform", backfaceVisibility: "hidden",
        pointerEvents: "none",
      }} />

      {/* Secondary orb top-left */}
      <div style={{
        position: "absolute", top: "35%", left: "18%",
        width: 120, height: 120, borderRadius: "50%",
        background: "radial-gradient(circle at 33% 33%, #FFF8DC 0%, #E8C97A 30%, #9E7A2E 65%, #1C0A00 100%)",
        transform: "translate(-50%,-50%) translate3d(0,0,0)",
        boxShadow: "0 0 40px 10px rgba(232,201,122,0.12)",
        willChange: "transform", backfaceVisibility: "hidden",
      }} />
      {/* Specular on secondary */}
      <div style={{
        position: "absolute", top: "35%", left: "18%",
        width: 120, height: 120, borderRadius: "50%",
        background: "radial-gradient(circle at 33% 33%, rgba(255,255,220,0.48) 0%, rgba(255,255,220,0) 42%)",
        transform: "translate(-50%,-50%) translate3d(0,0,0)",
        willChange: "transform", backfaceVisibility: "hidden",
        pointerEvents: "none",
      }} />

      {/* Tertiary small orb */}
      <div style={{
        position: "absolute", top: "75%", left: "60%",
        width: 90, height: 90, borderRadius: "50%",
        background: "radial-gradient(circle at 33% 33%, #FFF8DC 0%, #C9A84C 30%, #3E2723 80%)",
        transform: "translate(-50%,-50%) translate3d(0,0,0)",
        boxShadow: "0 0 28px 6px rgba(201,168,76,0.10)",
        willChange: "transform", backfaceVisibility: "hidden",
      }} />

      {/* Accent tiny orb */}
      <div style={{
        position: "absolute", top: "25%", left: "85%",
        width: 70, height: 70, borderRadius: "50%",
        background: "radial-gradient(circle at 33% 33%, #FFD700 0%, #9E7A2E 50%, #1C0A00 100%)",
        transform: "translate(-50%,-50%) translate3d(0,0,0)",
        boxShadow: "0 0 22px 5px rgba(255,215,0,0.09)",
        willChange: "transform", backfaceVisibility: "hidden",
      }} />

      {/* Floating dust particles — pure CSS, no JS */}
      {[
        { top: "15%", left: "40%", size: 3, opacity: 0.28 },
        { top: "60%", left: "30%", size: 2, opacity: 0.22 },
        { top: "80%", left: "50%", size: 2.5, opacity: 0.18 },
        { top: "30%", left: "55%", size: 1.8, opacity: 0.24 },
        { top: "70%", left: "80%", size: 2, opacity: 0.20 },
        { top: "45%", left: "90%", size: 2.5, opacity: 0.16 },
        { top: "10%", left: "65%", size: 1.5, opacity: 0.20 },
        { top: "88%", left: "25%", size: 2, opacity: 0.18 },
      ].map((dot, i) => (
        <div key={i} style={{
          position: "absolute",
          top: dot.top, left: dot.left,
          width: dot.size, height: dot.size,
          borderRadius: "50%",
          background: `rgba(232,201,122,${dot.opacity})`,
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
          pointerEvents: "none",
        }} />
      ))}
    </div>
  );
}
