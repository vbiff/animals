import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePet } from '../hooks/usePet'
import { updatePet } from '../services/pets'
import { uploadFile } from '../services/files'

export function PetEditPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pet, loading } = usePet(id!)
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (!loading && pet && !initialized) {
    setName(pet.name); setSpecies(pet.species); setBreed(pet.breed); setBirthDate(pet.birth_date)
    setInitialized(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let photo_url = pet?.photo_url ?? null
      if (photoFile) photo_url = await uploadFile(id!, 'photos', photoFile)
      await updatePet(id!, { name, species, breed, birth_date: birthDate, photo_url })
      navigate(`/pet/${id}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !pet) return <div className="loading-state">{t('common.loading')}</div>

  return (
    <div className="page-pad form-page">
      <p className="eyebrow">Profile settings</p>
      <h1>{t('pet.edit')}</h1>
      <form onSubmit={handleSubmit} className="form-stack">
        <input placeholder={t('pet.name')} value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder={t('pet.species')} value={species} onChange={e => setSpecies(e.target.value)} required />
        <input placeholder={t('pet.breed')} value={breed} onChange={e => setBreed(e.target.value)} />
        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required />
        <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} />
        <div className="action-row">
          <button className="button-secondary" type="button" onClick={() => navigate(`/pet/${id}`)}>{t('common.cancel')}</button>
          <button type="submit" disabled={saving}>{saving ? t('common.loading') : t('common.save')}</button>
        </div>
      </form>
    </div>
  )
}
