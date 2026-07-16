import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, Lock, Truck, ShieldCheck, Send, CreditCard } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

// Same Cloud Functions backend used by Checkout.jsx for Razorpay — see that
// file's comment for why this falls back to the local emulator.
const FUNCTIONS_BASE_URL =
  process.env.REACT_APP_FUNCTIONS_BASE_URL ||
  "http://127.0.0.1:5001/jaishreedryfruits-973dd/asia-south1";

// No opacity animation — the footer is on every page, so leaving content at
// opacity:0 until scrolled into view meant it (and every link in it,
// including the city pages linked here) was invisible in what crawlers that
// don't scroll (Googlebot's renderer included) actually see.
const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ y: 20 }}
    whileInView={{ y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function Footer() {
  const { siteContent } = useSiteSettings() || {};
  const { tr } = useLanguage();
  const contact = siteContent?.contact || {};
  const phoneDigits = (contact.phone || "+91 75685 77968").replace(/\D/g, "");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      await addDoc(collection(db, "newsletter"), {
        email: newsletterEmail.trim(),
        createdAt: serverTimestamp(),
      });
      // Best-effort — Firestore save above is the source of truth for admin
      // records, so a Brevo hiccup shouldn't block the user-facing success.
      fetch(`${FUNCTIONS_BASE_URL}/subscribeNewsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      }).catch(() => {});
      fetch(`${FUNCTIONS_BASE_URL}/sendTemplatedEmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: newsletterEmail.trim(), template: "newsletterWelcome", data: { email: newsletterEmail.trim() } }),
      }).catch(() => {});
      toast.success("Subscribed! Welcome to the Premium Club.");
      setNewsletterEmail("");
    } catch {
      toast.error("Could not subscribe — please try again");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="text-white" style={{ background: "#1B2E4B" }}>

      {/* ── Newsletter ── */}
      <div className="border-b py-10 px-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-lg font-medium text-white">{tr("joinPremiumClub")}</h3>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Exclusive offers, new arrivals &amp; health tips
            </p>
          </div>
          <form className="flex gap-2 w-full md:w-auto" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder={tr("emailPlaceholder")}
              className="flex-1 md:w-64 bg-white/10 text-white text-sm px-4 py-2.5 focus:outline-none focus:bg-white/15 transition-colors placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="text-sm font-semibold px-5 py-2.5 whitespace-nowrap transition-colors flex items-center gap-1.5 bg-brand-gold text-brand-brown hover:bg-brand-gold-dark hover:text-white"
            >
              {isSubscribing ? tr("subscribing") : tr("subscribe")}
            </button>
          </form>
        </div>
      </div>

      {/* ── Main footer body ── */}
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">

        {/* Brand */}
        <FadeIn className="col-span-2 md:col-span-1">
          <div className="mb-5 flex items-center gap-2.5">
            <img src="/logo.png" alt="Jai Shree Dry Fruits" style={{ width: 40, height: 40, objectFit: "contain" }} />
            <div>
              <p className="font-serif leading-none text-lg text-white">Jai Shree</p>
              <p className="text-[10px] leading-none mt-1 tracking-[0.2em] text-white/50">DRY FRUITS</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-6 text-white/60">
            {contact.footerTagline || "Finest quality dry fruits and nuts sourced from the best farms in Kashmir, California and Iran. Delivered fresh to your door since 1999."}
          </p>
          <div className="flex gap-2.5">
            {[
              { href: contact.socialInstagram || "https://instagram.com", icon: <Instagram size={14} /> },
              { href: contact.socialFacebook || "https://facebook.com",  icon: <Facebook size={14} /> },
              { href: contact.socialTwitter || "https://youtube.com",   icon: <Youtube size={14} /> },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center transition-colors bg-white/10 hover:bg-white/20"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </FadeIn>

        {/* Quick Links */}
        <FadeIn delay={0.05}>
          <h4 className="mb-5 uppercase text-[11px] tracking-[2px] font-semibold text-white/50">Quick Links</h4>
          <ul className="space-y-3 text-sm text-white/65">
            {[
              { to: "/",                           label: tr("home") },
              { to: "/products",                   label: tr("allProducts") },
              { to: "/products?badge=Best Seller", label: tr("bestSellers") },
              { to: "/products?category=Gift Hampers", label: tr("giftHampers") },
              { to: "/blog",                       label: tr("ourBlog") },
              { to: "/sourcing",                   label: tr("sourcingStory") },
              { to: "/about",                      label: tr("aboutUs") },
              { to: "/contact",                    label: tr("contactUs") },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </FadeIn>

        {/* Support */}
        <FadeIn delay={0.1}>
          <h4 className="mb-5 uppercase text-[11px] tracking-[2px] font-semibold text-white/50">Support</h4>
          <ul className="space-y-3 text-sm text-white/65">
            {[
              { to: "/faq",      label: tr("faqs") },
              { to: "/shipping", label: tr("shippingPolicy") },
              { to: "/returns",  label: tr("returnRefund") },
              { to: "/privacy",  label: tr("privacyPolicy") },
              { to: "/terms",    label: tr("termsConditions") },
              { to: "/track-order", label: tr("trackOrder") },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </FadeIn>

        {/* Contact */}
        <FadeIn delay={0.15}>
          <h4 className="mb-5 uppercase text-[11px] tracking-[2px] font-semibold text-white/50">Contact</h4>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start text-sm text-white/65">
              <Phone size={14} className="flex-shrink-0 mt-0.5 text-white/40" />
              {contact.phone || "+91 75685 77968"}
            </li>
            <li className="flex gap-3 items-start text-sm text-white/65">
              <Mail size={14} className="flex-shrink-0 mt-0.5 text-white/40" />
              {contact.email || "info@jaishreedryfruits.com"}
            </li>
            <li className="flex gap-3 items-start text-sm text-white/65 leading-relaxed">
              <MapPin size={14} className="flex-shrink-0 mt-0.5 text-white/40" />
              {contact.address || "41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001"}
            </li>
          </ul>
          <a
            href={`https://wa.me/91${phoneDigits.slice(-10)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 transition-colors bg-white/10 hover:bg-white/20"
          >
            <Phone size={13} /> Chat on WhatsApp
          </a>
        </FadeIn>
      </div>

      {/* Payment methods strip */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xs text-white/40">{tr("weAccept")}</span>
          <div className="flex items-center gap-4 flex-wrap justify-center text-xs text-white/50">
            {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking", "COD"].map((m) => (
              <span key={m} className="flex items-center gap-1.5">
                <CreditCard size={13} className="text-white/30" /> {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* We Deliver To — internal links so crawlers can discover the city
          landing pages; sitemap.xml lists them too, but pages with zero
          inbound links from elsewhere on the site rank far worse even when
          they're technically indexed. */}
      <div className="max-w-7xl mx-auto px-4 py-6 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <p className="text-xs mb-3 text-center md:text-left text-white/30">We Deliver Dry Fruits To</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center md:justify-start text-xs text-white/40">
          {["mumbai", "delhi", "bangalore", "hyderabad", "chennai", "pune", "kolkata", "ahmedabad", "jaipur", "lucknow", "surat", "nagpur", "kochi", "chandigarh", "indore", "coimbatore", "noida", "patna", "bhopal", "varanasi"].map((slug) => (
            <Link key={slug} to={`/dry-fruits-delivery/${slug}`} className="capitalize hover:text-white transition-colors">
              {slug}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="py-5 px-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Jai Shree Dryfruits. All rights reserved.</p>
          <div className="flex gap-5 flex-wrap justify-center">
            <span className="flex items-center gap-1.5"><Lock size={12} /> Secure Payments</span>
            <span className="flex items-center gap-1.5"><Truck size={12} /> Free Shipping ₹499+</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> 100% Authentic</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
