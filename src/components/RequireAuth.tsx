import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) {
    const current = location.pathname + location.search
    const target = current === '/home' || current === '/' || current.startsWith('/login')
      ? '/login'
      : `/login?next=${encodeURIComponent(location.pathname)}`
    return <Navigate to={target} replace />
  }
  return <>{children}</>
}
