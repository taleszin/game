/**
 * ═══════════════════════════════════════════════════════════════════
 * UI SOUND SYSTEM - Procedural Audio Engine
 * Sons de UI gerados em tempo real usando Web Audio API
 * Estilo: Terminal Sci-Fi / Retro Tech (Star Trek, Evangelion)
 * ═══════════════════════════════════════════════════════════════════
 */

class UISoundSystemClass {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        this.masterVolume = 0.15;
        
        // Cooldowns para evitar spam de sons
        this.lastHoverTime = 0;
        this.hoverCooldown = 50; // ms entre hovers
        
        // Cache de frequências por tipo de elemento
        this.frequencyMap = {
            'forma': { hover: [900, 1100], click: [500, 300] },
            'quimica': { hover: [800, 1000], click: [450, 280] },
            'fisica': { hover: [1000, 1200], click: [550, 320] },
            'default': { hover: [850, 1050], click: [480, 300] }
        };
    }
    
    /**
     * Inicializa o AudioContext (deve ser chamado após interação do usuário)
     */
    init() {
        if (this.audioContext) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Master gain para controle de volume global
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('[UISoundSystem] Inicializado com sucesso');
        } catch (e) {
            console.warn('[UISoundSystem] Web Audio API não disponível:', e);
            this.enabled = false;
        }
    }
    
    /**
     * Garante que o AudioContext está pronto para uso
     */
    ensureContext() {
        if (!this.audioContext) {
            this.init();
        }
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        return this.audioContext && this.enabled;
    }
    
    /**
     * Som de HOVER - Bip digital sutil de escaneamento
     * Onda sine/triangle, frequência alta, muito curto
     * @param {string} category - Categoria do elemento (forma, quimica, fisica)
     */
    playHover(category = 'default') {
        if (!this.ensureContext()) return;
        
        // Cooldown para evitar spam
        const now = performance.now();
        if (now - this.lastHoverTime < this.hoverCooldown) return;
        this.lastHoverTime = now;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Frequências baseadas na categoria
        const freqs = this.frequencyMap[category] || this.frequencyMap.default;
        const [startFreq, endFreq] = freqs.hover;
        
        // ═══ OSCILADOR PRINCIPAL (Sine suave) ═══
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, currentTime + 0.04);
        
        // ═══ ENVELOPE DE AMPLITUDE (muito curto) ═══
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.linearRampToValueAtTime(0.08, currentTime + 0.008); // Attack rápido
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05); // Decay rápido
        
        // ═══ SEGUNDO HARMÔNICO (adiciona brilho) ═══
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(startFreq * 2, currentTime);
        osc2.frequency.exponentialRampToValueAtTime(endFreq * 2, currentTime + 0.04);
        
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, currentTime);
        gain2.gain.linearRampToValueAtTime(0.03, currentTime + 0.005);
        gain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.04);
        
        // Conexões
        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(this.masterGain);
        gain2.connect(this.masterGain);
        
        // Play
        osc.start(currentTime);
        osc2.start(currentTime);
        osc.stop(currentTime + 0.06);
        osc2.stop(currentTime + 0.05);
    }
    
    /**
     * Som de CLICK - Confirmação percussiva de terminal
     * Onda square com decay, frequência média descendente
     * @param {string} type - Tipo de clique ('confirm', 'cancel', 'special')
     */
    playClick(type = 'confirm') {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Configurações por tipo
        const configs = {
            confirm: { startFreq: 480, endFreq: 300, duration: 0.08, volume: 0.12 },
            cancel: { startFreq: 300, endFreq: 180, duration: 0.1, volume: 0.1 },
            special: { startFreq: 600, endFreq: 400, duration: 0.12, volume: 0.15 },
            synthesize: { startFreq: 800, endFreq: 500, duration: 0.15, volume: 0.18 }
        };
        
        const config = configs[type] || configs.confirm;
        
        // ═══ OSCILADOR PRINCIPAL (Square percussivo) ═══
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(config.startFreq, currentTime);
        osc.frequency.exponentialRampToValueAtTime(config.endFreq, currentTime + config.duration * 0.7);
        
        // ═══ ENVELOPE PERCUSSIVO ═══
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.linearRampToValueAtTime(config.volume, currentTime + 0.005); // Attack instantâneo
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + config.duration);
        
        // ═══ CLICK TRANSIENTE (adiciona "punch") ═══
        const noise = ctx.createOscillator();
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(config.startFreq * 1.5, currentTime);
        noise.frequency.exponentialRampToValueAtTime(50, currentTime + 0.02);
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(config.volume * 0.3, currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.02);
        
        // ═══ FILTRO LOW-PASS (suaviza o square) ═══
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, currentTime);
        filter.frequency.exponentialRampToValueAtTime(500, currentTime + config.duration);
        filter.Q.value = 1;
        
        // Conexões
        osc.connect(filter);
        filter.connect(gain);
        noise.connect(noiseGain);
        gain.connect(this.masterGain);
        noiseGain.connect(this.masterGain);
        
        // Play
        osc.start(currentTime);
        noise.start(currentTime);
        osc.stop(currentTime + config.duration + 0.01);
        noise.stop(currentTime + 0.03);
    }
    
    /**
     * Som de OPEN - Abertura de painel/modal
     * Sweep ascendente com reverb simulado
     */
    playOpen() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Sweep ascendente
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, currentTime + 0.12);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.linearRampToValueAtTime(0.1, currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
        
        // Harmônico de brilho
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(400, currentTime + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(1200, currentTime + 0.12);
        
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, currentTime + 0.05);
        gain2.gain.linearRampToValueAtTime(0.05, currentTime + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.18);
        
        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(this.masterGain);
        gain2.connect(this.masterGain);
        
        osc.start(currentTime);
        osc2.start(currentTime + 0.05);
        osc.stop(currentTime + 0.2);
        osc2.stop(currentTime + 0.2);
    }
    
    /**
     * Som de CLOSE - Fechamento de painel/modal
     * Sweep descendente
     */
    playClose() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, currentTime + 0.1);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(currentTime);
        osc.stop(currentTime + 0.15);
    }
    
    /**
     * Som de SELECT - Seleção de item
     * Dois tons em sequência rápida (confirmação)
     */
    playSelect() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Primeiro tom
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 523.25; // C5
        
        const gain1 = ctx.createGain();
        gain1.gain.setValueAtTime(0, currentTime);
        gain1.gain.linearRampToValueAtTime(0.1, currentTime + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.06);
        
        // Segundo tom (mais alto)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 659.25; // E5
        
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, currentTime + 0.04);
        gain2.gain.linearRampToValueAtTime(0.1, currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.12);
        
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(this.masterGain);
        gain2.connect(this.masterGain);
        
        osc1.start(currentTime);
        osc2.start(currentTime + 0.04);
        osc1.stop(currentTime + 0.08);
        osc2.stop(currentTime + 0.15);
    }
    
    /**
     * Som de DESELECT - Deseleção de item
     * Tom descendente rápido
     */
    playDeselect() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, currentTime + 0.06);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(currentTime);
        osc.stop(currentTime + 0.1);
    }
    
    /**
     * Som de ERROR/WARNING
     * Dois tons dissonantes
     */
    playError() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Tom base
        const osc1 = ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.value = 200;
        
        // Tom dissonante (tritone)
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = 283; // Tritone de 200Hz
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.linearRampToValueAtTime(0.08, currentTime + 0.01);
        gain.gain.setValueAtTime(0.08, currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, currentTime + 0.06);
        gain.gain.linearRampToValueAtTime(0.08, currentTime + 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc1.start(currentTime);
        osc2.start(currentTime);
        osc1.stop(currentTime + 0.18);
        osc2.stop(currentTime + 0.18);
    }
    
    /**
     * Som de DATA SCAN - Para tooltips informativos
     * Série rápida de bips (como modem/scanner)
     */
    playDataScan() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // Série de 3 bips rápidos
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 1200 + (i * 200);
            
            const gain = ctx.createGain();
            const startTime = currentTime + (i * 0.025);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.04, startTime + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.02);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.025);
        }
    }
    
    /**
     * Define o volume master
     * @param {number} volume - 0 a 1
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    /**
     * Ativa/desativa o sistema de som
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Singleton export
export const UISoundSystem = new UISoundSystemClass();
export default UISoundSystem;
