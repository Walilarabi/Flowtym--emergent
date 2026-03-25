import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useHotel } from '@/context/HotelContext'
import {
  LayoutDashboard, Building2, Network, TrendingUp, Star, Users, CalendarCheck,
  Brush, UsersRound, Wrench, Receipt, BarChart3, Code, Bell, Moon, ChevronDown,
  LogOut, Settings, User, Check, Database, Cog
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const modules = [
  { id: 'flowboard', label: 'Flowboard', icon: LayoutDashboard, path: '/flowboard', disabled: true },
  { id: 'pms', label: 'PMS', icon: Building2, path: '/pms/planning', disabled: false },
  { id: 'channel', label: 'Channel', icon: Network, path: '/channel', disabled: false },
  { id: 'rms', label: 'Hoptym', icon: TrendingUp, path: '/rms', disabled: false },
  { id: 'ereputation', label: 'E-Reputation', icon: Star, path: '/e-reputation', disabled: true },
  { id: 'crm', label: 'CRM', icon: Users, path: '/crm', disabled: false },
  { id: 'booking', label: 'Booking', icon: CalendarCheck, path: '/booking', disabled: false },
  { id: 'housekeeping', label: 'Housekeeping', icon: Brush, path: '/housekeeping', disabled: true },
  { id: 'staff', label: 'Staff', icon: UsersRound, path: '/staff', disabled: false },
  { id: 'rapports', label: 'Rapports', icon: BarChart3, path: '/pms/reports', disabled: false },
  { id: 'datahub', label: 'Data Hub', icon: Database, path: '/datahub', disabled: false },
  { id: 'config', label: 'Configuration', icon: Cog, path: '/config', disabled: false },
]

export const TopNavigation = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { hotels, currentHotel, switchHotel } = useHotel()

  const isActive = (path) => {
    if (path === '/pms/planning') return location.pathname.startsWith('/pms')
    if (path === '/staff') return location.pathname.startsWith('/staff')
    if (path === '/crm') return location.pathname.startsWith('/crm')
    if (path === '/channel') return location.pathname.startsWith('/channel')
    if (path === '/booking') return location.pathname.startsWith('/booking')
    if (path === '/rms') return location.pathname.startsWith('/rms')
    if (path === '/datahub') return location.pathname.startsWith('/datahub')
    if (path === '/config') return location.pathname.startsWith('/config')
    return location.pathname.startsWith(path)
  }

  const getInitials = (firstName, lastName) => `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 shrink-0 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-8">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg flex items-center justify-center shadow-sm">
          <Building2 className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">
          <span className="text-violet-600">FLOW</span><span className="text-slate-800">TYM</span>
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
        {modules.map((module) => {
          const Icon = module.icon
          const active = isActive(module.path)
          
          if (module.disabled) {
            return (
              <div 
                key={module.id} 
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-400 whitespace-nowrap cursor-not-allowed" 
                data-testid={`nav-${module.id}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{module.label}</span>
              </div>
            )
          }

          return (
            <NavLink 
              key={module.id} 
              to={module.path} 
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors
                ${active 
                  ? 'text-violet-700 bg-violet-50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              data-testid={`nav-${module.id}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{module.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Theme Toggle */}
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <Moon className="w-4.5 h-4.5" />
        </button>
        
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative transition-colors">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Hotel Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all" 
              data-testid="btn-hotel-selector"
            >
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">{currentHotel?.name || 'Selectionner'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {hotels.map((hotel) => (
              <DropdownMenuItem 
                key={hotel.id} 
                onClick={() => switchHotel(hotel)} 
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{hotel.name}</span>
                {currentHotel?.id === hotel.id && <Check className="w-4 h-4 text-violet-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex items-center gap-2.5 pl-3 pr-2 py-1 rounded-lg hover:bg-slate-50 transition-colors" 
              data-testid="btn-user-menu"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-800 leading-tight">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-slate-500 capitalize leading-tight">{user?.role === 'admin' ? 'Directeur' : user?.role}</p>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-violet-600 text-white font-semibold text-xs">
                  {getInitials(user?.first_name, user?.last_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />Parametres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />Deconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
