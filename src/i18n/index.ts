import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Language } from '../types'

const STORAGE_KEY = 'vet-card-lang'

function detectLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null
  if (stored && ['pt', 'en', 'ru'].includes(stored)) return stored
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('pt')) return 'pt'
  if (nav.startsWith('ru')) return 'ru'
  return 'en'
}

i18n.use(initReactI18next).init({
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  resources: {},
})

const bundles: Record<Language, () => Promise<{ default: object }>> = {
  en: () => import('./en.json'),
  pt: () => import('./pt.json'),
  ru: () => import('./ru.json'),
}

async function loadLanguage(lang: Language): Promise<void> {
  if (i18n.hasResourceBundle(lang, 'translation')) return
  const { default: bundle } = await bundles[lang]()
  i18n.addResourceBundle(lang, 'translation', bundle)
}

export async function changeLanguage(lang: Language): Promise<void> {
  await loadLanguage(lang)
  await i18n.changeLanguage(lang)
  localStorage.setItem(STORAGE_KEY, lang)
}

loadLanguage(detectLanguage())

export default i18n
