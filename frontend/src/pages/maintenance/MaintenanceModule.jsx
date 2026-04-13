import { useState, useEffect, useCallback } from 'react'
import { 
  Wrench, AlertTriangle, Clock, CheckCircle, User, Building2, Calendar,
  Plus, Filter, Search, ChevronRight, MoreHorizontal, X, Loader2, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useHotel } from '@/context/HotelContext'
import { toast } from 'sonner'

const API = import.meta.env.VITE_BACKEND_URL || ''

const MaintenanceModule = () => {
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id || ''
  const [activeTab, setActiveTab] = useState('tickets')
  const [searchQuery, setSearchQuery] = useState('')
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0, urgent: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', room_number: '', priority: 'normal', category: 'general' })
  const [creating, setCreating] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = useCallback(async () => {
    if (!hotelId) return
    setLoading(true)
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        fetch(`${API}/api/maintenance/${hotelId}/tickets${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`),
        fetch(`${API}/api/maintenance/${hotelId}/stats`),
      ])
      if (ticketsRes.ok) {
        const data = await ticketsRes.json()
        setTickets(data.tickets || [])
      }
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
    } catch (err) {
      console.error('Maintenance fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [hotelId, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.title) return
    setCreating(true)
    try {
      const res = await fetch(`${API}/api/maintenance/${hotelId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, ...formData }),
      })
      if (res.ok) {
        toast.success('Ticket cree')
        setShowForm(false)
        setFormData({ title: '', description: '', room_number: '', priority: 'normal', category: 'general' })
        fetchData()
      }
    } catch (err) {
      toast.error('Erreur creation ticket')
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${API}/api/maintenance/${hotelId}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success('Statut mis a jour')
        fetchData()
      }
    } catch (err) {
      toast.error('Erreur')
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: '#FEE2E2', text: '#DC2626' }
      case 'high': return { bg: '#FEF3C7', text: '#D97706' }
      case 'normal': return { bg: '#DBEAFE', text: '#2563EB' }
      case 'low': return { bg: '#F3F4F6', text: '#6B7280' }
      default: return { bg: '#F3F4F6', text: '#6B7280' }
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'open': case 'new': return { label: 'Ouvert', color: '#EF4444', icon: AlertTriangle }
      case 'in_progress': return { label: 'En cours', color: '#F59E0B', icon: Clock }
      case 'resolved': case 'closed': return { label: 'Resolu', color: '#10B981', icon: CheckCircle }
      default: return { label: status || 'Inconnu', color: '#6B7280', icon: Clock }
    }
  }

  const filteredTickets = tickets.filter(t =>
    !searchQuery || t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.room_number?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: 'tickets', label: 'Tickets', icon: Wrench },
    { id: 'planning', label: 'Preventif', icon: Calendar, badge: 'Bientot' },
  ]

  return (
    <div data-testid="maintenance-module" className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Maintenance</h1>
            <p className="text-sm text-slate-500">Gestion des interventions techniques</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              data-testid="btn-new-ticket"
              className="gap-2"
              style={{ background: '#7C8CF8', borderRadius: '40px' }}
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="w-4 h-4" />
              Nouveau ticket
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <StatCard label="Total" value={stats.total} color="#6B7280" icon={Wrench} />
          <StatCard label="Ouverts" value={stats.open} color="#EF4444" icon={AlertTriangle} />
          <StatCard label="En cours" value={stats.in_progress} color="#F59E0B" icon={Clock} />
          <StatCard label="Resolus" value={stats.resolved} color="#10B981" icon={CheckCircle} />
          <StatCard label="Urgents" value={stats.urgent} color="#DC2626" icon={AlertTriangle} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-slate-200 -mb-[1px]">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                  activeTab === tab.id
                    ? 'text-violet-600 border-violet-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && <Badge variant="outline" className="text-xs ml-1">{tab.badge}</Badge>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-5 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Nouveau ticket</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Titre</label>
                <Input data-testid="ticket-title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Fuite robinet..." required />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Chambre</label>
                <Input data-testid="ticket-room" value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} placeholder="203" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Description</label>
              <Input data-testid="ticket-description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Details..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Priorite</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                  <option value="urgent">Urgent</option>
                  <option value="high">Haute</option>
                  <option value="normal">Normale</option>
                  <option value="low">Basse</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Categorie</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                  <option value="plumbing">Plomberie</option>
                  <option value="electrical">Electricite</option>
                  <option value="hvac">Climatisation</option>
                  <option value="furniture">Mobilier</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            <Button data-testid="btn-create-ticket" type="submit" disabled={creating} className="w-full" style={{ background: '#10B981', borderRadius: '40px' }}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Creer le ticket'}
            </Button>
          </form>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
            <option value="all">Tous</option>
            <option value="open">Ouverts</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Resolus</option>
          </select>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Aucun ticket de maintenance</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ticket</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chambre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Priorite</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Assigne</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const priority = getPriorityColor(ticket.priority)
                  const statusInfo = getStatusInfo(ticket.status)
                  const StatusIcon = statusInfo.icon
                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{ticket.title}</p>
                        <p className="text-xs text-slate-400">{ticket.id?.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{ticket.room_number || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: priority.bg, color: priority.text }}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className="w-4 h-4" style={{ color: statusInfo.color }} />
                          <span className="text-sm" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{ticket.assigned_to || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {ticket.status === 'open' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(ticket.id, 'in_progress')}>
                              Prendre en charge
                            </Button>
                          )}
                          {ticket.status === 'in_progress' && (
                            <Button size="sm" style={{ background: '#10B981' }} onClick={() => handleStatusChange(ticket.id, 'resolved')}>
                              Resoudre
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="rounded-xl p-3" style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
  </div>
)

export default MaintenanceModule
