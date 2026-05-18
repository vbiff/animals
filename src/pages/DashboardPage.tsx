import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePets } from '../hooks/usePets'
import { PetCard } from '../components/pet/PetCard'
import { AddPetModal } from '../components/pet/AddPetModal'
import { signOut } from '../services/auth'

export function DashboardPage() {
  const { t } = useTranslation()
  const { pets, loading, error, refresh } = usePets()
  const [showAdd, setShowAdd] = useState(false)

  if (loading) return <div className="loading-state">{t('common.loading')}</div>
  if (error) return <div className="loading-state error-text">{error}</div>

  return (
    <div className="page-pad">
      <div className="topbar">
        <div>
          <p className="eyebrow">Private profiles</p>
          <h1>{t('dashboard.my_pets')}</h1>
        </div>
        <div className="action-row">
          <button onClick={() => setShowAdd(true)}>{t('dashboard.add_pet')}</button>
          <button className="button-secondary" onClick={() => signOut().catch(console.error)}>{t('auth.sign_out')}</button>
        </div>
      </div>

      {pets.length === 0
        ? <p className="lead empty-state">{t('dashboard.no_pets')}</p>
        : <div className="pet-grid">
            {pets.map(pet => <PetCard key={pet.id} pet={pet} />)}
          </div>
      }

      {showAdd && <AddPetModal onClose={() => setShowAdd(false)} onCreated={refresh} />}
    </div>
  )
}
