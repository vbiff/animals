import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addSymptom, updateSymptom, deleteRecord } from '../../services/records'
import type { Symptom, Medication } from '../../types'

interface Props {
  petId: string
  symptoms: Symptom[]
  medications: Medication[]
  onRefresh: () => void
}

const emptyForm = { title: '', date: '', end_date: '', description: '' }

export function SymptomsTab({ petId, symptoms, medications, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  function set(k: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  function startEdit(s: Symptom) {
    setForm({ title: s.title, date: s.date, end_date: s.end_date ?? '', description: s.description })
    setEditingId(s.id)
    setShowForm(true)
  }

  function cancelEdit() {
    setForm(emptyForm); setEditingId(null); setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { title: form.title, date: form.date, end_date: form.end_date || null, description: form.description }
    if (editingId) {
      await updateSymptom(editingId, payload)
    } else {
      await addSymptom(petId, payload)
    }
    setForm(emptyForm); setEditingId(null); setShowForm(false)
    onRefresh()
  }

  function linkedMeds(symptomId: string) {
    return medications.filter(m => m.symptom_id === symptomId)
  }

  return (
    <div className="record-panel">
      <button onClick={() => { if (editingId) { cancelEdit() } else { setShowForm(v => !v) } }}>
        {t('symptom.add')}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="record-form">
          <input placeholder={t('symptom.title')} value={form.title} onChange={set('title')} required />
          <input type="date" value={form.date} onChange={set('date')} required />
          <input type="date" placeholder={t('symptom.end_date')} value={form.end_date} onChange={set('end_date')} />
          <textarea placeholder={t('symptom.description')} value={form.description} onChange={set('description')} rows={3} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">{editingId ? t('common.save_changes') : t('common.save')}</button>
            {editingId && (
              <button type="button" className="button-secondary" onClick={cancelEdit}>{t('common.cancel')}</button>
            )}
          </div>
        </form>
      )}
      <ul className="record-list">
        {symptoms.map(s => {
          const meds = linkedMeds(s.id)
          return (
            <li key={s.id} className="record-item">
              <div>
                <strong>{s.title}</strong>
                <p className="record-meta">
                  {s.date}{s.end_date ? ` — ${s.end_date}` : ''}
                </p>
                {s.description && <p>{s.description}</p>}
                {meds.length > 0 && (
                  <div className="linked-meds">
                    <small>{t('symptom.linked_medications')}</small>
                    <ul>
                      {meds.map(m => <li key={m.id}>{m.name} · {m.dosage}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="button-secondary" onClick={() => startEdit(s)}>{t('common.edit')}</button>
                <button className="button-secondary" onClick={() => deleteRecord('symptoms', s.id).then(onRefresh)}>{t('common.delete')}</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
