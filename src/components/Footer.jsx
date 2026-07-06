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
    <footer style={{ background: "linear-gradient(160deg, #0D1B35 0%, #1A2744 40%, #080F1E 100%)" }} className="text-white">

      {/* ── Newsletter — borderless, underline-only ── */}
      <div className="border-b py-14 px-4" style={{ borderColor: "rgba(201,168,76,0.12)", background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[4px] mb-2" style={{ color: "rgba(201,168,76,0.6)" }}>
              Premium Club
            </p>
            <h3 className="font-serif text-xl font-light text-white">{tr("joinPremiumClub")}</h3>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Exclusive offers, new arrivals &amp; health tips
            </p>
          </div>
          <form
            className="flex items-end gap-6 w-full md:w-auto"
            onSubmit={handleNewsletterSubmit}
          >
            {/* Borderless — only bottom 1px line, no fill */}
            <div className="flex-1 md:w-72 relative">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={tr("emailPlaceholder")}
                className="footer-newsletter-input w-full bg-transparent text-white text-sm pb-2.5 focus:outline-none transition-colors"
                style={{
                  border: "none",
                  borderBottom: "1px solid rgba(201,168,76,0.35)",
                  borderRadius: 0,
                  caretColor: "#C9A84C",
                  color: "rgba(255,255,255,0.85)",
                }}
                onFocus={e => { e.currentTarget.style.borderBottomColor = "#C9A84C"; }}
                onBlur={e => { e.currentTarget.style.borderBottomColor = "rgba(201,168,76,0.35)"; }}
              />
              <style>{`.footer-newsletter-input::placeholder{color:rgba(255,255,255,0.4)}`}</style>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubscribing}
              className="text-[11px] font-bold uppercase tracking-[3px] pb-2.5 transition-colors whitespace-nowrap flex items-center gap-1.5"
              style={{
                background: "none",
                border: "none",
                borderBottom: "1px solid #C9A84C",
                color: "#C9A84C",
                cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#E8C97A"; e.currentTarget.style.borderBottomColor = "#E8C97A"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#C9A84C"; e.currentTarget.style.borderBottomColor = "#C9A84C"; }}
            >
              {isSubscribing ? tr("subscribing") : tr("subscribe")} <Send size={11} />
            </motion.button>
          </form>
        </div>
      </div>

      {/* ── Main footer body ── */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">

        {/* Brand — clean typographic mark, no coloured badge */}
        <FadeIn className="col-span-2 md:col-span-1">
          {/* Logo + typographic mark */}
          <div className="mb-6 flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Jai Shree Dry Fruits"
              style={{ width: 52, height: 52, objectFit: "contain", filter: "brightness(1.1)" }}
            />
            <div>
              <p
                className="font-serif font-light leading-none"
                style={{ fontSize: 22, color: "#F4F0E8", letterSpacing: "0.04em" }}
              >
                Jai Shree
              </p>
              <p
                className="font-serif font-light leading-none mt-0.5"
                style={{ fontSize: 12, color: "rgba(201,168,76,0.7)", letterSpacing: "0.22em" }}
              >
                DRY FRUITS
              </p>
              <div className="mt-2 w-8 h-px" style={{ background: "rgba(201,168,76,0.4)" }} />
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>
            {contact.footerTagline || "Finest quality dry fruits and nuts sourced from the best farms in Kashmir, California and Iran. Delivered fresh to your door since 1999."}
          </p>
          <div className="flex gap-3">
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
                className="w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background: s.green ? "linear-gradient(135deg, #25D366, #128C7E)" : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={e => { if (!s.green) { e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; e.currentTarget.style.background = "rgba(201,168,76,0.08)"; } }}
                onMouseLeave={e => { if (!s.green) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; } }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </FadeIn>

        {/* Quick Links */}
        <FadeIn delay={0.05}>
          <h4
            className="mb-6 uppercase"
            style={{ color: "rgba(201,168,76,0.7)", fontSize: 9, letterSpacing: "3.5px", fontWeight: 600 }}
          >
            Quick Links
          </h4>
          <ul className="space-y-3.5" style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1 }}>
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
                <Link
                  to={l.to}
                  className="transition-colors duration-200 hover:translate-x-1 inline-block"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#C9A84C"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </FadeIn>

        {/* Support */}
        <FadeIn delay={0.1}>
          <h4
            className="mb-6 uppercase"
            style={{ color: "rgba(201,168,76,0.7)", fontSize: 9, letterSpacing: "3.5px", fontWeight: 600 }}
          >
            Support
          </h4>
          <ul className="space-y-3.5" style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
            {[
              { to: "/faq",      label: tr("faqs") },
              { to: "/shipping", label: tr("shippingPolicy") },
              { to: "/returns",  label: tr("returnRefund") },
              { to: "/privacy",  label: tr("privacyPolicy") },
              { to: "/terms",    label: tr("termsConditions") },
              { to: "/track-order", label: tr("trackOrder") },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#C9A84C"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </FadeIn>

        {/* Contact — clean coordinate layout */}
        <FadeIn delay={0.15}>
          <h4
            className="mb-6 uppercase"
            style={{ color: "rgba(201,168,76,0.7)", fontSize: 9, letterSpacing: "3.5px", fontWeight: 600 }}
          >
            Contact
          </h4>
          <ul className="space-y-5">
            <li className="flex gap-3.5 items-start">
              <Phone size={13} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(201,168,76,0.6)" }} />
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{contact.phone || "+91 75685 77968"}</p>
            </li>
            <li className="flex gap-3.5 items-start">
              <Mail size={13} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(201,168,76,0.6)" }} />
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{contact.email || "info@jaishreedryfruits.com"}</span>
            </li>
            <li className="flex gap-3.5 items-start">
              <MapPin size={13} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(201,168,76,0.6)" }} />
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.65 }}>
                {contact.address || "41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001"}
              </p>
            </li>
          </ul>
          <a
            href={`https://wa.me/91${phoneDigits.slice(-10)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 transition-all hover:scale-105"
            style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}
          >
            <Phone size={12} /> Chat on WhatsApp
          </a>
        </FadeIn>
      </div>

      {/* Gold separator */}
      <div
        className="mx-4 md:mx-auto max-w-7xl h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), rgba(232,201,122,0.5), rgba(201,168,76,0.3), transparent)" }}
      />

      {/* Payment methods strip */}
      <FadeIn className="px-4 py-5 border-t" style={{ borderColor: "rgba(201,168,76,0.08)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] uppercase tracking-[2.5px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {tr("weAccept")}
          </span>
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking", "COD"].map((m) => (
              <span
                key={m}
                className="flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-md"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}
              >
                <CreditCard size={11} style={{ color: "rgba(201,168,76,0.6)" }} /> {m}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* We Deliver To — internal links so crawlers can discover the city
          landing pages; sitemap.xml lists them too, but pages with zero
          inbound links from elsewhere on the site rank far worse even when
          they're technically indexed. */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <p className="text-[10px] uppercase tracking-[2.5px] mb-3 text-center md:text-left" style={{ color: "rgba(255,255,255,0.3)" }}>
          We Deliver Dry Fruits To
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center md:justify-start">
          {["mumbai", "delhi", "bangalore", "hyderabad", "chennai", "pune", "kolkata", "ahmedabad", "jaipur", "lucknow", "surat", "nagpur", "kochi", "chandigarh", "indore", "coimbatore", "noida", "patna", "bhopal", "varanasi"].map((slug) => (
            <Link
              key={slug}
              to={`/dry-fruits-delivery/${slug}`}
              className="capitalize transition-colors duration-200"
              style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#C9A84C"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
            >
              {slug}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
            © {new Date().getFullYear()} Jai Shree Dryfruits. All rights reserved.
          </p>
          <div className="flex gap-6 flex-wrap justify-center">
            <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
              <Lock size={10} style={{ color: "rgba(201,168,76,0.5)" }} /> Secure Payments
            </span>
            <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
              <Truck size={10} style={{ color: "rgba(201,168,76,0.5)" }} /> Free Shipping ₹499+
            </span>
            <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
              <ShieldCheck size={10} style={{ color: "rgba(201,168,76,0.5)" }} /> 100% Authentic
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
