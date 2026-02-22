import { motion } from 'framer-motion'
import LoadingSpinner from '../common/LoadingSpinner'
import { 
  HiOutlinePlay, 
  HiOutlineStop, 
  HiOutlineRefresh, 
  HiOutlineBan,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineTerminal
} from 'react-icons/hi'

const VPSActions = ({ 
  vps, 
  isOwner, 
  actionLoading, 
  onAction, 
  onOpenTerminal,
  onDelete 
}) => {
  const isDisabled = (action) => {
    if (actionLoading) return true
    if (vps.status === 'suspended' || vps.status === 'expired') {
      return ['start', 'reboot'].includes(action)
    }
    return false
  }

  const buttons = [
    {
      action: 'start',
      label: 'Start',
      icon: HiOutlinePlay,
      className: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
      show: vps.status !== 'running'
    },
    {
      action: 'stop',
      label: 'Stop',
      icon: HiOutlineStop,
      className: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
      show: vps.status === 'running'
    },
    {
      action: 'reboot',
      label: 'Reboot',
      icon: HiOutlineRefresh,
      className: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30',
      show: vps.status === 'running'
    }
  ]

  const ownerButtons = [
    {
      action: 'suspend',
      label: 'Suspend',
      icon: HiOutlineBan,
      className: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
      show: vps.status !== 'suspended' && vps.status !== 'expired'
    },
    {
      action: 'unsuspend',
      label: 'Unsuspend',
      icon: HiOutlineCheck,
      className: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
      show: vps.status === 'suspended' || vps.status === 'expired'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Main actions */}
      <div className="flex flex-wrap gap-3">
        {buttons.filter(b => b.show).map((button) => (
          <motion.button
            key={button.action}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAction(button.action)}
            disabled={isDisabled(button.action)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium 
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              ${button.className}`}
          >
            {actionLoading === button.action ? (
              <LoadingSpinner size="sm" />
            ) : (
              <button.icon className="w-5 h-5" />
            )}
            {button.label}
          </motion.button>
        ))}

        {/* Terminal button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenTerminal}
          disabled={vps.status !== 'running'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium 
            bg-primary-500/20 text-primary-400 hover:bg-primary-500/30
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiOutlineTerminal className="w-5 h-5" />
          Terminal
        </motion.button>
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div className="flex flex-wrap gap-3 pt-4 border-t border-primary-500/10">
          {ownerButtons.filter(b => b.show).map((button) => (
            <motion.button
              key={button.action}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAction(button.action)}
              disabled={isDisabled(button.action)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium 
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${button.className}`}
            >
              {actionLoading === button.action ? (
                <LoadingSpinner size="sm" />
              ) : (
                <button.icon className="w-5 h-5" />
              )}
              {button.label}
            </motion.button>
          ))}

          {/* Delete button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDelete}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium 
              bg-red-500/20 text-red-400 hover:bg-red-500/30
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiOutlineTrash className="w-5 h-5" />
            Delete
          </motion.button>
        </div>
      )}
    </div>
  )
}

export default VPSActions
