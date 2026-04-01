import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) {
    // Avoid redirect loop: don't add ?next= if already heading to /login
    const current = location.pathname + location.search
    const target = current === '/' || current.startsWith('/login') ? '/login' : `/login?next=${encodeURIComponent(location.pathname)}`
    return <Navigate to={target} replace />
  }
  return <>{children}</>
}
