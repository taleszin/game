import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import GlitchText from './GlitchText'
import TypewriterText from './TypewriterText'

export default function Hero() {
  const [showSubtitle, setShowSubtitle] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setShowSubtitle(true), 2000)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="/images/2.png" 
          alt="HYLOMORPH Background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        
        {/* System Status Badge */}
        <motion.div 
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 border border-cyan-500/30 bg-cyan-500/5 rounded-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="font-mono text-xs text-cyan-400 tracking-wider">
            SISTEMA v1.0.0 // STATUS: ONLINE
          </span>
        </motion.div>
        
        {/* Main Headline */}
        <motion.h1 
          className="font-pixel text-3xl md:text-5xl lg:text-6xl mb-6 leading-tight"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <GlitchText text="A FORMA DÁ" className="text-neon-cyan block mb-2" />
          <GlitchText text="SER À MATÉRIA." className="text-neon-magenta block" />
        </motion.h1>
        
        {/* Subtitle with Typewriter */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: showSubtitle ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {showSubtitle && (
            <TypewriterText 
              text="Simule vida. Desafie a entropia. O Hylomorfismo espera por você."
              className="font-mono text-lg md:text-xl text-gray-400"
              speed={30}
            />
          )}
        </motion.div>
        
        {/* Aristotle Quote */}
        <motion.blockquote 
          className="mb-12 font-mono text-sm text-gray-500 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
        >
          "οὐσία = ὕλη + μορφή" — Aristóteles, Metafísica
        </motion.blockquote>
        
        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.a
            href="#play"
            className="btn-hardware text-cyan-400"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚡ INICIAR EXPERIMENTO
          </motion.a>
          
          <motion.a
            href="#learn"
            className="font-pixel text-xs text-gray-500 hover:text-cyan-400 transition-colors px-6 py-3 border border-gray-700 hover:border-cyan-400"
            whileHover={{ scale: 1.02 }}
          >
            📖 DOCUMENTAÇÃO
          </motion.a>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ 
            opacity: { delay: 3 },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs text-gray-600">SCROLL</span>
            <div className="w-px h-8 bg-gradient-to-b from-cyan-400 to-transparent" />
          </div>
        </motion.div>
      </div>
      
      {/* Corner Decorations */}
      <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-cyan-500/30" />
      <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-cyan-500/30" />
      <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-magenta-500/30 border-fuchsia-500/30" />
      <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-fuchsia-500/30" />
    </section>
  )
}
