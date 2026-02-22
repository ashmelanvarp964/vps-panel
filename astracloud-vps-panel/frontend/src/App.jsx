import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AnimatePresence } from 'framer-motion'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import VPSDetailsPage from './pages/VPSDetailsPage'
import TerminalPage from './pages/TerminalPage'
import AdminPage from './pages/AdminPage'

// Components
import Layout from './components/common/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'

// Protected Route wrapper
const ProtectedRoute = ({ children, requireOwner = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-300">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireOwner && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Public Route wrapper (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-300">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected routes with layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vps/:id" element={<VPSDetailsPage />} />
          <Route path="vps/:id/terminal" element={<TerminalPage />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute requireOwner>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App
