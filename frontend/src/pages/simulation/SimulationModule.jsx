import { useState } from 'react'
import { 
  FileText, Calculator, Send, Download, Clock, CheckCircle, Users, Calendar,
  Plus, Search, Filter, ChevronRight, Building2, ArrowRight, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATION & DEVIS MODULE - FLOWTYM V4
// Fonctionnalité différenciante : Multi-chambres, Multi-périodes, Conversion
// ═══════════════════════════════════════════════════════════════════════════════

const SimulationModule = () => {
  const [activeTab, setActiveTab] = useState('simulations')

  // Données de démonstration
  const simulations = [
    { 
      id: 'SIM-2026-001', 
      client: 'Société Dupont SA', 
      rooms: 5, 
      periods: 2,
      checkIn: '2026-04-15',
      checkOut: '2026-04-18',
      total: 2450,
      status: 'pending',
      created: '2026-03-30'
    },
    { 
      id: 'SIM-2026-002', 
      client: 'M. Jean Martin', 
      rooms: 1, 
      periods: 1,
      checkIn: '2026-04-20',
      checkOut: '2026-04-22',
      total: 320,
      status: 'sent',
      created: '2026-03-29'
    },
    { 
      id: 'SIM-2026-003', 
      client: 'Mariage Dubois', 
      rooms: 12, 
      periods: 1,
      checkIn: '2026-06-14',
      checkOut: '2026-06-16',
      total: 5880,
      status: 'converted',
      created: '2026-03-25'
    },
  ]

  const stats = {
    total: simulations.length,
    pending: simulations.filter(s => s.status === 'pending').length,
    sent: simulations.filter(s => s.status === 'sent').length,
    converted: simulations.filter(s => s.status === 'converted').length,
    conversionRate: Math.round((simulations.filter(s => s.status === 'converted').length / simulations.length) * 100),
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { label: 'Brouillon', color: '#6B7280', bg: '#F3F4F6' }
      case 'sent': return { label: 'Envoyé', color: '#3B82F6', bg: '#DBEAFE' }
      case 'converted': return { label: 'Converti', color: '#10B981', bg: '#D1FAE5' }
      case 'expired': return { label: 'Expiré', color: '#EF4444', bg: '#FEE2E2' }
      default: return { label: status, color: '#6B7280', bg: '#F3F4F6' }
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">Simulation & Devis</h1>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Nouveau</Badge>
            </div>
            <p className="text-sm text-slate-500">Créez des devis multi-chambres et convertissez-les en réservations</p>
          </div>
          <Button className="gap-2" style={{ background: '#7C8CF8' }}>
            <Plus className="w-4 h-4" />
            Nouvelle simulation
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <FileText className="w-4 h-4" />
              Total
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-slate-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Clock className="w-4 h-4" />
              Brouillons
            </div>
            <p className="text-2xl font-bold text-slate-700 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Send className="w-4 h-4" />
              Envoyés
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.sent}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Convertis
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.converted}</p>
          </div>
          <div className="bg-violet-50 rounded-xl p-4 border-2 border-violet-200">
            <div className="flex items-center gap-2 text-violet-600 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Taux conversion
            </div>
            <p className="text-2xl font-bold text-violet-600 mt-1">{stats.conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* Workflow Banner */}
      <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">1. Simulation</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">2. Devis PDF</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">3. Réservation</span>
            </div>
          </div>
          <span className="text-xs text-slate-500">UX ultra simple : 3 clics max</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Rechercher une simulation..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </Button>
        </div>

        {/* Simulations List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Référence</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chambres</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Dates</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {simulations.map((sim) => {
                const statusInfo = getStatusInfo(sim.status)

                return (
                  <tr key={sim.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-violet-600">{sim.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-900">{sim.client}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{sim.rooms} chambre{sim.rooms > 1 ? 's' : ''}</span>
                        {sim.periods > 1 && (
                          <Badge variant="outline" className="text-xs">{sim.periods} périodes</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {sim.checkIn} → {sim.checkOut}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900">{sim.total.toLocaleString()} €</span>
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {sim.status === 'pending' && (
                          <Button size="sm" variant="outline" className="gap-1 text-xs">
                            <Send className="w-3 h-3" />
                            Envoyer
                          </Button>
                        )}
                        {sim.status === 'sent' && (
                          <Button size="sm" className="gap-1 text-xs" style={{ background: '#10B981' }}>
                            <ArrowRight className="w-3 h-3" />
                            Convertir
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
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

export default SimulationModule
