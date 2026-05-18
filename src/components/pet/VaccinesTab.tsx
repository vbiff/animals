import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addVaccine, deleteRecord } from '../../services/records'
import type { Vaccine } from '../../types'

interface Props { petId: string; vaccines: Vaccine[]; onRefresh: () => void }

export function VaccinesTab({ petId, vaccines, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [nextDate, setNextDate] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await addVaccine(petId, { name, date, next_date: nextDate || null, document_url: null })
    setName(''); setDate(''); setNextDate(''); setShowForm(false)
    onRefresh()
  }

  return (
    <div className="record-panel">
      <button onClick={() => setShowForm(!showForm)}>{t('vaccine.add')}</button>
      {showForm && (
        <form onSubmit={handleAdd} className="record-form">
          <input placeholder={t('vaccine.name')} value={name} onChange={e => setName(e.target.value)} required />
          <input type="date" placeholder={t('vaccine.date')} value={date} onChange={e => setDate(e.target.value)} required />
          <input type="date" placeholder={t('vaccine.next_date')} value={nextDate} onChange={e => setNextDate(e.target.value)} />
          <button type="submit">{t('common.save')}</button>
        </form>
      )}
      <ul className="record-list">
        {vaccines.map(v => (
          <li key={v.id} className="record-item">
            <div>
              <strong>{v.name}</strong>
              <p className="record-meta">{v.date}{v.next_date ? ` / next: ${v.next_date}` : ''}</p>
              <small className="record-meta">{v.added_by.type === 'owner' ? t('common.added_by_owner') : t('common.added_by_vet', { name: v.added_by.name, license: (v.added_by as { vet_license: string }).vet_license })}</small>
            </div>
            <button className="button-secondary" onClick={() => deleteRecord('vaccines', v.id).then(onRefresh)}>{t('common.delete')}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
