import { Routes, Route, Navigate } from 'react-router-dom'
import { LanguageSwitcher } from './components/shared/LanguageSwitcher'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { PetPage } from './pages/PetPage'
import { PetEditPage } from './pages/PetEditPage'
import { VetPage } from './pages/VetPage'
import { InvitePage } from './pages/InvitePage'
import { ProtectedRoute } from './components/shared/ProtectedRoute'

export default function App() {
  return (
    <>
      <div className="language-dock">
        <LanguageSwitcher />
      </div>
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/pet/:id" element={<ProtectedRoute><PetPage /></ProtectedRoute>} />
          <Route path="/pet/:id/edit" element={<ProtectedRoute><PetEditPage /></ProtectedRoute>} />
          <Route path="/vet/:token" element={<VetPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
