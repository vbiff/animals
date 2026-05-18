import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type RecordType = 'vaccine' | 'symptom' | 'medication' | 'document'

interface Props { onAdd: (type: RecordType, record: Record<string, string | null>) => Promise<void> }

export function VetAddRecordForm({ onAdd }: Props) {
  const { t } = useTranslation()
  const [type, setType] = useState<RecordType>('vaccine')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function setField(k: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const record: Record<string, string | null> = { ...fields }
    if (type === 'vaccine') { record.next_date = record.next_date || null; record.document_url = null }
    if (type === 'medication') { record.end_date = record.end_date || null }
    await onAdd(type, record)
    setFields({}); setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="record-form">
      <select value={type} onChange={e => { setType(e.target.value as RecordType); setFields({}) }}>
        <option value="vaccine">{t('vaccine.add')}</option>
        <option value="symptom">{t('symptom.add')}</option>
        <option value="medication">{t('medication.add')}</option>
      </select>

      {type === 'vaccine' && <>
        <input placeholder={t('vaccine.name')} value={fields.name ?? ''} onChange={setField('name')} required />
        <input type="date" placeholder={t('vaccine.date')} value={fields.date ?? ''} onChange={setField('date')} required />
        <input type="date" placeholder={t('vaccine.next_date')} value={fields.next_date ?? ''} onChange={setField('next_date')} />
      </>}

      {type === 'symptom' && <>
        <input placeholder={t('symptom.title')} value={fields.title ?? ''} onChange={setField('title')} required />
        <input type="date" value={fields.date ?? ''} onChange={setField('date')} required />
        <textarea placeholder={t('symptom.description')} value={fields.description ?? ''} onChange={setField('description')} rows={3} />
      </>}

      {type === 'medication' && <>
        <input placeholder={t('medication.name')} value={fields.name ?? ''} onChange={setField('name')} required />
        <input placeholder={t('medication.dosage')} value={fields.dosage ?? ''} onChange={setField('dosage')} required />
        <input placeholder={t('medication.frequency')} value={fields.frequency ?? ''} onChange={setField('frequency')} required />
        <input type="date" placeholder={t('medication.start_date')} value={fields.start_date ?? ''} onChange={setField('start_date')} required />
        <input type="date" placeholder={t('medication.end_date')} value={fields.end_date ?? ''} onChange={setField('end_date')} />
      </>}

      <button type="submit" disabled={submitting}>{submitting ? t('common.loading') : t('vet.add_record')}</button>
    </form>
  )
}
