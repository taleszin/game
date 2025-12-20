/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HYLOMORPH - UI FLING SYSTEM v2 (Natural & Smooth)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de UI interativa com dois modos:
 * 
 * 1. POSICIONAR: Arrasta devagar → elemento segue → solta → fica no lugar
 * 2. FLING: Arrasta rápido/swipe → solta → voa na direção do movimento
 * 
 * Golems detectam projéteis e desviam com cara de raiva!
 * Posições customizadas são salvas no localStorage.
 */

export class UIFlingSystem {
    constructor(scene) {
        this.scene = scene;
        this.flingableElements = [];
        this.activeProjectiles = [];
        this.isEnabled = true;
        
        // Detecção mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                        || ('ontouchstart' in window);
        
        // Configurações
        this.config = {
            // Thresholds
            flingVelocityThreshold: 400,  // Velocidade mínima para fling (px/s)
            holdTimeForPosition: 200,      // Tempo de hold para modo posição (ms)
            
            // Mobile: distância mínima para considerar drag (evita tap acidental)
            tapThreshold: this.isMobile ? 15 : 5, // pixels de movimento antes de iniciar drag
            
            // Física do fling
            flingFriction: 0.96,          // Fricção durante voo
            flingBounce: 0.5,             // Bounce nas bordas
            maxFlingSpeed: 2000,          // Velocidade máxima
            
            // Golem detection
            golemDetectRadius: 180,       // Raio para reação forte (colisão)
            golemDodgeForce: 350,
            angryDuration: 2000,
            
            // Visual
            snapBackDuration: 300,        // Duração do snap back (ms)
            trailInterval: 40             // Intervalo entre partículas de trail
        };
        
        // Estado do drag
        this.drag = {
            active: false,
            pendingDrag: false,  // NOVO: aguardando threshold de movimento
            element: null,
            clone: null,
            startX: 0,
            startY: 0,
            startTime: 0,
            currentX: 0,
            currentY: 0,
            velocityX: 0,
            velocityY: 0,
            positions: [],     // Histórico para calcular velocidade
            originalPos: null, // Posição original do elemento
            isPositioning: false, // Modo posicionamento (vs fling)
            elementData: null
        };
        
        // Posições salvas pelo usuário
        this.savedPositions = this._loadSavedPositions();
        
        // Bind handlers
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        
        this._init();
    }
    
    _init() {
        this._injectStyles();
        this._setupElements();
        this._addListeners();
        this._applySavedPositions();
        this._startUpdateLoop();
        
        console.log('[UIFling] ✨ Sistema iniciado - Arraste elementos da UI!');
    }
    
    _injectStyles() {
        if (document.getElementById('ui-fling-v2-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ui-fling-v2-styles';
        style.textContent = `
            /* ═══ DRAGGABLE ELEMENTS ═══ */
            .ui-draggable {
                cursor: grab;
                user-select: none;
                -webkit-user-select: none;
                touch-action: none;
                transition: transform 0.1s ease, box-shadow 0.2s ease;
            }
            
            .ui-draggable:hover {
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
            
            .ui-draggable.dragging-source {
                opacity: 0.3;
                transform: scale(0.95);
            }
            
            /* ═══ DRAG CLONE (segue o dedo/mouse) ═══ */
            .ui-drag-clone {
                position: fixed !important;
                z-index: 10000 !important;
                pointer-events: none !important;
                transition: none !important;
                cursor: grabbing;
            }
            
            .ui-drag-clone.mode-position {
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.6),
                            0 0 40px rgba(0, 255, 255, 0.3);
                transform: scale(1.05);
            }
            
            .ui-drag-clone.mode-fling {
                box-shadow: 0 0 15px rgba(255, 150, 0, 0.8),
                            0 0 30px rgba(255, 100, 0, 0.5);
                filter: brightness(1.1);
            }
            
            /* ═══ PROJECTILE (voando) ═══ */
            .ui-projectile {
                position: fixed !important;
                z-index: 9999 !important;
                pointer-events: none !important;
                filter: drop-shadow(0 0 10px rgba(255, 100, 0, 0.8));
                animation: projectile-glow 0.15s ease-in-out infinite alternate;
            }
            
            @keyframes projectile-glow {
                from { filter: drop-shadow(0 0 8px rgba(255, 100, 0, 0.7)) brightness(1); }
                to { filter: drop-shadow(0 0 15px rgba(255, 200, 50, 0.9)) brightness(1.15); }
            }
            
            .ui-projectile.returning {
                animation: none;
                filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.5));
                transition: filter 0.2s;
            }
            
            /* ═══ TRAIL ═══ */
            .fling-trail-particle {
                position: fixed;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,150,50,0.9) 0%, rgba(255,100,0,0.5) 60%, transparent 100%);
                pointer-events: none;
                z-index: 9998;
                animation: trail-disappear 0.35s ease-out forwards;
            }
            
            @keyframes trail-disappear {
                0% { opacity: 0.8; transform: scale(1); }
                100% { opacity: 0; transform: scale(0.3); }
            }
            
            /* ═══ VELOCITY INDICATOR (seta de direção) ═══ */
            .velocity-indicator {
                position: fixed;
                pointer-events: none;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.15s;
            }
            
            .velocity-indicator.visible {
                opacity: 1;
            }
            
            .velocity-indicator svg {
                filter: drop-shadow(0 0 5px rgba(255, 150, 0, 0.8));
            }
            
            /* ═══ MODE INDICATOR ═══ */
            .drag-mode-indicator {
                position: fixed;
                padding: 4px 10px;
                font-family: 'Press Start 2P', monospace;
                font-size: 8px;
                border-radius: 4px;
                pointer-events: none;
                z-index: 10002;
                opacity: 0;
                transform: translateY(5px);
                transition: opacity 0.2s, transform 0.2s;
            }
            
            .drag-mode-indicator.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .drag-mode-indicator.position {
                background: rgba(0, 50, 60, 0.9);
                border: 1px solid #0ff;
                color: #0ff;
            }
            
            .drag-mode-indicator.fling {
                background: rgba(60, 30, 0, 0.9);
                border: 1px solid #f80;
                color: #f80;
            }
            
            /* ═══ SNAP BACK ANIMATION ═══ */
            @keyframes snap-back {
                0% { transform: scale(1.05); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }
            
            .ui-draggable.snap-back {
                animation: snap-back 0.3s ease-out;
            }
            
            /* ═══ IMPACT RIPPLE ═══ */
            .impact-ripple {
                position: fixed;
                pointer-events: none;
                z-index: 9997;
            }
            
            .impact-ripple::before {
                content: '';
                position: absolute;
                top: 50%; left: 50%;
                width: 10px; height: 10px;
                border: 2px solid #f80;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: ripple-expand 0.4s ease-out forwards;
            }
            
            @keyframes ripple-expand {
                0% { width: 10px; height: 10px; opacity: 1; }
                100% { width: 60px; height: 60px; opacity: 0; }
            }
            
            /* ═══ POSITION SAVED FLASH ═══ */
            .ui-draggable.position-saved {
                animation: position-saved-flash 0.4s ease-out;
            }
            
            @keyframes position-saved-flash {
                0%, 100% { box-shadow: none; }
                50% { box-shadow: 0 0 20px #0f0, 0 0 40px #0f0; }
            }
            
            /* ═══ RESET BUTTON ═══ */
            .ui-reset-positions-btn {
                position: fixed;
                top: 10px;
                left: 10px;
                bottom: auto;
                right: auto;
                padding: 6px 10px;
                font-family: 'Press Start 2P', monospace;
                font-size: 7px;
                background: rgba(30, 0, 0, 0.8);
                border: 1px solid #f44;
                color: #f66;
                border-radius: 4px;
                cursor: pointer;
                z-index: 1000;
                opacity: 0.5;
                transition: opacity 0.2s, transform 0.2s;
            }
            
            .ui-reset-positions-btn:hover {
                opacity: 1;
                transform: scale(1.05);
            }

            /* ═══ KILL ALL BUTTON (MATAR TODOS) ═══ */
            .ui-kill-all-btn {
                position: fixed;
                top: 10px;
                left: 110px;
                padding: 6px 10px;
                font-family: 'Press Start 2P', monospace;
                font-size: 7px;
                background: linear-gradient(90deg, rgba(80,0,0,0.95), rgba(40,0,0,0.9));
                border: 1px solid #ff5544;
                color: #ffd8d0;
                border-radius: 4px;
                cursor: pointer;
                z-index: 1000;
                opacity: 0.9;
                transition: transform 0.12s ease, box-shadow 0.12s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .ui-kill-all-btn .icon {
                font-size: 12px;
                line-height: 1;
            }

            .ui-kill-all-btn:hover {
                transform: scale(1.06);
                box-shadow: 0 0 12px rgba(255, 60, 0, 0.6);
            }

            .ui-kill-all-btn[disabled] {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    _setupElements() {
        // NOTA: .tool-slot NÃO é incluído pois ferramentas são arrastadas para o canvas
        // Apenas containers inteiros (tool-rack, chrono-deck) são reposicionáveis
        const selectors = [
            '#btn-open-lab',
            '#btn-tree',
            '#btn-evolved-forms',
            '#chrono-deck',
            '#tool-rack'
        ];
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!el.classList.contains('ui-draggable')) {
                    el.classList.add('ui-draggable');
                    
                    // Guarda posição original
                    const rect = el.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(el);
                    
                    this.flingableElements.push({
                        element: el,
                        selector: selector,
                        originalPosition: {
                            position: computedStyle.position,
                            left: computedStyle.left,
                            top: computedStyle.top,
                            right: computedStyle.right,
                            bottom: computedStyle.bottom,
                            transform: computedStyle.transform
                        },
                        id: el.id || selector + '_' + Math.random().toString(36).substr(2, 5)
                    });
                }
            });
        });
        
        // Adiciona botões de controle UI
        this._createResetButton();
        this._createKillAllButton();
        
        console.log(`[UIFling] ${this.flingableElements.length} elementos configurados`);
    }
    
    _createResetButton() {
        if (document.getElementById('ui-reset-positions-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'ui-reset-positions-btn';
        btn.className = 'ui-reset-positions-btn';
        btn.textContent = '↺ RESET UI';
        btn.title = 'Restaura posições originais da UI';
        
        btn.addEventListener('click', () => {
            this._resetAllPositions();
        });
        
        document.body.appendChild(btn);
    }

    _createKillAllButton() {
        if (document.getElementById('ui-kill-all-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'ui-kill-all-btn';
        btn.className = 'ui-kill-all-btn';
        btn.title = 'MATAR TODOS os Golems (confirmação requerida)';
        btn.setAttribute('aria-label', 'Matar todos os Golems');

        // ícone caveira + label curta (bom contraste para UX)
        btn.innerHTML = `<span class="icon">☠</span><span style="font-size:8px;">MATAR TODOS</span>`;

        btn.addEventListener('click', () => {
            // Ação imediata ao clicar (sem confirmação)
            if (btn.disabled) return;

            // Bloqueia o botão brevemente para evitar cliques repetidos
            btn.disabled = true;
            btn.style.opacity = '0.6';

            // Executa ação de matar imediatamente
            this._killAllGolems();

            // Feedback breve e reativa botão
            setTimeout(() => {
                btn.disabled = false;
                btn.style.opacity = '';
            }, 800);
        });

        document.body.appendChild(btn);
    }
    
    _addListeners() {
        // Mouse
        document.addEventListener('mousedown', this._onPointerDown, { passive: false });
        document.addEventListener('mousemove', this._onPointerMove, { passive: false });
        document.addEventListener('mouseup', this._onPointerUp);
        
        // Touch
        document.addEventListener('touchstart', this._onPointerDown, { passive: false });
        document.addEventListener('touchmove', this._onPointerMove, { passive: false });
        document.addEventListener('touchend', this._onPointerUp);
        document.addEventListener('touchcancel', this._onPointerUp);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // DRAG HANDLERS
    // ═══════════════════════════════════════════════════════════════
    
    _onPointerDown(e) {
        if (!this.isEnabled) return;
        
        const target = e.target.closest('.ui-draggable');
        if (!target) return;
        
        // Não intercepta se for um botão interno clicável
        if (e.target.closest('button:not(.ui-draggable)')) return;
        
        // IMPORTANTE: Não intercepta cliques em .tool-slot - esses têm seu próprio sistema de drag
        if (e.target.closest('.tool-slot')) return;
        
        const point = this._getPointerPos(e);
        const rect = target.getBoundingClientRect();
        
        // Encontra dados do elemento
        const elementData = this.flingableElements.find(f => f.element === target);
        
        // MOBILE: Inicia em modo "pendente" - só ativa drag após threshold de movimento
        this.drag = {
            active: false,           // Não ativa ainda no mobile
            pendingDrag: true,       // Aguardando threshold
            element: target,
            clone: null,
            startX: point.x,
            startY: point.y,
            startTime: Date.now(),
            currentX: point.x,
            currentY: point.y,
            velocityX: 0,
            velocityY: 0,
            positions: [{ x: point.x, y: point.y, t: Date.now() }],
            originalPos: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
            offsetX: point.x - rect.left,
            offsetY: point.y - rect.top,
            isPositioning: false,
            elementData: elementData
        };
        
        // Só previne default se não for mobile (permite scroll/tap no mobile até confirmar drag)
        if (!this.isMobile) {
            e.preventDefault();
            e.stopPropagation();
            this._startDrag(target, rect);
        }
    }
    
    _startDrag(target, rect) {
        this.drag.active = true;
        this.drag.pendingDrag = false;
        
        // Cria clone que segue o dedo
        this._createDragClone(target, rect);
        
        // Marca elemento original
        target.classList.add('dragging-source');
        
        // Cria indicadores
        this._createIndicators();
    }
    
    _onPointerMove(e) {
        if (!this.drag.pendingDrag && !this.drag.active) return;
        
        const point = this._getPointerPos(e);
        const now = Date.now();
        
        // MOBILE: Verifica se ultrapassou threshold antes de iniciar drag
        if (this.drag.pendingDrag && !this.drag.active) {
            const dx = point.x - this.drag.startX;
            const dy = point.y - this.drag.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance >= this.config.tapThreshold) {
                // Ultrapassou threshold - inicia drag real
                e.preventDefault();
                e.stopPropagation();
                this._startDrag(this.drag.element, this.drag.originalPos);
            } else {
                // Ainda não ultrapassou - permite comportamento normal (scroll, etc)
                return;
            }
        }
        
        if (!this.drag.active) return;
        
        e.preventDefault();
        
        // Atualiza histórico de posições
        this.drag.positions.push({ x: point.x, y: point.y, t: now });
        // Mantém só últimos 100ms
        this.drag.positions = this.drag.positions.filter(p => now - p.t < 100);
        
        // Calcula velocidade instantânea
        if (this.drag.positions.length >= 2) {
            const oldest = this.drag.positions[0];
            const dt = (now - oldest.t) / 1000;
            if (dt > 0) {
                this.drag.velocityX = (point.x - oldest.x) / dt;
                this.drag.velocityY = (point.y - oldest.y) / dt;
            }
        }
        
        this.drag.currentX = point.x;
        this.drag.currentY = point.y;
        
        // Move clone
        if (this.drag.clone) {
            const scale = this.drag.uiScale || 1;
            const newLeft = point.x - (this.drag.offsetX * scale);
            const newTop = point.y - (this.drag.offsetY * scale);
            this.drag.clone.style.left = `${newLeft}px`;
            this.drag.clone.style.top = `${newTop}px`;
        }
        
        // Determina modo baseado no tempo e velocidade
        const holdTime = now - this.drag.startTime;
        const speed = Math.sqrt(this.drag.velocityX ** 2 + this.drag.velocityY ** 2);
        
        // Se está segurando há tempo suficiente E velocidade baixa = modo posição
        // Se velocidade alta = modo fling
        this.drag.isPositioning = holdTime > this.config.holdTimeForPosition && speed < this.config.flingVelocityThreshold;
        
        // Atualiza visual do clone e indicadores
        this._updateDragVisuals(speed);
    }
    
    _onPointerUp(e) {
        // Se estava pendente mas não iniciou drag = foi um TAP
        if (this.drag.pendingDrag && !this.drag.active) {
            const element = this.drag.element;
            this.drag.pendingDrag = false;
            this.drag.element = null;
            
            // Dispara click no elemento (tap no mobile)
            if (element) {
                element.click();
            }
            return;
        }
        
        if (!this.drag.active) return;
        
        const { element, clone, velocityX, velocityY, isPositioning, originalPos, elementData } = this.drag;
        
        // Limpa estado
        this.drag.active = false;
        element.classList.remove('dragging-source');
        
        // Remove indicadores
        this._removeIndicators();
        
        // Calcula velocidade final
        const speed = Math.sqrt(velocityX ** 2 + velocityY ** 2);
        
        if (isPositioning || speed < this.config.flingVelocityThreshold) {
            // ═══ MODO POSIÇÃO: Salva nova posição ═══
            if (clone) {
                const newLeft = parseFloat(clone.style.left);
                const newTop = parseFloat(clone.style.top);
                
                // Aplica posição ao elemento original
                this._applyPosition(element, newLeft, newTop);
                
                // Salva no localStorage
                if (elementData) {
                    this._savePosition(elementData.id, newLeft, newTop);
                }
                
                // Remove clone
                clone.remove();
                
                // Feedback visual
                element.classList.add('position-saved');
                setTimeout(() => element.classList.remove('position-saved'), 400);
            }
        } else {
            // ═══ MODO FLING: Lança como projétil ═══
            if (clone) {
                // Limita velocidade
                let vx = velocityX;
                let vy = velocityY;
                if (speed > this.config.maxFlingSpeed) {
                    const ratio = this.config.maxFlingSpeed / speed;
                    vx *= ratio;
                    vy *= ratio;
                }
                
                this._launchProjectile(clone, element, originalPos, vx, vy, elementData);
                this._playFlingSound();
            }
        }
        
        this.drag.clone = null;
        this.drag.element = null;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // DRAG VISUALS
    // ═══════════════════════════════════════════════════════════════
    
    _createDragClone(element, rect) {
        const clone = element.cloneNode(true);
        clone.className = element.className + ' ui-drag-clone';
        clone.classList.remove('dragging-source', 'ui-draggable');
        // Apply initial unscaled position/size and then scale via transform (transform-origin top-left)
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.margin = '0';
        clone.style.transformOrigin = 'top left';
        const uiScale = this._getUiScale();
        clone.style.transform = `scale(${uiScale})`;
        clone.style.willChange = 'transform, left, top';

        document.body.appendChild(clone);
        this.drag.clone = clone;
        // store scale for use while dragging and when launching projectile
        this.drag.uiScale = uiScale;
    }
    
    _createIndicators() {
        // Indicador de modo
        this.modeIndicator = document.createElement('div');
        this.modeIndicator.className = 'drag-mode-indicator';
        document.body.appendChild(this.modeIndicator);
        
        // Indicador de velocidade (seta)
        this.velocityIndicator = document.createElement('div');
        this.velocityIndicator.className = 'velocity-indicator';
        this.velocityIndicator.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 40 40">
                <path d="M20 5 L35 30 L20 24 L5 30 Z" fill="#f80" stroke="#fff" stroke-width="1"/>
            </svg>
        `;
        document.body.appendChild(this.velocityIndicator);
    }
    
    _updateDragVisuals(speed) {
        const { clone, isPositioning, currentX, currentY, velocityX, velocityY, originalPos } = this.drag;
        
        if (!clone) return;
        
        // Atualiza classe do clone
        clone.classList.toggle('mode-position', isPositioning);
        clone.classList.toggle('mode-fling', !isPositioning && speed > this.config.flingVelocityThreshold * 0.5);
        
        // Atualiza indicador de modo
        if (this.modeIndicator) {
            const isFlingMode = speed > this.config.flingVelocityThreshold * 0.7;
            this.modeIndicator.className = `drag-mode-indicator visible ${isFlingMode ? 'fling' : 'position'}`;
            this.modeIndicator.textContent = isFlingMode ? '↗ FLING' : '📌 MOVE';
            this.modeIndicator.style.left = `${currentX + 20}px`;
            this.modeIndicator.style.top = `${currentY - 30}px`;
        }
        
        // Atualiza seta de velocidade
        if (this.velocityIndicator && speed > this.config.flingVelocityThreshold * 0.5) {
            const angle = Math.atan2(velocityY, velocityX) * (180 / Math.PI);
            const cloneRect = clone.getBoundingClientRect();
            const centerX = cloneRect.left + cloneRect.width / 2;
            const centerY = cloneRect.top + cloneRect.height / 2;
            
            // Posiciona na frente do movimento
            const indicatorDist = 40 + (speed / this.config.maxFlingSpeed) * 30;
            const indicatorX = centerX + (velocityX / speed) * indicatorDist;
            const indicatorY = centerY + (velocityY / speed) * indicatorDist;
            
            this.velocityIndicator.classList.add('visible');
            this.velocityIndicator.style.left = `${indicatorX - 20}px`;
            this.velocityIndicator.style.top = `${indicatorY - 20}px`;
            this.velocityIndicator.style.transform = `rotate(${angle + 90}deg) scale(${0.5 + speed / this.config.maxFlingSpeed})`;
        } else if (this.velocityIndicator) {
            this.velocityIndicator.classList.remove('visible');
        }
    }
    
    _removeIndicators() {
        this.modeIndicator?.remove();
        this.velocityIndicator?.remove();
        this.modeIndicator = null;
        this.velocityIndicator = null;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PROJECTILE SYSTEM
    // ═══════════════════════════════════════════════════════════════
    
    _launchProjectile(clone, element, originalPos, vx, vy, elementData) {
        clone.classList.remove('ui-drag-clone', 'mode-position', 'mode-fling');
        clone.classList.add('ui-projectile');
        
        const uiScale = this.drag?.uiScale || this._getUiScale();
        const projectile = {
            element: clone,
            originalElement: element,
            originalPos: originalPos,
            elementData: elementData,
            x: parseFloat(clone.style.left),
            y: parseFloat(clone.style.top),
            width: originalPos.width * uiScale,
            height: originalPos.height * uiScale,
            vx: vx,
            vy: vy,
            rotation: 0,
            rotationSpeed: (vx + vy) * 0.01,
            scale: uiScale,
            isReturning: false,
            trailTimer: 0,
            lifetime: 0,
            maxLifetime: 2500
        };
        
        this.activeProjectiles.push(projectile);
    }
    
    _startUpdateLoop() {
        const update = () => {
            this._updateProjectiles();
            requestAnimationFrame(update);
        };
        update();
    }

    // Retorna o scale a aplicar a elementos UI para compensar devicePixelRatio
    // Valores maiores de devicePixelRatio tendem a reduzir o visual dos elementos
    // Clamp entre 0.6 e 1 para evitar exageros
    _getUiScale() {
        try {
            const dpr = (window && window.devicePixelRatio) ? window.devicePixelRatio : 1;
            // Caso a cena tenha zoom (raro para UI), podemos considerar também, mas o DOM UI deve respeitar dpr
            const camZoom = this.scene?.cameras?.main?.zoom || 1;
            let scale = 1 / Math.max(1, dpr);
            // Não reduzir abaixo de 0.6 para manter legibilidade
            if (scale < 0.6) scale = 0.6;
            if (scale > 1) scale = 1;
            // Se a câmera estiver com zoom < 1 (ver tudo), não aumentamos UI demais
            if (camZoom && camZoom > 1) {
                // diminui ainda mais se a câmera estiver muito próxima
                scale = Math.max(0.5, scale / camZoom);
            }
            return scale;
        } catch (e) {
            return 1;
        }
    }
    
    _updateProjectiles() {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const p = this.activeProjectiles[i];
            
            if (p.isReturning) {
                // Volta suavemente
                const dx = p.originalPos.left - p.x;
                const dy = p.originalPos.top - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 3) {
                    p.element.remove();
                    p.originalElement.classList.remove('dragging-source');
                    p.originalElement.classList.add('snap-back');
                    setTimeout(() => p.originalElement.classList.remove('snap-back'), 300);
                    this.activeProjectiles.splice(i, 1);
                    continue;
                }
                
                p.x += dx * 0.12;
                p.y += dy * 0.12;
                p.rotation *= 0.9;
                
            } else {
                // Física de voo
                p.vx *= this.config.flingFriction;
                p.vy *= this.config.flingFriction;
                p.x += p.vx * 0.016;
                p.y += p.vy * 0.016;
                p.rotation += p.rotationSpeed;
                p.lifetime += 16;
                
                // Bounce nas bordas
                if (p.x < 0) {
                    p.x = 0;
                    p.vx *= -this.config.flingBounce;
                    this._createImpact(0, p.y + p.height / 2);
                }
                if (p.x + p.width > screenW) {
                    p.x = screenW - p.width;
                    p.vx *= -this.config.flingBounce;
                    this._createImpact(screenW, p.y + p.height / 2);
                }
                if (p.y < 0) {
                    p.y = 0;
                    p.vy *= -this.config.flingBounce;
                    this._createImpact(p.x + p.width / 2, 0);
                }
                if (p.y + p.height > screenH) {
                    p.y = screenH - p.height;
                    p.vy *= -this.config.flingBounce;
                    this._createImpact(p.x + p.width / 2, screenH);
                }
                
                        // Trail
                p.trailTimer += 16;
                if (p.trailTimer > this.config.trailInterval) {
                    p.trailTimer = 0;
                    this._createTrail(p.x + p.width / 2, p.y + p.height / 2, p.scale || 1);
                }
                
                // Colisão com Golems
                this._checkGolemCollision(p);
                
                // Verifica se deve voltar
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed < 30 || p.lifetime > p.maxLifetime) {
                    p.isReturning = true;
                    p.element.classList.add('returning');
                }
            }
            
            // Atualiza posição visual
            p.element.style.left = `${p.x}px`;
            p.element.style.top = `${p.y}px`;
            // Combine scale (from clone creation) with rotation so projectiles keep the intended size
            const pScale = typeof p.scale === 'number' ? p.scale : (this.drag?.uiScale || 1);
            p.element.style.transform = `scale(${pScale}) rotate(${p.rotation}deg)`;
        }
    }
    
    _createTrail(x, y, scale = 1) {
        const particle = document.createElement('div');
        particle.className = 'fling-trail-particle';
        const size = Math.max(3, Math.round(6 * scale));
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x - size/2}px`;
        particle.style.top = `${y - size/2}px`;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 350);
    }
    
    _createImpact(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'impact-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 400);
        this._playImpactSound();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GOLEM INTERACTION
    // ═══════════════════════════════════════════════════════════════
    
    _checkGolemCollision(projectile) {
        if (!this.scene?.golemsGroup) return;
        
        const golems = this.scene.golemsGroup.getChildren();
        if (!golems || golems.length === 0) return;
        
        const camera = this.scene.cameras?.main;
        if (!camera) return;
        
        // Centro do projétil em coordenadas de tela
        const projScreenX = projectile.x + projectile.width / 2;
        const projScreenY = projectile.y + projectile.height / 2;
        
        // Velocidade do projétil (para prever trajetória)
        const projSpeed = Math.sqrt(projectile.vx ** 2 + projectile.vy ** 2);
        
        golems.forEach(golem => {
            if (!golem?.active || golem.isDead) return;
            
            // Converte posição do Golem para coordenadas de tela
            const golemScreenX = golem.x - camera.scrollX;
            const golemScreenY = golem.y - camera.scrollY;
            
            // Distância entre projétil e golem (em coordenadas de tela)
            const dx = golemScreenX - projScreenX;
            const dy = golemScreenY - projScreenY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Verifica se o projétil está vindo na direção do Golem
            // Produto escalar entre direção do projétil e direção para o Golem
            const toProjDirX = -dx / (dist || 1);
            const toProjDirY = -dy / (dist || 1);
            const projDirX = projectile.vx / (projSpeed || 1);
            const projDirY = projectile.vy / (projSpeed || 1);
            const dotProduct = toProjDirX * projDirX + toProjDirY * projDirY;
            
            // Se está próximo OU vindo na direção (dot > 0.3 = ~70° cone)
            const detectRadius = this.config.golemDetectRadius;
            const isApproaching = dotProduct > 0.3 && dist < detectRadius * 2;
            const isClose = dist < detectRadius;
            
            if (isClose || isApproaching) {
                // Intensidade baseada na proximidade e velocidade
                const proximityFactor = 1 - Math.min(dist / (detectRadius * 2), 1);
                const speedFactor = Math.min(projSpeed / 1000, 1);
                const intensity = proximityFactor * (0.5 + speedFactor * 0.5);
                
                this._makeGolemReact(golem, dx, dy, dist, intensity, isApproaching && !isClose);
            }
        });
    }
    
    _makeGolemReact(golem, dx, dy, dist, intensity, isSubtle) {
        // Cooldown para não spammar reações
        const now = Date.now();
        if (golem._lastFlingReaction && now - golem._lastFlingReaction < 500) return;
        golem._lastFlingReaction = now;
        
        // Normaliza direção de fuga
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        
        if (isSubtle) {
            // ═══ REAÇÃO SUTIL: Golem nota o projétil se aproximando ═══
            // Olha na direção do projétil (vira a cabeça)
            golem._lookAtThreat = { x: -nx, y: -ny, until: now + 800 };
            
            // Pequeno movimento de esquiva preventivo
            const dodgeForce = this.config.golemDodgeForce * 0.3 * intensity;
            if (golem.body) {
                golem.body.velocity.x += nx * dodgeForce;
                golem.body.velocity.y += ny * dodgeForce;
            }
            
            // Expressão de alerta (não raiva ainda)
            if (!golem._angryFromFling) {
                // Mostra "?" sutil
                this._showAlertIcon(golem, '?');
            }
            
        } else {
            // ═══ REAÇÃO FORTE: Projétil muito perto! ═══
            if (golem._angryFromFling) return;
            golem._angryFromFling = true;
            
            // Dodge forte
            const dodgeForce = this.config.golemDodgeForce * intensity;
            if (golem.body) {
                golem.body.velocity.x += nx * dodgeForce;
                golem.body.velocity.y += ny * dodgeForce;
            } else {
                golem.x += nx * dodgeForce * 0.15;
                golem.y += ny * dodgeForce * 0.15;
            }
            
            // Expressão de raiva
            const prevExpr = golem.currentExpression;
            golem.setExpression?.('angry', this.config.angryDuration);
            
            // Fala de raiva
            const phrases = ['GRR!', 'HEY!', '😠', 'OI!', 'PARA!', '💢', '*grr*', 'EI!'];
            golem.speak?.(phrases[Math.floor(Math.random() * phrases.length)]);
            
            // Flash vermelho
            if (golem.bodyGraphics && this.scene?.tweens) {
                this.scene.tweens.add({
                    targets: golem.bodyGraphics,
                    alpha: 0.6,
                    duration: 80,
                    yoyo: true,
                    repeat: 2,
                    onStart: () => golem.bodyGraphics.setTint?.(0xff4444),
                    onComplete: () => golem.bodyGraphics.clearTint?.()
                });
            }
            
            // Exclamação
            this._showAlertIcon(golem, '!');
            
            // Reset após duração
            setTimeout(() => {
                golem._angryFromFling = false;
                if (!golem.isDead && golem.setExpression) {
                    golem.setExpression(prevExpr || 'neutral');
                }
            }, this.config.angryDuration);
        }
    }
    
    _showAlertIcon(golem, icon) {
        const camera = this.scene?.cameras?.main;
        if (!camera) return;
        
        const screenX = golem.x - camera.scrollX;
        const screenY = golem.y - camera.scrollY - 50;
        
        const el = document.createElement('div');
        const isAngry = icon === '!';
        el.style.cssText = `
            position: fixed; 
            left: ${screenX}px; 
            top: ${screenY}px;
            font-size: ${isAngry ? '24px' : '18px'}; 
            font-weight: bold; 
            color: ${isAngry ? '#ff4444' : '#ffff00'};
            text-shadow: 0 0 10px ${isAngry ? '#ff0000' : '#ffaa00'}; 
            pointer-events: none; 
            z-index: 9990;
            font-family: 'Press Start 2P', monospace;
        `;
        el.textContent = icon;
        document.body.appendChild(el);
        
        // Animação
        el.animate([
            { transform: 'scale(0) translateY(0)', opacity: 1 },
            { transform: 'scale(1.2) translateY(-10px)', opacity: 1 },
            { transform: 'scale(1) translateY(-25px)', opacity: 0 }
        ], { duration: isAngry ? 600 : 400, easing: 'ease-out' });
        
        setTimeout(() => el.remove(), isAngry ? 600 : 400);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // POSITION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    
    _applyPosition(element, left, top) {
        element.style.position = 'fixed';
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        element.style.transform = 'none';
    }
    
    _savePosition(id, left, top) {
        this.savedPositions[id] = { left, top };
        localStorage.setItem('hylomorph_ui_positions', JSON.stringify(this.savedPositions));
    }
    
    _loadSavedPositions() {
        try {
            return JSON.parse(localStorage.getItem('hylomorph_ui_positions') || '{}');
        } catch {
            return {};
        }
    }
    
    _applySavedPositions() {
        this.flingableElements.forEach(({ element, id }) => {
            const saved = this.savedPositions[id];
            if (saved) {
                this._applyPosition(element, saved.left, saved.top);
            }
        });
    }
    
    _resetAllPositions() {
        // Limpa localStorage
        localStorage.removeItem('hylomorph_ui_positions');
        this.savedPositions = {};
        
        // Restaura posições originais de cada elemento sem recarregar página
        this.flingableElements.forEach(({ element, originalPosition }) => {
            // Remove estilos inline de posicionamento
            element.style.position = '';
            element.style.left = '';
            element.style.top = '';
            element.style.right = '';
            element.style.bottom = '';
            element.style.transform = '';
            
            // Força recálculo do layout aplicando posição original do CSS
            if (originalPosition) {
                // Pequeno delay para garantir reset completo
                requestAnimationFrame(() => {
                    element.style.position = originalPosition.position !== 'static' ? originalPosition.position : '';
                    element.style.left = originalPosition.left !== 'auto' ? originalPosition.left : '';
                    element.style.top = originalPosition.top !== 'auto' ? originalPosition.top : '';
                    element.style.right = originalPosition.right !== 'auto' ? originalPosition.right : '';
                    element.style.bottom = originalPosition.bottom !== 'auto' ? originalPosition.bottom : '';
                    element.style.transform = originalPosition.transform !== 'none' ? originalPosition.transform : '';
                });
            }
        });
        
        // Feedback visual
        this._playResetSound();
        
        console.log('[UIFling] Posições restauradas sem reload');
    }
    
    _playResetSound() {
        try {
            const ctx = this.scene?.sound?.context;
            if (!ctx || ctx.state === 'suspended') return;
            
            // Som de "swoosh" indicando reset
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch {}
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SOUNDS
    // ═══════════════════════════════════════════════════════════════
    
    _playFlingSound() {
        try {
            const ctx = this.scene?.sound?.context;
            if (!ctx || ctx.state === 'suspended') return;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch {}
    }
    
    _playImpactSound() {
        try {
            const ctx = this.scene?.sound?.context;
            if (!ctx || ctx.state === 'suspended') return;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = 80;
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch {}
    }

    _playKillSound() {
        try {
            const ctx = this.scene?.sound?.context;
            if (!ctx || ctx.state === 'suspended') return;

            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(220, now);
            osc1.frequency.exponentialRampToValueAtTime(80, now + 0.18);
            gain1.gain.setValueAtTime(0.12, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start();
            osc1.stop(now + 0.18);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(40, now);
            gain2.gain.setValueAtTime(0.06, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(now + 0.18);
        } catch {}
    }

    _killAllGolems() {
        if (!this.scene?.golemsGroup) return;

        const golems = this.scene.golemsGroup.getChildren();
        if (!golems || golems.length === 0) {
            this._showKillFeedback(0);
            return;
        }

        let killed = 0;
        for (const golem of golems) {
            try {
                if (golem && golem.active && !golem.isDead) {
                    // Preferir usar API do Golem (kill) para garantir efeitos e eventos
                    if (typeof golem.kill === 'function') {
                        golem.kill();
                    } else if (typeof golem.die === 'function') {
                        golem.die();
                    } else {
                        // fallback: desativar e remover
                        golem.active = false;
                        try { golem.destroy(); } catch(e) {}
                    }
                    killed++;

                    // Efeito visual local (se houver câmera/tela)
                    try {
                        const camera = this.scene.cameras?.main;
                        const screenX = golem.x - (camera?.scrollX || 0);
                        const screenY = golem.y - (camera?.scrollY || 0);
                        this._createImpact(screenX, screenY);
                    } catch(e) {}
                }
            } catch (e) { console.warn('Erro ao matar golem', e); }
        }

        // Som + feedback textual
        this._playKillSound();
        this._showKillFeedback(killed);
    }

    _showKillFeedback(count) {
        const txt = document.createElement('div');
        txt.style.cssText = `
            position: fixed; left: 50%; top: 30px; transform: translateX(-50%);
            z-index: 10003; font-family: 'Press Start 2P', monospace; background: rgba(0,0,0,0.7);
            color: #ffdddd; padding: 8px 12px; border-radius: 6px; border: 1px solid #ff4444; font-size: 10px;
        `;
        txt.textContent = count > 0 ? `✅ ${count} Golem(s) eliminados` : '⚠️ Nenhum Golem encontrado';
        document.body.appendChild(txt);
        setTimeout(() => { txt.style.transition = 'opacity 0.3s'; txt.style.opacity = '0'; setTimeout(()=> txt.remove(), 350); }, 1200);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════
    
    _getPointerPos(e) {
        if (e.touches?.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }
    
    setScene(scene) {
        this.scene = scene;
    }
    
    refresh() {
        this._setupElements();
        this._applySavedPositions();
    }
    
    destroy() {
        document.removeEventListener('mousedown', this._onPointerDown);
        document.removeEventListener('mousemove', this._onPointerMove);
        document.removeEventListener('mouseup', this._onPointerUp);
        document.removeEventListener('touchstart', this._onPointerDown);
        document.removeEventListener('touchmove', this._onPointerMove);
        document.removeEventListener('touchend', this._onPointerUp);
        document.removeEventListener('touchcancel', this._onPointerUp);
        
        this._removeIndicators();
        this.activeProjectiles.forEach(p => p.element?.remove());
        this.activeProjectiles = [];
        
        document.getElementById('ui-fling-v2-styles')?.remove();
        document.getElementById('ui-reset-positions-btn')?.remove();
        document.getElementById('ui-kill-all-btn')?.remove();
    }
}

// Singleton
let instance = null;

export function initUIFlingSystem(scene) {
    if (!instance) {
        instance = new UIFlingSystem(scene);
    } else {
        instance.setScene(scene);
        instance.refresh();
    }
    return instance;
}

export function getUIFlingSystem() {
    return instance;
}
