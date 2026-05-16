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
import { VetSessionModal, InviteModal } from '../components/pet/VetSessionModal'

type TabId = 'vaccines' | 'symptoms' | 'medications' | 'documents'

export function PetPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pet, loading, error } = usePet(id!)
  const { records, refresh } = useRecords(id!)
  const [tab, setTab] = useState<TabId>('vaccines')
  const [showVetModal, setShowVetModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  if (loading) return <div>{t('common.loading')}</div>
  if (error || !pet) { navigate('/dashboard'); return null }

  const tabs: TabId[] = ['vaccines', 'symptoms', 'medications', 'documents']

  return (
    <div>
      <PetHeader pet={pet} onOpenForVet={() => setShowVetModal(true)} onInvite={() => setShowInviteModal(true)} />
      <div style={{ display: 'flex', borderBottom: '2px solid #eee', padding: '0 24px' }}>
        {tabs.map(tabId => (
          <button key={tabId} onClick={() => setTab(tabId)} style={{ padding: '8px 16px', borderBottom: tab === tabId ? '2px solid blue' : 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
            {tabId}
          </button>
        ))}
      </div>
      <div style={{ padding: 24 }}>
        {tab === 'vaccines' && <VaccinesTab petId={id!} vaccines={records.vaccines} onRefresh={refresh} />}
        {tab === 'symptoms' && <SymptomsTab petId={id!} symptoms={records.symptoms} onRefresh={refresh} />}
        {tab === 'medications' && <MedicationsTab petId={id!} medications={records.medications} onRefresh={refresh} />}
        {tab === 'documents' && <DocumentsTab petId={id!} documents={records.documents} onRefresh={refresh} />}
      </div>
      {showVetModal && <VetSessionModal petId={id!} onClose={() => setShowVetModal(false)} />}
      {showInviteModal && <InviteModal petId={id!} onClose={() => setShowInviteModal(false)} />}
    </div>
  )
}
