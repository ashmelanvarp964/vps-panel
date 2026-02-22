import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { vpsApi } from '../services/api'
import Terminal from '../components/vps/Terminal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { HiOutlineArrowLeft, HiOutlineTerminal, HiOutlineDesktopComputer } from 'react-icons/hi'

const TerminalPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vps, setVps] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('ssh')

  useEffect(() => {
    const fetchVPS = async () => {
      try {
        const response = await vpsApi.getById(id)
        setVps(response.data.vps)
        
        // Check if VPS is running
        if (response.data.vps.status !== 'running') {
          setError('VPS must be running to access terminal')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch VPS')
      } finally {
        setLoading(false)
      }
    }

    fetchVPS()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => navigate(`/vps/${id}`)}
          className="btn-secondary"
        >
          Back to VPS Details
        </button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(`/vps/${id}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
            Back
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white">{vps?.name}</h1>
            <p className="text-sm text-gray-500">{vps?.ip_address}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('ssh')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'ssh'
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
          >
            <HiOutlineTerminal className="w-5 h-5" />
            SSH Terminal
          </button>
          <button
            onClick={() => setActiveTab('vnc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'vnc'
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
          >
            <HiOutlineDesktopComputer className="w-5 h-5" />
            VNC Console
          </button>
        </div>
      </div>

      {/* Terminal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 glass-card overflow-hidden"
      >
        {activeTab === 'ssh' ? (
          <Terminal vpsId={id} type="ssh" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <HiOutlineDesktopComputer className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">VNC Console</p>
              <p className="text-sm text-gray-500">Coming soon...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default TerminalPage
