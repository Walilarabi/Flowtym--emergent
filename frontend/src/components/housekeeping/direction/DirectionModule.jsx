/**
 * DirectionModule - Module Direction complet
 * Navigation par onglets selon les maquettes PDF
 * 
 * Onglets:
 * - Centre de contrôle (Dashboard)
 * - Plan Chambres
 * - Répartition
 * - Objets trouvés
 * - Signalements
 * - Historique
 * - Maintenance
 * - Statistiques
 * - Rapports
 * - Configuration
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  LayoutDashboard, BedDouble, Zap, Package, AlertTriangle,
  History, Wrench, BarChart3, FileText, Settings, ChevronLeft,
  RefreshCw, Wifi, WifiOff, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHotel } from '@/context/HotelContext'
import axios from 'axios'

// Import des sous-composants
import DirectionDashboard from './DirectionDashboard'
import PlanChambresView from './PlanChambresView'
import RepartitionView from './RepartitionView'
import CategoriesConfig from '../CategoriesConfig'
import ReportsTab from '../ReportsTab'
import FoundItemsTab from '../FoundItemsTab'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

// ═══════════════════════════════════════════════════════════════════════════════
// TAB CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'dashboard', label: 'Centre de contrôle', icon: LayoutDashboard, shortLabel: 'Centre' },
  { id: 'plan-chambres', label: 'Plan Chambres', icon: BedDouble, shortLabel: 'Plan' },
  { id: 'repartition', label: 'Répartition', icon: Zap, shortLabel: 'Répart.' },
  { id: 'objets-trouves', label: 'Objets trouvés', icon: Package, shortLabel: 'Objets' },
  { id: 'signalements', label: 'Signalements', icon: AlertTriangle, shortLabel: 'Signal.' },
  { id: 'historique', label: 'Historique', icon: History, shortLabel: 'Hist.' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, shortLabel: 'Maint.' },
  { id: 'statistiques', label: 'Statistiques', icon: BarChart3, shortLabel: 'Stats' },
  { id: 'rapports', label: 'Rapports', icon: FileText, shortLabel: 'Rapp.' },
  { id: 'configuration', label: 'Configuration', icon: Settings, shortLabel: 'Config' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// TAB BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TabButton = ({ tab, isActive, onClick, badge }) => {
  const Icon = tab.icon
  
  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        isActive 
          ? 'bg-violet-100 text-violet-700' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      }`}
      data-testid={`tab-${tab.id}`}
    >
      <Icon size={16} />
      <span className="hidden lg:inline">{tab.label}</span>
      <span className="lg:hidden">{tab.shortLabel}</span>
      {badge > 0 && (
        <Badge 
          variant="destructive" 
          className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
        >
          {badge}
        </Badge>
      )}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER COMPONENTS (À implémenter)
// ═══════════════════════════════════════════════════════════════════════════════

const PlaceholderView = ({ title, description }) => (
  <div className="h-full flex items-center justify-center bg-slate-50">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
        <Settings size={32} className="text-violet-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500">{description}</p>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DirectionModule({ data, actions, v2Data, v2Actions }) {
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [reportsStats, setReportsStats] = useState({ pending: 0, in_progress: 0, resolved: 0 })
  const [foundItemsStats, setFoundItemsStats] = useState({ pending: 0, consigned: 0, returned: 0 })
  const [activityLog, setActivityLog] = useState([])

  // Fetch reports and found items stats
  const fetchStats = useCallback(async () => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    
    try {
      const [reportsRes, foundItemsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/reports/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { pending: 0, in_progress: 0, resolved: 0 } })),
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/found-items/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { pending: 0, consigned: 0, returned: 0 } })),
      ])
      
      setReportsStats(reportsRes.data)
      setFoundItemsStats(foundItemsRes.data)
    } catch (e) {
      console.error('Error fetching stats:', e)
    }
  }, [hotelId])

  useEffect(() => {
    fetchStats()
    // Poll every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // Calculate badges for tabs
  const tabBadges = useMemo(() => ({
    signalements: reportsStats.pending,
    'objets-trouves': foundItemsStats.pending,
    maintenance: v2Data?.maintenance?.filter(m => m.status === 'en_attente').length || 0,
  }), [reportsStats, foundItemsStats, v2Data])

  // Navigation handler
  const handleNavigate = useCallback((target) => {
    if (TABS.find(t => t.id === target)) {
      setActiveTab(target)
    }
  }, [])

  // Merge data for dashboard
  const dashboardData = useMemo(() => ({
    ...data,
    ...(v2Data || {}),
    loading: data?.loading || v2Data?.loading,
    connected: v2Data?.connected ?? false,
  }), [data, v2Data])

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DirectionDashboard
            data={dashboardData}
            actions={{ ...actions, ...(v2Actions || {}) }}
            onNavigate={handleNavigate}
            reportsStats={reportsStats}
            foundItemsStats={foundItemsStats}
            activityLog={activityLog}
          />
        )
      
      case 'signalements':
        return <ReportsTab hotelId={hotelId} currentUser={{ role: 'direction' }} />
      
      case 'objets-trouves':
        return <FoundItemsTab hotelId={hotelId} currentUser={{ role: 'direction' }} />
      
      case 'configuration':
        return (
          <div className="h-full overflow-auto bg-slate-50 p-6">
            <CategoriesConfig />
          </div>
        )
      
      case 'plan-chambres':
        return (
          <PlanChambresView
            data={dashboardData}
            actions={{ ...actions, ...(v2Actions || {}) }}
            onNavigate={handleNavigate}
          />
        )
      
      case 'repartition':
        return (
          <RepartitionView
            data={dashboardData}
            actions={{ ...actions, ...(v2Actions || {}) }}
            onNavigate={handleNavigate}
          />
        )
      
      case 'historique':
        return (
          <PlaceholderView 
            title="Historique" 
            description="Historique par jour et par employée. À implémenter dans la Phase 4."
          />
        )
      
      case 'maintenance':
        return (
          <PlaceholderView 
            title="Maintenance" 
            description="Gestion maintenance chambres, communs, types et historique. À implémenter dans la Phase 7."
          />
        )
      
      case 'statistiques':
        return (
          <PlaceholderView 
            title="Statistiques" 
            description="Performance équipe, indicateurs globaux. À implémenter dans la Phase 4."
          />
        )
      
      case 'rapports':
        return (
          <PlaceholderView 
            title="Rapports" 
            description="Export PDF personnalisable avec KPIs et graphiques. À implémenter dans la Phase 6."
          />
        )
      
      default:
        return (
          <DirectionDashboard
            data={dashboardData}
            actions={{ ...actions, ...(v2Actions || {}) }}
            onNavigate={handleNavigate}
            reportsStats={reportsStats}
            foundItemsStats={foundItemsStats}
            activityLog={activityLog}
          />
        )
    }
  }

  return (
    <div className="h-full flex flex-col" data-testid="direction-module">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={setActiveTab}
              badge={tabBadges[tab.id]}
            />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  )
}
