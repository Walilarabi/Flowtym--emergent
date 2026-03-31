/**
 * ReportsTab - Onglet Signalements dans la vue Réception
 * Affiche les signalements créés par les femmes de chambre
 * Permet la gestion par la maintenance
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  AlertTriangle, Clock, CheckCircle, Wrench, MessageSquare, 
  Receipt, Camera, Search, Filter, ChevronDown, ChevronRight,
  Lightbulb, Wind, Lock, Droplet, Tv, Armchair, Droplets, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import axios from 'axios'
import { useHotel } from '@/context/HotelContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  en_cours: { label: 'En cours', color: '#3B82F6', bg: '#DBEAFE', icon: Wrench },
  resolu: { label: 'Résolu', color: '#22C55E', bg: '#DCFCE7', icon: CheckCircle },
}

const PRIORITY_CONFIG = {
  basse: { label: 'Basse', color: '#64748B' },
  moyenne: { label: 'Moyenne', color: '#F59E0B' },
  haute: { label: 'Haute', color: '#EF4444' },
  urgente: { label: 'Urgente', color: '#DC2626' },
}

const ICON_MAP = {
  Droplets: Droplets,
  Lightbulb: Lightbulb,
  Wind: Wind,
  Lock: Lock,
  Droplet: Droplet,
  Armchair: Armchair,
  Tv: Tv,
  AlertTriangle: AlertTriangle,
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const StatCard = ({ label, count, color, bg, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'ring-2 ring-offset-2' : 'hover:scale-[1.02]'
    }`}
    style={{ 
      background: bg, 
      ringColor: color 
    }}
  >
    <div 
      className="w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ background: `${color}20` }}
    >
      <Icon size={20} style={{ color }} />
    </div>
    <div className="text-left">
      <div className="text-2xl font-bold" style={{ color }}>{count}</div>
      <div className="text-xs text-slate-600">{label}</div>
    </div>
  </button>
)

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const ReportCard = ({ report, onSelect }) => {
  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.en_attente
  const priority = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.moyenne
  const CategoryIcon = ICON_MAP[report.category_icon] || AlertTriangle

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <button
      onClick={() => onSelect(report)}
      className="w-full p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-left"
      data-testid={`report-card-${report._id}`}
    >
      <div className="flex items-start gap-3">
        {/* Room Badge */}
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: status.bg }}
        >
          <span className="text-lg font-bold" style={{ color: status.color }}>
            {report.room_number}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon size={14} style={{ color: priority.color }} />
            <span className="font-semibold text-slate-800 truncate">
              {report.category_name}
            </span>
            {report.priority === 'urgente' && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 rounded animate-pulse">
                URGENT
              </span>
            )}
          </div>

          {report.description && (
            <p className="text-xs text-slate-500 truncate mb-2">
              {report.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <User size={10} />
              {report.reporter_name}
            </span>
            <span>•</span>
            <span>{formatDate(report.created_at)}</span>
            {report.technician_name && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-500">
                  <Wrench size={10} />
                  {report.technician_name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div 
          className="px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1"
          style={{ background: status.bg, color: status.color }}
        >
          <status.icon size={12} />
          {status.label}
        </div>
      </div>

      {/* Photo indicator */}
      {report.photo_url && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
          <Camera size={10} />
          Photo jointe
        </div>
      )}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const ReportDetailModal = ({ report, open, onClose, onUpdate, currentUser }) => {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')

  if (!report) return null

  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.en_attente
  const CategoryIcon = ICON_MAP[report.category_icon] || AlertTriangle

  const handleTakeOver = async () => {
    setLoading(true)
    try {
      await onUpdate(report._id, 'take-over', {
        technician_id: currentUser?.id || 'tech-1',
        technician_name: currentUser?.name || 'Technicien',
      })
      toast.success('Signalement pris en charge')
    } catch (e) {
      toast.error('Erreur lors de la prise en charge')
    }
    setLoading(false)
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setLoading(true)
    try {
      await onUpdate(report._id, 'comment', {
        author_id: currentUser?.id || 'user-1',
        author_name: currentUser?.name || 'Utilisateur',
        content: comment,
      })
      setComment('')
      toast.success('Commentaire ajouté')
    } catch (e) {
      toast.error('Erreur lors de l\'ajout du commentaire')
    }
    setLoading(false)
  }

  const handleResolve = async () => {
    setLoading(true)
    try {
      await onUpdate(report._id, 'resolve', {
        resolution_notes: resolutionNotes,
        resolved_by_id: currentUser?.id || 'tech-1',
        resolved_by_name: currentUser?.name || 'Technicien',
      })
      toast.success('Signalement résolu')
      onClose()
    } catch (e) {
      toast.error('Erreur lors de la résolution')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CategoryIcon size={20} />
            Chambre {report.room_number} - {report.category_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Priority */}
          <div className="flex gap-2">
            <div 
              className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ background: status.bg, color: status.color }}
            >
              <status.icon size={16} />
              {status.label}
            </div>
            <div 
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ 
                background: `${PRIORITY_CONFIG[report.priority]?.color}20`, 
                color: PRIORITY_CONFIG[report.priority]?.color 
              }}
            >
              Priorité {PRIORITY_CONFIG[report.priority]?.label}
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">{report.description}</p>
            </div>
          )}

          {/* Photo */}
          {report.photo_url && (
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <img 
                src={report.photo_url} 
                alt="Photo du signalement" 
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Signalé par :</span>
              <p className="font-medium">{report.reporter_name}</p>
            </div>
            <div>
              <span className="text-slate-500">Date :</span>
              <p className="font-medium">
                {new Date(report.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {report.technician_name && (
              <div>
                <span className="text-slate-500">Technicien :</span>
                <p className="font-medium text-blue-600">{report.technician_name}</p>
              </div>
            )}
            {report.taken_at && (
              <div>
                <span className="text-slate-500">Pris en charge le :</span>
                <p className="font-medium">
                  {new Date(report.taken_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          {/* Comments */}
          {report.comments && report.comments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <MessageSquare size={14} /> Commentaires
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {report.comments.map((c, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg text-xs">
                    <div className="flex justify-between text-slate-500 mb-1">
                      <span className="font-medium">{c.author_name}</span>
                      <span>{new Date(c.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    <p className="text-slate-700">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice */}
          {report.invoice_url && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Receipt size={16} className="text-green-600" />
              <div>
                <span className="text-sm font-medium text-green-700">Facture jointe</span>
                {report.invoice_amount && (
                  <span className="text-sm text-green-600 ml-2">
                    ({report.invoice_amount} €)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Add Comment */}
          {report.status !== 'resolu' && (
            <div className="space-y-2">
              <Textarea
                placeholder="Ajouter un commentaire..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleAddComment}
                disabled={loading || !comment.trim()}
              >
                <MessageSquare size={14} className="mr-1" />
                Ajouter
              </Button>
            </div>
          )}

          {/* Resolution Notes */}
          {report.status === 'en_cours' && (
            <div className="space-y-2">
              <Textarea
                placeholder="Notes de résolution (optionnel)..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {report.status === 'en_attente' && (
            <Button onClick={handleTakeOver} disabled={loading}>
              <Wrench size={16} className="mr-2" />
              Prendre en charge
            </Button>
          )}
          {report.status === 'en_cours' && (
            <Button 
              onClick={handleResolve} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={16} className="mr-2" />
              Résoudre
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReportsTab({ currentUser }) {
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id

  const [reports, setReports] = useState([])
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    
    try {
      const [reportsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/reports/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ])
      setReports(reportsRes.data || [])
      setStats(statsRes.data || { pending: 0, in_progress: 0, resolved: 0 })
    } catch (e) {
      console.error('Error fetching reports:', e)
    }
    setLoading(false)
  }, [hotelId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle report update
  const handleUpdateReport = async (reportId, action, data) => {
    const token = localStorage.getItem('flowtym_token')
    await axios.post(
      `${API_URL}/api/v2/hotels/${hotelId}/reports/${reportId}/${action}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    fetchData()
    if (selectedReport?._id === reportId) {
      const updated = await axios.get(
        `${API_URL}/api/v2/hotels/${hotelId}/reports/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSelectedReport(updated.data)
    }
  }

  // Filter reports
  const filteredReports = useMemo(() => {
    if (!reports) return []
    let result = reports
    
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter)
    }
    
    if (searchText) {
      const s = searchText.toLowerCase()
      result = result.filter(r => 
        r.room_number?.includes(s) ||
        r.category_name?.toLowerCase().includes(s) ||
        r.reporter_name?.toLowerCase().includes(s)
      )
    }
    
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [reports, statusFilter, searchText])

  // Group by date
  const groupedReports = useMemo(() => {
    const grouped = {}
    filteredReports.forEach(report => {
      const dateKey = new Date(report.created_at).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(report)
    })
    return Object.entries(grouped)
  }, [filteredReports])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="reports-tab">
      {/* Header Stats */}
      <div className="flex flex-wrap gap-3">
        <StatCard 
          label="En attente" 
          count={stats.pending} 
          {...STATUS_CONFIG.en_attente}
          active={statusFilter === 'en_attente'}
          onClick={() => setStatusFilter(statusFilter === 'en_attente' ? 'all' : 'en_attente')}
        />
        <StatCard 
          label="En cours" 
          count={stats.in_progress} 
          {...STATUS_CONFIG.en_cours}
          active={statusFilter === 'en_cours'}
          onClick={() => setStatusFilter(statusFilter === 'en_cours' ? 'all' : 'en_cours')}
        />
        <StatCard 
          label="Résolus" 
          count={stats.resolved} 
          {...STATUS_CONFIG.resolu}
          active={statusFilter === 'resolu'}
          onClick={() => setStatusFilter(statusFilter === 'resolu' ? 'all' : 'resolu')}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input
          placeholder="Rechercher par chambre, catégorie, signaleur..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {groupedReports.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Aucun signalement</p>
            <p className="text-xs text-slate-400 mt-1">
              Les signalements créés par les femmes de chambre apparaîtront ici
            </p>
          </div>
        ) : (
          groupedReports.map(([date, dayReports]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-slate-500 mb-2 capitalize">
                {date}
              </h3>
              <div className="space-y-2">
                {dayReports.map(report => (
                  <ReportCard 
                    key={report._id} 
                    report={report} 
                    onSelect={setSelectedReport}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdate={handleUpdateReport}
        currentUser={currentUser}
      />
    </div>
  )
}
