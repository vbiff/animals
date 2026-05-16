import { useTranslation } from 'react-i18next'
import { changeLanguage } from '../../i18n'
import type { Language } from '../../types'

const LANGS: { code: Language; label: string }[] = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          style={{ fontWeight: i18n.language === code ? 'bold' : 'normal', padding: '4px 8px' }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
