/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HYLOMORPH - TUTORIAL SYSTEM (FTUE - Non-Intrusive Guidance)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de onboarding que NÃO escurece a tela.
 * Usa "Invisible Shield" + Glow Neon + Floating Pointer
 */

const TUTORIAL_STORAGE_KEY = 'hylomorph_tutorial_done';

// Estados do Tutorial
const STEPS = {
    IDLE: 'IDLE',
    WELCOME: 'WELCOME',
    OPEN_LAB: 'OPEN_LAB',
    SELECT_CIRCLE: 'SELECT_CIRCLE',
    SELECT_CARBON: 'SELECT_CARBON',
    SELECT_LIGHT: 'SELECT_LIGHT',
    SYNTHESIZE_FIRST: 'SYNTHESIZE_FIRST',
    WAIT_FIRST_GOLEM: 'WAIT_FIRST_GOLEM',
    OBSERVE_FIRST: 'OBSERVE_FIRST',
    OPEN_LAB_SECOND: 'OPEN_LAB_SECOND',
    SELECT_SQUARE: 'SELECT_SQUARE',
    SELECT_IRON: 'SELECT_IRON',
    SELECT_ELECTRICITY: 'SELECT_ELECTRICITY',
    SYNTHESIZE_SECOND: 'SYNTHESIZE_SECOND',
    WAIT_SECOND_GOLEM: 'WAIT_SECOND_GOLEM',
    BREED: 'BREED',
    WAIT_BREED: 'WAIT_BREED',
    // === NOVOS PASSOS: FERRAMENTAS ===
    SHOW_TOOLS: 'SHOW_TOOLS',
    SELECT_KILL_TOOL: 'SELECT_KILL_TOOL',
    USE_KILL_TOOL: 'USE_KILL_TOOL',
    WAIT_KILL: 'WAIT_KILL',
    // =================================
    FINISH: 'FINISH',
    DONE: 'DONE'
};

// Configuração de cada passo
const STEP_CONFIG = {
    [STEPS.WELCOME]: {
        type: 'modal',
        icon: '',
        title: 'HYLOMORPH',
        message: 'Bem vindo, cientista ! \nVamos calibrar seu acesso ao laboratório com um rápido tutorial de criação e fusão de criaturas.',
        buttonText: 'INICIAR'
    },
    [STEPS.OPEN_LAB]: {
        type: 'highlight',
        selector: '#btn-open-lab',
        message: 'Abra a Estação de Síntese',
        pointerPos: 'left'
    },
    [STEPS.SELECT_CIRCLE]: {
        type: 'highlight',
        selector: '.option-item[data-id="circulo"]',
        message: 'Selecione: CÍRCULO',
        pointerPos: 'right',
        delay: 600  // Aguarda painel abrir e opções renderizarem
    },
    [STEPS.SELECT_CARBON]: {
        type: 'highlight',
        selector: '.option-item[data-id="carbono"]',
        message: 'Selecione: CARBONO',
        pointerPos: 'right'
    },
    [STEPS.SELECT_LIGHT]: {
        type: 'highlight',
        selector: '.option-item[data-id="luz"]',
        message: 'Selecione: LUZ',
        pointerPos: 'right'
    },
    [STEPS.SYNTHESIZE_FIRST]: {
        type: 'highlight',
        selector: '#btn-synthesize',
        message: 'SINTETIZAR!',
        pointerPos: 'top'
    },
    [STEPS.WAIT_FIRST_GOLEM]: {
        type: 'waiting',
        message: 'Materializando...'
    },
    [STEPS.OBSERVE_FIRST]: {
        type: 'tooltip',
        message: '✓ Primeira criatura criada!',
        subMessage: 'Observe-a no santuário.',
        autoAdvance: 2000
    },
    [STEPS.OPEN_LAB_SECOND]: {
        type: 'highlight',
        selector: '#btn-open-lab',
        message: 'Crie mais uma criatura',
        pointerPos: 'left',
        delay: 500
    },
    [STEPS.SELECT_SQUARE]: {
        type: 'highlight',
        selector: '.option-item[data-id="quadrado"]',
        message: 'Selecione: QUADRADO',
        pointerPos: 'right'
    },
    [STEPS.SELECT_IRON]: {
        type: 'highlight',
        selector: '.option-item[data-id="ferro"]',
        message: 'Selecione: FERRO',
        pointerPos: 'right'
    },
    [STEPS.SELECT_ELECTRICITY]: {
        type: 'highlight',
        selector: '.option-item[data-id="eletricidade"]',
        message: 'Selecione: ELETRICIDADE',
        pointerPos: 'right'
    },
    [STEPS.SYNTHESIZE_SECOND]: {
        type: 'highlight',
        selector: '#btn-synthesize',
        message: 'SINTETIZAR!',
        pointerPos: 'top'
    },
    [STEPS.WAIT_SECOND_GOLEM]: {
        type: 'waiting',
        message: 'Materializando...'
    },
    [STEPS.BREED]: {
        type: 'canvas',
        message: '🧬 Arraste uma criatura sobre a outra',
        subMessage: 'Isso iniciará a fusão genética'
    },
    [STEPS.WAIT_BREED]: {
        type: 'waiting',
        message: 'Fusão em andamento...'
    },
    // ═══════════════════════════════════════════════════════════════════
    // NOVOS PASSOS: FERRAMENTAS DE INTERAÇÃO
    // ═══════════════════════════════════════════════════════════════════
    [STEPS.SHOW_TOOLS]: {
        type: 'highlight',
        selector: '#tool-rack',
        message: '🛠️ Ferramentas de Interação',
        subMessage: 'Use para alimentar, queimar, congelar ou eliminar suas criaturas',
        pointerPos: 'left',
        delay: 800,
        clickThrough: true  // Permite ver mas não exige clique no elemento
    },
    [STEPS.SELECT_KILL_TOOL]: {
        type: 'highlight',
        selector: '.tool-slot[data-action="kill"]',
        message: 'Selecione: ELIMINAR ☠',
        subMessage: 'Clique para equipar a ferramenta',
        pointerPos: 'right'
    },
    [STEPS.USE_KILL_TOOL]: {
        type: 'canvas',
        message: '☠ Clique em uma criatura para eliminá-la',
        subMessage: 'O ciclo de vida é natural no Hylomorph'
    },
    [STEPS.WAIT_KILL]: {
        type: 'waiting',
        message: 'Eliminando...'
    },
    // ═══════════════════════════════════════════════════════════════════
    [STEPS.FINISH]: {
        type: 'modal',
        icon: '🧬',
        title: 'CALIBRAGEM COMPLETA',
        message: 'Acesso total concedido!\n\nVocê domina: criar, fundir e gerenciar suas criaturas.\n\nExplore todas as ferramentas e descubra novas formas!',
        buttonText: 'EXPLORAR',
        celebratory: true
    }
};

export class TutorialSystem {
    constructor(game) {
        this.game = game;
        this.currentStep = STEPS.IDLE;
        this.golemCount = 0;
        this.isActive = false;
        
        // Elementos UI
        this.blocker = null;
        this.tooltip = null;
        this.pointer = null;
        this.modal = null;
        this.modalBackdrop = null;
        this.breedHint = null;
        this.skipBtn = null;
        
        // Estado
        this._currentTarget = null;
        
        // Bindings
        this._onSpawnGolem = this._onSpawnGolem.bind(this);
        this._onBreedSuccess = this._onBreedSuccess.bind(this);
        this._onToolSelected = this._onToolSelected.bind(this);
        this._onGolemKilled = this._onGolemKilled.bind(this);
        
        // NÃO inicia automaticamente - espera chamada explícita
        console.log('[Tutorial] Sistema pronto. Aguardando ativação...');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Inicia o tutorial manualmente (chamado pela SanctuaryScene)
     * @param {boolean} force - Se true, ignora a flag de tutorial completo
     */
    start(force = false) {
        // Já está ativo?
        if (this.isActive) {
            console.log('[Tutorial] Já está ativo.');
            return;
        }
        
        // Já foi completado (e não está forçando)?
        if (!force && localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true') {
            console.log('[Tutorial] Já completado anteriormente.');
            this.currentStep = STEPS.DONE;
            return;
        }
        
        console.log('[Tutorial] Iniciando FTUE...');
        this._createUI();
        this._bindEvents();
        this.isActive = true;
        
        setTimeout(() => this._goToStep(STEPS.WELCOME), 600);
    }
    
    /**
     * Verifica se o tutorial já foi completado
     */
    isCompleted() {
        return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
    }
    
    _createUI() {
        // Escudo Invisível - bloqueia cliques fora do alvo
        this.blocker = document.createElement('div');
        this.blocker.className = 'tutorial-input-blocker';
        this.blocker.style.display = 'none';
        document.body.appendChild(this.blocker);
        
        // Tooltip Contextual
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tutorial-tooltip';
        this.tooltip.innerHTML = `
            <div class="tutorial-tooltip-message"></div>
            <div class="tutorial-tooltip-sub"></div>
        `;
        document.body.appendChild(this.tooltip);
        
        // Pointer Flutuante (Mãozinha)
        this.pointer = document.createElement('div');
        this.pointer.className = 'tutorial-pointer';
        this.pointer.textContent = '👆';
        document.body.appendChild(this.pointer);
        
        // Modal Backdrop
        this.modalBackdrop = document.createElement('div');
        this.modalBackdrop.className = 'tutorial-modal-backdrop';
        document.body.appendChild(this.modalBackdrop);
        
        // Modal (Welcome/Finish)
        this.modal = document.createElement('div');
        this.modal.className = 'tutorial-modal';
        this.modal.innerHTML = `
            <div class="tutorial-modal-icon"></div>
            <div class="tutorial-modal-title"></div>
            <div class="tutorial-modal-message"></div>
            <button class="tutorial-modal-btn"></button>
        `;
        document.body.appendChild(this.modal);
        
        // Evento do botão do modal
        this.modal.querySelector('.tutorial-modal-btn').addEventListener('click', () => {
            this._onModalConfirm();
        });
        
        // Hint de Breeding (Canvas)
        this.breedHint = document.createElement('div');
        this.breedHint.className = 'tutorial-breed-hint';
        this.breedHint.textContent = '↕';
        document.body.appendChild(this.breedHint);
        
        // Botão Skip
        this.skipBtn = document.createElement('button');
        this.skipBtn.className = 'tutorial-skip-btn';
        this.skipBtn.textContent = 'PULAR TUTORIAL';
        this.skipBtn.addEventListener('click', () => this.skip());
        document.body.appendChild(this.skipBtn);
    }
    
    _bindEvents() {
        // Eventos do jogo
        if (this.game?.events) {
            this.game.events.on('spawn-golem', this._onSpawnGolem);
            this.game.events.on('breed-success', this._onBreedSuccess);
            this.game.events.on('tool-selected', this._onToolSelected);
            this.game.events.on('golem-killed', this._onGolemKilled);
        }
        
        // Delegação de cliques - usa capture para interceptar antes
        document.addEventListener('click', (e) => this._onDocumentClick(e), true);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MÁQUINA DE ESTADOS
    // ═══════════════════════════════════════════════════════════════════
    
    _goToStep(step) {
        if (!this.isActive) return;
        
        console.log(`[Tutorial] -> ${step}`);
        this.currentStep = step;
        
        const config = STEP_CONFIG[step];
        if (!config) {
            if (step === STEPS.DONE) this._complete();
            return;
        }
        
        // Limpa estado anterior
        this._clearAll();
        
        // Delay opcional
        const delay = config.delay || 0;
        setTimeout(() => this._renderStep(step, config), delay);
    }
    
    _renderStep(step, config) {
        // Mostra skip button (exceto em modais)
        this.skipBtn.classList.toggle('visible', config.type !== 'modal');
        
        switch (config.type) {
            case 'modal':
                this._showModal(config);
                break;
            case 'highlight':
                this._showHighlight(config);
                break;
            case 'tooltip':
                this._showTooltipOnly(config);
                break;
            case 'waiting':
                this._showWaiting(config);
                break;
            case 'canvas':
                this._showCanvasHint(config);
                break;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // RENDERIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════
    
    _showModal(config) {
        this.modal.classList.toggle('celebratory', !!config.celebratory);
        this.modal.querySelector('.tutorial-modal-icon').textContent = config.icon;
        this.modal.querySelector('.tutorial-modal-title').textContent = config.title;
        this.modal.querySelector('.tutorial-modal-message').textContent = config.message;
        this.modal.querySelector('.tutorial-modal-btn').textContent = config.buttonText;
        
        this.modalBackdrop.classList.add('visible');
        this.modal.classList.add('visible');
    }
    
    _showHighlight(config, retryCount = 0) {
        const element = document.querySelector(config.selector);
        
        // Debug: verificar se o painel está aberto
        const panel = document.getElementById('creation-panel');
        const panelVisible = panel && !panel.classList.contains('hidden');
        console.log(`[Tutorial] Buscando: ${config.selector} | Painel aberto: ${panelVisible} | Tentativa: ${retryCount + 1}`);
        
        if (!element) {
            console.warn(`[Tutorial] Elemento não encontrado: ${config.selector} (tentativa ${retryCount + 1})`);
            
            // Tenta novamente até 10 vezes (elemento pode não estar renderizado ainda)
            if (retryCount < 10) {
                setTimeout(() => {
                    if (this.currentStep === this._getStepFromSelector(config.selector)) {
                        this._showHighlight(config, retryCount + 1);
                    }
                }, 400);
            } else {
                console.error(`[Tutorial] Desistindo de encontrar: ${config.selector}`);
            }
            return;
        }
        
        console.log(`[Tutorial] ✓ Elemento encontrado: ${config.selector}`);
        
        // Ativa escudo invisível COM FURO para o elemento alvo
        // Se clickThrough, não bloqueia (apenas mostra o highlight)
        if (!config.clickThrough) {
            this.blocker.style.display = 'block';
            this._updateBlockerHole(element);
        }
        
        // Destaca elemento alvo
        element.classList.add('tutorial-active-target');
        this._currentTarget = element;
        
        // Posiciona tooltip próximo ao elemento (agora com suporte a subMessage)
        this._positionTooltip(element, config.message, config.pointerPos, config.subMessage);
        
        // Posiciona pointer (mãozinha)
        this._positionPointer(element, config.pointerPos);
        
        // Se é clickThrough, auto-avança após um tempo
        if (config.clickThrough) {
            setTimeout(() => {
                if (this.currentStep === this._getStepFromSelector(config.selector)) {
                    this._advanceFromHighlight();
                }
            }, 3000); // 3 segundos para ler
        }
    }
    
    _showTooltipOnly(config) {
        // Tooltip centralizado no topo
        this.tooltip.querySelector('.tutorial-tooltip-message').textContent = config.message;
        const subEl = this.tooltip.querySelector('.tutorial-tooltip-sub');
        subEl.textContent = config.subMessage || '';
        subEl.style.display = config.subMessage ? 'block' : 'none';
        
        this.tooltip.style.top = '100px';
        this.tooltip.style.left = '50%';
        this.tooltip.style.transform = 'translateX(-50%)';
        this.tooltip.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');
        this.tooltip.classList.add('visible');
        
        // Auto-avança se configurado
        if (config.autoAdvance) {
            setTimeout(() => this._advanceFromTooltip(), config.autoAdvance);
        }
    }
    
    _showWaiting(config) {
        this.tooltip.querySelector('.tutorial-tooltip-message').innerHTML = 
            `<span class="tutorial-tooltip-spinner"></span>${config.message}`;
        this.tooltip.querySelector('.tutorial-tooltip-sub').style.display = 'none';
        
        this.tooltip.style.top = '100px';
        this.tooltip.style.left = '50%';
        this.tooltip.style.transform = 'translateX(-50%)';
        this.tooltip.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');
        this.tooltip.classList.add('visible');
    }
    
    _showCanvasHint(config) {
        // Tooltip com instrução
        this.tooltip.querySelector('.tutorial-tooltip-message').textContent = config.message;
        const subEl = this.tooltip.querySelector('.tutorial-tooltip-sub');
        subEl.textContent = config.subMessage || '';
        subEl.style.display = config.subMessage ? 'block' : 'none';
        
        this.tooltip.style.top = '80px';
        this.tooltip.style.left = '50%';
        this.tooltip.style.transform = 'translateX(-50%)';
        this.tooltip.classList.add('visible');
        
        // Hint animado no canvas
        this.breedHint.classList.add('visible');
    }
    
    _positionTooltip(element, message, pointerPos, subMessage = null) {
        const rect = element.getBoundingClientRect();
        const tooltip = this.tooltip;
        
        tooltip.querySelector('.tutorial-tooltip-message').textContent = message;
        const subEl = tooltip.querySelector('.tutorial-tooltip-sub');
        if (subMessage) {
            subEl.textContent = subMessage;
            subEl.style.display = 'block';
        } else {
            subEl.style.display = 'none';
        }
        
        // Remove classes de seta anteriores
        tooltip.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');
        
        // Mede o tooltip
        tooltip.style.visibility = 'hidden';
        tooltip.classList.add('visible');
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        const margin = 16;
        const pointerSpace = 36; // espaço para o pointer
        
        switch (pointerPos) {
            case 'left':
                // Tooltip à direita do elemento
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                left = rect.right + margin + pointerSpace;
                tooltip.classList.add('arrow-left');
                break;
            case 'right':
                // Tooltip à esquerda do elemento
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                left = rect.left - tooltipRect.width - margin - pointerSpace;
                tooltip.classList.add('arrow-right');
                break;
            case 'top':
                // Tooltip abaixo do elemento
                top = rect.bottom + margin + pointerSpace;
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                tooltip.classList.add('arrow-top');
                break;
            case 'bottom':
                // Tooltip acima do elemento
                top = rect.top - tooltipRect.height - margin - pointerSpace;
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                tooltip.classList.add('arrow-bottom');
                break;
            default:
                top = rect.bottom + margin;
                left = rect.left;
        }
        
        // Garante que não sai da tela
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.transform = 'none';
        tooltip.style.visibility = 'visible';
    }
        _updateBlockerHole(element) {
        const rect = element.getBoundingClientRect();
        const padding = 8; // Margem extra ao redor do elemento
        
        // Cria um clip-path que cobre tudo EXCETO o elemento alvo
        const top = rect.top - padding;
        const left = rect.left - padding;
        const right = rect.right + padding;
        const bottom = rect.bottom + padding;
        
        // Polygon que cria um "furo" retangular
        // Desenha o contorno externo (tela toda) e depois o interno (furo)
        this.blocker.style.clipPath = `
            polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                ${left}px ${top}px,
                ${left}px ${bottom}px,
                ${right}px ${bottom}px,
                ${right}px ${top}px,
                ${left}px ${top}px
            )
        `;
    }
    
    _positionPointer(element, position) {
        const rect = element.getBoundingClientRect();
        const pointer = this.pointer;
        
        let top, left;
        const offset = 8;
        
        switch (position) {
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - offset;
                pointer.style.transform = 'translate(-100%, -50%) rotate(-90deg)';
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + offset;
                pointer.style.transform = 'translate(0, -50%) rotate(90deg)';
                break;
            case 'top':
                top = rect.top - offset;
                left = rect.left + rect.width / 2;
                pointer.style.transform = 'translate(-50%, -100%)';
                break;
            case 'bottom':
                top = rect.bottom + offset;
                left = rect.left + rect.width / 2;
                pointer.style.transform = 'translate(-50%, 0) rotate(180deg)';
                break;
            default:
                top = rect.top - 10;
                left = rect.left + rect.width / 2;
                pointer.style.transform = 'translate(-50%, -100%)';
        }
        
        pointer.style.top = `${top}px`;
        pointer.style.left = `${left}px`;
        pointer.classList.add('visible');
    }
    
    _clearAll() {
        // Remove highlight do alvo atual
        if (this._currentTarget) {
            this._currentTarget.classList.remove('tutorial-active-target');
            this._currentTarget = null;
        }
        
        // Esconde elementos e limpa clip-path
        this.blocker.style.display = 'none';
        this.blocker.style.clipPath = 'none';
        this.tooltip.classList.remove('visible');
        this.pointer.classList.remove('visible');
        this.modal.classList.remove('visible');
        this.modalBackdrop.classList.remove('visible');
        this.breedHint.classList.remove('visible');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════
    
    _onModalConfirm() {
        if (this.currentStep === STEPS.WELCOME) {
            this._goToStep(STEPS.OPEN_LAB);
        } else if (this.currentStep === STEPS.FINISH) {
            this._goToStep(STEPS.DONE);
        }
    }
    
    _onDocumentClick(e) {
        if (!this.isActive) return;
        
        const config = STEP_CONFIG[this.currentStep];
        if (!config || config.type !== 'highlight') return;
        
        // Verifica se clicou no elemento alvo ou dentro dele
        const target = document.querySelector(config.selector);
        if (!target) return;
        
        if (target.contains(e.target) || target === e.target) {
            // Clicou no alvo! Avança
            this._advanceFromHighlight();
        }
    }
    
    _advanceFromHighlight() {
        const transitions = {
            [STEPS.OPEN_LAB]: STEPS.SELECT_CIRCLE,
            [STEPS.SELECT_CIRCLE]: STEPS.SELECT_CARBON,
            [STEPS.SELECT_CARBON]: STEPS.SELECT_LIGHT,
            [STEPS.SELECT_LIGHT]: STEPS.SYNTHESIZE_FIRST,
            [STEPS.SYNTHESIZE_FIRST]: STEPS.WAIT_FIRST_GOLEM,
            [STEPS.OPEN_LAB_SECOND]: STEPS.SELECT_SQUARE,
            [STEPS.SELECT_SQUARE]: STEPS.SELECT_IRON,
            [STEPS.SELECT_IRON]: STEPS.SELECT_ELECTRICITY,
            [STEPS.SELECT_ELECTRICITY]: STEPS.SYNTHESIZE_SECOND,
            [STEPS.SYNTHESIZE_SECOND]: STEPS.WAIT_SECOND_GOLEM,
            // SHOW_TOOLS avança automaticamente (clickThrough) para SELECT_KILL_TOOL
            [STEPS.SHOW_TOOLS]: STEPS.SELECT_KILL_TOOL
            // SELECT_KILL_TOOL NÃO está aqui - avança via evento 'tool-selected'
        };
        
        const next = transitions[this.currentStep];
        if (next) {
            // Delay extra para transições que abrem o painel (precisa renderizar opções)
            const needsExtraDelay = [STEPS.OPEN_LAB, STEPS.OPEN_LAB_SECOND].includes(this.currentStep);
            const delay = needsExtraDelay ? 400 : 150;
            setTimeout(() => this._goToStep(next), delay);
        }
    }
    
    _advanceFromTooltip() {
        if (this.currentStep === STEPS.OBSERVE_FIRST) {
            this._goToStep(STEPS.OPEN_LAB_SECOND);
        }
    }
    
    _onSpawnGolem() {
        if (!this.isActive) return;
        
        this.golemCount++;
        console.log(`[Tutorial] Golem #${this.golemCount} criado!`);
        
        if (this.currentStep === STEPS.WAIT_FIRST_GOLEM) {
            setTimeout(() => this._goToStep(STEPS.OBSERVE_FIRST), 600);
        } else if (this.currentStep === STEPS.WAIT_SECOND_GOLEM) {
            setTimeout(() => this._goToStep(STEPS.BREED), 600);
        }
    }
    
    _onBreedSuccess() {
        if (!this.isActive) return;
        
        if (this.currentStep === STEPS.BREED || this.currentStep === STEPS.WAIT_BREED) {
            console.log('[Tutorial] Breeding detectado!');
            this._goToStep(STEPS.WAIT_BREED);
            // Após fusão, vai para apresentação das ferramentas (não direto pro FINISH)
            setTimeout(() => this._goToStep(STEPS.SHOW_TOOLS), 1500);
        }
    }
    
    _onToolSelected(data) {
        if (!this.isActive) return;
        
        // Se estamos esperando a seleção da ferramenta kill
        if (this.currentStep === STEPS.SELECT_KILL_TOOL && data?.action === 'kill') {
            console.log('[Tutorial] Ferramenta KILL selecionada!');
            setTimeout(() => this._goToStep(STEPS.USE_KILL_TOOL), 300);
        }
    }
    
    _onGolemKilled() {
        if (!this.isActive) return;
        
        if (this.currentStep === STEPS.USE_KILL_TOOL || this.currentStep === STEPS.WAIT_KILL) {
            console.log('[Tutorial] Golem eliminado!');
            this._goToStep(STEPS.WAIT_KILL);
            setTimeout(() => this._goToStep(STEPS.FINISH), 1000);
        }
    }
    
    _getStepFromSelector(selector) {
        for (const [step, config] of Object.entries(STEP_CONFIG)) {
            if (config.selector === selector) return step;
        }
        return null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // FINALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════
    
    _complete() {
        console.log('[Tutorial] Completo!');
        localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
        
        this.isActive = false;
        this._clearAll();
        this.skipBtn.classList.remove('visible');
        
        // Limpa seleção de ferramenta se houver
        if (window.clearToolSelection) {
            window.clearToolSelection();
        }
        
        // Remove listeners
        if (this.game?.events) {
            this.game.events.off('spawn-golem', this._onSpawnGolem);
            this.game.events.off('breed-success', this._onBreedSuccess);
            this.game.events.off('tool-selected', this._onToolSelected);
            this.game.events.off('golem-killed', this._onGolemKilled);
        }
        
        // Remove elementos do DOM
        setTimeout(() => {
            this.blocker?.remove();
            this.tooltip?.remove();
            this.pointer?.remove();
            this.modal?.remove();
            this.modalBackdrop?.remove();
            this.breedHint?.remove();
            this.skipBtn?.remove();
        }, 500);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════
    
    skip() {
        if (this.isActive) {
            console.log('[Tutorial] Pulado.');
            this._goToStep(STEPS.DONE);
        }
    }
    
    static reset() {
        localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        console.log('[Tutorial] Reset! Recarregue a página.');
    }
}

window.TutorialSystem = TutorialSystem;
