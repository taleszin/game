import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function TypewriterText({ text, className = '', speed = 50, delay = 0 }) {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      let currentIndex = 0
      
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(interval)
          setIsComplete(true)
        }
      }, speed)
      
      return () => clearInterval(interval)
    }, delay)
    
    return () => clearTimeout(startTimeout)
  }, [text, speed, delay])
  
  // Blinking cursor
  useEffect(() => {
    if (isComplete) {
      const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev)
      }, 500)
      return () => clearInterval(cursorInterval)
    }
  }, [isComplete])
  
  return (
    <motion.span 
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {displayedText}
      <span 
        className={`inline-block w-3 h-5 bg-current ml-1 align-middle transition-opacity ${
          showCursor ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </motion.span>
  )
}
