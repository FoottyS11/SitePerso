import { useCallback, useEffect, useState } from 'react'
import { uid } from '../utils/storage'

const API = '/api/planner'

// ── Boards ──────────────────────────────────────────────────
export function usePlannerBoards() {
  const [boards, setBoards]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/boards`)
      .then(r => r.json())
      .then(data => { setBoards(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const create = useCallback(async (data = {}) => {
    const res = await fetch(`${API}/boards`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const saved = await res.json()
    setBoards(prev => [...prev, saved])
    return saved
  }, [])

  const update = useCallback((id, patch) => {
    setBoards(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
    fetch(`${API}/boards/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(r => r.json()).then(saved => {
      setBoards(prev => prev.map(b => b.id === id ? saved : b))
    })
  }, [])

  const remove = useCallback((id) => {
    setBoards(prev => prev.filter(b => b.id !== id))
    fetch(`${API}/boards/${id}`, { method: 'DELETE' })
  }, [])

  return { boards, loading, create, update, remove, setBoards }
}

// ── Données d'un board (buckets + tasks) ────────────────────
export function useBoardData(boardId) {
  const [buckets, setBuckets] = useState([])
  const [tasks, setTasks]     = useState([])
  const [board, setBoard]     = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!boardId) { setBuckets([]); setTasks([]); setBoard(null); return }
    setLoading(true)
    fetch(`${API}/boards/${boardId}/data`)
      .then(r => r.json())
      .then(({ board, buckets, tasks }) => {
        setBoard(board); setBuckets(buckets || []); setTasks(tasks || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [boardId])

  // — Buckets —
  const createBucket = useCallback((name = 'NOUVEAU COMPARTIMENT') => {
    const optimistic = { id: uid(), boardId, name, position: 9999, createdAt: new Date().toISOString() }
    setBuckets(prev => [...prev, optimistic])
    fetch(`${API}/buckets`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, name }),
    }).then(r => r.json()).then(saved => {
      setBuckets(prev => prev.map(b => b.id === optimistic.id ? saved : b))
      // migre d'éventuelles tâches créées sur l'id optimiste
      setTasks(prev => prev.map(t => t.bucketId === optimistic.id ? { ...t, bucketId: saved.id } : t))
    })
  }, [boardId])

  const updateBucket = useCallback((id, patch) => {
    setBuckets(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
    fetch(`${API}/buckets/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }, [])

  const removeBucket = useCallback((id) => {
    setBuckets(prev => prev.filter(b => b.id !== id))
    setTasks(prev => prev.filter(t => t.bucketId !== id))
    fetch(`${API}/buckets/${id}`, { method: 'DELETE' })
  }, [])

  // — Tasks —
  const createTask = useCallback((data) => {
    const now = new Date().toISOString()
    const optimistic = {
      id: uid(), boardId, title: '', notes: '', priority: 'medium', progress: 'notstarted',
      labels: [], checklist: [], assignees: [], startDate: null, dueDate: null,
      position: 9999, createdAt: now, updatedAt: now, ...data,
    }
    setTasks(prev => [...prev, optimistic])
    fetch(`${API}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...optimistic, boardId }),
    }).then(r => r.json()).then(saved => {
      setTasks(prev => prev.map(t => t.id === optimistic.id ? saved : t))
    }).catch(() => {
      setTasks(prev => prev.filter(t => t.id !== optimistic.id))
    })
    return optimistic
  }, [boardId])

  const updateTask = useCallback((id, patch) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
    fetch(`${API}/tasks/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(r => r.json()).then(saved => {
      setTasks(prev => prev.map(t => t.id === id ? saved : t))
    })
  }, [])

  const removeTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
  }, [])

  // — Déplacement drag & drop : recalcule positions et persiste —
  const moveTask = useCallback((taskId, target, index, extraPatch = {}) => {
    setTasks(prev => {
      const moving = prev.find(t => t.id === taskId)
      if (!moving) return prev
      const updated = { ...moving, ...extraPatch }
      const rest = prev.filter(t => t.id !== taskId)

      // tâches de la colonne cible (selon le champ de groupage)
      const targetField = target.field   // 'bucketId' | 'progress' | 'priority'
      const targetValue = target.value
      updated[targetField] = targetValue

      const col = rest
        .filter(t => t[targetField] === targetValue)
        .sort((a, b) => a.position - b.position)

      const clamped = Math.max(0, Math.min(index ?? col.length, col.length))
      col.splice(clamped, 0, updated)
      col.forEach((t, i) => { t.position = i })

      const colIds = new Set(col.map(t => t.id))
      const next = rest.map(t => colIds.has(t.id) ? col.find(c => c.id === t.id) : t)
      if (!colIds.has(updated.id)) next.push(updated)

      // persiste la colonne réordonnée
      const payload = col.map(t => ({
        id: t.id, bucketId: t.bucketId, position: t.position,
        progress: t.progress, priority: t.priority,
      }))
      fetch(`${API}/reorder`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: payload }),
      })
      return next
    })
  }, [])

  const reorderBuckets = useCallback((orderedIds) => {
    setBuckets(prev => {
      const map = new Map(prev.map(b => [b.id, b]))
      const next = orderedIds.map((id, i) => ({ ...map.get(id), position: i })).filter(Boolean)
      fetch(`${API}/reorder`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buckets: next.map(b => ({ id: b.id, position: b.position })) }),
      })
      return next
    })
  }, [])

  return {
    board, setBoard, buckets, tasks, loading,
    createBucket, updateBucket, removeBucket,
    createTask, updateTask, removeTask, moveTask, reorderBuckets,
  }
}
