import { useCallback, useEffect, useState } from 'react'

const API = '/api'

const DEFAULT_CONFIG = { enabled: true, frequency: 'daily', hour: 3, weekday: 1, retention: 2 }

export function useBackup() {
  const [backups, setBackups]   = useState([])
  const [config, setConfig]     = useState(DEFAULT_CONFIG)
  const [running, setRunning]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(null)

  const reload = useCallback(async () => {
    try {
      const r = await fetch(`${API}/backups`)
      const d = await r.json()
      setBackups(d.backups || [])
      setConfig({ ...DEFAULT_CONFIG, ...(d.config || {}) })
    } catch (e) { setError(e.message) }
  }, [])

  useEffect(() => { reload() }, [reload])

  const saveConfig = useCallback(async (cfg) => {
    try {
      const r = await fetch(`${API}/backup-config`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      const saved = await r.json()
      setConfig({ ...DEFAULT_CONFIG, ...saved })
      setSuccess('Configuration sauvegardée')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) { setError(e.message) }
  }, [])

  const triggerBackup = useCallback(async () => {
    setRunning(true)
    setError(null)
    setSuccess(null)
    try {
      const r = await fetch(`${API}/backups`, { method: 'POST' })
      const d = await r.json()
      if (d.ok) {
        setBackups(d.backups || [])
        setSuccess('Sauvegarde créée avec succès')
        setTimeout(() => setSuccess(null), 4000)
      } else {
        setError(d.error || 'Erreur lors de la sauvegarde')
      }
    } catch (e) { setError(e.message) }
    finally { setRunning(false) }
  }, [])

  const deleteBackup = useCallback(async (name) => {
    setBackups(prev => prev.filter(b => b.name !== name))
    await fetch(`${API}/backups/${encodeURIComponent(name)}`, { method: 'DELETE' })
  }, [])

  const migrate = useCallback(async (todos, categories) => {
    const r = await fetch(`${API}/migrate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todos, categories }),
    })
    return r.json()
  }, [])

  return { backups, config, running, error, success, saveConfig, triggerBackup, deleteBackup, migrate, reload }
}
