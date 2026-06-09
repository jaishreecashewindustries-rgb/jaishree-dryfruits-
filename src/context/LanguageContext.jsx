import React, { createContext, useContext, useState } from "react";
import { t } from "../utils/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");

  const setLanguage = (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
  };

  const tr = (key, vars) => t(lang, key, vars);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
