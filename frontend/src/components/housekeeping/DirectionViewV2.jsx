/**
 * DirectionViewV2 - Dashboard Direction avec API V2
 * Vue temps réel des KPIs, plan des chambres, équipe active
 */

import { useState, useMemo, useCallback, Fragment } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp, AlertTriangle, CheckCircle, Clock, Wrench, Coffee,
  BedDouble, Users, ArrowRight, Sparkles, History, MapPin, Zap,
  LayoutGrid, BarChart3, FileText, ChevronRight, Package, 
  RefreshCw, Wifi, WifiOff, Loader2, Calendar, Target, Award,
  ArrowUpRight, ArrowDownRight, Timer, Settings
} from 'lucide-react'
import CategoriesConfig from './CategoriesConfig'

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
  orange: '#F97316',
}

const ROOM_STATUS_CONFIG = {
  libre: { label: 'Libre', color: '#22C55E', bg: '#DCFCE7' },
  occupe: { label: 'Occupée', color: '#3B82F6', bg: '#DBEAFE' },
  depart: { label: 'Départ', color: '#EF4444', bg: '#FEE2E2' },
  recouche: { label: 'Recouche', color: '#F97316', bg: '#FFEDD5' },
  hors_service: { label: 'H.S.', color: '#6B7280', bg: '#F3F4F6' },
}

const CLEANING_STATUS_CONFIG = {
  none: { label: 'À faire', color: '#6B7280', border: 'transparent' },
  en_cours: { label: 'En cours', color: '#F59E0B', border: '#F59E0B' },
  nettoyee: { label: 'Terminé', color: '#F59E0B', border: '#F59E0B' },
  validee: { label: 'Validé', color: '#22C55E', border: '#22C55E' },
  refusee: { label: 'Refusé', color: '#EF4444', border: '#EF4444' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const KPICard = ({ value, label, icon: Icon, color, colorSoft, trend, trendValue, highlight = false }) => (
  <div 
    className={`bg-white rounded-2xl p-5 border ${highlight ? 'border-violet-300 border-2 shadow-lg' : 'border-slate-100'} transition-all hover:shadow-md`}
  >
    <div className="flex items-start justify-between mb-3">
      <div 
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: colorSoft }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        }`}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trendValue}
        </div>
      )}
    </div>
    <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM CHIP COMPONENT (Floor Plan)
// ═══════════════════════════════════════════════════════════════════════════════

const RoomChip = ({ room, onClick }) => {
  const statusConfig = ROOM_STATUS_CONFIG[room.status] || ROOM_STATUS_CONFIG.libre
  const cleaningConfig = CLEANING_STATUS_CONFIG[room.cleaning_status] || CLEANING_STATUS_CONFIG.none
  
  return (
    <button
      onClick={() => onClick(room)}
      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2"
      style={{ 
        backgroundColor: statusConfig.bg, 
        borderColor: cleaningConfig.border,
      }}
      data-testid={`room-chip-${room.room_number}`}
    >
      <span className="font-bold text-base" style={{ color: statusConfig.color }}>
        {room.room_number}
      </span>
      {room.client_badge === 'vip' && (
        <span className="text-[8px] text-amber-600 font-bold">VIP</span>
      )}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const StaffCard = ({ member }) => {
  const progressPercent = member.max_load > 0 
    ? Math.round((member.completed_today / member.max_load) * 100) 
    : 0
  
  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
  
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all">
      {/* Avatar */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{ background: `linear-gradient(135deg, ${COLORS.brand}, ${COLORS.info})` }}
      >
        {initials}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-slate-800 truncate">
          {member.first_name} {member.last_name}
        </div>
        <div className="text-xs text-slate-400">
          {member.completed_today}/{member.max_load} chambres
        </div>
      </div>
      
      {/* Progress Ring */}
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 transform -rotate-90">
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="#E2E8F0"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke={progressPercent >= 80 ? COLORS.success : COLORS.brand}
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${progressPercent} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-600">
          {progressPercent}%
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const QuickAction = ({ icon: Icon, label, color, colorSoft, onClick, badge }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all flex-1"
  >
    <div 
      className="w-12 h-12 rounded-xl flex items-center justify-center relative"
      style={{ backgroundColor: colorSoft }}
    >
      <Icon size={24} style={{ color }} />
      {badge && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
    <span className="text-xs font-medium text-slate-600 text-center">{label}</span>
  </button>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DirectionViewV2({ data, actions, onNavigate }) {
  const { stats, rooms = [], staff = [], tasks = [], inspections = [], loading, connected } = data
  const { refresh, autoAssign, seedData } = actions
  
  const [selectedFloor, setSelectedFloor] = useState('all')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard | config

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!stats) return null
    const roomStats = stats.rooms || {}
    const taskStats = stats.tasks || {}
    const inspStats = stats.inspections || {}
    
    return {
      totalRooms: roomStats.total || 0,
      occupancy: stats.occupancy_rate || 0,
      cleanliness: stats.cleanliness_rate || 0,
      departures: taskStats.departs || roomStats.depart || 0,
      recouches: taskStats.recouches || roomStats.recouche || 0,
      inProgress: taskStats.en_cours || 0,
      completed: taskStats.termine || 0,
      toValidate: inspStats.en_attente || 0,
      refused: inspStats.refuse || 0,
    }
  }, [stats])

  // Get unique floors
  const floors = useMemo(() => {
    const uniqueFloors = [...new Set(rooms.map(r => r.floor))].filter(f => f != null).sort()
    return uniqueFloors
  }, [rooms])

  // Filter rooms by floor
  const filteredRooms = useMemo(() => {
    if (selectedFloor === 'all') return rooms
    return rooms.filter(r => r.floor === parseInt(selectedFloor))
  }, [rooms, selectedFloor])

  // Group rooms by floor for display
  const roomsByFloor = useMemo(() => {
    const grouped = {}
    filteredRooms.forEach(room => {
      const floor = room.floor || 0
      if (!grouped[floor]) grouped[floor] = []
      grouped[floor].push(room)
    })
    return grouped
  }, [filteredRooms])

  // Femmes de chambre actives
  const housekeepers = useMemo(() => {
    return staff.filter(s => s.role === 'femme_de_chambre' && s.active)
  }, [staff])

  // Handle room click
  const handleRoomClick = useCallback((room) => {
    setSelectedRoom(room)
  }, [])

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
    <div className="h-full overflow-auto bg-slate-50 p-6" data-testid="direction-view-v2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord Direction</h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            {connected ? (
              <>
                <Wifi size={14} className="text-emerald-500" />
                <span className="text-emerald-600">Données temps réel</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-amber-500" />
                <span className="text-amber-600">Mode hors ligne</span>
              </>
            )}
            <span className="text-slate-400">•</span>
            <span>Dernière mise à jour: maintenant</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={seedData}>
            Données démo
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'dashboard' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 size={16} />
          Tableau de bord
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'config' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
          data-testid="tab-config"
        >
          <Settings size={16} />
          Configuration
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <CategoriesConfig />
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <Fragment>
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            <KPICard 
              value={kpis?.totalRooms || 0} 
              label="Chambres totales" 
              icon={BedDouble} 
              color={COLORS.brand} 
              colorSoft={COLORS.brandSoft}
            />
            <KPICard 
              value={`${kpis?.occupancy || 0}%`} 
              label="Taux d'occupation" 
              icon={Target} 
              color={COLORS.info} 
              colorSoft={COLORS.infoSoft}
              trend="up"
              trendValue="+5%"
            />
            <KPICard 
              value={kpis?.departures || 0} 
              label="Départs" 
              icon={ArrowRight} 
              color={COLORS.danger} 
              colorSoft={COLORS.dangerSoft}
              highlight={kpis?.departures > 5}
            />
            <KPICard 
              value={kpis?.recouches || 0} 
              label="Recouches" 
              icon={RefreshCw} 
              color={COLORS.warning} 
              colorSoft={COLORS.warningSoft}
            />
            <KPICard 
              value={`${kpis?.cleanliness || 0}%`} 
              label="Propreté validée" 
              icon={CheckCircle} 
              color={COLORS.success} 
              colorSoft={COLORS.successSoft}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Actions rapides</h3>
            <div className="flex gap-3 overflow-x-auto">
              <QuickAction 
                icon={MapPin} 
                label="Plan chambres" 
                color={COLORS.brand} 
                colorSoft={COLORS.brandSoft}
                onClick={() => onNavigate?.('plan')}
              />
              <QuickAction 
                icon={Zap} 
                label="Répartition" 
                color={COLORS.teal} 
                colorSoft="#CCFBF1"
                onClick={() => onNavigate?.('repartition')}
              />
              <QuickAction 
                icon={CheckCircle} 
                label="Contrôles" 
                color={COLORS.success} 
                colorSoft={COLORS.successSoft}
                badge={kpis?.toValidate > 0 ? kpis.toValidate : null}
                onClick={() => onNavigate?.('control')}
              />
              <QuickAction 
                icon={Wrench} 
                label="Maintenance" 
                color={COLORS.orange} 
                colorSoft="#FFEDD5"
                onClick={() => onNavigate?.('maintenance')}
              />
              <QuickAction 
                icon={BarChart3} 
                label="Statistiques" 
                color={COLORS.info} 
                colorSoft={COLORS.infoSoft}
                onClick={() => onNavigate?.('stats')}
              />
              <QuickAction 
                icon={History} 
                label="Historique" 
                color="#6B7280" 
                colorSoft="#F3F4F6"
                onClick={() => onNavigate?.('history')}
              />
            </div>
          </div>

          {/* Main Grid: Floor Plan + Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Floor Plan - 2 cols */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Plan des chambres</h3>
                
                {/* Floor Selector */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setSelectedFloor('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      selectedFloor === 'all' 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Tous
                  </button>
                  {floors.map(floor => (
                    <button
                      key={floor}
                      onClick={() => setSelectedFloor(String(floor))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        selectedFloor === String(floor) 
                          ? 'bg-white text-slate-800 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Ét. {floor}
                    </button>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-4 text-xs">
                {Object.entries(ROOM_STATUS_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}` }} />
                    <span className="text-slate-600">{cfg.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                  <div className="w-3 h-3 rounded border-2" style={{ borderColor: COLORS.success }} />
                  <span className="text-slate-600">Validé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border-2" style={{ borderColor: COLORS.warning }} />
                  <span className="text-slate-600">En cours</span>
                </div>
              </div>

              {/* Rooms Grid by Floor */}
              {Object.entries(roomsByFloor).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, floorRooms]) => (
                <div key={floor} className="mb-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    Étage {floor}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {floorRooms
                      .filter(r => r && r.room_number)
                      .sort((a, b) => (a.room_number || '').localeCompare(b.room_number || ''))
                      .map(room => (
                        <RoomChip key={room._id || room.room_number} room={room} onClick={handleRoomClick} />
                      ))
                    }
                  </div>
                </div>
              ))}

              {rooms.length === 0 && (
                <div className="text-center py-8">
                  <BedDouble size={40} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-500">Aucune chambre</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={seedData}>
                    Créer données démo
                  </Button>
                </div>
              )}
            </div>

            {/* Staff Panel */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Équipe active</h3>
                <Badge variant="outline" className="text-xs">
                  {housekeepers.length} personnes
                </Badge>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {housekeepers.length > 0 ? (
                  housekeepers.map(member => (
                    <StaffCard key={member._id} member={member} />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Users size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">Aucun staff actif</p>
                  </div>
                )}
              </div>

              {/* Auto Assign Button */}
              <Button 
                className="w-full mt-4"
                style={{ background: COLORS.brand }}
                onClick={autoAssign}
              >
                <Zap size={16} className="mr-2" />
                Répartition automatique
              </Button>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Avancement du jour</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cleaning Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Nettoyage</span>
                  <span className="text-sm font-bold" style={{ color: COLORS.brand }}>
                    {kpis?.completed || 0}/{(kpis?.departures || 0) + (kpis?.recouches || 0)}
                  </span>
                </div>
                <Progress 
                  value={((kpis?.completed || 0) / ((kpis?.departures || 1) + (kpis?.recouches || 0))) * 100} 
                  className="h-2"
                />
              </div>

              {/* Validation Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Validation</span>
                  <span className="text-sm font-bold" style={{ color: COLORS.success }}>
                    {kpis?.cleanliness || 0}%
                  </span>
                </div>
                <Progress value={kpis?.cleanliness || 0} className="h-2" />
              </div>

              {/* Alerts */}
              <div className="flex items-center gap-4">
                {kpis?.toValidate > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: COLORS.warningSoft }}>
                    <AlertTriangle size={16} style={{ color: COLORS.warning }} />
                    <span className="text-sm font-medium" style={{ color: COLORS.warning }}>
                      {kpis.toValidate} à valider
                    </span>
                  </div>
                )}
                {kpis?.refused > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: COLORS.dangerSoft }}>
                    <AlertTriangle size={16} style={{ color: COLORS.danger }} />
                    <span className="text-sm font-medium" style={{ color: COLORS.danger }}>
                      {kpis.refused} refusé(s)
                    </span>
                  </div>
                )}
                {!kpis?.toValidate && !kpis?.refused && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: COLORS.successSoft }}>
                    <CheckCircle size={16} style={{ color: COLORS.success }} />
                    <span className="text-sm font-medium" style={{ color: COLORS.success }}>
                      Tout est en ordre
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  )
}
