import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Settings,
  PlusCircle,
  FileText,
  Users
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prompts', icon: BookOpen, label: 'Prompt Library' },
  { to: '/review', icon: CheckSquare, label: 'Review Queue' },
  { to: '/settings', icon: Settings, label: 'Settings' }
]

const adminItems = [
  { to: '/admin/prompts', icon: PlusCircle, label: 'Approve Prompts' },
  { to: '/admin/users', icon: Users, label: 'User Management' }
]

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white">
      <nav className="flex-1 space-y-1 p-4">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Main Menu
          </p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
<Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="pt-6 space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Admin
          </p>
          {adminItems.map(({ to, icon: Icon, label }) => (
<NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <NavLink
          to="/export"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <FileText className="h-5 w-5" />
          Export Compliance
        </NavLink>
      </div>
    </aside>
  )
}
