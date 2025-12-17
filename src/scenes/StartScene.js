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

export class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
        
        // Estado da cena
        this.state = 'boot'; // 'boot' | 'attract' | 'menu'
        this.isTransitioning = false;
        
        // Menu state
        this.selectedIndex = 0;
        this.menuOptions = [];
        this.hasSaveData = false;
        
        // Elementos DOM
        this.videoElement = null;
        this.audioElement = null;
        this.bootOverlay = null;
        this.gameOverlay = null;
        this.styleElement = null;
        
        // Bind handlers
        this._handlePowerOn = this._handlePowerOn.bind(this);
        this._handleKeydown = this._handleKeydown.bind(this);
        this._handleClick = this._handleClick.bind(this);
    }
    
    preload() {
        // Nada a precarregar - usamos elementos HTML nativos
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
        this._createAudio();
        this._createBootOverlay();
        this._createGameOverlay();
        
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
            
            /* ═══ VIDEO BACKGROUND ═══ */
            #intro-video {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 10;
                object-fit: contain;
                background: #000;
                transform: translateZ(0);
                -webkit-backface-visibility: hidden;
                will-change: opacity;
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
                animation: blink-text 1s ease-in-out infinite;
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
        
        this.bootOverlay.addEventListener('click', this._handlePowerOn);
        document.body.appendChild(this.bootOverlay);
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
            <div id="game-footer">© 2024 TALES SANTIAGO | v0.1.0</div>
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
     * Handler: "Power On" - Inicia vídeo e áudio
     */
    _handlePowerOn() {
        if (this.state !== 'boot') return;
        
        console.log('[StartScene] POWER ON! Iniciando título...');
        
        // Desbloqueia AudioContext
        if (this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }
        
        // Inicia vídeo e áudio
        this.videoElement.play();
        this.audioElement.play();
        
        // Fade out do boot overlay
        this.bootOverlay.classList.add('fade-out');
        setTimeout(() => this.bootOverlay?.remove(), 500);
        
        // Mostra "PRESS START" (Attract Mode)
        setTimeout(() => {
            this.gameOverlay.classList.add('visible');
            this.state = 'attract';
            
            // Adiciona listeners
            document.addEventListener('keydown', this._handleKeydown);
            this.gameOverlay.addEventListener('click', this._handleClick);
            
            console.log('[StartScene] Attract Mode ativo. Aguardando START...');
        }, 600);
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
                // Placeholder - abre settings
                this._openSettings();
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
     * Abre configurações (placeholder)
     */
    _openSettings() {
        // Por enquanto, apenas feedback de "não implementado"
        this._playBlockedSound();
        this.isTransitioning = false;
        
        // Pisca o item pra feedback
        const item = this.gameOverlay.querySelector(`[data-id="settings"]`);
        item.style.color = '#ff4444';
        setTimeout(() => {
            item.style.color = '';
        }, 200);
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
        
        if (this.videoElement?.parentNode) {
            this.videoElement.pause();
            this.videoElement.remove();
        }
        
        if (this.audioElement?.parentNode) {
            this.audioElement.pause();
            this.audioElement.remove();
        }
        
        this.bootOverlay?.remove();
        this.gameOverlay?.remove();
        this.styleElement?.remove();
        
        this.videoElement = null;
        this.audioElement = null;
        this.bootOverlay = null;
        this.gameOverlay = null;
        this.styleElement = null;
        
        console.log('[StartScene] Cleanup completo.');
    }
    
    shutdown() {
        this._cleanup();
    }
}
