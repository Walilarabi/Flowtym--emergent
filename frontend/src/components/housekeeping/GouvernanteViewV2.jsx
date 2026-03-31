/**
 * GouvernanteViewV2 - Vue Gouvernante avec API V2 NestJS
 * 3 onglets: Validation des chambres, Équipe, Stocks
 * Temps réel avec inspections et assignations
 */

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Search, CheckCircle, Package, Users, X, Check, AlertTriangle, Clock,
  Star, Camera, MessageSquare, RefreshCw, Wifi, WifiOff, Loader2,
  ChevronRight, Eye, ThumbsUp, ThumbsDown, Sparkles, Timer
} from 'lucide-react'

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
}

const INSPECTION_STATUS = {
  en_attente: { label: 'À valider', color: COLORS.warning, bg: COLORS.warningSoft, icon: Clock },
  valide: { label: 'Validé', color: COLORS.success, bg: COLORS.successSoft, icon: CheckCircle },
  refuse: { label: 'Refusé', color: COLORS.danger, bg: COLORS.dangerSoft, icon: X },
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

const TabButton = ({ active, icon: Icon, label, count, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-xl transition-all ${
      active 
        ? 'bg-white text-violet-700 shadow-sm border border-slate-200' 
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
    }`}
  >
    <Icon size={18} />
    <span>{label}</span>
    {count > 0 && (
      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
        active ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
      }`}>
        {count}
      </span>
    )}
  </button>
)

// ═══════════════════════════════════════════════════════════════════════════════
// INSPECTION CARD
// ═══════════════════════════════════════════════════════════════════════════════

const InspectionCard = ({ inspection, onValidate, onRefuse }) => {
  const status = INSPECTION_STATUS[inspection.status] || INSPECTION_STATUS.en_attente
  const StatusIcon = status.icon
  const isPending = inspection.status === 'en_attente'

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--'
    const date = new Date(dateStr)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div 
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all"
      data-testid={`inspection-${inspection.room_number}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: status.bg }}
            >
              <span className="text-xl font-black" style={{ color: status.color }}>
                {inspection.room_number}
              </span>
            </div>
            <div>
              <div className="font-semibold text-slate-800">{inspection.room_type || 'Standard'}</div>
              <div className="text-xs text-slate-400">Étage {inspection.floor || '?'}</div>
            </div>
          </div>
          
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            <StatusIcon size={12} />
            {status.label}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-wrap gap-3 mb-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>Par: <strong className="text-slate-700">{inspection.cleaned_by}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Timer size={12} />
            <span>Terminé à: <strong className="text-slate-700">{formatTime(inspection.completed_at)}</strong></span>
          </div>
        </div>

        {/* Rating (if validated) */}
        {inspection.rating && (
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star} 
                size={16} 
                className={star <= inspection.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
              />
            ))}
            <span className="text-xs text-slate-500 ml-2">{inspection.rating}/5</span>
          </div>
        )}

        {/* Comments (if any) */}
        {inspection.comments && (
          <div className="bg-slate-50 rounded-lg p-2 mb-3 text-xs text-slate-600">
            <MessageSquare size={12} className="inline mr-1 text-slate-400" />
            {inspection.comments}
          </div>
        )}

        {/* Refused reason */}
        {inspection.refused_reason && (
          <div className="bg-red-50 rounded-lg p-2 mb-3 text-xs text-red-600">
            <AlertTriangle size={12} className="inline mr-1" />
            {inspection.refused_reason}
          </div>
        )}

        {/* Actions (only for pending) */}
        {isPending && (
          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline"
              className="flex-1 h-10 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onRefuse(inspection)}
              data-testid={`btn-refuse-${inspection.room_number}`}
            >
              <ThumbsDown size={16} className="mr-2" />
              Refuser
            </Button>
            <Button 
              className="flex-1 h-10"
              style={{ background: COLORS.success }}
              onClick={() => onValidate(inspection)}
              data-testid={`btn-validate-${inspection.room_number}`}
            >
              <ThumbsUp size={16} className="mr-2" />
              Valider
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM MEMBER CARD
// ═══════════════════════════════════════════════════════════════════════════════

const TeamMemberCard = ({ member, tasks }) => {
  const memberTasks = tasks.filter(t => t.assigned_to_name === `${member.first_name} ${member.last_name}`)
  const completed = memberTasks.filter(t => t.status === 'termine').length
  const inProgress = memberTasks.filter(t => t.status === 'en_cours').length
  const total = memberTasks.length
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0
  
  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ background: `linear-gradient(135deg, ${COLORS.brand}, ${COLORS.info})` }}
        >
          {initials}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-800">
            {member.first_name} {member.last_name}
          </div>
          <div className="text-xs text-slate-400">
            {member.shift_start} - {member.shift_end}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: COLORS.brand }}>{progressPercent}%</div>
          <div className="text-[10px] text-slate-400">Avancement</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progressPercent}%`, 
            background: progressPercent >= 80 ? COLORS.success : COLORS.brand 
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex gap-2 text-xs">
        <div className="flex-1 bg-slate-50 rounded-lg py-2 text-center">
          <div className="font-bold text-slate-700">{total}</div>
          <div className="text-slate-400">Assignées</div>
        </div>
        <div className="flex-1 rounded-lg py-2 text-center" style={{ background: COLORS.brandSoft }}>
          <div className="font-bold" style={{ color: COLORS.brand }}>{inProgress}</div>
          <div className="text-slate-400">En cours</div>
        </div>
        <div className="flex-1 rounded-lg py-2 text-center" style={{ background: COLORS.successSoft }}>
          <div className="font-bold" style={{ color: COLORS.success }}>{completed}</div>
          <div className="text-slate-400">Terminées</div>
        </div>
      </div>

      {/* Rooms List */}
      {memberTasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Chambres assignées</div>
          <div className="flex flex-wrap gap-1">
            {memberTasks.map(task => (
              <span 
                key={task._id}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ 
                  background: task.status === 'termine' ? COLORS.successSoft : 
                              task.status === 'en_cours' ? COLORS.warningSoft : '#F1F5F9',
                  color: task.status === 'termine' ? COLORS.success : 
                         task.status === 'en_cours' ? COLORS.warning : '#64748B'
                }}
              >
                {task.room_number}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK ITEM (Placeholder)
// ═══════════════════════════════════════════════════════════════════════════════

const StockItem = ({ name, quantity, unit, minStock, icon }) => {
  const isLow = quantity <= minStock
  
  return (
    <div className={`bg-white rounded-xl border p-4 ${isLow ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: isLow ? COLORS.dangerSoft : '#F1F5F9' }}
        >
          <Package size={20} style={{ color: isLow ? COLORS.danger : '#64748B' }} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-800">{name}</div>
          <div className="text-xs text-slate-400">Min: {minStock} {unit}</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
            {quantity}
          </div>
          <div className="text-[10px] text-slate-400">{unit}</div>
        </div>
      </div>
      {isLow && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertTriangle size={12} />
          Stock bas - Réapprovisionnement nécessaire
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function GouvernanteViewV2({ data, actions }) {
  const { stats, tasks = [], rooms = [], staff = [], inspections = [], loading, connected } = data
  const { refresh, validateInspection } = actions
  
  const [activeTab, setActiveTab] = useState('validation')
  const [searchText, setSearchText] = useState('')
  const [validateDialogOpen, setValidateDialogOpen] = useState(false)
  const [refuseDialogOpen, setRefuseDialogOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState(null)
  const [rating, setRating] = useState(4)
  const [comments, setComments] = useState('')
  const [refusedReason, setRefusedReason] = useState('')

  // Filtered inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter(insp => {
      if (!searchText) return true
      return insp.room_number.includes(searchText) || 
             insp.cleaned_by?.toLowerCase().includes(searchText.toLowerCase())
    }).sort((a, b) => {
      // Pending first
      if (a.status === 'en_attente' && b.status !== 'en_attente') return -1
      if (a.status !== 'en_attente' && b.status === 'en_attente') return 1
      return 0
    })
  }, [inspections, searchText])

  // Stats
  const inspectionStats = useMemo(() => {
    const pending = inspections.filter(i => i.status === 'en_attente').length
    const validated = inspections.filter(i => i.status === 'valide').length
    const refused = inspections.filter(i => i.status === 'refuse').length
    return { pending, validated, refused, total: inspections.length }
  }, [inspections])

  // Housekeepers only
  const housekeepers = useMemo(() => {
    return staff.filter(s => s.role === 'femme_de_chambre' && s.active)
  }, [staff])

  // Demo stock data
  const stockItems = [
    { name: 'Draps (sets)', quantity: 45, unit: 'unités', minStock: 20 },
    { name: 'Serviettes bain', quantity: 120, unit: 'unités', minStock: 50 },
    { name: 'Savons', quantity: 8, unit: 'cartons', minStock: 10 },
    { name: 'Shampooing', quantity: 15, unit: 'cartons', minStock: 10 },
    { name: 'Papier toilette', quantity: 25, unit: 'packs', minStock: 15 },
    { name: 'Produit nettoyant', quantity: 12, unit: 'litres', minStock: 10 },
  ]

  // Handlers
  const handleOpenValidate = useCallback((inspection) => {
    setSelectedInspection(inspection)
    setRating(4)
    setComments('')
    setValidateDialogOpen(true)
  }, [])

  const handleOpenRefuse = useCallback((inspection) => {
    setSelectedInspection(inspection)
    setRefusedReason('')
    setRefuseDialogOpen(true)
  }, [])

  const handleConfirmValidate = useCallback(async () => {
    if (!selectedInspection) return
    await validateInspection(selectedInspection._id, true, rating, comments)
    setValidateDialogOpen(false)
    setSelectedInspection(null)
  }, [selectedInspection, rating, comments, validateInspection])

  const handleConfirmRefuse = useCallback(async () => {
    if (!selectedInspection || !refusedReason.trim()) {
      toast.error('Veuillez indiquer la raison du refus')
      return
    }
    await validateInspection(selectedInspection._id, false, 0, '', refusedReason)
    setRefuseDialogOpen(false)
    setSelectedInspection(null)
  }, [selectedInspection, refusedReason, validateInspection])

  // Loading
  if (loading && inspections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-3" style={{ color: COLORS.brand }} />
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50" data-testid="gouvernante-view-v2">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Gouvernante</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi size={12} className="text-emerald-500" />
                  <span className="text-emerald-600">Temps réel</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-amber-500" />
                  <span className="text-amber-600">Hors ligne</span>
                </>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <TabButton 
            active={activeTab === 'validation'} 
            icon={CheckCircle} 
            label="Validation" 
            count={inspectionStats.pending}
            onClick={() => setActiveTab('validation')}
          />
          <TabButton 
            active={activeTab === 'equipe'} 
            icon={Users} 
            label="Équipe" 
            count={housekeepers.length}
            onClick={() => setActiveTab('equipe')}
          />
          <TabButton 
            active={activeTab === 'stocks'} 
            icon={Package} 
            label="Stocks" 
            count={stockItems.filter(s => s.quantity <= s.minStock).length}
            onClick={() => setActiveTab('stocks')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* VALIDATION TAB */}
        {activeTab === 'validation' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: COLORS.warningSoft }}>
                    <Clock size={20} style={{ color: COLORS.warning }} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{inspectionStats.pending}</div>
                    <div className="text-xs text-slate-500">À valider</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: COLORS.successSoft }}>
                    <CheckCircle size={20} style={{ color: COLORS.success }} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{inspectionStats.validated}</div>
                    <div className="text-xs text-slate-500">Validées</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: COLORS.dangerSoft }}>
                    <X size={20} style={{ color: COLORS.danger }} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{inspectionStats.refused}</div>
                    <div className="text-xs text-slate-500">Refusées</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Rechercher chambre, employé..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Inspections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInspections.length > 0 ? (
                filteredInspections.map(insp => (
                  <InspectionCard 
                    key={insp._id}
                    inspection={insp}
                    onValidate={handleOpenValidate}
                    onRefuse={handleOpenRefuse}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Sparkles size={40} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">Aucune inspection en attente</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ÉQUIPE TAB */}
        {activeTab === 'equipe' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {housekeepers.length > 0 ? (
              housekeepers.map(member => (
                <TeamMemberCard key={member._id} member={member} tasks={tasks} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">Aucun membre d'équipe</p>
              </div>
            )}
          </div>
        )}

        {/* STOCKS TAB */}
        {activeTab === 'stocks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Inventaire</h3>
              <Badge variant="outline" className="text-xs">
                {stockItems.filter(s => s.quantity <= s.minStock).length} alertes
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockItems.map((item, idx) => (
                <StockItem key={idx} {...item} />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
              * Les stocks sont simulés pour la démo. Connectez votre système de gestion des stocks pour les données réelles.
            </p>
          </div>
        )}
      </div>

      {/* Validate Dialog */}
      <Dialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider la chambre {selectedInspection?.room_number}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Note de qualité
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star 
                      size={28} 
                      className={`transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Commentaires (optionnel)
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Remarques sur la qualité..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setValidateDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmValidate}
              style={{ background: COLORS.success }}
            >
              <CheckCircle size={16} className="mr-2" />
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refuse Dialog */}
      <Dialog open={refuseDialogOpen} onOpenChange={setRefuseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la chambre {selectedInspection?.room_number}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Raison du refus *
            </label>
            <Textarea
              value={refusedReason}
              onChange={(e) => setRefusedReason(e.target.value)}
              placeholder="Décrivez les problèmes constatés..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefuseDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmRefuse}
              disabled={!refusedReason.trim()}
              style={{ background: COLORS.danger }}
            >
              <X size={16} className="mr-2" />
              Refuser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
