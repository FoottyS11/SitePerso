import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Wrench, Settings } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'

const NAV_LINKS = [
  { to: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { to: '/todo',      label: 'TODO',      icon: CheckSquare },
  { to: '/garage',    label: 'GARAGE',    icon: Wrench }
]

export default function Sidebar() {
  const { isAdmin } = useAuth()

  return (
    <aside className="app-sidebar sidebar">
      <div className="sidebar-section">// NAV</div>
      {NAV_LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Icon size={16} />
          <span>{label}</span>
        </NavLink>
      ))}
      <div style={{ flex: 1 }} />
      <div className="sidebar-section">// SYS</div>
      <NavLink
        to="/settings"
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <Settings size={16} />
        <span>SETTINGS{isAdmin ? ' ·ADMIN' : ''}</span>
      </NavLink>
      <div className="sidebar-link" style={{ cursor: 'default', borderLeftColor: 'transparent' }}>
        <span className="dot" />
        <span style={{ fontSize: 11, letterSpacing: '0.18em' }}>v0.1.0</span>
      </div>
    </aside>
  )
}
