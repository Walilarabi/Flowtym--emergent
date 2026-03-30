import { useState } from 'react'
import { 
  Wrench, AlertTriangle, Clock, CheckCircle, User, Building2, Calendar,
  Plus, Filter, Search, ChevronRight, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ═══════════════════════════════════════════════════════════════════════════════
// MAINTENANCE MODULE - FLOWTYM V4
// Gestion des tickets de maintenance
// ═══════════════════════════════════════════════════════════════════════════════

const MaintenanceModule = () => {
  const [activeTab, setActiveTab] = useState('tickets')
  const [searchQuery, setSearchQuery] = useState('')

  // Données de démonstration
  const tickets = [
    { id: 'MT-001', title: 'Fuite robinet salle de bain', room: '203', priority: 'urgent', status: 'open', assignee: 'Marc D.', created: '2026-03-30 08:15' },
    { id: 'MT-002', title: 'Climatisation ne fonctionne pas', room: '105', priority: 'high', status: 'in_progress', assignee: 'Jean P.', created: '2026-03-29 14:30' },
    { id: 'MT-003', title: 'Ampoule grillée couloir', room: 'Couloir 2', priority: 'low', status: 'open', assignee: null, created: '2026-03-30 09:00' },
    { id: 'MT-004', title: 'Serrure porte difficile', room: '412', priority: 'normal', status: 'resolved', assignee: 'Marc D.', created: '2026-03-28 16:45' },
    { id: 'MT-005', title: 'TV ne s\'allume plus', room: '307', priority: 'normal', status: 'in_progress', assignee: 'Jean P.', created: '2026-03-29 11:20' },
  ]

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
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
      case 'open': return { label: 'Ouvert', color: '#EF4444', icon: AlertTriangle }
      case 'in_progress': return { label: 'En cours', color: '#F59E0B', icon: Clock }
      case 'resolved': return { label: 'Résolu', color: '#10B981', icon: CheckCircle }
      default: return { label: status, color: '#6B7280', icon: Clock }
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Maintenance</h1>
            <p className="text-sm text-slate-500">Gestion des tickets et interventions</p>
          </div>
          <Button className="gap-2" style={{ background: '#7C8CF8' }}>
            <Plus className="w-4 h-4" />
            Nouveau ticket
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Wrench className="w-4 h-4" />
              Total
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Ouverts
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.open}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Clock className="w-4 h-4" />
              En cours
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Résolus
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              Urgents
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.urgent}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Rechercher un ticket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </Button>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ticket</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chambre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Priorité</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Assigné</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Créé le</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => {
                const priorityStyle = getPriorityColor(ticket.priority)
                const statusInfo = getStatusInfo(ticket.status)
                const StatusIcon = statusInfo.icon

                return (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-xs font-medium text-slate-400">{ticket.id}</span>
                        <p className="text-sm font-medium text-slate-900">{ticket.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{ticket.room}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                        style={{ background: priorityStyle.bg, color: priorityStyle.text }}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-4 h-4" style={{ color: statusInfo.color }} />
                        <span className="text-sm" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {ticket.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                            <User className="w-3 h-3 text-violet-600" />
                          </div>
                          <span className="text-sm text-slate-700">{ticket.assignee}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Non assigné</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-500">{ticket.created}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceModule
