import { useCallback, useEffect, useState } from 'react'
import { loadJSON, saveJSON, uid } from '../utils/storage'

const KEY = 'hl_categories_v1'

export function useCategories() {
  const [categories, setCategories] = useState(() => loadJSON(KEY, []))

  useEffect(() => { saveJSON(KEY, categories) }, [categories])

  const create = useCallback((data) => {
    const c = {
      id: uid(),
      name: 'NEW',
      color: '#3d3d4a',
      emoji: null,
      priority: 'P3',
      dueDate: null,
      reminder: null,
      createdAt: new Date().toISOString(),
      ...data
    }
    setCategories(prev => [...prev, c])
    return c
  }, [])

  const update = useCallback((id, patch) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }, [])

  const remove = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categories, create, update, remove }
}
