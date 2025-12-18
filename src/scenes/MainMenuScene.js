/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HYLOMORPH - MAIN MENU SCENE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Hub central do jogo com estética "Bio-Hazard Terminal".
 * Interface construída inteiramente com DOM/CSS.
 */

const SAVE_KEY = 'hylomorph_sanctuary_data';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
        
        // Elementos DOM
        this.menuContainer = null;
        this.styleElement = null;
        
        // Estado
        this.hasSaveData = false;
        this.selectedIndex = 0;
        this.menuItems = [];
        
        // Bind handlers
        this._handleKeydown = this._handleKeydown.bind(this);
    }
    
    preload() {
        // Sons do menu (se disponíveis)
        // this.load.audio('menu-hover', 'sfx/menu-hover.mp3');
        // this.load.audio('menu-select', 'sfx/menu-select.mp3');
        // this.load.audio('menu-denied', 'sfx/menu-denied.mp3');
        
        // Pre-registra background para carregar depois (não carrega agora)
        this.backgroundLoaded = false;
    }
    
    create() {
        // Verifica se existe save
        this.hasSaveData = this._checkSaveData();
        
        // Injeta estilos
        this._injectStyles();
        
        // Cria menu HTML
        this._createMenu();
        
        // Event listeners
        document.addEventListener('keydown', this._handleKeydown);
        
        console.log('[MainMenu] Menu criado. Save existe:', this.hasSaveData);
    }
    
    /**
     * Verifica se existe dados salvos
     */
    _checkSaveData() {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            return data !== null && data !== '';
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Injeta estilos CSS do menu
     */
    _injectStyles() {
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'main-menu-styles';
        this.styleElement.textContent = `
            /* ═══ CONTAINER PRINCIPAL ═══ */
            #main-menu {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 100;
                background: 
                    linear-gradient(180deg, 
                        rgba(0, 10, 15, 0.98) 0%, 
                        rgba(0, 5, 10, 0.99) 50%,
                        rgba(0, 15, 20, 0.98) 100%
                    );
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding-left: 10%;
                font-family: 'Press Start 2P', 'Courier New', monospace;
                overflow: hidden;
            }
            
            /* Grid de fundo */
            #main-menu::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: 
                    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
                background-size: 40px 40px;
                pointer-events: none;
            }
            
            /* Scanlines */
            #main-menu::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(0, 0, 0, 0.1) 0px,
                    rgba(0, 0, 0, 0.1) 1px,
                    transparent 1px,
                    transparent 3px
                );
                pointer-events: none;
            }
            
            /* ═══ HEADER ═══ */
            .menu-header {
                position: relative;
                margin-bottom: 60px;
            }
            
            .menu-title {
                font-size: 28px;
                color: #0ff;
                letter-spacing: 8px;
                text-shadow: 
                    0 0 20px rgba(0, 255, 255, 0.8),
                    0 0 40px rgba(0, 255, 255, 0.4),
                    0 0 60px rgba(0, 255, 255, 0.2);
                margin-bottom: 16px;
                animation: title-pulse 3s ease-in-out infinite;
            }
            
            @keyframes title-pulse {
                0%, 100% { 
                    text-shadow: 
                        0 0 20px rgba(0, 255, 255, 0.8),
                        0 0 40px rgba(0, 255, 255, 0.4);
                }
                50% { 
                    text-shadow: 
                        0 0 30px rgba(0, 255, 255, 1),
                        0 0 60px rgba(0, 255, 255, 0.6),
                        0 0 80px rgba(0, 255, 255, 0.3);
                }
            }
            
            .menu-subtitle {
                font-size: 8px;
                color: #0a6;
                letter-spacing: 3px;
                opacity: 0.8;
            }
            
            .menu-version {
                position: absolute;
                top: 0;
                right: 10%;
                font-size: 8px;
                color: #333;
            }
            
            /* ═══ DECORAÇÃO DE JANELA ═══ */
            .menu-window {
                position: relative;
                border: 1px solid rgba(0, 255, 255, 0.2);
                padding: 30px 40px;
                max-width: 500px;
                background: rgba(0, 20, 30, 0.5);
            }
            
            .menu-window::before {
                content: '[ MAIN MENU ]';
                position: absolute;
                top: -10px;
                left: 20px;
                font-size: 8px;
                color: #0ff;
                background: rgba(0, 10, 15, 1);
                padding: 0 10px;
                letter-spacing: 2px;
            }
            
            /* Cantos decorativos */
            .menu-window::after {
                content: '';
                position: absolute;
                top: -1px;
                right: -1px;
                width: 20px;
                height: 20px;
                border-top: 1px solid #0ff;
                border-right: 1px solid #0ff;
            }
            
            .corner-bl {
                position: absolute;
                bottom: -1px;
                left: -1px;
                width: 20px;
                height: 20px;
                border-bottom: 1px solid #0ff;
                border-left: 1px solid #0ff;
            }
            
            /* ═══ BOTÕES DO MENU ═══ */
            .menu-btn {
                display: block;
                width: 100%;
                padding: 16px 20px;
                margin-bottom: 8px;
                font-family: inherit;
                font-size: 14px;
                color: #556;
                background: transparent;
                border: none;
                text-align: left;
                cursor: pointer;
                position: relative;
                transition: all 0.1s;
                letter-spacing: 2px;
            }
            
            .menu-btn::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 0;
                height: 2px;
                background: #0ff;
                transition: width 0.1s;
            }
            
            .menu-btn:hover:not(.disabled),
            .menu-btn.selected:not(.disabled) {
                color: #fff;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                padding-left: 30px;
            }
            
            .menu-btn:hover:not(.disabled)::before,
            .menu-btn.selected:not(.disabled)::before {
                width: 20px;
            }
            
            .menu-btn:active:not(.disabled) {
                color: #0ff;
            }
            
            /* Estado desabilitado */
            .menu-btn.disabled {
                color: #223;
                cursor: not-allowed;
            }
            
            .menu-btn.disabled::after {
                content: '[NO DATA]';
                font-size: 6px;
                color: #333;
                margin-left: 20px;
                letter-spacing: 1px;
            }
            
            /* ═══ FOOTER INFO ═══ */
            .menu-footer {
                position: absolute;
                bottom: 40px;
                left: 10%;
                font-size: 7px;
                color: #334;
                letter-spacing: 1px;
            }
            
            .menu-footer span {
                color: #0a6;
            }
            
            /* ═══ ANIMAÇÕES ═══ */
            .menu-window {
                animation: window-appear 0.5s ease-out;
            }
            
            @keyframes window-appear {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Fade out */
            #main-menu.fade-out {
                animation: menu-fade-out 0.5s ease-out forwards;
            }
            
            @keyframes menu-fade-out {
                to {
                    opacity: 0;
                    transform: scale(1.05);
                }
            }
            
            /* ═══ CONFIRM DIALOG ═══ */
            .confirm-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 200;
                animation: fade-in 0.2s;
            }
            
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .confirm-box {
                background: rgba(10, 20, 30, 0.98);
                border: 1px solid #f80;
                padding: 30px 40px;
                text-align: center;
                max-width: 400px;
            }
            
            .confirm-box .warning-icon {
                font-size: 24px;
                margin-bottom: 16px;
            }
            
            .confirm-box .confirm-text {
                font-size: 10px;
                color: #f80;
                margin-bottom: 24px;
                line-height: 1.8;
            }
            
            .confirm-box .confirm-btns {
                display: flex;
                gap: 20px;
                justify-content: center;
            }
            
            .confirm-box .confirm-btn {
                padding: 12px 24px;
                font-family: inherit;
                font-size: 10px;
                background: transparent;
                border: 1px solid;
                cursor: pointer;
                letter-spacing: 2px;
                transition: all 0.1s;
            }
            
            .confirm-box .confirm-btn.yes {
                color: #f44;
                border-color: #f44;
            }
            
            .confirm-box .confirm-btn.yes:hover {
                background: rgba(255, 68, 68, 0.2);
            }
            
            .confirm-box .confirm-btn.no {
                color: #0ff;
                border-color: #0ff;
            }
            
            .confirm-box .confirm-btn.no:hover {
                background: rgba(0, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(this.styleElement);
    }
    
    /**
     * Cria o menu HTML
     */
    _createMenu() {
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'main-menu';
        
        this.menuContainer.innerHTML = `
            <div class="menu-header">
                <div class="menu-title">HYLOMORPH</div>
                <div class="menu-subtitle">BIOLOGICAL SYNTHESIS TERMINAL</div>
                <div class="menu-version">v1.0.0</div>
            </div>
            
            <div class="menu-window">
                <div class="corner-bl"></div>
                
                <button class="menu-btn ${!this.hasSaveData ? 'disabled' : ''}" data-action="continue">
                    CONTINUAR
                </button>
                
                <button class="menu-btn" data-action="newgame">
                    NOVO EXPERIMENTO
                </button>
                
                <button class="menu-btn" data-action="settings">
                    CONFIGURAÇÕES
                </button>
            </div>
            
            <div class="menu-footer">
                PRESS <span>[ENTER]</span> TO SELECT · <span>[↑↓]</span> TO NAVIGATE
            </div>
        `;
        
        document.body.appendChild(this.menuContainer);
        
        // Captura botões
        this.menuItems = Array.from(this.menuContainer.querySelectorAll('.menu-btn'));
        
        // Define seleção inicial
        this.selectedIndex = this.hasSaveData ? 0 : 1;
        this._updateSelection();
        
        // Event listeners nos botões
        this.menuItems.forEach((btn, index) => {
            btn.addEventListener('mouseenter', () => {
                if (!btn.classList.contains('disabled')) {
                    this.selectedIndex = index;
                    this._updateSelection();
                    this._playSound('hover');
                }
            });
            
            btn.addEventListener('click', () => {
                this._handleAction(btn.dataset.action);
            });
        });
    }
    
    /**
     * Atualiza seleção visual
     */
    _updateSelection() {
        this.menuItems.forEach((btn, index) => {
            btn.classList.toggle('selected', index === this.selectedIndex);
        });
    }
    
    /**
     * Handler de teclado
     */
    _handleKeydown(e) {
        switch (e.code) {
            case 'ArrowUp':
                e.preventDefault();
                this._navigateMenu(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this._navigateMenu(1);
                break;
            case 'Enter':
            case 'Space':
                e.preventDefault();
                const action = this.menuItems[this.selectedIndex]?.dataset.action;
                if (action) this._handleAction(action);
                break;
        }
    }
    
    /**
     * Navega pelo menu
     */
    _navigateMenu(direction) {
        let newIndex = this.selectedIndex + direction;
        
        // Loop
        if (newIndex < 0) newIndex = this.menuItems.length - 1;
        if (newIndex >= this.menuItems.length) newIndex = 0;
        
        // Pula itens desabilitados
        const startIndex = newIndex;
        while (this.menuItems[newIndex].classList.contains('disabled')) {
            newIndex += direction || 1;
            if (newIndex < 0) newIndex = this.menuItems.length - 1;
            if (newIndex >= this.menuItems.length) newIndex = 0;
            if (newIndex === startIndex) break; // Evita loop infinito
        }
        
        this.selectedIndex = newIndex;
        this._updateSelection();
        this._playSound('hover');
    }
    
    /**
     * Executa ação do menu
     */
    _handleAction(action) {
        switch (action) {
            case 'continue':
                if (!this.hasSaveData) {
                    this._playSound('denied');
                    return;
                }
                this._playSound('select');
                this._startGame(true);
                break;
                
            case 'newgame':
                this._playSound('select');
                if (this.hasSaveData) {
                    this._showConfirmDialog();
                } else {
                    // Novo jogo sem save existente - limpa tutorial
                    localStorage.removeItem('hylomorph_tutorial_done');
                    this._startGame(false);
                }
                break;
                
            case 'settings':
                this._playSound('denied');
                // TODO: Implementar settings
                console.log('[MainMenu] Settings não implementado ainda.');
                break;
        }
    }
    
    /**
     * Mostra diálogo de confirmação
     */
    _showConfirmDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-box">
                <div class="warning-icon">⚠️</div>
                <div class="confirm-text">
                    DADOS EXISTENTES SERÃO<br>
                    PERMANENTEMENTE APAGADOS.<br><br>
                    DESEJA CONTINUAR?
                </div>
                <div class="confirm-btns">
                    <button class="confirm-btn yes">APAGAR</button>
                    <button class="confirm-btn no">CANCELAR</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Event listeners
        overlay.querySelector('.confirm-btn.yes').addEventListener('click', () => {
            this._playSound('select');
            overlay.remove();
            this._clearSaveData();
            this._startGame(false);
        });
        
        overlay.querySelector('.confirm-btn.no').addEventListener('click', () => {
            this._playSound('select');
            overlay.remove();
        });
        
        // ESC para fechar
        const escHandler = (e) => {
            if (e.code === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    /**
     * Limpa dados salvos
     */
    _clearSaveData() {
        try {
            localStorage.removeItem(SAVE_KEY);
            localStorage.removeItem('hylomorph_tutorial_done');
            console.log('[MainMenu] Save data limpo. Tutorial será mostrado.');
        } catch (e) {
            console.error('[MainMenu] Erro ao limpar save:', e);
        }
    }
    
    /**
     * Inicia o jogo
     */
    _startGame(loadGame) {
        console.log(`[MainMenu] Iniciando jogo. LoadGame: ${loadGame}`);
        
        // Mostra loading overlay
        this._showLoadingOverlay();
        
        // Carrega assets necessários
        this._loadGameAssets(() => {
            // Assets carregados - transição
            this.menuContainer.classList.add('fade-out');
            
            setTimeout(() => {
                this._cleanup();
                this.scene.start('SanctuaryScene', { 
                    loadGame: loadGame,
                    newGame: !loadGame 
                });
            }, 300);
        });
    }
    
    /**
     * Mostra overlay de loading
     */
    _showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-text">PREPARANDO SANTUÁRIO</div>
                <div class="loading-bar-container">
                    <div class="loading-bar-fill"></div>
                </div>
                <div class="loading-status">Carregando ambiente...</div>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 5, 10, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: 'Press Start 2P', monospace;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            #loading-overlay .loading-content {
                text-align: center;
            }
            #loading-overlay .loading-text {
                color: #0ff;
                font-size: 14px;
                margin-bottom: 20px;
                text-shadow: 0 0 10px #0ff;
                animation: pulse-glow 1s ease-in-out infinite;
            }
            #loading-overlay .loading-bar-container {
                width: 300px;
                height: 8px;
                background: #111;
                border: 1px solid #0ff;
                margin: 0 auto 15px;
            }
            #loading-overlay .loading-bar-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #0ff, #0f0);
                box-shadow: 0 0 10px #0ff;
                transition: width 0.3s ease;
            }
            #loading-overlay .loading-status {
                color: #666;
                font-size: 8px;
            }
            @keyframes pulse-glow {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        overlay.appendChild(style);
        document.body.appendChild(overlay);
        this.loadingOverlay = overlay;
    }
    
    /**
     * Atualiza barra de loading
     */
    _updateLoadingProgress(percent, status) {
        if (!this.loadingOverlay) return;
        const fill = this.loadingOverlay.querySelector('.loading-bar-fill');
        const statusEl = this.loadingOverlay.querySelector('.loading-status');
        if (fill) fill.style.width = `${percent}%`;
        if (statusEl) statusEl.textContent = status;
    }
    
    /**
     * Carrega assets do jogo (background, etc)
     */
    _loadGameAssets(callback) {
        this._updateLoadingProgress(10, 'Iniciando carregamento...');
        
        // Usa o loader do Phaser
        if (!this.textures.exists('sanctuary-bg')) {
            this._updateLoadingProgress(20, 'Carregando cenário...');
            
            // Caminho absoluto da raiz do servidor
            this.load.image('sanctuary-bg', 'background.png');
            
            // Handler de erro
            this.load.on('loaderror', (file) => {
                console.error('[MainMenu] Erro ao carregar:', file.key, file.src);
                // Continua mesmo sem background
                this._updateLoadingProgress(100, 'Pronto (fallback)');
                setTimeout(() => {
                    if (this.loadingOverlay) {
                        this.loadingOverlay.remove();
                        this.loadingOverlay = null;
                    }
                    callback();
                }, 200);
            });
            
            this.load.on('progress', (value) => {
                const percent = 20 + Math.floor(value * 70);
                this._updateLoadingProgress(percent, 'Carregando texturas...');
            });
            
            this.load.on('complete', () => {
                this._updateLoadingProgress(100, 'Pronto!');
                this.backgroundLoaded = true;
                
                // Remove overlay após pequeno delay
                setTimeout(() => {
                    if (this.loadingOverlay) {
                        this.loadingOverlay.remove();
                        this.loadingOverlay = null;
                    }
                    callback();
                }, 200);
            });
            
            this.load.start();
        } else {
            // Já carregado
            this._updateLoadingProgress(100, 'Pronto!');
            setTimeout(() => {
                if (this.loadingOverlay) {
                    this.loadingOverlay.remove();
                    this.loadingOverlay = null;
                }
                callback();
            }, 200);
        }
    }
    
    /**
     * Toca sons do menu
     */
    _playSound(type) {
        // Usa UISoundSystem se disponível
        if (window.uiSounds) {
            switch (type) {
                case 'hover':
                    window.uiSounds.playHover?.();
                    break;
                case 'select':
                    // Som de confirmação musicalmente mais rico
                    window.uiSounds.playSelect?.();
                    break;
                case 'denied':
                    window.uiSounds.playError?.();
                    break;
            }
        }
    }
    
    /**
     * Limpa elementos DOM
     */
    _cleanup() {
        document.removeEventListener('keydown', this._handleKeydown);
        
        if (this.menuContainer && this.menuContainer.parentNode) {
            this.menuContainer.remove();
        }
        
        if (this.styleElement && this.styleElement.parentNode) {
            this.styleElement.remove();
        }
        
        this.menuContainer = null;
        this.styleElement = null;
        this.menuItems = [];
        
        console.log('[MainMenu] Cleanup completo.');
    }
    
    /**
     * Cleanup forçado
     */
    shutdown() {
        this._cleanup();
    }
}
