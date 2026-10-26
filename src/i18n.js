import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en.json';
import bnTranslation from './locales/bn.json';
import hiTranslation from './locales/hi.json';

const resources = {
    en: { translation: enTranslation },
    bn: { translation: bnTranslation },
    hi: { translation: hiTranslation }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        debug: false,
        interpolation: {
            escapeValue: false // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'appLanguage',
            caches: ['localStorage']
        }
    });

export default i18n;

// Helper function to change language programmatically
export const changeLanguage = (langCode) => {
    // Map full locale codes to simple codes
    const langMap = {
        'en-US': 'en',
        'en-GB': 'en',
        'en-IN': 'en',
        'en-AU': 'en',
        'hi-IN': 'hi',
        'bn-IN': 'bn',
        'ta-IN': 'en', // Fallback to English if not available
        'te-IN': 'en',
        'mr-IN': 'en',
        'es-ES': 'en',
        'fr-FR': 'en',
        'de-DE': 'en',
        'it-IT': 'en',
        'pt-BR': 'en',
        'zh-CN': 'en',
        'ja-JP': 'en',
        'ko-KR': 'en',
        'ar-SA': 'en'
    };

    const simpleLang = langMap[langCode] || langCode.split('-')[0] || 'en';
    localStorage.setItem('appLanguage', simpleLang);
    i18n.changeLanguage(simpleLang);
};
