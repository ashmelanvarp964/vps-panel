import { useState } from 'react'
import { motion } from 'framer-motion'
import { vpsApi } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import { HiOutlinePlus } from 'react-icons/hi'

const CreateVPSForm = ({ users, onCreated }) => {
  const [formData, setFormData] = useState({
    vmid: '',
    name: '',
    ram_mb: 1024,
    cpu_cores: 1,
    disk_gb: 20,
    ip_address: '',
    proxmox_node: 'pve',
    user_id: '',
    expiry_date: ''
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

    try {
      const data = {
        ...formData,
        vmid: parseInt(formData.vmid),
        ram_mb: parseInt(formData.ram_mb),
        cpu_cores: parseInt(formData.cpu_cores),
        disk_gb: parseInt(formData.disk_gb),
        user_id: formData.user_id ? parseInt(formData.user_id) : null,
        expiry_date: formData.expiry_date || null
      }

      await vpsApi.create(data)
      setSuccess('VPS created successfully!')
      setFormData({
        vmid: '',
        name: '',
        ram_mb: 1024,
        cpu_cores: 1,
        disk_gb: 20,
        ip_address: '',
        proxmox_node: 'pve',
        user_id: '',
        expiry_date: ''
      })
      onCreated?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create VPS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-6"
    >
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <HiOutlinePlus className="w-6 h-6 text-primary-400" />
        Create New VPS
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VMID */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Proxmox VMID *
            </label>
            <input
              type="number"
              name="vmid"
              value={formData.vmid}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., 100"
              required
              min="100"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              VPS Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., web-server-01"
              required
            />
          </div>

          {/* RAM */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              RAM (MB) *
            </label>
            <select
              name="ram_mb"
              value={formData.ram_mb}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value={512}>512 MB</option>
              <option value={1024}>1 GB</option>
              <option value={2048}>2 GB</option>
              <option value={4096}>4 GB</option>
              <option value={8192}>8 GB</option>
              <option value={16384}>16 GB</option>
              <option value={32768}>32 GB</option>
            </select>
          </div>

          {/* CPU */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              CPU Cores *
            </label>
            <select
              name="cpu_cores"
              value={formData.cpu_cores}
              onChange={handleChange}
              className="input-field"
              required
            >
              {[1, 2, 4, 6, 8, 12, 16].map(n => (
                <option key={n} value={n}>{n} Core{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* Disk */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Disk (GB) *
            </label>
            <input
              type="number"
              name="disk_gb"
              value={formData.disk_gb}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., 20"
              required
              min="1"
            />
          </div>

          {/* IP Address */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              IP Address *
            </label>
            <input
              type="text"
              name="ip_address"
              value={formData.ip_address}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., 192.168.1.100"
              required
              pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
            />
          </div>

          {/* Proxmox Node */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Proxmox Node *
            </label>
            <input
              type="text"
              name="proxmox_node"
              value={formData.proxmox_node}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., pve"
              required
            />
          </div>

          {/* Assign to User */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Assign to User
            </label>
            <select
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Creating VPS...
            </>
          ) : (
            <>
              <HiOutlinePlus className="w-5 h-5" />
              Create VPS
            </>
          )}
        </button>
      </form>
    </motion.div>
  )
}

export default CreateVPSForm
