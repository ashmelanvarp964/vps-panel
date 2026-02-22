import { useState } from 'react'
import { motion } from 'framer-motion'
import { usersApi } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import { HiOutlineUser, HiOutlineTrash, HiOutlineServer } from 'react-icons/hi'

const UserManagement = ({ users, setUsers }) => {
  const [selectedUser, setSelectedUser] = useState(null)
  const [userVPS, setUserVPS] = useState([])
  const [loadingVPS, setLoadingVPS] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const handleUserClick = async (user) => {
    setSelectedUser(user)
    setLoadingVPS(true)
    try {
      const response = await usersApi.getVPS(user.id)
      setUserVPS(response.data.vps || [])
    } catch (err) {
      console.error('Failed to fetch user VPS:', err)
      setUserVPS([])
    } finally {
      setLoadingVPS(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    
    setDeleting(userId)
    try {
      await usersApi.delete(userId)
      setUsers(users.filter(u => u.id !== userId))
      if (selectedUser?.id === userId) {
        setSelectedUser(null)
        setUserVPS([])
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Users list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <HiOutlineUser className="w-6 h-6 text-primary-400" />
          Users ({users.length})
        </h2>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                selectedUser?.id === user.id
                  ? 'bg-primary-500/20 border border-primary-500/30'
                  : 'bg-dark-200/50 hover:bg-dark-200'
              }`}
              onClick={() => handleUserClick(user)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  user.role === 'owner'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.role}
                </span>
                {user.role !== 'owner' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteUser(user.id)
                    }}
                    disabled={deleting === user.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    {deleting === user.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <HiOutlineTrash className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {users.length === 0 && (
            <p className="text-center text-gray-500 py-8">No users found</p>
          )}
        </div>
      </motion.div>

      {/* User details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6"
      >
        {selectedUser ? (
          <>
            <h2 className="text-xl font-bold text-white mb-4">
              {selectedUser.username}'s VPS
            </h2>

            {loadingVPS ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : userVPS.length > 0 ? (
              <div className="space-y-3">
                {userVPS.map((vps) => (
                  <div
                    key={vps.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-dark-200/50"
                  >
                    <div className="flex items-center gap-3">
                      <HiOutlineServer className="w-5 h-5 text-primary-400" />
                      <div>
                        <p className="text-white">{vps.name}</p>
                        <p className="text-sm text-gray-500">{vps.ip_address}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vps.status === 'running' ? 'bg-green-500/20 text-green-400' :
                      vps.status === 'stopped' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {vps.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No VPS assigned to this user
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-primary-500/10">
              <p className="text-sm text-gray-500">
                Member since: {new Date(selectedUser.created_at).toLocaleDateString()}
              </p>
              {selectedUser.last_login && (
                <p className="text-sm text-gray-500">
                  Last login: {new Date(selectedUser.last_login).toLocaleString()}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Select a user to view details
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default UserManagement
