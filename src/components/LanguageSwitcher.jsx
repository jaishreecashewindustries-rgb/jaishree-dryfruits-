import React, { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "hi", label: "हि", name: "हिंदी" },
  { code: "mr", label: "म", name: "मराठी" },
  { code: "gu", label: "ગુ", name: "ગુજરાતી" },
  { code: "pa", label: "ਪੰ", name: "ਪੰਜਾਬੀ" },
  { code: "bn", label: "বা", name: "বাংলা" },
  { code: "ta", label: "த", name: "தமிழ்" },
  { code: "te", label: "తె", name: "తెలుగు" },
];

function triggerGoogleTranslate(langCode) {
  try { localStorage.setItem("jsd_lang", langCode); } catch {}

  if (langCode === "en") {
    // Remove translate cookies and reload to restore English
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    window.location.reload();
    return;
  }

  // Set Google Translate cookie
  document.cookie = `googtrans=/en/${langCode}; path=/`;
  document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;

  // Try select element approach first
  const trySelect = () => {
    const select = document.querySelector(".goog-te-combo") ||
      document.querySelector("#google_translate_element select");
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
      return true;
    }
    return false;
  };

  if (!trySelect()) {
    setTimeout(() => {
      if (!trySelect()) {
        // Widget not loaded yet — reload with cookie set (reliable fallback)
        window.location.reload();
      }
    }, 1000);
  }
}

export default function LanguageSwitcher({ mobile = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [activeLang, setActiveLang] = useState(() => {
    try { return localStorage.getItem("jsd_lang") || "en"; } catch { return "en"; }
  });

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (code) => {
    setActiveLang(code);
    setOpen(false);
    triggerGoogleTranslate(code);
  };

  const current = LANGUAGES.find((l) => l.code === activeLang) || LANGUAGES[0];

  // Mobile: horizontal chips
  if (mobile) {
    return (
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeLang === l.code
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
              style={{ color: activeLang === l.code ? "#E8C97A" : "rgba(255,255,255,0.7)" }}
            >
              <span className="font-bold text-xs w-6">{l.label}</span>
              <span className="text-sm">{l.name}</span>
              {activeLang === l.code && <span className="ml-auto text-brand-gold text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
