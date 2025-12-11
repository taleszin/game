import { motion } from 'framer-motion'

const systemInfo = [
  { label: 'VERSÃO', value: 'v1.0.0-alpha' },
  { label: 'ENGINE', value: 'Phaser 3.90.0' },
  { label: 'RENDERER', value: 'WebGL' },
  { label: 'ÁUDIO', value: 'Web Audio API' },
]

const links = [
  { label: 'GitHub', href: 'https://github.com', icon: '◈' },
  { label: 'Documentação', href: '#docs', icon: '◇' },
  { label: 'GDD', href: '#gdd', icon: '◆' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="relative py-16 px-4 border-t border-gray-900 bg-[#030303]">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top Section */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Description */}
          <div>
            <motion.h3 
              className="font-pixel text-lg text-neon-cyan mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              HYLOMORPH
            </motion.h3>
            <p className="font-mono text-sm text-gray-500 leading-relaxed mb-4">
              Simulador de Vida Artificial. 
              Onde Geometria encontra Biologia e Filosofia.
            </p>
            <div className="flex gap-4">
              {links.map(link => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="font-mono text-xs text-gray-600 hover:text-cyan-400 transition-colors flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-cyan-500">{link.icon}</span>
                  {link.label}
                </motion.a>
              ))}
            </div>
          </div>
          
          {/* System Info */}
          <div>
            <h4 className="font-mono text-xs text-gray-500 mb-4 tracking-wider">
              DADOS DO SISTEMA
            </h4>
            <div className="space-y-2">
              {systemInfo.map(info => (
                <div key={info.label} className="flex justify-between font-mono text-xs">
                  <span className="text-gray-600">{info.label}:</span>
                  <span className="text-cyan-400">{info.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Terminal Status */}
          <div>
            <h4 className="font-mono text-xs text-gray-500 mb-4 tracking-wider">
              STATUS DO TERMINAL
            </h4>
            <div className="bg-[#0a0a0a] border border-gray-800 p-3 font-mono text-xs">
              <div className="text-green-400 mb-1">● Sistema Online</div>
              <div className="text-gray-600 mb-1">
                PID: {Math.floor(Math.random() * 9999).toString().padStart(4, '0')}
              </div>
              <div className="text-gray-600 mb-1">
                Uptime: {Math.floor(Math.random() * 999)}h {Math.floor(Math.random() * 59)}m
              </div>
              <div className="text-gray-600">
                Entidades: {Math.floor(Math.random() * 50) + 10} ativas
              </div>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-900 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="font-mono text-xs text-gray-700">
              <span className="text-gray-600">©</span> {currentYear} HYLOMORPH // 
              <span className="text-cyan-600"> "A forma dá ser à matéria"</span>
            </div>
            
            {/* ASCII Art */}
            <div className="font-mono text-[10px] text-gray-800 hidden md:block">
              {'╔══════════════════════════════════╗'}
              <br />
              {'║  ▲ GEOMETRY ◯ CHEMISTRY □ SOUL  ║'}
              <br />
              {'╚══════════════════════════════════╝'}
            </div>
            
            {/* Version Badge */}
            <motion.div 
              className="flex items-center gap-2 px-3 py-1 border border-gray-800 bg-gray-900/50"
              whileHover={{ borderColor: '#00ffff' }}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-mono text-xs text-gray-500">BUILD: STABLE</span>
            </motion.div>
          </div>
        </div>
        
        {/* Bottom Terminal Line */}
        <motion.div 
          className="mt-8 font-mono text-xs text-gray-800 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {'>'} HYLOMORPH_SYSTEM:// END_OF_TRANSMISSION
          <span className="animate-pulse">_</span>
        </motion.div>
      </div>
    </footer>
  )
}
