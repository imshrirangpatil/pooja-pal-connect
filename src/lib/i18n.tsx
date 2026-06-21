import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

type Dict = Record<string, string>;

const en: Dict = {
  "profile.title": "Profile",
  "profile.bookings": "Bookings",
  "profile.wallet": "Wallet",
  "profile.saved": "Saved",
  "profile.admin": "Admin Dashboard",
  "profile.orders": "My Orders",
  "profile.addresses": "Saved Addresses",
  "profile.walletCredits": "Wallet & Credits",
  "profile.savedPandits": "Saved Pandits",
  "profile.refer": "Refer & Earn ₹100",
  "profile.notifications": "Notifications",
  "profile.language": "Language",
  "profile.support": "Help & Support",
  "profile.terms": "Terms & Privacy",
  "profile.becomePartner": "Become a partner",
  "profile.partnerCta": "Are you a pandit or astrologer?",
  "profile.partnerSub": "Apply to join Pranam's verified network.",
  "profile.applyNow": "Apply now",
  "profile.logout": "Log out",
  "common.back": "Back",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.remove": "Remove",
  "saved.title": "Saved Pandits",
  "saved.empty": "No saved pandits yet",
  "saved.emptySub": "Tap the heart on any pandit profile to save them for later.",
  "saved.browse": "Browse pandits",
  "language.title": "App Language",
  "language.sub": "Choose your preferred language",
  "language.saved": "Language updated",
  "terms.title": "Terms & Privacy",
};

const hi: Dict = {
  "profile.title": "प्रोफ़ाइल",
  "profile.bookings": "बुकिंग्स",
  "profile.wallet": "वॉलेट",
  "profile.saved": "बचत",
  "profile.admin": "एडमिन डैशबोर्ड",
  "profile.orders": "मेरे ऑर्डर",
  "profile.addresses": "सहेजे गए पते",
  "profile.walletCredits": "वॉलेट और क्रेडिट",
  "profile.savedPandits": "सहेजे गए पंडित",
  "profile.refer": "रेफ़र करें, ₹100 कमाएँ",
  "profile.notifications": "सूचनाएँ",
  "profile.language": "भाषा",
  "profile.support": "सहायता",
  "profile.terms": "नियम एवं गोपनीयता",
  "profile.becomePartner": "पार्टनर बनें",
  "profile.partnerCta": "क्या आप पंडित या ज्योतिषी हैं?",
  "profile.partnerSub": "Pranam के सत्यापित नेटवर्क से जुड़ें।",
  "profile.applyNow": "आवेदन करें",
  "profile.logout": "लॉग आउट",
  "common.back": "वापस",
  "common.save": "सहेजें",
  "common.cancel": "रद्द करें",
  "common.remove": "हटाएँ",
  "saved.title": "सहेजे गए पंडित",
  "saved.empty": "अभी तक कोई पंडित सहेजा नहीं गया",
  "saved.emptySub": "किसी भी पंडित प्रोफ़ाइल पर ❤ दबाकर उन्हें सहेजें।",
  "saved.browse": "पंडित देखें",
  "language.title": "ऐप भाषा",
  "language.sub": "अपनी पसंदीदा भाषा चुनें",
  "language.saved": "भाषा अपडेट हो गई",
  "terms.title": "नियम और गोपनीयता",
};

// Light fallbacks for other languages: native key labels (real translations can be added later).
const partial: Record<LangCode, Dict> = {
  en,
  hi,
  mr: { ...en, "profile.title": "प्रोफाइल", "profile.language": "भाषा", "profile.savedPandits": "जतन केलेले पंडित", "language.title": "अ‍ॅप भाषा" },
  ta: { ...en, "profile.title": "சுயவிவரம்", "profile.language": "மொழி", "profile.savedPandits": "சேமித்த பண்டிட்கள்", "language.title": "ஆப் மொழி" },
  te: { ...en, "profile.title": "ప్రొఫైల్", "profile.language": "భాష", "profile.savedPandits": "సేవ్ చేసిన పండిట్లు", "language.title": "యాప్ భాష" },
  kn: { ...en, "profile.title": "ಪ್ರೊಫೈಲ್", "profile.language": "ಭಾಷೆ", "profile.savedPandits": "ಉಳಿಸಿದ ಪಂಡಿತರು", "language.title": "ಆ್ಯಪ್ ಭಾಷೆ" },
  bn: { ...en, "profile.title": "প্রোফাইল", "profile.language": "ভাষা", "profile.savedPandits": "সংরক্ষিত পণ্ডিতরা", "language.title": "অ্যাপ ভাষা" },
  gu: { ...en, "profile.title": "પ્રોફાઇલ", "profile.language": "ભાષા", "profile.savedPandits": "સેવ કરેલા પંડિતો", "language.title": "ઍપ ભાષા" },
  ml: { ...en, "profile.title": "പ്രൊഫൈൽ", "profile.language": "ഭാഷ", "profile.savedPandits": "സേവ് ചെയ്ത പണ്ഡിറ്റർമാർ", "language.title": "ആപ്പ് ഭാഷ" },
  pa: { ...en, "profile.title": "ਪ੍ਰੋਫਾਈਲ", "profile.language": "ਭਾਸ਼ਾ", "profile.savedPandits": "ਸੰਭਾਲੇ ਪੰਡਿਤ", "language.title": "ਐਪ ਭਾਸ਼ਾ" },
};

const STORAGE_KEY = "pranam:lang";

type Ctx = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
      if (stored && partial[stored]) setLangState(stored);
    } catch { /* noop */ }
  }, []);

  const setLang = (l: LangCode) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* noop */ }
    if (typeof document !== "undefined") document.documentElement.lang = l;
  };

  const t = (key: string, fallback?: string) => {
    return partial[lang]?.[key] ?? en[key] ?? fallback ?? key;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) return { lang: "en" as LangCode, setLang: () => {}, t: (k: string, f?: string) => en[k] ?? f ?? k };
  return ctx;
}
