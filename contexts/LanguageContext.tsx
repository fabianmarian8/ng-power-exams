
import React, { createContext, useState, useContext, useMemo, ReactNode } from 'react';
import { Language } from '../types';
import { LANGUAGES } from '../constants';
import { translations } from '../translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  texts: typeof translations.en;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(LANGUAGES[0]); // Default to English

  const texts = useMemo(() => {
    return translations[language.code as keyof typeof translations] || translations.en;
  }, [language]);

  const value = {
    language,
    setLanguage,
    texts,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
