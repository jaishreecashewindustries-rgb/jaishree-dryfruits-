import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, ChevronDown } from "lucide-react";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useLanguage } from "../context/LanguageContext";
import { PRODUCT_CATEGORIES } from "../utils/helpers";

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

// Collapsible on mobile (tap the heading to expand/collapse — the common
// mobile-footer pattern), always expanded on desktop regardless of state.
function FooterSection({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-white/10 md:border-none pb-4 md:pb-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between md:pointer-events-none mb-0 md:mb-5"
      >
        <h4 className="uppercase text-base tracking-[2px] font-bold text-white/80 py-4 md:py-0">{title}</h4>
        <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 md:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: "hidden" }}
        className="md:!h-auto md:!opacity-100"
      >
        <div className="pb-4 md:pb-0">{children}</div>
      </motion.div>
    </div>
  );
}

export default function Footer() {
  const { siteContent } = useSiteSettings() || {};
  const { tr } = useLanguage();
  const contact = siteContent?.contact || {};
  const [openSection, setOpenSection] = useState(null);
  const toggle = (name) => setOpenSection((cur) => (cur === name ? null : name));

  return (
    <footer className="text-white" style={{ background: "#1B2E4B" }}>

      {/* ── Main footer body — Brand, Quick Links, Our Products, Policy, Contact ── */}
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">

        {/* Brand */}
        <FadeIn className="col-span-2 md:col-span-1 min-w-0">
          <div className="mb-5 flex items-center gap-2.5">
            <img src="/logo.png" alt="Jai Shree Dry Fruits" style={{ width: 40, height: 40, objectFit: "contain" }} />
            <div>
              <p className="font-sans font-extrabold leading-none text-xl text-white tracking-tight">JAI SHREE</p>
              <p className="text-[10px] leading-none mt-1.5 tracking-[0.25em] font-semibold" style={{ color: "var(--gold)" }}>DRY FRUITS</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-6 text-white/60">
            {contact.footerTagline || "Finest quality dry fruits and nuts sourced from the best farms in Kashmir, California and Iran. Delivered fresh to your door since 1999."}
          </p>
          <div className="flex gap-2.5">
            {[
              { name: "Instagram", href: contact.socialInstagram || "https://instagram.com", icon: <Instagram size={14} /> },
              { name: "Facebook",  href: contact.socialFacebook || "https://facebook.com",  icon: <Facebook size={14} /> },
              { name: "YouTube",   href: contact.socialTwitter || "https://youtube.com",   icon: <Youtube size={14} /> },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.name}
                className="w-11 h-11 flex items-center justify-center transition-colors bg-white/10 hover:bg-white/20"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </FadeIn>

        {/* Quick Links */}
        <FadeIn delay={0.05} className="min-w-0">
          <FooterSection title="Quick Links" open={openSection === "links"} onToggle={() => toggle("links")}>
            <ul className="space-y-3 text-sm md:text-base font-medium text-white/75">
              {[
                { to: "/",        label: tr("home") },
                { to: "/about",   label: tr("aboutUs") },
                { to: "/contact", label: tr("contactUs") },
                { to: "/products?category=Gift Hampers", label: "Corporate Gifting" },
                { to: "/faq",     label: tr("faqs") },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </FooterSection>
        </FadeIn>

        {/* Our Products */}
        <FadeIn delay={0.1} className="min-w-0">
          <FooterSection title="Our Products" open={openSection === "products"} onToggle={() => toggle("products")}>
            <ul className="space-y-3 text-sm md:text-base font-medium text-white/75">
              {PRODUCT_CATEGORIES.slice(0, 5).map((c) => (
                <li key={c}>
                  <Link to={`/products?category=${c}`} className="hover:text-white transition-colors">{c}</Link>
                </li>
              ))}
              <li>
                <Link to="/products?category=Gift Hampers" className="hover:text-white transition-colors">Gift Box</Link>
              </li>
            </ul>
          </FooterSection>
        </FadeIn>

        {/* Policy */}
        <FadeIn delay={0.15} className="min-w-0">
          <FooterSection title="Policy" open={openSection === "policy"} onToggle={() => toggle("policy")}>
            <ul className="space-y-3 text-sm md:text-base font-medium text-white/75">
              {[
                { to: "/privacy",  label: tr("privacyPolicy") },
                { to: "/terms",    label: tr("termsConditions") },
                { to: "/returns",  label: tr("returnRefund") },
                { to: "/shipping", label: tr("shippingPolicy") },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </FooterSection>
        </FadeIn>

        {/* Contact Us */}
        <FadeIn delay={0.2} className="col-span-2 md:col-span-1 min-w-0">
          <h4 className="mb-5 uppercase text-base tracking-[2px] font-bold text-white/80">Contact Us</h4>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start text-sm md:text-base font-medium text-white/75 leading-relaxed">
              <MapPin size={14} className="flex-shrink-0 mt-0.5 text-white/40" />
              {contact.address || "41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001"}
            </li>
            <li className="flex gap-3 items-start text-sm md:text-base font-medium text-white/75">
              <Phone size={14} className="flex-shrink-0 mt-0.5 text-white/40" />
              {contact.phone || "+91 75685 77968"}
            </li>
            <li className="flex gap-3 items-start text-sm md:text-base font-medium text-white/75">
              <Mail size={14} className="flex-shrink-0 mt-0.5 text-white/40" />
              {contact.email || "info@jaishreedryfruits.com"}
            </li>
          </ul>
        </FadeIn>
      </div>

      {/* Bottom bar */}
      <div className="py-5 px-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Jai Shree Dryfruits. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
