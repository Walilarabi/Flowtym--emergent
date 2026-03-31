/**
 * PlanChambresView - Vue Plan des Chambres par Étage
 * Basé sur les maquettes PDF FLOWTYM (Pages 5-7)
 * 
 * Fonctionnalités:
 * - Vue par étage avec statuts visuels
 * - Filtres par statut
 * - Détail chambre au clic
 * - Alertes chambres en retard
 */

import { useState, useMemo, useCallback } from 'react'
import { 
  BedDouble, Search, Filter, ChevronDown, ChevronUp, Clock,
  CheckCircle, AlertTriangle, Wrench, User, Calendar, X,
  Eye, History, MessageSquare, Loader2, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

const ROOM_STATUS = {
  propre: { label: 'Propre', color: COLORS.success, bg: COLORS.successSoft, icon: CheckCircle },
  a_nettoyer: { label: 'À nettoyer', color: COLORS.danger, bg: COLORS.dangerSoft, icon: BedDouble },
  en_cours: { label: 'En cours', color: COLORS.warning, bg: COLORS.warningSoft, icon: Clock },
  occupe: { label: 'Occupée', color: COLORS.info, bg: COLORS.infoSoft, icon: User },
  inspection: { label: 'Inspection', color: COLORS.brand, bg: COLORS.brandSoft, icon: Eye },
  hors_service: { label: 'H.S.', color: COLORS.slate, bg: COLORS.slateSoft, icon: Wrench },
}

const CLEANING_STATUS = {
  none: { label: 'À faire', border: 'transparent' },
  en_cours: { label: 'En cours', border: COLORS.warning },
  nettoyee: { label: 'Terminé', border: COLORS.warning },
  validee: { label: 'Validé', border: COLORS.success },
  refusee: { label: 'Refusé', border: COLORS.danger },
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS COUNTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const StatusCounter = ({ status, count, isActive, onClick }) => {
  const config = ROOM_STATUS[status] || ROOM_STATUS.propre
  const Icon = config.icon
  
  return (
    <button
      onClick={() => onClick(status)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        isActive 
          ? 'ring-2 ring-offset-2' 
          : 'hover:bg-slate-50'
      }`}
      style={{ 
        backgroundColor: isActive ? config.bg : 'white',
        borderColor: config.color,
        ringColor: config.color,
      }}
    >
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={16} style={{ color: config.color }} />
      </div>
      <div className="text-left">
        <div className="text-xl font-bold" style={{ color: config.color }}>{count}</div>
        <div className="text-xs text-slate-500">{config.label}</div>
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM CHIP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const RoomChip = ({ room, onClick, isLate = false }) => {
  // Determine room status
  const getRoomDisplayStatus = () => {
    if (room.status === 'hors_service') return 'hors_service'
    if (room.cleaning_status === 'validee') return 'propre'
    if (room.cleaning_status === 'nettoyee') return 'inspection'
    if (room.cleaning_status === 'en_cours') return 'en_cours'
    if (room.status === 'occupe') return 'occupe'
    return 'a_nettoyer'
  }
  
  const displayStatus = getRoomDisplayStatus()
  const statusConfig = ROOM_STATUS[displayStatus] || ROOM_STATUS.a_nettoyer
  const cleaningConfig = CLEANING_STATUS[room.cleaning_status] || CLEANING_STATUS.none
  
  return (
    <button
      onClick={() => onClick(room)}
      className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 ${
        isLate ? 'animate-pulse' : ''
      }`}
      style={{ 
        backgroundColor: statusConfig.bg,
        borderColor: cleaningConfig.border,
      }}
      data-testid={`room-chip-${room.room_number}`}
    >
      {isLate && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle size={10} className="text-white" />
        </div>
      )}
      <span className="text-lg font-bold" style={{ color: statusConfig.color }}>
        {room.room_number}
      </span>
      <span className="text-[10px] text-slate-500">{statusConfig.label}</span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOOR SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const FloorSection = ({ floor, rooms, onRoomClick, isExpanded, onToggle, lateRooms }) => {
  const floorStats = useMemo(() => {
    const stats = { propre: 0, a_nettoyer: 0, en_cours: 0, occupe: 0, inspection: 0, hors_service: 0 }
    rooms.forEach(room => {
      if (room.status === 'hors_service') stats.hors_service++
      else if (room.cleaning_status === 'validee') stats.propre++
      else if (room.cleaning_status === 'nettoyee') stats.inspection++
      else if (room.cleaning_status === 'en_cours') stats.en_cours++
      else if (room.status === 'occupe') stats.occupe++
      else stats.a_nettoyer++
    })
    return stats
  }, [rooms])

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Floor Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <span className="text-lg font-bold text-violet-600">{floor}</span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">Étage {floor}</h3>
            <p className="text-sm text-slate-500">{rooms.length} chambres</p>
          </div>
        </div>
        
        {/* Mini Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.success }} />
              {floorStats.propre}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.danger }} />
              {floorStats.a_nettoyer}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.warning }} />
              {floorStats.en_cours}
            </span>
          </div>
          {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </button>
      
      {/* Room Grid */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-3">
            {rooms
              .sort((a, b) => (a.room_number || '').localeCompare(b.room_number || ''))
              .map(room => (
                <RoomChip 
                  key={room._id || room.room_number} 
                  room={room} 
                  onClick={onRoomClick}
                  isLate={lateRooms.includes(room.room_number)}
                />
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const RoomDetailModal = ({ room, open, onClose, staff, reports }) => {
  if (!room) return null
  
  const getRoomDisplayStatus = () => {
    if (room.status === 'hors_service') return 'hors_service'
    if (room.cleaning_status === 'validee') return 'propre'
    if (room.cleaning_status === 'nettoyee') return 'inspection'
    if (room.cleaning_status === 'en_cours') return 'en_cours'
    if (room.status === 'occupe') return 'occupe'
    return 'a_nettoyer'
  }
  
  const displayStatus = getRoomDisplayStatus()
  const statusConfig = ROOM_STATUS[displayStatus] || ROOM_STATUS.a_nettoyer
  const Icon = statusConfig.icon
  
  // Find assigned staff
  const assignedStaff = staff?.find(s => s._id === room.assigned_to || s.name === room.assigned_to_name)
  
  // Find related reports
  const roomReports = reports?.filter(r => r.room_number === room.room_number) || []

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: statusConfig.bg }}
            >
              <span className="text-xl font-bold" style={{ color: statusConfig.color }}>
                {room.room_number}
              </span>
            </div>
            <div>
              <span className="text-lg">Chambre {room.room_number}</span>
              <Badge 
                className="ml-2 text-xs"
                style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Type de chambre</p>
              <p className="font-semibold text-slate-800">{room.type || 'Standard'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Étage</p>
              <p className="font-semibold text-slate-800">{room.floor || 1}</p>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Assignation</span>
            </div>
            {assignedStaff ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-sm font-semibold">
                  {assignedStaff.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{assignedStaff.name}</p>
                  <p className="text-xs text-slate-500">{assignedStaff.role?.replace('_', ' ')}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Non assignée</p>
            )}
          </div>

          {/* History */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <History size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Historique du jour</span>
            </div>
            <div className="space-y-2 text-sm">
              {room.cleaning_started_at && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Début nettoyage</span>
                  <span className="text-slate-700">
                    {new Date(room.cleaning_started_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {room.cleaning_completed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fin nettoyage</span>
                  <span className="text-slate-700">
                    {new Date(room.cleaning_completed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {!room.cleaning_started_at && !room.cleaning_completed_at && (
                <p className="text-slate-400">Aucune activité</p>
              )}
            </div>
          </div>

          {/* Related Reports */}
          {roomReports.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  Signalements ({roomReports.length})
                </span>
              </div>
              <div className="space-y-2">
                {roomReports.slice(0, 2).map((report, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium text-amber-800">{report.category_name}</span>
                    <span className="text-amber-600 ml-2">({report.status})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Fermer
          </Button>
          <Button className="flex-1 bg-violet-600 hover:bg-violet-700">
            Voir détails complets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PlanChambresView({ data, actions, onNavigate }) {
  const { rooms = [], staff = [], tasks = [], loading } = data
  const { refresh } = actions

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedFloors, setExpandedFloors] = useState({})
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Calculate room stats
  const roomStats = useMemo(() => {
    const stats = { propre: 0, a_nettoyer: 0, en_cours: 0, occupe: 0, inspection: 0, hors_service: 0 }
    rooms.forEach(room => {
      if (room.status === 'hors_service') stats.hors_service++
      else if (room.cleaning_status === 'validee') stats.propre++
      else if (room.cleaning_status === 'nettoyee') stats.inspection++
      else if (room.cleaning_status === 'en_cours') stats.en_cours++
      else if (room.status === 'occupe') stats.occupe++
      else stats.a_nettoyer++
    })
    return stats
  }, [rooms])

  // Get late rooms (departure rooms not started cleaning after 10am)
  const lateRooms = useMemo(() => {
    const now = new Date()
    const tenAM = new Date()
    tenAM.setHours(10, 0, 0, 0)
    
    if (now < tenAM) return []
    
    return rooms
      .filter(room => 
        (room.status === 'depart' || room.task_type === 'depart') && 
        !room.cleaning_status &&
        room.room_number
      )
      .map(room => room.room_number)
  }, [rooms])

  // Filter rooms
  const filteredRooms = useMemo(() => {
    let filtered = rooms

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(room => 
        room.room_number?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(room => {
        if (statusFilter === 'propre') return room.cleaning_status === 'validee'
        if (statusFilter === 'a_nettoyer') return !room.cleaning_status && room.status !== 'occupe' && room.status !== 'hors_service'
        if (statusFilter === 'en_cours') return room.cleaning_status === 'en_cours'
        if (statusFilter === 'occupe') return room.status === 'occupe'
        if (statusFilter === 'inspection') return room.cleaning_status === 'nettoyee'
        if (statusFilter === 'hors_service') return room.status === 'hors_service'
        return true
      })
    }

    return filtered
  }, [rooms, searchQuery, statusFilter])

  // Group rooms by floor
  const roomsByFloor = useMemo(() => {
    const grouped = {}
    filteredRooms.forEach(room => {
      const floor = room.floor || 1
      if (!grouped[floor]) grouped[floor] = []
      grouped[floor].push(room)
    })
    return grouped
  }, [filteredRooms])

  // Get floors sorted
  const floors = useMemo(() => {
    return Object.keys(roomsByFloor).sort((a, b) => Number(a) - Number(b))
  }, [roomsByFloor])

  // Initialize expanded state for all floors
  useMemo(() => {
    if (Object.keys(expandedFloors).length === 0 && floors.length > 0) {
      const initial = {}
      floors.forEach(f => initial[f] = true)
      setExpandedFloors(initial)
    }
  }, [floors])

  // Toggle floor expansion
  const toggleFloor = useCallback((floor) => {
    setExpandedFloors(prev => ({
      ...prev,
      [floor]: !prev[floor]
    }))
  }, [])

  // Handle room click
  const handleRoomClick = useCallback((room) => {
    setSelectedRoom(room)
    setDetailModalOpen(true)
  }, [])

  // Handle status filter click
  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(prev => prev === status ? 'all' : status)
  }, [])

  if (loading && rooms.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-3 text-violet-600" />
          <p className="text-slate-500">Chargement du plan des chambres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-slate-50" data-testid="plan-chambres-view">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Plan des Chambres</h2>
            <p className="text-sm text-slate-500">{rooms.length} chambres • {floors.length} étages</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Status Counters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(ROOM_STATUS).map(([key, config]) => (
            <StatusCounter
              key={key}
              status={key}
              count={roomStats[key] || 0}
              isActive={statusFilter === key}
              onClick={handleStatusFilter}
            />
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher chambre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {statusFilter !== 'all' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              <X size={14} className="mr-1" />
              Effacer filtre
            </Button>
          )}
        </div>

        {/* Late rooms alert */}
        {lateRooms.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">
                {lateRooms.length} chambre(s) en retard
              </p>
              <p className="text-xs text-red-500">
                Chambres: {lateRooms.slice(0, 5).join(', ')}{lateRooms.length > 5 ? '...' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floor Sections */}
      <div className="p-6 space-y-4">
        {floors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <BedDouble size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Aucune chambre trouvée</p>
            {searchQuery && (
              <Button 
                variant="link" 
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Effacer la recherche
              </Button>
            )}
          </div>
        ) : (
          floors.map(floor => (
            <FloorSection
              key={floor}
              floor={floor}
              rooms={roomsByFloor[floor] || []}
              onRoomClick={handleRoomClick}
              isExpanded={expandedFloors[floor] !== false}
              onToggle={() => toggleFloor(floor)}
              lateRooms={lateRooms}
            />
          ))
        )}
      </div>

      {/* Room Detail Modal */}
      <RoomDetailModal
        room={selectedRoom}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedRoom(null)
        }}
        staff={staff}
        reports={[]}
      />
    </div>
  )
}
