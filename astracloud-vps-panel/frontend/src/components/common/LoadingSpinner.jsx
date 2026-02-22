const sizes = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4'
}

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  return (
    <div className={`spinner ${sizes[size]} ${className}`} />
  )
}

export default LoadingSpinner
