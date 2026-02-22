import { useEffect, useRef } from 'react'

const AnimatedBackground = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create particles
    const particleCount = 50
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`
      
      // Random size
      const size = Math.random() * 4 + 2
      particle.style.width = `${size}px`
      particle.style.height = `${size}px`
      
      // Random animation delay
      particle.style.animationDelay = `${Math.random() * 6}s`
      particle.style.animationDuration = `${Math.random() * 4 + 4}s`
      
      // Random opacity
      particle.style.opacity = `${Math.random() * 0.5 + 0.2}`
      
      container.appendChild(particle)
      particles.push(particle)
    }

    // Cleanup
    return () => {
      particles.forEach(p => p.remove())
    }
  }, [])

  return (
    <>
      {/* Gradient background */}
      <div className="fixed inset-0 animated-gradient z-0" />
      
      {/* Particles */}
      <div ref={containerRef} className="particles-container" />
      
      {/* Overlay for better readability */}
      <div className="fixed inset-0 bg-dark-300/30 z-0" />
    </>
  )
}

export default AnimatedBackground
