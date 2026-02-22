import { motion } from 'framer-motion'
import StatusBadge from '../common/StatusBadge'
import ResourceBar from '../dashboard/ResourceBar'
import { 
  HiOutlineServer, 
  HiOutlineChip, 
  HiOutlineDatabase,
  HiOutlineGlobe,
  HiOutlineTerminal,
  HiOutlineCalendar,
  HiOutlineClipboardCopy
} from 'react-icons/hi'

const VPSInfoPanel = ({ vps }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
          <HiOutlineServer className="w-8 h-8 text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{vps.name}</h2>
          <p className="text-gray-500">VMID: {vps.vmid}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={vps.status} />
        </div>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <HiOutlineChip className="w-5 h-5 text-primary-400 mb-2" />
          <p className="text-xs text-gray-500">CPU Cores</p>
          <p className="text-xl font-bold text-white">{vps.cpu_cores}</p>
        </div>
        <div className="glass-card p-4">
          <div className="w-5 h-5 text-secondary-400 mb-2 flex items-center justify-center text-xs font-bold">RAM</div>
          <p className="text-xs text-gray-500">Memory</p>
          <p className="text-xl font-bold text-white">{(vps.ram_mb / 1024).toFixed(1)} GB</p>
        </div>
        <div className="glass-card p-4">
          <HiOutlineDatabase className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-xs text-gray-500">Storage</p>
          <p className="text-xl font-bold text-white">{vps.disk_gb} GB</p>
        </div>
        <div className="glass-card p-4">
          <HiOutlineCalendar className="w-5 h-5 text-yellow-400 mb-2" />
          <p className="text-xs text-gray-500">Expiry</p>
          <p className="text-xl font-bold text-white">
            {vps.expiry_date ? new Date(vps.expiry_date).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Network info */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineGlobe className="w-5 h-5 text-primary-400" />
          Network Information
        </h3>
        
        <div className="space-y-4">
          {/* IP Address */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-dark-200/50">
            <div>
              <p className="text-xs text-gray-500">IP Address</p>
              <p className="text-white font-mono">{vps.ip_address}</p>
            </div>
            <button
              onClick={() => copyToClipboard(vps.ip_address)}
              className="p-2 rounded-lg hover:bg-primary-500/20 transition-colors"
              title="Copy"
            >
              <HiOutlineClipboardCopy className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* SSH Command */}
          {vps.ssh_command && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-200/50">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <HiOutlineTerminal className="w-4 h-4" />
                  SSH Access
                </p>
                <p className="text-white font-mono text-sm">{vps.ssh_command}</p>
              </div>
              <button
                onClick={() => copyToClipboard(vps.ssh_command)}
                className="p-2 rounded-lg hover:bg-primary-500/20 transition-colors"
                title="Copy"
              >
                <HiOutlineClipboardCopy className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}

          {/* Port info for private IP */}
          {vps.is_private_ip && vps.ssh_port && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400">
                This VPS has a private IP. SSH access is available via port forwarding on port {vps.ssh_port}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resource usage */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Resource Usage</h3>
        
        <div className="space-y-4">
          <ResourceBar 
            label="CPU" 
            value={parseFloat(vps.cpu_usage_percent) || 0} 
          />
          <ResourceBar 
            label="RAM" 
            value={parseFloat(vps.ram_usage_percent) || 0} 
          />
          <ResourceBar 
            label="Disk" 
            value={parseFloat(vps.disk_usage_percent) || 0} 
          />
        </div>
      </div>

      {/* Suspension reason */}
      {vps.suspension_reason && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <p className="text-sm text-red-400">
            <strong>Suspension Reason:</strong> {vps.suspension_reason}
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default VPSInfoPanel
