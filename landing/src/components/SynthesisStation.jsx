import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const elements = [
  { 
    id: 'forma', 
    name: 'GEOMETRIA', 
    icon: '◯ □ △',
    desc: 'Círculo, Quadrado, Triângulo, Pentágono, Hexágono, Losango, Estrela, Espiral...',
    color: 'cyan'
  },
  { 
    id: 'quimica', 
    name: 'QUÍMICA', 
    icon: '⬡',
    desc: 'Carbono, Ferro, Ouro, Cristal, Mercúrio, Bismuto, Silício...',
    color: 'fuchsia'
  },
  { 
    id: 'fisica', 
    name: 'FÍSICA', 
    icon: '⚡',
    desc: 'Eletricidade, Calor, Gravidade, Luz, Frio, Radiação, Entropia, Sônico...',
    color: 'yellow'
  },
]

export default function SynthesisStation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <section ref={ref} id="synthesis" className="py-32 px-4 relative">
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-16 text-center">
        <motion.span 
          className="font-mono text-xs text-cyan-400 tracking-[0.3em] block mb-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          [ MÓDULO 01 ]
        </motion.span>
        
        <motion.h2 
          className="font-pixel text-2xl md:text-3xl text-neon-cyan mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          ESTAÇÃO DE SÍNTESE
        </motion.h2>
        
        <motion.p 
          className="font-mono text-gray-400 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Engenharia Genética Geométrica. Misture Forma, Química e Física 
          para criar entidades únicas no vazio digital.
        </motion.p>
      </div>
      
      {/* Monitor Frame with Screenshot */}
      <motion.div 
        className="max-w-4xl mx-auto mb-20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="monitor-frame">
          {/* Monitor Top Bar */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-800">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="font-mono text-xs text-gray-600 ml-4">
              HYLOMORPH://synthesis_station.exe
            </span>
          </div>
          
          {/* Screen Content */}
          <div className="monitor-screen aspect-video relative">
            <img 
              src="/images/3.png" 
              alt="Estação de Síntese" 
              className="w-full h-full object-cover"
            />
            
            {/* Animated overlay elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60" />
          </div>
          
          {/* Monitor Bottom Status */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800">
            <span className="font-mono text-xs text-green-400">● REACTOR ONLINE</span>
            <span className="font-mono text-xs text-gray-600">MEM: 42.7% | CPU: 23.1%</span>
          </div>
        </div>
      </motion.div>
      
      {/* Element Cards */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        {elements.map((elem, index) => (
          <motion.div
            key={elem.id}
            className={`
              relative p-6 border-2 bg-[#0a0a0a]/80 backdrop-blur-sm
              ${elem.color === 'cyan' ? 'border-cyan-500/50 hover:border-cyan-400' : ''}
              ${elem.color === 'fuchsia' ? 'border-fuchsia-500/50 hover:border-fuchsia-400' : ''}
              ${elem.color === 'yellow' ? 'border-yellow-500/50 hover:border-yellow-400' : ''}
              transition-all duration-300 group
            `}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            {/* Corner accent */}
            <div className={`
              absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2
              ${elem.color === 'cyan' ? 'border-cyan-400' : ''}
              ${elem.color === 'fuchsia' ? 'border-fuchsia-400' : ''}
              ${elem.color === 'yellow' ? 'border-yellow-400' : ''}
            `} />
            
            {/* Icon */}
            <div className={`
              text-3xl mb-4 font-mono
              ${elem.color === 'cyan' ? 'text-cyan-400' : ''}
              ${elem.color === 'fuchsia' ? 'text-fuchsia-400' : ''}
              ${elem.color === 'yellow' ? 'text-yellow-400' : ''}
            `}>
              {elem.icon}
            </div>
            
            {/* Title */}
            <h3 className="font-pixel text-sm text-white mb-2">{elem.name}</h3>
            
            {/* Description */}
            <p className="font-mono text-xs text-gray-500 leading-relaxed">
              {elem.desc}
            </p>
            
            {/* Hover glow effect */}
            <div className={`
              absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
              ${elem.color === 'cyan' ? 'bg-cyan-500/5' : ''}
              ${elem.color === 'fuchsia' ? 'bg-fuchsia-500/5' : ''}
              ${elem.color === 'yellow' ? 'bg-yellow-500/5' : ''}
            `} />
          </motion.div>
        ))}
      </div>
      
      {/* Formula Display */}
      <motion.div 
        className="max-w-2xl mx-auto mt-16 text-center"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <div className="font-mono text-lg text-gray-600">
          <span className="text-cyan-400">[FORMA]</span>
          {' + '}
          <span className="text-fuchsia-400">[QUÍMICA]</span>
          {' + '}
          <span className="text-yellow-400">[FÍSICA]</span>
          {' = '}
          <span className="text-white animate-pulse">GOLEM</span>
        </div>
      </motion.div>
    </section>
  )
}
