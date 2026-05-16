import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPet } from '../../services/pets'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function AddPetModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createPet({ name, species, breed, birth_date: birthDate })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 8, padding: 24, width: 400 }}>
        <h2>{t('dashboard.add_pet')}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder={t('pet.name')} value={name} onChange={e => setName(e.target.value)} required />
          <input placeholder={t('pet.species')} value={species} onChange={e => setSpecies(e.target.value)} required />
          <input placeholder={t('pet.breed')} value={breed} onChange={e => setBreed(e.target.value)} />
          <input type="date" placeholder={t('pet.birth_date')} value={birthDate} onChange={e => setBirthDate(e.target.value)} required />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" disabled={submitting}>{t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
