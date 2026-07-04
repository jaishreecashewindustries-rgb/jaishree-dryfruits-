import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import T, { LANGUAGES } from "./utils/translations";

// The language switcher UI has been removed (site is English-only by
// decision — translating only isolated UI strings while product names,
// descriptions, reviews, and blog content stayed English-only felt more
// broken than helpful, and full coverage wasn't worth the ongoing
// maintenance for this site). i18next itself stays wired up rather than
// ripping out every tr() call site — it's harmless, and lng is hardcoded
// to "en" (ignoring any language a returning visitor previously picked)
// so the site is consistently English for everyone.
const resources = Object.fromEntries(
  Object.entries(T).map(([lang, strings]) => [lang, { translation: strings }])
);

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
    prefix: "{",
    suffix: "}",
  },
  react: { useSuspense: false },
});

export { LANGUAGES };
export default i18n;
