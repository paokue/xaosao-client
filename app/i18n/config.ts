import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import lo from './locales/lo.json';
import th from './locales/th.json';
import zh from './locales/zh.json';
import vi from './locales/vi.json';
import ko from './locales/ko.json';

// Initialize i18n without LanguageDetector to avoid hydration issues
// Language will be detected and set on client-side only after mount
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      lo: { translation: lo },
      th: { translation: th },
      zh: { translation: zh },
      vi: { translation: vi },
      ko: { translation: ko },
    },
    lng: 'en', // Always start with English for SSR consistency
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Only detect language on client-side after hydration
if (typeof window !== 'undefined') {
  const storedLanguage = localStorage.getItem('i18nextLng');
  if (storedLanguage && i18n.language !== storedLanguage) {
    i18n.changeLanguage(storedLanguage);
  }
}

export default i18n;