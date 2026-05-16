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
    <div>
      <button onClick={() => setShowForm(!showForm)}>{t('vaccine.add')}</button>
      {showForm && (
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
          <input placeholder={t('vaccine.name')} value={name} onChange={e => setName(e.target.value)} required />
          <input type="date" placeholder={t('vaccine.date')} value={date} onChange={e => setDate(e.target.value)} required />
          <input type="date" placeholder={t('vaccine.next_date')} value={nextDate} onChange={e => setNextDate(e.target.value)} />
          <button type="submit">{t('common.save')}</button>
        </form>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {vaccines.map(v => (
          <li key={v.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
            <strong>{v.name}</strong> — {v.date}
            {v.next_date && <span> (next: {v.next_date})</span>}
            <br />
            <small>{v.added_by.type === 'owner' ? t('common.added_by_owner') : t('common.added_by_vet', { name: v.added_by.name, license: (v.added_by as { vet_license: string }).vet_license })}</small>
            <button onClick={() => deleteRecord('vaccines', v.id).then(onRefresh)} style={{ marginLeft: 8 }}>{t('common.delete')}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
