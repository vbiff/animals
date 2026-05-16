import { useEffect, useState, useCallback } from 'react'
import { getPets } from '../services/pets'
import type { Pet } from '../types'

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setPets(await getPets())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { pets, loading, error, refresh }
}
