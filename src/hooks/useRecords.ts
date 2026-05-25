import { useEffect, useState, useCallback } from 'react'
import { getRecords } from '../services/records'
import { getTreatNotes } from '../services/treatNotes'
import type { Vaccine, Symptom, Medication, Document, TreatNote } from '../types'

interface Records {
  vaccines: Vaccine[]
  symptoms: Symptom[]
  medications: Medication[]
  documents: Document[]
  treatNotes: TreatNote[]
}

export function useRecords(petId: string) {
  const [records, setRecords] = useState<Records>({
    vaccines: [], symptoms: [], medications: [], documents: [], treatNotes: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [base, treatNotes] = await Promise.all([getRecords(petId), getTreatNotes(petId)])
      setRecords({ ...base, treatNotes })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [petId])

  useEffect(() => { refresh() }, [refresh])

  return { records, loading, error, refresh }
}
