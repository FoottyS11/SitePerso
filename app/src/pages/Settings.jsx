import { useState } from 'react'
import { Key, Users, Plus, Trash2, Shield } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'

function Msg({ msg }) {
  if (!msg) return null
  return (
    <span className="t-label" style={{ color: msg.ok ? 'var(--online)' : 'var(--accent-red)', display: 'block', marginTop: 8 }}>
      {msg.ok ? '✓' : '✗'} {msg.text}
    </span>
  )
}

export default function Settings() {
  const { user, users, isAdmin, createUser, changePassword, deleteUser } = useAuth()

  const [pwForm, setPwForm] = useState({ old: '', new1: '', new2: '' })
  const [pwMsg,  setPwMsg]  = useState(null)

  function handleChangePassword(e) {
    e.preventDefault()
    if (pwForm.new1 !== pwForm.new2) return setPwMsg({ ok: false, text: 'PASSWORDS DO NOT MATCH' })
    if (pwForm.new1.length < 4) return setPwMsg({ ok: false, text: 'PASSWORD TOO SHORT (MIN 4)' })
    const res = changePassword(user, pwForm.old, pwForm.new1)
    setPwMsg({ ok: res.success, text: res.success ? 'PASSWORD UPDATED' : res.error })
    if (res.success) setPwForm({ old: '', new1: '', new2: '' })
  }

  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' })
  const [userMsg, setUserMsg] = useState(null)

  function handleCreateUser(e) {
    e.preventDefault()
    const res = createUser(newUser.username, newUser.password, newUser.role)
    setUserMsg({ ok: res.success, text: res.success ? `USER "${newUser.username.trim()}" CREATED` : res.error })
    if (res.success) setNewUser({ username: '', password: '', role: 'user' })
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 className="t-display" style={{ fontSize: 24, marginBottom: 28 }}>// SETTINGS</h2>

      {/* ── Change Password ── */}
      <div className="card card-accent" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">
            <Key size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            CHANGE PASSWORD
          </span>
          <span className="t-label">USER · {user}</span>
        </div>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="t-label">CURRENT PASSWORD</label>
            <input className="input" type="password" value={pwForm.old}
              onChange={e => setPwForm(f => ({ ...f, old: e.target.value }))}
              placeholder="// mot de passe actuel" />
          </div>
          <div className="field">
            <label className="t-label">NEW PASSWORD</label>
            <input className="input" type="password" value={pwForm.new1}
              onChange={e => setPwForm(f => ({ ...f, new1: e.target.value }))}
              placeholder="// nouveau mot de passe" />
          </div>
          <div className="field">
            <label className="t-label">CONFIRM</label>
            <input className="input" type="password" value={pwForm.new2}
              onChange={e => setPwForm(f => ({ ...f, new2: e.target.value }))}
              placeholder="// confirmer" />
          </div>
          <Msg msg={pwMsg} />
          <div>
            <button className="btn btn-primary" type="submit">UPDATE PASSWORD</button>
          </div>
        </form>
      </div>

      {/* ── Admin: User Management ── */}
      {isAdmin && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Users size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              USER MANAGEMENT
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="t-label">
              <Shield size={11} style={{ color: 'var(--accent-red)' }} /> ADMIN ONLY
            </span>
          </div>

          {/* Create user */}
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <input className="input" style={{ flex: '1 1 140px' }} value={newUser.username}
              onChange={e => setNewUser(f => ({ ...f, username: e.target.value }))}
              placeholder="// username" />
            <input className="input" type="password" style={{ flex: '1 1 140px' }} value={newUser.password}
              onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))}
              placeholder="// password" />
            <select className="select" style={{ width: 'auto', flex: '0 0 auto' }} value={newUser.role}
              onChange={e => setNewUser(f => ({ ...f, role: e.target.value }))}>
              <option value="user">USER</option>
              <option value="admin">ADMIN</option>
            </select>
            <button className="btn btn-primary" type="submit" style={{ flex: '0 0 auto' }}>
              <Plus size={14} style={{ verticalAlign: 'middle' }} /> CREATE
            </button>
          </form>
          <Msg msg={userMsg} />

          {/* User list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
            {users.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${u.role === 'admin' ? 'var(--accent-red)' : 'var(--border-bright)'}`
              }}>
                <span className="t-mono" style={{ flex: 1, fontWeight: u.username === user ? 600 : 400 }}>
                  {u.username}
                  {u.username === user && <span className="t-label" style={{ marginLeft: 8 }}>· VOUS</span>}
                </span>
                <span className="t-label" style={{ color: u.role === 'admin' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                  {u.role.toUpperCase()}
                </span>
                {u.username !== user && (
                  <button className="btn btn-ghost btn-icon" onClick={() => deleteUser(u.username)} title="Supprimer">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
