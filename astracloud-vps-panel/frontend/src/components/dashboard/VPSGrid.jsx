import { motion } from 'framer-motion'
import VPSCard from './VPSCard'
import { HiOutlineServer } from 'react-icons/hi'

const VPSGrid = ({ vpsList }) => {
  if (vpsList.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-12 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-primary-500/10 flex items-center justify-center mb-4">
          <HiOutlineServer className="w-8 h-8 text-primary-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No VPS Found</h3>
        <p className="text-gray-500">
          You don't have any VPS assigned to your account yet.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vpsList.map((vps, index) => (
        <VPSCard key={vps.id} vps={vps} index={index} />
      ))}
    </div>
  )
}

export default VPSGrid
