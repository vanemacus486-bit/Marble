import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'

const SUPPORTED_LANGUAGES = ['en-US', 'zh-CN'] as const
export type SupportedLocale = (typeof SUPPORTED_LANGUAGES)[number]

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LANGUAGES.includes(locale as SupportedLocale)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: enUS },
      'zh-CN': { translation: zhCN },
    },
    fallbackLng: 'en-US',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18n
