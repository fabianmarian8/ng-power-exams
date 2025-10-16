import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enTranslations from '../i18n/en.json';
import pcmTranslations from '../i18n/pcm.json';
import haTranslations from '../i18n/ha.json';
import yoTranslations from '../i18n/yo.json';
import igTranslations from '../i18n/ig.json';

// Language codes
export type Language = 'en' | 'pcm' | 'ha' | 'yo' | 'ig';

// Translation type
type Translations = Record<string, any>;

// Translation map
const translationsMap: Record<Language, Translations> = {
  en: enTranslations,
  pcm: pcmTranslations,
  ha: haTranslations,
  yo: yoTranslations,
  ig: igTranslations,
};

// Supported languages metadata
export const LANGUAGES = [
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'pcm' as const, name: 'Nigerian Pidgin', flag: '🇳🇬' },
  { code: 'ha' as const, name: 'Hausa', flag: '🇳🇬' },
  { code: 'yo' as const, name: 'Yoruba', flag: '🇳🇬' },
  { code: 'ig' as const, name: 'Igbo', flag: '🇳🇬' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'naijainfo_lang';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as Language) || 'en';
  });

  const [translations, setTranslations] = useState<Translations>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const lang = (saved as Language) || 'en';
    return translationsMap[lang];
  });

  useEffect(() => {
    setTranslations(translationsMap[language]);
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        if (fallback !== undefined) {
          return fallback;
        }
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : (fallback ?? key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
