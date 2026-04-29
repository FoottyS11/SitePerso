import { useEffect, useState } from 'react'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import Logo from '../components/Logo'

export default function Login() {
  const { login, isAuthenticated, ready } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Si déjà authentifié → redirige vers /dashboard
  useEffect(() => {
    if (ready && isAuthenticated) {
      const target = location.state?.from?.pathname || '/dashboard'
      navigate(target, { replace: true })
    }
  }, [ready, isAuthenticated, navigate, location])

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = login(user, pass)
    if (result.success) {
      const target = location.state?.from?.pathname || '/dashboard'
      navigate(target, { replace: true })
    } else {
      setError(result.error || 'ACCESS DENIED')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="grid-bg" />
      <div className="scan-overlay" />
      <main className="login-shell">
        <form className="login-card" onSubmit={handleSubmit} autoComplete="off">
          <div style={{ marginBottom: 26 }}>
            <Logo flicker size={14} />
          </div>
          <div className="login-title">CTRL_HUB</div>
          <div className="login-subtitle">SECURE ACCESS // AUTHENTICATION REQUIRED</div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label className="t-label">IDENTIFIER</label>
            <input
              className="input"
              type="text"
              value={user}
              autoFocus
              onChange={e => setUser(e.target.value)}
              placeholder="// username"
              required
            />
          </div>

          <div className="field" style={{ marginBottom: 22 }}>
            <label className="t-label">PASSWORD</label>
            <div className="password-wrapper">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="// ••••••••"
                required
                style={{ paddingRight: 38 }}
              />
              <button type="button" className="toggle-pass" onClick={() => setShowPass(s => !s)} aria-label="Afficher / masquer le mot de passe">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {submitting ? 'AUTHENTICATING…' : 'AUTHENTICATE'} <ChevronRight size={14} />
          </button>

          {error && (
            <div className="login-error">// {error}</div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }} className="t-label">
            // SESSION ENCRYPTED · LAN ONLY
          </div>
        </form>
      </main>
    </>
  )
}
