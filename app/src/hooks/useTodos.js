import { useCallback, useEffect, useState } from 'react'
import { loadJSON, saveJSON, uid } from '../utils/storage'

const KEY = 'hl_todos_v1'

const DEFAULTS = []

/**
 * Hook todos — persistance localStorage.
 * TODO: remplacer par appels API quand backend en place.
 */
export function useTodos() {
  const [todos, setTodos] = useState(() => loadJSON(KEY, DEFAULTS))

  useEffect(() => { saveJSON(KEY, todos) }, [todos])

  const create = useCallback((data) => {
    const now = new Date().toISOString()
    const t = {
      id: uid(),
      text: '',
      status: 'todo',
      priority: 'P3',
      categoryId: null,
      color: null,
      emoji: null,
      comment: '',
      markdown: '',
      dueDate: null,
      reminder: null,
      createdAt: now,
      updatedAt: now,
      ...data
    }
    setTodos(prev => [t, ...prev])
    return t
  }, [])

  const update = useCallback((id, patch) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
  }, [])

  const remove = useCallback((id) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const toggleStatus = useCallback((id) => {
    setTodos(prev => prev.map(t => {
      if (t.id !== id) return t
      const next = t.status === 'todo' ? 'done'
        : t.status === 'done' ? 'cancelled'
        : 'todo'
      return { ...t, status: next, updatedAt: new Date().toISOString() }
    }))
  }, [])

  return { todos, create, update, remove, toggleStatus }
}
