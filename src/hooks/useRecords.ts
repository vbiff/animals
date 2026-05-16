import { useEffect, useState, useCallback } from 'react'
import { getRecords } from '../services/records'
import type { Vaccine, Symptom, Medication, Document } from '../types'

interface Records { vaccines: Vaccine[]; symptoms: Symptom[]; medications: Medication[]; documents: Document[] }

export function useRecords(petId: string) {
  const [records, setRecords] = useState<Records>({ vaccines: [], symptoms: [], medications: [], documents: [] })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setRecords(await getRecords(petId)) } finally { setLoading(false) }
  }, [petId])

  useEffect(() => { refresh() }, [refresh])

  return { records, loading, refresh }
}
