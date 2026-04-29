import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useClock } from '../hooks/useClock'
import Logo from './Logo'

export default function Header() {
  const { user, logout } = useAuth()
  const { label: clock } = useClock()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="header">
      <div className="header-left">
        <Logo />
      </div>
      <div className="header-center">
        <span className="header-clock t-mono">{clock}</span>
      </div>
      <div className="header-right">
        <span className="header-status">
          <span className="dot" />
          ONLINE
        </span>
        <span className="t-label">USER · {user || '—'}</span>
        <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Déconnexion">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
