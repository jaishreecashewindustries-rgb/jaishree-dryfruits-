import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useAnimation } from "framer-motion";
import {
  ArrowRight, Shield, Truck, Award, RefreshCw, Star,
  Leaf, Package, Zap, Gift, CheckCircle, Phone, ChevronLeft, ChevronRight,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { DEMO_PRODUCTS, formatPrice } from "../utils/helpers";

/* ── Framer helpers ─────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ScaleIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Static data ────────────────────────────────────────────── */
const FEATURES = [
  { icon: <Shield size={26} />, title: "100% Authentic", desc: "Directly sourced from farms. No additives." },
  { icon: <Truck size={26} />, title: "Free Delivery", desc: "Pan-India shipping. Free above ₹499." },
  { icon: <Award size={26} />, title: "FSSAI Certified", desc: "Stringent quality checks on every batch." },
  { icon: <RefreshCw size={26} />, title: "7-Day Returns", desc: "Hassle-free return policy, no questions." },
];

const CATEGORIES = [
  { name: "Almonds", img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80" },
  { name: "Cashews", img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=400&q=80" },
  { name: "Pistachios", img: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=400&q=80" },
  { name: "Walnuts", img: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=400&q=80" },
  { name: "Dates", img: "https://images.unsplash.com/photo-1691657917109-c6e027eac44a?w=400&q=80" },
  { name: "Gift Hampers", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", city: "Mumbai", rating: 5, text: "Best quality almonds I've ever bought! Freshness is unmatched. Will definitely order again.", product: "Premium Almonds" },
  { name: "Rajesh Kumar", city: "Delhi", rating: 5, text: "The Royal Gift Hamper was perfect for Diwali. Beautiful packaging, loved by family!", product: "Royal Hamper" },
  { name: "Ananya Patel", city: "Bangalore", rating: 5, text: "So fresh and creamy. Delivery was quick. Great value for premium quality.", product: "Whole Cashews" },
  { name: "Sunita Verma", city: "Jaipur", rating: 5, text: "Ordered pistachios for a wedding function. Everyone loved them. Will order bulk again!", product: "Irani Pistachios" },
];

const WHY_US = [
  { icon: <Leaf size={22} />, title: "Farm Direct", desc: "Straight from source farms in Kashmir, California & Iran" },
  { icon: <CheckCircle size={22} />, title: "Quality Tested", desc: "Every batch lab-tested for freshness and purity" },
  { icon: <Package size={22} />, title: "Eco Packaging", desc: "Sustainable, food-safe packaging for freshness" },
  { icon: <Zap size={22} />, title: "Quick Dispatch", desc: "Same-day dispatch on orders before 2 PM" },
  { icon: <Gift size={22} />, title: "Gift Ready", desc: "Premium gift wrapping available on all orders" },
  { icon: <Phone size={22} />, title: "24/7 Support", desc: "WhatsApp support for all order queries" },
];

/* ── Tilt card wrapper ──────────────────────────────────────── */
function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`;
  };
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(600px) rotateY(0) rotateX(0) scale(1)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transition-transform duration-200 ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

/* ── Countdown timer hook ───────────────────────────────────── */
function useCountdown(targetHours = 8) {
  const [time, setTime] = useState(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(now.getHours() + targetHours, 0, 0, 0);
    return Math.max(0, Math.floor((end - now) / 1000));
  });
  useEffect(() => {
    const t = setInterval(() => setTime(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(time / 3600)).padStart(2, "0");
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");
  return { h, m, s };
}

/* ── Main component ─────────────────────────────────────────── */
export default function Home() {
  const featured = DEMO_PRODUCTS.filter((p) => p.featured).slice(0, 8);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const { h, m, s } = useCountdown(8);
  const scrollRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section className="relative flex items-center justify-center overflow-hidden bg-black" style={{ height: "72vh", minHeight: 480, maxHeight: 700 }}>

        {/* Video — no transform to avoid mobile zoom */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero.mp4"
          style={{ transform: "none" }}
        />

        {/* Light overlay — let cashews show */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.72) 100%)" }} />


        {/* Center content */}
        <div className="relative z-20 text-center px-6 flex flex-col items-center">

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif font-bold text-white mb-3 drop-shadow-lg"
            style={{ fontSize: "clamp(2rem, 8vw, 5rem)", lineHeight: 1.1, letterSpacing: "-0.01em" }}
          >
            India's Finest<br />
            <span style={{ color: "#E8C97A" }}>Dry Fruits</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-white/70 text-xs md:text-sm font-light tracking-[0.28em] uppercase mb-7"
          >
            Kashmir · California · Iran
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex items-center gap-3"
          >
            <Link
              to="/products"
              className="group flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold tracking-[0.1em] uppercase text-xs px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-gold/30"
            >
              Shop Now
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/products?category=Gift Hampers"
              className="text-white/80 hover:text-white tracking-[0.12em] uppercase text-xs font-medium border border-white/30 hover:border-white px-6 py-3 transition-all duration-300 backdrop-blur-sm bg-white/5"
            >
              Gift Hampers
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-4 h-7 border border-white/30 rounded-full flex items-start justify-center pt-1"
          >
            <div className="w-0.5 h-1.5 bg-brand-gold rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ FEATURES BAR ═══════════════════════════════════════ */}
      <section style={{ background: "linear-gradient(135deg, #fff 0%, #F4F6FF 100%)", borderBottom: "1px solid #dde3f5" }}>
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.06}>
                <div className="flex items-center gap-3 group p-3 rounded-xl hover:bg-white transition-all duration-300 card-lift glossy-card">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-brand-gold flex-shrink-0 transition-all duration-300"
                    style={{ background: "linear-gradient(135deg, #F4F6FF, #E8ECF8)", boxShadow: "0 2px 8px rgba(201,168,76,0.15)" }}>
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-brown text-xs md:text-sm">{f.title}</p>
                    <p className="text-[11px] text-gray-400 leading-snug mt-0.5 hidden md:block">{f.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OFFER BANNERS — nutraj style ════════════════════════ */}
      <section className="px-4 py-6" style={{ background: "#F4F6FF" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Banner 1 — Free Shipping */}
          <FadeUp delay={0}>
            <div className="relative overflow-hidden rounded-2xl glossy-card flex items-center gap-4 px-5 py-4 min-h-[90px]"
              style={{ background: "linear-gradient(135deg, #1A2744 0%, #2C4B8C 100%)", boxShadow: "0 4px 20px rgba(26,39,68,0.25)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(201,168,76,0.18)" }}>
                <Truck size={22} className="text-brand-gold" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Free Shipping</p>
                <p className="text-white/60 text-xs mt-0.5">On all orders above ₹499</p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gold/10 font-serif font-bold text-6xl pointer-events-none select-none">FREE</div>
            </div>
          </FadeUp>

          {/* Banner 2 — Welcome offer */}
          <FadeUp delay={0.08}>
            <div className="relative overflow-hidden rounded-2xl glossy-card flex items-center gap-4 px-5 py-4 min-h-[90px]"
              style={{ background: "linear-gradient(135deg, #9E7A2E 0%, #C9A84C 50%, #E8C97A 100%)", boxShadow: "0 4px 20px rgba(201,168,76,0.35)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/20">
                <Gift size={22} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">15% OFF First Order</p>
                <p className="text-white/75 text-xs mt-0.5">Use code: <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded">WELCOME15</span></p>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/10 font-serif font-bold text-6xl pointer-events-none select-none">15%</div>
            </div>
          </FadeUp>

          {/* Banner 3 — Premium quality */}
          <FadeUp delay={0.16}>
            <div className="relative overflow-hidden rounded-2xl glossy-card flex items-center gap-4 px-5 py-4 min-h-[90px]"
              style={{ background: "linear-gradient(135deg, #0D4B2C 0%, #166534 100%)", boxShadow: "0 4px 20px rgba(22,101,52,0.25)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <Award size={22} className="text-green-200" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">FSSAI Certified</p>
                <p className="text-white/60 text-xs mt-0.5">100% natural, no preservatives</p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/8 font-serif font-bold text-6xl pointer-events-none select-none">100%</div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══ CATEGORIES ═════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-8">
        <FadeUp>
          <h2 className="section-title">Shop by Category</h2>
          <div className="gold-divider" />
          <p className="text-center text-gray-500 text-sm mb-8">From everyday snacking to premium gifting</p>
        </FadeUp>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
          {CATEGORIES.map((cat, i) => (
            <FadeUp key={cat.name} delay={i * 0.07}>
              <Link to={`/products?category=${cat.name}`} className="group flex flex-col items-center gap-2">
                {/* 3D circular product image */}
                <div className="relative w-full" style={{ paddingBottom: "100%" }}>
                  <div className="absolute inset-0 rounded-full overflow-hidden transition-all duration-500 group-hover:-translate-y-2"
                    style={{
                      boxShadow: `0 8px 24px rgba(26,39,68,0.2), 0 2px 6px rgba(26,39,68,0.12), 0 0 0 2.5px rgba(201,168,76,0.2)`,
                      background: `linear-gradient(145deg, #e8ecf8, #f4f6ff)`
                    }}>
                    <img
                      src={cat.img}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      style={{ borderRadius: "50%" }}
                    />
                    {/* 3D highlight sheen */}
                    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "linear-gradient(140deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 35%, transparent 55%, rgba(0,0,0,0.08) 100%)" }} />
                  </div>
                  {/* Ground shadow */}
                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3/4 h-2 rounded-full opacity-20 group-hover:opacity-35 transition-opacity duration-500 blur-sm" style={{ background: "radial-gradient(ellipse, #1A2744 0%, transparent 70%)" }} />
                </div>
                <span className="text-[11px] md:text-xs font-semibold text-brand-brown group-hover:text-brand-gold transition-colors text-center leading-tight mt-1">{cat.name}</span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ═══ ORIGINS BANNER ═════════════════════════════════════ */}
      <section className="px-4 py-6" style={{ background: "#F4F6FF" }}>
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl"
            style={{ background: "linear-gradient(120deg, #1A2744 0%, #2C4B8C 60%, #1A2744 100%)", minHeight: 120 }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.15) 0%, transparent 60%)" }} />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 py-5 gap-4 text-center md:text-left">
              <div>
                <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-1">Our Heritage</p>
                <h3 className="font-serif text-xl md:text-2xl font-bold text-white">Sourced from the World's Best Origins</h3>
              </div>
              <div className="grid grid-cols-2 md:flex md:gap-10 gap-x-8 gap-y-4 w-full md:w-auto">
                {[
                  { place: "Kashmir", product: "Walnuts & Saffron", flag: "🏔️" },
                  { place: "California", product: "Almonds & Pistachios", flag: "☀️" },
                  { place: "Iran", product: "Premium Pistachios", flag: "🌿" },
                  { place: "Afghanistan", product: "Dates & Raisins", flag: "⭐" },
                ].map(o => (
                  <div key={o.place} className="text-center flex flex-col items-center">
                    <p className="text-2xl mb-0.5">{o.flag}</p>
                    <p className="text-white font-semibold text-xs">{o.place}</p>
                    <p className="text-white/45 text-[10px]">{o.product}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ══════════════════════════════════ */}
      <section className="pt-10 pb-8" style={{ background: "linear-gradient(180deg, #F4F6FF 0%, #fff 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="px-4">
            <h2 className="section-title">Featured Products</h2>
            <div className="gold-divider" />
            <p className="text-center text-gray-500 text-sm mb-6">Our best sellers, loved by 50,000+ customers</p>
          </FadeUp>
          {/* Mobile: horizontal scroll — Desktop: grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5 px-4">
            {featured.map((p, i) => (
              <FadeUp key={p.id} delay={i * 0.05} className="h-full">
                <TiltCard className="h-full">
                  <ProductCard product={p} />
                </TiltCard>
              </FadeUp>
            ))}
          </div>
          {/* Mobile horizontal scroll */}
          <div className="md:hidden overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-3 px-4" style={{ width: "max-content" }}>
              {featured.map((p) => (
                <div key={p.id} style={{ width: 200, flexShrink: 0 }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
          <FadeUp delay={0.2}>
            <div className="text-center mt-6 px-4">
              <Link to="/products" className="btn-outline inline-flex items-center gap-2 hover:scale-105 transition-transform">
                View All Products <ArrowRight size={16} />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══ WHY US — dark navy with icon glow ══════════════════ */}
      <section className="pt-12 pb-12 px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0D1B35 0%, #1A2744 50%, #0D1B35 100%)" }}>
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 pointer-events-none blur-3xl opacity-40"
          style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.25) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeUp>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white text-center">Why Choose Us</h2>
            <div className="gold-divider" />
            <p className="text-center text-white/45 text-sm mb-8">What makes Jai Shree Dryfruits the #1 choice</p>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {WHY_US.map((item, i) => (
              <ScaleIn key={item.title} delay={i * 0.07}>
                <div className="group h-full rounded-2xl p-5 md:p-6 cursor-default transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.12)", backdropFilter: "blur(10px)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.07)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(201,168,76,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-brand-gold mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ background: "rgba(201,168,76,0.12)", boxShadow: "0 0 20px rgba(201,168,76,0.25)" }}>
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-white text-sm md:text-base mb-1.5">{item.title}</h3>
                  <p className="text-xs md:text-sm text-white/45 leading-relaxed">{item.desc}</p>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROMO BANNER ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4"
        style={{ background: "linear-gradient(135deg, #080F1E 0%, #1A2744 35%, #2C4B8C 65%, #1A2744 100%)" }}>
        {/* Animated shine sweep across the whole banner */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="promo-shine-sweep" />
        </div>
        {/* Glossy glow orbs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.22) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(232,201,122,0.16) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full pointer-events-none blur-3xl" style={{ background: "rgba(201,168,76,0.08)" }} />
        <FadeUp className="relative z-10 max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
            style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", color: "#E8C97A" }}>
            ⚡ Limited Time Offer
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mt-2 mb-4 leading-tight">
            Get 15% OFF<br />on Your First Order
          </h2>
          <p className="text-white/55 mb-5 text-sm">
            Use code{" "}
            <span className="font-bold text-base px-3 py-1 rounded-lg mx-1"
              style={{ background: "rgba(201,168,76,0.2)", border: "1px solid rgba(201,168,76,0.35)", color: "#E8C97A" }}>
              WELCOME15
            </span>
            {" "}at checkout
          </p>
          {/* Countdown timer */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <p className="text-white/50 text-xs uppercase tracking-widest mr-1">Offer ends in</p>
            {[{ val: h, label: "HRS" }, { val: m, label: "MIN" }, { val: s, label: "SEC" }].map(({ val, label }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <span className="text-brand-gold font-bold text-xl">:</span>}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl text-white"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,168,76,0.25)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                    {val}
                  </div>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest mt-1">{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          <Link to="/products"
            className="group inline-flex items-center gap-2 text-white font-bold px-10 py-4 rounded-2xl transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2C4B8C 0%, #1A2744 100%)", boxShadow: "0 8px 30px rgba(26,39,68,0.5), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px rgba(201,168,76,0.35)" }}>
            Shop Now &amp; Save
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeUp>
      </section>

      {/* ═══ WHOLESALE / B2B BANNER ═════════════════════════════ */}
      <section className="px-4 py-10" style={{ background: "linear-gradient(135deg, #0D1B35 0%, #1A2744 50%, #0D1B35 100%)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
              style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", color: "#E8C97A" }}>
              Wholesale &amp; Bulk
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">
              Order for Business, Events<br className="hidden md:block" /> &amp; Weddings?
            </h2>
            <p className="text-white/55 text-sm leading-relaxed">
              We supply to hotels, corporates, caterers and event planners across India. Get best rates, custom packaging and dedicated support.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <a href="https://wa.me/917568577968?text=Hi!%20I%20need%20wholesale%20pricing%20for%20dry%20fruits." target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              WhatsApp Enquiry
            </a>
            <a href="tel:+917568577968"
              className="flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:scale-105 border"
              style={{ borderColor: "rgba(201,168,76,0.4)", color: "#E8C97A", background: "rgba(201,168,76,0.08)" }}>
              <Phone size={14} /> Call Us
            </a>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS — auto-sliding carousel ═══════════════ */}
      <section className="pt-10 pb-8" style={{ background: "linear-gradient(180deg, #fff 0%, #F4F6FF 100%)" }}>
        <FadeUp className="px-4">
          <h2 className="section-title">What Customers Say</h2>
          <div className="gold-divider" />
          <p className="text-center text-gray-400 text-sm mb-8">Real reviews from verified buyers</p>
        </FadeUp>
        {/* Sliding track — seamless loop */}
        <div className="relative overflow-hidden">
          <div className="flex gap-4 animate-[testimonialScroll_28s_linear_infinite]" style={{ width: "max-content" }}>
            {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="flex-shrink-0 w-72 rounded-2xl p-5"
                style={{ background: "linear-gradient(145deg, #fff 0%, #FDFAF3 100%)", border: "1px solid rgba(201,168,76,0.12)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={13} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="border-t border-brand-gold/10 pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-brand-brown text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.city}</p>
                  </div>
                  <span className="text-xs text-brand-gold px-2 py-1 rounded-lg"
                    style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}>
                    {t.product}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-12 pointer-events-none" style={{ background: "linear-gradient(to right, #fff, transparent)" }} />
          <div className="absolute inset-y-0 right-0 w-12 pointer-events-none" style={{ background: "linear-gradient(to left, #F4F6FF, transparent)" }} />
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setTestimonialIdx(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: testimonialIdx === i ? 20 : 8, height: 8, background: testimonialIdx === i ? "#C9A84C" : "#D1D5DB" }} />
          ))}
        </div>
      </section>

      {/* ═══ SCROLLING IMAGE STRIP ══════════════════════════════ */}
      <section className="py-6 overflow-hidden" style={{ background: "linear-gradient(90deg, #E8ECF8, #F4F6FF, #E8ECF8)" }}>
        <div className="flex gap-3 animate-[marquee_30s_linear_infinite]" style={{ width: "max-content" }}>
          {[...DEMO_PRODUCTS, ...DEMO_PRODUCTS].map((p, i) => (
            <Link key={i} to={`/product/${p.id}`} className="flex-shrink-0 group">
              <img
                src={p.images[0]}
                alt=""
                className="h-24 w-24 object-cover rounded-xl shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300"
                style={{ border: "2px solid rgba(201,168,76,0.15)" }}
              />
            </Link>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </section>

      {/* ═══ BOTTOM CTA ════════════════════════════════════════ */}
      <section className="py-8 px-4" style={{ background: "linear-gradient(135deg, #0D1B35 0%, #1A2744 100%)" }}>
        <FadeUp className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-center sm:text-left">
              <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-1">Expert Assistance</p>
              <h2 className="font-serif text-xl font-bold text-white">Need Help Choosing?</h2>
              <p className="text-white/50 text-xs mt-1">Our experts are here for product queries &amp; custom gift hampers</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a href="https://wa.me/917568577968" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", boxShadow: "0 4px 14px rgba(37,211,102,0.3)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp
              </a>
              <a href="tel:+917568577968"
                className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all hover:scale-105 border border-white/20"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <Phone size={13} /> Call Us
              </a>
            </div>
          </div>
        </FadeUp>
      </section>

    </div>
  );
}
