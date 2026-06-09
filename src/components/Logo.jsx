import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ dark = false, size = "md" }) {
  const heights = { sm: 36, md: 48, lg: 64 };
  const h = heights[size] || 48;

  return (
    <Link to="/" className="flex items-center select-none group">
      <img
        src="/logo.png"
        alt="Jai Shree Dry Fruits"
        style={{ height: h, width: "auto" }}
        className="object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
      />
    </Link>
  );
}
