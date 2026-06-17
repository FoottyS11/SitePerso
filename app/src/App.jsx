import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import PrivateRoute from './auth/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Todo from './pages/Todo'
import Planner from './pages/Planner'
import Wishlist from './pages/Wishlist'
import Inventaire from './pages/Inventaire'
import Garage from './pages/Garage'
import Settings from './pages/Settings'
import Bloc2Checklist from './pages/Bloc2Checklist'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/todo"       element={<Todo />} />
              <Route path="/planner"    element={<Planner />} />
              <Route path="/wishlist"   element={<Wishlist />} />
              <Route path="/inventaire" element={<Inventaire />} />
              <Route path="/garage"     element={<Garage />} />
              <Route path="/bloc2"      element={<Bloc2Checklist />} />
              <Route path="/settings"   element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
