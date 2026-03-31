/**
 * MobileHousekeepingViewV2 - Vue Mobile Femme de Chambre avec API V2
 * Design fidèle Rorck avec intégration NestJS temps réel
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import axios from 'axios'
import { useHotel } from '@/context/HotelContext'
import {
  Camera, Search, ChevronRight, X, Play, CheckCircle, ScanLine,
  Clock, Pause, Upload, MessageSquare, AlertTriangle, ChevronLeft,
  QrCode, Timer, Image, Send, Wifi, WifiOff, Loader2,
  Package, Lightbulb, Wind, Lock, Droplet, Droplets, Tv, Armchair,
  Smartphone, Laptop, Key, Shirt, Briefcase, Footprints, Gem, Banknote
} from 'lucide-react'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS (Rorck Mobile)
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
  brand: '#5B4ED1',
  brandLight: '#7C6FE3',
  brandSoft: '#E8E5FF',
  success: '#22C55E',
  successSoft: '#DCFCE7',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  teal: '#14B8A6',
  slate: '#64748B',
}

// Default categories (loaded from API)
const DEFAULT_REPORT_CATEGORIES = [
  { name: 'WC bouché', icon: 'Droplets', color: '#3B82F6' },
  { name: 'Ampoule grillée', icon: 'Lightbulb', color: '#F59E0B' },
  { name: 'Clim en panne', icon: 'Wind', color: '#06B6D4' },
  { name: 'Serrure cassée', icon: 'Lock', color: '#EF4444' },
  { name: 'Fuite robinet', icon: 'Droplet', color: '#3B82F6' },
  { name: 'Mobilier abîmé', icon: 'Armchair', color: '#8B5CF6' },
  { name: 'TV ne marche pas', icon: 'Tv', color: '#6366F1' },
  { name: 'Autre problème', icon: 'AlertTriangle', color: '#64748B' },
]

const DEFAULT_FOUND_ITEM_CATEGORIES = [
  { name: 'Téléphone', icon: 'Smartphone', color: '#3B82F6' },
  { name: 'PC portable', icon: 'Laptop', color: '#6366F1' },
  { name: 'Clés', icon: 'Key', color: '#F59E0B' },
  { name: 'Vêtement', icon: 'Shirt', color: '#EC4899' },
  { name: 'Sac', icon: 'Briefcase', color: '#8B5CF6' },
  { name: 'Chaussures', icon: 'Footprints', color: '#64748B' },
  { name: 'Bijoux', icon: 'Gem', color: '#F59E0B' },
  { name: 'Argent', icon: 'Banknote', color: '#22C55E' },
  { name: 'Autre', icon: 'Package', color: '#64748B' },
]

const ICON_MAP = {
  Droplets, Lightbulb, Wind, Lock, Droplet, Armchair, Tv, AlertTriangle,
  Smartphone, Laptop, Key, Shirt, Briefcase, Footprints, Gem, Banknote, Package,
}

const TASK_STATUS = {
  a_faire: { label: 'À faire', color: COLORS.slate, bg: '#F1F5F9' },
  en_cours: { label: 'En cours', color: COLORS.brand, bg: COLORS.brandSoft },
  termine: { label: 'Terminé', color: COLORS.success, bg: COLORS.successSoft },
  a_refaire: { label: 'À refaire', color: COLORS.danger, bg: COLORS.dangerSoft },
}

const TASK_TYPE = {
  depart: { label: 'Départ', color: '#C62828', bg: '#FFCDD2' },
  recouche: { label: 'Recouche', color: '#E65100', bg: '#FFE0B2' },
  en_cours_sejour: { label: 'Séjour', color: COLORS.teal, bg: '#CCFBF1' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const RoomCard = ({ task, onStart, onComplete, elapsedTime, isActive }) => {
  const status = TASK_STATUS[task.status] || TASK_STATUS.a_faire
  const type = TASK_TYPE[task.task_type] || TASK_TYPE.depart
  const isInProgress = task.status === 'en_cours'
  const isDone = task.status === 'termine'
  const isRefused = task.status === 'a_refaire'

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getBorderColor = () => {
    if (isRefused) return COLORS.danger
    if (isInProgress) return COLORS.brand
    if (isDone) return COLORS.success
    return 'transparent'
  }

  return (
    <div 
      className="mx-4 my-2 bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
      style={{ 
        border: `2px solid ${getBorderColor()}`,
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isActive ? '0 8px 25px rgba(91,78,209,0.15)' : '0 1px 3px rgba(0,0,0,0.08)'
      }}
      data-testid={`mobile-room-${task.room_number}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Room Number */}
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: type.bg }}
            >
              <span className="text-2xl font-black" style={{ color: type.color }}>
                {task.room_number}
              </span>
            </div>
            
            {/* Room Info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {task.room_type || 'Standard'}
                </span>
                {task.client_badge === 'vip' && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded">
                    VIP
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span 
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                  style={{ background: type.bg, color: type.color }}
                >
                  {type.label}
                </span>
                <span className="text-[11px] text-slate-400">
                  Étage {task.floor || '?'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div 
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </div>
        </div>

        {/* Timer (if in progress) */}
        {isInProgress && (
          <div 
            className="flex items-center justify-center gap-2 py-3 mb-3 rounded-xl"
            style={{ background: COLORS.brandSoft }}
          >
            <Timer size={20} style={{ color: COLORS.brand }} />
            <span className="text-2xl font-mono font-bold" style={{ color: COLORS.brand }}>
              {formatTime(elapsedTime || 0)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isInProgress && !isDone && (
            <Button 
              onClick={() => onStart(task._id)}
              className="flex-1 h-12 rounded-xl text-sm font-semibold"
              style={{ background: COLORS.brand }}
              data-testid={`btn-start-${task.room_number}`}
            >
              <Play size={18} className="mr-2" />
              Démarrer
            </Button>
          )}
          
          {isInProgress && (
            <Button 
              onClick={() => onComplete(task._id)}
              className="flex-1 h-12 rounded-xl text-sm font-semibold"
              style={{ background: COLORS.success }}
              data-testid={`btn-complete-${task.room_number}`}
            >
              <CheckCircle size={18} className="mr-2" />
              Terminer
            </Button>
          )}

          {isDone && (
            <div className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 bg-emerald-50">
              <CheckCircle size={18} className="text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Terminé</span>
            </div>
          )}

          {isRefused && (
            <Button 
              onClick={() => onStart(task._id)}
              className="flex-1 h-12 rounded-xl text-sm font-semibold"
              style={{ background: COLORS.danger }}
              data-testid={`btn-redo-${task.room_number}`}
            >
              <AlertTriangle size={18} className="mr-2" />
              Reprendre
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS HEADER
// ═══════════════════════════════════════════════════════════════════════════════

const StatsHeader = ({ tasks, connected }) => {
  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(t => t.status === 'termine').length
    const inProgress = tasks.filter(t => t.status === 'en_cours').length
    const todo = tasks.filter(t => t.status === 'a_faire').length
    const redo = tasks.filter(t => t.status === 'a_refaire').length
    return { total, done, inProgress, todo, redo, progress: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [tasks])

  return (
    <div className="px-4 py-3 bg-white border-b border-slate-100">
      {/* Connection Status */}
      <div className={`flex items-center gap-1.5 mb-3 text-xs font-medium ${connected ? 'text-emerald-600' : 'text-amber-600'}`}>
        {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
        {connected ? 'Connecté temps réel' : 'Mode hors ligne'}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-slate-700">Progression</span>
          <span className="text-sm font-bold" style={{ color: COLORS.brand }}>{stats.progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.progress}%`, background: `linear-gradient(90deg, ${COLORS.brand}, ${COLORS.brandLight})` }}
          />
        </div>
      </div>

      {/* Stats Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          À faire: {stats.todo}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: COLORS.brandSoft, color: COLORS.brand }}>
          <span className="w-2 h-2 rounded-full" style={{ background: COLORS.brand }} />
          En cours: {stats.inProgress}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: COLORS.successSoft, color: COLORS.success }}>
          <span className="w-2 h-2 rounded-full" style={{ background: COLORS.success }} />
          Terminé: {stats.done}
        </div>
        {stats.redo > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: COLORS.dangerSoft, color: COLORS.danger }}>
            <span className="w-2 h-2 rounded-full" style={{ background: COLORS.danger }} />
            À refaire: {stats.redo}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MobileHousekeepingViewV2({ data, actions }) {
  const { tasks = [], staff = [], loading, connected } = data
  const { startTask, completeTask, refresh } = actions
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id
  
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [elapsedTimes, setElapsedTimes] = useState({})
  const [searchText, setSearchText] = useState('')
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [taskToComplete, setTaskToComplete] = useState(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const intervalRef = useRef(null)

  // Report/FoundItem modals
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [foundItemModalOpen, setFoundItemModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [reportDescription, setReportDescription] = useState('')
  const [reportRoom, setReportRoom] = useState('')
  const [foundItemName, setFoundItemName] = useState('')
  const [foundItemDescription, setFoundItemDescription] = useState('')
  const [foundItemRoom, setFoundItemRoom] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Mock current user (in real app, get from auth context)
  const currentUser = { id: 'femme-chambre-1', name: 'Sophie Martin' }

  // Filter tasks assigned to current user (for now, show all)
  const myTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!searchText) return true
      return t.room_number.includes(searchText)
    }).sort((a, b) => {
      // Priority: a_refaire > en_cours > a_faire > termine
      const order = { a_refaire: 0, en_cours: 1, a_faire: 2, termine: 3 }
      return (order[a.status] || 4) - (order[b.status] || 4)
    })
  }, [tasks, searchText])

  // Timer effect for active task
  useEffect(() => {
    const inProgressTask = myTasks.find(t => t.status === 'en_cours')
    if (inProgressTask) {
      setActiveTaskId(inProgressTask._id)
      
      // Calculate initial elapsed time
      if (inProgressTask.started_at) {
        const startTime = new Date(inProgressTask.started_at).getTime()
        const now = Date.now()
        const initialElapsed = Math.floor((now - startTime) / 1000)
        setElapsedTimes(prev => ({ ...prev, [inProgressTask._id]: initialElapsed }))
      }

      // Start interval
      intervalRef.current = setInterval(() => {
        setElapsedTimes(prev => ({
          ...prev,
          [inProgressTask._id]: (prev[inProgressTask._id] || 0) + 1
        }))
      }, 1000)
    } else {
      setActiveTaskId(null)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [myTasks])

  // Handlers
  const handleStart = useCallback(async (taskId) => {
    await startTask(taskId)
    setActiveTaskId(taskId)
    setElapsedTimes(prev => ({ ...prev, [taskId]: 0 }))
  }, [startTask])

  const handleOpenComplete = useCallback((taskId) => {
    setTaskToComplete(taskId)
    setCompletionNotes('')
    setCompleteDialogOpen(true)
  }, [])

  const handleConfirmComplete = useCallback(async () => {
    if (!taskToComplete) return
    await completeTask(taskToComplete, [], completionNotes)
    setCompleteDialogOpen(false)
    setTaskToComplete(null)
    setActiveTaskId(null)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [taskToComplete, completionNotes, completeTask])

  // Submit Report
  const handleSubmitReport = useCallback(async () => {
    if (!selectedCategory || !reportRoom) {
      toast.error('Veuillez sélectionner une catégorie et une chambre')
      return
    }
    setSubmitting(true)
    try {
      const token = localStorage.getItem('flowtym_token')
      await axios.post(
        `${API_URL}/api/v2/hotels/${hotelId}/reports`,
        {
          room_number: reportRoom,
          category_name: selectedCategory.name,
          category_icon: selectedCategory.icon,
          description: reportDescription,
          reporter_id: currentUser.id,
          reporter_name: currentUser.name,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Signalement envoyé')
      setReportModalOpen(false)
      setSelectedCategory(null)
      setReportDescription('')
      setReportRoom('')
    } catch (e) {
      toast.error('Erreur lors de l\'envoi')
    }
    setSubmitting(false)
  }, [hotelId, selectedCategory, reportRoom, reportDescription, currentUser])

  // Submit Found Item
  const handleSubmitFoundItem = useCallback(async () => {
    if (!selectedCategory || !foundItemRoom) {
      toast.error('Veuillez sélectionner une catégorie et une chambre')
      return
    }
    setSubmitting(true)
    try {
      const token = localStorage.getItem('flowtym_token')
      await axios.post(
        `${API_URL}/api/v2/hotels/${hotelId}/found-items`,
        {
          room_number: foundItemRoom,
          category_name: selectedCategory.name,
          category_icon: selectedCategory.icon,
          name: foundItemName || selectedCategory.name,
          description: foundItemDescription,
          reporter_id: currentUser.id,
          reporter_name: currentUser.name,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Objet déclaré')
      setFoundItemModalOpen(false)
      setSelectedCategory(null)
      setFoundItemName('')
      setFoundItemDescription('')
      setFoundItemRoom('')
    } catch (e) {
      toast.error('Erreur lors de la déclaration')
    }
    setSubmitting(false)
  }, [hotelId, selectedCategory, foundItemRoom, foundItemName, foundItemDescription, currentUser])

  // Loading state
  if (loading && tasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-3" style={{ color: COLORS.brand }} />
          <p className="text-slate-500 text-sm">Chargement des tâches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50" data-testid="mobile-housekeeping-v2">
      {/* Header */}
      <div 
        className="px-4 py-4 text-white"
        style={{ background: `linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandLight})` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold">Mes Chambres</h1>
            <p className="text-sm text-white/70">{myTasks.length} tâches assignées</p>
          </div>
          <button 
            onClick={refresh}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <QrCode size={20} className="text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <Input 
            placeholder="Rechercher une chambre..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/50 h-10 rounded-xl"
          />
        </div>
      </div>

      {/* Stats */}
      <StatsHeader tasks={myTasks} connected={connected} />

      {/* Room List */}
      <div className="flex-1 overflow-y-auto py-2">
        {myTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400" />
            <p className="text-slate-500">Aucune tâche assignée</p>
          </div>
        ) : (
          myTasks.map(task => (
            <RoomCard
              key={task._id}
              task={task}
              onStart={handleStart}
              onComplete={handleOpenComplete}
              elapsedTime={elapsedTimes[task._id]}
              isActive={activeTaskId === task._id}
            />
          ))
        )}
      </div>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Terminer le nettoyage</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Photo Upload (placeholder) */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
              <Camera size={32} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500">Prendre une photo (optionnel)</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Signaler un problème, produits utilisés..."
                className="w-full h-20 px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmComplete}
              style={{ background: COLORS.success }}
            >
              <CheckCircle size={16} className="mr-2" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
