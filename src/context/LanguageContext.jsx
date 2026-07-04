import React, { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";

// Thin wrapper around react-i18next — kept so every existing call site
// (useLanguage().tr("key") / .lang / .setLanguage()) keeps working unchanged
// after the underlying engine swap from a hand-rolled dictionary lookup to
// i18next (see src/i18n.js for why).
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { t, i18n } = useTranslation();

  const setLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("lang", code);
  };

  const tr = (key, vars) => t(key, vars);

  return (
    <LanguageContext.Provider value={{ lang: i18n.language, setLanguage, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
