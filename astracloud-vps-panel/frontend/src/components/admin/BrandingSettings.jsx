import { useState } from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../common/LoadingSpinner'
import { HiOutlineColorSwatch, HiOutlineSave } from 'react-icons/hi'

const BrandingSettings = ({ branding, onUpdate }) => {
  const [formData, setFormData] = useState({
    panel_name: branding?.panel_name || 'AstraCloud',
    logo_url: branding?.logo_url || '',
    primary_color: branding?.primary_color || '#6366f1',
    secondary_color: branding?.secondary_color || '#8b5cf6'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const result = await onUpdate(formData)

    if (result.success) {
      setSuccess('Branding updated successfully!')
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-6"
    >
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <HiOutlineColorSwatch className="w-6 h-6 text-primary-400" />
        Branding Settings
      </h2>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Panel Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Panel Name
          </label>
          <input
            type="text"
            name="panel_name"
            value={formData.panel_name}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., AstraCloud"
          />
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
            className="input-field"
            placeholder="https://example.com/logo.png"
          />
          {formData.logo_url && (
            <div className="mt-2 p-4 rounded-lg bg-dark-200/50">
              <img 
                src={formData.logo_url} 
                alt="Logo preview" 
                className="max-h-16 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Primary Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                name="primary_color"
                value={formData.primary_color}
                onChange={handleChange}
                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border border-primary-500/30"
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={handleChange}
                name="primary_color"
                className="input-field flex-1 font-mono"
                placeholder="#6366f1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Secondary Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                name="secondary_color"
                value={formData.secondary_color}
                onChange={handleChange}
                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border border-primary-500/30"
              />
              <input
                type="text"
                value={formData.secondary_color}
                onChange={handleChange}
                name="secondary_color"
                className="input-field flex-1 font-mono"
                placeholder="#8b5cf6"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-6 rounded-lg bg-dark-200/50 border border-primary-500/10">
          <p className="text-sm text-gray-500 mb-3">Preview</p>
          <div 
            className="h-2 rounded-full mb-2"
            style={{ background: `linear-gradient(to right, ${formData.primary_color}, ${formData.secondary_color})` }}
          />
          <p 
            className="text-2xl font-bold"
            style={{ 
              background: `linear-gradient(to right, ${formData.primary_color}, ${formData.secondary_color})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {formData.panel_name}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Saving...
            </>
          ) : (
            <>
              <HiOutlineSave className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </form>
    </motion.div>
  )
}

export default BrandingSettings
