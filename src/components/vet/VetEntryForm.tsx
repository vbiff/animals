import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props { onIdentify: (name: string, license: string) => Promise<void> }

export function VetEntryForm({ onIdentify }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [license, setLicense] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await onIdentify(name, license)
    setSubmitting(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
      <h2>{t('vet.identify')}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
        <input placeholder={t('vet.enter_name')} value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder={t('vet.enter_license')} value={license} onChange={e => setLicense(e.target.value)} required />
        <button type="submit" disabled={submitting}>{submitting ? t('common.loading') : t('vet.identify')}</button>
      </form>
    </div>
  )
}
