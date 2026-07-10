// yss_orbit\frontend\src\core\i18n\i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json' with { type: 'json' };
import esTranslations from './locales/es.json' with { type: 'json' };
import frTranslations from './locales/fr.json' with { type: 'json' };
import teTranslations from './locales/te.json' with { type: 'json' };
import hiTranslations from './locales/hi.json' with { type: 'json' };

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  te: { translation: teTranslations },
  hi: { translation: hiTranslations },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
