// ============================================================
// AUTH PROVIDER — MOCK multi-utilisateurs (localStorage)
// TODO: remplacer ce fichier entier par Authelia forward-auth
// ============================================================
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { loadJSON, saveJSON, uid } from '../utils/storage'

const MOCK_USER = import.meta.env.VITE_MOCK_USER || 'admin'
const MOCK_PASS = import.meta.env.VITE_MOCK_PASS || 'homelab2024'

const USERS_KEY    = 'hl_users_v1'
const STORAGE_AUTH = 'hl_authenticated'
const STORAGE_USER = 'hl_user'

function initUsers() {
  const stored = loadJSON(USERS_KEY, null)
  if (stored) return stored
  const users = [{ id: uid(), username: MOCK_USER, password: MOCK_PASS, role: 'admin' }]
  saveJSON(USERS_KEY, users)
  return users
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [users, setUsers]   = useState(() => initUsers())
  const [user, setUser]     = useState(null)
  const [ready, setReady]   = useState(false)

  useEffect(() => {
    try {
      const authed = localStorage.getItem(STORAGE_AUTH) === 'true'
      const stored = localStorage.getItem(STORAGE_USER)
      if (authed && stored) setUser(stored)
    } catch (_) {}
    setReady(true)
  }, [])

  useEffect(() => { saveJSON(USERS_KEY, users) }, [users])

  const login = useCallback((username, password) => {
    const found = users.find(u => u.username === username && u.password === password)
    if (found) {
      try {
        localStorage.setItem(STORAGE_AUTH, 'true')
        localStorage.setItem(STORAGE_USER, username)
      } catch (_) {}
      setUser(username)
      return { success: true }
    }
    return { success: false, error: 'ACCESS DENIED — INVALID CREDENTIALS' }
  }, [users])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_AUTH)
      localStorage.removeItem(STORAGE_USER)
    } catch (_) {}
    setUser(null)
  }, [])

  const currentUserObj = users.find(u => u.username === user) || null
  const isAdmin = currentUserObj?.role === 'admin'

  const createUser = useCallback((username, password, role = 'user') => {
    if (!username.trim() || !password) return { success: false, error: 'FILL ALL FIELDS' }
    if (users.find(u => u.username === username.trim())) return { success: false, error: 'USERNAME ALREADY EXISTS' }
    setUsers(prev => [...prev, { id: uid(), username: username.trim(), password, role }])
    return { success: true }
  }, [users])

  const changePassword = useCallback((username, oldPassword, newPassword) => {
    const found = users.find(u => u.username === username && u.password === oldPassword)
    if (!found) return { success: false, error: 'CURRENT PASSWORD INCORRECT' }
    setUsers(prev => prev.map(u => u.username === username ? { ...u, password: newPassword } : u))
    return { success: true }
  }, [users])

  const deleteUser = useCallback((targetUsername) => {
    setUsers(prev => prev.filter(u => u.username !== targetUsername))
  }, [])

  const value = {
    user,
    users,
    login,
    logout,
    isAdmin,
    createUser,
    changePassword,
    deleteUser,
    isAuthenticated: !!user,
    ready
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
