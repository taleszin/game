/**
 * ═══════════════════════════════════════════════════════════════════
 * EVOLVED FORMS UI MODULE
 * Gerencia o painel flutuante de formas evoluídas desbloqueáveis
 * Modular e reutilizável para melhor manutenção
 * ═══════════════════════════════════════════════════════════════════
 */

import { ELEMENTS } from '../data/gameData.js';

/**
 * Classe para gerenciar a interface de formas evoluídas
 */
export class EvolvedFormsUI {
    constructor(options = {}) {
        this.modalId = options.modalId || 'evolved-forms-modal';
        this.buttonId = options.buttonId || 'btn-evolved-forms';
        this.gridId = options.gridId || 'evolved-forms-grid';
        
        this.modal = document.getElementById(this.modalId);
        this.button = document.getElementById(this.buttonId);
        this.grid = document.getElementById(this.gridId);
        
        this.isOpen = false;
        this.formas = ELEMENTS.formaEvoluida || [];
        // Sistema de desbloqueio: armazena quais formas foram criadas
        this.unlockedForms = new Set(JSON.parse(localStorage.getItem('unlockedForms') || '[]'));
        
        if (!this.modal || !this.button || !this.grid) {
            console.warn('[EvolvedFormsUI] Elementos DOM não encontrados');
            return;
        }
        
        this.init();
    }
    
    /**
     * Inicializa listeners e renderiza o painel
     */
    init() {
        this.setupButtonListener();
        this.setupCloseButton();
        this.renderForms();
        this.setupCardInteractions();
    }
    
    /**
     * Configura o listener do botão flutuante
     */
    setupButtonListener() {
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
    }
    
    /**
     * Configura o botão de fechar do modal
     */
    setupCloseButton() {
        const closeBtn = this.modal.querySelector('.evolved-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
    }
    
    /**
     * Abre ou fecha o modal
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * Abre o modal
     */
    open() {
        this.modal.classList.remove('hidden');
        this.isOpen = true;
        this.button.classList.add('active');
    }
    
    /**
     * Fecha o modal
     */
    close() {
        this.modal.classList.add('hidden');
        this.isOpen = false;
        this.button.classList.remove('active');
    }
    
    /**
     * Renderiza todos os cards de formas evoluídas
     */
    renderForms() {
        this.grid.innerHTML = '';
        
        this.formas.forEach(forma => {
            const isUnlocked = this.unlockedForms.has(forma.id);
            const card = this.createFormCard(forma, isUnlocked);
            this.grid.appendChild(card);
        });
    }
    
    /**
     * Cria um card individual de forma evoluída
     * @param {Object} forma - Objeto da forma
     * @param {boolean} isUnlocked - Se a forma foi desbloqueada
     */
    createFormCard(forma, isUnlocked = false) {
        const card = document.createElement('div');
        card.className = isUnlocked ? 'evolved-form-card unlocked' : 'evolved-form-card locked';
        card.dataset.formId = forma.id;
        card.dataset.locked = !isUnlocked;
        
        // Container da silhueta SVG
        const silhouetteContainer = document.createElement('div');
        silhouetteContainer.className = 'form-silhouette-container';
        silhouetteContainer.innerHTML = this.generateFormSilhouette(forma.id, isUnlocked);
        
        // Nome da forma
        const nameEl = document.createElement('div');
        nameEl.className = 'form-name';
        nameEl.textContent = isUnlocked ? forma.name : '???';
        
        // Receita (aparece ao hover)
        const recipeEl = document.createElement('div');
        recipeEl.className = 'form-recipe';
        recipeEl.textContent = isUnlocked ? this.getRecipeHint(forma.id) : 'Bloqueado';
        
        // Status (desbloqueável)
        const statusEl = document.createElement('div');
        statusEl.className = 'form-status';
        statusEl.textContent = isUnlocked ? '🔓' : '🔒';
        
        card.appendChild(silhouetteContainer);
        card.appendChild(nameEl);
        card.appendChild(recipeEl);
        card.appendChild(statusEl);
        
        return card;
    }
    
    /**
     * Gera uma silhueta SVG da forma
     * Estilo "retro pixel art" com bom contraste
     * @param {string} shapeId - ID da forma
     * @param {boolean} isUnlocked - Se a forma está desbloqueada (afeta cores)
     */
    generateFormSilhouette(shapeId, isUnlocked = true) {
        const size = 70;
        const c = size / 2;
        const color = isUnlocked ? '#0ff' : '#444';
        const strokeWidth = isUnlocked ? 2 : 1;
        
        let shapePath = '';
        
        switch(shapeId) {
            case 'cilindro':
                shapePath = `
                    <ellipse cx="${c}" cy="${c - 15}" rx="18" ry="8" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <line x1="${c - 18}" y1="${c - 15}" x2="${c - 18}" y2="${c + 15}"/>
                    <line x1="${c + 18}" y1="${c - 15}" x2="${c + 18}" y2="${c + 15}"/>
                    <ellipse cx="${c}" cy="${c + 15}" rx="18" ry="8" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                `;
                break;
                
            case 'cone':
                shapePath = `
                    <polygon points="${c},${c - 28} ${c + 20},${c + 15} ${c - 20},${c + 15}" 
                             stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <ellipse cx="${c}" cy="${c + 15}" rx="20" ry="8" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                `;
                break;
                
            case 'piramide':
                shapePath = `
                    <polygon points="${c},${c - 25} ${c + 22},${c + 20} ${c - 22},${c + 20}" 
                             stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <line x1="${c}" y1="${c - 25}" x2="${c}" y2="${c + 20}"/>
                `;
                break;
                
            case 'esfera':
                shapePath = `
                    <circle cx="${c}" cy="${c}" r="24" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <ellipse cx="${c}" cy="${c}" rx="24" ry="10" stroke="${color}" stroke-width="${strokeWidth - 1}" fill="none"/>
                    <ellipse cx="${c}" cy="${c}" rx="10" ry="24" stroke="${color}" stroke-width="${strokeWidth - 1}" fill="none"/>
                `;
                break;
                
            case 'tesseract':
                shapePath = `
                    <rect x="${c - 16}" y="${c - 16}" width="32" height="32" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <rect x="${c - 10}" y="${c - 10}" width="20" height="20" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <line x1="${c - 16}" y1="${c - 16}" x2="${c - 10}" y2="${c - 10}"/>
                    <line x1="${c + 16}" y1="${c - 16}" x2="${c + 10}" y2="${c - 10}"/>
                    <line x1="${c - 16}" y1="${c + 16}" x2="${c - 10}" y2="${c + 10}"/>
                    <line x1="${c + 16}" y1="${c + 16}" x2="${c + 10}" y2="${c + 10}"/>
                `;
                break;
                
            case 'pentagono':
                shapePath = this.generatePolygonSilhouette(5, c, c, 22, color, strokeWidth);
                break;
                
            case 'hexagono':
                shapePath = this.generatePolygonSilhouette(6, c, c, 22, color, strokeWidth);
                break;
                
            case 'cruz':
                shapePath = `
                    <polygon points="${c - 10},${c - 28} ${c + 10},${c - 28} ${c + 10},${c - 10}
                                     ${c + 28},${c - 10} ${c + 28},${c + 10} ${c + 10},${c + 10}
                                     ${c + 10},${c + 28} ${c - 10},${c + 28} ${c - 10},${c + 10}
                                     ${c - 28},${c + 10} ${c - 28},${c - 10} ${c - 10},${c - 10}"
                             stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                `;
                break;
                
            case 'estrela':
                shapePath = this.generateStarSilhouette(c, c, 24, color, strokeWidth);
                break;
                
            case 'capsula':
                shapePath = `
                    <path d="M${c - 12},${c - 22} A12,12 0 0,1 ${c + 12},${c - 22}
                             L${c + 12},${c + 22} A12,12 0 0,1 ${c - 12},${c + 22} Z"
                          stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                `;
                break;
                
            case 'domo':
                shapePath = `
                    <path d="M${c - 22},${c + 5} A22,15 0 0,1 ${c + 22},${c + 5}"
                          stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <rect x="${c - 22}" y="${c + 5}" width="44" height="18" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                `;
                break;
                
            case 'obelisco':
                shapePath = `
                    <rect x="${c - 8}" y="${c - 28}" width="16" height="50" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <polygon points="${c},${c - 32} ${c + 10},${c - 28} ${c - 10},${c - 28}"
                             stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                `;
                break;
                
            case 'monolito':
                shapePath = `
                    <rect x="${c - 7}" y="${c - 32}" width="14" height="64" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <line x1="${c - 4}" y1="${c - 28}" x2="${c - 4}" y2="${c + 28}"/>
                    <line x1="${c + 4}" y1="${c - 28}" x2="${c + 4}" y2="${c + 28}"/>
                `;
                break;
                
            case 'cristal':
                shapePath = `
                    <polygon points="${c},${c - 28} ${c + 14},${c - 8} ${c + 14},${c + 22} ${c},${c + 28} ${c - 14},${c + 22} ${c - 14},${c - 8}"
                             stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <line x1="${c}" y1="${c - 28}" x2="${c}" y2="${c + 28}"/>
                `;
                break;
                
            case 'fractal':
                // Triângulo de Sierpinski simplificado
                shapePath = `
                    <polygon points="${c},${c - 24} ${c + 20},${c + 14} ${c - 20},${c + 14}" 
                             stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <polygon points="${c},${c - 2} ${c + 10},${c + 10} ${c - 10},${c + 10}" 
                             stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <polygon points="${c - 10},${c + 10} ${c - 5},${c + 16} ${c - 15},${c + 16}" 
                             stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                    <polygon points="${c + 10},${c + 10} ${c + 15},${c + 16} ${c + 5},${c + 16}" 
                             stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
                `;
                break;
                
            case 'espiral':
                // Espiral de Arquimedes simplificada
                shapePath = `
                    <path d="M${c},${c} 
                             Q${c + 10},${c - 5} ${c + 8},${c - 12}
                             Q${c},${c - 18} ${c - 12},${c - 12}
                             Q${c - 20},${c} ${c - 12},${c + 14}
                             Q${c},${c + 22} ${c + 16},${c + 12}
                             Q${c + 24},${c} ${c + 14},${c - 16}"
                          stroke="${color}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round"/>
                `;
                break;
                
            default:
                // Fallback: quadrado genérico
                shapePath = `<rect x="${c - 18}" y="${c - 18}" width="36" height="36" 
                                   stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`;
        }
        
        return `
            <svg class="form-silhouette-svg" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="glow-${shapeId}" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g filter="url(#glow-${shapeId})">
                    ${shapePath}
                </g>
            </svg>
        `;
    }
    
    /**
     * Gera silhueta de polígono regular
     */
    generatePolygonSilhouette(sides, cx, cy, radius, color, strokeWidth) {
        let points = '';
        for (let i = 0; i < sides; i++) {
            const angle = (i * 360 / sides - 90) * Math.PI / 180;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            points += `${x},${y} `;
        }
        return `<polygon points="${points.trim()}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`;
    }
    
    /**
     * Gera silhueta de estrela
     */
    generateStarSilhouette(cx, cy, radius, color, strokeWidth) {
        let points = '';
        for (let i = 0; i < 10; i++) {
            const angle = (i * 36 - 90) * Math.PI / 180;
            const r = i % 2 === 0 ? radius : radius * 0.4;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            points += `${x},${y} `;
        }
        return `<polygon points="${points.trim()}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`;
    }
    
    /**
     * Retorna dica de receita para cada forma
     */
    getRecipeHint(shapeId) {
        const recipes = {
            'cilindro': '🔴 + 🟦',
            'cone': '🔴 + 🔺',
            'piramide': '🟦 + 🔺',
            'esfera': '🔴 + 🔴',
            'tesseract': '🟦 + 🟦',
            'pentagono': 'Avançado',
            'hexagono': 'Avançado',
            'cruz': 'Avançado',
            'estrela': 'Avançado',
            'capsula': 'Síntese múltipla',
            'domo': 'Síntese múltipla',
            'obelisco': 'Síntese múltipla',
            'monolito': 'Síntese múltipla',
            'cristal': 'Especial',
            'fractal': 'Especial',
            'espiral': 'Especial'
        };
        return recipes[shapeId] || 'Desconhecida';
    }
    
    /**
     * Configura interações dos cards
     */
    setupCardInteractions() {
        const cards = this.grid.querySelectorAll('.evolved-form-card');
        
        cards.forEach(card => {
            const isLocked = card.dataset.locked === 'true';
            
            card.addEventListener('mouseenter', () => {
                card.style.animation = 'none';
                // Força reflow
                card.offsetHeight;
                card.style.animation = '';
            });
            
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isLocked) {
                    const formId = card.dataset.formId;
                    this.onFormCardClick(formId);
                }
            });
        });
    }
    
    /**
     * Handler para clique em um card de forma
     */
    onFormCardClick(formId) {
        // Emite evento customizado para que o main.js possa ouvir
        const event = new CustomEvent('evolved-form-selected', {
            detail: { formId }
        });
        document.dispatchEvent(event);
        
        // Toca beep de confirmação
        this.playFormBeep(formId);
    }
    
    /**
     * Toca um beep customizado para a forma selecionada
     */
    playFormBeep(formId) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            
            // Frequência varia por forma
            const frequencies = {
                'cilindro': 500, 'cone': 550, 'piramide': 600, 'esfera': 650,
                'tesseract': 700, 'pentagono': 750, 'hexagono': 800, 'cruz': 850,
                'estrela': 900, 'capsula': 550, 'domo': 600, 'obelisco': 700,
                'monolito': 750, 'cristal': 800, 'fractal': 900, 'espiral': 950
            };
            
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.frequency.value = frequencies[formId] || 600;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {
            // Audio não disponível, ignora silenciosamente
        }
    }
    
    /**
     * Anima o botão flutuante quando uma forma é desbloqueada
     * Efeito: shake + glow temporário (como em jogos SNES)
     */
    playUnlockAnimation() {
        if (!this.button) return;
        
        // Toca som de desbloqueio (estilo item coletado SNES)
        this.playUnlockSound();
        
        // Remove animação anterior se houver
        this.button.classList.remove('unlock-pulse');
        
        // Força reflow para trigger animation restart
        void this.button.offsetHeight;
        
        // Adiciona classe de animação
        this.button.classList.add('unlock-pulse');
        
        // Remove a classe após a animação terminar (1.2s)
        setTimeout(() => {
            this.button.classList.remove('unlock-pulse');
        }, 1200);
    }
    
    /**
     * Som de desbloqueio - jingle de 3 notas (estilo SNES item coletado)
     */
    playUnlockSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            
            // Notas do jingle: C5 → E5 → G5 (acorde de C maior ascendente)
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            const noteDuration = 0.1;
            
            notes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.frequency.value = freq;
                osc.type = 'square'; // Som mais "8-bit"
                
                const noteStart = now + (i * noteDuration);
                gain.gain.setValueAtTime(0.12, noteStart);
                gain.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration * 1.5);
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.start(noteStart);
                osc.stop(noteStart + noteDuration * 2);
            });
        } catch (e) {
            // Audio não disponível
        }
    }
}

/**
 * Desbloqueia uma forma (chamado quando um Golem é criado)
 * @param {EvolvedFormsUI} uiInstance - Instância do EvolvedFormsUI
 * @param {string} formId - ID da forma a desbloquear
 * @returns {boolean} true se foi a primeira vez que foi desbloqueada
 */
export function unlockForm(uiInstance, formId) {
    if (!uiInstance.unlockedForms.has(formId)) {
        uiInstance.unlockedForms.add(formId);
        localStorage.setItem('unlockedForms', JSON.stringify([...uiInstance.unlockedForms]));
        uiInstance.renderForms();
        uiInstance.setupCardInteractions();
        uiInstance.playUnlockAnimation();
        return true; // Forma foi desbloqueada pela primeira vez
    }
    return false; // Forma já estava desbloqueada
}

/**
 * Inicializa a UI de formas evoluídas
 * Deve ser chamada após DOM estar pronto
 */
export function initEvolvedFormsUI(options = {}) {
    return new EvolvedFormsUI(options);
}

/**
 * Adiciona event listener global para clique fora do modal
 */
export function setupModalBackdropClose(uiInstance) {
    document.addEventListener('click', (e) => {
        if (!uiInstance.modal.contains(e.target) && !uiInstance.button.contains(e.target)) {
            if (uiInstance.isOpen) {
                uiInstance.close();
            }
        }
    });
}
