// ============================================================
// PRIVATE ROUTE — MOCK
// Vérifie isAuthenticated() — redirige vers /login sinon.
// Avec Authelia : ce composant devient inutile (protection au niveau proxy).
// TODO: supprimer quand Authelia est en place.
// ============================================================
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function PrivateRoute() {
  const { isAuthenticated, ready } = useAuth()
  const location = useLocation()

  // Évite un flash de redirection avant l'hydratation localStorage
  if (!ready) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
