import { Link } from 'react-router-dom'
import type { Pet } from '../../types'

interface Props { pet: Pet }

export function PetCard({ pet }: Props) {
  return (
    <Link to={`/pet/${pet.id}`} style={{ display: 'block', border: '1px solid #ccc', borderRadius: 8, padding: 16, textDecoration: 'none', color: 'inherit' }}>
      {pet.photo_url && <img src={pet.photo_url} alt={pet.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />}
      <h3>{pet.name}</h3>
      <p>{pet.species} · {pet.breed}</p>
    </Link>
  )
}
