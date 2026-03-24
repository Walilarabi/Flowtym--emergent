import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useHotel } from '@/context/HotelContext'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { UsersRound, Calendar, Clock, FileText, Receipt, AlertTriangle, TrendingUp, Building2 } from 'lucide-react'

export const StaffDashboard = () => {
  const { api } = useAuth()
  const { currentHotel } = useHotel()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!currentHotel) return
      try {
        const response = await api.get(`/hotels/${currentHotel.id}/staff/dashboard`)
        setDashboard(response.data)
      } catch (error) {
        toast.error('Erreur lors du chargement du tableau de bord')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [currentHotel, api])

  const DEPARTMENT_LABELS = {
    front_office: 'Reception',
    housekeeping: 'Housekeeping',
    maintenance: 'Maintenance',
    food_beverage: 'Restauration',
    administration: 'Administration'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
          <UsersRound className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Module Staff</h1>
          <p className="text-sm text-slate-500">Gestion du personnel - {format(new Date(), 'MMMM yyyy', { locale: fr })}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <UsersRound className="w-4 h-4" />
            <span className="text-xs font-medium">Employes actifs</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{dashboard?.total_employees || 0}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Shifts aujourd'hui</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{dashboard?.today_shifts || 0}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Pointes actuellement</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{dashboard?.clocked_in_now || 0}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Contrats expirants</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{dashboard?.expiring_contracts || 0}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Receipt className="w-4 h-4" />
            <span className="text-xs font-medium">Masse salariale brute</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{(dashboard?.month_gross_salary || 0).toLocaleString()} EUR</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Net a payer</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{(dashboard?.month_net_salary || 0).toLocaleString()} EUR</p>
        </div>
      </div>

      {/* Employees by department */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Repartition par departement</h2>
          <div className="space-y-3">
            {Object.entries(dashboard?.by_department || {}).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    dept === 'front_office' ? 'bg-blue-500' :
                    dept === 'housekeeping' ? 'bg-emerald-500' :
                    dept === 'maintenance' ? 'bg-amber-500' :
                    dept === 'food_beverage' ? 'bg-red-500' :
                    'bg-slate-500'
                  }`} />
                  <span className="text-sm text-slate-700">{DEPARTMENT_LABELS[dept] || dept}</span>
                </div>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
            {Object.keys(dashboard?.by_department || {}).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Aucun employe enregistre</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/staff/employees" className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <UsersRound className="w-6 h-6 mx-auto mb-2 text-violet-600" />
              <span className="text-sm font-medium">Gerer les employes</span>
            </a>
            <a href="/staff/planning" className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <span className="text-sm font-medium">Planning equipes</span>
            </a>
            <a href="/staff/time-tracking" className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
              <span className="text-sm font-medium">Pointage</span>
            </a>
            <a href="/staff/payroll" className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
              <Receipt className="w-6 h-6 mx-auto mb-2 text-amber-600" />
              <span className="text-sm font-medium">Paie & URSSAF</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
