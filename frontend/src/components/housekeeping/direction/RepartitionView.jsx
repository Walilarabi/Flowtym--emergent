/**
 * RepartitionView - Vue Répartition des Chambres
 * Basé sur les maquettes PDF FLOWTYM (Page 8)
 * 
 * Fonctionnalités:
 * - Équipe du jour avec charge de travail
 * - Répartition automatique (équilibrage)
 * - Répartition manuelle (drag & drop)
 * - Sauvegarde des assignations
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  Users, Zap, User, Clock, BedDouble, CheckCircle, Plus,
  ArrowRight, GripVertical, AlertTriangle, RefreshCw, Save,
  ChevronDown, ChevronUp, Loader2, X, Filter, Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

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
}

// Task time estimates (minutes)
const TASK_TIME = {
  depart: 45, // Départ = 45 min
  recouche: 25, // Recouche = 25 min
  default: 30,
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const StatsCard = ({ value, label, color, colorSoft }) => (
  <div 
    className="flex-1 p-4 rounded-xl text-center"
    style={{ backgroundColor: colorSoft }}
  >
    <div className="text-3xl font-bold mb-1" style={{ color }}>{value}</div>
    <div className="text-xs text-slate-600">{label}</div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF CARD COMPONENT (Dropzone)
// ═══════════════════════════════════════════════════════════════════════════════

const StaffCard = ({ 
  member, 
  assignedRooms, 
  totalTime,
  onDrop,
  onRemoveRoom,
  isOver,
  maxRooms = 10
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const progressPercent = Math.min((assignedRooms.length / maxRooms) * 100, 100)
  const isOverloaded = assignedRooms.length > maxRooms
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  
  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault()
    const roomData = e.dataTransfer.getData('room')
    if (roomData) {
      const room = JSON.parse(roomData)
      onDrop(room, member)
    }
  }
  
  return (
    <div 
      className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
        isOver ? 'border-violet-400 shadow-lg' : 'border-slate-100'
      } ${isOverloaded ? 'border-amber-300' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-testid={`staff-dropzone-${member._id}`}
    >
      {/* Header */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-semibold">
          {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">{member.name}</h3>
            {isOverloaded && (
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                Surchargé
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <BedDouble size={12} />
              {assignedRooms.length} chambres
            </span>
            <span className="flex items-center gap-1">
              <Timer size={12} />
              {Math.round(totalTime / 60)}h{(totalTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20">
            <Progress 
              value={progressPercent} 
              className="h-2"
              style={{ 
                '--progress-color': isOverloaded ? COLORS.warning : COLORS.brand 
              }}
            />
          </div>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      
      {/* Assigned Rooms */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {assignedRooms.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <BedDouble size={20} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">
                Glissez des chambres ici
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-3">
              {assignedRooms.map(room => (
                <div
                  key={room._id || room.room_number}
                  className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 rounded-lg group"
                >
                  <span className="font-medium text-violet-700 text-sm">
                    {room.room_number}
                  </span>
                  <Badge 
                    variant="outline" 
                    className="text-[10px] border-violet-200 text-violet-600"
                  >
                    {room.task_type === 'depart' ? 'D' : 'R'}
                  </Badge>
                  <button
                    onClick={() => onRemoveRoom(room, member)}
                    className="w-4 h-4 rounded-full bg-violet-200 text-violet-600 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNASSIGNED ROOM CHIP (Draggable)
// ═══════════════════════════════════════════════════════════════════════════════

const DraggableRoomChip = ({ room, onDragStart }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('room', JSON.stringify(room))
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(room)
  }
  
  const isDepart = room.task_type === 'depart' || room.status === 'depart'
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDepart ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'
      }`}
      data-testid={`draggable-room-${room.room_number}`}
    >
      <GripVertical size={14} className="text-slate-400" />
      <span className={`font-semibold ${isDepart ? 'text-red-700' : 'text-amber-700'}`}>
        {room.room_number}
      </span>
      <Badge 
        className={`text-xs ${isDepart ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
      >
        {isDepart ? 'Départ' : 'Recouche'}
      </Badge>
      <span className="text-xs text-slate-500">
        {TASK_TIME[room.task_type || 'default']}min
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO ASSIGN MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const AutoAssignModal = ({ open, onClose, onConfirm, stats }) => {
  const [mode, setMode] = useState('balanced') // balanced | byCount | byTime
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap size={20} className="text-violet-500" />
            Répartition automatique
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-slate-600">
            La répartition automatique va assigner {stats.unassigned} chambre(s) 
            à {stats.staffCount} employé(e)s disponibles.
          </p>

          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Mode de répartition</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="mode"
                  value="balanced"
                  checked={mode === 'balanced'}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-4 h-4 text-violet-600"
                />
                <div>
                  <p className="font-medium text-slate-800">Équilibré</p>
                  <p className="text-xs text-slate-500">Répartit équitablement selon le temps estimé</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="mode"
                  value="byCount"
                  checked={mode === 'byCount'}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-4 h-4 text-violet-600"
                />
                <div>
                  <p className="font-medium text-slate-800">Par nombre</p>
                  <p className="text-xs text-slate-500">Même nombre de chambres par personne</p>
                </div>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-violet-50 rounded-xl">
            <p className="text-sm text-violet-700">
              <strong>Estimation:</strong> ~{Math.ceil(stats.unassigned / stats.staffCount)} chambres par personne
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            className="bg-violet-600 hover:bg-violet-700"
            onClick={() => onConfirm(mode)}
          >
            <Zap size={16} className="mr-2" />
            Répartir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RepartitionView({ data, actions, onNavigate }) {
  const { rooms = [], staff = [], tasks = [], loading } = data
  const { refresh, autoAssign, assignTasks } = actions

  const [assignments, setAssignments] = useState({}) // { staffId: [room, room] }
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Get active housekeepers
  const housekeepers = useMemo(() => {
    return staff.filter(s => 
      (s.role === 'femme_de_chambre' || s.role === 'housekeeper') && 
      s.active !== false
    )
  }, [staff])

  // Get rooms that need cleaning (tasks)
  const roomsToClean = useMemo(() => {
    // Get unique rooms from tasks
    const taskRooms = tasks
      .filter(t => t.status !== 'termine' && t.status !== 'valide')
      .map(t => ({
        ...t,
        room_number: t.room_number || t.room,
        task_type: t.type || t.task_type,
      }))
    
    // Also check rooms with depart/recouche status
    const statusRooms = rooms
      .filter(r => 
        (r.status === 'depart' || r.status === 'recouche') && 
        !r.cleaning_status
      )
      .map(r => ({
        ...r,
        task_type: r.status,
      }))
    
    // Merge and dedupe
    const allRooms = [...taskRooms]
    statusRooms.forEach(sr => {
      if (!allRooms.find(r => r.room_number === sr.room_number)) {
        allRooms.push(sr)
      }
    })
    
    return allRooms
  }, [tasks, rooms])

  // Initialize assignments from existing data
  useEffect(() => {
    const initial = {}
    housekeepers.forEach(h => {
      initial[h._id] = []
    })
    
    // Load existing assignments
    roomsToClean.forEach(room => {
      if (room.assigned_to) {
        const staffId = room.assigned_to
        if (initial[staffId]) {
          initial[staffId].push(room)
        }
      }
    })
    
    setAssignments(initial)
  }, [housekeepers, roomsToClean])

  // Get unassigned rooms
  const unassignedRooms = useMemo(() => {
    const assignedRoomNumbers = new Set()
    Object.values(assignments).forEach(rooms => {
      rooms.forEach(r => assignedRoomNumbers.add(r.room_number))
    })
    
    return roomsToClean.filter(r => !assignedRoomNumbers.has(r.room_number))
  }, [roomsToClean, assignments])

  // Calculate total time per staff
  const getStaffTotalTime = useCallback((staffId) => {
    const staffRooms = assignments[staffId] || []
    return staffRooms.reduce((total, room) => {
      const time = TASK_TIME[room.task_type] || TASK_TIME.default
      return total + time
    }, 0)
  }, [assignments])

  // Stats
  const stats = useMemo(() => {
    const departures = roomsToClean.filter(r => r.task_type === 'depart').length
    const recouches = roomsToClean.filter(r => r.task_type === 'recouche').length
    const assigned = roomsToClean.length - unassignedRooms.length
    
    return {
      total: roomsToClean.length,
      departures,
      recouches,
      assigned,
      unassigned: unassignedRooms.length,
      staffCount: housekeepers.length,
    }
  }, [roomsToClean, unassignedRooms, housekeepers])

  // Handle room drop
  const handleRoomDrop = useCallback((room, targetStaff) => {
    setAssignments(prev => {
      const updated = { ...prev }
      
      // Remove from previous staff if assigned
      Object.keys(updated).forEach(staffId => {
        updated[staffId] = updated[staffId].filter(r => r.room_number !== room.room_number)
      })
      
      // Add to target staff
      if (!updated[targetStaff._id]) {
        updated[targetStaff._id] = []
      }
      updated[targetStaff._id] = [...updated[targetStaff._id], { ...room, assigned_to: targetStaff._id }]
      
      return updated
    })
    setHasChanges(true)
  }, [])

  // Handle room removal
  const handleRemoveRoom = useCallback((room, staff) => {
    setAssignments(prev => {
      const updated = { ...prev }
      updated[staff._id] = updated[staff._id].filter(r => r.room_number !== room.room_number)
      return updated
    })
    setHasChanges(true)
  }, [])

  // Handle auto assignment
  const handleAutoAssign = useCallback((mode) => {
    const newAssignments = { ...assignments }
    
    // Clear existing unassigned
    housekeepers.forEach(h => {
      if (!newAssignments[h._id]) newAssignments[h._id] = []
    })
    
    // Sort rooms by type (departures first)
    const sortedRooms = [...unassignedRooms].sort((a, b) => {
      if (a.task_type === 'depart' && b.task_type !== 'depart') return -1
      if (a.task_type !== 'depart' && b.task_type === 'depart') return 1
      return 0
    })
    
    if (mode === 'balanced') {
      // Balance by estimated time
      sortedRooms.forEach(room => {
        // Find staff with least total time
        let minStaff = housekeepers[0]
        let minTime = Infinity
        
        housekeepers.forEach(h => {
          const currentTime = newAssignments[h._id]?.reduce((sum, r) => 
            sum + (TASK_TIME[r.task_type] || TASK_TIME.default), 0
          ) || 0
          if (currentTime < minTime) {
            minTime = currentTime
            minStaff = h
          }
        })
        
        newAssignments[minStaff._id] = [...(newAssignments[minStaff._id] || []), room]
      })
    } else {
      // Balance by count
      let staffIndex = 0
      sortedRooms.forEach(room => {
        const targetStaff = housekeepers[staffIndex % housekeepers.length]
        newAssignments[targetStaff._id] = [...(newAssignments[targetStaff._id] || []), room]
        staffIndex++
      })
    }
    
    setAssignments(newAssignments)
    setHasChanges(true)
    setShowAutoAssignModal(false)
    toast.success(`${unassignedRooms.length} chambres réparties automatiquement`)
  }, [assignments, unassignedRooms, housekeepers])

  // Save assignments
  const handleSave = useCallback(async () => {
    setSaving(true)
    
    try {
      // Prepare assignment data
      const assignmentData = []
      Object.entries(assignments).forEach(([staffId, rooms]) => {
        rooms.forEach(room => {
          assignmentData.push({
            room_number: room.room_number,
            task_id: room._id,
            assigned_to: staffId,
          })
        })
      })
      
      // Call API
      if (assignTasks) {
        await assignTasks(assignmentData)
      }
      
      setHasChanges(false)
      toast.success('Assignations sauvegardées')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
      console.error('Save error:', error)
    }
    
    setSaving(false)
  }, [assignments, assignTasks])

  if (loading && roomsToClean.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-3 text-violet-600" />
          <p className="text-slate-500">Chargement de la répartition...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-slate-50" data-testid="repartition-view">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Répartition des Chambres</h2>
            <p className="text-sm text-slate-500">
              {stats.total} chambres à nettoyer • {housekeepers.length} employés
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAutoAssignModal(true)}
              disabled={unassignedRooms.length === 0 || housekeepers.length === 0}
            >
              <Zap size={14} className="mr-1" />
              Répartition auto
            </Button>
            {hasChanges && (
              <Button 
                size="sm"
                className="bg-violet-600 hover:bg-violet-700"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : (
                  <Save size={14} className="mr-1" />
                )}
                Sauvegarder
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-3">
          <StatsCard value={stats.total} label="TOTAL" color={COLORS.brand} colorSoft={COLORS.brandSoft} />
          <StatsCard value={stats.unassigned} label="EN ATTENTE" color={COLORS.warning} colorSoft={COLORS.warningSoft} />
          <StatsCard value={stats.assigned} label="ASSIGNÉES" color={COLORS.info} colorSoft={COLORS.infoSoft} />
          <StatsCard value={stats.departures} label="DÉPARTS" color={COLORS.danger} colorSoft={COLORS.dangerSoft} />
          <StatsCard value={stats.recouches} label="RECOUCHES" color={COLORS.teal} colorSoft={COLORS.tealSoft} />
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unassigned Rooms */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Chambres à assigner</h3>
                <Badge className="bg-amber-100 text-amber-700">
                  {unassignedRooms.length}
                </Badge>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                {unassignedRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
                    <p className="text-sm text-slate-500">Toutes les chambres sont assignées</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {unassignedRooms.map(room => (
                      <DraggableRoomChip 
                        key={room._id || room.room_number}
                        room={room}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Staff Dropzones */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users size={18} />
                Équipe du jour
              </h3>
              <span className="text-sm text-slate-500">
                {housekeepers.length} employé(s) disponible(s)
              </span>
            </div>

            {housekeepers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <Users size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Aucun employé disponible</p>
                <p className="text-sm text-slate-400 mt-1">
                  Ajoutez du personnel dans la configuration
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {housekeepers.map(member => (
                  <StaffCard
                    key={member._id}
                    member={member}
                    assignedRooms={assignments[member._id] || []}
                    totalTime={getStaffTotalTime(member._id)}
                    onDrop={handleRoomDrop}
                    onRemoveRoom={handleRemoveRoom}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto Assign Modal */}
      <AutoAssignModal
        open={showAutoAssignModal}
        onClose={() => setShowAutoAssignModal(false)}
        onConfirm={handleAutoAssign}
        stats={stats}
      />
    </div>
  )
}
