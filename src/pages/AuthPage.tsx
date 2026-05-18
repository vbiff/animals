import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { signInWithGoogle } from '../services/auth'

export function AuthPage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  if (loading) return null

  return (
    <div className="editorial-hero">
      <p className="eyebrow">Animal health archive</p>
      <h1 className="display-title">{t('auth.welcome')}</h1>
      <p className="lead">{t('auth.tagline')}</p>
      <button onClick={() => signInWithGoogle().catch(console.error)}>
        {t('auth.sign_in_with_google')}
      </button>
    </div>
  )
}
