import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  Save, Loader2, LayoutDashboard, Users, Home, MapPin, Phone, Star,
  Video, Megaphone, Grid, Target, Package, Layers, Leaf, Coins,
  CheckCircle,
} from "lucide-react";
import ImageUpload from "../../components/ImageUpload";
import toast from "react-hot-toast";
import {
  DEFAULT_HERO, DEFAULT_ANNOUNCEMENT, DEFAULT_CATEGORIES,
  DEFAULT_HEALTH_GOALS, DEFAULT_COMBOS, DEFAULT_WHY_US,
  DEFAULT_ORIGINS, DEFAULT_COINS_RULES,
} from "../../context/SiteSettingsContext";

const ICON_OPTIONS = [
  "Heart","Activity","Flame","ShieldCheck","Scale","Dumbbell","Sparkles","Users",
  "Star","Leaf","Award","Gift","Package","Zap","Phone","CheckCircle",
];

const TABS = [
  { id: "hero",         label: "Hero",           icon: Video },
  { id: "announcement", label: "Announcement",    icon: Megaphone },
  { id: "categories",   label: "Categories",      icon: Grid },
  { id: "healthGoals",  label: "Health Goals",    icon: Target },
  { id: "combos",       label: "Combo Deals",     icon: Layers },
  { id: "whyUs",        label: "Why Us",          icon: Leaf },
  { id: "origins",      label: "Origins",         icon: MapPin },
  { id: "coins",        label: "JS Coins",        icon: Coins },
  { id: "about",        label: "About & Story",   icon: LayoutDashboard },
  { id: "team",         label: "Team",            icon: Users },
  { id: "contact",      label: "Contact & Footer",icon: Phone },
  { id: "trust",        label: "Trust Bar",       icon: Star },
];

const SITE_CONTENT_DEFAULTS = {
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
      { name: "Rajesh Kumar", title: "Founder & CEO", bio: "Visionary behind Jai Shree Dry Fruits with 15+ years in premium food industry.", photo: "" },
      { name: "Priya Kumar", title: "COO", bio: "Operations expert ensuring every order is perfect and on time.", photo: "" },
    ],
  },
  contact: {
    phone: "+91 75685 77968",
    email: "info@jaishreegryfruits.com",
    address: "41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001",
    whatsapp: "+91 75685 77968",
    footerTagline: "Premium Dry Fruits & Nuts — Fresh, Pure, Authentic",
    socialInstagram: "",
    socialFacebook: "",
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

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState("hero");
  // Homepage settings (hero, announcement, categories, healthGoals, combos, whyUs, origins)
  const [homepage, setHomepage] = useState({
    hero: DEFAULT_HERO,
    announcement: DEFAULT_ANNOUNCEMENT,
    categories: DEFAULT_CATEGORIES,
    healthGoals: DEFAULT_HEALTH_GOALS,
    combos: DEFAULT_COMBOS,
    whyUs: DEFAULT_WHY_US,
    origins: DEFAULT_ORIGINS,
  });
  // Coins settings
  const [coinsData, setCoinsData] = useState(DEFAULT_COINS_RULES);
  // Site content (about, team, contact, trust)
  const [siteContent, setSiteContent] = useState(SITE_CONTENT_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [homepageSnap, coinsSnap, contentSnap] = await Promise.all([
          getDoc(doc(db, "settings", "homepage")),
          getDoc(doc(db, "settings", "coins")),
          getDoc(doc(db, "settings", "siteContent")),
        ]);
        if (homepageSnap.exists()) {
          const d = homepageSnap.data();
          setHomepage(prev => ({
            hero: d.hero ? { ...prev.hero, ...d.hero } : prev.hero,
            announcement: d.announcement ? { ...prev.announcement, ...d.announcement } : prev.announcement,
            categories: d.categories?.length ? d.categories : prev.categories,
            healthGoals: d.healthGoals?.length ? d.healthGoals : prev.healthGoals,
            combos: d.combos?.length ? d.combos : prev.combos,
            whyUs: d.whyUs?.length ? d.whyUs : prev.whyUs,
            origins: d.origins?.length ? d.origins : prev.origins,
          }));
        }
        if (coinsSnap.exists()) {
          setCoinsData(c => ({ ...c, ...coinsSnap.data() }));
        }
        if (contentSnap.exists()) {
          setSiteContent(prev => ({ ...prev, ...contentSnap.data() }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const homepageTabs = ["hero","announcement","categories","healthGoals","combos","whyUs","origins"];
      const coinsTabs = ["coins"];
      const contentTabs = ["about","team","contact","trust"];

      if (homepageTabs.includes(activeTab)) {
        await setDoc(doc(db, "settings", "homepage"), { ...homepage, updatedAt: serverTimestamp() }, { merge: true });
      } else if (coinsTabs.includes(activeTab)) {
        await setDoc(doc(db, "settings", "coins"), { ...coinsData, updatedAt: serverTimestamp() }, { merge: true });
      } else if (contentTabs.includes(activeTab)) {
        await setDoc(doc(db, "settings", "siteContent"), { ...siteContent, updatedAt: serverTimestamp() }, { merge: true });
      }
      toast.success("Saved!");
    } catch (e) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Helpers
  const updateHomepage = (key, value) => setHomepage(prev => ({ ...prev, [key]: value }));
  const updateHero = (field, val) => setHomepage(prev => ({ ...prev, hero: { ...prev.hero, [field]: val } }));
  const updateAnnouncement = (field, val) => setHomepage(prev => ({ ...prev, announcement: { ...prev.announcement, [field]: val } }));
  const updateListItem = (listKey, idx, field, val) => {
    setHomepage(prev => {
      const arr = [...prev[listKey]];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...prev, [listKey]: arr };
    });
  };
  const addListItem = (listKey, template) => setHomepage(prev => ({ ...prev, [listKey]: [...prev[listKey], template] }));
  const removeListItem = (listKey, idx) => setHomepage(prev => ({ ...prev, [listKey]: prev[listKey].filter((_, i) => i !== idx) }));
  const updateCoins = (field, val) => setCoinsData(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
  const updateContent = (tab, field, val) => setSiteContent(prev => ({ ...prev, [tab]: { ...prev[tab], [field]: val } }));
  const updateContentNested = (tab, arrField, idx, field, val) => {
    setSiteContent(prev => {
      const arr = [...(prev[tab][arrField] || [])];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...prev, [tab]: { ...prev[tab], [arrField]: arr } };
    });
  };

  if (loading) return (

... [359 lines truncated] ...