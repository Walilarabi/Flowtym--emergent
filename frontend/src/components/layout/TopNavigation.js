import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useHotel } from '@/context/HotelContext';
import {
  LayoutDashboard,
  Building2,
  Network,
  TrendingUp,
  Star,
  Users,
  CalendarCheck,
  Brush,
  UsersRound,
  Wrench,
  Receipt,
  BarChart3,
  Code,
  Bell,
  Moon,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const modules = [
  { id: 'flowboard', label: 'Flowboard', icon: LayoutDashboard, path: '/flowboard', disabled: true },
  { id: 'pms', label: 'PMS', icon: Building2, path: '/pms/planning', disabled: false },
  { id: 'channel', label: 'Channel', icon: Network, path: '/channel', disabled: true },
  { id: 'rms', label: 'RMS', icon: TrendingUp, path: '/rms', disabled: true, badge: true },
  { id: 'ereputation', label: 'E-Reputation', icon: Star, path: '/e-reputation', disabled: true },
  { id: 'crm', label: 'CRM', icon: Users, path: '/crm', disabled: true },
  { id: 'booking', label: 'Booking', icon: CalendarCheck, path: '/booking', disabled: true },
  { id: 'housekeeping', label: 'Housekeeping', icon: Brush, path: '/housekeeping', disabled: true },
  { id: 'staff', label: 'Staff', icon: UsersRound, path: '/staff', disabled: true },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, path: '/maintenance', disabled: true },
  { id: 'finance', label: 'Finance', icon: Receipt, path: '/finance', disabled: true },
  { id: 'rapports', label: 'Rapports', icon: BarChart3, path: '/pms/reports', disabled: false },
  { id: 'api', label: 'API', icon: Code, path: '/api', disabled: true },
];

export const TopNavigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { hotels, currentHotel, switchHotel } = useHotel();
  const [darkMode, setDarkMode] = useState(false);

  const isActive = (path) => {
    if (path === '/pms/planning') {
      return location.pathname.startsWith('/pms');
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-6">
        <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-violet-600">FLOW</span>
          <span className="text-slate-900">TYM</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {modules.map((module) => {
          const Icon = module.icon;
          const active = isActive(module.path);
          
          if (module.disabled) {
            return (
              <div
                key={module.id}
                className="nav-item opacity-50 cursor-not-allowed whitespace-nowrap"
                data-testid={`nav-${module.id}`}
              >
                <Icon className="w-4 h-4" />
                <span>{module.label}</span>
                {module.badge && (
                  <span className="w-2 h-2 bg-violet-500 rounded-full" />
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={module.id}
              to={module.path}
              className={`nav-item whitespace-nowrap ${active ? 'active' : ''}`}
              data-testid={`nav-${module.id}`}
            >
              <Icon className="w-4 h-4" />
              <span>{module.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-3 ml-4">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          data-testid="btn-toggle-dark-mode"
        >
          <Moon className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors relative"
          data-testid="btn-notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Hotel selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              data-testid="btn-hotel-selector"
            >
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm font-medium text-slate-700 max-w-[150px] truncate">
                {currentHotel?.name || 'Selectionner un hotel'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {hotels.map((hotel) => (
              <DropdownMenuItem
                key={hotel.id}
                onClick={() => switchHotel(hotel)}
                className="flex items-center justify-between"
                data-testid={`hotel-option-${hotel.id}`}
              >
                <span>{hotel.name}</span>
                {currentHotel?.id === hotel.id && (
                  <Check className="w-4 h-4 text-violet-600" />
                )}
              </DropdownMenuItem>
            ))}
            {hotels.length === 0 && (
              <DropdownMenuItem disabled>
                Aucun hotel configure
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              data-testid="btn-user-menu"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {user?.role === 'admin' ? 'Directeur - Master' : user?.role}
                </p>
              </div>
              <Avatar className="w-9 h-9 bg-violet-100">
                <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold text-sm">
                  {getInitials(user?.first_name, user?.last_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem data-testid="menu-profile">
              <User className="w-4 h-4 mr-2" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-settings">
              <Settings className="w-4 h-4 mr-2" />
              Parametres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 focus:text-red-600"
              data-testid="menu-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Deconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
