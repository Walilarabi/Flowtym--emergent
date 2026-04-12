/**
 * Flowtym Housekeeping Module - Version Complète Rorck V2
 * Reproduction fidèle des interfaces Rorck avec interactivité complète
 * 
 * VUES:
 * - Réception: Tableau interactif temps réel avec NestJS + WebSocket
 * - Direction: Dashboard KPIs, plan chambres, équipe active
 * - Gouvernante: Validation inspections, équipe, stocks (3 onglets)
 * - Femme de chambre: Mobile avec scan QR code
 * - Maintenance: Mobile tickets par priorité
 * - Petit-déjeuner: Mobile flux cuisine/livraison/servi
 * - Plan Hôtel: Vue grille par étage
 * - Répartition: Assignation staff avec alertes
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useHotel } from '@/context/HotelContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  MapPin, Zap, Grid3X3, CheckCircle, Wrench, Coffee, RefreshCw,
  Loader2, LayoutGrid, QrCode, Settings, Wifi
} from 'lucide-react'
import axios from 'axios'

// Import des vues
import DirectionView from '@/components/housekeeping/DirectionView'
import GouvernanteView from '@/components/housekeeping/GouvernanteView'
import GouvernanteViewV2 from '@/components/housekeeping/GouvernanteViewV2'
import MobileHousekeepingView from '@/components/housekeeping/MobileHousekeepingView'
import MobileHousekeepingViewV2 from '@/components/housekeeping/MobileHousekeepingViewV2'
import MobileMaintenanceView from '@/components/housekeeping/MobileMaintenanceView'
import MobileBreakfastView from '@/components/housekeeping/MobileBreakfastView'
import InteractiveReceptionView from '@/components/housekeeping/InteractiveReceptionView'
import ReceptionViewV2 from '@/components/housekeeping/ReceptionViewV2'
import DirectionViewV2 from '@/components/housekeeping/DirectionViewV2'
import { DirectionModule } from '@/components/housekeeping/direction'
import QRCodeManager from '@/components/housekeeping/QRCodeManager'
import SatisfactionConfig from '@/components/housekeeping/SatisfactionConfig'
import HousekeepingNotifications from '@/components/housekeeping/HousekeepingNotifications'

// Hook V2 pour NestJS
import useHousekeepingV2 from '@/hooks/useHousekeepingV2'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

// ═══════════════════════════════════════════════════════════════════════════════
// API HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useHousekeepingData = () => {
  const { currentHotel } = useHotel()
  const [data, setData] = useState({
    stats: null,
    tasks: [],
    rooms: [],
    staff: [],
    inspections: [],
    maintenance: [],
    breakfast: [],
    inventory: [],
    activity: [],
    loading: true,
    error: null
  })

  const hotelId = currentHotel?.id

  const fetchData = useCallback(async () => {
    if (!hotelId) return
    
    setData(d => ({ ...d, loading: true, error: null }))
    const token = localStorage.getItem('flowtym_token')
    const headers = { Authorization: `Bearer ${token}` }
    
    try {
      const [statsRes, tasksRes, staffRes, inspRes, maintRes, bfastRes, invRes, actRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/tasks`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/staff`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/inspections`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/maintenance`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/breakfast`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/inventory`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/activity?limit=20`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/hotels/${hotelId}/rooms`, { headers }).catch(() => ({ data: [] }))
      ])
      
      setData({
        stats: statsRes.data,
        tasks: tasksRes.data || [],
        rooms: roomsRes.data || [],
        staff: staffRes.data || [],
        inspections: inspRes.data || [],
        maintenance: maintRes.data || [],
        breakfast: bfastRes.data || [],
        inventory: invRes.data || [],
        activity: actRes.data || [],
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching housekeeping data:', error)
      setData(d => ({ ...d, loading: false, error: error.message }))
    }
  }, [hotelId])

  const seedData = useCallback(async () => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/seed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Données de démonstration créées')
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la création des données')
    }
  }, [hotelId, fetchData])

  const startTask = useCallback(async (taskId) => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/tasks/${taskId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Nettoyage démarré')
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const completeTask = useCallback(async (taskId, photos = [], notes = '') => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/tasks/${taskId}/complete`, 
        { task_id: taskId, photos_after: photos, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Nettoyage terminé')
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const validateInspection = useCallback(async (inspectionId, approved, rating, notes, reason) => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/inspections/${inspectionId}/validate`,
        { inspection_id: inspectionId, approved, rating, notes, refused_reason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(approved ? 'Chambre validée' : 'Chambre refusée')
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const autoAssign = useCallback(async () => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      const res = await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/assignments/auto`,
        { date: new Date().toISOString().split('T')[0], strategy: 'balanced' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${res.data.assigned} chambres assignées`)
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const updateBreakfast = useCallback(async (orderId, updates) => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      await axios.put(`${API_URL}/api/housekeeping/hotels/${hotelId}/breakfast/${orderId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const updateMaintenance = useCallback(async (ticketId, updates) => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      await axios.put(`${API_URL}/api/housekeeping/hotels/${hotelId}/maintenance/${ticketId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return {
    ...data,
    refresh: fetchData,
    seedData,
    startTask,
    completeTask,
    validateInspection,
    autoAssign,
    updateBreakfast,
    updateMaintenance
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HousekeepingModule() {
  const [activeView, setActiveView] = useState('reception')
  const useV2Api = true // Always use Supabase V2
  
  // Use V2 hook (Supabase Realtime)
  const dataV2 = useHousekeepingV2()
  
  // Select data source
  const data = dataV2

  const actions = {
    refresh: dataV2.refresh,
    seedData: dataV2.seedData,
    startTask: dataV2.startTask,
    completeTask: dataV2.completeTask,
    validateInspection: dataV2.validateInspection,
    autoAssign: dataV2.autoAssign,
    assignTasks: dataV2.assignTasks,
    clearAllNotifications: dataV2.clearAllNotifications,
    dismissNotification: dataV2.dismissNotification,
    toggleSound: dataV2.toggleSound,
  }

  // Navigation handler for Direction view
  const handleNavigate = (view) => {
    const viewMap = {
      'plan': 'plan',
      'repartition': 'repartition',
      'control': 'direction',
      'maintenance': 'maintenance',
      'stats': 'direction',
      'history': 'direction',
      'reports': 'direction',
    }
    setActiveView(viewMap[view] || view)
  }

  if (data.loading && !data.stats && data.rooms?.length === 0) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-500">Chargement du module Housekeeping...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-3">
        <div className="flex items-center justify-between">
          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {/* Desktop Views */}
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'reception' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveView('reception')}
              data-testid="hk-nav-reception"
            >
              <MapPin size={16} /> Réception
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'direction' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveView('direction')}
              data-testid="hk-nav-direction"
            >
              <LayoutGrid size={16} /> Direction
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'gouvernante' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveView('gouvernante')}
              data-testid="hk-nav-gouvernante"
            >
              <CheckCircle size={16} /> Gouvernante
            </button>
            
            {/* Separator */}
            <div className="w-px h-8 bg-slate-300 mx-1 self-center" />
            
            {/* Mobile Views */}
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'femme_chambre' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveView('femme_chambre')}
              data-testid="hk-nav-femme-chambre"
            >
              <Zap size={16} /> Femme de chambre
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'maintenance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveView('maintenance')}
              data-testid="hk-nav-maintenance"
            >
              <Wrench size={16} /> Maintenance
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'breakfast' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveView('breakfast')}
              data-testid="hk-nav-breakfast"
            >
              <Coffee size={16} /> Petit-déj
            </button>
            
            {/* Separator */}
            <div className="w-px h-8 bg-slate-300 mx-1 self-center" />
            
            {/* Config Views */}
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'qrcodes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveView('qrcodes')}
              data-testid="hk-nav-qrcodes"
            >
              <QrCode size={16} /> QR Codes
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'satisfaction' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveView('satisfaction')}
              data-testid="hk-nav-satisfaction"
            >
              <Settings size={16} /> Satisfaction
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications - Only for V2 API */}
            {useV2Api && (
              <HousekeepingNotifications
                notifications={data.notifications || []}
                onClearAll={actions.clearAllNotifications}
                onDismiss={actions.dismissNotification}
                onValidate={(notif) => {
                  // Navigate to gouvernante view and highlight the inspection
                  setActiveView('gouvernante')
                  actions.dismissNotification(notif.id)
                }}
                soundEnabled={data.soundEnabled}
                onToggleSound={actions.toggleSound}
              />
            )}
            
            {/* V2 API Toggle */}
            <button 
              onClick={() => setUseV2Api(!useV2Api)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                useV2Api 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
              title={useV2Api ? 'API NestJS V2 active' : 'API FastAPI Legacy'}
            >
              <Wifi size={12} />
              {useV2Api ? 'V2 Temps réel' : 'Legacy'}
            </button>
            <Button variant="outline" size="sm" onClick={actions.refresh}>
              <RefreshCw size={14} className="mr-1" /> Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={actions.seedData}>
              Données démo
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'reception' && (
          useV2Api 
            ? <ReceptionViewV2 data={data} actions={actions} />
            : <InteractiveReceptionView data={data} actions={actions} />
        )}
        {activeView === 'direction' && (
          useV2Api
            ? <DirectionModule 
                data={data} 
                actions={actions} 
                v2Data={dataV2}
                v2Actions={actionsV2}
              />
            : <DirectionView data={data} actions={actions} onNavigate={handleNavigate} />
        )}
        {activeView === 'gouvernante' && (
          useV2Api
            ? <GouvernanteViewV2 data={data} actions={actions} />
            : <GouvernanteView data={data} actions={actions} />
        )}
        {activeView === 'femme_chambre' && (
          useV2Api
            ? <MobileHousekeepingViewV2 data={data} actions={actions} />
            : <MobileHousekeepingView data={data} actions={actions} />
        )}
        {activeView === 'maintenance' && (
          <MobileMaintenanceView data={data} actions={actions} />
        )}
        {activeView === 'breakfast' && (
          <MobileBreakfastView data={data} actions={actions} />
        )}
        {activeView === 'qrcodes' && (
          <div className="h-full overflow-auto p-6">
            <QRCodeManager />
          </div>
        )}
        {activeView === 'satisfaction' && (
          <div className="h-full overflow-auto p-6">
            <SatisfactionConfig />
          </div>
        )}
      </div>
    </div>
  )
}

export { HousekeepingModule }
