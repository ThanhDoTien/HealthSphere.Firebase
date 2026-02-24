'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import en from '@/locales/en.json';
import vi from '@/locales/vi.json';

type Locale = 'en' | 'vi';

const translations = { en, vi };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'vi')) {
      setLocale(savedLocale);
    }
  }, []);

  const setLocaleAndSave = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string, params?: { [key: string]: string | number }): string => {
    const currentLocaleFile = translations[locale] as { [key: string]: string };
    const fallbackLocaleFile = translations['en'] as { [key: string]: string };

    let translatedText = currentLocaleFile[key] || fallbackLocaleFile[key];

    // If still not found, return the key itself.
    if (translatedText === undefined) {
        console.warn(`Translation key "${key}" not found for locale "${locale}".`);
        return key;
    }
    
    // Replace placeholders if params are provided.
    if (params) {
        translatedText = Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
            return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        }, translatedText);
    }

    return translatedText;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale: setLocaleAndSave, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
