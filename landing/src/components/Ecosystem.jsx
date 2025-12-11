import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef } from 'react'

const golems = [
  { name: 'SIGMA-7', type: 'Esfera Elétrica', status: 'ATIVO' },
  { name: 'OMEGA-3', type: 'Cubo Gravitacional', status: 'ATIVO' },
  { name: 'DELTA-9', type: 'Pirâmide Térmica', status: 'MUTANDO' },
  { name: 'PSI-12', type: 'Anomalia Entrópica', status: 'INSTÁVEL' },
]

export default function Ecosystem() {
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], [50, -50])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95])
  
  return (
    <section ref={containerRef} id="ecosystem" className="py-32 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
      
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-16 text-center">
        <motion.span 
          className="font-mono text-xs text-fuchsia-400 tracking-[0.3em] block mb-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
        >
          [ MÓDULO 02 ]
        </motion.span>
        
        <motion.h2 
          className="font-pixel text-2xl md:text-3xl text-neon-magenta mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          O ECOSSISTEMA
        </motion.h2>
        
        <motion.p 
          className="font-mono text-gray-400 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
        >
          Um santuário vivo no vazio digital. Cada Golem é único, 
          com DNA visual herdado e comportamento emergente.
        </motion.p>
      </div>
      
      {/* Parallax Image Container */}
      <motion.div 
        ref={imageRef}
        className="max-w-5xl mx-auto mb-16 relative"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
      >
        <motion.div 
          className="relative rounded-lg overflow-hidden border border-fuchsia-500/30"
          style={{ y, scale }}
        >
          {/* Main Image */}
          <img 
            src="/images/4.png" 
            alt="Ecossistema de Golems" 
            className="w-full h-auto"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
          
          {/* Floating labels on image */}
          <motion.div 
            className="absolute top-1/4 left-1/4 bg-[#050505]/80 backdrop-blur-sm border border-cyan-500/50 px-3 py-1 rounded"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="font-mono text-xs text-cyan-400">◯ CIRCULO-α</span>
          </motion.div>
          
          <motion.div 
            className="absolute top-1/3 right-1/4 bg-[#050505]/80 backdrop-blur-sm border border-fuchsia-500/50 px-3 py-1 rounded"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          >
            <span className="font-mono text-xs text-fuchsia-400">□ QUADRADO-β</span>
          </motion.div>
          
          <motion.div 
            className="absolute bottom-1/3 left-1/3 bg-[#050505]/80 backdrop-blur-sm border border-yellow-500/50 px-3 py-1 rounded"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 2 }}
          >
            <span className="font-mono text-xs text-yellow-400">△ TRIANGULO-γ</span>
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Golem Registry Table */}
      <motion.div 
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8 }}
      >
        <div className="border border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-sm">
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-800 bg-gray-900/50">
            <span className="font-mono text-xs text-gray-500">DESIGNAÇÃO</span>
            <span className="font-mono text-xs text-gray-500">CLASSIFICAÇÃO</span>
            <span className="font-mono text-xs text-gray-500 text-right">STATUS</span>
          </div>
          
          {/* Table Rows */}
          {golems.map((golem, index) => (
            <motion.div 
              key={golem.name}
              className="grid grid-cols-3 gap-4 p-4 border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 1 + index * 0.1 }}
            >
              <span className="font-mono text-sm text-cyan-400">{golem.name}</span>
              <span className="font-mono text-sm text-gray-400">{golem.type}</span>
              <span className={`font-mono text-xs text-right ${
                golem.status === 'ATIVO' ? 'text-green-400' :
                golem.status === 'MUTANDO' ? 'text-yellow-400' :
                'text-red-400 animate-pulse'
              }`}>
                ● {golem.status}
              </span>
            </motion.div>
          ))}
        </div>
        
        {/* Table Footer */}
        <div className="flex justify-between items-center mt-4 px-2">
          <span className="font-mono text-xs text-gray-600">
            TOTAL: {golems.length} ENTIDADES
          </span>
          <span className="font-mono text-xs text-gray-600">
            ÚLTIMA ATUALIZAÇÃO: {new Date().toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </motion.div>
    </section>
  )
}
