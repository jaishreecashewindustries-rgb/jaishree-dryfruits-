import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, MessageCircle, Lock, Truck, ShieldCheck } from "lucide-react";
import { WHATSAPP_NUMBER } from "../utils/helpers";

export default function Footer() {
  return (
    <footer style={{ background: "linear-gradient(160deg, #0D1B35 0%, #1A2744 40%, #080F1E 100%)" }} className="text-white">

      {/* Newsletter */}
      <div className="border-b border-brand-gold/15 py-10 px-4" style={{ background: "linear-gradient(90deg, rgba(201,168,76,0.06) 0%, transparent 50%, rgba(201,168,76,0.06) 100%)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-xl font-bold shimmer-gold">Join Our Premium Club</h3>
            <p className="text-white/60 text-sm mt-1">Exclusive offers, new arrivals and health tips</p>
          </div>
          <form className="flex gap-2 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 md:w-72 px-4 py-2.5 rounded-lg bg-white/8 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-brand-gold text-sm transition-colors"
            />
            <button type="submit" className="text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #2C4B8C 0%, #1A2744 100%)", boxShadow: "0 4px 16px rgba(26,39,68,0.4)", border: "1px solid rgba(201,168,76,0.3)" }}>
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">

        {/* Brand — with real logo */}
        <div className="col-span-2 md:col-span-1">
          <img src="/logo.png" alt="Jai Shree Dry Fruits" className="h-14 w-auto mb-4 drop-shadow-lg" />
          <p className="text-white/55 text-sm leading-relaxed mb-5">
            Finest quality dry fruits and nuts sourced from the best farms in Kashmir, California and Iran. Delivered fresh to your door.
          </p>
          <div className="flex gap-2.5">
            {[
              { href: "https://instagram.com", icon: <Instagram size={15} /> },
              { href: "https://facebook.com", icon: <Facebook size={15} /> },
              { href: "https://youtube.com", icon: <Youtube size={15} /> },
              { href: `https://wa.me/${WHATSAPP_NUMBER}`, icon: <MessageCircle size={15} />, green: true },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ background: s.green ? "linear-gradient(135deg, #25D366, #128C7E)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => { if (!s.green) e.currentTarget.style.background = "linear-gradient(135deg, #E8C97A, #C9A84C)"; }}
                onMouseLeave={e => { if (!s.green) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-brand-gold mb-4 uppercase text-xs tracking-widest">Quick Links</h4>
          <ul className="space-y-2.5 text-sm text-white/55">
            {[
              { to: "/", label: "Home" },
              { to: "/products", label: "All Products" },
              { to: "/products?badge=Best Seller", label: "Best Sellers" },
              { to: "/products?category=Gift Hampers", label: "Gift Hampers" },
              { to: "/blog", label: "Our Blog" },
              { to: "/sourcing", label: "Sourcing Story" },
              { to: "/about", label: "About Us" },
              { to: "/contact", label: "Contact Us" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-brand-gold transition-colors hover:translate-x-1 inline-block transition-transform duration-200">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold text-brand-gold mb-4 uppercase text-xs tracking-widest">Support</h4>
          <ul className="space-y-2.5 text-sm text-white/55">
            {[
              { to: "/faq", label: "FAQs" },
              { to: "/shipping", label: "Shipping Policy" },
              { to: "/returns", label: "Return & Refund" },
              { to: "/privacy", label: "Privacy Policy" },
              { to: "/terms", label: "Terms & Conditions" },
              { to: "/dashboard", label: "Track Order" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-brand-gold transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-brand-gold mb-4 uppercase text-xs tracking-widest">Contact</h4>
          <ul className="space-y-3 text-sm text-white/55">
            <li className="flex gap-3">
              <Phone size={15} className="text-brand-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white/80">+91 75685 77968</p>
                <p className="text-xs text-white/35">Mon–Sat, 9am–7pm</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Mail size={15} className="text-brand-gold flex-shrink-0 mt-0.5" />
              <span>info@jaishreegryfruits.com</span>
            </li>
            <li className="flex gap-3">
              <MapPin size={15} className="text-brand-gold flex-shrink-0 mt-0.5" />
              <span>41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001</span>
            </li>
          </ul>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I need help with my order.")}`}
            target="_blank" rel="noreferrer"
            className="mt-4 flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all hover:scale-105 w-fit"
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", boxShadow: "0 4px 12px rgba(37,211,102,0.25)" }}
          >
            <MessageCircle size={13} /> Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* Gold separator */}
      <div className="mx-4 md:mx-auto max-w-7xl h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), rgba(232,201,122,0.6), rgba(201,168,76,0.4), transparent)" }} />

      {/* Bottom bar */}
      <div className="py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <p>© {new Date().getFullYear()} Jai Shree Dryfruits. All rights reserved.</p>
          <div className="flex gap-5 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 text-white/50"><Lock size={11} className="text-brand-gold" /> Secure Payments</span>
            <span className="flex items-center gap-1.5 text-white/50"><Truck size={11} className="text-brand-gold" /> Free Shipping ₹499+</span>
            <span className="flex items-center gap-1.5 text-white/50"><ShieldCheck size={11} className="text-brand-gold" /> 100% Authentic</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
