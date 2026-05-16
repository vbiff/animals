import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { VetEntryForm } from '../components/vet/VetEntryForm'
import { VetAddRecordForm } from '../components/vet/VetAddRecordForm'
import type { Pet, Vaccine, Symptom, Medication } from '../types'

const VET_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vet`

interface SessionData {
  pets: Pet
  vet_name: string | null
  vet_license: string | null
  token: string
  vaccines: Vaccine[]
  symptoms: Symptom[]
  medications: Medication[]
}

export function VetPage() {
  const { token } = useParams<{ token: string }>()
  const { t } = useTranslation()
  const [status, setStatus] = useState<'loading' | 'invalid' | 'identify' | 'ready'>('loading')
  const [session, setSession] = useState<SessionData | null>(null)

  useEffect(() => {
    fetch(`${VET_FN}?action=validate&token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus('invalid'); return }
        setSession(data.session)
        setStatus(data.session.vet_name ? 'ready' : 'identify')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  async function handleIdentify(vet_name: string, vet_license: string) {
    await fetch(VET_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'identify', token, vet_name, vet_license }),
    })
    setSession(s => s ? { ...s, vet_name, vet_license } : s)
    setStatus('ready')
  }

  async function handleAddRecord(type: string, record: Record<string, string | null>) {
    await fetch(VET_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_record', token, record_type: type, record }),
    })
    // Refetch records
    const res = await fetch(`${VET_FN}?action=validate&token=${token}`)
    const data = await res.json()
    if (!data.error) setSession(data.session)
  }

  if (status === 'loading') return <div>{t('common.loading')}</div>
  if (status === 'invalid') return <div style={{ textAlign: 'center', padding: 40 }}><p>{t('vet.session_invalid')}</p></div>
  if (status === 'identify') return <VetEntryForm onIdentify={handleIdentify} />

  const pet = session!.pets

  return (
    <div style={{ padding: 24 }}>
      <h1>{pet.name}</h1>
      <p>{pet.species} · {pet.breed}</p>
      <p>Dr. {session!.vet_name} (NMV: {session!.vet_license})</p>

      <hr />
      <h2>{t('vet.add_record')}</h2>
      <VetAddRecordForm onAdd={handleAddRecord} />

      <hr />
      <h2>{t('pet.vaccines')}</h2>
      <ul>{session!.vaccines.map(v => <li key={v.id}>{v.name} — {v.date}</li>)}</ul>

      <h2>{t('pet.symptoms')}</h2>
      <ul>{session!.symptoms.map(s => <li key={s.id}>{s.title} — {s.date}</li>)}</ul>

      <h2>{t('pet.medications')}</h2>
      <ul>{session!.medications.map(m => <li key={m.id}>{m.name} {m.dosage}</li>)}</ul>
    </div>
  )
}
