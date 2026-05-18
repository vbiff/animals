import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Pet } from '../../types'

interface Props { pet: Pet; onOpenForVet: () => void; onInvite: () => void }

export function PetHeader({ pet, onOpenForVet, onInvite }: Props) {
  const { t } = useTranslation()
  return (
    <div className="pet-header">
      {pet.photo_url
        ? <img className="pet-portrait" src={pet.photo_url} alt={pet.name} />
        : <div className="pet-portrait-placeholder" aria-hidden="true" />}
      <div className="pet-title">
        <Link className="back-link" to="/dashboard">{t('common.back')}</Link>
        <p className="eyebrow">Health profile</p>
        <h1>{pet.name}</h1>
        <p className="muted">{pet.species} · {pet.breed}</p>
      </div>
      <div className="action-row">
        <Link className="button-link button-secondary" to={`/pet/${pet.id}/edit`}>{t('pet.edit')}</Link>
        <button onClick={onOpenForVet}>{t('pet.open_for_vet')}</button>
        <button className="button-secondary" onClick={onInvite}>{t('pet.invite_co_owner')}</button>
      </div>
    </div>
  )
}
