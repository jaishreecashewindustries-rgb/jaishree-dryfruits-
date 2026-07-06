import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { motion, useInView, useAnimation, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Shield, Truck, Award, RefreshCw, Star,
  Leaf, Package, Zap, Gift, CheckCircle, Phone, ChevronLeft, ChevronRight,
  Heart, Activity, Flame, ShieldCheck, Scale, Dumbbell, Sparkles, Users,
  ShoppingBag, Tag, Coins, TrendingUp, BookOpen, MessageCircle,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import ProductCard from "../components/ProductCard";
import { SkeletonCard } from "../components/SkeletonCard";
import AnimatedCounter from "../components/AnimatedCounter";
import MagneticButton from "../components/MagneticButton";
import SEO from "../components/SEO";
import B2BGiftingForm from "../components/B2BGiftingForm";
import TestimonialsCarousel from "../components/TestimonialsCarousel";
import { formatPrice } from "../utils/helpers";
import { useProducts } from "../context/ProductsContext";
import { useSiteSettings } from "../context/SiteSettingsContext";

/* ── Framer helpers ─────────────────────────────────────────── */
// Content starts fully visible (no opacity:0) and only slides/scales into
// its final position — a scroll-triggered reveal that never actually fires
// (no real scroll, e.g. Googlebot's renderer) used to leave whole sections
// permanently invisible in what Google crawls. Keeping the motion but
// dropping the opacity animation means there's no "never revealed" state.
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ y: 24 }}
      animate={inView ? { y: 0 } : {}}
      transition={{ duration: 0.4, delay: Math.min(delay, 0.25), ease: [0.22, 1, 0.36, 1] }}
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
      initial={{ scale: 0.93 }}
      animate={inView ? { scale: 1 } : {}}
      transition={{ duration: 0.35, delay: Math.min(delay, 0.25), ease: [0.22, 1, 0.36, 1] }}
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
  { icon: <Phone size={22} />, title: "24/7 Support", desc: "Phone & email support for all order queries" },
];

/* ── Tilt card wrapper — desktop only, no 3D on mobile ─────── */
function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  const isMobile = () => window.innerWidth < 768;
  const handleMove = (e) => {
    if (isMobile()) return;
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
    card.style.zIndex = "10";
  };
  const handleLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "none";
    ref.current.style.zIndex = "1";
  };
  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transition-transform duration-200 ${className}`}
      style={{ position: "relative", zIndex: 1 }}
    >
      {children}
    </div>
  );
}


/* ── Fetch live reviews from Firestore, fallback to TESTIMONIALS ─────── */
function useLiveTestimonials() {
  const [reviews, setReviews] = useState(TESTIMONIALS);
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const q = query(
          collection(db, "reviews"),
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          limit(12)
        );
        const snap = await getDocs(q);
        if (!cancelled && !snap.empty) {
          const live = snap.docs.map((d) => {
            const data = d.data();
            return {
              name: data.userName || data.name || "Customer",
              city: data.city || data.userCity || "India",
              rating: data.rating || 5,
              text: data.body || data.text || "",
              product: data.productName || data.product || "Premium Dry Fruits",
            };
          }).filter((r) => r.text);
          if (live.length >= 2) setReviews(live);
        }
      } catch {
        // Firestore unavailable — keep hardcoded fallback
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);
  return reviews;
}

/* ── Main component ─────────────────────────────────────────── */
export default function Home() {
  const { products: DEMO_PRODUCTS } = useProducts();
  const featured = DEMO_PRODUCTS.filter((p) => p.featured).slice(0, 8);
  const { siteContent } = useSiteSettings() || {};
  // Admin-editable via Content Management → Hero/Banner. Falls back to the
  // approved default copy — the video background itself stays fixed
  // (a CMS "background image" field doesn't fit a video hero), only the
  // text/CTAs are admin-controlled.
  const hero = siteContent?.hero || {};
  const [heroLine1, heroLine2] = (hero.headline || "India's Finest\nDry Fruits").split("\n");
  const heroSubheadline = hero.subheadline || "Kashmir · California · Iran";
  const heroCtaText = hero.ctaText || "Shop Now";
  const heroCtaSecondary = hero.ctaSecondary || "Gift Hampers";
  const [showB2BForm, setShowB2BForm] = useState(false);
  const [heritageExpanded, setHeritageExpanded] = useState(false);
  const [productsReady, setProductsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setProductsReady(true), 500);
    return () => clearTimeout(t);
  }, []);
  const scrollRef = useRef(null);
  const heroRef = useRef(null);
  const heroVideoRef = useRef(null);

  // Mobile browsers can silently ignore the `autoPlay` attribute — force play()
  // explicitly, and retry on the first user gesture if the browser blocked it.
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    const tryPlay = () => video.play().catch(() => {});
    tryPlay();
    document.addEventListener("touchstart", tryPlay, { once: true, passive: true });
    document.addEventListener("click", tryPlay, { once: true });
    return () => {
      document.removeEventListener("touchstart", tryPlay);
      document.removeEventListener("click", tryPlay);
    };
  }, []);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroContentY = useTransform(heroScroll, [0, 1], [0, -70]);
  const liveTestimonials = useLiveTestimonials();
  const { tr } = useLanguage();

  return (
    <div className="min-h-screen overflow-x-hidden">
      <SEO
        title="India's Finest Dry Fruits — Premium Almonds, Cashews, Pistachios"
        description="Shop premium California almonds, Kashmiri walnuts & Iranian pistachios. FSSAI certified, free shipping above ₹499. Est. 1999, Jaipur. 50,000+ happy families."
        type="website"
      />

      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative flex items-center justify-center overflow-hidden bg-black" style={{ height: "72vh", minHeight: 480, maxHeight: 700 }}>

        {/* Video — no transform to avoid mobile zoom */}
        <video
          ref={heroVideoRef}
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

        {/* Light overlay — let cashews show; pointer-events-none so taps reach the video below */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.72) 100%)" }} />

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


        {/* Center content — parallax lift on scroll. No opacity fade here —
            this wraps the main H1 heading, and a scroll-linked fade-to-0
            (however briefly, on however few crawls) is the single worst
            place for content to intermittently vanish from what Google
            captures. */}
        <motion.div style={{ y: heroContentY }} className="relative z-20 text-center px-6 flex flex-col items-center">

          {/* Headline */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.025 } } }}
            className="font-serif font-bold text-white mb-3 drop-shadow-lg"
            style={{ fontSize: "clamp(2rem, 8vw, 5rem)", lineHeight: 1.1, letterSpacing: "-0.01em" }}
          >
            {heroLine1.split("").map((ch, i) => (
              <motion.span
                key={i}
                variants={{ hidden: { opacity: 0, y: 24, rotateX: -40 }, visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }}
                style={{ display: "inline-block" }}
              >{ch === " " ? " " : ch}</motion.span>
            ))}
            {heroLine2 && <br />}
            {(heroLine2 || "").split("").map((ch, i) => (
              <motion.span
                key={i}
                variants={{ hidden: { opacity: 0, y: 24, rotateX: -40 }, visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }}
                style={{ display: "inline-block", color: "#E8C97A" }}
              >{ch === " " ? " " : ch}</motion.span>
            ))}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-white/70 text-xs md:text-sm font-light tracking-[0.28em] uppercase mb-7"
          >
            {heroSubheadline}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Link
              to="/products"
              className="group flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold tracking-[0.1em] uppercase text-xs px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-gold/30"
            >
              {heroCtaText}
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/products?category=Gift Hampers"
              className="text-white/80 hover:text-white tracking-[0.12em] uppercase text-xs font-medium border border-white/30 hover:border-white px-6 py-3 transition-all duration-300 backdrop-blur-sm bg-white/5"
            >
              {heroCtaSecondary}
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


      {/* ═══ CATEGORIES ═════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-8">
        <FadeUp>
          <h2 className="section-title">{tr("categories")}</h2>
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
                      alt={cat.name}
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
                  { place: "Kashmir", product: "Walnuts & Saffron", flag: "🇮🇳" },
                  { place: "California", product: "Almonds & Pistachios", flag: "🇺🇸" },
                  { place: "Iran", product: "Premium Pistachios", flag: "🇮🇷" },
                  { place: "Saudi Arabia", product: "Dates & Figs", flag: "🇸🇦" },
                ].map(o => (
                  <div key={o.place} className="text-center flex flex-col items-center">
                    <span className="text-2xl mb-1.5">{o.flag}</span>
                    <p className="text-white font-semibold text-xs">{o.place}</p>
                    <p className="text-white/50 text-[10px]">{o.product}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SHOP BY HEALTH GOAL — monochrome flat ══════════════ */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-10">
            <p className="sec-tag justify-center mb-2">Personalised Nutrition</p>
            <h2 className="section-title text-brand-brown">Shop by <em style={{ color: "#C9A84C" }}>Health Goal</em></h2>
            <div className="gold-divider mx-auto mt-3" />
          </FadeUp>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-5">
            {[
              { goal: "Heart Health",   Icon: Heart,      link: "/products?goal=heart" },
              { goal: "Brain Power",    Icon: Activity,   link: "/products?goal=brain" },
              { goal: "Energy Boost",   Icon: Flame,      link: "/products?goal=energy" },
              { goal: "Immunity",       Icon: ShieldCheck,link: "/products?goal=immunity" },
              { goal: "Weight Loss",    Icon: Scale,      link: "/products?goal=weight" },
              { goal: "Bone Strength",  Icon: Dumbbell,   link: "/products?goal=bones" },
              { goal: "Skin & Hair",    Icon: Sparkles,   link: "/products?goal=skin" },
              { goal: "Kids",           Icon: Users,      link: "/products?goal=kids" },
            ].map((item, i) => (
              <motion.div key={item.goal} initial={{ y: 12 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.04 }}>
                <Link
                  to={item.link}
                  className="group flex flex-col items-center gap-2.5 py-4 px-2 transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Icon with subtle cream background circle */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                    style={{ background: "#F4F0E8", color: "#1B2E4B", boxShadow: "0 2px 8px rgba(27,46,75,0.1)" }}
                  >
                    <item.Icon size={22} strokeWidth={2} />
                  </div>
                  {/* Thin gold underline appears on hover */}
                  <div className="w-5 h-px transition-all duration-300 group-hover:w-8" style={{ background: "#C9A84C" }} />
                  <span className="text-[10px] font-semibold tracking-wide text-brand-brown text-center leading-tight uppercase"
                    style={{ letterSpacing: "0.06em" }}>
                    {item.goal}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ══════════════════════════════════ */}
      <section className="pt-10 pb-8" style={{ background: "linear-gradient(180deg, #F4F6FF 0%, #fff 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="px-4">
            <h2 className="section-title">{tr("featured")}</h2>
            <div className="gold-divider" />
            <p className="text-center text-gray-500 text-sm mb-6">Our best sellers, loved by 50,000+ customers</p>
          </FadeUp>
          {/* Grid — 2 col mobile, 3 col tablet, 4 col desktop */}
          {!productsReady ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 px-4 pb-2">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 px-4 pb-2"
            style={{ overflow: "visible" }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </motion.div>
          )}
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

      {/* ═══ HANDPICKED COMBO DEALS — clean white grid, not another dark block ═══ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-10">
            <p className="text-brand-gold text-[10px] font-semibold tracking-[4px] uppercase mb-4">Curated Value Bundles</p>
            <h2 className="font-serif text-brand-brown mb-4" style={{ fontSize: "clamp(24px,4vw,42px)", fontWeight: 400 }}>Handpicked <em style={{ color: "#C9A84C" }}>Combo Deals</em></h2>
            <div className="w-12 h-px mx-auto" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          </FadeUp>
          {/* Strict uniform grid — all cards same height via flex column */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[
              { name: "Everyday Wellness Trio",  items: "Almonds 250g · Cashews 250g · Walnuts 200g",                       price: "₹899",   original: "₹1,149", saving: "22% off", badge: "Best Seller",   img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80&auto=format&fit=crop", tag: "wellness" },
              { name: "Diwali Gifting Box",       items: "Mixed Nuts 500g · Medjool Dates 200g · Pistachios 150g",           price: "₹1,299", original: "₹1,699", saving: "24% off", badge: "Gift Ready",    img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80&auto=format&fit=crop", tag: "gifting" },
              { name: "Brain Booster Pack",       items: "California Almonds 500g · Walnuts 250g · Pumpkin Seeds 150g",      price: "₹1,099", original: "₹1,399", saving: "21% off", badge: "Popular",       img: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=600&q=80&auto=format&fit=crop", tag: "brain" },
              { name: "Heart Care Bundle",        items: "Walnuts 500g · Flaxseeds 200g · Sunflower Seeds 200g",             price: "₹999",   original: "₹1,299", saving: "23% off", badge: "Wellness",      img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=600&q=80&auto=format&fit=crop", tag: "heart" },
              { name: "Protein Power Pack",       items: "W320 Cashews 500g · Almonds 250g · Roasted Peanuts 250g",         price: "₹849",   original: "₹1,049", saving: "19% off", badge: "Fitness",       img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=600&q=80&auto=format&fit=crop", tag: "protein" },
              { name: "Family Mega Box",          items: "Almonds 1kg · Cashews 500g · Raisins 500g · Medjool Dates 500g",  price: "₹2,499", original: "₹3,199", saving: "22% off", badge: "Family Value",  img: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=600&q=80&auto=format&fit=crop", tag: "family" },
            ].map((combo, i) => (
              <motion.div
                key={combo.name}
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex flex-col overflow-hidden group bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-300"
              >
                {/* Fixed-height image — no overlap with card below */}
                <div className="relative flex-shrink-0 overflow-hidden rounded-t-xl" style={{ height: 140 }}>
                  <img
                    src={combo.img}
                    alt={combo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span
                    className="absolute top-3 left-3 text-[9px] font-bold tracking-[2px] uppercase px-2.5 py-1 rounded"
                    style={{ background: "#C9A84C", color: "#1B2E4B" }}
                  >
                    {combo.badge}
                  </span>
                  <span
                    className="absolute bottom-3 right-3 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-green-600 text-white"
                  >
                    {combo.saving}
                  </span>
                </div>
                {/* Card body — flex-grow so all cards fill equal height */}
                <div className="p-3 md:p-4 flex flex-col flex-grow">
                  <h3 className="font-serif text-xs md:text-sm font-semibold text-brand-brown mb-1 leading-snug">{combo.name}</h3>
                  <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed mb-3 flex-grow">{combo.items}</p>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="font-serif text-base md:text-lg font-semibold text-brand-brown">{combo.price}</p>
                      <p className="text-gray-400 text-[10px] line-through">{combo.original}</p>
                    </div>
                  </div>
                  <Link
                    to={`/products?combo=${combo.tag}`}
                    className="flex items-center justify-center gap-2 text-[11px] font-bold py-2.5 w-full tracking-[2px] uppercase transition-all duration-200 group-hover:gap-3 rounded-lg"
                    style={{ background: "linear-gradient(135deg, #C9A84C, #E2C06A)", color: "#1B2E4B" }}
                  >
                    View Bundle <ArrowRight size={11} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
          <FadeUp className="text-center mt-10">
            <Link to="/products?filter=combos" className="inline-flex items-center gap-2 text-brand-gold text-xs font-bold uppercase tracking-[3px] hover:gap-3 transition-all">
              View All Combos <ArrowRight size={13} />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ═══ HERITAGE — compact, collapsible (Happilo-style "Our Journey") ═══ */}
      <section className="py-12 px-4" style={{ background: "#F4F0E8" }}>
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-brand-gold mb-2">Since 1999</p>
                <h2 className="font-serif text-2xl md:text-3xl font-normal text-brand-brown">Our Journey</h2>
              </div>
              <div className="flex gap-6">
                {[
                  { to: 25, suffix: "+", label: "Years" },
                  { to: 50000, suffix: "+", label: "Families" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="font-serif text-xl font-semibold text-brand-brown"><AnimatedCounter to={s.to} suffix={s.suffix} /></p>
                    <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Jai Shree Dryfruits was born in 1999 inside Jaipur's Gangauri Bazar — a trading quarter for rare spices and dry fruits since the 16th century. That's a 25-year operating history at one physical address, not brand heritage borrowed from mythology.
            </p>
            {heritageExpanded && (
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed mb-4">
                <p>This is not brand heritage borrowed from mythology. It is a physical address with a 25-year operating history, an FSSAI registration that predates most online dry fruit brands, and generations of customer families who still walk through our door.</p>
                <div className="space-y-3 border-l-2 border-brand-gold/20 pl-5">
                  {[
                    { year: "1999", event: "First shop opened in Gangauri Bazar, Jaipur" },
                    { year: "2008", event: "Direct import relationship established with California farms" },
                    { year: "2015", event: "FSSAI certification obtained; Kashmiri walnut sourcing begins" },
                    { year: "2022", event: "Pan-India online dispatch launched from our Jaipur facility" },
                    { year: "2025", event: "50,000th family served across India" },
                  ].map(({ year, event }) => (
                    <div key={year} className="flex gap-4 items-start">
                      <span className="font-serif text-brand-gold text-xs font-semibold w-8 flex-shrink-0 pt-0.5">{year}</span>
                      <p className="text-sm text-gray-500 leading-snug">{event}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur — 302001, Rajasthan · Mon–Sat 9 AM – 7 PM</p>
              </div>
            )}
            <button
              onClick={() => setHeritageExpanded((v) => !v)}
              className="text-xs font-bold uppercase tracking-widest text-brand-gold hover:text-brand-brown transition-colors"
            >
              {heritageExpanded ? "Show Less" : "Read More"}
            </button>
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
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {WHY_US.map((item) => (
              <motion.div
                key={item.title}
                variants={{ hidden: { y: 28, scale: 0.94 }, visible: { y: 0, scale: 1, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } } }}
              >
                <div
                  className="group relative h-full rounded-2xl p-5 md:p-6 cursor-default overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.12)", backdropFilter: "blur(10px)" }}
                  onMouseMove={e => {
                    const r = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
                    e.currentTarget.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Spotlight glow */}
                  <div className="card-spotlight-dark pointer-events-none absolute inset-0 rounded-[inherit] z-[1] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-[2]">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-brand-gold mb-4 transition-all duration-300 group-hover:scale-110"
                      style={{ background: "rgba(201,168,76,0.12)", boxShadow: "0 0 20px rgba(201,168,76,0.25)" }}>
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-white text-sm md:text-base mb-1.5">{item.title}</h3>
                    <p className="text-xs md:text-sm text-white/45 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FIRST ORDER OFFER — ivory cream, fine gold border ══ */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4" style={{ background: "#F4F0E8" }}>
        {/* Subtle warm radial glow — no clashing colours */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.06) 0%, transparent 65%)" }} />
        <FadeUp className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Fine gold rule above */}
          <div className="w-16 h-px mx-auto mb-8" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          <p className="text-[10px] font-bold uppercase tracking-[5px] mb-5" style={{ color: "#9E7A2E" }}>
            First Allocation Privilege
          </p>
          <h2 className="font-serif mb-6 leading-tight" style={{ fontSize: "clamp(28px,5vw,50px)", fontWeight: 400, color: "#1B2E4B" }}>
            Fifteen Per Cent Off<br />
            <em style={{ color: "#C9A84C" }}>Your First Order</em>
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-md mx-auto" style={{ color: "#5A6A7A" }}>
            Freshly sorted from the October single-origin harvest — hand-graded under our strict provenance protocol. Allocations are limited per household.
          </p>
          {/* Coupon code — ivory card, fine 1px gold border, no fill */}
          <div className="inline-flex flex-col items-center gap-2 mb-8">
            <p className="text-[10px] uppercase tracking-[4px]" style={{ color: "#9E7A2E" }}>Apply at checkout</p>
            <div
              className="px-8 py-3"
              style={{ border: "1px solid #C9A84C", background: "transparent" }}
            >
              <span
                className="font-serif text-2xl font-light"
                style={{ color: "#1B2E4B", letterSpacing: "0.35em" }}
              >
                WELCOME15
              </span>
            </div>
          </div>
          <div>
            <Link
              to="/products"
              className="group inline-flex items-center gap-2 font-semibold px-10 py-4 transition-all duration-300 hover:gap-3"
              style={{ background: "#1B2E4B", color: "#E8C97A", letterSpacing: "0.08em", fontSize: 12 }}
            >
              SHOP THE COLLECTION
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {/* Fine gold rule below */}
          <div className="w-16 h-px mx-auto mt-10" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
        </FadeUp>
      </section>

      {/* ═══ CORPORATE GIFTING CONCIERGE ═══════════════════════
           Full copy + stats + embedded form only on desktop (md+) — on
           mobile that stack (heading, 5 bullets, 4 stat cards, then a whole
           form with maxHeight:90vh) ran to nearly a full extra screen of
           scroll. Mobile gets one compact banner instead. ═══ */}
      <section className="hidden md:block py-32 px-4" style={{ background: "linear-gradient(160deg, #0D1B35 0%, #1A2744 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-start">
            {/* Left: Copy */}
            <FadeUp>
              <p className="text-[10px] font-bold uppercase tracking-[4px] text-brand-gold mb-7">Corporate & Wedding Gifting</p>
              <h2 className="font-serif text-4xl md:text-5xl font-normal text-white leading-tight mb-7">
                The Concierge<br />
                <em style={{ color: "#E8C97A" }}>Gifting Programme</em>
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                For organisations, wedding planners, and procurement teams seeking premium branded gift boxes at scale. Minimum 50 units. Full customisation available — logo, message card, custom weight assortments.
              </p>
              <div className="space-y-3 mb-10">
                {[
                  "Custom packaging with your logo or occasion message",
                  "Budget brackets from ₹500 to ₹5,000+ per box",
                  "Pan-India bulk delivery coordinated from Jaipur",
                  "Personalised catalogue and invoice within 2 hours",
                  "Dedicated account manager for repeat clients",
                ].map(item => (
                  <div key={item} className="flex items-start gap-3 text-sm text-white/55">
                    <span className="w-1 h-1 rounded-full bg-brand-gold flex-shrink-0 mt-2" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { num: "50+", label: "Min. units" },
                  { num: "2 hrs", label: "Response time" },
                  { num: "₹500–₹5K", label: "Per box range" },
                  { num: "100+", label: "Corporates served" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.12)" }}>
                    <p className="font-serif text-xl font-semibold text-brand-gold">{s.num}</p>
                    <p className="text-white/35 text-[10px] uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Right: Form */}
            <FadeUp delay={0.1}>
              <div className="rounded-2xl p-5 md:p-10 overflow-y-auto" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)", maxHeight: "90vh" }}>
                <h3 className="font-serif text-xl text-white mb-6">
                  {showB2BForm ? "Your Enquiry" : "Request the Corporate Catalogue"}
                </h3>
                <B2BGiftingForm theme="dark" onClose={() => setShowB2BForm(false)} />
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Mobile — compact one-line banner instead of the full concierge layout above */}
      <section className="md:hidden py-8 px-4 text-center" style={{ background: "linear-gradient(160deg, #0D1B35 0%, #1A2744 100%)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[3px] text-brand-gold mb-2">Corporate & Wedding Gifting</p>
        <h2 className="font-serif text-xl text-white mb-2">Bulk Orders, Made Easy</h2>
        <p className="text-white/50 text-xs mb-5">Custom branded gift boxes, 50+ units, dedicated account manager.</p>
        {!showB2BForm ? (
          <button
            onClick={() => setShowB2BForm(true)}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full"
            style={{ background: "#C9A84C", color: "#1B2E4B" }}
          >
            Fill Enquiry Form
          </button>
        ) : (
          <div className="rounded-2xl p-5 mt-2 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
            <B2BGiftingForm theme="dark" onClose={() => setShowB2BForm(false)} />
          </div>
        )}
      </section>

      {/* ═══ TESTIMONIALS — glass 3D carousel ═══════════════════ */}
      <section className="pt-10 pb-8" style={{ background: "linear-gradient(180deg, #fff 0%, #F4F6FF 100%)" }}>
        <FadeUp className="px-4">
          <h2 className="section-title">{tr("testimonials")}</h2>
          <div className="gold-divider" />
          <p className="text-center text-gray-400 text-sm mb-8">Real reviews from verified buyers</p>
        </FadeUp>
        <TestimonialsCarousel testimonials={liveTestimonials} />
      </section>

      {/* ═══ JS COINS LOYALTY BANNER ═════════════════════════════ */}
      <section className="py-14 md:py-20 px-4 overflow-hidden" style={{ background: "#FDFAF3", borderTop: "1px solid rgba(201,168,76,0.18)", borderBottom: "1px solid rgba(201,168,76,0.18)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ y: 24 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col md:grid md:grid-cols-[auto_1fr_auto] gap-8 md:gap-12 items-center"
          >
            {/* Artisan circular monogram emblem */}
            <div className="flex md:flex-col items-center md:items-start gap-5 md:gap-0 flex-shrink-0">
              <div
                className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center rounded-full"
                style={{
                  border: "1.5px solid #C9A84C",
                  background: "transparent",
                  boxShadow: "0 0 0 6px rgba(201,168,76,0.06)",
                }}
              >
                {/* Fine-line JS monogram in gold */}
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="5" y="26" fontFamily="Georgia, serif" fontSize="18" fontWeight="300" fill="#C9A84C" letterSpacing="1">JS</text>
                </svg>
              </div>
              <div className="md:mt-5">
                <p className="font-serif text-2xl md:text-3xl font-normal text-brand-brown leading-tight">JS Coins</p>
                <p className="text-[10px] font-semibold tracking-[3px] uppercase mt-1" style={{ color: "#9E7A2E" }}>Loyalty Rewards</p>
              </div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 w-full">
              {[
                { step: "01", title: "Shop & Earn",   desc: "1 Coin per ₹1 spent on every allocation",  Icon: ShoppingBag },
                { step: "02", title: "Earn Bonuses",  desc: "Reviews, referrals & birthday rewards",     Icon: TrendingUp },
                { step: "03", title: "Redeem",         desc: "100 coins = ₹2.50 off · max ₹50/order",    Icon: Tag },
              ].map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ y: 16 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="text-center"
                >
                  <div className="w-px h-5 bg-brand-gold/30 mx-auto mb-3" />
                  <step.Icon size={15} className="mx-auto mb-2" style={{ color: "#C9A84C" }} />
                  <p className="text-[9px] font-bold tracking-[3px] uppercase mb-1" style={{ color: "#C9A84C" }}>{step.step}</p>
                  <h3 className="font-semibold text-xs text-brand-brown mb-1">{step.title}</h3>
                  <p className="text-[10px] text-gray-400 leading-snug hidden md:block">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center md:text-right flex flex-row md:flex-col items-center md:items-end gap-4 flex-shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 text-xs whitespace-nowrap transition-all duration-200 hover:gap-3"
                style={{ border: "1px solid #C9A84C", color: "#9E7A2E", background: "transparent", letterSpacing: "0.08em" }}
              >
                JOIN FREE — EARN 50 COINS
              </Link>
              <p className="text-xs text-gray-400 whitespace-nowrap">
                Member?{" "}
                <Link to="/dashboard" className="font-semibold underline" style={{ color: "#C9A84C" }}>
                  View balance
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SCROLLING PRODUCT IMAGE STRIP ══════════════════════ */}
      {/* All src= paths reference verified Unsplash product images — zero broken links */}
      <section className="py-5 overflow-hidden" style={{ background: "#F4F0E8", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
        <div className="marquee-track flex gap-3" style={{ width: "max-content" }}>
          {[
            { src: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&q=80", alt: "California Almonds" },
            { src: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=200&q=80", alt: "W320 Cashews" },
            { src: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=200&q=80", alt: "Iranian Pistachios" },
            { src: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=200&q=80", alt: "Kashmiri Walnuts" },
            { src: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&q=80", alt: "Gift Hamper" },
            { src: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&q=80", alt: "Premium Almonds" },
            { src: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=200&q=80", alt: "Cashew Texture" },
            { src: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=200&q=80", alt: "Pistachio Close-up" },
            // Doubled for seamless loop
            { src: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&q=80", alt: "California Almonds" },
            { src: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=200&q=80", alt: "W320 Cashews" },
            { src: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=200&q=80", alt: "Iranian Pistachios" },
            { src: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=200&q=80", alt: "Kashmiri Walnuts" },
            { src: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&q=80", alt: "Gift Hamper" },
            { src: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&q=80", alt: "Premium Almonds" },
            { src: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=200&q=80", alt: "Cashew Texture" },
            { src: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=200&q=80", alt: "Pistachio Close-up" },
          ].map((img, i) => (
            <Link key={i} to="/products" className="flex-shrink-0 group">
              <img
                src={img.src}
                alt={img.alt}
                className="object-cover transition-all duration-300 group-hover:scale-105"
                style={{ width: 88, height: 88, border: "1px solid rgba(201,168,76,0.2)" }}
                loading="lazy"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ BLOG SECTION ═══════════════════════════════════════ */}
      <section className="py-14 md:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-10">
            <p className="sec-tag justify-center mb-3">From Our Kitchen</p>
            <h2 className="section-title text-brand-brown">Health Tips & <em style={{ color: "#C9A84C" }}>Recipes</em></h2>
            <div className="gold-divider mx-auto mt-4" />
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { title: "10 Health Benefits of Almonds You Must Know", category: "Health", date: "May 2025", img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80&auto=format&fit=crop", slug: "benefits-of-almonds", read: "4 min read" },
              { title: "How to Store Dry Fruits to Keep Them Fresh", category: "Tips", date: "Apr 2025", img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80&auto=format&fit=crop", slug: "how-to-store-dry-fruits", read: "3 min read" },
              { title: "Cashews vs Almonds: Which is Better for You?", category: "Nutrition", date: "Mar 2025", img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=600&q=80&auto=format&fit=crop", slug: "cashews-vs-almonds", read: "5 min read" },
            ].map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/blog/${post.slug}`} className="group block border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-44 overflow-hidden">
                    <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full">{post.category}</span>
                      <span className="text-[10px] text-gray-400">{post.read}</span>
                    </div>
                    <h3 className="font-semibold text-brand-brown text-sm leading-snug group-hover:text-brand-gold transition-colors mb-2">{post.title}</h3>
                    <p className="text-xs text-gray-400">{post.date}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/blog" className="btn-outline px-8 py-2.5 text-sm inline-flex items-center gap-2">
              View All Articles <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ════════════════════════════════════════════════ */}
      <HomeFAQ />

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
              <MagneticButton>
                <a href="https://wa.me/917568577968" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #E2C06A)", color: "#1B2E4B" }}>
                  <MessageCircle size={14} /> Chat on WhatsApp
                </a>
              </MagneticButton>
              <MagneticButton>
                <Link to="/products"
                  className="flex items-center gap-2 font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:scale-105 border border-white/20"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}>
                  Shop Now
                </Link>
              </MagneticButton>
            </div>
          </div>
        </FadeUp>
      </section>

    </div>
  );
}

/* ── Home FAQ Component ─────────────────────────────────────── */
const HOME_FAQS = [
  { q: "Are your products 100% natural and chemical-free?", a: "Yes, absolutely. We never use sulphur dioxide, artificial colours, mineral oil coating, or any preservatives. Pure, natural dry fruits — nothing added. FSSAI certified." },
  { q: "How long does delivery take?", a: "Metro cities: 2–3 business days. Tier-2 cities: 3–5 days. All orders are dispatched within 24 hours of payment (Mon–Sat). Free shipping on orders above ₹499." },
  { q: "What payment methods are accepted?", a: "UPI (PhonePe, GPay, Paytm), all debit/credit cards, net banking, and EMI on cards above ₹3,000. All payments via Razorpay with 256-bit SSL encryption." },
  { q: "What is your return/refund policy?", a: "7-day hassle-free return policy from delivery date. Not satisfied with quality? Contact us within 7 days — we arrange pickup and full refund or replacement." },
  { q: "What are JS Coins and how do I use them?", a: "JS Coins are our loyalty rewards. Earn 1 coin per ₹1 spent. Signup bonus: 50 coins. 100 JS Coins = ₹25 off your next order. Valid for 12 months." },
  { q: "Do you offer bulk/wholesale pricing?", a: "Yes! For orders above 5 kg, we offer 15–25% off retail MRP. Call us at +91 75685 77968 or email us with your requirement for a custom quote within 2 hours." },
];

function HomeFAQ() {
  const [open, setOpen] = React.useState(null);
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-brand-gold text-[10px] font-bold uppercase tracking-[3px] flex items-center justify-center gap-2 mb-2">
            <span className="w-6 h-px bg-brand-gold inline-block" />
            Common Questions
            <span className="w-6 h-px bg-brand-gold inline-block" />
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-brand-brown">Frequently Asked <em style={{ color: "#C9A84C" }}>Questions</em></h2>
          <div className="w-10 h-0.5 mx-auto mt-3" style={{ background: "linear-gradient(90deg, #1B2E4B, #C9A84C)" }} />
        </div>
        <div className="space-y-2">
          {HOME_FAQS.map((faq, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-brand-cream/40 transition-colors"
              >
                <span className="font-semibold text-brand-brown text-sm pr-4">{faq.q}</span>
                <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex-shrink-0 text-brand-gold">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                </motion.span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <p className="px-5 pb-4 text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link to="/faq" className="inline-flex items-center gap-2 text-brand-gold text-xs font-bold uppercase tracking-widest hover:gap-3 transition-all">
            View All FAQs <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
