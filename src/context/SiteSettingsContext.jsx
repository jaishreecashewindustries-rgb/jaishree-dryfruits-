import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

// ── DEFAULT VALUES — used when Firestore has nothing yet ──────────────
export const DEFAULT_COINS_RULES = {
  perOrderRupee: 1,
  signup: 50,
  review: 20,
  referral: 100,
  birthday: 200,
  redeemRate: 0.025,
  minRedeem: 100,
  minCartValue: 999,
  maxRedeemValue: 50,
};

export const DEFAULT_HERO = {
  videoUrl: "/hero.mp4",
  posterUrl: "/hero-poster.jpg",
  headline1: "India's Finest",
  headline2: "Dry Fruits",
  tagline: "Kashmir · California · Iran",
  cta1Text: "Shop Premium",
  cta1Link: "/products",
  cta2Text: "Gift Hampers",
  cta2Link: "/products?category=Gift Hampers",
};

export const DEFAULT_ANNOUNCEMENT = {
  enabled: false,
  text: "🎉 Free shipping on orders above ₹499 | Use code WELCOME10 for 10% off",
  link: "/products",
  bgColor: "#C9A84C",
  textColor: "#1B2E4B",
};

export const DEFAULT_CATEGORIES = [
  { name: "Almonds",      img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80", headerImage: "", link: "/products?category=Almonds" },
  { name: "Cashews",      img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=400&q=80", headerImage: "", link: "/products?category=Cashews" },
  { name: "Pistachios",   img: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=400&q=80", headerImage: "", link: "/products?category=Pistachios" },
  { name: "Walnuts",      img: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=400&q=80", headerImage: "", link: "/products?category=Walnuts" },
  { name: "Dates",        img: "https://images.unsplash.com/photo-1691657917109-c6e027eac44a?w=400&q=80", headerImage: "", link: "/products?category=Dates" },
  { name: "Gift Hampers", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80", headerImage: "", link: "/products?category=Gift Hampers" },
];

// Banner shown at the top of the "All Products" page (/products with no
// category selected) — the Collection Hero. Per-category banners live on
// each DEFAULT_CATEGORIES entry's headerImage instead.
export const DEFAULT_PRODUCTS_HEADER = {
  image: "",
  title: "",
  subtitle: "",
};

export const DEFAULT_HEALTH_GOALS = [
  { goal: "Heart Health",  icon: "Heart",       link: "/products?goal=heart" },
  { goal: "Brain Power",   icon: "Activity",    link: "/products?goal=brain" },
  { goal: "Energy Boost",  icon: "Flame",       link: "/products?goal=energy" },
  { goal: "Immunity",      icon: "ShieldCheck", link: "/products?goal=immunity" },
  { goal: "Weight Loss",   icon: "Scale",       link: "/products?goal=weight" },
  { goal: "Bone Strength", icon: "Dumbbell",    link: "/products?goal=bones" },
  { goal: "Skin & Hair",   icon: "Sparkles",    link: "/products?goal=skin" },
  { goal: "Kids",          icon: "Users",       link: "/products?goal=kids" },
];

export const DEFAULT_COMBOS = [
  { id: "c1", name: "Everyday Wellness Trio",  items: "Almonds 250g · Cashews 250g · Walnuts 200g",                      price: "₹899",   original: "₹1,149", saving: "22% off", badge: "Best Seller",  img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80", active: true },
  { id: "c2", name: "Diwali Gifting Box",       items: "Mixed Nuts 500g · Medjool Dates 200g · Pistachios 150g",          price: "₹1,299", original: "₹1,699", saving: "24% off", badge: "Gift Ready",   img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80", active: true },
  { id: "c3", name: "Brain Booster Pack",       items: "California Almonds 500g · Walnuts 250g · Pumpkin Seeds 150g",     price: "₹1,099", original: "₹1,399", saving: "21% off", badge: "Popular",      img: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=600&q=80", active: true },
  { id: "c4", name: "Heart Care Bundle",        items: "Walnuts 500g · Flaxseeds 200g · Sunflower Seeds 200g",            price: "₹999",   original: "₹1,299", saving: "23% off", badge: "Wellness",     img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=600&q=80", active: true },
  { id: "c5", name: "Protein Power Pack",       items: "W320 Cashews 500g · Almonds 250g · Roasted Peanuts 250g",        price: "₹849",   original: "₹1,049", saving: "19% off", badge: "Fitness",      img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=600&q=80", active: true },
  { id: "c6", name: "Family Mega Box",          items: "Almonds 1kg · Cashews 500g · Raisins 500g · Medjool Dates 500g", price: "₹2,499", original: "₹3,199", saving: "22% off", badge: "Family Value", img: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=600&q=80", active: true },
];

export const DEFAULT_WHY_US = [
  { icon: "Leaf",        title: "Farm Direct",     desc: "Straight from source farms in Kashmir, California & Iran" },
  { icon: "CheckCircle", title: "Quality Tested",  desc: "Every batch lab-tested for freshness and purity" },
  { icon: "Package",     title: "Eco Packaging",   desc: "Sustainable, food-safe packaging for freshness" },
  { icon: "Zap",         title: "Quick Dispatch",  desc: "Same-day dispatch on orders before 2 PM" },
  { icon: "Gift",        title: "Gift Ready",      desc: "Premium gift wrapping available on all orders" },
  { icon: "Phone",       title: "24/7 Support",    desc: "Phone & email support for all order queries" },
];

export const DEFAULT_ORIGINS = [
  { place: "Kashmir",      product: "Walnuts & Saffron",     flag: "🇮🇳" },
  { place: "California",   product: "Almonds & Pistachios",  flag: "🇺🇸" },
  { place: "Iran",         product: "Premium Pistachios",    flag: "🇮🇷" },
  { place: "Saudi Arabia", product: "Dates & Figs",          flag: "🇸🇦" },
];

// Mirrors admin/ContentManagement.jsx's DEFAULTS — kept in sync so the
// /admin/content editor and the live site always agree on field shapes.
export const DEFAULT_SITE_CONTENT = {
  // These defaults ARE the live copy until an admin overrides them via
  // Content Management — kept identical to what's hardcoded as the
  // fallback in Home.jsx/AboutPage.jsx/SourcingStory.jsx so wiring up the
  // CMS doesn't silently change the approved site copy the moment someone
  // opens the editor (this happened once — see git history).
  hero: {
    headline: "India's Finest\nDry Fruits",
    subheadline: "Kashmir · California · Iran",
    backgroundImage: "",
    // Separate creatives for web vs mobile — a wide banner shrunk down to
    // phone width wastes most of its composition, and a portrait crop
    // stretched wide looks cropped/blurry. Admin-editable in Content
    // Management → Hero / Banner; these defaults are the launch creative.
    desktopImage: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-desktop-1-goodness.webp?alt=media&token=8d37a2d6-ce92-481f-827a-b594828dfc4a",
    mobileImage: "/hero/hero-mobile-1-goodness.webp",
    // Hero carousel — multiple desktop/mobile creative pairs that auto-rotate
    // with dot navigation. `desktopImage`/`mobileImage` above stay as a
    // single-image fallback for older content; when `slides` has entries,
    // the homepage renders the carousel instead.
    //
    // Mobile images are served from /public/hero/ (not Firebase Storage) —
    // pre-cropped by hand to the exact 900×1200 (3:4) hero box, so no
    // focus/zoom override is needed, unlike the earlier auto-cropped set.
    slides: [
      {
        desktopImage: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-desktop-1-goodness.webp?alt=media&token=8d37a2d6-ce92-481f-827a-b594828dfc4a",
        mobileImage: "/hero/hero-mobile-1-goodness.webp",
      },
      {
        desktopImage: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-desktop-2-notevery.webp?alt=media&token=1c55d809-5467-4102-ae47-fd4b5e9db76b",
        mobileImage: "/hero/hero-mobile-2-notevery.webp",
      },
      {
        desktopImage: "https://firebasestorage.googleapis.com/v0/b/jaishreedryfruits-973dd.firebasestorage.app/o/content%2Fhero%2Fhero-desktop-3-goodfood.webp?alt=media&token=e6628c17-2603-47b1-a4c8-a20c693110b8",
        mobileImage: "/hero/hero-mobile-3-goodfood.webp",
      },
    ],
    ctaText: "Shop Now",
    ctaSecondary: "Gift Hampers",
  },
  about: {
    storyTitle: "Our Story",
    storyText: "Jai Shree Dryfruits was born in 1999 inside Jaipur's historic Gangauri Bazar — one of Rajasthan's oldest trading districts, where merchants have exchanged the world's finest spices and dry fruits for centuries.",
    missionTitle: "Our Mission",
    missionText: "Today we serve over 50,000 families across India — homes, hotels, corporate offices, and wedding caterers. Yet our philosophy hasn't changed: every almond, cashew, walnut, pistachio, and date is hand-selected from its origin farm before it reaches your door.",
    bannerImage: "",
    values: [
      { title: "Pure & Natural", desc: "No artificial preservatives or additives" },
      { title: "Ethically Sourced", desc: "Direct farm partnerships for fair pricing" },
      { title: "Quality Assured", desc: "Triple-tested for freshness and purity" },
    ],
  },
  team: {
    members: [
      { name: "Jitesh Pansari", title: "Co-Founder & CEO", bio: "", photo: "" },
      { name: "Praveen Pansari", title: "Co-Founder & COO", bio: "", photo: "" },
    ],
  },
  sourcing: {
    title: "",
    text: "We don't buy from wholesalers. Every dry fruit at Jai Shree has a documented origin, a verified farm, and a quality-assured journey from harvest to your hand.",
    image: "",
    highlights: [
      { label: "Farm Partners", value: "50+" },
      { label: "Countries Sourced", value: "12" },
      { label: "Quality Checks", value: "3-Stage" },
      { label: "Years Experience", value: "25+" },
    ],
  },
  contact: {
    phone: "+91 75685 77968",
    email: "info@jaishreedryfruits.com",
    address: "41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur - 302001",
    whatsapp: "+91 75685 77968",
    footerTagline: "Finest quality dry fruits and nuts sourced from the best farms in Kashmir, California and Iran. Delivered fresh to your door since 1999.",
    socialInstagram: "",
    socialFacebook: "",
    socialTwitter: "",
  },
  trust: {
    items: [
      { icon: "🌿", text: "100% Natural" },
      { icon: "🚚", text: "Free Delivery ₹499+" },
      { icon: "⭐", text: "4.9 Rated" },
      { icon: "🔒", text: "Secure Payments" },
      { icon: "↩️", text: "Easy Returns" },
    ],
  },
};

const SiteSettingsContext = createContext(null);
export const useSiteSettings = () => useContext(SiteSettingsContext);

export function SiteSettingsProvider({ children }) {
  const [coinsRules, setCoinsRules] = useState(DEFAULT_COINS_RULES);
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [productsHeader, setProductsHeader] = useState(DEFAULT_PRODUCTS_HEADER);
  const [healthGoals, setHealthGoals] = useState(DEFAULT_HEALTH_GOALS);
  const [combos, setCombos] = useState(DEFAULT_COMBOS);
  const [whyUs, setWhyUs] = useState(DEFAULT_WHY_US);
  const [origins, setOrigins] = useState(DEFAULT_ORIGINS);
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [homepageSnap, coinsSnap, contentSnap] = await Promise.all([
          getDoc(doc(db, "settings", "homepage")),
          getDoc(doc(db, "settings", "coins")),
          getDoc(doc(db, "settings", "siteContent")),
        ]);
        if (!cancelled) {
          if (homepageSnap.exists()) {
            const d = homepageSnap.data();
            if (d.hero)         setHero(h => ({ ...h, ...d.hero }));
            if (d.announcement) setAnnouncement(a => ({ ...a, ...d.announcement }));
            if (d.categories?.length)  setCategories(d.categories);
            if (d.productsHeader)      setProductsHeader(h => ({ ...h, ...d.productsHeader }));
            if (d.healthGoals?.length) setHealthGoals(d.healthGoals);
            if (d.combos?.length)      setCombos(d.combos);
            if (d.whyUs?.length)       setWhyUs(d.whyUs);
            if (d.origins?.length)     setOrigins(d.origins);
          }
          if (coinsSnap.exists()) {
            setCoinsRules(r => ({ ...r, ...coinsSnap.data() }));
          }
          if (contentSnap.exists()) {
            const c = contentSnap.data();
            setSiteContent(prev => ({
              hero: { ...prev.hero, ...c.hero },
              about: { ...prev.about, ...c.about },
              team: c.team?.members?.length ? c.team : prev.team,
              sourcing: { ...prev.sourcing, ...c.sourcing },
              contact: { ...prev.contact, ...c.contact },
              trust: c.trust?.items?.length ? c.trust : prev.trust,
            }));
          }
        }
      } catch (e) {
        console.warn("SiteSettings load error:", e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Re-fetch just the categories/productsHeader (settings/homepage) on
  // demand — this context loads everything once on app mount, so without
  // this, a category added/edited/deleted from Admin > Categories wouldn't
  // appear anywhere else in the already-open app (e.g. the Products
  // dropdown in Admin > Products) until a full page reload. Category
  // Management calls this right after a successful save/delete.
  const refreshCategories = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "homepage"));
      if (snap.exists()) {
        const d = snap.data();
        if (d.categories) setCategories(d.categories);
        if (d.productsHeader) setProductsHeader(h => ({ ...h, ...d.productsHeader }));
      }
    } catch (e) {
      console.warn("SiteSettings refreshCategories error:", e);
    }
  };

  return (
    <SiteSettingsContext.Provider value={{ coinsRules, hero, announcement, categories, productsHeader, healthGoals, combos, whyUs, origins, siteContent, loaded, refreshCategories }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
