// ============================================================
// AUTH PROVIDER — MOCK
// TODO: remplacer ce fichier entier par Authelia forward-auth
// Avec Authelia : supprimer le formulaire /login dans React,
// laisser Authelia gérer la session via cookie serveur,
// et remplacer useAuth() par un appel GET /_authelia/api/user/info
// ============================================================
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Credentials mock — visibles dans les DevTools, LAN uniquement
// NE JAMAIS commiter de vrais mots de passe ici
const MOCK_USER = import.meta.env.VITE_MOCK_USER || 'admin'
const MOCK_PASS = import.meta.env.VITE_MOCK_PASS || 'homelab2024'

const STORAGE_AUTH = 'hl_authenticated'
const STORAGE_USER = 'hl_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // Hydratation depuis localStorage
  useEffect(() => {
    try {
      const authed = localStorage.getItem(STORAGE_AUTH) === 'true'
      const stored = localStorage.getItem(STORAGE_USER)
      if (authed && stored) setUser(stored)
    } catch (_) {
      // localStorage indispo (mode privé ?) — on ignore
    }
    setReady(true)
  }, [])

  const login = useCallback((username, password) => {
    if (username === MOCK_USER && password === MOCK_PASS) {
      try {
        localStorage.setItem(STORAGE_AUTH, 'true')
        localStorage.setItem(STORAGE_USER, username)
      } catch (_) {}
      setUser(username)
      return { success: true }
    }
    return { success: false, error: 'ACCESS DENIED — INVALID CREDENTIALS' }
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_AUTH)
      localStorage.removeItem(STORAGE_USER)
    } catch (_) {}
    setUser(null)
  }, [])

  const value = {
    user,
    login,
    logout,
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
