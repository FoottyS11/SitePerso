import { useCallback, useEffect, useState } from 'react'
import { uid } from '../utils/storage'

const API = '/api'

export function useCategories() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  const create = useCallback((data) => {
    const optimistic = {
      id: uid(), name: 'NEW', color: '#3d3d4a', emoji: null, priority: null,
      createdAt: new Date().toISOString(), ...data,
    }
    setCategories(prev => [...prev, optimistic])
    fetch(`${API}/categories`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optimistic),
    }).then(r => r.json()).then(saved => {
      setCategories(prev => prev.map(c => c.id === optimistic.id ? saved : c))
    }).catch(() => {
      setCategories(prev => prev.filter(c => c.id !== optimistic.id))
    })
    return optimistic
  }, [])

  const update = useCallback((id, patch) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
    fetch(`${API}/categories/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(r => r.json()).then(saved => {
      setCategories(prev => prev.map(c => c.id === id ? saved : c))
    })
  }, [])

  const remove = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id))
    fetch(`${API}/categories/${id}`, { method: 'DELETE' })
  }, [])

  return { categories, create, update, remove }
}
