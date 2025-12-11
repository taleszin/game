import { motion } from 'framer-motion'

const shapes = [
  { type: 'circle', color: '#00ffff', size: 60, x: '10%', y: '20%', delay: 0 },
  { type: 'square', color: '#ff00ff', size: 40, x: '85%', y: '15%', delay: 1 },
  { type: 'triangle', color: '#ffff00', size: 50, x: '75%', y: '70%', delay: 2 },
  { type: 'circle', color: '#ff00ff', size: 30, x: '5%', y: '80%', delay: 0.5 },
  { type: 'square', color: '#00ffff', size: 25, x: '90%', y: '45%', delay: 1.5 },
  { type: 'hexagon', color: '#00ff00', size: 45, x: '15%', y: '55%', delay: 2.5 },
]

function Shape({ type, color, size }) {
  if (type === 'circle') {
    return (
      <div 
        className="rounded-full border-2"
        style={{ 
          width: size, 
          height: size, 
          borderColor: color,
          boxShadow: `0 0 20px ${color}, inset 0 0 10px ${color}40`
        }}
      />
    )
  }
  
  if (type === 'square') {
    return (
      <div 
        className="border-2"
        style={{ 
          width: size, 
          height: size, 
          borderColor: color,
          boxShadow: `0 0 20px ${color}, inset 0 0 10px ${color}40`
        }}
      />
    )
  }
  
  if (type === 'triangle') {
    return (
      <div 
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size/2}px solid transparent`,
          borderRight: `${size/2}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
          filter: `drop-shadow(0 0 15px ${color})`
        }}
      />
    )
  }
  
  if (type === 'hexagon') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon 
          points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" 
          fill="none" 
          stroke={color} 
          strokeWidth="3"
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
    )
  }
  
  return null
}

export default function FloatingShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: shape.x, top: shape.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: 1,
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 8,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Shape {...shape} />
        </motion.div>
      ))}
    </div>
  )
}
