import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Pet } from '../../types'

interface Props { pet: Pet; onOpenForVet: () => void; onInvite: () => void }

export function PetHeader({ pet, onOpenForVet, onInvite }: Props) {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 24 }}>
      {pet.photo_url && <img src={pet.photo_url} alt={pet.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />}
      <div>
        <h1>{pet.name}</h1>
        <p>{pet.species} · {pet.breed}</p>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <Link to={`/pet/${pet.id}/edit`}>{t('pet.edit')}</Link>
        <button onClick={onOpenForVet}>{t('pet.open_for_vet')}</button>
        <button onClick={onInvite}>{t('pet.invite_co_owner')}</button>
      </div>
    </div>
  )
}
