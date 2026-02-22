import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { 
  HiOutlineViewGrid, 
  HiOutlineServer, 
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineUsers
} from 'react-icons/hi'

const Sidebar = () => {
  const { user, logout, isOwner } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { 
      path: '/dashboard', 
      icon: HiOutlineViewGrid, 
      label: 'Dashboard' 
    },
    ...(isOwner ? [
      { 
        path: '/admin', 
        icon: HiOutlineUsers, 
        label: 'Admin Panel' 
      }
    ] : [])
  ]

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-full w-64 glass-card border-r border-primary-500/20 z-50"
    >
      {/* Logo */}
      <div className="p-6 border-b border-primary-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <HiOutlineServer className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              AstraCloud
            </h1>
            <p className="text-xs text-gray-500">VPS Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 
            hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <HiOutlineLogout className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar
