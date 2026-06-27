import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { en, type Dict, type TKey } from "./i18n/keys";
import { hi } from "./i18n/hi";
import { mr } from "./i18n/mr";
import { ta } from "./i18n/ta";
import { te } from "./i18n/te";
import { kn } from "./i18n/kn";
import { bn } from "./i18n/bn";
import { gu } from "./i18n/gu";
import { ml } from "./i18n/ml";
import { pa } from "./i18n/pa";

export type LangCode = "en" | "hi" | "mr" | "ta" | "te" | "kn" | "bn" | "gu" | "ml" | "pa";

export const LANGUAGES: { code: LangCode; name: string; native: string }[] = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
];

const dictionaries: Record<LangCode, Dict> = { en, hi, mr, ta, te, kn, bn, gu, ml, pa };

const STORAGE_KEY = "pranam:lang";

type Ctx = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: TKey | string, fallback?: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
      if (stored && dictionaries[stored]) setLangState(stored);
    } catch { /* noop */ }
  }, []);

  const setLang = (l: LangCode) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* noop */ }
    if (typeof document !== "undefined") document.documentElement.lang = l;
  };

  const t = (key: TKey | string, fallback?: string) => {
    const dict = dictionaries[lang] as Record<string, string>;
    return dict?.[key] ?? (en as Record<string, string>)[key] ?? fallback ?? key;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "en" as LangCode,
      setLang: () => {},
      t: (k: TKey | string, f?: string) => (en as Record<string, string>)[k] ?? f ?? k,
    };
  }
  return ctx;
}
