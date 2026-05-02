import { useCallback, useEffect, useState } from 'react'
import { uid } from '../utils/storage'

const API = '/api'

export function useTodos() {
  const [todos, setTodos]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/todos`)
      .then(r => r.json())
      .then(data => { setTodos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const create = useCallback((data) => {
    const now = new Date().toISOString()
    const optimistic = {
      id: uid(), text: '', status: 'todo', priority: null, categoryId: null,
      color: null, emoji: null, comment: '', markdown: '', dueDate: null,
      reminder: null, createdAt: now, updatedAt: now, ...data,
    }
    setTodos(prev => [optimistic, ...prev])
    fetch(`${API}/todos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optimistic),
    }).then(r => r.json()).then(saved => {
      setTodos(prev => prev.map(t => t.id === optimistic.id ? saved : t))
    }).catch(() => {
      setTodos(prev => prev.filter(t => t.id !== optimistic.id))
    })
    return optimistic
  }, [])

  const update = useCallback((id, patch) => {
    const now = new Date().toISOString()
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...patch, updatedAt: now } : t))
    fetch(`${API}/todos/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(r => r.json()).then(saved => {
      setTodos(prev => prev.map(t => t.id === id ? saved : t))
    })
  }, [])

  const remove = useCallback((id) => {
    setTodos(prev => prev.filter(t => t.id !== id))
    fetch(`${API}/todos/${id}`, { method: 'DELETE' })
  }, [])

  const toggleStatus = useCallback((id) => {
    setTodos(prev => prev.map(t => {
      if (t.id !== id) return t
      const next = t.status === 'todo' ? 'done' : t.status === 'done' ? 'cancelled' : 'todo'
      const updated = { ...t, status: next, updatedAt: new Date().toISOString() }
      fetch(`${API}/todos/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      return updated
    }))
  }, [])

  return { todos, loading, create, update, remove, toggleStatus }
}
