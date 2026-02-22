import { motion } from 'framer-motion'

const statusConfig = {
  running: {
    label: 'Running',
    className: 'status-running',
    dotColor: 'bg-green-500'
  },
  stopped: {
    label: 'Stopped',
    className: 'status-stopped',
    dotColor: 'bg-gray-500'
  },
  suspended: {
    label: 'Suspended',
    className: 'status-suspended',
    dotColor: 'bg-yellow-500'
  },
  expired: {
    label: 'Expired',
    className: 'status-expired',
    dotColor: 'bg-red-500'
  }
}

const StatusBadge = ({ status, animated = true }) => {
  const config = statusConfig[status] || statusConfig.stopped

  const Badge = animated ? motion.span : 'span'
  const badgeProps = animated ? {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.2 }
  } : {}

  return (
    <Badge
      className={`status-badge ${config.className} flex items-center gap-2`}
      {...badgeProps}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor} ${status === 'running' ? 'animate-pulse' : ''}`} />
      {config.label}
    </Badge>
  )
}

export default StatusBadge
