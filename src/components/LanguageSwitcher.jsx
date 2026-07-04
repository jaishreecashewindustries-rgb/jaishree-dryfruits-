import React, { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { LANGUAGES } from "../utils/translations";

// Used to drive Google Translate via cookies + a full page reload — broken
// ever since the Google Translate widget itself was removed (it kept the
// network busy forever in the background, which was the actual cause of
// "No network idle period" failures on every page). Now wired to the app's
// own i18next-backed LanguageContext instead: instant, no reload, no
// external script, and it actually still works.
export default function LanguageSwitcher({ mobile = false }) {
  const { lang, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (code) => {
    setLanguage(code);
    setOpen(false);
  };

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  // Mobile: horizontal chips
  if (mobile) {
    return (
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              lang === l.code
                ? "bg-brand-brown text-white border-brand-brown"
                : "border-gray-200 text-gray-600 hover:border-brand-gold hover:text-brand-gold"
            }`}
          >
            {l.label} <span className="opacity-60 font-normal ml-0.5">{l.name}</span>
          </button>
        ))}
      </div>
    );
  }

  // Desktop: dropdown
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
        style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C" }}
      >
        <Globe size={13} />
        <span>{current.label}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: "#1A2744", border: "1px solid rgba(201,168,76,0.2)", minWidth: 160 }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => handleSelect(l.code)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/5"
              style={{ color: lang === l.code ? "#E8C97A" : "rgba(255,255,255,0.7)" }}
            >
              <span className="font-bold text-xs w-6">{l.label}</span>
              <span className="text-sm">{l.name}</span>
              {lang === l.code && <span className="ml-auto text-brand-gold text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
