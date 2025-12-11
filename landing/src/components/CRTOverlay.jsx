import { useEffect, useState } from 'react'

export default function CRTOverlay() {
  const [glitch, setGlitch] = useState(false)
  
  // Random glitch effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.05) {
        setGlitch(true)
        setTimeout(() => setGlitch(false), 100 + Math.random() * 200)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <>
      {/* Scanlines */}
      <div className="crt-overlay" />
      
      {/* Moving scanline */}
      <div className="scanline-move" />
      
      {/* Occasional glitch flash */}
      {glitch && (
        <div 
          className="fixed inset-0 pointer-events-none z-[9999] mix-blend-overlay"
          style={{
            background: `linear-gradient(${Math.random() * 360}deg, 
              rgba(255, 0, 0, 0.1), 
              rgba(0, 255, 255, 0.1), 
              transparent)`,
          }}
        />
      )}
    </>
  )
}
