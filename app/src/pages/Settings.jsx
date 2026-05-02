import { useState } from 'react'
import { Key, Users, Plus, Trash2, Shield, Database, RefreshCw, Zap, AlertTriangle, Upload } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useBackup } from '../hooks/useBackup'

const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const RETENTION_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 30]

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

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
  const { backups, config, running, error, success, saveConfig, triggerBackup, deleteBackup, migrate, reload } = useBackup()

  const [pwForm, setPwForm] = useState({ old: '', new1: '', new2: '' })
  const [pwMsg, setPwMsg]   = useState(null)

  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' })
  const [userMsg, setUserMsg] = useState(null)

  // Config locale pour édition avant save
  const [localCfg, setLocalCfg] = useState(null)
  const cfg = localCfg ?? config

  const [migrateMsg, setMigrateMsg] = useState(null)
  const [migrating, setMigrating]   = useState(false)

  function handleChangePassword(e) {
    e.preventDefault()
    if (pwForm.new1 !== pwForm.new2) return setPwMsg({ ok: false, text: 'PASSWORDS DO NOT MATCH' })
    if (pwForm.new1.length < 4) return setPwMsg({ ok: false, text: 'PASSWORD TOO SHORT (MIN 4)' })
    const res = changePassword(user, pwForm.old, pwForm.new1)
    setPwMsg({ ok: res.success, text: res.success ? 'PASSWORD UPDATED' : res.error })
    if (res.success) setPwForm({ old: '', new1: '', new2: '' })
  }

  function handleCreateUser(e) {
    e.preventDefault()
    const res = createUser(newUser.username, newUser.password, newUser.role)
    setUserMsg({ ok: res.success, text: res.success ? `USER "${newUser.username.trim()}" CREATED` : res.error })
    if (res.success) setNewUser({ username: '', password: '', role: 'user' })
  }

  function patchCfg(p) {
    setLocalCfg(c => ({ ...(c ?? config), ...p }))
  }

  async function handleSaveConfig() {
    await saveConfig(cfg)
    setLocalCfg(null)
  }

  async function handleMigrate() {
    try {
      const todos      = JSON.parse(localStorage.getItem('hl_todos_v1') || '[]')
      const categories = JSON.parse(localStorage.getItem('hl_categories_v1') || '[]')
      if (!todos.length && !categories.length) {
        return setMigrateMsg({ ok: false, text: 'Aucune donnée trouvée dans le localStorage' })
      }
      setMigrating(true)
      const r = await migrate(todos, categories)
      if (r.ok) {
        localStorage.removeItem('hl_todos_v1')
        localStorage.removeItem('hl_categories_v1')
        setMigrateMsg({ ok: true, text: `Migré : ${r.imported.todos} tâches, ${r.imported.categories} catégories — rechargez la page` })
      }
    } catch (e) {
      setMigrateMsg({ ok: false, text: e.message })
    } finally {
      setMigrating(false)
    }
  }

  const scheduleLabel = cfg.frequency === 'weekly'
    ? `Chaque ${WEEKDAYS[cfg.weekday || 1]} à ${String(cfg.hour).padStart(2, '0')}:00`
    : `Chaque jour à ${String(cfg.hour).padStart(2, '0')}:00`

  return (
    <div style={{ maxWidth: 680 }}>
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
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">
              <Users size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              USER MANAGEMENT
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="t-label">
              <Shield size={11} style={{ color: 'var(--accent-red)' }} /> ADMIN ONLY
            </span>
          </div>
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

      {/* ── Database Backup (admin only) ── */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">
              <Database size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              DATABASE BACKUP
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="t-label" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {scheduleLabel}
              </span>
              <button className="btn btn-ghost btn-icon" onClick={reload} title="Rafraîchir">
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Config */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="t-label">FRÉQUENCE</label>
              <select className="select" value={cfg.frequency} onChange={e => patchCfg({ frequency: e.target.value })}>
                <option value="daily">QUOTIDIEN</option>
                <option value="weekly">HEBDOMADAIRE</option>
              </select>
            </div>
            {cfg.frequency === 'weekly' && (
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="t-label">JOUR</label>
                <select className="select" value={cfg.weekday ?? 1} onChange={e => patchCfg({ weekday: +e.target.value })}>
                  {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d.toUpperCase()}</option>)}
                </select>
              </div>
            )}
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="t-label">HEURE</label>
              <select className="select" value={cfg.hour} onChange={e => patchCfg({ hour: +e.target.value })}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="t-label">RÉTENTION</label>
              <select className="select" value={cfg.retention} onChange={e => patchCfg({ retention: +e.target.value })}>
                {RETENTION_OPTIONS.map(n => (
                  <option key={n} value={n}>{n} BACKUP{n > 1 ? 'S' : ''}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveConfig}
              style={{ flexShrink: 0 }}
              disabled={!localCfg}
            >
              ENREGISTRER
            </button>
          </div>

          {/* Feedback config */}
          {success && (
            <div className="t-label" style={{ color: 'var(--online)', marginBottom: 14 }}>✓ {success}</div>
          )}
          {error && (
            <div className="t-label" style={{ color: 'var(--accent-red)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={12} /> {error}
            </div>
          )}

          {/* Liste des backups */}
          <div className="t-label" style={{ marginBottom: 8 }}>
            SAUVEGARDES · {backups.length}/{cfg.retention}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {backups.length === 0 ? (
              <div className="empty-state">// AUCUNE SAUVEGARDE</div>
            ) : backups.map((b, i) => (
              <div key={b.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${i === 0 ? 'var(--online)' : 'var(--border-bright)'}`
              }}>
                <Database size={12} style={{ color: i === 0 ? 'var(--online)' : 'var(--text-muted)', flexShrink: 0 }} />
                <span className="t-mono" style={{ flex: 1, fontSize: 11 }}>{b.name}</span>
                <span className="t-label">{formatDate(b.date)}</span>
                <span className="t-label" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 52, textAlign: 'right' }}>
                  {formatSize(b.size)}
                </span>
                <button className="btn btn-ghost btn-icon" onClick={() => deleteBackup(b.name)} title="Supprimer">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Bouton backup manuel */}
          <button
            className="btn btn-primary"
            onClick={triggerBackup}
            disabled={running}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {running
              ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> EN COURS...</>
              : <><Zap size={14} /> BACKUP MAINTENANT</>
            }
          </button>
        </div>
      )}

      {/* ── Migration localStorage → API ── */}
      {isAdmin && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Upload size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              MIGRATION DONNÉES
            </span>
            <span className="t-label" style={{ color: 'var(--text-muted)' }}>ANCIENNE VERSION</span>
          </div>
          <p className="t-label" style={{ color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
            Si tu avais des données dans l'ancienne version (localStorage), clique sur le bouton ci-dessous pour les importer dans la base de données.
            Cette opération est sans risque : les données existantes ne seront pas écrasées.
          </p>
          <button
            className="btn btn-ghost"
            onClick={handleMigrate}
            disabled={migrating}
          >
            {migrating ? '⏳ MIGRATION...' : '⚡ MIGRER DEPUIS LOCALSTORAGE'}
          </button>
          <Msg msg={migrateMsg} />
        </div>
      )}
    </div>
  )
}
