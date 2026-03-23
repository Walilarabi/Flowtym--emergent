import { NavLink, useLocation } from 'react-router-dom';
import {
  Calendar,
  List,
  Users,
  LogIn,
  LogOut,
  Moon,
  BarChart3,
  Settings,
} from 'lucide-react';

const pmsSubNav = [
  { label: 'Planning', icon: Calendar, path: '/pms/planning' },
  { label: 'Reservations', icon: List, path: '/pms/reservations' },
  { label: 'Clients', icon: Users, path: '/pms/clients' },
  { label: 'Arrivees', icon: LogIn, path: '/pms/arrivals' },
  { label: 'Departs', icon: LogOut, path: '/pms/departures' },
  { label: 'Cloture', icon: Moon, path: '/pms/night-audit' },
  { label: 'Rapports', icon: BarChart3, path: '/pms/reports' },
];

export const SubNavigation = () => {
  const location = useLocation();
  
  // Only show sub-navigation for PMS module
  if (!location.pathname.startsWith('/pms')) {
    return null;
  }

  return (
    <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-4 shrink-0">
      <nav className="flex items-center gap-1">
        {pmsSubNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                transition-colors duration-200
                ${isActive 
                  ? 'bg-white text-violet-700 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }
              `}
              data-testid={`subnav-${item.label.toLowerCase()}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
