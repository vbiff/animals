import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addMedication, deleteRecord } from '../../services/records'
import type { Medication } from '../../types'

interface Props { petId: string; medications: Medication[]; onRefresh: () => void }

export function MedicationsTab({ petId, medications, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '', start_date: '', end_date: '' })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await addMedication(petId, { ...form, end_date: form.end_date || null })
    setForm({ name: '', dosage: '', frequency: '', start_date: '', end_date: '' })
    setShowForm(false); onRefresh()
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)}>{t('medication.add')}</button>
      {showForm && (
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
          <input placeholder={t('medication.name')} value={form.name} onChange={set('name')} required />
          <input placeholder={t('medication.dosage')} value={form.dosage} onChange={set('dosage')} required />
          <input placeholder={t('medication.frequency')} value={form.frequency} onChange={set('frequency')} required />
          <input type="date" placeholder={t('medication.start_date')} value={form.start_date} onChange={set('start_date')} required />
          <input type="date" placeholder={t('medication.end_date')} value={form.end_date} onChange={set('end_date')} />
          <button type="submit">{t('common.save')}</button>
        </form>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {medications.map(m => (
          <li key={m.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
            <strong>{m.name}</strong> {m.dosage} · {m.frequency}
            <br /><small>{m.start_date}{m.end_date ? ` → ${m.end_date}` : ''}</small>
            <button onClick={() => deleteRecord('medications', m.id).then(onRefresh)}>{t('common.delete')}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
