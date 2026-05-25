import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addMedication, updateMedication, deleteRecord } from '../../services/records'
import { uploadFile } from '../../services/files'
import type { Medication, Symptom } from '../../types'

interface Props {
  petId: string
  medications: Medication[]
  symptoms: Symptom[]
  onRefresh: () => void
}

const emptyForm = { name: '', dosage: '', frequency: '', start_date: '', end_date: '', symptom_id: '', photo_url: '' }

export function MedicationsTab({ petId, medications, symptoms, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  function startEdit(m: Medication) {
    setForm({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      start_date: m.start_date,
      end_date: m.end_date ?? '',
      symptom_id: m.symptom_id ?? '',
      photo_url: m.photo_url ?? '',
    })
    setEditingId(m.id)
    setPhotoFile(null)
    setShowForm(true)
  }

  function cancelEdit() {
    setForm(emptyForm); setEditingId(null); setPhotoFile(null); setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      let photoUrl: string | null = form.photo_url || null
      if (photoFile) {
        photoUrl = await uploadFile(petId, 'medications', photoFile)
      }
      const payload = {
        name: form.name,
        dosage: form.dosage,
        frequency: form.frequency,
        start_date: form.start_date,
        end_date: form.end_date || null,
        symptom_id: form.symptom_id || null,
        photo_url: photoUrl,
      }
      if (editingId) {
        await updateMedication(editingId, payload)
      } else {
        await addMedication(petId, payload)
      }
      setForm(emptyForm); setEditingId(null); setPhotoFile(null); setShowForm(false)
      onRefresh()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsSubmitting(false)
    }
  }

  function linkedSymptom(m: Medication) {
    return symptoms.find(s => s.id === m.symptom_id)
  }

  return (
    <div className="record-panel">
      <button onClick={() => { if (editingId) { cancelEdit() } else { setShowForm(v => !v) } }}>
        {editingId ? t('common.cancel') : t('medication.add')}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="record-form">
          <input placeholder={t('medication.name')} value={form.name} onChange={set('name')} required />
          <input placeholder={t('medication.dosage')} value={form.dosage} onChange={set('dosage')} required />
          <input placeholder={t('medication.frequency')} value={form.frequency} onChange={set('frequency')} required />
          <input type="date" placeholder={t('medication.start_date')} value={form.start_date} onChange={set('start_date')} required />
          <input type="date" placeholder={t('medication.end_date')} value={form.end_date} onChange={set('end_date')} />
          <select value={form.symptom_id} onChange={set('symptom_id')}>
            <option value="">{t('medication.symptom_none')}</option>
            {symptoms.map(s => (
              <option key={s.id} value={s.id}>{s.title} ({s.date})</option>
            ))}
          </select>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-ink-muted)', fontSize: 'var(--text-size-sm)' }}>
              {t('medication.photo')}
            </label>
            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} />
            {form.photo_url && !photoFile && (
              <img src={form.photo_url} alt="" style={{ marginTop: 8, width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
            )}
          </div>
          {submitError && <p className="error-text">{submitError}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={isSubmitting}>{editingId ? t('common.save_changes') : t('common.save')}</button>
            {editingId && (
              <button type="button" className="button-secondary" onClick={cancelEdit}>{t('common.cancel')}</button>
            )}
          </div>
        </form>
      )}
      <ul className="record-list">
        {medications.map(m => {
          const sym = linkedSymptom(m)
          return (
            <li key={m.id} className="record-item">
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {m.photo_url && (
                  <img src={m.photo_url} alt={m.name}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                )}
                <div>
                  <strong>{m.name}</strong>
                  <p>{m.dosage} · {m.frequency}</p>
                  <small className="record-meta">{m.start_date}{m.end_date ? ` - ${m.end_date}` : ''}</small>
                  {sym && <p className="record-meta">{t('medication.treats')}: {sym.title}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="button-secondary" onClick={() => startEdit(m)}>{t('common.edit')}</button>
                <button className="button-secondary" onClick={async () => {
                  try { await deleteRecord('medications', m.id); onRefresh() } catch { /* silently ignore UI — user can retry */ }
                }}>{t('common.delete')}</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
