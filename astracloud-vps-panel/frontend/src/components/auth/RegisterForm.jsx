import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../common/LoadingSpinner'
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi'

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, and a number')
      return false
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password
    })

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
      className="space-y-5"
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

      {/* Username field */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Username
        </label>
        <div className="relative">
          <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="input-field pl-12"
            placeholder="Choose a username"
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* Email field */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Email
        </label>
        <div className="relative">
          <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-field pl-12"
            placeholder="Enter your email"
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
            placeholder="Create a password"
            required
            disabled={loading}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Min 8 characters with uppercase, lowercase, and number
        </p>
      </div>

      {/* Confirm Password field */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-field pl-12"
            placeholder="Confirm your password"
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
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </button>

      {/* Login link */}
      <p className="text-center text-gray-500">
        Already have an account?{' '}
        <Link 
          to="/login" 
          className="text-primary-400 hover:text-primary-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.form>
  )
}

export default RegisterForm
