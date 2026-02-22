import { useAuth } from '../../hooks/useAuth'
import { HiOutlineBell } from 'react-icons/hi'

const Navbar = () => {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-primary-500/20 glass-card backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Breadcrumb / Title */}
        <div>
          <h2 className="text-lg font-semibold text-white">
            Welcome back, {user?.username}
          </h2>
          <p className="text-sm text-gray-500">
            Manage your virtual private servers
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-primary-500/10 transition-colors">
            <HiOutlineBell className="w-6 h-6 text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>

          {/* User badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-300 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
