import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Award, Users, MapPin, Phone, Mail, Sparkles } from "lucide-react";
import { useSiteSettings } from "../context/SiteSettingsContext";
import SEO from "../components/SEO";
import AnimatedCounter from "../components/AnimatedCounter";

const FALLBACK_TEAM_PHOTOS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80",
];

const STATS = [
  { to: 25, suffix: "+", label: "Years in Business" },
  { to: 50000, suffix: "+", label: "Families Served" },
  { to: 4, suffix: "", label: "Sourcing Continents" },
  { to: 100, suffix: "%", label: "FSSAI Certified" },
];

const PROMISES = [
  { Icon: Leaf, title: "100% Natural", desc: "No sulphur dioxide, artificial colouring, or mineral oil coating — ever. Just the dry fruit, as it comes from the farm." },
  { Icon: ShieldCheck, title: "Lab-Tested Batches", desc: "Every batch is inspected for moisture, kernel integrity, and foreign matter before it's cleared for packing." },
  { Icon: Award, title: "FSSAI Certified", desc: "Full compliance with Indian food safety standards, with a license number printed on every package." },
  { Icon: Users, title: "50,000+ Families", desc: "From Jaipur households to corporate offices and wedding caterers across India." },
];

export default function AboutPage() {
  const { siteContent } = useSiteSettings() || {};
  const teamMembers = siteContent?.team?.members?.length
    ? siteContent.team.members
    : [
        { name: "Jitesh Pansari", title: "Co-Founder & CEO", photo: "" },
        { name: "Praveen Pansari", title: "Co-Founder & COO", photo: "" },
      ];
  const about = siteContent?.about || {};

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="About Us"
        description="25+ years of pure quality from Jaipur's heart. FSSAI certified, direct-sourced from Kashmir, California & Iran. Serving 50,000+ families since 1999."
      />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0D1B2A 0%, #1B2E4B 60%, #243D63 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 10% 80%, #C9A84C 0%, transparent 40%)" }} />
        <div className="relative max-w-3xl mx-auto px-4 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <p className="sec-tag justify-center mb-5" style={{ color: "#C9A84C" }}>Jai Shree Dryfruits</p>
            <h1 className="font-serif text-white mb-6" style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 400, lineHeight: 1.1 }}>
              A Promise Since <em style={{ color: "#E2C06A" }}>1999</em>
            </h1>
            <div className="w-12 h-px mx-auto mb-6" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
            <p className="text-white/55 text-sm leading-relaxed max-w-xl mx-auto">
              Born in Jaipur's historic Gangauri Bazar, built on a single idea — quality you can taste. Today we serve over 50,000 families with dry fruits sourced direct from origin farms.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 border border-gray-100 -mt-px relative" style={{ marginTop: "-1px" }}>
          {STATS.map((s) => (
            <div key={s.label} className="bg-white text-center py-8 px-4">
              <p className="font-serif text-3xl font-semibold text-brand-brown mb-1">
                <AnimatedCounter to={s.to} suffix={s.suffix} />
              </p>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Story — photo + text split */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-0 border border-gray-100 overflow-hidden" style={{ boxShadow: "0 8px 40px rgba(27,46,75,0.06)" }}>
          <motion.div
            initial={{ x: -30 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden"
            style={{ minHeight: 340 }}
          >
            <img
              src="https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=900&q=80"
              alt="Jai Shree Dryfruits sourcing"
              className="w-full h-full object-cover"
              style={{ minHeight: 340 }}
            />
          </motion.div>
          <motion.div
            initial={{ x: 30 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="p-10 md:p-12 flex flex-col justify-center"
          >
            <p className="sec-tag mb-4">{about.storyTitle || "Our Story"}</p>
            <h2 className="font-serif text-2xl md:text-3xl font-normal text-brand-brown mb-4">
              A Family Shop That Grew Into a Trusted Name
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              {about.storyText || "Jai Shree Dryfruits was born in 1999 inside Jaipur's historic Gangauri Bazar — one of Rajasthan's oldest trading districts, where merchants have exchanged the world's finest spices and dry fruits for centuries."}
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              {about.missionText || "Today we serve over 50,000 families across India — homes, hotels, corporate offices, and wedding caterers. Yet our philosophy hasn't changed: every almond, cashew, walnut, pistachio, and date is hand-selected from its origin farm before it reaches your door."}
            </p>
            <Link to="/sourcing" className="mt-6 inline-flex items-center gap-2 text-brand-gold text-sm font-semibold hover:text-brand-brown transition-colors w-fit">
              See our full sourcing story <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Quality Promise — icon cards */}
      <section className="py-20 px-4" style={{ background: "#F9F7F2" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="sec-tag justify-center mb-4">Why Families Trust Us</p>
            <h2 className="section-title mb-4">Our Quality <em style={{ color: "#C9A84C" }}>Promise</em></h2>
            <div className="gold-divider mx-auto" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROMISES.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ y: 24 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(201,168,76,0.1)" }}>
                  <p.Icon size={20} className="text-brand-gold" />
                </div>
                <h3 className="font-serif text-lg text-brand-brown font-normal mb-2">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders — photo cards + quote */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial={{ y: 24 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid md:grid-cols-2 overflow-hidden border border-gray-100"
          style={{ boxShadow: "0 8px 40px rgba(27,46,75,0.08)" }}
        >
          <div className="p-12 md:p-14 flex flex-col justify-center" style={{ background: "linear-gradient(135deg, #1B2E4B 0%, #243D63 100%)" }}>
            <p className="text-brand-gold text-xs font-semibold tracking-[3px] uppercase mb-5">Meet the Founders</p>
            <blockquote className="font-serif text-white font-normal leading-tight mb-6" style={{ fontSize: "clamp(20px,2.5vw,28px)" }}>
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
            {teamMembers.map((f, i) => (
              <div key={f.name} className="relative overflow-hidden group" style={{ minHeight: 280 }}>
                <img src={f.photo || FALLBACK_TEAM_PHOTOS[i % FALLBACK_TEAM_PHOTOS.length]} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" style={{ minHeight: 280 }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,27,42,0.85), transparent 50%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-xs font-semibold">{f.name}</p>
                  <p className="text-white/45 text-xs mt-0.5">{f.title || f.role}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Contact strip */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-3 gap-px bg-gray-100 border border-gray-100">
          {[
            { Icon: MapPin, title: "Visit Us", text: "41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001" },
            { Icon: Phone, title: "Call Us", text: "+91 75685 77968" },
            { Icon: Mail, title: "Email Us", text: "info@jaishreedryfruits.com" },
          ].map((c) => (
            <div key={c.title} className="bg-white text-center p-8">
              <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ background: "rgba(201,168,76,0.1)" }}>
                <c.Icon size={17} className="text-brand-gold" />
              </div>
              <p className="font-serif text-base font-normal text-brand-brown mb-1.5">{c.title}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/products" className="btn-primary inline-flex items-center gap-2 text-sm px-8 py-3.5">
            <Sparkles size={15} /> Shop Our Collection
          </Link>
        </div>
      </section>
    </div>
  );
}
