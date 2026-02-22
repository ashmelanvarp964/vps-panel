import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { vpsApi, usersApi, brandingApi } from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CreateVPSForm from '../components/admin/CreateVPSForm'
import UserManagement from '../components/admin/UserManagement'
import BrandingSettings from '../components/admin/BrandingSettings'
import { HiOutlineServer, HiOutlineUsers, HiOutlineColorSwatch } from 'react-icons/hi'

const tabs = [
  { id: 'vps', label: 'Create VPS', icon: HiOutlineServer },
  { id: 'users', label: 'Users', icon: HiOutlineUsers },
  { id: 'branding', label: 'Branding', icon: HiOutlineColorSwatch }
]

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('vps')
  const [users, setUsers] = useState([])
  const [branding, setBranding] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [usersRes, brandingRes] = await Promise.all([
          usersApi.getAll(),
          brandingApi.get()
        ])
        setUsers(usersRes.data.users || [])
        setBranding(brandingRes.data.branding)
      } catch (err) {
        console.error('Failed to fetch admin data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleVPSCreated = () => {
    // Optionally refresh data or show success message
  }

  const handleBrandingUpdate = async (data) => {
    try {
      const response = await brandingApi.update(data)
      setBranding(response.data.branding)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update branding' }
    }
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
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-gray-500">Manage VPS instances, users, and settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-primary-500/20 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'vps' && (
          <CreateVPSForm users={users} onCreated={handleVPSCreated} />
        )}
        {activeTab === 'users' && (
          <UserManagement users={users} setUsers={setUsers} />
        )}
        {activeTab === 'branding' && (
          <BrandingSettings branding={branding} onUpdate={handleBrandingUpdate} />
        )}
      </motion.div>
    </div>
  )
}

export default AdminPage
