import { useEffect, useState } from 'react'
import { getPet } from '../services/pets'
import type { Pet } from '../types'

export function usePet(id: string) {
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPet(id)
      .then(p => { setPet(p); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [id])

  return { pet, loading, error, setPet }
}
