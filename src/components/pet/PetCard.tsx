import { Link } from 'react-router-dom'
import type { Pet } from '../../types'

interface Props { pet: Pet }

export function PetCard({ pet }: Props) {
  return (
    <Link to={`/pet/${pet.id}`} className="pet-card">
      {pet.photo_url
        ? <img className="pet-card__image" src={pet.photo_url} alt={pet.name} />
        : <div className="pet-card__placeholder" aria-hidden="true" />}
      <h3>{pet.name}</h3>
      <p>{pet.species} · {pet.breed}</p>
    </Link>
  )
}
