import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language codes
export type Language = 'en' | 'pcm' | 'ha' | 'yo' | 'ig';

// Translation type
type Translations = Record<string, any>;

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

// Import translations
const loadTranslations = async (lang: Language): Promise<Translations> => {
  try {
    const module = await import(`../i18n/${lang}.json`);
    return module.default;
  } catch (error) {
    // Fallback to English if language file not found
    const module = await import(`../i18n/en.json`);
    return module.default;
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as Language) || 'en';
  });

  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    loadTranslations(language).then(setTranslations);
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
