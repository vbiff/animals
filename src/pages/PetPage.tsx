import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePet } from '../hooks/usePet'
import { useRecords } from '../hooks/useRecords'
import { PetHeader } from '../components/pet/PetHeader'
import { VaccinesTab } from '../components/pet/VaccinesTab'
import { SymptomsTab } from '../components/pet/SymptomsTab'
import { MedicationsTab } from '../components/pet/MedicationsTab'
import { DocumentsTab } from '../components/pet/DocumentsTab'
import { CalendarTab } from '../components/pet/CalendarTab'
import { TreatNotesTab } from '../components/pet/TreatNotesTab'
import { VetSessionModal, InviteModal } from '../components/pet/VetSessionModal'

type TabId = 'vaccines' | 'symptoms' | 'medications' | 'documents' | 'calendar' | 'notes'

const TAB_LABEL_KEYS: Record<TabId, string> = {
  vaccines: 'pet.vaccines',
  symptoms: 'pet.symptoms',
  medications: 'pet.medications',
  documents: 'pet.documents',
  calendar: 'pet.calendar',
  notes: 'pet.notes',
}

export function PetPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pet, loading, error } = usePet(id!)
  const { records, error: recordsError, refresh } = useRecords(id!)
  const [tab, setTab] = useState<TabId>('vaccines')
  const [showVetModal, setShowVetModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  if (loading) return <div className="loading-state">{t('common.loading')}</div>
  if (error || !pet) { navigate('/dashboard'); return null }
  if (recordsError) return <div className="loading-state">{t('common.error')}</div>

  const tabs: TabId[] = ['vaccines', 'symptoms', 'medications', 'documents', 'calendar', 'notes']

  return (
    <div>
      <PetHeader pet={pet} onOpenForVet={() => setShowVetModal(true)} onInvite={() => setShowInviteModal(true)} />
      <div className="tabs">
        {tabs.map(tabId => (
          <button
            key={tabId}
            className={`tab-button${tab === tabId ? ' is-active' : ''}`}
            onClick={() => setTab(tabId)}
          >
            {t(TAB_LABEL_KEYS[tabId])}
          </button>
        ))}
      </div>
      <div className="page-pad">
        {tab === 'vaccines' && (
          <VaccinesTab petId={id!} vaccines={records.vaccines} onRefresh={refresh} />
        )}
        {tab === 'symptoms' && (
          <SymptomsTab petId={id!} symptoms={records.symptoms} medications={records.medications} onRefresh={refresh} />
        )}
        {tab === 'medications' && (
          <MedicationsTab petId={id!} medications={records.medications} symptoms={records.symptoms} onRefresh={refresh} />
        )}
        {tab === 'documents' && (
          <DocumentsTab petId={id!} documents={records.documents} onRefresh={refresh} />
        )}
        {tab === 'calendar' && (
          <CalendarTab symptoms={records.symptoms} />
        )}
        {tab === 'notes' && (
          <TreatNotesTab petId={id!} treatNotes={records.treatNotes} onRefresh={refresh} />
        )}
      </div>
      {showVetModal && <VetSessionModal petId={id!} onClose={() => setShowVetModal(false)} />}
      {showInviteModal && <InviteModal petId={id!} onClose={() => setShowInviteModal(false)} />}
    </div>
  )
}
