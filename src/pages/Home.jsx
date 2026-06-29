import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useAnimation, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Shield, Truck, Award, RefreshCw, Star,
  Leaf, Package, Zap, Gift, CheckCircle, Phone, ChevronLeft, ChevronRight,
  Heart, Activity, Flame, ShieldCheck, Scale, Dumbbell, Sparkles, Users,
  ShoppingBag, Tag, Coins, TrendingUp, BookOpen,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import TestimonialsCarousel from "../components/TestimonialsCarousel";
import TrustMarquee from "../components/TrustMarquee";
import MagneticButton from "../components/MagneticButton";
import { DEMO_PRODUCTS, formatPrice } from "../utils/helpers";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useLanguage } from "../context/LanguageContext";
import { collection, where, orderBy, getDocs, query, limit } from "firebase/firestore";
import { db } from "../firebase/config";

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
  { name: "Cashews", img: "https://images.unsplash.com/photo-1573555657105-4da0f89ba9f0?w=400&q=80" },
  { name: "Pistachios", img: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80" },
  { name: "Walnuts", img: "https://images.unsplash.com/photo-1563412580-6b7e0d7e0d11?w=400&q=80" },
  { name: "Dates", img: "https://images.unsplash.com/photo-1691657917109-c6e027eac44a?w=400&q=80" },
  { name: "Gift Hampers", img: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&q=80" },
];

const WHY_US = [
  { icon: <Shield size={22} />, title: "100% Natural", desc: "No artificial colours, flavours or preservatives — ever." },
  { icon: <Award size={22} />, title: "FSSAI Certified", desc: "Certified safe by India's top food authority." },
  { icon: <Truck size={22} />, title: "Fast Delivery", desc: "Pan-India shipping. Delivered in 3–5 days." },
  { icon: <RefreshCw size={22} />, title: "Easy Returns", desc: "7-day hassle-free return policy." },
  { icon: <CheckCircle size={22} />, title: "Trusted Since 1999", desc: "25+ years of premium dry fruit expertise." },
  { icon: <Gift size={22} />, title: "Gift Ready", desc: "Premium gift wrapping available on all orders" },
];



/* Fallback testimonials — shown when Firestore has < 2 approved reviews */
const FALLBACK_TESTIMONIALS = [
  { name: "Priya Sharma", city: "Mumbai", rating: 5, text: "Best quality almonds I've ever bought! Freshness is unmatched. Will definitely order again.", product: "Premium Almonds" },
  { name: "Rajesh Kumar", city: "Delhi", rating: 5, text: "The Royal Gift Hamper was perfect for Diwali. Beautiful packaging, loved by family!", product: "Royal Hamper" },
  { name: "Ananya Patel", city: "Bangalore", rating: 5, text: "So fresh and creamy. Delivery was quick. Great value for premium quality.", product: "Whole Cashews" },
  { name: "Sunita Verma", city: "Jaipur", rating: 5, text: "Ordered pistachios for a wedding function. Everyone loved them. Will order bulk again!", product: "Irani Pistachios" },
];

/* ── Live reviews from Firestore — falls back to hardcoded ──── */
function useLiveTestimonials() {
  const [reviews, setReviews] = useState(FALLBACK_TESTIMONIALS);
  useEffect(() => {
    let cancelled = false;
    async function fetchReviews() {
      try {
        const q = query(
          collection(db, "reviews"),
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          limit(12)
        );
        const snap = await getDocs(q);
        if (!cancelled && !snap.empty) {
          const live = snap.docs.map(d => {
            const data = d.data();
            return {
              name: data.userName || data.name || "Verified Customer",
              city: data.userCity || data.city || "India",
              rating: data.rating || 5,
              text: data.body || data.text || "",
              product: data.productName || data.product || "Premium Dry Fruits",
            };
          }).filter(r => r.text);
          if (live.length >= 2) setReviews(live);
        }
      } catch {
        // Firestore unavailable — keep fallback
      }
    }
    fetchReviews();
    return () => { cancelled = true; };
  }, []);
  return reviews;
}

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
  const { h, m, s } = useCountdown(8);
  const scrollRef = useRef(null);
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroContentY = useTransform(heroScroll, [0, 1], ["0%", "30%"]);
  const heroContentOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);
  const siteSettings = useSiteSettings();
  const { categories: ctxCategories, healthGoals, combos, whyUs: ctxWhyUs, origins, hero: heroData, announcement } = siteSettings || {};
  const { tr } = useLanguage() || { tr: (k) => k };
  const liveTestimonials = useLiveTestimonials();

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative flex items-center justify-center overflow-hidden bg-black" style={{ height: "72vh", minHeight: 480, maxHeight: 700 }}>

        {/* Video — no transform to avoid mobile zoom */}
        <video
          autoPlay
          muted
          loop
          playsInline
          webkit-playsinline=""
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          poster="/hero-poster.jpg"
          style={{ transform: "none" }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Light overlay — let cashews show */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.72) 100%)" }} />

        {/* Floating gold orbs — luxury depth */}
        {[
          { size: 320, x: "8%",  y: "15%", delay: 0,    dur: 7 },
          { size: 180, x: "78%", y: "22%", delay: 1.2,  dur: 9 },
          { size: 240, x: "62%", y: "68%", delay: 0.6,  dur: 11 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none rounded-full"
            style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y, background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 45%, transparent 70%)", filter: "blur(32px)" }}
            animate={{ y: [0, -24, 0], scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: orb.dur, delay: orb.delay, ease: "easeInOut" }}
          />
        ))}



        {/* Center content — parallax lift on scroll */}
        <motion.div style={{ y: heroContentY, opacity: heroContentOpacity }} className="relative z-20 text-center px-6 flex flex-col items-center">

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
        </motion.div>

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

      {/* ═══ TRUST MARQUEE ══════════════════════════════════════ */}
      <TrustMarquee />

      {/* ═══ FEATURES BAR ═══════════════════════════════════════ */}
      <section style={{ background: "linear-gradient(135deg, #fff 0%, #FBF5E6 100%)", borderBottom: "1px solid #F0E4C8" }}>
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.06}>
                <div className="flex items-center gap-3 group p-3 rounded-xl hover:bg-white transition-all duration-300 card-lift glossy-card">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-brand-gold flex-shrink-0 transition-all duration-300"
                    style={{ background: "linear-gradient(135deg, #FBF5E6, #F0E4C8)", boxShadow: "0 2px 8px rgba(201,168,76,0.15)" }}>
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
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-5">
          {CATEGORIES.map((cat, i) => (
            <FadeUp key={cat.name} delay={i * 0.07}>
              <Link to={`/products?category=${cat.name}`} className="group flex flex-col items-center gap-2.5">
                <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-400 group-hover:-translate-y-2 glossy-card">
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={e => { e.target.style.display='none'; e.target.parentNode.style.background='linear-gradient(135deg,#C9A84C22,#3E272322)'; }}
                  />
                </div>
                <span className="text-xs font-semibold text-brand-brown group-hover:text-brand-gold transition-colors text-center leading-tight">{cat.name}</span>
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
                  { place: "Kashmir", product: "Walnuts & Saffron", code: "IN" },
                  { place: "California", product: "Almonds & Pistachios", code: "US" },
                  { place: "Iran", product: "Premium Pistachios", code: "IR" },
                  { place: "Saudi Arabia", product: "Dates & Figs", code: "SA" },
                ].map(o => (
                  <div key={o.place} className="text-center flex flex-col items-center">
                    <div className="w-8 h-6 flex items-center justify-center border border-brand-gold/30 mb-1.5"
                      style={{ background: "rgba(201,168,76,0.12)" }}>
                      <span className="text-brand-gold font-bold text-[10px] tracking-wider">{o.code}</span>
                    </div>
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
              <MagneticButton>
                <Link to="/products" className="btn-outline inline-flex items-center gap-2 hover:scale-105 transition-transform">
                  View All Products <ArrowRight size={16} />
                </Link>
              </MagneticButton>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══ WHY US ══════════════════════════════════════════════ */}
      <section className="pt-10 pb-10 px-4" style={{ background: "linear-gradient(160deg, #fff 0%, #FBF5E6 60%, #F0E4C8 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <h2 className="section-title">Why Choose Us</h2>
            <div className="gold-divider" />
            <p className="text-center text-gray-400 text-sm mb-8">What makes Jai Shree Dryfruits the #1 choice</p>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {WHY_US.map((item, i) => (
              <ScaleIn key={item.title} delay={i * 0.07}>
                <TiltCard className="h-full">
                  <div className="h-full rounded-2xl p-5 md:p-6 glossy-card card-lift"
                    style={{ background: "linear-gradient(135deg, #fff 0%, #FBF5E6 100%)", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)" }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-brand-gold mb-4"
                      style={{ background: "linear-gradient(135deg, #FBF5E6, #E8C97A30)", boxShadow: "0 2px 10px rgba(201,168,76,0.2)" }}>
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-brand-brown text-sm md:text-base mb-1.5">{item.title}</h3>
                    <p className="text-xs md:text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </TiltCard>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROMO BANNER ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4"
        style={{ background: "linear-gradient(135deg, #1a0e08 0%, #3E2723 35%, #5D3A1A 65%, #3E2723 100%)" }}>
        {/* Glossy glow orbs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(232,201,122,0.12) 0%, transparent 70%)" }} />
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

      {/* ═══ TESTIMONIALS — live from Firestore ══════════════════ */}
      <section className="pt-10 pb-8" style={{ background: "linear-gradient(180deg, #fff 0%, #F4F6FF 100%)" }}>
        <FadeUp className="px-4">
          <h2 className="section-title">{tr("testimonials") || "What Customers Say"}</h2>
          <div className="gold-divider" />
          <p className="text-center text-gray-400 text-sm mb-8">Real reviews from verified buyers</p>
        </FadeUp>
        <TestimonialsCarousel testimonials={liveTestimonials} />
      </section>

      {/* ═══ BOTTOM CTA ════════════════════════════════════════ */}
      <section className="py-14 px-4" style={{ background: "linear-gradient(135deg, #fff 0%, #FBF5E6 100%)" }}>
        <FadeUp className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #FBF5E6, #F0E4C8)", boxShadow: "0 4px 16px rgba(201,168,76,0.2)" }}>
            <Phone size={26} className="text-brand-gold" />
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-brand-brown mb-3">Need Help Choosing?</h2>
          <p className="text-gray-400 text-sm mb-7">Our dry fruit experts are here to help you find the perfect product or build a custom gift hamper.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://wa.me/917568577968" target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", boxShadow: "0 6px 20px rgba(37,211,102,0.3)" }}>
              Chat on WhatsApp
            </a>
            <a href="tel:+917568577968"
              className="flex items-center justify-center gap-2 font-semibold px-8 py-3.5 rounded-2xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #E8C97A, #C9A84C)", color: "#3E2723", boxShadow: "0 6px 20px rgba(201,168,76,0.3)" }}>
              <Phone size={16} /> Call Us
            </a>
          </div>
        </FadeUp>
      </section>


    </div>
  );
}
