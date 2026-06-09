import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Package, Phone, ChevronDown, ChevronUp } from "lucide-react";

const PRODUCTS = [
  { name: "Premium Cashews (W240)", basePrice: 850, unit: "kg" },
  { name: "Almonds (California)", basePrice: 780, unit: "kg" },
  { name: "Pistachios (Irani)", basePrice: 1200, unit: "kg" },
  { name: "Walnuts (Kashmiri)", basePrice: 950, unit: "kg" },
  { name: "Dates (Medjool)", basePrice: 600, unit: "kg" },
  { name: "Mixed Dry Fruits", basePrice: 700, unit: "kg" },
];

function getDiscount(qty) {
  if (qty >= 50) return 20;
  if (qty >= 20) return 15;
  if (qty >= 10) return 10;
  if (qty >= 5) return 5;
  return 0;
}

export default function BulkCalculator() {
  const [product, setProduct] = useState(PRODUCTS[0]);
  const [qty, setQty] = useState(5);
  const [open, setOpen] = useState(false);

  const discount = getDiscount(qty);
  const originalTotal = product.basePrice * qty;
  const discountAmt = Math.round(originalTotal * discount / 100);
  const finalTotal = originalTotal - discountAmt;

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-brand-brown via-[#0D1B35] to-brand-brown">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold/30 rounded-full px-4 py-1.5 mb-4">
            <Package size={14} className="text-brand-gold" />
            <span className="text-brand-gold text-xs font-semibold tracking-widest uppercase">Bulk Orders</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
            Get Bulk Pricing
          </h2>
          <div className="w-16 h-0.5 bg-brand-gold mx-auto mb-3" />
          <p className="text-gray-300 text-sm">Save up to 20% on bulk orders. Perfect for businesses, weddings & gifting.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Inputs */}
            <div className="space-y-5">
              {/* Product select */}
              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Select Product
                </label>
                <div className="relative">
                  <select
                    value={product.name}
                    onChange={(e) => setProduct(PRODUCTS.find(p => p.name === e.target.value))}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-brand-gold transition-colors cursor-pointer"
                  >
                    {PRODUCTS.map(p => (
                      <option key={p.name} value={p.name} className="text-brand-brown bg-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Quantity slider */}
              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Quantity: <span className="text-brand-gold font-bold text-sm">{qty} {product.unit}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bulk-slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 kg</span>
                  <span>25 kg</span>
                  <span>50 kg</span>
                  <span>100 kg</span>
                </div>
              </div>

              {/* Discount tiers */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { min: 5, label: "5+ kg", disc: "5% off" },
                  { min: 10, label: "10+ kg", disc: "10% off" },
                  { min: 20, label: "20+ kg", disc: "15% off" },
                  { min: 50, label: "50+ kg", disc: "20% off" },
                ].map(tier => (
                  <button
                    key={tier.min}
                    onClick={() => setQty(tier.min)}
                    className={`text-xs px-3 py-2 rounded-xl border transition-all ${
                      qty >= tier.min
                        ? "border-brand-gold bg-brand-gold/20 text-brand-gold font-semibold"
                        : "border-white/10 text-gray-400 hover:border-brand-gold/50"
                    }`}
                  >
                    {tier.label} — {tier.disc}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Price summary */}
            <div className="flex flex-col justify-between">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Price</span>
                  <span className="text-white">₹{product.basePrice}/{product.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quantity</span>
                  <span className="text-white">{qty} {product.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">₹{originalTotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Bulk Discount ({discount}%)</span>
                    <span className="text-green-400">−₹{discountAmt.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-semibold">You Pay</span>
                  <div className="text-right">
                    <div className="text-brand-gold font-bold text-2xl">
                      ₹{finalTotal.toLocaleString()}
                    </div>
                    {discount > 0 && (
                      <div className="text-xs text-green-400">
                        You save ₹{discountAmt.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <a
                  href={`https://wa.me/917568577968?text=Hi! I want to place a bulk order for ${qty}kg of ${product.name}. Estimated total: ₹${finalTotal.toLocaleString()}. Please confirm pricing.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20B858] text-white font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp Bulk Inquiry
                </a>
                <a
                  href="tel:+917568577968"
                  className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all border border-white/10"
                >
                  <Phone size={16} /> Call for Best Price
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
