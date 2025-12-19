/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HYLOMORPH - START SCENE (Retro Console Style)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sequência estilo Super Mario 3 / Bomberman:
 * 1. "Power Off" - Tela preta com botão "INITIALIZE SYSTEM"
 * 2. "Attract Mode" - Vídeo + Logo + "PRESS START" piscando
 * 3. "Menu Mode" - Opções aparecem no lugar do PRESS START (sem transição)
 */

// Resoluções disponíveis
const RESOLUTION_PRESETS = [
    { id: 'auto', label: 'AUTO', width: 0, height: 0, desc: 'Detecta automaticamente' },
    { id: '800x600', label: '800×600', width: 800, height: 600, desc: '4:3 (Clássico)' },
    { id: '1024x768', label: '1024×768', width: 1024, height: 768, desc: '4:3 (XGA)' },
    { id: '1280x720', label: '1280×720', width: 1280, height: 720, desc: '16:9 (HD)' },
    { id: '1366x768', label: '1366×768', width: 1366, height: 768, desc: '16:9 (Laptop)' },
    { id: '1920x1080', label: '1920×1080', width: 1920, height: 1080, desc: '16:9 (Full HD)' }
];

export class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
        
        // Estado da cena
        this.state = 'boot'; // 'boot' | 'loading' | 'attract' | 'menu'
        this.isTransitioning = false;
        
        // Loading state
        this.loadingProgress = 0;
        this.loadingTasks = [];
        this.currentTaskIndex = 0;
        
        // Menu state
        this.selectedIndex = 0;
        this.menuOptions = [];
        this.hasSaveData = false;
        
        // Settings state
        this.settingsOpen = false;
        this.currentResolution = 'auto';
        
        // Elementos DOM
        this.videoElement = null;
        this.audioElement = null;
        this.bootOverlay = null;
        this.loadingOverlay = null;
        this.gameOverlay = null;
        this.settingsModal = null;
        this.styleElement = null;
        this.particleCanvas = null;
        this.particleCtx = null;
        this.particles = [];
        this.particleAnimationId = null;
        
        // Bind handlers
        this._handlePowerOn = this._handlePowerOn.bind(this);
        this._handleKeydown = this._handleKeydown.bind(this);
        this._handleClick = this._handleClick.bind(this);
    }
    
    preload() {
        // Carrega configurações salvas
        this._loadSettings();
    }
    
    create() {
        // Verifica se existe save
        this.hasSaveData = !!localStorage.getItem('hylomorph_data');
        
        // Define opções do menu
        this.menuOptions = [
            { id: 'continue', label: 'CONTINUAR', enabled: this.hasSaveData },
            { id: 'new', label: 'NOVO EXPERIMENTO', enabled: true },
            { id: 'settings', label: 'CONFIGURAÇÕES', enabled: true }
        ];
        
        // Seleciona primeira opção habilitada
        this.selectedIndex = this.hasSaveData ? 0 : 1;
        
        this._injectStyles();
        this._createVideo();
        this._createParticleCanvas();
        this._createAudio();
        this._createBootOverlay();
        this._createLoadingOverlay();
        this._createSettingsModal();
        this._createGameOverlay();
        
        // Define tarefas de carregamento
        this._defineLoadingTasks();
        
        console.log('[StartScene] Sistema em standby. Aguardando power on...');
    }
    
    /**
     * Injeta CSS necessário para as animações
     */
    _injectStyles() {
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'start-scene-styles';
        this.styleElement.textContent = `
            /* ═══ ANIMAÇÕES RETRO ═══ */
            @keyframes blink-cursor {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            
            @keyframes blink-text {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.2; }
            }
            
            @keyframes cursor-bounce {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(4px); }
            }
            
            @keyframes pulse-button {
                0%, 100% { 
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
                    border-color: rgba(0, 255, 255, 0.6);
                }
                50% { 
                    box-shadow: 0 0 40px rgba(0, 255, 255, 0.8);
                    border-color: rgba(0, 255, 255, 1);
                }
            }
            
            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100vh); }
            }
            
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes menu-slide-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* ═══ BREATHING & GLITCH ANIMATIONS ═══ */
            @keyframes breathing {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
            
            @keyframes glitch {
                0%, 95%, 100% { transform: translate(0, 0) scale(1); filter: none; }
                96% { transform: translate(-3px, 1px) scale(1.02); filter: hue-rotate(90deg); }
                97% { transform: translate(3px, -1px) scale(1.02); filter: hue-rotate(-90deg); }
                98% { transform: translate(-2px, -1px) scale(1.01); filter: saturate(2); }
                99% { transform: translate(2px, 1px) scale(1.01); filter: brightness(1.5); }
            }
            
            @keyframes arrow-bounce {
                0%, 100% { transform: translateX(0); opacity: 1; }
                50% { transform: translateX(6px); opacity: 0.7; }
            }
            
            @keyframes arrow-glow {
                0%, 100% { 
                    text-shadow: 0 0 5px #ffdd00, 0 0 10px #ffdd00;
                    filter: brightness(1);
                }
                50% { 
                    text-shadow: 0 0 10px #ffdd00, 0 0 20px #ff8800, 0 0 30px #ff4400;
                    filter: brightness(1.3);
                }
            }
            
            /* ═══ PARTICLE CANVAS ═══ */
            #particle-canvas {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 12;
                pointer-events: none;
            }
            
            /* ═══ BOOT OVERLAY ═══ */
            #boot-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 20;
                background: #000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Press Start 2P', 'Courier New', monospace;
                cursor: pointer;
            }
            
            #boot-overlay::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: rgba(0, 255, 255, 0.1);
                animation: scanline 3s linear infinite;
                pointer-events: none;
            }
            
            #boot-overlay .terminal-text {
                color: #0f0;
                font-size: 12px;
                margin-bottom: 40px;
                text-shadow: 0 0 10px #0f0;
                letter-spacing: 2px;
            }
            
            #boot-overlay .cursor {
                animation: blink-cursor 1s step-end infinite;
            }
            
            #boot-overlay .power-btn {
                padding: 20px 40px;
                font-family: inherit;
                font-size: 14px;
                color: #0ff;
                background: transparent;
                border: 2px solid rgba(0, 255, 255, 0.6);
                cursor: pointer;
                letter-spacing: 3px;
                text-transform: uppercase;
                animation: pulse-button 2s ease-in-out infinite;
                transition: all 0.2s;
            }
            
            #boot-overlay .power-btn:hover {
                background: rgba(0, 255, 255, 0.1);
                transform: scale(1.05);
            }
            
            #boot-overlay.fade-out {
                animation: fade-out 0.5s ease-out forwards;
                pointer-events: none;
            }
            
            /* ═══ LOADING OVERLAY ═══ */
            #loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 25;
                background: #000;
                display: none;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Press Start 2P', 'Courier New', monospace;
                padding: 40px;
                box-sizing: border-box;
            }
            
            #loading-overlay.visible {
                display: flex;
            }
            
            #loading-overlay::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: rgba(0, 255, 255, 0.15);
                animation: scanline 2s linear infinite;
                pointer-events: none;
            }
            
            #loading-overlay .loading-container {
                max-width: 600px;
                width: 100%;
            }
            
            #loading-overlay .loading-header {
                color: #0f0;
                font-size: 12px;
                margin-bottom: 30px;
                text-shadow: 0 0 10px #0f0;
                letter-spacing: 2px;
                text-align: center;
            }
            
            #loading-overlay .loading-logo {
                text-align: center;
                margin-bottom: 40px;
            }
            
            #loading-overlay .loading-logo .logo-text {
                font-size: 24px;
                color: #0ff;
                text-shadow: 0 0 20px #0ff, 0 0 40px #0ff;
                letter-spacing: 8px;
                animation: breathing 2s ease-in-out infinite;
            }
            
            #loading-overlay .terminal-window {
                background: rgba(0, 20, 10, 0.8);
                border: 2px solid #0f0;
                border-radius: 4px;
                padding: 16px;
                margin-bottom: 20px;
                min-height: 160px;
                max-height: 200px;
                overflow: hidden;
            }
            
            #loading-overlay .terminal-line {
                color: #0f0;
                font-size: 9px;
                line-height: 1.8;
                text-shadow: 0 0 5px #0f0;
                opacity: 0;
                animation: fade-in 0.3s ease-out forwards;
            }
            
            #loading-overlay .terminal-line.success {
                color: #0ff;
            }
            
            #loading-overlay .terminal-line.warning {
                color: #ff0;
            }
            
            #loading-overlay .terminal-line.error {
                color: #f55;
            }
            
            #loading-overlay .terminal-line .cursor {
                animation: blink-cursor 0.5s step-end infinite;
            }
            
            #loading-overlay .progress-section {
                margin-top: 20px;
            }
            
            #loading-overlay .progress-label {
                display: flex;
                justify-content: space-between;
                color: #888;
                font-size: 8px;
                margin-bottom: 8px;
                letter-spacing: 1px;
            }
            
            #loading-overlay .progress-bar-container {
                background: rgba(0, 50, 50, 0.5);
                border: 2px solid #0aa;
                border-radius: 2px;
                height: 24px;
                position: relative;
                overflow: hidden;
            }
            
            #loading-overlay .progress-bar {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #0a8, #0ff, #0a8);
                background-size: 200% 100%;
                animation: progress-shine 1s linear infinite;
                transition: width 0.3s ease-out;
                box-shadow: 0 0 20px #0ff;
            }
            
            @keyframes progress-shine {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            #loading-overlay .progress-bar-container::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 8px,
                    rgba(0, 0, 0, 0.3) 8px,
                    rgba(0, 0, 0, 0.3) 10px
                );
                pointer-events: none;
            }
            
            #loading-overlay .progress-percent {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fff;
                font-size: 10px;
                text-shadow: 0 0 10px #000, 2px 2px 0 #000;
                z-index: 1;
            }
            
            #loading-overlay .loading-tip {
                margin-top: 30px;
                text-align: center;
                color: #666;
                font-size: 7px;
                letter-spacing: 1px;
                line-height: 1.6;
            }
            
            #loading-overlay .loading-tip .tip-text {
                color: #888;
            }
            
            #loading-overlay.fade-out {
                animation: fade-out 0.5s ease-out forwards;
                pointer-events: none;
            }
            
            /* ═══ SETTINGS BUTTON ═══ */
            #boot-overlay .settings-btn {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 44px;
                height: 44px;
                background: transparent;
                border: 2px solid rgba(0, 255, 255, 0.4);
                border-radius: 8px;
                color: #0ff;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            #boot-overlay .settings-btn:hover {
                background: rgba(0, 255, 255, 0.1);
                border-color: rgba(0, 255, 255, 0.8);
                transform: rotate(45deg);
            }
            
            /* ═══ SETTINGS MODAL ═══ */
            #settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 100;
                background: rgba(0, 0, 0, 0.9);
                display: none;
                align-items: center;
                justify-content: center;
                font-family: 'Press Start 2P', monospace;
            }
            
            #settings-modal.open {
                display: flex;
            }
            
            #settings-modal .settings-panel {
                background: linear-gradient(180deg, rgba(10, 20, 30, 0.98) 0%, rgba(5, 10, 20, 0.99) 100%);
                border: 2px solid rgba(0, 255, 255, 0.5);
                border-radius: 12px;
                padding: 30px;
                min-width: 320px;
                max-width: 90vw;
            }
            
            #settings-modal .settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(0, 255, 255, 0.3);
            }
            
            #settings-modal .settings-title {
                color: #0ff;
                font-size: 14px;
                margin: 0;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }
            
            #settings-modal .close-settings {
                background: transparent;
                border: none;
                color: #f55;
                font-size: 16px;
                cursor: pointer;
                padding: 8px;
                transition: all 0.2s;
            }
            
            #settings-modal .close-settings:hover {
                color: #f88;
                transform: scale(1.2);
            }
            
            #settings-modal .settings-section {
                margin-bottom: 20px;
            }
            
            #settings-modal .settings-label {
                color: #888;
                font-size: 8px;
                margin-bottom: 12px;
                letter-spacing: 2px;
            }
            
            #settings-modal .resolution-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            #settings-modal .res-option {
                background: rgba(0, 20, 40, 0.6);
                border: 2px solid rgba(0, 255, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            }
            
            #settings-modal .res-option:hover {
                background: rgba(0, 255, 255, 0.1);
                border-color: rgba(0, 255, 255, 0.5);
            }
            
            #settings-modal .res-option.selected {
                background: rgba(0, 255, 255, 0.15);
                border-color: #0ff;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
            
            #settings-modal .res-option .res-name {
                color: #fff;
                font-size: 10px;
                margin-bottom: 4px;
            }
            
            #settings-modal .res-option .res-desc {
                color: #666;
                font-size: 7px;
            }
            
            #settings-modal .res-option.selected .res-name {
                color: #0ff;
            }
            
            #settings-modal .res-option.selected .res-desc {
                color: #0aa;
            }
            
            #settings-modal .settings-footer {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid rgba(0, 255, 255, 0.3);
                text-align: center;
            }
            
            #settings-modal .apply-btn {
                background: rgba(0, 255, 170, 0.2);
                border: 2px solid #0fa;
                color: #0fa;
                padding: 12px 24px;
                font-family: inherit;
                font-size: 10px;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s;
            }
            
            #settings-modal .apply-btn:hover {
                background: rgba(0, 255, 170, 0.3);
                box-shadow: 0 0 20px rgba(0, 255, 170, 0.4);
            }
            
            #settings-modal .current-res {
                color: #666;
                font-size: 7px;
                margin-top: 12px;
            }
            
            /* ═══ AUDIO SLIDERS - Bio-Hazard Style ═══ */
            #settings-modal .audio-section {
                margin-bottom: 24px;
            }
            
            #settings-modal .audio-control {
                margin-bottom: 16px;
            }
            
            #settings-modal .audio-control-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                gap: 8px;
            }
            
            #settings-modal .audio-icon {
                font-size: 16px;
                filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.5));
            }
            
            #settings-modal .audio-name {
                color: #aaa;
                font-size: 8px;
                letter-spacing: 1px;
                flex: 1;
            }
            
            #settings-modal .audio-value {
                color: #0ff;
                font-size: 10px;
                min-width: 40px;
                text-align: right;
                text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
            }
            
            /* ═══ Range Slider Customizado ═══ */
            #settings-modal .audio-slider {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 8px;
                background: rgba(0, 20, 40, 0.8);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 4px;
                outline: none;
                cursor: pointer;
            }
            
            /* Track - WebKit (Chrome, Safari, Edge) */
            #settings-modal .audio-slider::-webkit-slider-runnable-track {
                height: 6px;
                background: linear-gradient(90deg, 
                    rgba(0, 255, 255, 0.1) 0%, 
                    rgba(0, 255, 255, 0.3) 100%
                );
                border-radius: 3px;
            }
            
            /* Thumb - WebKit */
            #settings-modal .audio-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 20px;
                background: linear-gradient(180deg, #0ff 0%, #088 100%);
                border: 2px solid #0ff;
                border-radius: 3px;
                cursor: grab;
                box-shadow: 
                    0 0 10px rgba(0, 255, 255, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
                margin-top: -7px;
                transition: box-shadow 0.1s;
            }
            
            #settings-modal .audio-slider::-webkit-slider-thumb:hover {
                box-shadow: 
                    0 0 20px rgba(0, 255, 255, 0.8),
                    inset 0 1px 0 rgba(255, 255, 255, 0.5);
            }
            
            #settings-modal .audio-slider::-webkit-slider-thumb:active {
                cursor: grabbing;
                background: linear-gradient(180deg, #0ff 0%, #0aa 100%);
            }
            
            /* Track - Firefox */
            #settings-modal .audio-slider::-moz-range-track {
                height: 6px;
                background: linear-gradient(90deg, 
                    rgba(0, 255, 255, 0.1) 0%, 
                    rgba(0, 255, 255, 0.3) 100%
                );
                border-radius: 3px;
                border: 1px solid rgba(0, 255, 255, 0.3);
            }
            
            /* Thumb - Firefox */
            #settings-modal .audio-slider::-moz-range-thumb {
                width: 14px;
                height: 18px;
                background: linear-gradient(180deg, #0ff 0%, #088 100%);
                border: 2px solid #0ff;
                border-radius: 3px;
                cursor: grab;
                box-shadow: 
                    0 0 10px rgba(0, 255, 255, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }
            
            #settings-modal .audio-slider::-moz-range-thumb:hover {
                box-shadow: 
                    0 0 20px rgba(0, 255, 255, 0.8),
                    inset 0 1px 0 rgba(255, 255, 255, 0.5);
            }
            
            /* Progress fill visual (WebKit) */
            #settings-modal .audio-slider {
                background: linear-gradient(90deg, 
                    rgba(0, 255, 255, 0.4) 0%, 
                    rgba(0, 255, 255, 0.4) var(--progress, 30%), 
                    rgba(0, 20, 40, 0.8) var(--progress, 30%)
                );
            }
            
            /* ═══ VIDEO BACKGROUND - 1080p com aspect ratio preservado ═══ */
            #intro-video {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 10;
                background: #000;
                object-fit: contain;
                -webkit-backface-visibility: hidden;
                will-change: opacity;
            }
            
            /* Em mobile portrait, permite cover para preencher melhor */
            @media (max-aspect-ratio: 1/1) {
                #intro-video {
                    object-fit: cover;
                }
            }
            
            #intro-video.fade-out {
                animation: fade-out 0.8s ease-out forwards;
            }
            
            /* ═══ GAME OVERLAY (PRESS START + MENU) ═══ */
            #game-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 15;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                padding-bottom: 60px;
                font-family: 'Press Start 2P', monospace;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
            }
            
            #game-overlay.visible {
                opacity: 1;
                pointer-events: auto;
            }
            
            /* ═══ PRESS START TEXT ═══ */
            #press-start-text {
                font-size: 18px;
                color: #fff;
                text-shadow: 
                    0 0 10px rgba(255, 255, 255, 0.8),
                    0 0 20px rgba(0, 255, 255, 0.5),
                    3px 3px 0 #000;
                letter-spacing: 4px;
                animation: blink-text 1s ease-in-out infinite, breathing 4s ease-in-out infinite, glitch 10s ease-in-out infinite;
                cursor: pointer;
            }
            
            #press-start-text.hidden {
                display: none;
            }
            
            /* ═══ RETRO MENU ═══ */
            #retro-menu {
                display: none;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                animation: menu-slide-in 0.3s ease-out;
            }
            
            #retro-menu.visible {
                display: flex;
            }
            
            .menu-item {
                font-size: 14px;
                color: #fff;
                text-shadow: 2px 2px 0 #000;
                letter-spacing: 2px;
                cursor: pointer;
                transition: color 0.1s;
                padding: 6px 16px;
            }
            
            .menu-item.disabled {
                color: #555;
                cursor: not-allowed;
            }
            
            .menu-item.selected {
                color: #ffdd00;
                text-shadow: 
                    0 0 10px rgba(255, 221, 0, 0.5),
                    2px 2px 0 #000;
            }
            
            .menu-item.selected::before {
                content: '▶';
                position: absolute;
                left: -25px;
                animation: arrow-bounce 0.6s ease-in-out infinite, arrow-glow 1s ease-in-out infinite;
            }
            
            .menu-item {
                position: relative;
            }
            
            .menu-item:not(.disabled):hover {
                color: #ffdd00;
            }
            
            /* ═══ COPYRIGHT / VERSION ═══ */
            #game-footer {
                position: absolute;
                bottom: 20px;
                font-size: 8px;
                color: #666;
                letter-spacing: 1px;
                text-shadow: 1px 1px 0 #000;
            }
        `;
        document.head.appendChild(this.styleElement);
    }
    
    /**
     * Cria o elemento de vídeo (pausado)
     */
    _createVideo() {
        this.videoElement = document.createElement('video');
        this.videoElement.id = 'intro-video';
        this.videoElement.loop = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        this.videoElement.src = 'title-screen.mp4';
        document.body.appendChild(this.videoElement);
    }
    
    /**
     * Cria canvas de partículas geométricas (Triângulo, Quadrado, Círculo)
     * Cores RGB dos personagens do jogo
     */
    _createParticleCanvas() {
        this.particleCanvas = document.createElement('canvas');
        this.particleCanvas.id = 'particle-canvas';
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = window.innerHeight;
        document.body.appendChild(this.particleCanvas);
        
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.particles = [];
        
        // Cores dos personagens (RGB do title screen)
        this.particleColors = [
            { r: 255, g: 60, b: 60 },   // Vermelho (Triângulo)
            { r: 60, g: 120, b: 255 },  // Azul (Quadrado)
            { r: 60, g: 255, b: 120 }   // Verde (Círculo)
        ];
        
        // Resize handler
        this._handleResize = () => {
            this.particleCanvas.width = window.innerWidth;
            this.particleCanvas.height = window.innerHeight;
        };
        window.addEventListener('resize', this._handleResize);
    }
    
    /**
     * Inicia animação das partículas
     */
    _startParticles() {
        // Cria partículas iniciais
        for (let i = 0; i < 25; i++) {
            this._spawnParticle();
        }
        
        // Loop de animação
        const animate = () => {
            this._updateParticles();
            this._drawParticles();
            this.particleAnimationId = requestAnimationFrame(animate);
        };
        animate();
        
        // Spawna novas partículas periodicamente
        this.particleSpawnInterval = setInterval(() => {
            if (this.particles.length < 40) {
                this._spawnParticle();
            }
        }, 400);
    }
    
    /**
     * Cria uma nova partícula
     */
    _spawnParticle() {
        const shapes = ['triangle', 'square', 'circle'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const colorIndex = shapes.indexOf(shape);
        const color = this.particleColors[colorIndex];
        
        this.particles.push({
            x: Math.random() * this.particleCanvas.width,
            y: this.particleCanvas.height + 20,
            size: 4 + Math.random() * 8,
            speedY: -0.3 - Math.random() * 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            opacity: 0.3 + Math.random() * 0.4,
            shape: shape,
            color: color,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.02
        });
    }
    
    /**
     * Atualiza posição das partículas
     */
    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Movimento
            p.y += p.speedY;
            p.wobble += p.wobbleSpeed;
            p.x += p.speedX + Math.sin(p.wobble) * 0.3;
            p.rotation += p.rotationSpeed;
            
            // Fade out gradual conforme sobe
            const heightProgress = 1 - (p.y / this.particleCanvas.height);
            if (heightProgress > 0.7) {
                p.opacity -= 0.005;
            }
            
            // Remove partículas que saíram ou ficaram invisíveis
            if (p.y < -20 || p.opacity <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Desenha partículas no canvas
     */
    _drawParticles() {
        const ctx = this.particleCtx;
        ctx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.opacity;
            
            // Glow effect
            ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.8)`;
            ctx.shadowBlur = 10;
            
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 1)`;
            ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
            ctx.lineWidth = 1;
            
            switch (p.shape) {
                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(0, -p.size);
                    ctx.lineTo(-p.size * 0.866, p.size * 0.5);
                    ctx.lineTo(p.size * 0.866, p.size * 0.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;
                    
                case 'square':
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    break;
                    
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        }
    }
    
    /**
     * Para animação das partículas
     */
    _stopParticles() {
        if (this.particleAnimationId) {
            cancelAnimationFrame(this.particleAnimationId);
            this.particleAnimationId = null;
        }
        if (this.particleSpawnInterval) {
            clearInterval(this.particleSpawnInterval);
            this.particleSpawnInterval = null;
        }
    }
    
    /**
     * Cria o elemento de áudio (pausado)
     */
    _createAudio() {
        this.audioElement = document.createElement('audio');
        this.audioElement.id = 'intro-audio';
        this.audioElement.loop = true;
        this.audioElement.volume = 1.0; // Menu music stays at 100%
        this.audioElement.src = 'opening.mp3';
        document.body.appendChild(this.audioElement);
    }
    
    /**
     * Cria o overlay de boot (estado "Power Off")
     */
    _createBootOverlay() {
        this.bootOverlay = document.createElement('div');
        this.bootOverlay.id = 'boot-overlay';
        this.bootOverlay.innerHTML = `
            <button class="settings-btn" title="Configurações">⚙</button>
            <div class="terminal-text">
                > SYSTEM STANDBY<span class="cursor">_</span>
            </div>
            <button class="power-btn">[ INITIALIZE SYSTEM ]</button>
        `;
        
        // Handler para power on (clique no botão principal ou área geral)
        this.bootOverlay.addEventListener('click', (e) => {
            // Ignora se clicou no botão de settings
            if (e.target.classList.contains('settings-btn')) {
                e.stopPropagation();
                this._openSettings();
                return;
            }
            this._handlePowerOn();
        });
        
        document.body.appendChild(this.bootOverlay);
    }
    
    /**
     * Cria o overlay de loading (entre boot e attract)
     */
    _createLoadingOverlay() {
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'loading-overlay';
        this.loadingOverlay.innerHTML = `
            <div class="loading-container">
                <div class="loading-logo">
                    <div class="logo-text">HYLOMORPH</div>
                </div>
                
                <div class="loading-header">
                    > INITIALIZING SYSTEM<span class="cursor">_</span>
                </div>
                
                <div class="terminal-window">
                    <div id="terminal-output"></div>
                </div>
                
                <div class="progress-section">
                    <div class="progress-label">
                        <span>LOADING</span>
                        <span id="progress-task">PREPARING...</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="progress-bar"></div>
                        <div class="progress-percent" id="progress-percent">0%</div>
                    </div>
                </div>
                
                <div class="loading-tip">
                    <div class="tip-text">「 DICA: Os Golems aprendem observando seu comportamento 」</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.loadingOverlay);
    }
    
    /**
     * Define todas as tarefas de carregamento
     */
    _defineLoadingTasks() {
        this.loadingTasks = [
            {
                id: 'font',
                name: 'FONT.TTF',
                description: 'Carregando fonte Press Start 2P',
                weight: 5,
                execute: () => this._loadFont()
            },
            {
                id: 'audio_context',
                name: 'AUDIO.SYS',
                description: 'Inicializando sistema de áudio',
                weight: 5,
                execute: () => this._initAudioContext()
            },
            {
                id: 'video',
                name: 'TITLE.MP4',
                description: 'Carregando vídeo do título',
                weight: 25,
                execute: () => this._preloadVideo()
            },
            {
                id: 'audio',
                name: 'OPENING.MP3',
                description: 'Carregando música de abertura',
                weight: 20,
                execute: () => this._preloadAudio()
            },
            {
                id: 'webgl',
                name: 'RENDER.DLL',
                description: 'Aquecendo WebGL renderer',
                weight: 10,
                execute: () => this._warmupRenderer()
            },
            {
                id: 'game_data',
                name: 'GAMEDATA.DAT',
                description: 'Carregando dados do jogo',
                weight: 10,
                execute: () => this._preloadGameData()
            },
            {
                id: 'golem_sys',
                name: 'GOLEM.SYS',
                description: 'Inicializando sistema de Golems',
                weight: 10,
                execute: () => this._preloadGolemSystem()
            },
            {
                id: 'cache',
                name: 'CACHE.TMP',
                description: 'Preparando cache de texturas',
                weight: 5,
                execute: () => this._prepareCache()
            },
            {
                id: 'sanctuary',
                name: 'SANCTUARY.MAP',
                description: 'Carregando mapa do santuário',
                weight: 5,
                execute: () => this._preloadSanctuary()
            },
            {
                id: 'finalize',
                name: 'BOOT.INI',
                description: 'Finalizando inicialização',
                weight: 5,
                execute: () => this._finalizeLoading()
            }
        ];
        
        // Calcula peso total
        this.totalWeight = this.loadingTasks.reduce((sum, task) => sum + task.weight, 0);
    }
    
    /**
     * Adiciona linha ao terminal de loading
     */
    _addTerminalLine(text, type = 'normal') {
        const terminal = document.getElementById('terminal-output');
        if (!terminal) return;
        
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.innerHTML = text;
        terminal.appendChild(line);
        
        // Auto-scroll para baixo
        terminal.scrollTop = terminal.scrollHeight;
        
        // Remove linhas antigas se tiver muitas
        while (terminal.children.length > 12) {
            terminal.removeChild(terminal.firstChild);
        }
    }
    
    /**
     * Atualiza a barra de progresso
     */
    _updateProgress(progress, taskName = '') {
        const bar = document.getElementById('progress-bar');
        const percent = document.getElementById('progress-percent');
        const task = document.getElementById('progress-task');
        
        if (bar) bar.style.width = `${progress}%`;
        if (percent) percent.textContent = `${Math.round(progress)}%`;
        if (task && taskName) task.textContent = taskName;
    }
    
    /**
     * Executa o processo de carregamento
     */
    async _runLoadingSequence() {
        let completedWeight = 0;
        
        for (let i = 0; i < this.loadingTasks.length; i++) {
            const task = this.loadingTasks[i];
            this.currentTaskIndex = i;
            
            // Mostra no terminal
            this._addTerminalLine(`> Loading ${task.name}...`);
            this._updateProgress((completedWeight / this.totalWeight) * 100, task.name);
            
            try {
                // Executa a tarefa
                await task.execute();
                
                // Marca como sucesso
                this._addTerminalLine(`  ✓ ${task.description} [OK]`, 'success');
                
            } catch (error) {
                // Marca como warning (não falha o loading)
                console.warn(`[Loading] Erro em ${task.id}:`, error);
                this._addTerminalLine(`  ! ${task.description} [SKIP]`, 'warning');
            }
            
            // Atualiza progresso
            completedWeight += task.weight;
            this._updateProgress((completedWeight / this.totalWeight) * 100, task.name);
            
            // Pequeno delay para feedback visual
            await this._delay(100 + Math.random() * 150);
        }
        
        // Loading completo!
        this._addTerminalLine('');
        this._addTerminalLine('> SYSTEM READY', 'success');
        this._addTerminalLine('> Press any key to continue...<span class="cursor">_</span>', 'success');
        
        this._updateProgress(100, 'COMPLETE');
        
        // Aguarda um momento e vai para attract mode
        await this._delay(800);
        this._transitionToAttract();
    }
    
    /**
     * Utilitário: delay
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ═══════════════════════════════════════════════════════════════
    // TAREFAS DE CARREGAMENTO
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Carrega fonte Press Start 2P
     */
    async _loadFont() {
        // Verifica se a fonte já está disponível
        if (document.fonts) {
            try {
                await document.fonts.load('12px "Press Start 2P"');
                await document.fonts.ready;
            } catch (e) {
                // Fallback: aguarda um tempo fixo
                await this._delay(500);
            }
        } else {
            await this._delay(300);
        }
    }
    
    /**
     * Inicializa AudioContext
     */
    async _initAudioContext() {
        try {
            // Desbloqueia AudioContext do Phaser
            if (this.sound.context && this.sound.context.state === 'suspended') {
                await this.sound.context.resume();
            }
            
            // Cria um som silencioso para "aquecer" o sistema
            const ctx = this.sound.context;
            if (ctx) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                gain.gain.value = 0;
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            }
        } catch (e) {
            console.warn('[Loading] AudioContext não disponível');
        }
        await this._delay(200);
    }
    
    /**
     * Pré-carrega o vídeo
     */
    async _preloadVideo() {
        return new Promise((resolve, reject) => {
            if (!this.videoElement) {
                resolve();
                return;
            }
            
            // Se já carregou
            if (this.videoElement.readyState >= 3) {
                resolve();
                return;
            }
            
            const timeout = setTimeout(() => {
                console.warn('[Loading] Timeout no vídeo, continuando...');
                resolve();
            }, 10000);
            
            const onCanPlay = () => {
                clearTimeout(timeout);
                this.videoElement.removeEventListener('canplaythrough', onCanPlay);
                resolve();
            };
            
            const onError = () => {
                clearTimeout(timeout);
                reject(new Error('Erro ao carregar vídeo'));
            };
            
            this.videoElement.addEventListener('canplaythrough', onCanPlay);
            this.videoElement.addEventListener('error', onError);
            
            // Força o carregamento
            this.videoElement.load();
        });
    }
    
    /**
     * Pré-carrega o áudio
     */
    async _preloadAudio() {
        return new Promise((resolve, reject) => {
            if (!this.audioElement) {
                resolve();
                return;
            }
            
            // Se já carregou
            if (this.audioElement.readyState >= 3) {
                resolve();
                return;
            }
            
            const timeout = setTimeout(() => {
                console.warn('[Loading] Timeout no áudio, continuando...');
                resolve();
            }, 8000);
            
            const onCanPlay = () => {
                clearTimeout(timeout);
                this.audioElement.removeEventListener('canplaythrough', onCanPlay);
                resolve();
            };
            
            const onError = () => {
                clearTimeout(timeout);
                reject(new Error('Erro ao carregar áudio'));
            };
            
            this.audioElement.addEventListener('canplaythrough', onCanPlay);
            this.audioElement.addEventListener('error', onError);
            
            // Força o carregamento
            this.audioElement.load();
        });
    }
    
    /**
     * Aquece o renderer WebGL
     */
    async _warmupRenderer() {
        try {
            // Renderiza alguns frames vazios para aquecer
            const renderer = this.sys.game.renderer;
            
            if (renderer.type === Phaser.WEBGL) {
                // Cria e destrói algumas texturas para aquecer o pipeline
                for (let i = 0; i < 3; i++) {
                    const graphics = this.add.graphics();
                    graphics.fillStyle(0x000000, 0);
                    graphics.fillRect(0, 0, 100, 100);
                    graphics.destroy();
                    await this._delay(50);
                }
            }
        } catch (e) {
            console.warn('[Loading] Warmup renderer falhou');
        }
        await this._delay(200);
    }
    
    /**
     * Carrega dados do jogo
     */
    async _preloadGameData() {
        try {
            // Importa os módulos de dados
            await import('../data/gameData.js');
            await import('../data/dialogueData.js');
        } catch (e) {
            console.warn('[Loading] Erro ao carregar dados:', e);
        }
        await this._delay(300);
    }
    
    /**
     * Pré-carrega sistema de Golems
     */
    async _preloadGolemSystem() {
        try {
            // Importa o módulo Golem
            await import('../entities/Golem.js');
        } catch (e) {
            console.warn('[Loading] Erro ao carregar Golem:', e);
        }
        await this._delay(400);
    }
    
    /**
     * Prepara cache de texturas
     */
    async _prepareCache() {
        try {
            // Verifica se há assets para pré-cachear
            const textures = this.textures;
            
            // Cria uma textura temporária para garantir que o cache está pronto
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff);
            graphics.fillCircle(32, 32, 32);
            graphics.generateTexture('_warmup_cache', 64, 64);
            graphics.destroy();
            
            // Remove após um frame
            await this._delay(100);
            if (textures.exists('_warmup_cache')) {
                textures.remove('_warmup_cache');
            }
        } catch (e) {
            console.warn('[Loading] Erro ao preparar cache');
        }
        await this._delay(200);
    }
    
    /**
     * Pré-carrega dados do santuário
     */
    async _preloadSanctuary() {
        try {
            // Importa a cena
            await import('./SanctuaryScene.js');
        } catch (e) {
            console.warn('[Loading] Erro ao carregar Sanctuary:', e);
        }
        await this._delay(300);
    }
    
    /**
     * Finaliza o loading
     */
    async _finalizeLoading() {
        // Garbage collection hint
        if (window.gc) {
            try { window.gc(); } catch (e) {}
        }
        
        // Verifica memória disponível (se API existir)
        if (navigator.deviceMemory) {
            this._addTerminalLine(`  RAM: ${navigator.deviceMemory}GB detected`, 'success');
        }
        
        // Verifica conexão
        if (navigator.connection) {
            const conn = navigator.connection;
            this._addTerminalLine(`  NET: ${conn.effectiveType || 'unknown'} connection`, 'success');
        }
        
        await this._delay(300);
    }
    
    /**
     * Transição do loading para attract mode
     */
    _transitionToAttract() {
        // Fade out do loading overlay
        this.loadingOverlay.classList.add('fade-out');
        
        // Inicia vídeo e áudio
        this.videoElement.play();
        this.audioElement.play();
        
        // Inicia partículas
        this._startParticles();
        
        setTimeout(() => {
            this.loadingOverlay.style.display = 'none';
            
            // Mostra game overlay
            this.gameOverlay.classList.add('visible');
            this.state = 'attract';
            
            // Adiciona listeners
            document.addEventListener('keydown', this._handleKeydown);
            this.gameOverlay.addEventListener('click', this._handleClick);
            
            console.log('[StartScene] Attract Mode ativo. Aguardando START...');
        }, 500);
    }
    
    /**
     * Cria o modal de configurações
     */
    _createSettingsModal() {
        this.settingsModal = document.createElement('div');
        this.settingsModal.id = 'settings-modal';
        
        const resolutionOptionsHTML = RESOLUTION_PRESETS.map(res => `
            <div class="res-option ${res.id === this.currentResolution ? 'selected' : ''}" data-res="${res.id}">
                <div class="res-name">${res.label}</div>
                <div class="res-desc">${res.desc}</div>
            </div>
        `).join('');
        
        const currentResLabel = RESOLUTION_PRESETS.find(r => r.id === this.currentResolution)?.label || 'AUTO';
        
        // Carrega configurações salvas
        const savedSettings = JSON.parse(localStorage.getItem('hylomorph_settings') || '{}');
        const musicEnabled = ('musicEnabled' in savedSettings) ? !!savedSettings.musicEnabled : (typeof savedSettings.musicVolume === 'number' ? savedSettings.musicVolume > 0 : true);
        const sfxVol = savedSettings.sfxVolume ?? 0.8;
        
        this.settingsModal.innerHTML = `
            <div class="settings-panel">
                <div class="settings-header">
                    <h2 class="settings-title">⚙ CONFIGURAÇÕES</h2>
                    <button class="close-settings">✕</button>
                </div>
                
                <!-- ═══ SEÇÃO DE ÁUDIO ═══ -->
                <div class="settings-section audio-section">
                    <div class="settings-label">🔊 CONTROLE DE ÁUDIO</div>
                    
                    <div class="audio-control">
                        <div class="audio-control-header">
                            <span class="audio-icon">🎵</span>
                            <span class="audio-name">MÚSICA DE FUNDO</span>
                            <span class="audio-value" id="music-status">${musicEnabled ? 'ATIVADA' : 'DESATIVADA'}</span>
                        </div>
                        <label class="music-toggle">
                            <input type="checkbox" id="music-toggle" ${musicEnabled ? 'checked' : ''}>
                            <span class="toggle-label">Ativar música de fundo</span>
                        </label>
                    </div>
                    
                    <div class="audio-control">
                        <div class="audio-control-header">
                            <span class="audio-icon">🔊</span>
                            <span class="audio-name">EFEITOS (SFX)</span>
                            <span class="audio-value" id="sfx-value">${Math.round(sfxVol * 100)}%</span>
                        </div>
                        <input type="range" 
                               class="audio-slider" 
                               id="sfx-slider" 
                               min="0" max="1" step="0.05" 
                               value="${sfxVol}">
                    </div>
                </div>
                
                <!-- ═══ SEÇÃO DE RESOLUÇÃO ═══ -->
                <div class="settings-section">
                    <div class="settings-label">📺 RESOLUÇÃO DO JOGO</div>
                    <div class="resolution-grid">
                        ${resolutionOptionsHTML}
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button class="apply-btn">APLICAR</button>
                    <div class="current-res">Resolução atual: ${currentResLabel}</div>
                </div>
            </div>
        `;
        
        // Event listeners
        this.settingsModal.querySelector('.close-settings').addEventListener('click', () => {
            this._closeSettings();
        });
        
        this.settingsModal.querySelectorAll('.res-option').forEach(opt => {
            opt.addEventListener('click', () => {
                this.settingsModal.querySelectorAll('.res-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                this.pendingResolution = opt.dataset.res;
            });
        });
        
        // ═══ AUDIO CONTROLS EVENT LISTENERS ═══
        const musicToggle = this.settingsModal.querySelector('#music-toggle');
        const sfxSlider = this.settingsModal.querySelector('#sfx-slider');
        const musicStatus = this.settingsModal.querySelector('#music-status');
        const sfxValue = this.settingsModal.querySelector('#sfx-value');
        
        // Função helper para atualizar visual do slider
        const updateSliderVisual = (slider) => {
            const percent = parseFloat(slider.value) * 100;
            slider.style.setProperty('--progress', `${percent}%`);
        };
        
        // Inicializa visual do SFX slider
        updateSliderVisual(sfxSlider);
        
        // Música - toggle em tempo real (ON/OFF)
        if (musicToggle) {
            musicToggle.addEventListener('input', (e) => {
                const enabled = !!e.target.checked;
                musicStatus.textContent = enabled ? 'ATIVADA' : 'DESATIVADA';
                if (window.uiSounds) {
                    window.uiSounds.setMusicEnabled(enabled);
                }
            });
        }
        
        // SFX - atualiza em tempo real
        sfxSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            sfxValue.textContent = `${Math.round(vol * 100)}%`;
            updateSliderVisual(e.target);
            
            // Aplica em tempo real
            if (window.uiSounds) {
                window.uiSounds.setSfxVolume(vol);
            }
        });
        
        // SFX - toca som de teste ao soltar o slider
        sfxSlider.addEventListener('change', () => {
            if (window.uiSounds) {
                window.uiSounds.playSelect();
            }
        });
        
        this.settingsModal.querySelector('.apply-btn').addEventListener('click', () => {
            this._applySettings();
        });
        
        // Fechar ao clicar fora
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this._closeSettings();
            }
        });
        
        document.body.appendChild(this.settingsModal);
    }
    
    /**
     * Abre o modal de configurações
     */
    _openSettings() {
        this.settingsOpen = true;
        this.pendingResolution = this.currentResolution;
        this.settingsModal.classList.add('open');
    }
    
    /**
     * Fecha o modal de configurações
     */
    _closeSettings() {
        this.settingsOpen = false;
        this.settingsModal.classList.remove('open');
    }
    
    /**
     * Aplica configurações e recarrega
     */
    _applySettings() {
        // Salva configurações de áudio
        const musicToggle = this.settingsModal.querySelector('#music-toggle');
        const sfxSlider = this.settingsModal.querySelector('#sfx-slider');
        
        const musicEnabledVal = !!musicToggle?.checked;
        const sfxVol = parseFloat(sfxSlider?.value ?? 0.8);
        
        this._saveSettings({ 
            musicEnabled: musicEnabledVal,
            sfxVolume: sfxVol
        });
        
        // Verifica se precisa recarregar (mudança de resolução)
        if (this.pendingResolution && this.pendingResolution !== this.currentResolution) {
            this._saveSettings({ resolution: this.pendingResolution });
            // Recarrega a página para aplicar nova resolução
            window.location.reload();
        } else {
            this._closeSettings();
        }
    }
    
    /**
     * Carrega configurações do localStorage
     */
    _loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('hylomorph_settings') || '{}');
            this.currentResolution = settings.resolution || 'auto';
        } catch (e) {
            this.currentResolution = 'auto';
        }
    }
    
    /**
     * Salva configurações no localStorage
     */
    _saveSettings(settings) {
        try {
            const current = JSON.parse(localStorage.getItem('hylomorph_settings') || '{}');
            const updated = { ...current, ...settings };
            localStorage.setItem('hylomorph_settings', JSON.stringify(updated));
        } catch (e) {
            console.error('[Settings] Erro ao salvar:', e);
        }
    }
    
    /**
     * Cria o overlay de jogo (PRESS START + Menu)
     */
    _createGameOverlay() {
        this.gameOverlay = document.createElement('div');
        this.gameOverlay.id = 'game-overlay';
        
        // Gera HTML do menu
        const menuItemsHTML = this.menuOptions.map((opt, i) => {
            const disabledClass = opt.enabled ? '' : 'disabled';
            const selectedClass = i === this.selectedIndex ? 'selected' : '';
            return `
                <div class="menu-item ${disabledClass} ${selectedClass}" data-index="${i}" data-id="${opt.id}">
                    ${opt.label}
                </div>
            `;
        }).join('');
        
        this.gameOverlay.innerHTML = `
            <div id="press-start-text">PRESS START</div>
            <div id="retro-menu">
                ${menuItemsHTML}
            </div>
            <div id="game-footer">© 2025 TALES SANTIAGO | v0.1.0</div>
        `;
        
        document.body.appendChild(this.gameOverlay);
        
        // Adiciona listeners aos itens do menu
        this.gameOverlay.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                if (this.menuOptions[index].enabled) {
                    this.selectedIndex = index;
                    this._updateMenuSelection();
                    this._executeMenuAction();
                } else {
                    this._playBlockedSound();
                }
            });
            
            item.addEventListener('mouseenter', () => {
                if (this.state === 'menu') {
                    const index = parseInt(item.dataset.index);
                    this.selectedIndex = index;
                    this._updateMenuSelection();
                }
            });
        });
    }
    
    /**
     * Handler: "Power On" - Inicia sequência de loading
     */
    _handlePowerOn() {
        if (this.state !== 'boot') return;
        
        console.log('[StartScene] POWER ON! Iniciando carregamento...');
        
        // Toca som de inicialização
        this._playBootSound();
        
        // Muda para estado loading
        this.state = 'loading';
        
        // Fade out do boot overlay
        this.bootOverlay.classList.add('fade-out');
        
        setTimeout(() => {
            this.bootOverlay?.remove();
            
            // ═══ SEMPRE mostra dica de orientação (parte da intro) ═══
            this._showOrientationHint(() => {
                // Callback: Mostra loading após dica
                this.loadingOverlay.classList.add('visible');
                this._runLoadingSequence();
            });
        }, 500);
    }
    
    /**
     * Detecta se é dispositivo mobile
     */
    _isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || ('ontouchstart' in window) 
            || (navigator.maxTouchPoints > 0);
    }
    
    /**
     * Mostra dica de orientação e fone de ouvido para mobile
     */
    _showOrientationHint(callback) {
        // Cria overlay de dica
        const hintOverlay = document.createElement('div');
        hintOverlay.id = 'orientation-hint-overlay';
        hintOverlay.innerHTML = `
            <div class="orientation-hint-content">
                <div class="hint-icons">
                    <div class="hint-item headphones">
                        <span class="hint-icon">🎧</span>
                        <span class="hint-label">FONE RECOMENDADO</span>
                    </div>
                    <div class="hint-item landscape">
                        <span class="hint-icon rotate-phone">📱</span>
                        <span class="hint-label">VIRE A TELA</span>
                    </div>
                </div>
            </div>
        `;
        
        // Adiciona estilos inline (para garantir que funcionem)
        const style = document.createElement('style');
        style.textContent = `
            #orientation-hint-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 30;
                background: #000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Press Start 2P', monospace;
                animation: fadeIn 0.5s ease-out;
                opacity: 1;
                transition: opacity 1s ease-out;
            }
            
            #orientation-hint-overlay.fade-out {
                opacity: 0;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .orientation-hint-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 40px;
                padding: 20px;
            }
            
            .hint-icons {
                display: flex;
                gap: 60px;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .hint-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }
            
            .hint-icon {
                font-size: 64px;
                filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.5));
            }
            
            .hint-item.headphones .hint-icon {
                animation: pulse-headphones 2s ease-in-out infinite;
            }
            
            @keyframes pulse-headphones {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.5)); }
                50% { transform: scale(1.1); filter: drop-shadow(0 0 30px rgba(0, 255, 255, 0.8)); }
            }
            
            .rotate-phone {
                display: inline-block;
                animation: rotate-phone 2s ease-in-out infinite;
            }
            
            @keyframes rotate-phone {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-90deg); }
                50% { transform: rotate(-90deg); }
                75% { transform: rotate(0deg); }
            }
            
            .hint-label {
                font-size: 10px;
                color: #0ff;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                text-align: center;
            }
            
            @media (orientation: landscape) {
                .hint-item.landscape {
                    opacity: 0.3;
                }
                .hint-item.landscape .hint-label::after {
                    content: ' ✓';
                    color: #0f0;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(hintOverlay);
        
        // Auto-desaparece após 3 segundos com transição suave
        setTimeout(() => {
            hintOverlay.classList.add('fade-out');
            
            setTimeout(() => {
                hintOverlay.remove();
                style.remove();
                callback();
            }, 1000); // Aguarda a transição de fade out completar (1s)
        }, 3000); // 3 segundos visível
    }
    
    /**
     * Som de boot estilo computador antigo
     */
    _playBootSound() {
        try {
            const ctx = this.sound.context;
            if (!ctx || ctx.state === 'suspended') return;
            
            // Sequência de beeps estilo POST
            const playBeep = (freq, time, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = freq;
                gain.gain.value = 0.1;
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + time);
                osc.stop(ctx.currentTime + time + duration);
            };
            
            // Boot beep sequence
            playBeep(800, 0, 0.1);
            playBeep(1000, 0.15, 0.1);
            playBeep(1200, 0.3, 0.15);
        } catch (e) {}
    }
    
    /**
     * Handler: Clique no overlay
     */
    _handleClick(e) {
        if (this.state === 'attract') {
            // Clique em qualquer lugar = entra no menu
            this._enterMenuMode();
        }
    }
    
    /**
     * Handler: Teclas
     */
    _handleKeydown(e) {
        if (this.isTransitioning) return;
        
        if (this.state === 'attract') {
            // Qualquer tecla = entra no menu
            if (['Enter', 'Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
                this._enterMenuMode();
            }
        } else if (this.state === 'menu') {
            switch (e.code) {
                case 'ArrowUp':
                    this._navigateMenu(-1);
                    break;
                case 'ArrowDown':
                    this._navigateMenu(1);
                    break;
                case 'Enter':
                case 'Space':
                    this._executeMenuAction();
                    break;
                case 'Escape':
                    this._exitMenuMode();
                    break;
            }
        }
    }
    
    /**
     * Entra no modo Menu
     */
    _enterMenuMode() {
        if (this.state !== 'attract') return;
        
        console.log('[StartScene] Entrando no Menu Mode...');
        this._playSelectSound();
        
        // Esconde "PRESS START", mostra menu
        const pressStart = this.gameOverlay.querySelector('#press-start-text');
        const menu = this.gameOverlay.querySelector('#retro-menu');
        
        pressStart.classList.add('hidden');
        menu.classList.add('visible');
        
        this.state = 'menu';
        this._updateMenuSelection();
    }
    
    /**
     * Volta para Attract Mode
     */
    _exitMenuMode() {
        if (this.state !== 'menu') return;
        
        this._playBackSound();
        
        const pressStart = this.gameOverlay.querySelector('#press-start-text');
        const menu = this.gameOverlay.querySelector('#retro-menu');
        
        menu.classList.remove('visible');
        pressStart.classList.remove('hidden');
        
        this.state = 'attract';
    }
    
    /**
     * Navega o menu (cima/baixo)
     */
    _navigateMenu(direction) {
        const oldIndex = this.selectedIndex;
        let newIndex = this.selectedIndex + direction;
        
        // Wrap around
        if (newIndex < 0) newIndex = this.menuOptions.length - 1;
        if (newIndex >= this.menuOptions.length) newIndex = 0;
        
        this.selectedIndex = newIndex;
        
        if (oldIndex !== newIndex) {
            this._playNavigateSound();
            this._updateMenuSelection();
        }
    }
    
    /**
     * Atualiza visual da seleção
     */
    _updateMenuSelection() {
        const items = this.gameOverlay.querySelectorAll('.menu-item');
        
        items.forEach((item, i) => {
            if (i === this.selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    /**
     * Executa a ação do menu selecionado
     */
    _executeMenuAction() {
        const option = this.menuOptions[this.selectedIndex];
        
        if (!option.enabled) {
            this._playBlockedSound();
            return;
        }
        
        this.isTransitioning = true;
        this._playConfirmSound();
        
        console.log(`[StartScene] Ação: ${option.id}`);
        
        switch (option.id) {
            case 'continue':
                this._startGame(true);
                break;
            case 'new':
                // Limpa save anterior
                localStorage.removeItem('hylomorph_data');
                this._startGame(false);
                break;
            case 'settings':
                // Abre settings do menu
                this._openSettingsFromMenu();
                break;
        }
    }
    
    /**
     * Inicia o jogo
     */
    _startGame(loadSave) {
        console.log(`[StartScene] Iniciando jogo. LoadSave: ${loadSave}`);
        
        // Fade out do áudio
        const fadeAudio = () => {
            if (this.audioElement && this.audioElement.volume > 0.05) {
                this.audioElement.volume -= 0.05;
                setTimeout(fadeAudio, 40);
            } else if (this.audioElement) {
                this.audioElement.pause();
            }
        };
        fadeAudio();
        
        // Fade out visual
        this.videoElement.classList.add('fade-out');
        this.gameOverlay.style.opacity = '0';
        
        // Transição para SanctuaryScene
        setTimeout(() => {
            this._cleanup();
            this.scene.start('SanctuaryScene', { 
                loadGame: loadSave,
                newGame: !loadSave
            });
        }, 800);
    }
    
    /**
     * Abre o painel de configurações do menu
     */
    _openSettingsFromMenu() {
        this.isTransitioning = false;
        this.settingsOpen = true;
        this.pendingResolution = this.currentResolution;
        this.settingsModal.classList.add('open');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SONS (usando AudioContext para sons retro simples)
    // ═══════════════════════════════════════════════════════════════
    
    _playSelectSound() {
        this._playTone(800, 0.1, 'square');
    }
    
    _playNavigateSound() {
        this._playTone(400, 0.05, 'square');
    }
    
    _playConfirmSound() {
        this._playTone(600, 0.08, 'square');
        setTimeout(() => this._playTone(900, 0.12, 'square'), 80);
    }
    
    _playBlockedSound() {
        this._playTone(150, 0.15, 'square');
    }
    
    _playBackSound() {
        this._playTone(300, 0.08, 'square');
    }
    
    _playTone(frequency, duration, type = 'sine') {
        try {
            const ctx = this.sound.context;
            if (!ctx || ctx.state === 'suspended') return;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = type;
            osc.frequency.value = frequency;
            gain.gain.value = 0.15;
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) { }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    
    _cleanup() {
        document.removeEventListener('keydown', this._handleKeydown);
        
        // Para partículas
        this._stopParticles();
        if (this._handleResize) {
            window.removeEventListener('resize', this._handleResize);
        }
        
        if (this.videoElement?.parentNode) {
            this.videoElement.pause();
            this.videoElement.remove();
        }
        
        if (this.audioElement?.parentNode) {
            this.audioElement.pause();
            this.audioElement.remove();
        }
        
        this.bootOverlay?.remove();
        this.loadingOverlay?.remove();
        this.gameOverlay?.remove();
        this.settingsModal?.remove();
        this.particleCanvas?.remove();
        this.styleElement?.remove();
        
        this.videoElement = null;
        this.audioElement = null;
        this.bootOverlay = null;
        this.loadingOverlay = null;
        this.gameOverlay = null;
        this.settingsModal = null;
        this.particleCanvas = null;
        this.particleCtx = null;
        this.particles = [];
        this.styleElement = null;
        
        console.log('[StartScene] Cleanup completo.');
    }
    
    shutdown() {
        this._cleanup();
    }
}
