import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Language } from '../types'
import en from './en.json'
import pt from './pt.json'
import ru from './ru.json'

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
  resources: {
    en: { translation: en },
    pt: { translation: pt },
    ru: { translation: ru },
  },
})

export async function changeLanguage(lang: Language): Promise<void> {
  await i18n.changeLanguage(lang)
  localStorage.setItem(STORAGE_KEY, lang)
}

export default i18n
