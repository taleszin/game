/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // HYLOMORPH Palette
        void: '#050505',
        'void-light': '#0a0a0a',
        'void-lighter': '#111111',
        
        // Primary - Ciano (Forma/Biologia)
        neon: {
          cyan: '#00ffff',
          'cyan-dim': '#00cccc',
          'cyan-glow': 'rgba(0, 255, 255, 0.5)',
        },
        
        // Secondary - Magenta (Mutação)
        neon: {
          magenta: '#ff00ff',
          'magenta-dim': '#cc00cc',
          'magenta-glow': 'rgba(255, 0, 255, 0.5)',
        },
        
        // Accent - Amarelo (Eletricidade)
        neon: {
          yellow: '#ffff00',
          'yellow-dim': '#cccc00',
          'yellow-glow': 'rgba(255, 255, 0, 0.5)',
        },
        
        // Status
        neon: {
          cyan: '#00ffff',
          magenta: '#ff00ff',
          yellow: '#ffff00',
          red: '#ff0000',
          green: '#00ff00',
          purple: '#9d00ff',
        },
        
        glitch: '#ff0000',
      },
      
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
        terminal: ['"VT323"', 'monospace'],
      },
      
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'glitch': 'glitch 0.3s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'typewriter': 'typewriter 2s steps(40) forwards',
        'blink': 'blink 1s step-end infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      
      keyframes: {
        pulseNeon: {
          '0%, 100%': { 
            opacity: '1',
            filter: 'brightness(1) drop-shadow(0 0 10px currentColor)',
          },
          '50%': { 
            opacity: '0.8',
            filter: 'brightness(1.2) drop-shadow(0 0 20px currentColor)',
          },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        typewriter: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor',
          },
          '50%': { 
            boxShadow: '0 0 20px currentColor, 0 0 40px currentColor',
          },
        },
      },
      
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)`,
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [],
}
