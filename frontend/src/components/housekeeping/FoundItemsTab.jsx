/**
 * FoundItemsTab - Onglet Objets Trouvés dans la vue Réception
 * Affiche les objets déclarés par les femmes de chambre
 * Permet la gestion et restitution par la réception
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Package, Clock, Archive, CheckCircle, Search, Camera, User,
  Smartphone, Laptop, Key, Shirt, Briefcase, Footprints, Gem, Banknote,
  CreditCard, Calendar, AlertTriangle, ChevronDown
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import axios from 'axios'
import { useHotel } from '@/context/HotelContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  consigne: { label: 'Consigné', color: '#8B5CF6', bg: '#EDE9FE', icon: Archive },
  restitue: { label: 'Restitué', color: '#22C55E', bg: '#DCFCE7', icon: CheckCircle },
}

const ICON_MAP = {
  Smartphone: Smartphone,
  Laptop: Laptop,
  Key: Key,
  Shirt: Shirt,
  Briefcase: Briefcase,
  Footprints: Footprints,
  Gem: Gem,
  Banknote: Banknote,
  Package: Package,
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
// FOUND ITEM CARD
// ═══════════════════════════════════════════════════════════════════════════════

const FoundItemCard = ({ item, onSelect }) => {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.en_attente
  const CategoryIcon = ICON_MAP[item.category_icon] || Package

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (item.status !== 'en_attente') return null
    const created = new Date(item.created_at)
    const now = new Date()
    const daysSince = Math.floor((now - created) / (1000 * 60 * 60 * 24))
    return Math.max(0, (item.days_until_consign || 30) - daysSince)
  }

  const daysRemaining = getDaysRemaining()

  return (
    <button
      onClick={() => onSelect(item)}
      className="w-full p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-left"
      data-testid={`found-item-card-${item._id}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon Badge */}
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: status.bg }}
        >
          <CategoryIcon size={24} style={{ color: status.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800">
              {item.name || item.category_name}
            </span>
            <span className="text-xs text-slate-400">Ch. {item.room_number}</span>
          </div>

          {item.description && (
            <p className="text-xs text-slate-500 truncate mb-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <User size={10} />
              {item.reporter_name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {formatDate(item.created_at)}
            </span>
            {daysRemaining !== null && (
              <>
                <span>•</span>
                <span className={`font-medium ${daysRemaining <= 7 ? 'text-amber-500' : 'text-slate-500'}`}>
                  {daysRemaining}j restants
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
      {item.photo_url && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
          <Camera size={10} />
          Photo jointe
        </div>
      )}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETURN MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const ReturnModal = ({ item, open, onClose, onReturn, currentUser }) => {
  const [recipientName, setRecipientName] = useState('')
  const [loading, setLoading] = useState(false)

  if (!item) return null

  const CategoryIcon = ICON_MAP[item.category_icon] || Package

  const handleReturn = async () => {
    if (!recipientName.trim()) {
      toast.error('Le nom du récupérateur est obligatoire')
      return
    }

    setLoading(true)
    try {
      await onReturn(item._id, {
        recipient_name: recipientName,
        returned_by_id: currentUser?.id || 'user-1',
        returned_by_name: currentUser?.name || 'Réception',
      })
      toast.success('Objet restitué avec succès')
      onClose()
      setRecipientName('')
    } catch (e) {
      toast.error('Erreur lors de la restitution')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CategoryIcon size={20} />
            Restituer : {item.name || item.category_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info */}
          <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Chambre :</span>
              <span className="font-medium">{item.room_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trouvé le :</span>
              <span className="font-medium">
                {new Date(item.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Déclaré par :</span>
              <span className="font-medium">{item.reporter_name}</span>
            </div>
          </div>

          {/* Recipient Name */}
          <div className="space-y-2">
            <Label htmlFor="recipientName">
              Nom du récupérateur <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recipientName"
              placeholder="Nom et prénom"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          {/* ID Photo Notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm">
            <CreditCard size={16} className="text-amber-600 mt-0.5" />
            <div className="text-amber-700">
              <p className="font-medium">Pièce d'identité</p>
              <p className="text-xs">Vérifiez l'identité du récupérateur avant restitution</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleReturn} 
            disabled={loading || !recipientName.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle size={16} className="mr-2" />
            Confirmer la restitution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSIGN MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const ConsignModal = ({ item, open, onClose, onConsign, currentUser }) => {
  const [action, setAction] = useState('kept')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!item) return null

  const handleConsign = async () => {
    setLoading(true)
    try {
      await onConsign(item._id, {
        consigned_by_id: currentUser?.id || 'user-1',
        consigned_by_name: currentUser?.name || 'Direction',
        consign_action: action,
        consign_notes: notes,
      })
      toast.success('Objet mis en consigne')
      onClose()
    } catch (e) {
      toast.error('Erreur lors de la mise en consigne')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive size={20} />
            Consigner : {item.name || item.category_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action */}
          <div className="space-y-2">
            <Label>Action de consigne</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kept">Garder en consigne</SelectItem>
                <SelectItem value="destroyed">Détruire</SelectItem>
                <SelectItem value="donated">Donner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Notes de consigne..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleConsign} 
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Archive size={16} className="mr-2" />
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const DetailModal = ({ item, open, onClose, onReturn, onConsign, currentUser }) => {
  const [showReturn, setShowReturn] = useState(false)
  const [showConsign, setShowConsign] = useState(false)

  if (!item) return null

  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.en_attente
  const CategoryIcon = ICON_MAP[item.category_icon] || Package

  return (
    <>
      <Dialog open={open && !showReturn && !showConsign} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CategoryIcon size={20} />
              {item.name || item.category_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            <div 
              className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium items-center gap-2"
              style={{ background: status.bg, color: status.color }}
            >
              <status.icon size={16} />
              {status.label}
            </div>

            {/* Photo */}
            {item.photo_url && (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <img 
                  src={item.photo_url} 
                  alt="Photo de l'objet" 
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Description */}
            {item.description && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700">{item.description}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Chambre :</span>
                <p className="font-medium">{item.room_number}</p>
              </div>
              <div>
                <span className="text-slate-500">Catégorie :</span>
                <p className="font-medium">{item.category_name}</p>
              </div>
              <div>
                <span className="text-slate-500">Trouvé le :</span>
                <p className="font-medium">
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Déclaré par :</span>
                <p className="font-medium">{item.reporter_name}</p>
              </div>
              {item.location_found && (
                <div className="col-span-2">
                  <span className="text-slate-500">Lieu trouvé :</span>
                  <p className="font-medium">{item.location_found}</p>
                </div>
              )}
            </div>

            {/* Return info */}
            {item.status === 'restitue' && (
              <div className="p-3 bg-green-50 rounded-lg space-y-1 text-sm">
                <p className="font-medium text-green-700">Restitué à : {item.recipient_name}</p>
                <p className="text-green-600">
                  Le {new Date(item.returned_at).toLocaleDateString('fr-FR')} par {item.returned_by_name}
                </p>
              </div>
            )}

            {/* Consign info */}
            {item.status === 'consigne' && (
              <div className="p-3 bg-violet-50 rounded-lg space-y-1 text-sm">
                <p className="font-medium text-violet-700">
                  Action : {item.consign_action === 'kept' ? 'Gardé' : item.consign_action === 'destroyed' ? 'Détruit' : 'Donné'}
                </p>
                <p className="text-violet-600">
                  Le {new Date(item.consigned_at).toLocaleDateString('fr-FR')} par {item.consigned_by_name}
                </p>
                {item.consign_notes && (
                  <p className="text-violet-600 italic">{item.consign_notes}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {item.status === 'en_attente' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setShowConsign(true)}
                >
                  <Archive size={16} className="mr-2" />
                  Consigner
                </Button>
                <Button 
                  onClick={() => setShowReturn(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Restituer
                </Button>
              </>
            )}
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReturnModal
        item={item}
        open={showReturn}
        onClose={() => setShowReturn(false)}
        onReturn={onReturn}
        currentUser={currentUser}
      />

      <ConsignModal
        item={item}
        open={showConsign}
        onClose={() => setShowConsign(false)}
        onConsign={onConsign}
        currentUser={currentUser}
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function FoundItemsTab({ currentUser }) {
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id

  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ pending: 0, consigned: 0, returned: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    
    try {
      const [itemsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/found-items`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/found-items/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ])
      setItems(itemsRes.data || [])
      setStats(statsRes.data || { pending: 0, consigned: 0, returned: 0 })
    } catch (e) {
      console.error('Error fetching found items:', e)
    }
    setLoading(false)
  }, [hotelId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle return
  const handleReturn = async (itemId, data) => {
    const token = localStorage.getItem('flowtym_token')
    await axios.post(
      `${API_URL}/api/v2/hotels/${hotelId}/found-items/${itemId}/return`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    fetchData()
    setSelectedItem(null)
  }

  // Handle consign
  const handleConsign = async (itemId, data) => {
    const token = localStorage.getItem('flowtym_token')
    await axios.post(
      `${API_URL}/api/v2/hotels/${hotelId}/found-items/${itemId}/consign`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    fetchData()
    setSelectedItem(null)
  }

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return []
    let result = items
    
    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter)
    }
    
    if (searchText) {
      const s = searchText.toLowerCase()
      result = result.filter(i => 
        i.room_number?.includes(s) ||
        i.category_name?.toLowerCase().includes(s) ||
        i.name?.toLowerCase().includes(s) ||
        i.reporter_name?.toLowerCase().includes(s)
      )
    }
    
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [items, statusFilter, searchText])

  // Group by date
  const groupedItems = useMemo(() => {
    const grouped = {}
    filteredItems.forEach(item => {
      const dateKey = new Date(item.created_at).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(item)
    })
    return Object.entries(grouped)
  }, [filteredItems])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="found-items-tab">
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
          label="Consignés" 
          count={stats.consigned} 
          {...STATUS_CONFIG.consigne}
          active={statusFilter === 'consigne'}
          onClick={() => setStatusFilter(statusFilter === 'consigne' ? 'all' : 'consigne')}
        />
        <StatCard 
          label="Restitués" 
          count={stats.returned} 
          {...STATUS_CONFIG.restitue}
          active={statusFilter === 'restitue'}
          onClick={() => setStatusFilter(statusFilter === 'restitue' ? 'all' : 'restitue')}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input
          placeholder="Rechercher par chambre, catégorie, objet..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {groupedItems.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Aucun objet trouvé</p>
            <p className="text-xs text-slate-400 mt-1">
              Les objets déclarés par les femmes de chambre apparaîtront ici
            </p>
          </div>
        ) : (
          groupedItems.map(([date, dayItems]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-slate-500 mb-2 capitalize">
                {date}
              </h3>
              <div className="space-y-2">
                {dayItems.map(item => (
                  <FoundItemCard 
                    key={item._id} 
                    item={item} 
                    onSelect={setSelectedItem}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onReturn={handleReturn}
        onConsign={handleConsign}
        currentUser={currentUser}
      />
    </div>
  )
}
