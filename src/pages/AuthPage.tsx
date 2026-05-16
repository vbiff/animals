import { useTranslation } from 'react-i18next'
import { signInWithGoogle } from '../services/auth'

export function AuthPage() {
  const { t } = useTranslation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <h1>{t('auth.welcome')}</h1>
      <p>{t('auth.tagline')}</p>
      <button onClick={() => signInWithGoogle().catch(console.error)}>
        {t('auth.sign_in_with_google')}
      </button>
    </div>
  )
}
