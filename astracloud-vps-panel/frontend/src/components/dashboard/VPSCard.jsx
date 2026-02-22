import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import StatusBadge from '../common/StatusBadge'
import ResourceBar from './ResourceBar'
import { HiOutlineServer, HiOutlineChip, HiOutlineDatabase } from 'react-icons/hi'

const VPSCard = ({ vps, index }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/vps/${vps.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={handleClick}
      className="glass-card glass-card-hover p-6 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
            <HiOutlineServer className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{vps.name}</h3>
            <p className="text-sm text-gray-500">{vps.ip_address}</p>
          </div>
        </div>
        <StatusBadge status={vps.status} />
      </div>

      {/* Specs */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-2 rounded-lg bg-dark-200/50">
          <HiOutlineChip className="w-4 h-4 mx-auto text-gray-500 mb-1" />
          <p className="text-xs text-gray-400">CPU</p>
          <p className="text-sm font-medium text-white">{vps.cpu_cores} Core</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-dark-200/50">
          <div className="w-4 h-4 mx-auto text-gray-500 mb-1 flex items-center justify-center">
            <span className="text-xs">RAM</span>
          </div>
          <p className="text-xs text-gray-400">Memory</p>
          <p className="text-sm font-medium text-white">{(vps.ram_mb / 1024).toFixed(1)} GB</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-dark-200/50">
          <HiOutlineDatabase className="w-4 h-4 mx-auto text-gray-500 mb-1" />
          <p className="text-xs text-gray-400">Disk</p>
          <p className="text-sm font-medium text-white">{vps.disk_gb} GB</p>
        </div>
      </div>

      {/* Resource usage */}
      <div className="space-y-2">
        <ResourceBar 
          label="CPU" 
          value={parseFloat(vps.cpu_usage_percent) || 0} 
          color="primary" 
        />
        <ResourceBar 
          label="RAM" 
          value={parseFloat(vps.ram_usage_percent) || 0} 
          color="secondary" 
        />
        <ResourceBar 
          label="Disk" 
          value={parseFloat(vps.disk_usage_percent) || 0} 
          color="green" 
        />
      </div>

      {/* Expiry warning */}
      {vps.expiry_date && (
        <div className="mt-4 pt-4 border-t border-primary-500/10">
          <p className="text-xs text-gray-500">
            Expires: <span className="text-gray-400">{new Date(vps.expiry_date).toLocaleDateString()}</span>
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default VPSCard
