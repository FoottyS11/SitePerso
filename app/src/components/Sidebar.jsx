import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Wrench } from 'lucide-react'

const LINKS = [
  { to: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { to: '/todo',      label: 'TODO',      icon: CheckSquare },
  { to: '/garage',    label: 'GARAGE',    icon: Wrench }
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">// NAV</div>
      {LINKS.map(({ to, label, icon: Icon }) => (
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
      <div className="sidebar-link" style={{ cursor: 'default', borderLeftColor: 'transparent' }}>
        <span className="dot" />
        <span style={{ fontSize: 11, letterSpacing: '0.18em' }}>v0.1.0</span>
      </div>
    </aside>
  )
}
