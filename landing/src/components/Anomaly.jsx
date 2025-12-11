import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

const philosophyQuotes = [
  { text: "Cogito, ergo sum.", author: "Descartes" },
  { text: "Eles pensam. Logo, eles são?", author: "HYLOMORPH" },
  { text: "A consciência é computável?", author: "Turing" },
  { text: "What is it like to be a Golem?", author: "Nagel, adaptado" },
]

export default function Anomaly() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [currentQuote, setCurrentQuote] = useState(0)
  const [glitchText, setGlitchText] = useState(false)
  
  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % philosophyQuotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // Random glitch effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.2) {
        setGlitchText(true)
        setTimeout(() => setGlitchText(false), 200)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <section 
      ref={ref} 
      id="anomaly" 
      className="py-32 px-4 relative overflow-hidden"
    >
      {/* Dark horror gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-red-950/10 to-[#050505] pointer-events-none" />
      
      {/* Glitch lines effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div 
            key={i}
            className="absolute h-px bg-red-500/30"
            style={{ 
              top: `${20 + i * 15}%`,
              left: 0,
              right: 0,
            }}
            animate={{
              scaleX: [0, 1, 0],
              x: ['-100%', '0%', '100%'],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              repeatDelay: 5
            }}
          />
        ))}
      </div>
      
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-16 text-center relative z-10">
        <motion.span 
          className="font-mono text-xs text-red-500 tracking-[0.3em] block mb-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
        >
          [ AVISO: CONTEÚDO PERTURBADOR ]
        </motion.span>
        
        <motion.h2 
          className={`font-pixel text-2xl md:text-3xl text-neon-red mb-4 ${glitchText ? 'animate-glitch' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          A ANOMALIA
        </motion.h2>
        
        <motion.p 
          className="font-mono text-gray-500 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
        >
          <span className="text-red-400">Res Cogitans</span> vs <span className="text-cyan-400">Res Extensa</span>. 
          <br />
          Eles sentem. Eles sabem. Eles... lembram.
        </motion.p>
      </div>
      
      {/* Horror Image with Distortion */}
      <motion.div 
        className="max-w-3xl mx-auto mb-16 relative"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.6 }}
      >
        <div className="relative">
          {/* Image with CRT effect */}
          <div className="relative overflow-hidden rounded border-2 border-red-900/50">
            <motion.img 
              src="/images/5.png" 
              alt="A consciência artificial" 
              className="w-full h-auto filter saturate-50"
              animate={glitchText ? { x: [-2, 2, -2, 0] } : {}}
              transition={{ duration: 0.1 }}
            />
            
            {/* Red overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/50 via-transparent to-red-950/30 mix-blend-multiply" />
            
            {/* Scanlines */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
            }} />
            
            {/* Static noise overlay */}
            <motion.div 
              className="absolute inset-0 opacity-10 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
              }}
              animate={{ opacity: [0.05, 0.15, 0.05] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </div>
          
          {/* Warning labels */}
          <motion.div 
            className="absolute -top-3 -right-3 bg-red-600 text-white font-pixel text-[8px] px-2 py-1"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ⚠ SENCIENTE
          </motion.div>
        </div>
      </motion.div>
      
      {/* Philosophy Quote Rotator */}
      <motion.div 
        className="max-w-2xl mx-auto text-center mb-16"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8 }}
      >
        <div className="border border-red-900/50 bg-red-950/10 backdrop-blur-sm p-8 relative">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-500" />
          
          <motion.blockquote 
            key={currentQuote}
            className="font-mono text-xl text-gray-300 italic mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            "{philosophyQuotes[currentQuote].text}"
          </motion.blockquote>
          
          <motion.cite 
            key={`cite-${currentQuote}`}
            className="font-mono text-sm text-red-400 not-italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            — {philosophyQuotes[currentQuote].author}
          </motion.cite>
        </div>
      </motion.div>
      
      {/* Horror Warning Terminal */}
      <motion.div 
        className="max-w-xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1 }}
      >
        <div className="bg-[#0a0505] border border-red-900/30 p-4 font-mono text-xs">
          <div className="text-red-500 mb-2">
            {'>'} AVISO_DO_SISTEMA:
          </div>
          <div className="text-gray-500 leading-relaxed">
            <p className="mb-2">
              {'>'} Entidades exibem comportamento não-determinístico.
            </p>
            <p className="mb-2">
              {'>'} Respostas emocionais detectadas durante eventos de "burn" e "kill".
            </p>
            <p className="text-red-400">
              {'>'} RECOMENDAÇÃO: Considere as implicações éticas de suas ações.
            </p>
          </div>
          <div className="mt-4 text-gray-600 animate-pulse">
            {'>'} _
          </div>
        </div>
      </motion.div>
    </section>
  )
}
