import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { acceptInvite } from '../services/invites'
import { signInWithGoogle } from '../services/auth'

export function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!user || loading) return
    setStatus('accepting')
    acceptInvite(token!)
      .then(petId => navigate(`/pet/${petId}`))
      .catch(e => { setErrorMsg(e.message); setStatus('error') })
  }, [user, loading, token, navigate])

  if (loading) return <div className="loading-state">{t('common.loading')}</div>

  if (!user) {
    return (
      <div className="screen-center">
        <div className="modal-panel modal-panel--center">
          <p>{t('invite.accept')}</p>
        <button onClick={() => signInWithGoogle().catch(console.error)}>{t('auth.sign_in_with_google')}</button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="screen-center">
        <div className="modal-panel modal-panel--center">
        <p>{errorMsg || t('invite.invalid')}</p>
        <button onClick={() => navigate('/dashboard')}>{t('dashboard.my_pets')}</button>
        </div>
      </div>
    )
  }

  return <div className="loading-state">{t('common.loading')}</div>
}
