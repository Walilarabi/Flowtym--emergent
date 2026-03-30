import { useState } from 'react'
import { 
  Receipt, CreditCard, Download, Send, Clock, CheckCircle, XCircle, Euro,
  Plus, Search, Filter, FileText, MoreHorizontal, Calendar, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCE MODULE - FLOWTYM V4
// Facturation & Paiements
// ═══════════════════════════════════════════════════════════════════════════════

const FinanceModule = () => {
  const [activeTab, setActiveTab] = useState('invoices')

  // Données de démonstration
  const invoices = [
    { 
      id: 'FAC-2026-0127', 
      client: 'M. Jean Dupont', 
      reservation: 'RES-4521',
      amount: 456.80,
      status: 'paid',
      dueDate: '2026-03-30',
      paidDate: '2026-03-28'
    },
    { 
      id: 'FAC-2026-0126', 
      client: 'Société ABC', 
      reservation: 'RES-4518',
      amount: 1250.00,
      status: 'pending',
      dueDate: '2026-04-05',
      paidDate: null
    },
    { 
      id: 'FAC-2026-0125', 
      client: 'Mme Marie Martin', 
      reservation: 'RES-4515',
      amount: 320.50,
      status: 'overdue',
      dueDate: '2026-03-25',
      paidDate: null
    },
    { 
      id: 'FAC-2026-0124', 
      client: 'M. Pierre Leroy', 
      reservation: 'RES-4510',
      amount: 890.00,
      status: 'paid',
      dueDate: '2026-03-22',
      paidDate: '2026-03-20'
    },
  ]

  const stats = {
    total: invoices.reduce((acc, inv) => acc + inv.amount, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0),
    pending: invoices.filter(i => i.status === 'pending').reduce((acc, inv) => acc + inv.amount, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((acc, inv) => acc + inv.amount, 0),
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'paid': return { label: 'Payée', color: '#10B981', bg: '#D1FAE5', icon: CheckCircle }
      case 'pending': return { label: 'En attente', color: '#F59E0B', bg: '#FEF3C7', icon: Clock }
      case 'overdue': return { label: 'En retard', color: '#EF4444', bg: '#FEE2E2', icon: XCircle }
      default: return { label: status, color: '#6B7280', bg: '#F3F4F6', icon: Clock }
    }
  }

  const tabs = [
    { id: 'invoices', label: 'Factures', icon: Receipt },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'accounting', label: 'Comptabilité', icon: FileText, badge: 'Bientôt' },
  ]

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Finance</h1>
            <p className="text-sm text-slate-500">Trésorerie & Comptabilité</p>
          </div>
          <Button className="gap-2" style={{ background: '#7C8CF8' }}>
            <Plus className="w-4 h-4" />
            Nouvelle facture
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Receipt className="w-4 h-4" />
              CA Total
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total.toLocaleString('fr-FR')} €</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Encaissé
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.paid.toLocaleString('fr-FR')} €</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Clock className="w-4 h-4" />
              En attente
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending.toLocaleString('fr-FR')} €</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
              <XCircle className="w-4 h-4" />
              En retard
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue.toLocaleString('fr-FR')} €</p>
          </div>
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
                {tab.badge && (
                  <Badge variant="outline" className="text-xs ml-1">{tab.badge}</Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Rechercher une facture..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Facture</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Réservation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Échéance</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => {
                const statusInfo = getStatusInfo(invoice.status)
                const StatusIcon = statusInfo.icon

                return (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-violet-600">{invoice.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">{invoice.client}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{invoice.reservation}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900">{invoice.amount.toLocaleString('fr-FR')} €</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {invoice.dueDate}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="w-4 h-4" style={{ color: statusInfo.color }} />
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: statusInfo.bg, color: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
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

export default FinanceModule
