/**
 * Flowtym Housekeeping Module
 * Module complet de gestion du ménage hôtelier
 * - Direction Dashboard
 * - Gouvernante View
 * - Femme de Chambre (Mobile)
 * - Maintenance
 * - Petit Déjeuner
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useHotel } from '@/context/HotelContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Brush, Users, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Search, Filter, RefreshCw, Play, Square, ChevronRight, ChevronDown,
  Home, Bed, Coffee, Wrench, Package, BarChart3, History, Zap,
  MapPin, Star, Eye, Phone, Mail, UserPlus, Settings, ArrowRight,
  CheckCircle2, XCircle, Loader2, Building2, Calendar, Sparkles
} from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const FT = {
  brand: '#7c3aed',
  brandSoft: '#ede9fe',
  success: '#22c55e',
  successSoft: '#dcfce7',
  warning: '#f59e0b',
  warningSoft: '#fef3c7',
  danger: '#ef4444',
  dangerSoft: '#fee2e2',
  info: '#0ea5e9',
  infoSoft: '#e0f2fe',
  teal: '#0d9488',
  tealSoft: '#ccfbf1',
  orange: '#f97316',
}

const ROOM_STATUS_CONFIG = {
  libre: { label: 'Libre', color: FT.success, bg: FT.successSoft },
  occupe: { label: 'Occupé', color: FT.info, bg: FT.infoSoft },
  depart: { label: 'Départ', color: FT.danger, bg: FT.dangerSoft },
  recouche: { label: 'Recouche', color: FT.orange, bg: '#fff7ed' },
  hors_service: { label: 'H.S.', color: '#6b7280', bg: '#f3f4f6' },
}

const CLEANING_STATUS_CONFIG = {
  none: { label: 'À faire', color: FT.warning, bg: FT.warningSoft },
  en_cours: { label: 'En cours', color: FT.info, bg: FT.infoSoft },
  nettoyee: { label: 'Nettoyée', color: FT.teal, bg: FT.tealSoft },
  validee: { label: 'Validée', color: FT.success, bg: FT.successSoft },
  refusee: { label: 'Refusée', color: FT.danger, bg: FT.dangerSoft },
}

const PRIORITY_CONFIG = {
  basse: { label: 'Basse', color: '#3b82f6' },
  moyenne: { label: 'Moyenne', color: FT.warning },
  haute: { label: 'Haute', color: FT.orange },
  urgente: { label: 'Urgente', color: FT.danger },
}

const CLIENT_BADGE_CONFIG = {
  normal: { label: '', color: 'transparent' },
  vip: { label: 'VIP', color: '#eab308' },
  prioritaire: { label: '★', color: FT.brand },
}

// ═══════════════════════════════════════════════════════════════════════════════
// API HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useHousekeepingData = () => {
  const { currentHotel } = useHotel()
  const [data, setData] = useState({
    stats: null,
    tasks: [],
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
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    
    try {
      const [statsRes, tasksRes, staffRes, inspRes, maintRes, bfastRes, invRes, actRes] = await Promise.all([
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/tasks`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/staff`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/inspections`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/maintenance`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/breakfast`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/inventory`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/activity?limit=20`, { headers }).catch(() => ({ data: [] }))
      ])
      
      setData({
        stats: statsRes.data,
        tasks: tasksRes.data || [],
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
    const token = localStorage.getItem('token')
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
    const token = localStorage.getItem('token')
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
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/tasks/${taskId}/complete`, 
        { task_id: taskId, photos_after: photos, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Nettoyage terminé - En attente de validation')
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const validateInspection = useCallback(async (inspectionId, approved, rating, notes, reason) => {
    if (!hotelId) return
    const token = localStorage.getItem('token')
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
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/assignments/auto`,
        { date: new Date().toISOString().split('T')[0], strategy: 'balanced' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${res.data.assigned} chambres assignées à ${res.data.staff_count} agents`)
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de l\'assignation')
    }
  }, [hotelId, fetchData])

  const updateBreakfast = useCallback(async (orderId, updates) => {
    if (!hotelId) return
    const token = localStorage.getItem('token')
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
    const token = localStorage.getItem('token')
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
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
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
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const KPICard = ({ icon: Icon, value, label, color, highlight }) => (
  <Card className={`relative overflow-hidden ${highlight ? 'border-violet-300 border-2' : ''}`}>
    <CardContent className="p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3`} style={{ backgroundColor: color + '15' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="text-3xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 font-medium mt-1">{label}</div>
      {highlight && (
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
      )}
    </CardContent>
  </Card>
)

const RoomChip = ({ room, task, onClick }) => {
  const status = task?.status || 'none'
  const roomStatus = room?.status || 'libre'
  const clientBadge = task?.client_badge || 'normal'
  
  const cleanConfig = status === 'completed' 
    ? CLEANING_STATUS_CONFIG.nettoyee 
    : status === 'in_progress' 
      ? CLEANING_STATUS_CONFIG.en_cours 
      : CLEANING_STATUS_CONFIG.none

  const badgeConfig = CLIENT_BADGE_CONFIG[clientBadge]

  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-sm font-semibold transition-all hover:scale-105 hover:shadow-md"
      style={{ 
        backgroundColor: cleanConfig.bg,
        borderColor: cleanConfig.color + '40',
        color: cleanConfig.color
      }}
    >
      {clientBadge !== 'normal' && (
        <span className="absolute -top-1 -right-1 text-xs" style={{ color: badgeConfig.color }}>
          {badgeConfig.label}
        </span>
      )}
      {task?.room_number || room?.number || '---'}
    </button>
  )
}

const TaskCard = ({ task, onStart, onComplete, showActions = true }) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.moyenne
  const statusLabels = {
    pending: 'À faire',
    in_progress: 'En cours',
    completed: 'Terminé'
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: priorityConfig.color }} />
        <CardContent className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-slate-800">{task.room_number}</span>
              <Badge variant="outline" className="text-xs">{task.room_type}</Badge>
              {task.client_badge === 'vip' && (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">VIP</Badge>
              )}
            </div>
            <Badge 
              className="capitalize" 
              style={{ 
                backgroundColor: task.status === 'completed' ? FT.successSoft : task.status === 'in_progress' ? FT.infoSoft : FT.warningSoft,
                color: task.status === 'completed' ? FT.success : task.status === 'in_progress' ? FT.info : FT.warning,
                borderColor: 'transparent'
              }}
            >
              {statusLabels[task.status]}
            </Badge>
          </div>
          
          <div className="text-sm text-slate-600 mb-2">
            {task.cleaning_type === 'departure_cleaning' ? '🚪 Départ' : task.cleaning_type === 'stay_cleaning' ? '🔄 Recouche' : '✨ Autre'}
            {task.guest_name && <span className="ml-2">• {task.guest_name}</span>}
          </div>
          
          {task.assigned_to_name && (
            <div className="text-xs text-slate-500 mb-2">
              👤 {task.assigned_to_name}
            </div>
          )}
          
          {task.vip_instructions && (
            <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded mb-2">
              ⚠️ {task.vip_instructions}
            </div>
          )}
          
          {showActions && (
            <div className="flex gap-2 mt-3">
              {task.status === 'pending' && (
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => onStart(task.id)}>
                  <Play size={14} className="mr-1" /> Démarrer
                </Button>
              )}
              {task.status === 'in_progress' && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onComplete(task.id)}>
                  <CheckCircle size={14} className="mr-1" /> Terminer
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

const InspectionCard = ({ inspection, onValidate, onRefuse }) => {
  const [showRefuseDialog, setShowRefuseDialog] = useState(false)
  const [refuseReason, setRefuseReason] = useState('')

  const statusConfig = {
    en_attente: { label: 'À valider', color: FT.warning, bg: FT.warningSoft },
    valide: { label: 'Validée', color: FT.success, bg: FT.successSoft },
    refuse: { label: 'Refusée', color: FT.danger, bg: FT.dangerSoft }
  }
  const config = statusConfig[inspection.status] || statusConfig.en_attente

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: config.color }} />
        <CardContent className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-slate-800">{inspection.room_number}</span>
              <Badge variant="outline" className="text-xs">{inspection.room_type}</Badge>
            </div>
            <Badge style={{ backgroundColor: config.bg, color: config.color, borderColor: 'transparent' }}>
              {config.label}
            </Badge>
          </div>
          
          <div className="text-sm text-slate-600 mb-2">
            Nettoyée par {inspection.cleaned_by_name}
          </div>
          
          <div className="text-xs text-slate-500">
            {new Date(inspection.completed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          {inspection.status === 'en_attente' && (
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                onClick={() => onValidate(inspection.id, true, 5, '', '')}
              >
                <CheckCircle2 size={14} className="mr-1" /> Valider
              </Button>
              <Dialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="flex-1">
                    <XCircle size={14} className="mr-1" /> Refuser
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Refuser la chambre {inspection.room_number}</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <label className="text-sm font-medium text-slate-700">Motif du refus</label>
                    <Input 
                      className="mt-2"
                      placeholder="Ex: Salle de bain pas nettoyée"
                      value={refuseReason}
                      onChange={(e) => setRefuseReason(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowRefuseDialog(false)}>Annuler</Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        onValidate(inspection.id, false, 0, '', refuseReason)
                        setShowRefuseDialog(false)
                        setRefuseReason('')
                      }}
                    >
                      Confirmer le refus
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          {inspection.status === 'refuse' && inspection.refused_reason && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
              ❌ {inspection.refused_reason}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

const StaffCard = ({ staff, tasks }) => {
  const assignedTasks = tasks.filter(t => t.assigned_to === staff.id)
  const completed = assignedTasks.filter(t => t.status === 'completed').length
  const loadPercent = staff.max_rooms_per_day > 0 
    ? Math.round((assignedTasks.length / staff.max_rooms_per_day) * 100) 
    : 0
  const loadColor = loadPercent > 80 ? FT.danger : loadPercent > 50 ? FT.warning : FT.success

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <span className="text-sm font-bold text-violet-600">
              {staff.first_name?.[0]}{staff.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-800">{staff.first_name} {staff.last_name}</div>
            <div className="text-xs text-slate-500 capitalize">{staff.role?.replace('_', ' ')}</div>
          </div>
          <Badge 
            className="capitalize"
            style={{ 
              backgroundColor: staff.status === 'available' ? FT.successSoft : staff.status === 'busy' ? FT.warningSoft : '#f3f4f6',
              color: staff.status === 'available' ? FT.success : staff.status === 'busy' ? FT.warning : '#6b7280'
            }}
          >
            {staff.status === 'available' ? 'Disponible' : staff.status === 'busy' ? 'Occupé' : 'Absent'}
          </Badge>
        </div>
        
        {staff.role === 'femme_de_chambre' && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Progress value={loadPercent} className="flex-1 h-2" style={{ '--progress-color': loadColor }} />
              <span className="text-xs text-slate-600">{assignedTasks.length}/{staff.max_rooms_per_day}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {assignedTasks.slice(0, 8).map(task => (
                <RoomChip key={task.id} task={task} />
              ))}
              {assignedTasks.length > 8 && (
                <span className="text-xs text-slate-500 self-center">+{assignedTasks.length - 8}</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const ActivityFeed = ({ events }) => (
  <div className="space-y-2 max-h-[300px] overflow-y-auto">
    {events.map((event, idx) => (
      <div key={event.id || idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          event.type === 'cleaning' ? 'bg-emerald-100 text-emerald-600' :
          event.type === 'maintenance' ? 'bg-orange-100 text-orange-600' :
          event.type === 'checkout' ? 'bg-red-100 text-red-600' :
          event.type === 'checkin' ? 'bg-blue-100 text-blue-600' :
          'bg-slate-100 text-slate-600'
        }`}>
          {event.type === 'cleaning' ? <Brush size={14} /> :
           event.type === 'maintenance' ? <Wrench size={14} /> :
           event.type === 'checkout' ? <ArrowRight size={14} /> :
           <Home size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-700">{event.description}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            {event.room_number && <span className="font-medium">Ch. {event.room_number}</span>}
            {event.staff_name && <span>• {event.staff_name}</span>}
            <span>• {new Date(event.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

const DirectionView = ({ data, actions }) => {
  const { stats, tasks, staff, inspections, maintenance, breakfast, activity } = data

  const housekeepers = staff.filter(s => s.role === 'femme_de_chambre' && s.status !== 'off')
  const pendingInspections = inspections.filter(i => i.status === 'en_attente')
  const urgentMaintenance = maintenance.filter(m => m.priority === 'haute' || m.priority === 'urgente').filter(m => m.status !== 'resolu')
  const breakfastToPrepare = breakfast.filter(b => b.status === 'a_preparer')

  const tasksByFloor = useMemo(() => {
    const floors = [...new Set(tasks.map(t => t.floor))].sort((a, b) => a - b)
    return floors.map(floor => ({
      floor,
      tasks: tasks.filter(t => t.floor === floor)
    }))
  }, [tasks])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord Direction</h1>
          <p className="text-slate-500 capitalize">{today}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={actions.refresh}>
            <RefreshCw size={16} className="mr-2" /> Actualiser
          </Button>
          <Button onClick={actions.autoAssign} className="bg-violet-600 hover:bg-violet-700">
            <Zap size={16} className="mr-2" /> Auto-assigner
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard 
          icon={TrendingUp} 
          value={`${stats?.completion_rate || 0}%`} 
          label="Progression" 
          color={FT.brand} 
          highlight 
        />
        <KPICard 
          icon={Bed} 
          value={stats?.departures || 0} 
          label="Départs" 
          color={FT.danger} 
        />
        <KPICard 
          icon={Sparkles} 
          value={stats?.rooms_validated || 0} 
          label="Validées" 
          color={FT.success} 
        />
        <KPICard 
          icon={Wrench} 
          value={urgentMaintenance.length} 
          label="Maintenance" 
          color={FT.warning} 
        />
      </div>

      {/* Alerts */}
      {(urgentMaintenance.length > 0 || pendingInspections.length > 0 || breakfastToPrepare.length > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 mb-3">⚠️ Alertes du jour</h3>
            <div className="space-y-2">
              {urgentMaintenance.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span>{urgentMaintenance.length} intervention(s) urgente(s)</span>
                </div>
              )}
              {pendingInspections.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-amber-500" />
                  <span>{pendingInspections.length} chambre(s) à valider</span>
                </div>
              )}
              {breakfastToPrepare.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Coffee size={14} className="text-blue-500" />
                  <span>{breakfastToPrepare.length} petit(s)-déjeuner(s) à préparer</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Plan */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Plan des chambres</CardTitle>
              <span className="text-sm text-slate-500">{tasks.length} chambres</span>
            </div>
          </CardHeader>
          <CardContent>
            {tasksByFloor.map(({ floor, tasks: floorTasks }) => (
              <div key={floor} className="mb-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Étage {floor}
                </div>
                <div className="flex flex-wrap gap-2">
                  {floorTasks.map(task => (
                    <RoomChip key={task.id} task={task} />
                  ))}
                </div>
              </div>
            ))}
            {tasksByFloor.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Bed size={32} className="mx-auto mb-2 opacity-50" />
                <p>Aucune tâche pour aujourd'hui</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={actions.seedData}>
                  Créer des données de démo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History size={16} /> Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <ActivityFeed events={activity} />
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>Aucune activité</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users size={16} /> Équipe du jour
            </CardTitle>
            <span className="text-sm text-slate-500">{housekeepers.length} agents actifs</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {housekeepers.map(s => (
              <StaffCard key={s.id} staff={s} tasks={tasks} />
            ))}
          </div>
          {housekeepers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>Aucun agent disponible</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const GouvernanteView = ({ data, actions }) => {
  const { inspections, tasks, staff, inventory } = data
  const [activeTab, setActiveTab] = useState('validation')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const housekeepers = staff.filter(s => s.role === 'femme_de_chambre')
  const lowStockItems = inventory.filter(i => i.current_stock <= i.minimum_threshold)

  const filteredInspections = useMemo(() => {
    let result = inspections
    if (statusFilter !== 'all') result = result.filter(i => i.status === statusFilter)
    if (searchText) {
      const s = searchText.toLowerCase()
      result = result.filter(i => 
        i.room_number.includes(s) || 
        i.cleaned_by_name?.toLowerCase().includes(s)
      )
    }
    return result
  }, [inspections, statusFilter, searchText])

  const stats = {
    pending: inspections.filter(i => i.status === 'en_attente').length,
    validated: inspections.filter(i => i.status === 'valide').length,
    refused: inspections.filter(i => i.status === 'refuse').length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Supervision Gouvernante</h1>
        <Button variant="outline" onClick={actions.refresh}>
          <RefreshCw size={16} className="mr-2" /> Actualiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <CheckCircle size={14} /> Validation
            {stats.pending > 0 && (
              <Badge className="ml-1 bg-amber-100 text-amber-700">{stats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="equipe" className="flex items-center gap-2">
            <Users size={14} /> Équipe
          </TabsTrigger>
          <TabsTrigger value="stocks" className="flex items-center gap-2">
            <Package size={14} /> Stocks
            {lowStockItems.length > 0 && (
              <Badge className="ml-1 bg-red-100 text-red-700">{lowStockItems.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="mt-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{stats.pending}</div>
                <div className="text-xs text-slate-500">À valider</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{stats.validated}</div>
                <div className="text-xs text-slate-500">Validées</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{stats.refused}</div>
                <div className="text-xs text-slate-500">Refusées</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-9"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="en_attente">À valider</SelectItem>
                <SelectItem value="valide">Validées</SelectItem>
                <SelectItem value="refuse">Refusées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inspections List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInspections.map(insp => (
              <InspectionCard 
                key={insp.id} 
                inspection={insp} 
                onValidate={actions.validateInspection}
              />
            ))}
          </div>
          {filteredInspections.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune inspection en attente</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="equipe" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-slate-700">{housekeepers.length} agents de ménage</h2>
            <Button onClick={actions.autoAssign} className="bg-violet-600 hover:bg-violet-700">
              <Zap size={16} className="mr-2" /> Répartir automatiquement
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {housekeepers.map(s => (
              <StaffCard key={s.id} staff={s} tasks={tasks} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stocks" className="mt-4 space-y-4">
          {lowStockItems.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-red-800 mb-2">⚠️ {lowStockItems.length} article(s) en stock bas</h3>
                <div className="space-y-2">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.item_name}</span>
                      <span className="text-red-600 font-medium">{item.current_stock} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventaire complet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventory.map(item => {
                  const isLow = item.current_stock <= item.minimum_threshold
                  const percent = Math.min(100, (item.current_stock / (item.minimum_threshold * 3)) * 100)
                  const barColor = isLow ? FT.danger : percent < 50 ? FT.warning : FT.success
                  
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.item_name}</span>
                        <span className={isLow ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {item.current_stock} {item.unit}
                        </span>
                      </div>
                      <Progress value={percent} className="h-1.5" style={{ '--progress-color': barColor }} />
                      <div className="text-xs text-slate-500">{item.location} • Seuil: {item.minimum_threshold}</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const FemmeDeChambreView = ({ data, actions }) => {
  const { tasks, staff } = data
  const [activeTab, setActiveTab] = useState('todo')

  // Simulating current user as first housekeeper
  const currentStaff = staff.find(s => s.role === 'femme_de_chambre') || {}
  const myTasks = tasks.filter(t => t.assigned_to === currentStaff.id || !t.assigned_to)

  const todoTasks = myTasks.filter(t => t.status === 'pending')
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress')
  const doneTasks = myTasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header - Mobile style */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-lg font-bold">
              {currentStaff.first_name?.[0]}{currentStaff.last_name?.[0]}
            </span>
          </div>
          <div>
            <div className="font-semibold">{currentStaff.first_name || 'Agent'} {currentStaff.last_name || ''}</div>
            <div className="text-sm text-violet-200">Femme de chambre</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <div className="text-2xl font-bold">{todoTasks.length}</div>
            <div className="text-xs text-violet-200">À faire</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
            <div className="text-xs text-violet-200">En cours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{doneTasks.length}</div>
            <div className="text-xs text-violet-200">Terminées</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todo">À faire ({todoTasks.length})</TabsTrigger>
          <TabsTrigger value="inprogress">En cours ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="done">Fait ({doneTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="mt-4 space-y-3">
          {todoTasks.map(task => (
            <TaskCard key={task.id} task={task} onStart={actions.startTask} onComplete={actions.completeTask} />
          ))}
          {todoTasks.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
              <p>Toutes les chambres sont assignées !</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inprogress" className="mt-4 space-y-3">
          {inProgressTasks.map(task => (
            <TaskCard key={task.id} task={task} onStart={actions.startTask} onComplete={actions.completeTask} />
          ))}
          {inProgressTasks.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>Aucun nettoyage en cours</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-4 space-y-3">
          {doneTasks.map(task => (
            <TaskCard key={task.id} task={task} showActions={false} />
          ))}
          {doneTasks.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>Aucune chambre terminée</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

const MaintenanceView = ({ data, actions }) => {
  const { maintenance } = data
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')

  const filteredTickets = useMemo(() => {
    let result = maintenance
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter)
    if (searchText) {
      const s = searchText.toLowerCase()
      result = result.filter(t => 
        t.room_number?.includes(s) || 
        t.title?.toLowerCase().includes(s) ||
        t.description?.toLowerCase().includes(s)
      )
    }
    return result
  }, [maintenance, statusFilter, searchText])

  const stats = {
    pending: maintenance.filter(t => t.status === 'en_attente').length,
    inProgress: maintenance.filter(t => t.status === 'en_cours').length,
    resolved: maintenance.filter(t => t.status === 'resolu').length
  }

  const statusConfig = {
    en_attente: { label: 'En attente', color: FT.warning },
    en_cours: { label: 'En cours', color: FT.teal },
    resolu: { label: 'Résolu', color: FT.success }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800">Maintenance</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold" style={{ color: FT.warning }}>{stats.pending}</div>
            <div className="text-xs text-slate-500">En attente</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold" style={{ color: FT.teal }}>{stats.inProgress}</div>
            <div className="text-xs text-slate-500">En cours</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold" style={{ color: FT.success }}>{stats.resolved}</div>
            <div className="text-xs text-slate-500">Résolus</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-9"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="resolu">Résolus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {filteredTickets.map(ticket => {
          const config = statusConfig[ticket.status] || statusConfig.en_attente
          const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.moyenne

          return (
            <Card key={ticket.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex">
                <div className="w-1 shrink-0" style={{ backgroundColor: priorityConfig.color }} />
                <CardContent className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800">Ch. {ticket.room_number}</span>
                    <Badge style={{ backgroundColor: config.color + '20', color: config.color }}>
                      {config.label}
                    </Badge>
                  </div>
                  <div className="font-medium text-slate-700 mb-1">{ticket.title}</div>
                  <div className="text-sm text-slate-500 mb-2">{ticket.description}</div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Signalé par {ticket.reported_by_name}</span>
                    {ticket.assigned_to_name && <span>• Assigné à {ticket.assigned_to_name}</span>}
                  </div>
                  <Badge 
                    className="mt-2" 
                    style={{ backgroundColor: priorityConfig.color + '20', color: priorityConfig.color }}
                  >
                    <AlertTriangle size={10} className="mr-1" /> {priorityConfig.label}
                  </Badge>

                  {ticket.status !== 'resolu' && (
                    <div className="flex gap-2 mt-3">
                      {ticket.status === 'en_attente' && (
                        <Button 
                          size="sm" 
                          className="bg-teal-600 hover:bg-teal-700"
                          onClick={() => actions.updateMaintenance(ticket.id, { status: 'en_cours' })}
                        >
                          <Play size={14} className="mr-1" /> Commencer
                        </Button>
                      )}
                      {ticket.status === 'en_cours' && (
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => actions.updateMaintenance(ticket.id, { status: 'resolu' })}
                        >
                          <CheckCircle size={14} className="mr-1" /> Résoudre
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Wrench size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune intervention</p>
        </div>
      )}
    </div>
  )
}

const BreakfastView = ({ data, actions }) => {
  const { breakfast } = data
  const [activeTab, setActiveTab] = useState('cuisine')

  const cuisineOrders = breakfast.filter(o => o.status === 'a_preparer')
  const deliveryOrders = breakfast.filter(o => o.status === 'prepare' || o.status === 'en_livraison')
  const servedOrders = breakfast.filter(o => o.status === 'servi')

  const statusConfig = {
    a_preparer: { label: 'À préparer', color: FT.warning },
    prepare: { label: 'Préparé', color: '#3b82f6' },
    en_livraison: { label: 'En livraison', color: FT.teal },
    servi: { label: 'Servi', color: FT.success }
  }

  const currentOrders = activeTab === 'cuisine' ? cuisineOrders : activeTab === 'livraison' ? deliveryOrders : servedOrders

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800">Petit-déjeuner</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold" style={{ color: FT.warning }}>{cuisineOrders.length}</div>
            <div className="text-xs text-slate-500">À préparer</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold" style={{ color: FT.teal }}>{deliveryOrders.length}</div>
            <div className="text-xs text-slate-500">En cours</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold" style={{ color: FT.success }}>{servedOrders.length}</div>
            <div className="text-xs text-slate-500">Servis</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cuisine">🍳 Cuisine ({cuisineOrders.length})</TabsTrigger>
          <TabsTrigger value="livraison">🚚 Livraison ({deliveryOrders.length})</TabsTrigger>
          <TabsTrigger value="servi">✅ Servis ({servedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {currentOrders.map(order => {
            const config = statusConfig[order.status]
            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-slate-800">{order.room_number}</span>
                      <Badge style={{ backgroundColor: config.color, color: 'white' }}>
                        {config.label}
                      </Badge>
                    </div>
                    {!order.included && (
                      <Badge className="bg-amber-100 text-amber-700">💰 Payant</Badge>
                    )}
                  </div>
                  <div className="font-medium text-slate-700">{order.guest_name}</div>
                  <div className="text-sm text-slate-500 mb-2">
                    {order.formule} • {order.person_count} pers. • {order.boissons?.join(', ')}
                  </div>
                  {order.options?.length > 0 && (
                    <div className="text-xs text-red-600 mb-2">⚠️ {order.options.join(', ')}</div>
                  )}
                  {order.notes && (
                    <div className="text-xs text-blue-600 italic">📝 {order.notes}</div>
                  )}

                  <div className="flex gap-2 mt-3">
                    {order.status === 'a_preparer' && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => actions.updateBreakfast(order.id, { status: 'prepare' })}
                      >
                        <Coffee size={14} className="mr-1" /> Préparé
                      </Button>
                    )}
                    {order.status === 'prepare' && (
                      <Button 
                        size="sm" 
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={() => actions.updateBreakfast(order.id, { status: 'en_livraison' })}
                      >
                        En livraison
                      </Button>
                    )}
                    {order.status === 'en_livraison' && (
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => actions.updateBreakfast(order.id, { status: 'servi' })}
                      >
                        <CheckCircle size={14} className="mr-1" /> Servi
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {currentOrders.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Coffee size={48} className="mx-auto mb-4 opacity-50" />
              <p>
                {activeTab === 'cuisine' ? 'Aucune commande à préparer' :
                 activeTab === 'livraison' ? 'Aucune livraison en cours' :
                 'Aucun historique'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HousekeepingModule() {
  const [activeView, setActiveView] = useState('direction')
  const data = useHousekeepingData()

  const views = [
    { id: 'direction', label: 'Direction', icon: BarChart3, desktop: true },
    { id: 'gouvernante', label: 'Gouvernante', icon: CheckCircle, desktop: true },
    { id: 'housekeeping', label: 'Ménage', icon: Brush, mobile: true },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, mobile: true },
    { id: 'breakfast', label: 'Petit-déj', icon: Coffee, mobile: true }
  ]

  const actions = {
    refresh: data.refresh,
    seedData: data.seedData,
    startTask: data.startTask,
    completeTask: data.completeTask,
    validateInspection: data.validateInspection,
    autoAssign: data.autoAssign,
    updateBreakfast: data.updateBreakfast,
    updateMaintenance: data.updateMaintenance
  }

  if (data.loading && !data.stats) {
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
    <div className="min-h-screen bg-slate-50">
      {/* Sub Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {views.map(view => {
              const Icon = view.icon
              const isActive = activeView === view.id
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                    ${isActive 
                      ? 'bg-violet-100 text-violet-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  data-testid={`hk-nav-${view.id}`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{view.label}</span>
                  {view.mobile && <span className="text-xs text-slate-400 hidden lg:inline">(Mobile)</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeView === 'direction' && <DirectionView data={data} actions={actions} />}
        {activeView === 'gouvernante' && <GouvernanteView data={data} actions={actions} />}
        {activeView === 'housekeeping' && <FemmeDeChambreView data={data} actions={actions} />}
        {activeView === 'maintenance' && <MaintenanceView data={data} actions={actions} />}
        {activeView === 'breakfast' && <BreakfastView data={data} actions={actions} />}
      </div>
    </div>
  )
}

export { HousekeepingModule }
