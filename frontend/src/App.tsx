import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PropertiesPage } from '@/pages/PropertiesPage'
import { TenantsPage } from '@/pages/TenantsPage'
import { LeasesPage } from '@/pages/LeasesPage'
import { PaymentsPage } from '@/pages/PaymentsPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { ReportsPage } from '@/pages/ReportsPage'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/properties" element={<PropertiesPage />} />
                    <Route path="/tenants" element={<TenantsPage />} />
                    <Route path="/leases" element={<LeasesPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App

