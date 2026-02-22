import { createContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        setUser(response.data.user)
      } catch (err) {
        // Token invalid or expired
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login
  const login = useCallback(async (credentials) => {
    setError(null)
    try {
      const response = await api.post('/auth/login', credentials)
      const { token, user: userData } = response.data
      
      localStorage.setItem('token', token)
      setUser(userData)
      
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  // Register
  const register = useCallback(async (data) => {
    setError(null)
    try {
      const response = await api.post('/auth/register', data)
      const { token, user: userData } = response.data
      
      localStorage.setItem('token', token)
      setUser(userData)
      
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (err) {
      // If refresh fails, log out
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
    isOwner: user?.role === 'owner',
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
