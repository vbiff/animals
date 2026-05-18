import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { createVetSession } from '../../services/vetSessions'
import { createInvite } from '../../services/invites'

interface VetSessionModalProps { petId: string; onClose: () => void }
interface InviteModalProps { petId: string; onClose: () => void }

export function VetSessionModal({ petId, onClose }: VetSessionModalProps) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const session = await createVetSession(petId)
    setUrl(`${window.location.origin}/vet/${session.token}`)
    setLoading(false)
  }

  if (!url) {
    return (
      <ModalWrapper onClose={onClose}>
        <h2>{t('pet.open_for_vet')}</h2>
        <button onClick={generate} disabled={loading}>{loading ? t('common.loading') : t('pet.open_for_vet')}</button>
      </ModalWrapper>
    )
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2>{t('pet.open_for_vet')}</h2>
      <QRCode value={url} size={200} />
      <p className="record-meta url-text">{url}</p>
      <button onClick={() => navigator.clipboard.writeText(url)}>{t('invite.copy_link')}</button>
    </ModalWrapper>
  )
}

export function InviteModal({ petId, onClose }: InviteModalProps) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    const invite = await createInvite(petId)
    setUrl(`${window.location.origin}/invite/${invite.token}`)
  }

  async function copy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2>{t('pet.invite_co_owner')}</h2>
      {!url
        ? <button onClick={generate}>{t('invite.copy_link')}</button>
        : <>
            <input readOnly value={url} />
            <button onClick={copy}>{copied ? t('invite.copied') : t('invite.copy_link')}</button>
          </>
      }
    </ModalWrapper>
  )
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-panel modal-panel--center">
        {children}
        <button className="button-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
