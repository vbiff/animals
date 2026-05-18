import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addSymptom, deleteRecord } from '../../services/records'
import type { Symptom } from '../../types'

interface Props { petId: string; symptoms: Symptom[]; onRefresh: () => void }

export function SymptomsTab({ petId, symptoms, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await addSymptom(petId, { title, date, description })
    setTitle(''); setDate(''); setDescription(''); setShowForm(false)
    onRefresh()
  }

  return (
    <div className="record-panel">
      <button onClick={() => setShowForm(!showForm)}>{t('symptom.add')}</button>
      {showForm && (
        <form onSubmit={handleAdd} className="record-form">
          <input placeholder={t('symptom.title')} value={title} onChange={e => setTitle(e.target.value)} required />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <textarea placeholder={t('symptom.description')} value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          <button type="submit">{t('common.save')}</button>
        </form>
      )}
      <ul className="record-list">
        {symptoms.map(s => (
          <li key={s.id} className="record-item">
            <div>
              <strong>{s.title}</strong>
              <p className="record-meta">{s.date}</p>
              {s.description && <p>{s.description}</p>}
            </div>
            <button className="button-secondary" onClick={() => deleteRecord('symptoms', s.id).then(onRefresh)}>{t('common.delete')}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
