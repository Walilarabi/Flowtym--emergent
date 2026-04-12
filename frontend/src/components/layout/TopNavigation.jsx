import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useHotel } from '@/context/HotelContext'
import { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard, Building2, Network, TrendingUp, Star, Users, CalendarCheck,
  Brush, UsersRound, Wrench, Receipt, BarChart3, Bell, Moon, ChevronDown,
  LogOut, Settings, User, Check, Database, Cog, Link2, ClipboardList,
  Megaphone, CreditCard, Cpu, ChevronRight, Sparkles, Globe, UserCircle,
  Heart, Package, ShieldCheck, Calendar, FileText, CalendarDays, 
  CircleUser, UserPlus, Calculator, ScrollText, Truck, ClipboardCheck,
  AlertTriangle, Clock, QrCode, Target
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBell } from './NotificationBell'

// ═══════════════════════════════════════════════════════════════════════════════
// NOUVELLE STRUCTURE OPERATIONS - 3 BLOCS FONCTIONNELS
// ═══════════════════════════════════════════════════════════════════════════════

const operationsBlocks = {
  pms: {
    id: 'pms',
    title: 'PMS',
    subtitle: 'Cœur du système',
    color: '#10B981',
    colorLight: '#D1FAE5',
    icon: Building2,
    items: [
      { id: 'pms-dashboard', label: 'PMS', icon: Building2, path: '/pms', description: 'Gestion hôtelière complète' },
    ]
  },
  terrain: {
    id: 'terrain',
    title: 'Opérations Terrain',
    subtitle: 'Gestion quotidienne',
    color: '#F59E0B',
    colorLight: '#FEF3C7',
    icon: Wrench,
    items: [
      { id: 'housekeeping', label: 'Housekeeping', icon: Brush, path: '/housekeeping', description: 'Statuts, assignation, mobile' },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench, path: '/maintenance', description: 'Tickets, priorités, interventions' },
      { id: 'staff', label: 'Staff', icon: UsersRound, path: '/staff', description: 'Employés, planning shifts' },
      { id: 'consignes', label: 'Cahier de consignes', icon: ClipboardList, path: '/consignes', description: 'Notes, statuts, assignation' },
    ]
  },
  achats: {
    id: 'achats',
    title: 'Achats & Conformité',
    subtitle: 'Fournisseurs & Contrôles',
    color: '#3B82F6',
    colorLight: '#DBEAFE',
    icon: Package,
    items: [
      { id: 'procurement', label: 'Procurement & Stock', icon: Truck, path: '/procurement', description: 'Fournisseurs, commandes, stock', badge: 'Bientôt' },
      { id: 'compliance', label: 'Compliance & Contrôles', icon: ShieldCheck, path: '/compliance', description: 'Registre, alertes, dossier', badge: 'Bientôt' },
    ]
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURE MENU PRINCIPAL - 8 MENUS MÉTIERS
// ═══════════════════════════════════════════════════════════════════════════════

const mainMenus = [
  { 
    id: 'flowboard', 
    label: 'Flowboard', 
    icon: LayoutDashboard, 
    path: '/flowboard',
    description: 'Dashboard stratégique',
    color: '#7C8CF8'
  },
  { 
    id: 'operations', 
    label: 'Operations', 
    icon: Building2, 
    path: '/operations',
    description: 'PMS, Terrain, Achats',
    color: '#10B981',
    isMegaMenu: true,
    blocks: operationsBlocks
  },
  { 
    id: 'revenue', 
    label: 'Revenue', 
    icon: TrendingUp, 
    path: '/revenue',
    description: 'Pilotage tarifaire',
    color: '#F59E0B',
    submenu: [
      { id: 'rms', label: 'RMS & Pricing', icon: TrendingUp, path: '/rms', description: 'Yield Management' },
      { id: 'forecast', label: 'Prévisions', icon: Target, path: '/forecast', description: 'Budget & Forecast', badge: 'Nouveau' },
    ]
  },
  { 
    id: 'distribution', 
    label: 'Distribution', 
    icon: Globe, 
    path: '/distribution',
    description: 'Vente des chambres',
    color: '#3B82F6',
    submenu: [
      { id: 'booking-engine', label: 'Booking Engine', icon: CalendarCheck, path: '/booking', description: 'Réservation directe' },
      { id: 'channel', label: 'Channel Manager', icon: Network, path: '/channel', description: 'OTA & Partenaires' },
    ]
  },
  { 
    id: 'guest', 
    label: 'Guest', 
    icon: Heart, 
    path: '/guest',
    description: 'Expérience client',
    color: '#EC4899',
    submenu: [
      { id: 'crm', label: 'CRM & Clients', icon: Users, path: '/crm', description: 'Base clients' },
      { id: 'ereputation', label: 'E-Réputation', icon: Star, path: '/e-reputation', description: 'Avis & Satisfaction' },
      { id: 'conciergerie', label: 'Conciergerie', icon: Sparkles, path: '/conciergerie', description: 'Services premium', badge: 'Bientôt' },
    ]
  },
  { 
    id: 'marketing', 
    label: 'Marketing', 
    icon: Megaphone, 
    path: '/marketing',
    description: 'Acquisition & Fidélisation',
    color: '#8B5CF6',
    submenu: [
      { id: 'campaigns', label: 'Campagnes', icon: Megaphone, path: '/marketing/campaigns', description: 'Email & SMS', badge: 'Bientôt' },
      { id: 'loyalty', label: 'Fidélité', icon: Heart, path: '/marketing/loyalty', description: 'Programme points', badge: 'Bientôt' },
    ]
  },
  { 
    id: 'finance', 
    label: 'Finance', 
    icon: CreditCard, 
    path: '/finance',
    description: 'Trésorerie & Comptabilité',
    color: '#059669',
    submenu: [
      { id: 'invoices', label: 'Facturation', icon: Receipt, path: '/finance/invoices', description: 'Factures & Paiements' },
      { id: 'accounting', label: 'Comptabilité', icon: BarChart3, path: '/finance/accounting', description: 'P&L & Exports', badge: 'Bientôt' },
    ]
  },
  { 
    id: 'platform', 
    label: 'Platform', 
    icon: Cpu, 
    path: '/platform',
    description: 'Configuration technique',
    color: '#6B7280',
    submenu: [
      { id: 'config', label: 'Configuration', icon: Cog, path: '/config', description: 'Paramètres hôtel' },
      { id: 'datahub', label: 'Data Hub', icon: Database, path: '/datahub', description: 'Données & Exports' },
      { id: 'integrations', label: 'Intégrations', icon: Link2, path: '/integrations', description: 'API & Partenaires' },
      { id: 'users', label: 'Utilisateurs', icon: UsersRound, path: '/platform/users', description: 'Accès & Permissions', badge: 'Bientôt' },
    ]
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// MEGA MENU OPERATIONS - 3 COLONNES
// ═══════════════════════════════════════════════════════════════════════════════

const OperationsMegaMenu = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div 
      className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
      style={{ 
        animation: 'fadeInScale 200ms ease-out',
        width: '820px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)'
      }}
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 via-amber-50 to-blue-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Operations</h3>
            <p className="text-xs text-slate-500">Gestion complète de votre établissement</p>
          </div>
        </div>
      </div>

      {/* 3 Colonnes */}
      <div className="flex divide-x divide-slate-100">
        {Object.values(operationsBlocks).map((block) => {
          const BlockIcon = block.icon
          return (
            <div key={block.id} className="flex-1 p-4">
              {/* Block Header */}
              <div className="flex items-center gap-2 mb-3 px-2">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: block.colorLight }}
                >
                  <BlockIcon className="w-4 h-4" style={{ color: block.color }} />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: block.color }}>{block.title}</h4>
                  <p className="text-[10px] text-slate-400">{block.subtitle}</p>
                </div>
              </div>

              {/* Block Items */}
              <div className="space-y-0.5">
                {block.items.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={onClose}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-150 hover:bg-slate-50 group"
                      data-testid={`nav-${item.id}`}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors group-hover:scale-105"
                        style={{ background: '#F8FAFC' }}
                      >
                        <ItemIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900 truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span 
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wide"
                              style={{ 
                                background: item.badge === 'Nouveau' ? '#DBEAFE' : '#F3E8FF',
                                color: item.badge === 'Nouveau' ? '#2563EB' : '#7C3AED'
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
                      </div>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>PMS</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Terrain</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Achats</span>
          </div>
        </div>
        <NavLink 
          to="/operations" 
          onClick={onClose}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          Vue d'ensemble <ChevronRight className="w-3 h-3" />
        </NavLink>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDARD DROPDOWN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const StandardDropdown = ({ menu, isActive, isOpen, onClose }) => {
  if (!isOpen || !menu.submenu) return null

  return (
    <div 
      className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 py-2 min-w-[280px] z-50"
      style={{ 
        animation: 'fadeIn 150ms ease-out',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.04)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-100 mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: menu.color }}>
          {menu.label}
        </p>
        <p className="text-xs text-slate-400">{menu.description}</p>
      </div>

      {/* Items */}
      {menu.submenu.map((item) => {
        const ItemIcon = item.icon
        return (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-150 hover:bg-slate-50 group"
            data-testid={`nav-${item.id}`}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: '#F8F9FC' }}
            >
              <ItemIcon className="w-4 h-4" style={{ color: menu.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  {item.label}
                </span>
                {item.badge && (
                  <span 
                    className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full"
                    style={{ 
                      background: item.badge === 'Nouveau' ? '#DBEAFE' : '#F3F4F6',
                      color: item.badge === 'Nouveau' ? '#3B82F6' : '#6B7280'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENU DROPDOWN WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

const MenuDropdown = ({ menu, isActive }) => {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef(null)
  const menuRef = useRef(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200)
  }

  const handleClose = () => setIsOpen(false)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const Icon = menu.icon
  const hasDropdown = menu.submenu || menu.isMegaMenu

  // Si pas de dropdown, lien direct
  if (!hasDropdown) {
    return (
      <NavLink
        to={menu.path}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200"
        style={{ 
          color: isActive ? '#7C8CF8' : '#6B7280',
          background: isActive ? '#F5F4FE' : 'transparent',
          fontWeight: isActive ? 600 : 500
        }}
        data-testid={`nav-${menu.id}`}
      >
        <Icon className="w-4 h-4" style={{ opacity: isActive ? 1 : 0.7 }} />
        <span>{menu.label}</span>
      </NavLink>
    )
  }

  return (
    <div 
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200"
        style={{ 
          color: isActive ? menu.color : '#6B7280',
          background: isActive ? `${menu.color}10` : isOpen ? '#F8F9FC' : 'transparent',
          fontWeight: isActive ? 600 : 500
        }}
        data-testid={`nav-${menu.id}`}
      >
        <Icon className="w-4 h-4" style={{ opacity: isActive ? 1 : 0.7 }} />
        <span>{menu.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ opacity: 0.5 }} />
      </button>

      {/* Dropdown - Mega Menu for Operations, Standard for others */}
      {menu.isMegaMenu ? (
        <OperationsMegaMenu isOpen={isOpen} onClose={handleClose} />
      ) : (
        <StandardDropdown menu={menu} isActive={isActive} isOpen={isOpen} onClose={handleClose} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN NAVIGATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const TopNavigation = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { hotels, currentHotel, switchHotel } = useHotel()

  const isMenuActive = (menu) => {
    // Direct path match
    if (location.pathname.startsWith(menu.path) && menu.path !== '/') return true
    
    // Check submenu paths
    if (menu.submenu) {
      return menu.submenu.some(item => location.pathname.startsWith(item.path))
    }
    
    // Check mega menu blocks (Operations)
    if (menu.blocks) {
      return Object.values(menu.blocks).some(block => 
        block.items.some(item => location.pathname.startsWith(item.path))
      )
    }
    
    return false
  }

  const getInitials = (firstName, lastName) => `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 shrink-0" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Logo */}
      <NavLink to="/flowboard" className="flex items-center gap-3 mr-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C8CF8, #A5B4FC)' }}>
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold" style={{ letterSpacing: '-0.02em' }}>
          <span style={{ color: '#7C8CF8' }}>FLOW</span><span style={{ color: '#1F2937' }}>TYM</span>
        </span>
      </NavLink>

      {/* Main Navigation - 8 Menus */}
      <nav className="flex-1 flex items-center gap-0.5">
        {mainMenus.map((menu) => (
          <MenuDropdown 
            key={menu.id} 
            menu={menu} 
            isActive={isMenuActive(menu)}
          />
        ))}
      </nav>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3 ml-4">
        {/* Theme Toggle */}
        <button 
          className="p-2 rounded-lg transition-all duration-150 hover:bg-slate-100"
          style={{ color: '#6B7280' }}
        >
          <Moon className="w-4 h-4" />
        </button>
        
        {/* Notifications - Supabase Realtime */}
        <NotificationBell />

        {/* Hotel Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 hover:bg-slate-50" 
              style={{ border: '1px solid #E5E7EB', background: '#FFFFFF' }}
              data-testid="btn-hotel-selector"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
              <span className="text-sm font-medium max-w-[100px] truncate" style={{ color: '#1F2937' }}>{currentHotel?.name || 'Hôtel'}</span>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" style={{ borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}>
            {hotels.map((hotel) => (
              <DropdownMenuItem 
                key={hotel.id} 
                onClick={() => switchHotel(hotel)} 
                className="flex items-center justify-between cursor-pointer"
                style={{ borderRadius: '8px' }}
              >
                <span>{hotel.name}</span>
                {currentHotel?.id === hotel.id && <Check className="w-4 h-4" style={{ color: '#7C8CF8' }} />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg transition-all duration-150 hover:bg-slate-50" 
              data-testid="btn-user-menu"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold leading-tight" style={{ color: '#1F2937', letterSpacing: '-0.01em' }}>{user?.first_name} {user?.last_name}</p>
                <p className="text-xs capitalize leading-tight" style={{ color: '#6B7280' }}>{user?.role === 'admin' ? 'Directeur' : user?.role}</p>
              </div>
              <Avatar className="w-9 h-9" style={{ borderRadius: '10px' }}>
                <AvatarFallback className="text-white font-semibold text-xs" style={{ background: 'linear-gradient(135deg, #7C8CF8, #A5B4FC)', borderRadius: '10px' }}>
                  {getInitials(user?.first_name, user?.last_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" style={{ borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}>
            <DropdownMenuItem className="cursor-pointer" style={{ borderRadius: '8px' }}>
              <User className="w-4 h-4 mr-2" />Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" style={{ borderRadius: '8px' }}>
              <Settings className="w-4 h-4 mr-2" />Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer" style={{ color: '#EF4444', borderRadius: '8px' }}>
              <LogOut className="w-4 h-4 mr-2" />Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </header>
  )
}
