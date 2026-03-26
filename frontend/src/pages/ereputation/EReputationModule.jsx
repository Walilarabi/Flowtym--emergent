/**
 * EReputationModule - Module E-Réputation FlowTYM
 * 
 * Embed complet du module E-Réputation via iframe blob URL
 * Menu horizontal intégré avec navigation interne
 */

import { useEffect, useRef, useState } from 'react'
import { 
  LayoutDashboard, Inbox, Radar, Rocket, ShieldCheck, Megaphone, 
  BarChart3, Settings, Loader2, Star, TrendingUp, MessageSquare,
  Globe, Zap, Target, Award
} from 'lucide-react'

// Import du HTML source comme texte brut
import ereputationHtml from './ereputation.html?raw'

// Menu items pour la navigation horizontale
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'radar', label: 'Radar', icon: Radar },
  { id: 'booster', label: 'Booster', icon: Rocket },
  { id: 'integrity', label: 'Integrity', icon: ShieldCheck },
  { id: 'campaigns', label: 'Campagnes', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

export default function EReputationModule() {
  const iframeRef = useRef(null)
  const [blobUrl, setBlobUrl] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    // Créer un Blob URL depuis le HTML brut
    const blob = new Blob([ereputationHtml], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    setBlobUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [])

  // Envoyer la navigation au iframe
  const navigateTo = (tabId) => {
    setActiveTab(tabId)
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Tenter de naviguer dans l'iframe si possible
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'navigate', tab: tabId }, '*')
      } catch (e) {
        console.log('Navigation iframe non disponible')
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-50">
      {/* Menu Horizontal */}
      <div className="bg-[#1B1A35] border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-white/15 text-white' 
                    : 'text-white/55 hover:bg-white/10 hover:text-white/90'
                }`}
                data-testid={`erep-nav-${item.id}`}
              >
                <Icon size={16} className={isActive ? 'opacity-100' : 'opacity-70'} />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loader while iframe is loading */}
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10 gap-4">
            <Loader2 size={40} className="animate-spin text-violet-600" />
            <span className="text-sm text-slate-500 font-medium">
              Chargement module E-Réputation…
            </span>
          </div>
        )}

        {/* Iframe principal */}
        {blobUrl && (
          <iframe
            ref={iframeRef}
            src={blobUrl}
            title="FlowTYM — E-Réputation"
            onLoad={() => setLoaded(true)}
            className="w-full h-full border-none"
            style={{
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
            allow="clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}
      </div>
    </div>
  )
}
