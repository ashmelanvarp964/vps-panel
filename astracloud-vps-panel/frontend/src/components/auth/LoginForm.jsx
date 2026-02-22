import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../common/LoadingSpinner'
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi'

const LoginForm = () => {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(formData)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Email/Username field */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Username or Email
        </label>
        <div className="relative">
          <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            name="login"
            value={formData.login}
            onChange={handleChange}
            className="input-field pl-12"
            placeholder="Enter your username or email"
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* Password field */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Password
        </label>
        <div className="relative">
          <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input-field pl-12"
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      {/* Register link */}
      <p className="text-center text-gray-500">
        Don't have an account?{' '}
        <Link 
          to="/register" 
          className="text-primary-400 hover:text-primary-300 transition-colors"
        >
          Create one
        </Link>
      </p>
    </motion.form>
  )
}

export default LoginForm
