import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AnimatedBackground from './AnimatedBackground'

const Layout = () => {
  return (
    <div className="min-h-screen flex">
      {/* Animated background */}
      <AnimatedBackground />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default Layout
