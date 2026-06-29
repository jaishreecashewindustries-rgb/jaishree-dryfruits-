import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, Lock, Truck, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: "linear-gradient(160deg, #0D1B35 0%, #1A2744 40%, #080F1E 100%)" }} className="text-white">

      {/* ── Newsletter — borderless, underline-only ── */}
      <div className="border-b py-14 px-4" style={{ borderColor: "rgba(201,168,76,0.12)", background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[4px] mb-2" style={{ color: "rgba(201,168,76,0.6)" }}>
              Premium Club
            </p>
            <h3 className="font-serif text-xl font-light text-white">Join Our Premium Club</h3>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Exclusive offers, new arrivals &amp; health tips
            </p>
          </div>
          <form
            className="flex items-end gap-6 w-full md:w-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Borderless — only bottom 1px line, no fill */}
            <div className="flex-1 md:w-72 relative">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full bg-transparent text-white text-sm pb-2.5 focus:outline-none transition-colors"
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
              <style>{`input::placeholder{color:rgba(255,255,255,0.28)}`}</style>
            </div>
            <button
              type="submit"
              className="text-[11px] font-bold uppercase tracking-[3px] pb-2.5 transition-colors whitespace-nowrap"
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
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* ── Main footer body ── */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">

        {/* Brand — clean typographic mark, no coloured badge */}
        <div className="col-span-2 md:col-span-1">
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
          <p className="text-sm leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.38)", lineHeight: 1.75 }}>
            Finest quality dry fruits and nuts sourced from the best farms in Kashmir, California and Iran. Delivered fresh to your door since 1999.
          </p>
          <div className="flex gap-3">
            {[
              { href: "https://instagram.com", icon: <Instagram size={14} /> },
              { href: "https://facebook.com",  icon: <Facebook size={14} /> },
              { href: "https://youtube.com",   icon: <Youtube size={14} /> },
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
        </div>

        {/* Quick Links */}
        <div>
          <h4
            className="mb-6 uppercase"
            style={{ color: "rgba(201,168,76,0.7)", fontSize: 9, letterSpacing: "3.5px", fontWeight: 600 }}
          >
            Quick Links
          </h4>
          <ul className="space-y-3.5" style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1 }}>
            {[
              { to: "/",                           label: "Home" },
              { to: "/products",                   label: "All Products" },
              { to: "/products?badge=Best Seller", label: "Best Sellers" },
              { to: "/products?category=Gift Hampers", label: "Gift Hampers" },
              { to: "/blog",                       label: "Our Blog" },
              { to: "/sourcing",                   label: "Sourcing Story" },
              { to: "/about",                      label: "About Us" },
              { to: "/contact",                    label: "Contact Us" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="transition-colors duration-200 hover:translate-x-1 inline-block"
                  style={{ color: "rgba(255,255,255,0.42)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#C9A84C"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.42)"; }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4
            className="mb-6 uppercase"
            style={{ color: "rgba(201,168,76,0.7)", fontSize: 9, letterSpacing: "3.5px", fontWeight: 600 }}
          >
            Support
          </h4>
          <ul className="space-y-3.5" style={{ fontSize: 13, color: "rgba(255,255,255,0.42)" }}>
            {[
              { to: "/faq",      label: "FAQs" },
              { to: "/shipping", label: "Shipping Policy" },
              { to: "/returns",  label: "Return & Refund" },
              { to: "/privacy",  label: "Privacy Policy" },
              { to: "/terms",    label: "Terms & Conditions" },
              { to: "/dashboard",label: "Track Order" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.42)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#C9A84C"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.42)"; }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact — clean coordinate layout */}
        <div>
          <h4
            className="mb-6 uppercase"
            style={{ color: "rgba(201,168,76,0.7)", fontSize: 9, letterSpacing: "3.5px", fontWeight: 600 }}
          >
            Contact
          </h4>
          <ul className="space-y-5">
            <li className="flex gap-3.5 items-start">
              <Phone size={13} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(201,168,76,0.6)" }} />
              <div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>+91 75685 77968</p>
                <p className="mt-0.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>Mon – Sat  ·  9 am – 7 pm</p>
              </div>
            </li>
            <li className="flex gap-3.5 items-start">
              <Mail size={13} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(201,168,76,0.6)" }} />
              <span style={{ color: "rgba(255,255,255,0.42)", fontSize: 13 }}>info@jaishreegryfruits.com</span>
            </li>
            <li className="flex gap-3.5 items-start">
              <MapPin size={13} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(201,168,76,0.6)" }} />
              <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 13, lineHeight: 1.65 }}>
                <p>41, Barah Ji Ki Gali</p>
                <p>Gangauri Bazar</p>
                <p>Jaipur – 302001</p>
              </div>
            </li>
          </ul>
          <a
            href="tel:+917568577968"
            className="mt-6 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 transition-all hover:scale-105"
            style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}
          >
            <Phone size={12} /> Call Us Now
          </a>
        </div>
      </div>

      {/* Gold separator */}
      <div
        className="mx-4 md:mx-auto max-w-7xl h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), rgba(232,201,122,0.5), rgba(201,168,76,0.3), transparent)" }}
      />

      {/* Bottom bar */}
      <div className="py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.04em" }}>
            © {new Date().getFullYear()} Jai Shree Dryfruits. All rights reserved.
          </p>
          <div className="flex gap-6 flex-wrap justify-center">
            <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>
              <Lock size={10} style={{ color: "rgba(201,168,76,0.5)" }} /> Secure Payments
            </span>
            <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>
              <Truck size={10} style={{ color: "rgba(201,168,76,0.5)" }} /> Free Shipping ₹499+
            </span>
            <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>
              <ShieldCheck size={10} style={{ color: "rgba(201,168,76,0.5)" }} /> 100% Authentic
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
