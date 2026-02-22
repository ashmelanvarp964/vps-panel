import { motion } from 'framer-motion'

const ResourceBar = ({ label, value, color = 'primary', showLabel = true }) => {
  // Determine color based on value
  const getBarColor = () => {
    if (value >= 90) return 'bg-red-500'
    if (value >= 70) return 'bg-yellow-500'
    if (color === 'primary') return 'bg-primary-500'
    if (color === 'secondary') return 'bg-secondary-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{label}</span>
          <span className="text-gray-300">{value?.toFixed(1) || 0}%</span>
        </div>
      )}
      <div className="resource-bar">
        <motion.div
          className={`resource-bar-fill ${getBarColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value || 0, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default ResourceBar
