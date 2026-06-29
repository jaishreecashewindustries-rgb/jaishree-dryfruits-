import React from "react";
import { CheckCircle, Truck, Award, Star, Shield, Leaf, Gift, Zap, Package } from "lucide-react";

const ITEMS = [
  { Icon: Shield,       text: "100% Natural & Pure" },
  { Icon: Award,        text: "FSSAI Certified" },
  { Icon: Truck,        text: "Free Delivery ₹499+" },
  { Icon: Star,         text: "50,000+ Happy Customers" },
  { Icon: Leaf,         text: "No Preservatives Added" },
  { Icon: Gift,         text: "Premium Gift Hampers" },
  { Icon: CheckCircle,  text: "Quality Tested Every Batch" },
  { Icon: Zap,          text: "Same-Day Dispatch" },
  { Icon: Package,      text: "Eco-Friendly Packaging" },
];

const ALL = [...ITEMS, ...ITEMS];

export default function TrustMarquee() {
  return (
    <div
      className="overflow-hidden py-2.5"
      style={{
        background: "linear-gradient(90deg, #1A2744 0%, #1B2E4B 50%, #1A2744 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
        maskImage:       "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
      }}
    >
      <div className="flex gap-0 marquee-track-fast" style={{ width: "max-content" }}>
        {ALL.map((item, i) => (
          <div key={i} className="flex items-center flex-shrink-0 px-5 gap-2">
            <item.Icon size={11} style={{ color: "#C9A84C", flexShrink: 0 }} />
            <span
              className="text-white/75 whitespace-nowrap font-sans"
              style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500 }}
            >
              {item.text}
            </span>
            <span className="ml-4 flex-shrink-0" style={{ width: 1, height: 12, background: "rgba(201,168,76,0.22)", display: "inline-block" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
