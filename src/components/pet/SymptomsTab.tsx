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
    <div>
      <button onClick={() => setShowForm(!showForm)}>{t('symptom.add')}</button>
      {showForm && (
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
          <input placeholder={t('symptom.title')} value={title} onChange={e => setTitle(e.target.value)} required />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <textarea placeholder={t('symptom.description')} value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          <button type="submit">{t('common.save')}</button>
        </form>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {symptoms.map(s => (
          <li key={s.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
            <strong>{s.title}</strong> — {s.date}
            {s.description && <p style={{ margin: '4px 0' }}>{s.description}</p>}
            <button onClick={() => deleteRecord('symptoms', s.id).then(onRefresh)}>{t('common.delete')}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
