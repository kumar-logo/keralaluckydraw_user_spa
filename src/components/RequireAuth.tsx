import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.token)
  const { pathname, search } = useLocation()

  if (!token && !localStorage.getItem('token')) {
    const origin = encodeURIComponent(window.location.origin + pathname + search)
    return <Navigate to={`/login?origin=url_${origin}`} replace />
  }

  return <>{children}</>
}

export default RequireAuth
