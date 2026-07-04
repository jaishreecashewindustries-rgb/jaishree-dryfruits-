import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import T, { LANGUAGES } from "./utils/translations";

// Swapped in to replace the old Google Translate widget, which injected a
// third-party script that kept making background network requests forever
// (the actual cause of the site's "No network idle period" GSC/Lighthouse
// failures — see the earlier fix removing it entirely) and had no real
// control over layout/quality. This is the same approach used by most
// professional React storefronts: translated strings shipped with the app
// itself, applied instantly client-side, zero network calls, zero risk of
// blocking anything else on the page.
//
// Resources are built from utils/translations.js's existing dictionary — one
// source of truth, so nothing has to be duplicated into separate JSON files.
const resources = Object.fromEntries(
  Object.entries(T).map(([lang, strings]) => [lang, { translation: strings }])
);

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("lang") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes — avoids double-escaping
    prefix: "{",
    suffix: "}", // matches the existing {n}-style placeholders already used throughout the dictionary
  },
  react: { useSuspense: false },
});

export { LANGUAGES };
export default i18n;
