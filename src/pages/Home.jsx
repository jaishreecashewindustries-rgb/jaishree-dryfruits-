import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Shield, Truck, Award, RefreshCw,
  Leaf, CheckCircle, Gift, Users2, Mail,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { SkeletonCard } from "../components/SkeletonCard";
import AnimatedCounter from "../components/AnimatedCounter";
import SEO from "../components/SEO";
import TestimonialsCarousel from "../components/TestimonialsCarousel";
import OriginsMap from "../components/OriginsMap";
import HeroCarousel from "../components/HeroCarousel";
import { useProducts } from "../context/ProductsContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import toast from "react-hot-toast";

/* ── Framer helper ──────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.5, delay: Math.min(delay, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Static data ────────────────────────────────────────────── */
const TRUST_POINTS = [
  { icon: <Shield size={20} />, title: "100% Authentic" },
  { icon: <Truck size={20} />, title: "Free Delivery ₹499+" },
  { icon: <Award size={20} />, title: "FSSAI Certified" },
  { icon: <RefreshCw size={20} />, title: "7-Day Returns" },
];

const CATEGORIES = [
  { name: "Almonds", img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80" },
  { name: "Cashews", img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=400&q=80" },
  { name: "Pistachios", img: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=400&q=80" },
  { name: "Walnuts", img: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=400&q=80" },
  { name: "Dates", img: "https://images.unsplash.com/photo-1691657917109-c6e027eac44a?w=400&q=80" },
  { name: "Gift Hampers", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80" },
];

const WHY_US = [
  { icon: <Leaf size={22} />, title: "Farm Direct", desc: "Sourced straight from Kashmir, California & Iran — no middlemen." },
  { icon: <CheckCircle size={22} />, title: "Lab-Tested Purity", desc: "Every batch NABL tested. No sulphur, no polish, no additives." },
  { icon: <Gift size={22} />, title: "Gift Ready", desc: "Premium packaging & bulk corporate gifting, 50+ units." },
  { icon: <Users2 size={22} />, title: "50,000+ Families", desc: "Trusted since 1999, from our shop in Gangauri Bazar, Jaipur." },
];

const TESTIMONIALS_FALLBACK = [
  { name: "Priya Sharma", city: "Mumbai", rating: 5, text: "Best quality almonds I've ever bought! Freshness is unmatched. Will definitely order again.", product: "Premium Almonds" },
  { name: "Rajesh Kumar", city: "Delhi", rating: 5, text: "The Royal Gift Hamper was perfect for Diwali. Beautiful packaging, loved by family!", product: "Royal Hamper" },
  { name: "Ananya Patel", city: "Bangalore", rating: 5, text: "So fresh and creamy. Delivery was quick. Great value for premium quality.", product: "Whole Cashews" },
  { name: "Sunita Verma", city: "Jaipur", rating: 5, text: "Ordered pistachios for a wedding function. Everyone loved them. Will order bulk again!", product: "Irani Pistachios" },
];

function useLiveTestimonials() {
  const [reviews, setReviews] = useState(TESTIMONIALS_FALLBACK);
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const q = query(collection(db, "reviews"), where("status", "==", "approved"), orderBy("createdAt", "desc"), limit(5));
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

function Eyebrow({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-[3px] mb-3" style={{ color: "var(--gold)" }}>{children}</p>;
}

/* ── Main component ─────────────────────────────────────────── */
export default function Home() {
  const { products: DEMO_PRODUCTS } = useProducts();
  const featured = DEMO_PRODUCTS.filter((p) => p.featured).slice(0, 8);
  // Combo Packs & Gift Hampers are regular categories, managed the same way
  // as any other product in Admin → Products (category dropdown) — this
  // just showcases whatever's live in those two categories on the homepage.
  const combosAndGifts = DEMO_PRODUCTS.filter((p) => p.category === "Combo Packs" || p.category === "Gift Hampers").slice(0, 8);
  const { siteContent } = useSiteSettings() || {};
  const hero = siteContent?.hero || {};
  const heroHeadline = hero.headline || "India's Finest\nDry Fruits";
  const heroDesktopImg = hero.desktopImage || "";
  const heroMobileImg = hero.mobileImage || hero.desktopImage || "";
  const heroSlides = Array.isArray(hero.slides) ? hero.slides.filter((s) => s?.desktopImage || s?.mobileImage) : [];
  const [productsReady, setProductsReady] = useState(false);
  const liveTestimonials = useLiveTestimonials();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setProductsReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSent(true);
    toast.success("You're subscribed! Watch your inbox for offers.");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <SEO
        title="India's Finest Dry Fruits — Premium Almonds, Cashews, Pistachios"
        description="Shop premium California almonds, Kashmiri walnuts & Iranian pistachios. FSSAI certified, free shipping above ₹499. Est. 1999, Jaipur. 50,000+ happy families."
        type="website"
      />

      {/* ═══ HERO — admin-controlled carousel, copy/CTA baked into the
             artwork itself (no DOM text overlay). ═ */}
      <HeroCarousel
        slides={heroSlides.length ? heroSlides : [{ desktopImage: heroDesktopImg, mobileImage: heroMobileImg }]}
        fallbackHeadline={heroHeadline.replace("\n", " ")}
      />

      {/* ═══ TRUST STRIP ═══════════════════════════════════════ */}
      <section className="border-y border-gray-100 py-5 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_POINTS.map((f, i) => (
            <div key={f.title} className="flex items-center justify-center gap-2 text-center">
              <span style={{ color: "var(--gold)" }}>{f.icon}</span>
              <p className="font-semibold text-brand-brown text-xs md:text-sm">{f.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CATEGORIES ═════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <FadeUp className="text-center mb-10">
          <Eyebrow>Shop By Category</Eyebrow>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-brand-brown">Everyday to Gifting</h2>
        </FadeUp>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
          {CATEGORIES.map((cat, i) => (
            <FadeUp key={cat.name} delay={i * 0.05}>
              <Link to={`/products?category=${cat.name}`} className="group flex flex-col items-center gap-2.5">
                <div className="relative w-full rounded-full overflow-hidden transition-transform duration-300 group-hover:-translate-y-1.5" style={{ aspectRatio: "1/1" }}>
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] md:text-xs font-semibold text-brand-brown group-hover:text-brand-gold transition-colors text-center">{cat.name}</span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ═══ BEST SELLERS ═══════════════════════════════════════ */}
      <section className="py-16 px-4" style={{ background: "var(--bg2)" }}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-10">
            <Eyebrow>Loved by 50,000+ customers</Eyebrow>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-brand-brown">Our Best Sellers</h2>
          </FadeUp>
          {!productsReady ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {featured.map((p) => (
                <motion.div key={p.id} variants={{ hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          )}
          <FadeUp delay={0.15} className="text-center mt-10">
            <Link to="/products" className="btn-outline inline-flex items-center gap-2 px-8 py-3">
              View All Products <ArrowRight size={16} />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ═══ COMBOS & GIFT HAMPERS — real products, managed the same way
             as any other category in Admin → Products ═══ */}
      {productsReady && combosAndGifts.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <FadeUp className="text-center mb-10">
              <Eyebrow>Combos &amp; Gift Hampers</Eyebrow>
              <h2 className="font-serif font-bold text-3xl md:text-4xl text-brand-brown">Bundles &amp; Gifting, Ready to Ship</h2>
            </FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {combosAndGifts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <FadeUp delay={0.15} className="text-center mt-10">
              <Link to="/products?category=Gift Hampers" className="btn-outline inline-flex items-center gap-2 px-8 py-3">
                Shop Combos &amp; Gift Hampers <ArrowRight size={16} />
              </Link>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ═══ SOURCING ORIGINS — real world map, product markers ══ */}
      <section className="py-16 px-4" style={{ background: "var(--bg2)" }}>
        <div className="max-w-3xl mx-auto text-center mb-10">
          <Eyebrow>Since 1999</Eyebrow>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-brand-brown">
            From the World's Finest Origins, <span style={{ color: "var(--gold)" }}>Straight to Your Plate.</span>
          </h2>
        </div>
        <div className="max-w-4xl mx-auto">
          <OriginsMap />
        </div>
      </section>

      {/* ═══ WHY US — one tight section, no filler ══════════════ */}
      <section className="py-16 px-4" style={{ background: "var(--navy)" }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[3px] mb-3" style={{ color: "var(--gold)" }}>Why Jai Shree</p>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-white">Quality You Can Trust</h2>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-14">
            {WHY_US.map((item, i) => (
              <motion.div key={item.title} initial={{ y: 16, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)" }}>
                  {item.icon}
                </div>
                <h3 className="font-semibold text-white text-sm mb-1.5">{item.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <FadeUp delay={0.2} className="flex flex-wrap justify-center gap-x-12 gap-y-6 pt-10 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="text-center">
              <p className="font-serif text-2xl md:text-3xl font-bold text-white"><AnimatedCounter to={25} suffix="+" /></p>
              <p className="text-xs text-white/50 mt-1">Years in Jaipur</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-2xl md:text-3xl font-bold text-white"><AnimatedCounter to={50000} suffix="+" /></p>
              <p className="text-xs text-white/50 mt-1">Happy Families</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-2xl md:text-3xl font-bold text-white">4.9/5</p>
              <p className="text-xs text-white/50 mt-1">Customer Rating</p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══ CORPORATE & BULK — single elegant banner, one CTA ══ */}
      <section className="py-16 px-4" style={{ background: "var(--navy)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <FadeUp>
            <Eyebrow>Corporate &amp; Bulk Orders</Eyebrow>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-white mb-3">Branded Gifting, At Scale</h2>
            <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto mb-7">50+ units, dedicated account manager, custom branding — for corporates, weddings &amp; festive gifting.</p>
            <Link to="/contact" className="btn-gold btn-sheen inline-flex items-center gap-2 px-8 py-3.5">
              Enquire Now <ArrowRight size={15} />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <FadeUp className="text-center mb-10">
          <Eyebrow>4.9 out of 5, 1,400+ reviews</Eyebrow>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-brand-brown">Let Customers Speak for Us</h2>
        </FadeUp>
        <TestimonialsCarousel testimonials={liveTestimonials} />
      </section>

      {/* ═══ NEWSLETTER — single email capture, one CTA ═════════ */}
      <section className="py-16 px-4 text-center" style={{ background: "var(--bg2)" }}>
        <FadeUp className="max-w-md mx-auto">
          <Mail size={28} className="mx-auto mb-3" style={{ color: "var(--gold)" }} />
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-brand-brown mb-2">Get 15% Off Your First Order</h2>
          <p className="text-sm text-gray-500 mb-6">Join our list for early access to offers &amp; new arrivals.</p>
          {newsletterSent ? (
            <p className="text-sm font-semibold text-green-600">You're subscribed — check your inbox!</p>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Email address"
                className="input-field flex-1"
              />
              <button type="submit" className="btn-primary btn-sheen px-6 flex-shrink-0">Subscribe</button>
            </form>
          )}
        </FadeUp>
      </section>
    </div>
  );
}
