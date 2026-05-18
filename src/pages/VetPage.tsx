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

  if (status === 'loading') return <div className="loading-state">{t('common.loading')}</div>
  if (status === 'invalid') return <div className="screen-center"><div className="modal-panel modal-panel--center"><p>{t('vet.session_invalid')}</p></div></div>
  if (status === 'identify') return <VetEntryForm onIdentify={handleIdentify} />

  const pet = session!.pets

  return (
    <div className="page-pad">
      <div className="topbar">
        <div>
          <p className="eyebrow">Vet session</p>
          <h1>{pet.name}</h1>
          <p className="muted">{pet.species} · {pet.breed}</p>
          <p className="record-meta">Dr. {session!.vet_name} (NMV: {session!.vet_license})</p>
        </div>
      </div>

      <hr className="section-divider" />
      <h2>{t('vet.add_record')}</h2>
      <VetAddRecordForm onAdd={handleAddRecord} />

      <hr className="section-divider" />
      <h2>{t('pet.vaccines')}</h2>
      <ul className="record-list">{session!.vaccines.map(v => <li className="record-item" key={v.id}><span>{v.name}</span><span className="record-meta">{v.date}</span></li>)}</ul>

      <h2>{t('pet.symptoms')}</h2>
      <ul className="record-list">{session!.symptoms.map(s => <li className="record-item" key={s.id}><span>{s.title}</span><span className="record-meta">{s.date}</span></li>)}</ul>

      <h2>{t('pet.medications')}</h2>
      <ul className="record-list">{session!.medications.map(m => <li className="record-item" key={m.id}><span>{m.name}</span><span className="record-meta">{m.dosage}</span></li>)}</ul>
    </div>
  )
}
