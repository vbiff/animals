import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addDocument, deleteRecord } from '../../services/records'
import { uploadFile } from '../../services/files'
import type { Document, DocumentType } from '../../types'

interface Props { petId: string; documents: Document[]; onRefresh: () => void }

export function DocumentsTab({ petId, documents, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<DocumentType>('other')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true); setError(null)
    try {
      const file_url = await uploadFile(petId, 'documents', file)
      await addDocument(petId, { name, type, file_url })
      setName(''); setFile(null); setShowForm(false); onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="record-panel">
      <button onClick={() => setShowForm(!showForm)}>{t('document.add')}</button>
      {showForm && (
        <form onSubmit={handleAdd} className="record-form">
          <input placeholder={t('document.name')} value={name} onChange={e => setName(e.target.value)} required />
          <select value={type} onChange={e => setType(e.target.value as DocumentType)}>
            {(['analysis', 'xray', 'prescription', 'other'] as DocumentType[]).map(dt => (
              <option key={dt} value={dt}>{t(`document.types.${dt}`)}</option>
            ))}
          </select>
          <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} required />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={uploading}>{uploading ? t('common.loading') : t('common.save')}</button>
        </form>
      )}
      <ul className="record-list">
        {documents.map(d => (
          <li key={d.id} className="record-item">
            <div>
              <a href={d.file_url} target="_blank" rel="noopener noreferrer"><strong>{d.name}</strong></a>
              <p className="record-meta">{t(`document.types.${d.type}`)}</p>
            </div>
            <button className="button-secondary" onClick={() => deleteRecord('documents', d.id).then(onRefresh)}>{t('common.delete')}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
