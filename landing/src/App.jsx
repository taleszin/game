import { motion, useScroll, useTransform } from 'framer-motion'
import Hero from './components/Hero'
import SynthesisStation from './components/SynthesisStation'
import Ecosystem from './components/Ecosystem'
import Anomaly from './components/Anomaly'
import Footer from './components/Footer'
import CRTOverlay from './components/CRTOverlay'
import FloatingShapes from './components/FloatingShapes'

function App() {
  const { scrollYProgress } = useScroll()
  
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 relative overflow-hidden">
      {/* CRT Scanline Effect */}
      <CRTOverlay />
      
      {/* Floating Background Shapes */}
      <FloatingShapes />
      
      {/* Grid Background */}
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      
      {/* Main Content */}
      <main className="relative z-10">
        <Hero />
        <SynthesisStation />
        <Ecosystem />
        <Anomaly />
      </main>
      
      <Footer />
      
      {/* Scroll Progress Indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-400 origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
    </div>
  )
}

export default App
