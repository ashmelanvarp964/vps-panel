import { motion } from 'framer-motion'
import RegisterForm from '../components/auth/RegisterForm'
import AnimatedBackground from '../components/common/AnimatedBackground'
import { HiOutlineServer } from 'react-icons/hi'

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Background */}
      <AnimatedBackground />

      {/* Register card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-card p-8 relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-4"
          >
            <HiOutlineServer className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-500">Join AstraCloud and manage your servers</p>
        </div>

        {/* Form */}
        <RegisterForm />
      </motion.div>
    </div>
  )
}

export default RegisterPage
