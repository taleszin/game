/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HYLOMORPH - START SCENE (BIOS Pattern)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sequência de inicialização estilo SNES/16-bit:
 * 1. "Power Off" - Tela preta com botão "INITIALIZE SYSTEM"
 * 2. "Title Screen" - Vídeo + Áudio sincronizados após clique
 * 3. "Press Start" - Segundo clique inicia o jogo
 */

export class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
        
        // Estado
        this.isTitleScreenActive = false;
        this.isTransitioning = false;
        
        // Elementos DOM
        this.videoElement = null;
        this.audioElement = null;
        this.bootOverlay = null;
        this.pressStartOverlay = null;
        this.styleElement = null;
        
        // Bind handlers
        this._handlePowerOn = this._handlePowerOn.bind(this);
        this._handleStartGame = this._handleStartGame.bind(this);
        this._handleKeydown = this._handleKeydown.bind(this);
    }
    
    preload() {
        // Nada a precarregar - usamos elementos HTML nativos
    }
    
    create() {
        // ═══════════════════════════════════════════════════════════════
        // INJETA CSS
        // ═══════════════════════════════════════════════════════════════
        this._injectStyles();
        
        // ═══════════════════════════════════════════════════════════════
        // CRIA VÍDEO (PAUSADO)
        // ═══════════════════════════════════════════════════════════════
        this._createVideo();
        
        // ═══════════════════════════════════════════════════════════════
        // CRIA ÁUDIO (PAUSADO)
        // ═══════════════════════════════════════════════════════════════
        this._createAudio();
        
        // ═══════════════════════════════════════════════════════════════
        // CRIA BOOT OVERLAY ("POWER OFF" STATE)
        // ═══════════════════════════════════════════════════════════════
        this._createBootOverlay();
        
        // ═══════════════════════════════════════════════════════════════
        // CRIA PRESS START OVERLAY (INICIALMENTE OCULTO)
        // ═══════════════════════════════════════════════════════════════
        this._createPressStartOverlay();
        
        console.log('[StartScene] Sistema em standby. Aguardando power on...');
    }
    
    /**
     * Injeta CSS necessário para as animações
     */
    _injectStyles() {
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'start-scene-styles';
        this.styleElement.textContent = `
            /* ═══ ANIMAÇÕES ═══ */
            @keyframes blink-cursor {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            
            @keyframes blink-text {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.15; }
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
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
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
            
            #boot-overlay .power-btn:active {
                transform: scale(0.98);
            }
            
            #boot-overlay.fade-out {
                animation: fade-out 0.5s ease-out forwards;
                pointer-events: none;
            }
            
            /* ═══ VIDEO BACKGROUND ═══ */
            #intro-video {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 10;
                object-fit: cover;
                background: #000;
            }
            
            #intro-video.fade-out {
                animation: fade-out 0.8s ease-out forwards;
            }
            
            /* ═══ PRESS START OVERLAY ═══ */
            #press-start-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 15;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                padding-bottom: 80px;
                cursor: pointer;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.5s;
            }
            
            #press-start-overlay.visible {
                opacity: 1;
                pointer-events: auto;
            }
            
            #press-start-overlay .press-start-text {
                font-family: 'Press Start 2P', monospace;
                font-size: 18px;
                color: #fff;
                text-shadow: 
                    0 0 10px rgba(255, 255, 255, 0.8),
                    0 0 20px rgba(0, 255, 255, 0.6),
                    0 0 30px rgba(0, 255, 255, 0.4),
                    2px 2px 0 #000;
                letter-spacing: 4px;
                animation: blink-text 1.2s ease-in-out infinite;
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
        this.videoElement.muted = false; // Queremos áudio, mas pelo elemento separado
        this.videoElement.src = 'title-screen.mp4';
        this.videoElement.muted = true; // Vídeo mudo, áudio separado
        
        document.body.appendChild(this.videoElement);
    }
    
    /**
     * Cria o elemento de áudio (pausado)
     */
    _createAudio() {
        this.audioElement = document.createElement('audio');
        this.audioElement.id = 'intro-audio';
        this.audioElement.loop = true;
        this.audioElement.volume = 0.7;
        this.audioElement.src = 'title-screen.mp3';
        
        document.body.appendChild(this.audioElement);
    }
    
    /**
     * Cria o overlay de boot (estado "Power Off")
     */
    _createBootOverlay() {
        this.bootOverlay = document.createElement('div');
        this.bootOverlay.id = 'boot-overlay';
        this.bootOverlay.innerHTML = `
            <div class="terminal-text">
                > SYSTEM STANDBY<span class="cursor">_</span>
            </div>
            <button class="power-btn">[ INITIALIZE SYSTEM ]</button>
        `;
        
        // Listener de clique
        this.bootOverlay.addEventListener('click', this._handlePowerOn);
        
        document.body.appendChild(this.bootOverlay);
    }
    
    /**
     * Cria o overlay "Press Start" (inicialmente oculto)
     */
    _createPressStartOverlay() {
        this.pressStartOverlay = document.createElement('div');
        this.pressStartOverlay.id = 'press-start-overlay';
        this.pressStartOverlay.innerHTML = `
            <div class="press-start-text">PRESS START</div>
        `;
        
        // Listener de clique
        this.pressStartOverlay.addEventListener('click', this._handleStartGame);
        
        document.body.appendChild(this.pressStartOverlay);
    }
    
    /**
     * Handler: "Power On" - Inicia vídeo e áudio sincronizados
     */
    _handlePowerOn() {
        if (this.isTitleScreenActive) return;
        
        console.log('[StartScene] POWER ON! Iniciando título...');
        
        // ═══════════════════════════════════════════════════════════════
        // DESBLOQUEIA AUDIO CONTEXT DO PHASER
        // ═══════════════════════════════════════════════════════════════
        if (this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }
        
        // ═══════════════════════════════════════════════════════════════
        // INICIA VÍDEO E ÁUDIO SINCRONIZADOS
        // ═══════════════════════════════════════════════════════════════
        // Ambos .play() na mesma execução = sincronia perfeita
        this.videoElement.play();
        this.audioElement.play();
        
        // ═══════════════════════════════════════════════════════════════
        // FADE OUT DO BOOT OVERLAY
        // ═══════════════════════════════════════════════════════════════
        this.bootOverlay.classList.add('fade-out');
        
        setTimeout(() => {
            if (this.bootOverlay && this.bootOverlay.parentNode) {
                this.bootOverlay.remove();
            }
        }, 500);
        
        // ═══════════════════════════════════════════════════════════════
        // MOSTRA "PRESS START"
        // ═══════════════════════════════════════════════════════════════
        setTimeout(() => {
            this.pressStartOverlay.classList.add('visible');
            this.isTitleScreenActive = true;
            
            // Adiciona listener de teclado
            document.addEventListener('keydown', this._handleKeydown);
            
            console.log('[StartScene] Title Screen ativo. Aguardando START...');
        }, 600);
    }
    
    /**
     * Handler: Teclas (Enter/Space para iniciar)
     */
    _handleKeydown(e) {
        if (e.code === 'Enter' || e.code === 'Space') {
            this._handleStartGame();
        }
    }
    
    /**
     * Handler: "Start Game" - Transição para o jogo
     */
    _handleStartGame() {
        if (!this.isTitleScreenActive || this.isTransitioning) return;
        this.isTransitioning = true;
        
        console.log('[StartScene] START GAME!');
        
        // ═══════════════════════════════════════════════════════════════
        // FADE OUT ÁUDIO
        // ═══════════════════════════════════════════════════════════════
        const fadeAudio = () => {
            if (this.audioElement && this.audioElement.volume > 0.05) {
                this.audioElement.volume -= 0.05;
                setTimeout(fadeAudio, 50);
            } else if (this.audioElement) {
                this.audioElement.pause();
            }
        };
        fadeAudio();
        
        // ═══════════════════════════════════════════════════════════════
        // FADE OUT VISUAL
        // ═══════════════════════════════════════════════════════════════
        this.videoElement.classList.add('fade-out');
        this.pressStartOverlay.style.opacity = '0';
        
        // ═══════════════════════════════════════════════════════════════
        // TRANSIÇÃO PARA O MENU
        // ═══════════════════════════════════════════════════════════════
        setTimeout(() => {
            this._cleanup();
            this.scene.start('MainMenuScene');
        }, 800);
    }
    
    /**
     * Remove todos os elementos DOM criados
     */
    _cleanup() {
        // Remove event listeners
        document.removeEventListener('keydown', this._handleKeydown);
        
        // Remove elementos
        if (this.videoElement && this.videoElement.parentNode) {
            this.videoElement.pause();
            this.videoElement.remove();
        }
        
        if (this.audioElement && this.audioElement.parentNode) {
            this.audioElement.pause();
            this.audioElement.remove();
        }
        
        if (this.bootOverlay && this.bootOverlay.parentNode) {
            this.bootOverlay.remove();
        }
        
        if (this.pressStartOverlay && this.pressStartOverlay.parentNode) {
            this.pressStartOverlay.remove();
        }
        
        if (this.styleElement && this.styleElement.parentNode) {
            this.styleElement.remove();
        }
        
        // Limpa referências
        this.videoElement = null;
        this.audioElement = null;
        this.bootOverlay = null;
        this.pressStartOverlay = null;
        this.styleElement = null;
        
        console.log('[StartScene] Cleanup completo.');
    }
    
    /**
     * Cleanup forçado se a cena for desligada
     */
    shutdown() {
        this._cleanup();
    }
}
