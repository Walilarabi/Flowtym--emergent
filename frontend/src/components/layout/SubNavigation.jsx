import { NavLink, useLocation } from 'react-router-dom'
import { Calendar, List, Users, LogIn, LogOut, Moon, BarChart3, Clock, FileText, Receipt, UsersRound } from 'lucide-react'

const pmsSubNav = [
  { label: 'Planning', icon: Calendar, path: '/pms/planning' },
  { label: 'Reservations', icon: List, path: '/pms/reservations' },
  { label: 'Clients', icon: Users, path: '/pms/clients' },
  { label: 'Arrivees', icon: LogIn, path: '/pms/arrivals' },
  { label: 'Departs', icon: LogOut, path: '/pms/departures' },
  { label: 'Cloture', icon: Moon, path: '/pms/night-audit' },
  { label: 'Rapports', icon: BarChart3, path: '/pms/reports' },
]

const staffSubNav = [
  { label: 'Tableau de bord', icon: BarChart3, path: '/staff' },
  { label: 'Employes', icon: UsersRound, path: '/staff/employees' },
  { label: 'Planning', icon: Calendar, path: '/staff/planning' },
  { label: 'Pointage', icon: Clock, path: '/staff/time-tracking' },
  { label: 'Contrats', icon: FileText, path: '/staff/contracts' },
  { label: 'Paie & URSSAF', icon: Receipt, path: '/staff/payroll' },
]

export const SubNavigation = () => {
  const location = useLocation()
  
  const isPMS = location.pathname.startsWith('/pms')
  const isStaff = location.pathname.startsWith('/staff')
  
  if (!isPMS && !isStaff) return null
  
  const navItems = isPMS ? pmsSubNav : staffSubNav

  return (
    <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-4 shrink-0">
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || (item.path === '/staff' && location.pathname === '/staff')
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive ? 'bg-white text-violet-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
              data-testid={`subnav-${item.label.toLowerCase().replace(/ /g, '-')}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
