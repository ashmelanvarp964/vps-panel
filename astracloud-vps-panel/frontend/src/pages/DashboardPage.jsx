import { motion } from 'framer-motion'
import { useVPS } from '../hooks/useVPS'
import { useAuth } from '../hooks/useAuth'
import VPSGrid from '../components/dashboard/VPSGrid'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { HiOutlineRefresh, HiOutlineServer, HiOutlineExclamation } from 'react-icons/hi'

const DashboardPage = () => {
  const { vpsList, loading, error, refresh } = useVPS()
  const { isOwner } = useAuth()

  // Stats
  const stats = {
    total: vpsList.length,
    running: vpsList.filter(v => v.status === 'running').length,
    stopped: vpsList.filter(v => v.status === 'stopped').length,
    suspended: vpsList.filter(v => v.status === 'suspended' || v.status === 'expired').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500">
            {isOwner ? 'Manage all VPS instances' : 'Your virtual private servers'}
          </p>
        </div>
        <button
          onClick={refresh}
          className="btn-secondary flex items-center gap-2"
        >
          <HiOutlineRefresh className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <HiOutlineServer className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-500">Total VPS</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.running}</p>
              <p className="text-xs text-gray-500">Running</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.stopped}</p>
              <p className="text-xs text-gray-500">Stopped</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <HiOutlineExclamation className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.suspended}</p>
              <p className="text-xs text-gray-500">Suspended</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* VPS Grid */}
      <VPSGrid vpsList={vpsList} />
    </div>
  )
}

export default DashboardPage
