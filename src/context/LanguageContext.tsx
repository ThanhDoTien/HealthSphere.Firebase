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
    const keys = key.split('.');
    let result: any = translations[locale];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if translation is missing
        let fallbackResult: any = translations['en'];
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
        }
        if (fallbackResult === undefined) {
            return key; // Return key if not found in English either
        }
        result = fallbackResult;
        break;
      }
    }
    
    if (typeof result === 'string' && params) {
        return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
            return acc.replace(`{${paramKey}}`, String(paramValue));
        }, result);
    }

    return result || key;
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
