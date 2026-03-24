import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { HotelProvider } from '@/context/HotelContext'
import { LoginPage } from '@/pages/LoginPage'
import { MainLayout } from '@/components/layout/MainLayout'
import { PlanningPage } from '@/pages/PlanningPage'
import { ReservationsPage } from '@/pages/ReservationsPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ArrivalsPage } from '@/pages/ArrivalsPage'
import { DeparturesPage } from '@/pages/DeparturesPage'
import { NightAuditPage } from '@/pages/NightAuditPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StaffDashboard } from '@/pages/staff/StaffDashboard'
import { StaffEmployees } from '@/pages/staff/StaffEmployees'
import { StaffPlanning } from '@/pages/staff/StaffPlanning'
import { StaffTimeTracking } from '@/pages/staff/StaffTimeTracking'
import { StaffContracts } from '@/pages/staff/StaffContracts'
import { StaffPayroll } from '@/pages/staff/StaffPayroll'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full spinner" />
          <span className="text-sm text-slate-500">Chargement...</span>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <HotelProvider>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/pms/planning" replace />} />
                  {/* PMS Routes */}
                  <Route path="/pms/planning" element={<PlanningPage />} />
                  <Route path="/pms/reservations" element={<ReservationsPage />} />
                  <Route path="/pms/clients" element={<ClientsPage />} />
                  <Route path="/pms/arrivals" element={<ArrivalsPage />} />
                  <Route path="/pms/departures" element={<DeparturesPage />} />
                  <Route path="/pms/night-audit" element={<NightAuditPage />} />
                  <Route path="/pms/reports" element={<ReportsPage />} />
                  {/* Staff Routes */}
                  <Route path="/staff" element={<StaffDashboard />} />
                  <Route path="/staff/employees" element={<StaffEmployees />} />
                  <Route path="/staff/planning" element={<StaffPlanning />} />
                  <Route path="/staff/time-tracking" element={<StaffTimeTracking />} />
                  <Route path="/staff/contracts" element={<StaffContracts />} />
                  <Route path="/staff/payroll" element={<StaffPayroll />} />
                  {/* Settings */}
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/pms/planning" replace />} />
                </Routes>
              </MainLayout>
            </HotelProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
