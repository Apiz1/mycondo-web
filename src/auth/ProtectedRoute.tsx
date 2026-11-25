import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth-context'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="p-8 text-slate-500">Loading…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}