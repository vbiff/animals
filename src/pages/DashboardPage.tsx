import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePets } from '../hooks/usePets'
import { PetCard } from '../components/pet/PetCard'
import { AddPetModal } from '../components/pet/AddPetModal'

export function DashboardPage() {
  const { t } = useTranslation()
  const { pets, loading, error, refresh } = usePets()
  const [showAdd, setShowAdd] = useState(false)

  if (loading) return <div>{t('common.loading')}</div>
  if (error) return <div>{error}</div>

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('dashboard.my_pets')}</h1>
        <button onClick={() => setShowAdd(true)}>{t('dashboard.add_pet')}</button>
      </div>

      {pets.length === 0
        ? <p>{t('dashboard.no_pets')}</p>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
            {pets.map(pet => <PetCard key={pet.id} pet={pet} />)}
          </div>
      }

      {showAdd && <AddPetModal onClose={() => setShowAdd(false)} onCreated={refresh} />}
    </div>
  )
}
