import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useVPS } from '../hooks/useVPS'
import { useAuth } from '../hooks/useAuth'
import { vpsApi } from '../services/api'
import VPSInfoPanel from '../components/vps/VPSInfoPanel'
import VPSActions from '../components/vps/VPSActions'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { HiOutlineArrowLeft } from 'react-icons/hi'

const VPSDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isOwner } = useAuth()
  const { vps, loading, error, actionLoading, performAction, refresh } = useVPS(id)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleAction = async (action) => {
    const result = await performAction(action, id)
    if (result.success) {
      // Action succeeded
    }
  }

  const handleOpenTerminal = () => {
    navigate(`/vps/${id}/terminal`)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    setDeleting(true)
    try {
      await vpsApi.delete(id)
      navigate('/dashboard')
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !vps) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-400 mb-4">{error || 'VPS not found'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <HiOutlineArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </motion.button>

      {/* VPS Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <VPSInfoPanel vps={vps} />
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
        <VPSActions
          vps={vps}
          isOwner={isOwner}
          actionLoading={actionLoading}
          onAction={handleAction}
          onOpenTerminal={handleOpenTerminal}
          onDelete={handleDelete}
        />
      </motion.div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">Confirm Delete</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete <strong>{vps.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
                disabled={deleting}
              >
                {deleting ? <LoadingSpinner size="sm" /> : null}
                Delete VPS
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default VPSDetailsPage
