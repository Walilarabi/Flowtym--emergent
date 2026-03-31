/**
 * DirectionDashboard - Dashboard principal de la Direction
 * Basé sur les maquettes PDF FLOWTYM
 * 
 * Sections:
 * - KPIs principaux (Occupation, Propreté, Départs, Maintenance)
 * - Alertes du jour
 * - Activité en temps réel
 * - Satisfaction clients
 * - Incidents
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  BedDouble, Users, ArrowRight, AlertTriangle, CheckCircle, Clock,
  Wrench, Star, MessageSquare, Droplets, Wind, Lightbulb, ShowerHead,
  RefreshCw, Wifi, WifiOff, Loader2, ChevronRight, Activity, Bell,
  ThumbsUp, ThumbsDown, Eye, Calendar, TrendingUp, TrendingDown,
  Package, FileText, Settings, UserCheck
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
  brand: '#5B4ED1',
  brandSoft: '#E8E5FF',
  success: '#22C55E',
  successSoft: '#DCFCE7',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',
  teal: '#14B8A6',
  tealSoft: '#CCFBF1',
  orange: '#F97316',
  orangeSoft: '#FFEDD5',
  slate: '#64748B',
  slateSoft: '#F1F5F9',
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI CARD - Grande carte avec progression circulaire
// ═══════════════════════════════════════════════════════════════════════════════

const KPICardLarge = ({ value, label, subValue, icon: Icon, color, colorSoft, progress, onClick }) => (
  <div 
    className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg transition-all cursor-pointer"
    onClick={onClick}
    data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold" style={{ color }}>{value}</span>
          {subValue && (
            <span className="text-lg text-slate-400">{subValue}</span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
      </div>
      <div className="relative">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={colorSoft}
            strokeWidth="6"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${(progress || 0) * 1.76} 176`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// KPI CARD - Petite carte avec badge
// ═══════════════════════════════════════════════════════════════════════════════

const KPICardSmall = ({ value, label, icon: Icon, color, colorSoft, badge, trend, onClick }) => (
  <div 
    className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
    onClick={onClick}
  >
    <div 
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: colorSoft }}
    >
      <Icon size={22} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {badge && (
          <Badge 
            className="text-xs" 
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.text}
          </Badge>
        )}
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            trend > 0 ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 truncate">{label}</p>
    </div>
    <ChevronRight size={20} className="text-slate-300" />
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT ITEM - Ligne d'alerte
// ═══════════════════════════════════════════════════════════════════════════════

const ALERT_TYPES = {
  urgent: { color: COLORS.danger, bg: COLORS.dangerSoft, icon: AlertTriangle, label: 'Urgent' },
  validation: { color: COLORS.warning, bg: COLORS.warningSoft, icon: CheckCircle, label: 'À valider' },
  preparation: { color: COLORS.info, bg: COLORS.infoSoft, icon: Clock, label: 'À préparer' },
  maintenance: { color: COLORS.orange, bg: COLORS.orangeSoft, icon: Wrench, label: 'Maintenance' },
  info: { color: COLORS.slate, bg: COLORS.slateSoft, icon: Bell, label: 'Info' },
}

const AlertItem = ({ type, title, description, time, count, onClick }) => {
  const config = ALERT_TYPES[type] || ALERT_TYPES.info
  const Icon = config.icon
  
  return (
    <div 
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={18} style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800 text-sm">{title}</span>
          {count > 1 && (
            <Badge variant="secondary" className="text-xs">{count}</Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>
      <span className="text-xs text-slate-400 flex-shrink-0">{time}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY ITEM - Ligne d'activité temps réel
// ═══════════════════════════════════════════════════════════════════════════════

const ACTIVITY_ICONS = {
  check_in: { icon: UserCheck, color: COLORS.success, bg: COLORS.successSoft },
  check_out: { icon: ArrowRight, color: COLORS.danger, bg: COLORS.dangerSoft },
  cleaning_start: { icon: BedDouble, color: COLORS.warning, bg: COLORS.warningSoft },
  cleaning_end: { icon: CheckCircle, color: COLORS.success, bg: COLORS.successSoft },
  validation: { icon: ThumbsUp, color: COLORS.success, bg: COLORS.successSoft },
  refusal: { icon: ThumbsDown, color: COLORS.danger, bg: COLORS.dangerSoft },
  feedback: { icon: Star, color: COLORS.warning, bg: COLORS.warningSoft },
  incident: { icon: AlertTriangle, color: COLORS.danger, bg: COLORS.dangerSoft },
  maintenance: { icon: Wrench, color: COLORS.orange, bg: COLORS.orangeSoft },
  found_item: { icon: Package, color: COLORS.teal, bg: COLORS.tealSoft },
}

const ActivityItem = ({ type, room, description, time, staff }) => {
  const config = ACTIVITY_ICONS[type] || ACTIVITY_ICONS.check_in
  const Icon = config.icon
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={14} style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {room && (
            <Badge variant="outline" className="text-xs font-mono">{room}</Badge>
          )}
          <span className="text-sm text-slate-700">{description}</span>
        </div>
        {staff && (
          <p className="text-xs text-slate-400 mt-0.5">{staff}</p>
        )}
      </div>
      <span className="text-xs text-slate-400 flex-shrink-0">{time}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INCIDENT CARD - Carte d'incident
// ═══════════════════════════════════════════════════════════════════════════════

const INCIDENT_ICONS = {
  proprete: { icon: BedDouble, color: COLORS.warning },
  plomberie: { icon: Droplets, color: COLORS.info },
  climatisation: { icon: Wind, color: COLORS.teal },
  electricite: { icon: Lightbulb, color: COLORS.warning },
  salle_de_bain: { icon: ShowerHead, color: COLORS.info },
  autre: { icon: AlertTriangle, color: COLORS.slate },
}

const IncidentCard = ({ room, category, rating, description, time, onClick }) => {
  const config = INCIDENT_ICONS[category] || INCIDENT_ICONS.autre
  const Icon = config.icon
  
  return (
    <div 
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon size={18} style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800 text-sm">Chambre {room}</span>
          <span className="text-slate-400">–</span>
          <span className="text-sm text-slate-600 capitalize">{category?.replace('_', ' ')}</span>
        </div>
        {rating && (
          <div className="flex items-center gap-1 mt-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star 
                key={i} 
                size={12} 
                className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} 
              />
            ))}
            <span className="text-xs text-slate-500 ml-1">{rating}/5</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{description}</p>
        )}
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM STATUS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

const RoomStatusSummary = ({ stats, onClick }) => {
  const items = [
    { label: 'Propres', value: stats?.propres || 0, color: COLORS.success },
    { label: 'À nettoyer', value: stats?.a_nettoyer || 0, color: COLORS.danger },
    { label: 'En cours', value: stats?.en_cours || 0, color: COLORS.warning },
    { label: 'Occupées', value: stats?.occupees || 0, color: COLORS.info },
    { label: 'Inspection', value: stats?.inspection || 0, color: COLORS.brand },
    { label: 'H.S.', value: stats?.hors_service || 0, color: COLORS.slate },
  ]
  
  return (
    <div 
      className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">État des chambres</h3>
        <ChevronRight size={18} className="text-slate-400" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: item.color }}
            >
              {item.value}
            </div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOUSEKEEPING SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

const HousekeepingSummary = ({ staff, tasks, onClick }) => {
  // Group tasks by assignee
  const tasksByStaff = useMemo(() => {
    const grouped = {}
    tasks?.forEach(task => {
      const assignee = task.assigned_to_name || 'Non assigné'
      if (!grouped[assignee]) {
        grouped[assignee] = { a_nettoyer: 0, en_cours: 0, termines: 0 }
      }
      if (task.status === 'a_faire') grouped[assignee].a_nettoyer++
      else if (task.status === 'en_cours') grouped[assignee].en_cours++
      else if (task.status === 'termine' || task.status === 'valide') grouped[assignee].termines++
    })
    return grouped
  }, [tasks])
  
  const activeStaff = staff?.filter(s => s.role === 'femme_de_chambre' && s.active) || []
  
  return (
    <div 
      className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Housekeeping du jour</h3>
        <ChevronRight size={18} className="text-slate-400" />
      </div>
      <div className="space-y-3">
        {activeStaff.slice(0, 3).map((member) => {
          const memberTasks = tasksByStaff[member.name] || { a_nettoyer: 0, en_cours: 0, termines: 0 }
          return (
            <div key={member._id || member.name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-semibold">
                {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{member.name}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-red-500">{memberTasks.a_nettoyer} à nettoyer</span>
                  <span className="text-amber-500">{memberTasks.en_cours} en cours</span>
                  <span className="text-emerald-500">{memberTasks.termines} terminés</span>
                </div>
              </div>
            </div>
          )
        })}
        {activeStaff.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Aucun staff actif</p>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SATISFACTION SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

const SatisfactionSummary = ({ rating, reviewCount, onClick }) => (
  <div 
    className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-all cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-slate-800">Satisfaction clients</h3>
      <ChevronRight size={18} className="text-slate-400" />
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star 
              key={i} 
              size={20} 
              className={i <= Math.round(rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} 
            />
          ))}
        </div>
        <span className="text-lg font-bold text-slate-800">{rating?.toFixed(1) || '0.0'}/5</span>
      </div>
      <div className="text-sm text-slate-500">
        <span className="font-semibold text-slate-700">{reviewCount || 0}</span> avis collectés
      </div>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DirectionDashboard({ 
  data, 
  actions, 
  onNavigate,
  reportsStats,
  foundItemsStats,
  activityLog 
}) {
  const { 
    stats, 
    rooms = [], 
    staff = [], 
    tasks = [], 
    inspections = [],
    maintenance = [],
    loading, 
    connected 
  } = data
  const { refresh, seedData } = actions

  // Current date
  const today = new Date()
  const formattedDate = today.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!stats) return null
    const roomStats = stats.rooms || {}
    const taskStats = stats.tasks || {}
    
    return {
      occupation: stats.occupancy_rate || 0,
      proprete: stats.cleanliness_rate || 0,
      departures: taskStats.departs || roomStats.depart || 0,
      maintenance: maintenance?.filter(m => m.status === 'en_attente' || m.status === 'en_cours').length || 0,
      totalRooms: roomStats.total || 0,
      occupees: roomStats.occupe || 0,
      disponibles: roomStats.libre || 0,
      horsService: roomStats.hors_service || 0,
    }
  }, [stats, maintenance])

  // Room status stats
  const roomStatusStats = useMemo(() => {
    const propres = rooms.filter(r => r.cleaning_status === 'validee').length
    const aNettoyer = rooms.filter(r => !r.cleaning_status || r.cleaning_status === 'none').length
    const enCours = rooms.filter(r => r.cleaning_status === 'en_cours').length
    const occupees = rooms.filter(r => r.status === 'occupe').length
    const inspection = rooms.filter(r => r.cleaning_status === 'nettoyee').length
    const horsService = rooms.filter(r => r.status === 'hors_service').length
    
    return { propres, a_nettoyer: aNettoyer, en_cours: enCours, occupees, inspection, hors_service: horsService }
  }, [rooms])

  // Generate alerts from data
  const alerts = useMemo(() => {
    const alertsList = []
    
    // Urgent interventions (maintenance en retard)
    const urgentMaintenance = maintenance?.filter(m => m.priority === 'haute' && m.status === 'en_attente') || []
    if (urgentMaintenance.length > 0) {
      alertsList.push({
        type: 'urgent',
        title: 'Interventions urgentes',
        description: `${urgentMaintenance.length} maintenance(s) à traiter immédiatement`,
        time: 'Maintenant',
        count: urgentMaintenance.length,
      })
    }
    
    // Rooms to validate
    const toValidate = inspections?.filter(i => i.status === 'en_attente') || []
    if (toValidate.length > 0) {
      alertsList.push({
        type: 'validation',
        title: 'Chambres à valider',
        description: `${toValidate.length} chambre(s) en attente de validation`,
        time: 'En attente',
        count: toValidate.length,
      })
    }
    
    // Pending reports
    if (reportsStats?.pending > 0) {
      alertsList.push({
        type: 'maintenance',
        title: 'Signalements en attente',
        description: `${reportsStats.pending} signalement(s) à traiter`,
        time: 'Aujourd\'hui',
        count: reportsStats.pending,
      })
    }
    
    // Found items
    if (foundItemsStats?.pending > 0) {
      alertsList.push({
        type: 'info',
        title: 'Objets trouvés',
        description: `${foundItemsStats.pending} objet(s) en attente de consignation`,
        time: 'Aujourd\'hui',
        count: foundItemsStats.pending,
      })
    }
    
    // Departures to prepare
    const departures = tasks?.filter(t => t.type === 'depart' && t.status === 'a_faire') || []
    if (departures.length > 0) {
      alertsList.push({
        type: 'preparation',
        title: 'Départs à préparer',
        description: `${departures.length} chambre(s) à préparer pour les départs`,
        time: 'Ce matin',
        count: departures.length,
      })
    }
    
    return alertsList
  }, [maintenance, inspections, tasks, reportsStats, foundItemsStats])

  // Generate incidents from reports
  const incidents = useMemo(() => {
    // Mock incidents based on pattern - would come from reports API
    return [
      { room: '201', category: 'proprete', rating: 2, description: 'Salle de bain mal nettoyée' },
      { room: '202', category: 'climatisation', description: 'Climatisation en panne' },
      { room: '305', category: 'plomberie', description: 'Fuite robinet salle de bain' },
      { room: '118', category: 'electricite', description: 'Ampoule grillée' },
    ].slice(0, 4)
  }, [])

  // Activity log
  const activities = useMemo(() => {
    if (activityLog && activityLog.length > 0) {
      return activityLog.slice(0, 6).map(a => ({
        type: a.type,
        room: a.room_number,
        description: a.description,
        time: formatDistanceToNow(new Date(a.timestamp), { addSuffix: true, locale: fr }),
        staff: a.staff_name,
      }))
    }
    
    // Fallback mock data
    return [
      { type: 'check_in', room: '201', description: 'Check-in effectué', time: 'il y a 5 min', staff: 'Réception' },
      { type: 'feedback', room: '118', description: 'Nouvel avis client (4/5)', time: 'il y a 12 min' },
      { type: 'cleaning_end', room: '305', description: 'Nettoyage terminé', time: 'il y a 18 min', staff: 'Sophie M.' },
      { type: 'maintenance', room: '202', description: 'Intervention en cours', time: 'il y a 25 min', staff: 'Maintenance' },
      { type: 'validation', room: '410', description: 'Chambre validée', time: 'il y a 32 min', staff: 'Gouvernante' },
      { type: 'incident', room: '118', description: 'Signalement créé', time: 'il y a 45 min', staff: 'Maria L.' },
    ]
  }, [activityLog])

  // Loading state
  if (loading && !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-3" style={{ color: COLORS.brand }} />
          <p className="text-slate-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-slate-50" data-testid="direction-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Bonjour, Direction</h1>
            <p className="text-sm text-slate-500 capitalize">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              {connected ? (
                <>
                  <Wifi size={14} className="text-emerald-500" />
                  <span className="text-emerald-600">Temps réel</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-amber-500" />
                  <span className="text-amber-600">Hors ligne</span>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main KPIs Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICardLarge
            value={`${kpis?.occupation || 0}%`}
            label="Occupation"
            icon={BedDouble}
            color={COLORS.brand}
            colorSoft={COLORS.brandSoft}
            progress={kpis?.occupation || 0}
            onClick={() => onNavigate?.('plan-chambres')}
          />
          <KPICardLarge
            value={`${kpis?.proprete || 0}%`}
            label="Propreté"
            icon={CheckCircle}
            color={COLORS.success}
            colorSoft={COLORS.successSoft}
            progress={kpis?.proprete || 0}
            onClick={() => onNavigate?.('housekeeping')}
          />
          <KPICardLarge
            value={kpis?.departures || 0}
            label="Départs"
            icon={ArrowRight}
            color={COLORS.danger}
            colorSoft={COLORS.dangerSoft}
            progress={((kpis?.departures || 0) / (kpis?.totalRooms || 1)) * 100}
            onClick={() => onNavigate?.('repartition')}
          />
          <KPICardLarge
            value={kpis?.maintenance || 0}
            label="Maintenance"
            icon={Wrench}
            color={COLORS.orange}
            colorSoft={COLORS.orangeSoft}
            progress={0}
            onClick={() => onNavigate?.('maintenance')}
          />
        </div>

        {/* Alerts + Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertes du jour */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Bell size={18} className="text-amber-500" />
                Alertes du jour
              </h3>
              <Badge variant="secondary" className="bg-amber-50 text-amber-600">
                {alerts.length}
              </Badge>
            </div>
            <div className="p-2 max-h-[280px] overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                  <AlertItem
                    key={idx}
                    type={alert.type}
                    title={alert.title}
                    description={alert.description}
                    time={alert.time}
                    count={alert.count}
                    onClick={() => onNavigate?.(alert.type)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm">Aucune alerte</p>
                </div>
              )}
            </div>
          </div>

          {/* Activité en temps réel */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-violet-500" />
                Activité en temps réel
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.('historique')}>
                Voir tout
              </Button>
            </div>
            <div className="px-5 py-2 max-h-[280px] overflow-y-auto">
              {activities.map((activity, idx) => (
                <ActivityItem
                  key={idx}
                  type={activity.type}
                  room={activity.room}
                  description={activity.description}
                  time={activity.time}
                  staff={activity.staff}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Room Status + Housekeeping + Satisfaction */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RoomStatusSummary 
            stats={roomStatusStats}
            onClick={() => onNavigate?.('plan-chambres')}
          />
          <HousekeepingSummary 
            staff={staff}
            tasks={tasks}
            onClick={() => onNavigate?.('repartition')}
          />
          <SatisfactionSummary 
            rating={3.7}
            reviewCount={8}
            onClick={() => onNavigate?.('satisfaction')}
          />
        </div>

        {/* Secondary KPIs + Incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 px-1">Indicateurs rapides</h3>
            <KPICardSmall
              value={reportsStats?.pending || 0}
              label="Signalements en attente"
              icon={AlertTriangle}
              color={COLORS.warning}
              colorSoft={COLORS.warningSoft}
              badge={reportsStats?.pending > 0 ? { text: 'Nouveau', bg: COLORS.dangerSoft, color: COLORS.danger } : null}
              onClick={() => onNavigate?.('signalements')}
            />
            <KPICardSmall
              value={foundItemsStats?.pending || 0}
              label="Objets trouvés en attente"
              icon={Package}
              color={COLORS.teal}
              colorSoft={COLORS.tealSoft}
              onClick={() => onNavigate?.('objets-trouves')}
            />
            <KPICardSmall
              value={kpis?.occupees || 0}
              label="Chambres occupées"
              icon={Users}
              color={COLORS.info}
              colorSoft={COLORS.infoSoft}
              onClick={() => onNavigate?.('plan-chambres')}
            />
          </div>

          {/* Alertes & incidents */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Alertes & incidents</h3>
              <Badge variant="secondary">{incidents.length}</Badge>
            </div>
            <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
              {incidents.map((incident, idx) => (
                <IncidentCard
                  key={idx}
                  room={incident.room}
                  category={incident.category}
                  rating={incident.rating}
                  description={incident.description}
                  onClick={() => onNavigate?.('signalements')}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
