import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addTreatNote, updateTreatNote, deleteTreatNote } from '../../services/treatNotes'
import { uploadFile } from '../../services/files'
import type { TreatNote } from '../../types'

interface Props {
  petId: string
  treatNotes: TreatNote[]
  onRefresh: () => void
}

const emptyForm = { name: '', liked: true, where_bought: '', date: '', photo_url: '' }

export function TreatNotesTab({ petId, treatNotes, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{ name: string; liked: boolean; where_bought: string; date: string; photo_url: string }>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  function setStr(k: 'name' | 'where_bought' | 'date') {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  function startEdit(n: TreatNote) {
    setForm({ name: n.name, liked: n.liked, where_bought: n.where_bought ?? '', date: n.date, photo_url: n.photo_url ?? '' })
    setEditingId(n.id)
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
      const photoUrl = photoFile
        ? await uploadFile(petId, 'treats', photoFile)
        : form.photo_url || null
      const payload = {
        name: form.name,
        liked: form.liked,
        where_bought: form.where_bought || null,
        date: form.date,
        photo_url: photoUrl,
      }
      if (editingId) {
        await updateTreatNote(editingId, payload)
      } else {
        await addTreatNote(petId, payload)
      }
      setForm(emptyForm); setEditingId(null); setPhotoFile(null); setShowForm(false)
      onRefresh()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="record-panel">
      <button onClick={() => { if (editingId) { cancelEdit() } else { setShowForm(v => !v) } }}>
        {editingId ? t('common.cancel') : t('treat.add')}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="record-form">
          <input placeholder={t('treat.name')} value={form.name} onChange={setStr('name')} required />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`tab-button${form.liked ? ' is-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, liked: true }))}
            >
              👍 {t('treat.liked')}
            </button>
            <button
              type="button"
              className={`tab-button${!form.liked ? ' is-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, liked: false }))}
            >
              👎 {t('treat.disliked')}
            </button>
          </div>
          <input placeholder={t('treat.where_bought')} value={form.where_bought} onChange={setStr('where_bought')} />
          <input type="date" value={form.date} onChange={setStr('date')} required />
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-ink-muted)', fontSize: 'var(--text-size-sm)' }}>
              {t('treat.photo')}
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
        {treatNotes.map(n => (
          <li key={n.id} className="record-item">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              {n.photo_url && (
                <img src={n.photo_url} alt={n.name}
                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
              )}
              <div>
                <strong>{n.name} {n.liked ? '👍' : '👎'}</strong>
                {n.where_bought && <p className="record-meta">{n.where_bought}</p>}
                <small className="record-meta">{n.date}</small>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="button-secondary" onClick={() => startEdit(n)}>{t('common.edit')}</button>
              <button className="button-secondary" onClick={async () => {
                try { await deleteTreatNote(n.id); onRefresh() } catch { /* silently ignore UI — user can retry */ }
              }}>{t('common.delete')}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
