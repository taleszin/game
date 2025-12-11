import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function GlitchText({ text, className = '' }) {
  const [isGlitching, setIsGlitching] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        setIsGlitching(true)
        setTimeout(() => setIsGlitching(false), 150)
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <motion.span 
      className={`glitch relative inline-block ${className} ${isGlitching ? 'animate-glitch' : ''}`}
      data-text={text}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {text}
    </motion.span>
  )
}
