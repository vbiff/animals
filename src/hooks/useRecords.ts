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

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [base, treatNotes] = await Promise.all([getRecords(petId), getTreatNotes(petId)])
      setRecords({ ...base, treatNotes })
    } finally { setLoading(false) }
  }, [petId])

  useEffect(() => { refresh() }, [refresh])

  return { records, loading, refresh }
}
