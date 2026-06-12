import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import { useThemeStore } from './store/theme.store'
import { Login } from './views/Login'
import { Dashboard } from './views/Dashboard'
import { PathDetail } from './views/PathDetail'
import { Statistics } from './views/Statistics'
import { Team } from './views/Team'
import { Layout } from './components/Layout'
import { ToastContainer } from './components/ToastContainer'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-crehana-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-crehana-mora"></div>
      </div>
    )
  }

  return isAuthenticated ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/login" replace />
  )
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

export const App: React.FC = () => {
  const { initialize } = useAuthStore()
  const { initializeTheme } = useThemeStore()

  useEffect(() => {
    initialize()
    initializeTheme()
  }, [initialize, initializeTheme])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/paths/:id"
          element={
            <ProtectedRoute>
              <PathDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <Statistics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App
