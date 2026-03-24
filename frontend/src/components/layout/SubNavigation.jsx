import { NavLink, useLocation } from 'react-router-dom'
import { Calendar, List, Users, LogIn, LogOut, Moon, BarChart3, Clock, FileText, Receipt, UsersRound, Settings, UserPlus, PieChart, LayoutDashboard, Euro } from 'lucide-react'

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
  { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
  { label: 'Planning', icon: Calendar, path: '/staff/planning' },
  { label: 'Personnel', icon: UsersRound, path: '/staff/employees' },
  { label: 'Contrats', icon: FileText, path: '/staff/contracts' },
  { label: 'Paie & URSSAF', icon: Euro, path: '/staff/payroll' },
  { label: 'Recrutement', icon: UserPlus, path: '/staff/recruitment' },
  { label: 'Reporting', icon: PieChart, path: '/staff/reporting' },
  { label: 'Configuration', icon: Settings, path: '/staff/configuration' },
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
          const isActive = location.pathname === item.path || 
            (item.path === '/staff/planning' && location.pathname === '/staff') ||
            (item.path === '/pms/planning' && location.pathname === '/pms')
          const isDisabled = item.disabled
          
          if (isDisabled) {
            return (
              <div
                key={item.path}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
                data-testid={`subnav-${item.label.toLowerCase().replace(/ /g, '-')}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            )
          }
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all
                ${isActive 
                  ? 'bg-white text-violet-700 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                }`}
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
