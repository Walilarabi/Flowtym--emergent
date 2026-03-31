/**
 * ReportDetailPanel - Panneau de détail d'un signalement
 * Workflow complet: En attente → Prise en charge → Facture → Résolution
 * 
 * Fonctionnalités:
 * - Timeline des actions
 * - Prise en charge par la maintenance
 * - Ajout de commentaires
 * - Ajout de facture (montant)
 * - Résolution avec notes
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  AlertTriangle, Clock, CheckCircle, Wrench, MessageSquare, 
  Receipt, Camera, User, Calendar, ArrowRight, X, Send,
  Lightbulb, Wind, Lock, Droplet, Tv, Armchair, Droplets,
  FileText, DollarSign, Loader2, ChevronDown, ChevronRight,
  History, Plus, Check, Euro
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  en_attente: { 
    label: 'En attente', 
    color: '#F59E0B', 
    bg: '#FEF3C7', 
    icon: Clock,
    step: 1,
    description: 'En attente de prise en charge par la maintenance'
  },
  en_cours: { 
    label: 'En cours', 
    color: '#3B82F6', 
    bg: '#DBEAFE', 
    icon: Wrench,
    step: 2,
    description: 'Pris en charge par la maintenance'
  },
  resolu: { 
    label: 'Résolu', 
    color: '#22C55E', 
    bg: '#DCFCE7', 
    icon: CheckCircle,
    step: 3,
    description: 'Problème résolu'
  },
}

const PRIORITY_CONFIG = {
  basse: { label: 'Basse', color: '#64748B', bg: '#F1F5F9' },
  moyenne: { label: 'Moyenne', color: '#F59E0B', bg: '#FEF3C7' },
  haute: { label: 'Haute', color: '#EF4444', bg: '#FEE2E2' },
  urgente: { label: 'Urgente', color: '#DC2626', bg: '#FEE2E2' },
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
// PROGRESS STEPPER
// ═══════════════════════════════════════════════════════════════════════════════

const ProgressStepper = ({ currentStatus }) => {
  const steps = [
    { id: 'en_attente', label: 'Signalé', icon: AlertTriangle },
    { id: 'en_cours', label: 'En cours', icon: Wrench },
    { id: 'resolu', label: 'Résolu', icon: CheckCircle },
  ]
  
  const currentStep = STATUS_CONFIG[currentStatus]?.step || 1

  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => {
        const StepIcon = step.icon
        const isCompleted = (index + 1) < currentStep
        const isCurrent = (index + 1) === currentStep
        
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  isCurrent ? 'bg-violet-500 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? <Check size={20} /> : <StepIcon size={18} />}
              </div>
              <span className={`text-xs mt-2 font-medium ${
                isCompleted || isCurrent ? 'text-slate-700' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE ITEM
// ═══════════════════════════════════════════════════════════════════════════════

const TimelineItem = ({ type, title, description, date, author, isLast }) => {
  const typeConfig = {
    created: { icon: AlertTriangle, color: '#F59E0B', bg: '#FEF3C7' },
    taken: { icon: Wrench, color: '#3B82F6', bg: '#DBEAFE' },
    comment: { icon: MessageSquare, color: '#8B5CF6', bg: '#EDE9FE' },
    invoice: { icon: Receipt, color: '#14B8A6', bg: '#CCFBF1' },
    resolved: { icon: CheckCircle, color: '#22C55E', bg: '#DCFCE7' },
  }
  
  const config = typeConfig[type] || typeConfig.comment
  const Icon = config.icon

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.bg }}
        >
          <Icon size={14} style={{ color: config.color }} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
      </div>
      <div className={`flex-1 ${!isLast ? 'pb-4' : ''}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-800">{title}</h4>
          <span className="text-xs text-slate-400">{date}</span>
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
        {author && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <User size={10} /> {author}
          </p>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const ActionPanel = ({ 
  report, 
  currentUser, 
  onTakeOver, 
  onAddComment, 
  onAddInvoice, 
  onResolve,
  loading 
}) => {
  const [comment, setComment] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)

  const handleSubmitComment = () => {
    if (!comment.trim()) return
    onAddComment(comment)
    setComment('')
  }

  const handleSubmitInvoice = () => {
    if (!invoiceAmount) return
    onAddInvoice(parseFloat(invoiceAmount))
    setInvoiceAmount('')
    setShowInvoiceForm(false)
  }

  const handleResolve = () => {
    onResolve(resolutionNotes)
  }

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <Wrench size={16} />
        Actions
      </h3>

      {/* En attente: Bouton de prise en charge */}
      {report.status === 'en_attente' && (
        <Button 
          onClick={onTakeOver} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Wrench size={16} className="mr-2" />
          )}
          Prendre en charge
        </Button>
      )}

      {/* En cours: Commentaire + Facture + Résolution */}
      {report.status === 'en_cours' && (
        <>
          {/* Add Comment */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-600">Ajouter un commentaire</Label>
            <div className="flex gap-2">
              <Textarea
                placeholder="Décrivez l'avancement..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button 
                size="sm"
                onClick={handleSubmitComment}
                disabled={loading || !comment.trim()}
                className="self-end"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>

          {/* Add Invoice */}
          {!report.invoice_amount ? (
            <div className="space-y-2">
              {showInvoiceForm ? (
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3">
                  <Label className="text-xs text-slate-600">Montant de la facture</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Euro size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button 
                      size="sm"
                      onClick={handleSubmitInvoice}
                      disabled={loading || !invoiceAmount}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Check size={14} className="mr-1" />
                      Valider
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => setShowInvoiceForm(false)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowInvoiceForm(true)}
                >
                  <Receipt size={16} className="mr-2" />
                  Ajouter une facture
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg border border-teal-100">
              <Receipt size={16} className="text-teal-600" />
              <span className="text-sm font-medium text-teal-700">
                Facture: {report.invoice_amount?.toFixed(2)} €
              </span>
              <Check size={16} className="text-teal-600 ml-auto" />
            </div>
          )}

          {/* Resolution */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <Label className="text-xs text-slate-600">Notes de résolution (optionnel)</Label>
            <Textarea
              placeholder="Décrivez la solution apportée..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={2}
            />
            <Button 
              onClick={handleResolve}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <CheckCircle size={16} className="mr-2" />
              )}
              Marquer comme résolu
            </Button>
          </div>
        </>
      )}

      {/* Résolu: Message de confirmation */}
      {report.status === 'resolu' && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <CheckCircle size={24} className="text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-700">Signalement résolu</p>
            {report.resolved_at && (
              <p className="text-xs text-emerald-600">
                Le {new Date(report.resolved_at).toLocaleDateString('fr-FR')} à{' '}
                {new Date(report.resolved_at).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReportDetailPanel({ 
  report, 
  open, 
  onClose, 
  onUpdate, 
  currentUser,
  hotelId 
}) {
  const [loading, setLoading] = useState(false)
  const [localReport, setLocalReport] = useState(report)

  useEffect(() => {
    setLocalReport(report)
  }, [report])

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Build timeline (must be before any conditional returns)
  const timeline = useMemo(() => {
    if (!localReport) return []
    const items = []
    
    // Created
    if (localReport.created_at) {
      items.push({
        type: 'created',
        title: 'Signalement créé',
        description: localReport.category_name,
        date: formatDate(localReport.created_at),
        author: localReport.reporter_name,
      })
    }
    
    // Taken
    if (localReport.taken_at) {
      items.push({
        type: 'taken',
        title: 'Prise en charge',
        description: 'Intervention démarrée',
        date: formatDate(localReport.taken_at),
        author: localReport.technician_name,
      })
    }
    
    // Comments
    localReport.comments?.forEach(c => {
      items.push({
        type: 'comment',
        title: 'Commentaire',
        description: c.content,
        date: formatDate(c.created_at),
        author: c.author_name,
      })
    })
    
    // Invoice
    if (localReport.invoice_amount) {
      items.push({
        type: 'invoice',
        title: 'Facture ajoutée',
        description: `Montant: ${localReport.invoice_amount?.toFixed(2)} €`,
        date: formatDate(localReport.updated_at),
      })
    }
    
    // Resolved
    if (localReport.resolved_at) {
      items.push({
        type: 'resolved',
        title: 'Résolu',
        description: localReport.resolution_notes || 'Problème résolu',
        date: formatDate(localReport.resolved_at),
      })
    }
    
    return items.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [localReport])

  // API Handlers (must be before conditional returns)
  const handleTakeOver = async () => {
    if (!localReport) return
    setLoading(true)
    const token = localStorage.getItem('flowtym_token')
    
    try {
      const res = await axios.post(
        `${API_URL}/api/v2/hotels/${hotelId}/reports/${localReport._id}/take-over`,
        {
          technician_id: currentUser?.id || 'tech-1',
          technician_name: currentUser?.name || 'Technicien Maintenance',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLocalReport(res.data)
      onUpdate?.(res.data)
      toast.success('Signalement pris en charge')
    } catch (e) {
      toast.error('Erreur lors de la prise en charge')
      console.error(e)
    }
    setLoading(false)
  }

  const handleAddComment = async (content) => {
    if (!localReport) return
    setLoading(true)
    const token = localStorage.getItem('flowtym_token')
    
    try {
      const res = await axios.post(
        `${API_URL}/api/v2/hotels/${hotelId}/reports/${localReport._id}/comment`,
        {
          author_id: currentUser?.id || 'user-1',
          author_name: currentUser?.name || 'Utilisateur',
          content,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLocalReport(res.data)
      onUpdate?.(res.data)
      toast.success('Commentaire ajouté')
    } catch (e) {
      toast.error('Erreur lors de l\'ajout du commentaire')
      console.error(e)
    }
    setLoading(false)
  }

  const handleAddInvoice = async (amount) => {
    if (!localReport) return
    setLoading(true)
    const token = localStorage.getItem('flowtym_token')
    
    try {
      const res = await axios.post(
        `${API_URL}/api/v2/hotels/${hotelId}/reports/${localReport._id}/invoice`,
        {
          invoice_amount: amount,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLocalReport(res.data)
      onUpdate?.(res.data)
      toast.success('Facture ajoutée')
    } catch (e) {
      toast.error('Erreur lors de l\'ajout de la facture')
      console.error(e)
    }
    setLoading(false)
  }

  const handleResolve = async (notes) => {
    if (!localReport) return
    setLoading(true)
    const token = localStorage.getItem('flowtym_token')
    
    try {
      const res = await axios.post(
        `${API_URL}/api/v2/hotels/${hotelId}/reports/${localReport._id}/resolve`,
        {
          resolution_notes: notes,
          resolved_by_id: currentUser?.id || 'tech-1',
          resolved_by_name: currentUser?.name || 'Technicien',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLocalReport(res.data)
      onUpdate?.(res.data)
      toast.success('Signalement résolu')
    } catch (e) {
      toast.error('Erreur lors de la résolution')
      console.error(e)
    }
    setLoading(false)
  }

  // Now we can safely return early if no report
  if (!localReport) return null

  const status = STATUS_CONFIG[localReport.status] || STATUS_CONFIG.en_attente
  const priority = PRIORITY_CONFIG[localReport.priority] || PRIORITY_CONFIG.moyenne
  const CategoryIcon = ICON_MAP[localReport.category_icon] || AlertTriangle

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: status.bg }}
            >
              <CategoryIcon size={20} style={{ color: status.color }} />
            </div>
            <div>
              <span className="text-lg">Chambre {localReport.room_number}</span>
              <p className="text-sm font-normal text-slate-500">{localReport.category_name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Progress Stepper */}
          <ProgressStepper currentStatus={localReport.status} />

          {/* Status & Priority Badges */}
          <div className="flex gap-2 flex-wrap">
            <div 
              className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              <status.icon size={14} />
              {status.label}
            </div>
            <div 
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: priority.bg, color: priority.color }}
            >
              Priorité {priority.label}
            </div>
          </div>

          {/* Description */}
          {localReport.description && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-700">{localReport.description}</p>
            </div>
          )}

          {/* Photo */}
          {localReport.photo_url && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <img 
                src={localReport.photo_url} 
                alt="Photo du signalement" 
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <User size={12} /> Signalé par
              </span>
              <p className="font-medium text-slate-800 mt-1">{localReport.reporter_name}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar size={12} /> Date
              </span>
              <p className="font-medium text-slate-800 mt-1">
                {new Date(localReport.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {localReport.technician_name && (
              <div className="p-3 bg-blue-50 rounded-xl">
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <Wrench size={12} /> Technicien
                </span>
                <p className="font-medium text-blue-800 mt-1">{localReport.technician_name}</p>
              </div>
            )}
            {localReport.invoice_amount && (
              <div className="p-3 bg-teal-50 rounded-xl">
                <span className="text-xs text-teal-600 flex items-center gap-1">
                  <Receipt size={12} /> Facture
                </span>
                <p className="font-medium text-teal-800 mt-1">{localReport.invoice_amount.toFixed(2)} €</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <History size={16} />
              Historique
            </h3>
            <div className="space-y-0">
              {timeline.map((item, index) => (
                <TimelineItem
                  key={index}
                  type={item.type}
                  title={item.title}
                  description={item.description}
                  date={item.date}
                  author={item.author}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <ActionPanel
            report={localReport}
            currentUser={currentUser}
            onTakeOver={handleTakeOver}
            onAddComment={handleAddComment}
            onAddInvoice={handleAddInvoice}
            onResolve={handleResolve}
            loading={loading}
          />
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
