/**
 * ReceptionViewV2 - Vue Réception avec API NestJS V2
 * Tableau interactif temps réel avec WebSocket
 * Design fidèle au projet Rorck
 */

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Search, ChevronDown, Eye, FileText, Star, Plus, RefreshCw,
  Grid3X3, List, Check, AlertTriangle, MapPin, Zap, Clock, CheckCircle,
  ArrowRight, Coffee, AlertCircle, Bed, Users, Wifi, WifiOff, Loader2
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES & CONSTANTS (Rorck Design System)
// ═══════════════════════════════════════════════════════════════════════════════

const FT = {
  headerBg: '#0F172A',
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  brand: '#4F6BED',
  brandSoft: 'rgba(79,107,237,0.07)',
  text: '#0F172A',
  textSec: '#475569',
  textMuted: '#94A3B8',
  border: '#E8ECF1',
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.08)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.08)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.06)',
  info: '#3B82F6',
  infoSoft: 'rgba(59,130,246,0.08)',
  teal: '#14B8A6',
}

const STATUS_CONFIG = {
  libre: { label: 'Libre', color: FT.success, bg: FT.successSoft },
  occupe: { label: 'Occupée', color: FT.info, bg: FT.infoSoft },
  depart: { label: 'Départ', color: FT.danger, bg: FT.dangerSoft },
  recouche: { label: 'Recouche', color: FT.warning, bg: FT.warningSoft },
  hors_service: { label: 'H.S.', color: FT.textMuted, bg: '#F1F5F9' },
}

const CLEANING_CONFIG = {
  none: { label: 'À faire', color: FT.textMuted, bg: '#F1F5F9' },
  en_cours: { label: 'En cours', color: FT.teal, bg: 'rgba(20,184,166,0.08)' },
  nettoyee: { label: 'Terminé', color: FT.warning, bg: FT.warningSoft },
  validee: { label: 'Validé', color: FT.success, bg: FT.successSoft },
  refusee: { label: 'Refusé', color: FT.danger, bg: FT.dangerSoft },
}

const SOURCE_CONFIG = {
  'Direct': { color: FT.success, abbrev: 'D' },
  'Téléphone': { color: FT.info, abbrev: 'T' },
  'Walk-in': { color: FT.brand, abbrev: 'W' },
  'Email': { color: '#8B5CF6', abbrev: 'E' },
  'Booking.com': { color: '#003580', abbrev: 'B' },
  'Expedia': { color: '#FFCC00', abbrev: 'Ex' },
  'Airbnb': { color: '#FF5A5F', abbrev: 'Ab' },
}

// Generate room color based on room number (with null safety)
const getRoomColor = (roomNumber) => {
  const colors = ['#5B4ED1', '#22C55E', '#A855F7', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6']
  if (!roomNumber || typeof roomNumber !== 'string') {
    return colors[0] // fallback color
  }
  const hash = roomNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const RoomCell = ({ room }) => {
  if (!room) return <span className="text-slate-300">—</span>
  const bgColor = getRoomColor(room.room_number)
  
  return (
    <div className="flex items-center gap-2.5">
      <div 
        className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[15px] text-white shadow-sm"
        style={{ background: bgColor }}
      >
        {room.room_number || '?'}
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-[13px] text-slate-900">{room.room_type || 'Standard'}</span>
        <span className="text-[11px] text-slate-400">
          {room.room_category || 'Standard'} · {room.room_size || '?'}m²
        </span>
      </div>
    </div>
  )
}

const StatusBadge = ({ status, config }) => {
  const cfg = config[status] || { label: status, color: FT.textMuted, bg: '#F1F5F9' }
  
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

const SourceBadge = ({ source }) => {
  if (!source) return <span className="text-slate-300">—</span>
  const cfg = SOURCE_CONFIG[source] || { color: FT.textMuted, abbrev: '?' }
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] font-bold"
        style={{ background: cfg.color }}
      >
        {cfg.abbrev}
      </div>
      <span className="text-xs text-slate-600">{source}</span>
    </div>
  )
}

const StaffAvatar = ({ name }) => {
  if (!name || typeof name !== 'string') return <span className="text-slate-300">—</span>
  const initials = name.split(' ').map(n => n?.[0] || '').join('').toUpperCase().slice(0, 2) || '?'
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-semibold text-violet-600">
        {initials}
      </div>
      <span className="text-[12px] text-slate-600">{name}</span>
    </div>
  )
}

const KPICard = ({ icon: Icon, value, label, color, bg }) => (
  <div className="flex items-center gap-2.5 whitespace-nowrap">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
      <Icon size={16} style={{ color }} />
    </div>
    <div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[12px] text-slate-500">{label}</div>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReceptionViewV2({ data, actions }) {
  const { stats, tasks, rooms, staff, loading, connected } = data
  const { refresh, assignTasks, autoAssign, seedData } = actions
  
  const [viewMode, setViewMode] = useState('table')
  const [searchText, setSearchText] = useState('')
  const [selectedRooms, setSelectedRooms] = useState(new Set())
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [filterFloor, setFilterFloor] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Merge rooms with their tasks
  const enrichedRooms = useMemo(() => {
    return rooms.map(room => {
      const task = tasks.find(t => t.room_number === room.room_number)
      return {
        ...room,
        task,
        taskStatus: task?.status,
        taskType: task?.task_type,
        assignedTo: task?.assigned_to_name || room.cleaning_assignee,
      }
    })
  }, [rooms, tasks])

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return enrichedRooms.filter(room => {
      if (searchText) {
        const search = searchText.toLowerCase()
        const matchesRoom = room.room_number.toLowerCase().includes(search)
        const matchesClient = room.current_reservation?.guest_name?.toLowerCase().includes(search)
        if (!matchesRoom && !matchesClient) return false
      }
      if (filterFloor !== 'all' && room.floor !== parseInt(filterFloor)) return false
      if (filterStatus !== 'all' && room.status !== filterStatus) return false
      return true
    })
  }, [enrichedRooms, searchText, filterFloor, filterStatus])

  // Get unique floors
  const floors = useMemo(() => {
    const uniqueFloors = [...new Set(rooms.map(r => r.floor))].filter(f => f != null).sort()
    return uniqueFloors
  }, [rooms])

  // Calculate KPIs from stats
  const kpis = useMemo(() => {
    if (!stats) return {}
    const roomStats = stats.rooms || {}
    const taskStats = stats.tasks || {}
    const inspStats = stats.inspections || {}
    
    return {
      total: roomStats.total || 0,
      departures: taskStats.departs || roomStats.depart || 0,
      recouches: taskStats.recouches || roomStats.recouche || 0,
      enCours: taskStats.en_cours || 0,
      terminees: taskStats.termine || 0,
      aValider: inspStats.en_attente || 0,
      occupancy: stats.occupancy_rate || 0,
      cleanliness: stats.cleanliness_rate || 0,
    }
  }, [stats])

  // Femmes de chambre disponibles
  const housekeepers = useMemo(() => staff || [], [staff])

  // Selection handlers
  const toggleRoomSelection = useCallback((roomId) => {
    setSelectedRooms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roomId)) {
        newSet.delete(roomId)
      } else {
        newSet.add(roomId)
      }
      return newSet
    })
  }, [])

  const toggleAllRooms = useCallback(() => {
    if (selectedRooms.size === filteredRooms.length) {
      setSelectedRooms(new Set())
    } else {
      setSelectedRooms(new Set(filteredRooms.map(r => r._id)))
    }
  }, [filteredRooms, selectedRooms.size])

  // Bulk assign handler
  const handleBulkAssign = useCallback(async () => {
    if (!selectedStaff || selectedRooms.size === 0) return
    
    const staffMember = housekeepers.find(h => h._id === selectedStaff)
    if (!staffMember) return

    // Get task IDs for selected rooms
    const selectedRoomIds = Array.from(selectedRooms)
    const taskIds = tasks
      .filter(t => selectedRoomIds.some(roomId => {
        const room = rooms.find(r => r._id === roomId)
        return room?.room_number === t.room_number
      }))
      .map(t => t._id)

    if (taskIds.length > 0) {
      await assignTasks(taskIds, staffMember._id, `${staffMember.first_name} ${staffMember.last_name}`)
    } else {
      toast.info('Aucune tâche à assigner pour ces chambres')
    }
    
    setSelectedRooms(new Set())
    setAssignDialogOpen(false)
    setSelectedStaff('')
  }, [selectedStaff, selectedRooms, housekeepers, tasks, rooms, assignTasks])

  // Loading state
  if (loading && rooms.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-500">Chargement des données temps réel...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!loading && rooms.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Bed size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucune chambre</h3>
          <p className="text-slate-500 mb-4">
            Créez des données de démonstration pour commencer à utiliser le module Housekeeping.
          </p>
          <Button onClick={seedData} className="bg-violet-600 hover:bg-violet-700">
            <Plus size={16} className="mr-2" /> Créer données démo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50" data-testid="reception-view-v2">
      {/* Connection Status Banner */}
      <div className={`flex items-center gap-2 px-5 py-2 ${connected ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-amber-50 border-b border-amber-100'}`}>
        {connected ? (
          <>
            <Wifi size={16} className="text-emerald-600" />
            <span className="text-[13px] text-emerald-800 font-medium">
              🟢 Connecté en temps réel · {kpis.total} chambres · Occupation: {kpis.occupancy}%
            </span>
          </>
        ) : (
          <>
            <WifiOff size={16} className="text-amber-600" />
            <span className="text-[13px] text-amber-800 font-medium">
              ⚠️ Mode hors ligne - Actualisation manuelle requise
            </span>
          </>
        )}
      </div>

      {/* Sub-navigation */}
      <div className="px-5 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-900">
              <MapPin size={16} /> Plan Chambres
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700">
              <Zap size={16} /> Répartition
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={autoAssign}>
              <Zap size={14} className="mr-1" />
              Auto-Assign
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs Strip */}
      <div className="flex gap-6 px-5 py-4 bg-white border-b border-slate-200 overflow-x-auto">
        <KPICard icon={Bed} value={kpis.total} label="Chambres" color={FT.brand} bg={FT.brandSoft} />
        <KPICard icon={ArrowRight} value={kpis.departures} label="Départs" color={FT.danger} bg={FT.dangerSoft} />
        <KPICard icon={RefreshCw} value={kpis.recouches} label="Recouches" color={FT.warning} bg={FT.warningSoft} />
        <KPICard icon={Clock} value={kpis.enCours} label="En cours" color={FT.teal} bg="rgba(20,184,166,0.08)" />
        <KPICard icon={CheckCircle} value={kpis.terminees} label="Terminées" color={FT.success} bg={FT.successSoft} />
        <KPICard icon={AlertTriangle} value={kpis.aValider} label="À valider" color={FT.warning} bg={FT.warningSoft} />
        <KPICard icon={AlertCircle} value={`${kpis.cleanliness}%`} label="Propreté" color={FT.success} bg={FT.successSoft} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200">
        <div className="flex-1 max-w-[250px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Chambre, client..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200"
          />
        </div>
        
        <Select value={filterFloor} onValueChange={setFilterFloor}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="Étage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous étages</SelectItem>
            {floors.map(floor => (
              <SelectItem key={floor} value={String(floor)}>Étage {floor}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="ml-auto flex items-center gap-3">
          {selectedRooms.size > 0 && (
            <Button 
              onClick={() => setAssignDialogOpen(true)}
              className="bg-violet-600 hover:bg-violet-700"
              data-testid="bulk-assign-btn"
            >
              <Users size={14} className="mr-1.5" />
              Assigner {selectedRooms.size} chambre(s)
            </Button>
          )}
          
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button 
              className={`w-8 h-8 rounded-md flex items-center justify-center ${viewMode === 'grid' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={16} />
            </button>
            <button 
              className={`w-8 h-8 rounded-md flex items-center justify-center ${viewMode === 'table' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}
              onClick={() => setViewMode('table')}
            >
              <List size={16} />
            </button>
          </div>
          <span className="text-[12px] text-slate-400">{filteredRooms.length}/{rooms.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto mx-5 my-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-800 text-white">
              <th className="py-3 px-3 text-left w-10">
                <Checkbox 
                  checked={selectedRooms.size === filteredRooms.length && filteredRooms.length > 0}
                  onCheckedChange={toggleAllRooms}
                  data-testid="select-all-checkbox"
                />
              </th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Chambre</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Statut</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Nettoyage</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Client</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">PAX</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Arrivée</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Départ</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">ETA</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Source</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Assignée</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Vue / SDB</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">PDJ</th>
              <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => {
              const reservation = room.current_reservation
              const isSelected = selectedRooms.has(room._id)
              
              return (
                <tr 
                  key={room._id} 
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-violet-50' : ''}`}
                  data-testid={`room-row-${room.room_number}`}
                >
                  <td className="py-2.5 px-3">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleRoomSelection(room._id)}
                      data-testid={`checkbox-${room.room_number}`}
                    />
                  </td>
                  <td className="py-2.5 px-3"><RoomCell room={room} /></td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={room.status} config={STATUS_CONFIG} />
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={room.cleaning_status} config={CLEANING_CONFIG} />
                  </td>
                  <td className="py-2.5 px-3">
                    {reservation?.guest_name ? (
                      <div className="flex items-center gap-2">
                        {room.client_badge === 'vip' && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">VIP</span>
                        )}
                        {room.client_badge === 'prioritaire' && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">PRIO</span>
                        )}
                        <span className="font-medium text-[13px] text-slate-900">{reservation.guest_name}</span>
                      </div>
                    ) : (
                      <button className="flex items-center gap-1 text-violet-600 text-[12px] font-medium hover:bg-violet-50 px-2 py-1 rounded">
                        <Star size={12} className="text-violet-400" /> Libre
                      </button>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[13px] text-slate-600">
                    {reservation ? `${reservation.adults || 0}+${reservation.children || 0}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-[13px] text-violet-600">
                    {reservation?.check_in_date || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-[13px] text-red-500">
                    {reservation?.check_out_date || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-[13px] text-amber-600 font-medium">
                    {room.eta_arrival || '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <SourceBadge source={room.booking_source} />
                  </td>
                  <td className="py-2.5 px-3">
                    <StaffAvatar name={room.assignedTo} />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-[12px]">
                      <div className="font-medium text-slate-900">{room.view_type || '—'}</div>
                      <div className="text-slate-400">{room.bathroom_type || '—'}</div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {room.breakfast_included ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Coffee size={14} className="text-emerald-600" />
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1">
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Eye size={14} />
                      </button>
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <FileText size={14} />
                      </button>
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Star size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner {selectedRooms.size} chambre(s)</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Chambres sélectionnées: <strong>
                {filteredRooms.filter(r => selectedRooms.has(r._id)).map(r => r.room_number).join(', ')}
              </strong>
            </p>
            
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assigner à:
            </label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger data-testid="staff-select">
                <SelectValue placeholder="Sélectionner une femme de chambre" />
              </SelectTrigger>
              <SelectContent>
                {housekeepers.map(hk => (
                  <SelectItem key={hk._id} value={hk._id}>
                    {hk.first_name} {hk.last_name} ({hk.current_load || 0}/{hk.max_load || 12} ch.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleBulkAssign}
              disabled={!selectedStaff}
              className="bg-violet-600 hover:bg-violet-700"
              data-testid="confirm-assign-btn"
            >
              Confirmer l'assignation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
