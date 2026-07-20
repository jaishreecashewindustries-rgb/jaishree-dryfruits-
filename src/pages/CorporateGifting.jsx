import React, { useState } from "react";
import SEO from "../components/SEO";
import B2BGiftingForm from "../components/B2BGiftingForm";

// Moved off the Product Detail Page — a full-page concierge pitch belongs
// on its own destination (linked from PDP/Cart/Footer/main nav via a small
// CTA), not stacked into every product's purchase flow.
export default function CorporateGifting() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #0D1B35 0%, #1A2744 100%)" }}>
      <SEO
        title="Corporate & Wedding Gifting — Jai Shree Dryfruits"
        description="Premium branded gift boxes for corporates, weddings & festive gifting. Minimum 50 units, custom branding, pan-India bulk delivery."
      />
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.12)" }}>
          {/* Left: Copy */}
          <div className="px-8 py-10 md:px-12 md:py-14 border-b md:border-b-0 md:border-r border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[4px] text-brand-gold mb-6">Corporate &amp; Wedding Gifting</p>
            <h1 className="font-serif text-3xl md:text-4xl font-normal text-white leading-tight mb-5">
              The Concierge<br />
              <em style={{ color: "#E8C97A" }}>Gifting Programme</em>
            </h1>
            <p className="text-white/50 text-sm leading-relaxed mb-7">
              For organisations, wedding planners, and procurement teams seeking premium branded gift boxes at scale. Minimum 50 units. Full customisation available — logo, message card, custom weight assortments.
            </p>
            <div className="space-y-2.5 mb-8">
              {[
                "Custom packaging with your logo or occasion message",
                "Budget brackets from ₹500 to ₹5,000+ per box",
                "Pan-India bulk delivery coordinated from Jaipur",
                "Personalised catalogue and invoice within 2 hours",
                "Dedicated account manager for repeat clients",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-white/60">
                  <span className="w-1 h-1 rounded-full bg-brand-gold flex-shrink-0 mt-2" />
                  {item}
                </div>
              ))}
            </div>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-gold btn-sheen px-8 py-3.5 text-[10px] tracking-[3px]">
                Request Corporate Catalogue
              </button>
            )}
          </div>
          {/* Right: Form / Stats */}
          <div className="px-8 py-10 md:px-10 md:py-14">
            {showForm ? (
              <B2BGiftingForm theme="dark" onClose={() => setShowForm(false)} />
            ) : (
              <div className="grid grid-cols-2 gap-4 h-full content-center">
                {[
                  { num: "50+", label: "Min units" },
                  { num: "₹500–₹5K", label: "Per box range" },
                  { num: "2 hrs", label: "Response time" },
                  { num: "100+", label: "Corporates served" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.12)" }}>
                    <p className="font-serif text-2xl font-semibold text-brand-gold">{s.num}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
