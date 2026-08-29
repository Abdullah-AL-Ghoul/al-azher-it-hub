import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
 const { user, isAdmin, loading } = useAuth()

 // Wait for the async Supabase session restore before deciding to redirect.
 // Prevents the redirect-to-home flash/loop for persisted sessions.
 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-spatial-page" role="status" aria-label="Loading" aria-live="polite">
    <div className="w-12 h-12 border-4 border-royal-500/20 border-t-royal-500 rounded-full animate-spin" aria-hidden="true" />
    <span className="sr-only">Loading...</span>
   </div>
  )
 }

 if (!user) return <Navigate to="/" replace />
 if (adminOnly && !isAdmin) return <Navigate to="/home" replace />

 return children
}
