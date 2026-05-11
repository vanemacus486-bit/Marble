import type enUS from './locales/en-US.json'

export type TranslationKey = keyof typeof enUS

export type NestedTranslationKey = {
  [K in keyof typeof enUS]: typeof enUS[K] extends string ? K : never
}[keyof typeof enUS]

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof enUS
    }
  }
}
