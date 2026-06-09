import React from "react";
import { MapPin, ArrowRight, Microscope, FileCheck, Factory, PackageCheck, Sprout, CheckCircle2, Award, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ORIGINS = [
  {
    code: "US",
    country: "California, USA",
    product: "Premium Almonds",
    variety: "Nonpareil Variety",
    desc: "Sun-drenched Central Valley orchards. Nonpareil variety — the world's most premium almond grade. Harvested once a year, shelled and graded at source before import.",
    img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&q=80",
    color: "#1B2E4B",
  },
  {
    code: "VN",
    country: "Vietnam & West Africa",
    product: "Cashew Kernels",
    variety: "W180 / W240 / W320",
    desc: "Factory-direct grades from HACCP-certified processing units. Zero middlemen. Full chain-of-custody documentation from shelling plant to our warehouse.",
    img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=800&q=80",
    color: "#243D63",
  },
  {
    code: "IR",
    country: "Iran & USA",
    product: "Pistachios",
    variety: "Fandoghi & Ahmad Aghaei",
    desc: "The Rafsanjan region of Iran is the pistachio capital of the world. We source two premium varieties — Fandoghi for everyday snacking and Jumbo Ahmad Aghaei for gifting.",
    img: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=800&q=80",
    color: "#1B2E4B",
  },
  {
    code: "SA",
    country: "Saudi Arabia & Tunisia",
    product: "Premium Dates",
    variety: "Medjool, Ajwa & Safawi",
    desc: "Directly certified farms in Al-Madinah and Tunis. Medjool for gifting, Ajwa for its medicinal properties, Safawi for everyday consumption.",
    img: "https://images.unsplash.com/photo-1691657917109-c6e027eac44a?w=800&q=80",
    color: "#243D63",
  },
  {
    code: "CL",
    country: "Chile & India",
    product: "Walnuts",
    variety: "Chandler Variety",
    desc: "Chandler variety walnuts from Chilean highland farms and Kashmir valley. Balanced tannins, light colour and rich Omega-3 profile — superior to standard market grades.",
    img: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=800&q=80",
    color: "#1B2E4B",
  },
];

const PROCESS_STEPS = [
  { step: "01", title: "Farm Selection", desc: "We personally visit and audit every farm. Only farms with documented sustainable practices and full traceability enter our approved supplier network.", Icon: Sprout },
  { step: "02", title: "Origin Quality Check", desc: "Certified third-party labs test each incoming batch for pesticide residue, aflatoxin, moisture levels and size uniformity — before the shipment is even loaded.", Icon: Microscope },
  { step: "03", title: "Import & Documentation", desc: "All imports comply with FSSAI import regulations. Licensed Customs House Agents maintain full chain-of-custody documentation for every container.", Icon: FileCheck },
  { step: "04", title: "Kaladera Processing", desc: "Our RIICO-registered facility in Kaladera, Jaipur handles sorting, grading, cleaning and vacuum packing in a temperature-controlled clean room.", Icon: Factory },
  { step: "05", title: "Quality Gate", desc: "Every batch is sampled before packing. Products that don't meet A+ Grade standard are sold to B2B industrial buyers — never to retail customers.", Icon: CheckCircle2 },
  { step: "06", title: "Packed & Dispatched", desc: "Nitrogen-flushed vacuum packs sealed within 48 hours of grading. Shipped via temperature-monitored courier directly to your doorstep.", Icon: PackageCheck },
];

const CERTIFICATIONS = [
  { name: "FSSAI Certified", desc: "Food Safety and Standards Authority of India", Icon: Award },
  { name: "ISO 22000", desc: "Food Safety Management Systems", Icon: ShieldCheck },
  { name: "HACCP Compliant", desc: "Hazard Analysis Critical Control Points", Icon: CheckCircle2 },
  { name: "GST Registered", desc: "Rajasthan — GSTIN: 08XXXXX1234Z1", Icon: FileCheck },
];

function CountryCode({ code }) {
  return (
    <div className="inline-flex items-center justify-center w-10 h-7 border border-brand-gold/40 mb-4"
      style={{ background: "rgba(201,168,76,0.08)" }}>
      <span className="text-brand-gold font-bold text-xs tracking-wider">{code}</span>
    </div>
  );
}

export default function SourcingStory() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden py-24 px-4" style={{ background: "linear-gradient(160deg, #0D1B2A 0%, #1B2E4B 60%, #243D63 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 10% 80%, #C9A84C 0%, transparent 40%)" }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <p className="sec-tag justify-center mb-5" style={{ color: "#C9A84C" }}>Our Sourcing Story</p>
          <h1 className="font-serif text-white mb-6" style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 400, lineHeight: 1.1 }}>
            From <em style={{ color: "#E2C06A" }}>World's Best Farms</em><br />to Your Table
          </h1>
          <div className="w-12 h-px mx-auto mb-6" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          <p className="text-white/55 text-sm leading-relaxed max-w-xl mx-auto">
            We don't buy from wholesalers. Every dry fruit at Jai Shree has a documented origin, a verified farm, and a quality-assured journey from harvest to your hand.
          </p>
        </motion.div>
      </div>

      {/* Origins */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="sec-tag justify-center mb-4">Where We Source</p>
          <h2 className="section-title mb-4">Origins <em style={{ color: "#C9A84C" }}>We Trust</em></h2>
          <div className="gold-divider mx-auto" />
        </motion.div>

        <div className="space-y-0 border border-gray-100">
          {ORIGINS.map((o, i) => (
            <motion.div
              key={o.country}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`grid md:grid-cols-2 border-b border-gray-100 last:border-b-0 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
                <img
                  src={o.img}
                  alt={o.product}
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
                  style={{ minHeight: 280 }}
                />
                <div className="absolute inset-0" style={{ background: i % 2 === 0 ? "linear-gradient(to right, transparent, rgba(13,27,42,0.2))" : "linear-gradient(to left, transparent, rgba(13,27,42,0.2))" }} />
              </div>
              <div className="p-10 md:p-12 flex flex-col justify-center" style={{ background: o.color }}>
                <CountryCode code={o.code} />
                <p className="text-brand-gold text-xs font-semibold tracking-[3px] uppercase mb-3">{o.country}</p>
                <h3 className="font-serif text-2xl text-white font-normal mb-2">{o.product}</h3>
                <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-4">{o.variety}</p>
                <div className="w-8 h-px mb-4" style={{ background: "rgba(201,168,76,0.4)" }} />
                <p className="text-white/60 text-sm leading-relaxed">{o.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-brand-gold/50 text-xs">
                  <MapPin size={12} />
                  <span className="tracking-wider uppercase" style={{ fontSize: "10px" }}>Verified Origin · Direct Farm Sourcing</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6-Step Process */}
      <section className="py-20 px-4" style={{ background: "linear-gradient(160deg, #0D1B2A 0%, #1B2E4B 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="sec-tag justify-center mb-4" style={{ color: "#C9A84C" }}>Quality Journey</p>
            <h2 className="font-serif text-white font-normal mb-4" style={{ fontSize: "clamp(28px,4vw,46px)" }}>
              Farm to Your <em style={{ color: "#E2C06A" }}>Doorstep</em>
            </h2>
            <div className="w-12 h-px mx-auto" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {PROCESS_STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                className="p-8 group hover:bg-white/5 transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                    style={{ border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.08)" }}>
                    <s.Icon size={18} className="text-brand-gold" />
                  </div>
                  <span className="font-serif text-4xl font-normal leading-none mt-1"
                    style={{ color: "rgba(201,168,76,0.2)", letterSpacing: "-1px" }}>{s.step}</span>
                </div>
                <h4 className="font-serif text-lg text-white font-normal mb-3">{s.title}</h4>
                <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="sec-tag justify-center mb-4">Trust & Compliance</p>
          <h2 className="section-title mb-4">Our <em style={{ color: "#C9A84C" }}>Certifications</em></h2>
          <div className="gold-divider mx-auto" />
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 border border-gray-100">
          {CERTIFICATIONS.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center p-8 bg-white hover:bg-brand-cream transition-colors"
            >
              <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}>
                <c.Icon size={18} className="text-brand-gold" />
              </div>
              <p className="font-serif text-base font-normal text-brand-brown mb-1.5">{c.name}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Founders CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid md:grid-cols-2 overflow-hidden border border-gray-100"
          style={{ boxShadow: "0 8px 40px rgba(27,46,75,0.08)" }}
        >
          <div className="p-12 md:p-14 flex flex-col justify-center" style={{ background: "linear-gradient(135deg, #1B2E4B 0%, #243D63 100%)" }}>
            <p className="text-brand-gold text-xs font-semibold tracking-[3px] uppercase mb-5">Our Promise</p>
            <blockquote className="font-serif text-white font-normal leading-tight mb-6"
              style={{ fontSize: "clamp(20px,2.5vw,28px)" }}>
              "We eat what we sell.<br />Every batch is tested<br />before it ships."
            </blockquote>
            <div className="w-8 h-px mb-5" style={{ background: "#C9A84C" }} />
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              — Jitesh &amp; Praveen Pansari, Founders<br />
              <span className="text-white/30 text-xs">Jai Shree Dry Fruits, Jaipur</span>
            </p>
            <Link to="/contact" className="btn-gold inline-flex items-center gap-2 w-fit text-xs px-6 py-3">
              Talk to Our Team <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2">
            {[
              { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80", name: "Jitesh Pansari", role: "Co-Founder & CEO" },
              { img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80", name: "Praveen Pansari", role: "Co-Founder & COO" },
            ].map(f => (
              <div key={f.name} className="relative overflow-hidden group" style={{ minHeight: 280 }}>
                <img src={f.img} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" style={{ minHeight: 280 }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,27,42,0.85), transparent 50%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-xs font-semibold">{f.name}</p>
                  <p className="text-white/45 text-xs mt-0.5">{f.role}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
