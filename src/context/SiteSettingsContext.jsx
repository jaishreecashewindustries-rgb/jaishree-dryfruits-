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
  { name: "Almonds",      img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80", link: "/products?category=Almonds" },
  { name: "Cashews",      img: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=400&q=80", link: "/products?category=Cashews" },
  { name: "Pistachios",   img: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=400&q=80", link: "/products?category=Pistachios" },
  { name: "Walnuts",      img: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=400&q=80", link: "/products?category=Walnuts" },
  { name: "Dates",        img: "https://images.unsplash.com/photo-1691657917109-c6e027eac44a?w=400&q=80", link: "/products?category=Dates" },
  { name: "Gift Hampers", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80", link: "/products?category=Gift Hampers" },
];

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
  hero: {
    headline: "Premium Dry Fruits,\nDelivered Fresh",
    subheadline: "Sourced from the world's finest farms. Freshness guaranteed.",
    backgroundImage: "",
    ctaText: "Shop Premium Collection",
    ctaSecondary: "Our Story",
  },
  about: {
    storyTitle: "Our Story",
    storyText: "Founded with a passion for purity, Jai Shree Dry Fruits sources the finest nuts and dry fruits from trusted farms around the world.",
    missionTitle: "Our Mission",
    missionText: "To bring premium-quality, authentic dry fruits to every Indian home — fresh, pure, and fairly priced.",
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
    title: "From Farm to Your Table",
    text: "We travel to the source — California almonds, Iranian pistachios, Kashmiri walnuts — building direct relationships with farmers who share our commitment to quality.",
    image: "",
    highlights: [
      { label: "Farm Partners", value: "50+" },
      { label: "Countries Sourced", value: "12" },
      { label: "Quality Checks", value: "3-Stage" },
      { label: "Years Experience", value: "15+" },
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

  return (
    <SiteSettingsContext.Provider value={{ coinsRules, hero, announcement, categories, healthGoals, combos, whyUs, origins, siteContent, loaded }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
