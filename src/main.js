import Phaser from 'phaser';
import { generateGolemData } from './services/MockAiService.js';
import SanctuaryScene from './scenes/SanctuaryScene';
import { ELEMENTS } from './data/gameData.js';
import { calculateGeometry } from './utils/GeometryMath.js';
import { initEvolvedFormsUI, setupModalBackdropClose, unlockForm } from './ui/evolved-forms-ui.js';
import { UISoundSystem } from './systems/UISoundSystem.js';
import { TutorialSystem } from './systems/TutorialSystem.js';
import './style.css';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SanctuaryScene]
};

const game = new Phaser.Game(config);

document.addEventListener('DOMContentLoaded', () => {
    let currentSelection = { forma: null, quimica: null, fisica: null };
    let activeCategory = 'forma';

    // ═══════════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO DA UI DE FORMAS EVOLUÍDAS
    // Painel flutuante com catálogo de formas desbloqueáveis
    // ═══════════════════════════════════════════════════════════════════
    
    let evolvedFormsUI = null;
    try {
        evolvedFormsUI = initEvolvedFormsUI();
        setupModalBackdropClose(evolvedFormsUI);
        
        // Listener para quando uma forma é selecionada no catálogo
        document.addEventListener('evolved-form-selected', (e) => {
            console.log(`[EvolvedForms] Forma selecionada: ${e.detail.formId}`);
            // Aqui você pode adicionar ações adicionais, como:
            // - Mostrar tutorial
            // - Registrar estatísticas
            // - Highlight no painel de seleção quando forma for obtida
        });
        
        // Listener para desbloqueio de formas via Alquimia (reprodução)
        game.events.on('golem-created-with-form', (data) => {
            if (evolvedFormsUI && data.formId) {
                const isEvolvedForm = ELEMENTS.formaEvoluida.some(f => f.id === data.formId);
                if (isEvolvedForm) {
                    const wasNewUnlock = unlockForm(evolvedFormsUI, data.formId);
                    if (wasNewUnlock) {
                        console.log(`[EvolvedForms] Nova forma desbloqueada via Alquimia: ${data.formId}!`);
                    }
                }
            }
        });
    } catch (error) {
        console.warn('[EvolvedFormsUI] Não foi possível inicializar:', error);
    }

    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE FEEDBACK SENSORIAL - Audio + Tooltips
    // Dopamina garantida ao interagir com a UI
    // ═══════════════════════════════════════════════════════════════════
    
    // Inicializa o sistema de som na primeira interação do usuário
    document.addEventListener('click', () => UISoundSystem.init(), { once: true });
    document.addEventListener('keydown', () => UISoundSystem.init(), { once: true });
    
    // Cria o elemento de Tooltip global
    const techTooltip = createTechTooltip();
    document.body.appendChild(techTooltip);
    
    /**
     * Cria o elemento de tooltip estilo terminal sci-fi
     */
    function createTechTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tech-tooltip';
        tooltip.id = 'tech-tooltip';
        tooltip.innerHTML = `
            <div class="tech-tooltip-header">
                <span class="tech-tooltip-icon">◆</span>
                <span class="tech-tooltip-title">SCANNING...</span>
            </div>
            <div class="tech-tooltip-body">Carregando dados...</div>
            <div class="tech-tooltip-tag">SISTEMA</div>
        `;
        return tooltip;
    }
    
    /**
     * Atualiza e mostra o tooltip
     */
    function showTooltip(element, mouseX, mouseY) {
        const title = element.dataset.name || element.dataset.id || element.title || element.textContent?.trim() || 'ITEM';
        const desc = element.dataset.desc || element.title || 'Sem descrição disponível';
        const category = element.dataset.category || 'default';
        const icon = element.querySelector('.option-icon')?.textContent || '◆';
        
        // Atualiza conteúdo
        techTooltip.querySelector('.tech-tooltip-icon').textContent = icon;
        techTooltip.querySelector('.tech-tooltip-title').textContent = title.toUpperCase();
        techTooltip.querySelector('.tech-tooltip-body').textContent = desc;
        techTooltip.querySelector('.tech-tooltip-tag').textContent = category.toUpperCase();
        
        // Atualiza classe de categoria para cor
        techTooltip.className = 'tech-tooltip';
        if (category) {
            techTooltip.classList.add(`category-${category}`);
        }
        
        // Posiciona próximo ao mouse
        const offsetX = 15;
        const offsetY = 15;
        let x = mouseX + offsetX;
        let y = mouseY + offsetY;
        
        // Evita sair da tela
        const tooltipRect = { width: 280, height: 120 }; // Estimativa
        if (x + tooltipRect.width > window.innerWidth - 20) {
            x = mouseX - tooltipRect.width - offsetX;
        }
        if (y + tooltipRect.height > window.innerHeight - 20) {
            y = mouseY - tooltipRect.height - offsetY;
        }
        
        techTooltip.style.left = `${x}px`;
        techTooltip.style.top = `${y}px`;
        
        // Mostra com animação
        techTooltip.classList.add('visible');
    }
    
    /**
     * Esconde o tooltip
     */
    function hideTooltip() {
        techTooltip.classList.remove('visible');
    }
    
    /**
     * Atualiza posição do tooltip seguindo o mouse
     */
    function updateTooltipPosition(mouseX, mouseY) {
        if (!techTooltip.classList.contains('visible')) return;
        
        const offsetX = 15;
        const offsetY = 15;
        let x = mouseX + offsetX;
        let y = mouseY + offsetY;
        
        const rect = techTooltip.getBoundingClientRect();
        if (x + rect.width > window.innerWidth - 20) {
            x = mouseX - rect.width - offsetX;
        }
        if (y + rect.height > window.innerHeight - 20) {
            y = mouseY - rect.height - offsetY;
        }
        
        techTooltip.style.left = `${x}px`;
        techTooltip.style.top = `${y}px`;
    }
    
    // ═══ EVENT DELEGATION para hover/click em elementos interativos ═══
    // Mais eficiente que adicionar listeners individuais
    
    let currentHoveredElement = null;
    
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.option-item, .pixel-btn, .tool-slot');
        
        if (target && target !== currentHoveredElement) {
            currentHoveredElement = target;
            
            // Som de hover
            const category = target.dataset.category || 'default';
            UISoundSystem.playHover(category);
            
            // Mostra tooltip se tiver dados
            if (target.dataset.desc || target.dataset.name || target.title) {
                showTooltip(target, e.clientX, e.clientY);
            }
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('.option-item, .pixel-btn, .tool-slot');
        
        if (target && !target.contains(e.relatedTarget)) {
            currentHoveredElement = null;
            hideTooltip();
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (currentHoveredElement) {
            updateTooltipPosition(e.clientX, e.clientY);
        }
    });
    
    // Som de clique via delegation
    document.addEventListener('mousedown', (e) => {
        const target = e.target.closest('.option-item, .pixel-btn, .tool-slot');
        
        if (target) {
            // Determina o tipo de clique pelo elemento
            if (target.classList.contains('option-item')) {
                UISoundSystem.playSelect();
            } else if (target.classList.contains('tool-slot')) {
                UISoundSystem.playClick('special');
            } else {
                UISoundSystem.playClick('confirm');
            }
        }
    });

    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE AUDIO UI - BEEPS E SONS SATISFATÓRIOS (LEGACY)
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Reproduz um beep curto e satisfatório com WebAudio
     * @param {number} frequency - Frequência em Hz (padrão 800)
     * @param {number} duration - Duração em segundos (padrão 0.1)
     * @param {number} volume - Volume 0-1 (padrão 0.1)
     */
    function playUIBeep(frequency = 800, duration = 0.1, volume = 0.1) {
        try {
            // Tenta usar o audioContext do Phaser game se disponível
            let audioContext = null;
            if (game && game.sound && game.sound.context) {
                audioContext = game.sound.context;
            } else {
                // Fallback: cria um novo AudioContext
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) audioContext = new AudioContext();
            }
            
            if (!audioContext) return; // AudioContext não disponível
            
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.frequency.value = frequency;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            // Silenciosamente ignora erros de áudio
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONSTANTES DE CORES E ÍCONES
    // ═══════════════════════════════════════════════════════════════════
    
    const PHYSICS_COLORS = {
        'eletricidade': '#ffea00',
        'calor': '#ff4d00',
        'radiacao': '#00ff00',
        'gravidade': '#9d00ff',
        'luz': '#ffffff',
        'frio': '#0088ff',
        'magnetismo': '#ff00aa',
        'entropia': '#888888',
        'sonico': '#ff8800'
    };

    const CHEMISTRY_COLORS = {
        'carbono': '#444444',
        'ferro': '#708090',
        'silicio': '#4a6fa5',
        'ouro': '#ffd700',
        'cristal': '#88ddff',
        'mercurio': '#c0c0c0',
        'bismuto': '#ff69b4'
    };

    const FORMA_COLORS = {
        'circulo': '#00ffff',
        'quadrado': '#00ff88',
        'triangulo': '#ff8800'
    };
    
    // ═══════════════════════════════════════════════════════════════════
    // ENGINE DE RENDERIZAÇÃO SVG (REUTILIZÁVEL)
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Gera um SVG representando o Golem com forma, química e física
     * @param {string} shape - ID da forma (circulo, quadrado, etc.)
     * @param {string} chemistry - ID da química (ferro, ouro, etc.)
     * @param {string} physics - ID da física (eletricidade, calor, etc.)
     * @param {number} scaleX - Escala horizontal (1.0 = normal)
     * @param {number} scaleY - Escala vertical (1.0 = normal)
     * @param {number} size - Tamanho do SVG em pixels
     * @returns {string} String HTML do SVG
     */
    function generateGolemSVG(shape, chemistry, physics, scaleX = 1, scaleY = 1, size = 100) {
        const c = size / 2; // Centro
        const s = size;     // Tamanho
        
        // Cor baseada na física
        const color = PHYSICS_COLORS[physics] || '#00ffff';
        
        // Normaliza escala para aspect ratio
        const maxSc = Math.max(scaleX, scaleY, 1);
        const nX = scaleX / maxSc;
        const nY = scaleY / maxSc;
        const avgScale = (nX + nY) / 2;
        
        // Gera o path da forma
        let shapePath = '';
        const strokeWidth = Math.max(1.5, 2 * avgScale);
        
        switch(shape) {
            case 'circulo':
                shapePath = `<ellipse cx="${c}" cy="${c}" rx="${s*0.38*nX}" ry="${s*0.38*nY}"/>`;
                break;
            case 'quadrado': {
                const w = s*0.65*nX;
                const h = s*0.65*nY;
                shapePath = `<rect x="${c-w/2}" y="${c-h/2}" width="${w}" height="${h}"/>`;
                break;
            }
            case 'triangulo':
                shapePath = `<polygon points="${c},${c - s*0.38*nY} ${c + s*0.33*nX},${c + s*0.28*nY} ${c - s*0.33*nX},${c + s*0.28*nY}"/>`;
                break;
            case 'pentagono': {
                const pts = [];
                for(let i=0; i<5; i++) {
                    const angle = (i * 72 - 90) * Math.PI / 180;
                    pts.push(`${c + Math.cos(angle)*s*0.36*nX},${c + Math.sin(angle)*s*0.36*nY}`);
                }
                shapePath = `<polygon points="${pts.join(' ')}"/>`;
                break;
            }
            case 'hexagono': {
                const pts = [];
                for(let i=0; i<6; i++) {
                    const angle = (i * 60 - 90) * Math.PI / 180;
                    pts.push(`${c + Math.cos(angle)*s*0.36*nX},${c + Math.sin(angle)*s*0.36*nY}`);
                }
                shapePath = `<polygon points="${pts.join(' ')}"/>`;
                break;
            }
            case 'losango':
                shapePath = `<polygon points="${c},${c - s*0.4*nY} ${c + s*0.28*nX},${c} ${c},${c + s*0.4*nY} ${c - s*0.28*nX},${c}"/>`;
                break;
            case 'estrela': {
                const pts = [];
                for(let i=0; i<10; i++) {
                    const angle = (i * 36 - 90) * Math.PI / 180;
                    const r = i % 2 === 0 ? s*0.36 : s*0.16;
                    pts.push(`${c + Math.cos(angle)*r*nX},${c + Math.sin(angle)*r*nY}`);
                }
                shapePath = `<polygon points="${pts.join(' ')}"/>`;
                break;
            }
            case 'cruz': {
                const arm = s*0.15;
                const len = s*0.35;
                shapePath = `<polygon points="
                    ${c-arm*nX},${c-len*nY} ${c+arm*nX},${c-len*nY} ${c+arm*nX},${c-arm*nY}
                    ${c+len*nX},${c-arm*nY} ${c+len*nX},${c+arm*nY} ${c+arm*nX},${c+arm*nY}
                    ${c+arm*nX},${c+len*nY} ${c-arm*nX},${c+len*nY} ${c-arm*nX},${c+arm*nY}
                    ${c-len*nX},${c+arm*nY} ${c-len*nX},${c-arm*nY} ${c-arm*nX},${c-arm*nY}
                "/>`;
                break;
            }
            case 'cilindro':
                shapePath = `
                    <ellipse cx="${c}" cy="${c - s*0.25*nY}" rx="${s*0.32*nX}" ry="${s*0.1}"/>
                    <line x1="${c - s*0.32*nX}" y1="${c - s*0.25*nY}" x2="${c - s*0.32*nX}" y2="${c + s*0.25*nY}"/>
                    <line x1="${c + s*0.32*nX}" y1="${c - s*0.25*nY}" x2="${c + s*0.32*nX}" y2="${c + s*0.25*nY}"/>
                    <ellipse cx="${c}" cy="${c + s*0.25*nY}" rx="${s*0.32*nX}" ry="${s*0.1}"/>`;
                break;
            case 'cone':
                shapePath = `
                    <polygon points="${c},${c - s*0.4*nY} ${c + s*0.32*nX},${c + s*0.25*nY} ${c - s*0.32*nX},${c + s*0.25*nY}"/>
                    <ellipse cx="${c}" cy="${c + s*0.25*nY}" rx="${s*0.32*nX}" ry="${s*0.09}"/>`;
                break;
            case 'capsula':
                shapePath = `<path d="M${c - s*0.2*nX},${c - s*0.2*nY} 
                    A${s*0.2*nX},${s*0.2*nX} 0 0,1 ${c + s*0.2*nX},${c - s*0.2*nY}
                    L${c + s*0.2*nX},${c + s*0.2*nY}
                    A${s*0.2*nX},${s*0.2*nX} 0 0,1 ${c - s*0.2*nX},${c + s*0.2*nY} Z"/>`;
                break;
            case 'domo':
                shapePath = `
                    <path d="M${c - s*0.35*nX},${c + s*0.1*nY} 
                        A${s*0.35*nX},${s*0.35*nY} 0 0,1 ${c + s*0.35*nX},${c + s*0.1*nY}"/>
                    <rect x="${c - s*0.35*nX}" y="${c + s*0.1*nY}" width="${s*0.7*nX}" height="${s*0.15*nY}"/>`;
                break;
            case 'piramide':
                shapePath = `
                    <polygon points="${c},${c - s*0.4*nY} ${c + s*0.35*nX},${c + s*0.3*nY} ${c - s*0.35*nX},${c + s*0.3*nY}"/>
                    <line x1="${c}" y1="${c - s*0.4*nY}" x2="${c}" y2="${c + s*0.3*nY}"/>`;
                break;
            case 'obelisco':
                shapePath = `
                    <rect x="${c - s*0.12*nX}" y="${c - s*0.35*nY}" width="${s*0.24*nX}" height="${s*0.75*nY}"/>
                    <polygon points="${c - s*0.12*nX},${c - s*0.35*nY} ${c},${c - s*0.48*nY} ${c + s*0.12*nX},${c - s*0.35*nY}"/>`;
                break;
            case 'monolito':
                shapePath = `
                    <rect x="${c - s*0.1*nX}" y="${c - s*0.42*nY}" width="${s*0.2*nX}" height="${s*0.84*nY}"/>
                    <line x1="${c - s*0.06*nX}" y1="${c - s*0.38*nY}" x2="${c - s*0.06*nX}" y2="${c + s*0.38*nY}"/>
                    <line x1="${c + s*0.06*nX}" y1="${c - s*0.38*nY}" x2="${c + s*0.06*nX}" y2="${c + s*0.38*nY}"/>`;
                break;
            case 'tesseract':
                shapePath = `
                    <rect x="${c - s*0.28*nX}" y="${c - s*0.28*nY}" width="${s*0.56*nX}" height="${s*0.56*nY}"/>
                    <rect x="${c - s*0.18*nX}" y="${c - s*0.18*nY}" width="${s*0.36*nX}" height="${s*0.36*nY}"/>
                    <line x1="${c - s*0.28*nX}" y1="${c - s*0.28*nY}" x2="${c - s*0.18*nX}" y2="${c - s*0.18*nY}"/>
                    <line x1="${c + s*0.28*nX}" y1="${c - s*0.28*nY}" x2="${c + s*0.18*nX}" y2="${c - s*0.18*nY}"/>
                    <line x1="${c - s*0.28*nX}" y1="${c + s*0.28*nY}" x2="${c - s*0.18*nX}" y2="${c + s*0.18*nY}"/>
                    <line x1="${c + s*0.28*nX}" y1="${c + s*0.28*nY}" x2="${c + s*0.18*nX}" y2="${c + s*0.18*nY}"/>`;
                break;
            case 'fractal': {
                const h = s*0.35;
                shapePath = `
                    <polygon points="${c},${c - h*nY} ${c + h*0.866*nX},${c + h*0.5*nY} ${c - h*0.866*nX},${c + h*0.5*nY}"/>
                    <polygon points="${c},${c + h*0.5*nY} ${c + h*0.433*nX},${c - h*0.25*nY} ${c - h*0.433*nX},${c - h*0.25*nY}"/>`;
                break;
            }
            case 'esfera':
                shapePath = `
                    <circle cx="${c}" cy="${c}" r="${s*0.35*avgScale}"/>
                    <ellipse cx="${c}" cy="${c}" rx="${s*0.35*nX}" ry="${s*0.12*nY}"/>
                    <ellipse cx="${c}" cy="${c}" rx="${s*0.12*nX}" ry="${s*0.35*nY}"/>`;
                break;
            case 'cristal':
                shapePath = `
                    <polygon points="${c},${c - s*0.4*nY} ${c + s*0.18*nX},${c} ${c + s*0.05*nX},${c + s*0.4*nY} ${c - s*0.05*nX},${c + s*0.4*nY} ${c - s*0.18*nX},${c}"/>
                    <line x1="${c}" y1="${c - s*0.4*nY}" x2="${c + s*0.18*nX}" y2="${c}"/>
                    <line x1="${c}" y1="${c - s*0.4*nY}" x2="${c - s*0.18*nX}" y2="${c}"/>`;
                break;
            case 'olho':
                shapePath = `
                    <path d="M${c - s*0.35*nX},${c} Q${c},${c - s*0.28*nY} ${c + s*0.35*nX},${c} Q${c},${c + s*0.28*nY} ${c - s*0.35*nX},${c}"/>
                    <circle cx="${c}" cy="${c}" r="${s*0.14*avgScale}"/>
                    <circle cx="${c}" cy="${c}" r="${s*0.06*avgScale}" fill="${color}"/>`;
                break;
            case 'mira':
                shapePath = `
                    <circle cx="${c}" cy="${c}" r="${s*0.3*avgScale}"/>
                    <line x1="${c}" y1="${c - s*0.42*nY}" x2="${c}" y2="${c + s*0.42*nY}"/>
                    <line x1="${c - s*0.42*nX}" y1="${c}" x2="${c + s*0.42*nX}" y2="${c}"/>`;
                break;
            default:
                shapePath = `<rect x="${c - s*0.25}" y="${c - s*0.25}" width="${s*0.5}" height="${s*0.5}"/>`;
        }
        
        // Padrão químico (overlay sutil)
        let chemPattern = '';
        const patternOpacity = 0.35;
        
        switch(chemistry) {
            case 'ferro':
                // Hachuras diagonais
                chemPattern = `<g stroke="${color}" stroke-opacity="${patternOpacity}" stroke-width="0.8">
                    <line x1="${c - s*0.3}" y1="${c - s*0.3}" x2="${c + s*0.3}" y2="${c + s*0.3}"/>
                    <line x1="${c - s*0.2}" y1="${c - s*0.35}" x2="${c + s*0.35}" y2="${c + s*0.2}"/>
                    <line x1="${c - s*0.35}" y1="${c - s*0.2}" x2="${c + s*0.2}" y2="${c + s*0.35}"/>
                    <line x1="${c + s*0.3}" y1="${c - s*0.3}" x2="${c - s*0.3}" y2="${c + s*0.3}"/>
                </g>`;
                break;
            case 'ouro':
                // Brilhos especulares
                chemPattern = `<g fill="white" fill-opacity="0.5">
                    <ellipse cx="${c - s*0.12}" cy="${c - s*0.12}" rx="${s*0.08}" ry="${s*0.04}" transform="rotate(-30 ${c - s*0.12} ${c - s*0.12})"/>
                    <ellipse cx="${c + s*0.08}" cy="${c + s*0.05}" rx="${s*0.04}" ry="${s*0.02}" transform="rotate(-30 ${c + s*0.08} ${c + s*0.05})"/>
                </g>`;
                break;
            case 'cristal':
                // Linhas de refração
                chemPattern = `<g stroke="${color}" stroke-opacity="${patternOpacity}" stroke-width="0.6">
                    <line x1="${c}" y1="${c}" x2="${c}" y2="${c - s*0.35}"/>
                    <line x1="${c}" y1="${c}" x2="${c + s*0.35}" y2="${c}"/>
                    <line x1="${c}" y1="${c}" x2="${c}" y2="${c + s*0.35}"/>
                    <line x1="${c}" y1="${c}" x2="${c - s*0.35}" y2="${c}"/>
                    <line x1="${c}" y1="${c}" x2="${c + s*0.25}" y2="${c - s*0.25}"/>
                    <line x1="${c}" y1="${c}" x2="${c - s*0.25}" y2="${c + s*0.25}"/>
                </g>`;
                break;
            case 'silicio':
                // Circuito PCB
                chemPattern = `<g stroke="${color}" stroke-opacity="${patternOpacity}" stroke-width="0.8" fill="none">
                    <path d="M${c - s*0.2},${c - s*0.1} L${c},${c - s*0.1} L${c},${c + s*0.1} L${c + s*0.2},${c + s*0.1}"/>
                    <rect x="${c - s*0.05}" y="${c - s*0.05}" width="${s*0.1}" height="${s*0.1}"/>
                </g>`;
                break;
            case 'uranio':
                // Núcleo radioativo
                chemPattern = `<g>
                    <circle cx="${c}" cy="${c}" r="${s*0.06}" fill="${color}" fill-opacity="0.6"/>
                    <circle cx="${c}" cy="${c}" r="${s*0.15}" stroke="${color}" stroke-opacity="${patternOpacity}" fill="none" stroke-dasharray="3,2"/>
                    <circle cx="${c}" cy="${c}" r="${s*0.25}" stroke="${color}" stroke-opacity="0.2" fill="none" stroke-dasharray="2,3"/>
                </g>`;
                break;
            case 'mercurio':
                // Ondas líquidas
                chemPattern = `<g stroke="${color}" stroke-opacity="${patternOpacity}" stroke-width="0.8" fill="none">
                    <path d="M${c - s*0.3},${c - s*0.05} Q${c - s*0.15},${c - s*0.15} ${c},${c - s*0.05} Q${c + s*0.15},${c + s*0.05} ${c + s*0.3},${c - s*0.05}"/>
                    <path d="M${c - s*0.3},${c + s*0.1} Q${c - s*0.15},${c} ${c},${c + s*0.1} Q${c + s*0.15},${c + s*0.2} ${c + s*0.3},${c + s*0.1}"/>
                </g>`;
                break;
        }
        
        // Olhos (expressão)
        const eyeOffset = s * 0.08;
        const eyeY = c - s * 0.05;
        const eyeR = s * 0.035;
        const eyes = `<g fill="${color}" opacity="0.9">
            <circle cx="${c - eyeOffset}" cy="${eyeY}" r="${eyeR}"/>
            <circle cx="${c + eyeOffset}" cy="${eyeY}" r="${eyeR}"/>
        </g>`;
        
        // Monta o SVG completo
        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="glow-${shape}-${size}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="${size * 0.025}" result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <g filter="url(#glow-${shape}-${size})" fill="none" stroke="${color}" stroke-width="${strokeWidth}">
                ${shapePath}
            </g>
            ${chemPattern}
            ${eyes}
        </svg>`;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ELEMENTOS DOM
    // ═══════════════════════════════════════════════════════════════════
    
    const creationPanel = document.getElementById('creation-panel');
    const btnOpen = document.getElementById('btn-open-lab');
    const btnSynthesize = document.getElementById('btn-synthesize');
    const btnCancel = document.getElementById('btn-cancel');
    const gridContainer = document.getElementById('options-grid');
    const recipeSummary = document.getElementById('recipe-summary');

    const slotForma = document.getElementById('slot-forma');
    const slotChem = document.getElementById('slot-chem');
    const slotPhys = document.getElementById('slot-phys');

    const btnTree = document.getElementById('btn-tree');
    const treeModal = document.getElementById('tree-modal');
    const btnCloseTree = document.getElementById('btn-close-tree');
    const treeContent = document.getElementById('tree-content');
    
    // Armazena os dados da árvore para acesso posterior
    let currentFamilyData = [];

    // Garantias de acessibilidade e suporte a scroll por roda/teclado
    if (treeContent) {
        // Torna focável para permitir keyboard scrolling (PageUp/PageDown, arrows)
        treeContent.tabIndex = 0;

        // O scroll CSS nativo deve funcionar; este listener é backup para edge cases
        treeContent.addEventListener('wheel', (ev) => {
            // Só manipula quando o modal estiver visível
            if (treeModal && treeModal.classList.contains('hidden')) return;
            
            // Verifica se o scroll nativo está funcionando
            const hasScrollableContent = treeContent.scrollHeight > treeContent.clientHeight;
            if (!hasScrollableContent) return; // Nada a rolar
            
            // Aplica scroll manualmente se o nativo não estiver sendo processado
            const atTop = treeContent.scrollTop <= 0;
            const atBottom = treeContent.scrollTop + treeContent.clientHeight >= treeContent.scrollHeight;
            
            // Só previne default se não estiver nos limites do scroll
            if ((ev.deltaY < 0 && !atTop) || (ev.deltaY > 0 && !atBottom)) {
                // Deixa o scroll nativo funcionar, não interfere
            }
        }, { passive: true }); // passive: true para não bloquear scroll
    }

    if (btnTree) {
        btnTree.addEventListener('click', () => {
            UISoundSystem.playOpen();
            treeModal.classList.remove('hidden');
            // Força re-render da árvore ao abrir usando os dados armazenados
            renderFamilyTree(currentFamilyData);
        });
    }
    if (btnCloseTree) {
        btnCloseTree.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            UISoundSystem.playClose();
            treeModal.classList.add('hidden');
        });
    }
    
    // Fechar modal ao clicar fora do conteúdo (no backdrop)
    if (treeModal) {
        treeModal.addEventListener('click', (e) => {
            if (e.target === treeModal) {
                UISoundSystem.playClose();
                treeModal.classList.add('hidden');
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // CHRONO-DECK: Controle Temporal Minimal
    // ═══════════════════════════════════════════════════════════════════
    
    const chronoButtons = document.querySelectorAll('.chrono-icon');
    const chronoDeck = document.getElementById('chrono-deck');
    
    // Estado para Time Dilation on Creation
    let savedTimeSpeed = 1;
    let isCreationMode = false;
    
    // Função para tocar som de clique (8-bits)
    function playChronoClick(speed) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            // Frequência baseada no botão
            const freqs = { 0: 200, 1: 400, 5: 600 };
            osc.frequency.value = freqs[speed] || 400;
            osc.type = 'square';
            
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {
            // Audio não disponível, ignora
        }
    }
    
    // Salva velocidade atual e bloqueia controles
    function enterCreationMode() {
        if (isCreationMode) return;
        isCreationMode = true;
        
        // Salva velocidade atual
        const activeBtn = document.querySelector('.chrono-icon.active');
        savedTimeSpeed = activeBtn ? parseFloat(activeBtn.dataset.speed) : 1;
        
        // Força velocidade para 1x (normal) durante criação
        if (savedTimeSpeed !== 1) {
            chronoButtons.forEach(b => b.classList.remove('active'));
            const playBtn = document.querySelector('.chrono-icon[data-speed="1"]');
            if (playBtn) playBtn.classList.add('active');
            game.events.emit('update-time-scale', 1);
        }
        
        // Bloqueia controles de tempo
        if (chronoDeck) chronoDeck.classList.add('disabled');
        console.log('[CHRONO] Creation mode: locked at 1x');
    }
    
    /**
     * Sai do modo de criação e gerencia velocidade do tempo
     * @param {boolean} shouldRestoreSpeed - Se true, restaura velocidade anterior.
     *                                       Se false, força 1x (para ver spawn com calma)
     */
    function exitCreationMode(shouldRestoreSpeed = true) {
        if (!isCreationMode) return;
        isCreationMode = false;
        
        // Desbloqueia controles
        if (chronoDeck) chronoDeck.classList.remove('disabled');
        
        if (shouldRestoreSpeed && savedTimeSpeed !== 1) {
            // CANCELAR: Restaura velocidade anterior (ex: volta para 5x)
            chronoButtons.forEach(b => b.classList.remove('active'));
            const targetBtn = document.querySelector(`.chrono-icon[data-speed="${savedTimeSpeed}"]`);
            if (targetBtn) targetBtn.classList.add('active');
            game.events.emit('update-time-scale', savedTimeSpeed);
            console.log(`[CHRONO] Restored speed: ${savedTimeSpeed}x`);
        } else {
            // SINTETIZAR: Mantém 1x para ver nascimento com calma
            // Descarta velocidade salva
            savedTimeSpeed = 1;
            console.log('[CHRONO] Kept at 1x for spawn observation');
        }
    }
    
    chronoButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Previne propagação
            
            // Bloqueia cliques durante modo de criação
            if (isCreationMode) return;
            
            const speed = parseFloat(btn.dataset.speed);
            
            // Feedback sonoro
            playChronoClick(speed);
            
            // Atualiza estado visual dos botões
            chronoButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Emite evento para a cena
            game.events.emit('update-time-scale', speed);
            
            console.log(`[CHRONO] Speed: ${speed}x`);
        });
    });

    game.events.on('update-tree', (familyData) => {
        // Atualiza a referência global dos dados
        currentFamilyData = familyData || [];
        // Re-renderiza se o modal estiver visível
        if (!treeModal.classList.contains('hidden')) {
            renderFamilyTree(currentFamilyData);
        }
    });

    function renderFamilyTree(data) {
        treeContent.innerHTML = '';
        if (!data || !data.length) {
            treeContent.innerHTML = `
                <div class="tree-empty-state">
                    <div class="empty-icon">🧬</div>
                    <div class="empty-title">ARQUIVO VAZIO</div>
                    <div class="empty-subtitle">Nenhuma forma de vida registrada</div>
                </div>
            `;
            return;
        }

        // 1. Mapeamento ID -> Dados
        const map = {};
        data.forEach(d => map[d.id] = d);

        // 2. Determinar Gerações
        const generations = {}; 
        const nodeGen = {}; 

        function getGen(id) {
            if (nodeGen[id] !== undefined) return nodeGen[id];
            const node = map[id];
            if (!node || !node.parents || node.parents.length === 0) {
                nodeGen[id] = 0;
                return 0;
            }
            const knownParents = node.parents.filter(pid => map[pid]);
            if (knownParents.length === 0) {
                nodeGen[id] = 0;
                return 0;
            }
            let maxP = -1;
            knownParents.forEach(pid => {
                const pGen = getGen(pid);
                if (pGen > maxP) maxP = pGen;
            });
            const myGen = maxP + 1;
            nodeGen[id] = myGen;
            return myGen;
        }

        data.forEach(d => {
            const g = getGen(d.id);
            if (!generations[g]) generations[g] = [];
            generations[g].push(d);
        });

        // 3. Header com estatísticas e Barra de Progresso de Descoberta
        const statsHeader = document.createElement('div');
        statsHeader.className = 'tree-stats-header';
        const totalGolems = data.length;
        const maxGen = Math.max(...Object.keys(generations).map(Number));
        
        // Calcula formas raras descobertas
        const rareShapes = ['tesseract', 'fractal', 'espiral', 'monolito', 'cristal'];
        const discoveredRares = new Set();
        data.forEach(g => {
            if (rareShapes.includes(g.forma?.id)) {
                discoveredRares.add(g.forma.id);
            }
        });
        const raresFound = discoveredRares.size;
        
        // Progresso baseado em formas evoluídas (16 total no ELEMENTS.formaEvoluida)
        const totalEvolved = 16;
        const uniqueShapes = new Set(data.map(g => g.forma?.id).filter(Boolean));
        const evolvedDiscovered = [...uniqueShapes].filter(s => 
            ELEMENTS.formaEvoluida.some(f => f.id === s)
        ).length;
        const progressPercent = Math.min(100, Math.round((evolvedDiscovered / totalEvolved) * 100));
        
        statsHeader.innerHTML = `
            <div class="discovery-progress">
                <div class="discovery-label">
                    <span>BANCO DE DADOS GENÔMICO</span>
                    <span class="discovery-percent">${progressPercent}% COMPLETO</span>
                </div>
                <div class="discovery-bar">
                    <div class="discovery-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
            <div class="tree-counters">
                <div class="counter-item">
                    <span class="counter-value cyan">${totalGolems}</span>
                    <span class="counter-label">REGISTROS</span>
                </div>
                <div class="counter-item">
                    <span class="counter-value purple">${maxGen + 1}</span>
                    <span class="counter-label">GERAÇÕES</span>
                </div>
                <div class="counter-item">
                    <span class="counter-value gold">${raresFound}</span>
                    <span class="counter-label">MUTAÇÕES</span>
                </div>
            </div>
        `;
        treeContent.appendChild(statsHeader);

        // 4. Renderizar por Geração
        const genKeys = Object.keys(generations).sort((a,b) => a-b);
        
        genKeys.forEach(key => {
            const row = document.createElement('div');
            row.className = 'tree-generation-row';
            
            const label = document.createElement('div');
            label.className = 'gen-label';
            label.innerHTML = `<span class="gen-number">G${key}</span><span class="gen-text">GERAÇÃO ${key}</span><span class="gen-count">${generations[key].length} entidades</span>`;
            row.appendChild(label);

            const rowContent = document.createElement('div');
            rowContent.className = 'gen-content';

            generations[key].forEach(golem => {
                const card = createGolemCard(golem, map, nodeGen[golem.id]);
                rowContent.appendChild(card);
            });
            
            row.appendChild(rowContent);
            treeContent.appendChild(row);
        });
    }

    function createGolemCard(rec, map, generation = 0) {
        const card = document.createElement('div');
        card.className = 'golem-card';
        
        // Extrai dados
        const shapeId = rec.forma?.id || 'quadrado';
        const chemId = rec.quimica?.id || 'carbono';
        const physId = rec.fisica?.id || 'luz';
        const stats = rec.stats || { forca: '?', resistencia: '?', energia: '?' };
        const scaleX = stats.scaleX || 1;
        const scaleY = stats.scaleY || 1;
        
        const physColor = PHYSICS_COLORS[physId] || '#0ff';
        card.style.setProperty('--card-color', physColor);
        
        // ═══ SISTEMA DE STATUS: Vivo vs Arquivado ═══
        const isAlive = rec.isAlive !== undefined ? rec.isAlive : true;
        if (!isAlive) {
            card.classList.add('archived');
            card.style.setProperty('--status-color', '#666');
        } else {
            card.style.setProperty('--status-color', '#00ff00');
        }
        
        // ═══ SISTEMA DE RARIDADE ═══
        const rareShapes = ['tesseract', 'fractal', 'espiral', 'monolito'];
        const isRare = rareShapes.includes(shapeId);
        const isAnomaly = rec.tags?.includes('anomalia') || rec.isAnomaly;
        
        if (isRare || isAnomaly) {
            card.classList.add('rare');
        }
        
        // ═══ TAG "NOVO" (nasceu há menos de 1 minuto) ═══
        const birthTime = rec.birthTime || rec.createdAt || 0;
        const now = Date.now();
        const isNew = (now - birthTime) < 60000; // 60 segundos
        
        // ═══ SCAN LINE EFFECT ═══
        const scanLine = document.createElement('div');
        scanLine.className = 'scan-line';
        card.appendChild(scanLine);
        
        // ═══ BADGE DE RARIDADE ═══
        if (isAnomaly) {
            const badge = document.createElement('div');
            badge.className = 'rarity-badge anomaly';
            badge.textContent = '⚠ ANOMALIA';
            card.appendChild(badge);
        } else if (isRare) {
            const badge = document.createElement('div');
            badge.className = 'rarity-badge legendary';
            badge.textContent = '★ RARO';
            card.appendChild(badge);
        }
        
        // ═══ TAG NOVO ═══
        if (isNew) {
            const newTag = document.createElement('div');
            newTag.className = 'new-data-tag';
            newTag.textContent = 'NEW DATA';
            card.appendChild(newTag);
        }
        
        // === PARTE COLAPSADA (Sempre Visível) ===
        const collapsed = document.createElement('div');
        collapsed.className = 'golem-card-collapsed';
        
        // Usa generateGolemSVG para ícone visual (pequeno)
        const miniSVG = generateGolemSVG(shapeId, chemId, physId, scaleX, scaleY, 40);
        
        collapsed.innerHTML = `
            <div class="card-visual-mini">${miniSVG}</div>
            <div class="card-info">
                <div class="card-name">${rec.name || 'Desconhecido'}</div>
                <div class="card-gen">Geração ${generation}</div>
            </div>
            <div class="expand-icon">▼</div>
        `;
        card.appendChild(collapsed);
        
        // === PARTE EXPANSÍVEL (Acordeão) ===
        const expandable = document.createElement('div');
        expandable.className = 'golem-card-expandable';
        
        const expandableInner = document.createElement('div');
        expandableInner.className = 'golem-card-expandable-inner';
        
        // 1. SVG do Golem (maior) usando generateGolemSVG
        const visualSection = document.createElement('div');
        visualSection.className = 'golem-expanded-visual';
        visualSection.innerHTML = generateGolemSVG(shapeId, chemId, physId, scaleX, scaleY, 80);
        expandableInner.appendChild(visualSection);
        
        // 2. Grid de Stats
        const statsGrid = document.createElement('div');
        statsGrid.className = 'golem-stats-grid';
        statsGrid.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.forca ?? '?'}</div>
                <div class="stat-label">Força</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.resistencia ?? '?'}</div>
                <div class="stat-label">Resistência</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.energia ?? '?'}</div>
                <div class="stat-label">Energia</div>
            </div>
        `;
        expandableInner.appendChild(statsGrid);
        
        // 3. Painel Matemático - Usa calculateGeometry diretamente
        const mathPanel = document.createElement('div');
        mathPanel.className = 'golem-math-panel';
        
        let areaValue = '—';
        let perimValue = '—';
        let formulaText = 'Calculando...';
        let descText = 'Forma geométrica';
        
        try {
            const geoResult = calculateGeometry(shapeId, scaleX, scaleY, rec.forma?.params);
            areaValue = geoResult.areaFormatted;
            perimValue = geoResult.perimeterFormatted;
            formulaText = geoResult.formula;
            descText = geoResult.description;
        } catch (e) {
            console.warn('[Card] Geometry calc error:', e);
            formulaText = 'Erro no cálculo';
        }
        
        mathPanel.innerHTML = `
            <div class="math-panel-header">
                <span class="math-icon">📐</span>
                <span class="math-title">Painel Matemático</span>
            </div>
            <div class="math-row">
                <span class="math-label">Área (A)</span>
                <span class="math-value">${areaValue}</span>
            </div>
            <div class="math-row">
                <span class="math-label">Perímetro (P)</span>
                <span class="math-value">${perimValue}</span>
            </div>
            <div class="math-row">
                <span class="math-label">Escala</span>
                <span class="math-value">${scaleX.toFixed(2)} × ${scaleY.toFixed(2)}</span>
            </div>
            <div class="math-formula">${formulaText}</div>
            <div class="math-desc">${descText}</div>
        `;
        expandableInner.appendChild(mathPanel);
        
        // 4. Linhagem (Pais) - com SVG mini para cada pai
        if (rec.parents && rec.parents.length > 0 && rec.parents.some(p => map[p])) {
            const lineageSection = document.createElement('div');
            lineageSection.className = 'golem-lineage-expanded';
            
            let parentsHTML = '';
            rec.parents.filter(pid => map[pid]).forEach(pid => {
                const parent = map[pid];
                const pShape = parent.forma?.id || 'quadrado';
                const pChem = parent.quimica?.id || 'carbono';
                const pPhys = parent.fisica?.id || 'luz';
                const parentMiniSVG = generateGolemSVG(pShape, pChem, pPhys, 1, 1, 24);
                parentsHTML += `<div class="parent-chip"><span class="parent-visual">${parentMiniSVG}</span><span class="parent-name">${parent.name || '???'}</span></div>`;
            });
            
            lineageSection.innerHTML = `
                <div class="lineage-header">
                    <span class="lineage-icon">🧬</span>
                    <span class="lineage-title">Linhagem</span>
                </div>
                <div class="lineage-parents">${parentsHTML}</div>
            `;
            expandableInner.appendChild(lineageSection);
        }
        
        // 5. Botão de Inspeção Completa
        const inspectBtn = document.createElement('button');
        inspectBtn.className = 'card-inspect-btn';
        inspectBtn.innerHTML = '🔍 INSPECIONAR REGISTRO';
        inspectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Som de scan/data access
            UISoundSystem.playDataScan();
            
            // Constrói payload de inspeção a partir do registro histórico
            const inspectData = {
                visual: { 
                    forma: rec.forma, 
                    quimica: rec.quimica, 
                    fisica: rec.fisica 
                },
                stats: { 
                    name: rec.name, 
                    stats: stats, 
                    description: isAlive ? "Entidade ativa no ecossistema." : "⚠ REGISTRO ARQUIVADO - Entidade descontinuada.",
                    dialogo: rec.aiData?.description || "Dados de personalidade não disponíveis."
                },
                lifeLog: rec.lifeLog || [],
                liveData: { 
                    lifePhase: isAlive ? 'active' : 'archived', 
                    currentScaleX: scaleX, 
                    currentScaleY: scaleY,
                    golemRef: null // Sem referência viva se arquivado
                }
            };
            
            // Emite evento de inspeção (usa o mesmo handler da cena principal)
            game.events.emit('inspect-golem', inspectData);
        });
        expandableInner.appendChild(inspectBtn);
        
        // 6. Botão de Colapsar (dentro da área expandida)
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'card-collapse-btn';
        collapseBtn.innerHTML = '▲ RECOLHER';
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            UISoundSystem.playClick('close');
            card.classList.remove('expanded');
        });
        expandableInner.appendChild(collapseBtn);
        
        expandable.appendChild(expandableInner);
        card.appendChild(expandable);

        // === CLICK HANDLER: Toggle Accordion ===
        // Clique na área colapsada para expandir
        collapsed.addEventListener('click', (e) => {
            e.stopPropagation();
            UISoundSystem.playClick('card');
            card.classList.toggle('expanded');
        });
        
        // Clique no card inteiro quando NÃO expandido também expande
        card.addEventListener('click', (e) => {
            // Só expande se não estiver expandido e o clique não foi em um botão
            if (!card.classList.contains('expanded') && !e.target.closest('button')) {
                UISoundSystem.playClick('card');
                card.classList.add('expanded');
            }
        });

        return card;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ESTAÇÃO DE MONTAGEM HOLOGRÁFICA - Nova Interface
    // ═══════════════════════════════════════════════════════════════════
    
    const previewCanvas = document.getElementById('golem-preview');
    const previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;
    const previewStatusText = document.getElementById('preview-status-text');
    const previewContainer = document.querySelector('.preview-container');
    const stabilityFill = document.getElementById('stability-fill');
    const stabilityValue = document.getElementById('stability-value');
    
    // Containers de opções por categoria
    const optionsForma = document.getElementById('options-forma');
    const optionsQuimica = document.getElementById('options-quimica');
    const optionsFisica = document.getElementById('options-fisica');
    
    // Status displays
    const statusForma = document.getElementById('status-forma');
    const statusQuimica = document.getElementById('status-quimica');
    const statusFisica = document.getElementById('status-fisica');
    
    // Colunas
    const colForma = document.getElementById('col-forma');
    const colQuimica = document.getElementById('col-quimica');
    const colFisica = document.getElementById('col-fisica');
    
    // Espessura por química
    const CHEM_LINE_WIDTH = {
        'carbono': 2, 'ferro': 4, 'silicio': 2,
        'ouro': 3, 'cristal': 1, 'mercurio': 5, 'uranio': 3
    };
    
    // Ícones por categoria
    const SHAPE_ICONS = {
        'circulo': '○', 'quadrado': '□', 'triangulo': '△',
        'pentagono': '⬠', 'hexagono': '⬡', 'losango': '◇', 'cruz': '✚'
    };
    
    const CHEM_ICONS = {
        'carbono': '⬡', 'ferro': '⛏', 'silicio': '◈',
        'ouro': '★', 'cristal': '◆', 'mercurio': '☿', 'uranio': '☢'
    };
    
    const PHYSICS_ICONS = {
        'eletricidade': '⚡', 'calor': '🔥', 'radiacao': '☢',
        'gravidade': '◉', 'luz': '☀', 'frio': '❄', 'magnetismo': '🧲'
    };
    
    // Inicializa as colunas com opções
    function initHolographicPanel() {
        if (!optionsForma || !optionsQuimica || !optionsFisica) return;
        
        // Popula cada coluna
        renderColumnOptions('forma', optionsForma, SHAPE_ICONS);
        renderColumnOptions('quimica', optionsQuimica, CHEM_ICONS);
        renderColumnOptions('fisica', optionsFisica, PHYSICS_ICONS);
        
        // Desenha preview inicial
        drawPreview();
        
        // Inicia loop de animação para preview dinâmico
        startPreviewAnimation();
    }
    
    let previewAnimationId = null;
    
    function startPreviewAnimation() {
        if (previewAnimationId) return;
        
        function animate() {
            drawPreview();
            previewAnimationId = requestAnimationFrame(animate);
        }
        previewAnimationId = requestAnimationFrame(animate);
    }
    
    function stopPreviewAnimation() {
        if (previewAnimationId) {
            cancelAnimationFrame(previewAnimationId);
            previewAnimationId = null;
        }
    }
    
    function renderColumnOptions(category, container, icons) {
        container.innerHTML = '';
        const items = ELEMENTS[category];
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'option-item';
            div.dataset.id = item.id;
            div.dataset.category = category;
            div.dataset.name = item.name;
            div.dataset.desc = item.desc || `Selecione ${item.name} como ${category}`;
            
            // Aplica cor dinâmica baseada na categoria
            let itemColor = '#0ff'; // cyan padrão
            if (category === 'fisica') {
                itemColor = PHYSICS_COLORS[item.id] || '#0ff';
            } else if (category === 'quimica') {
                itemColor = CHEMISTRY_COLORS[item.id] || item.color || '#888';
            } else if (category === 'forma') {
                itemColor = FORMA_COLORS[item.id] || '#0ff';
            }
            div.style.setProperty('--item-color', itemColor);
            
            if (currentSelection[category] && currentSelection[category].id === item.id) {
                div.classList.add('selected');
            }
            
            const icon = icons[item.id] || '?';
            div.innerHTML = `
                <span class="option-icon">${icon}</span>
                <span class="option-name">${item.name}</span>
            `;
            
            div.addEventListener('click', () => {
                selectItemHolographic(category, item, container);
            });
            
            container.appendChild(div);
        });
    }
    
    function selectItemHolographic(category, item, container) {
        // Atualiza seleção
        currentSelection[category] = item;
        
        // Atualiza visual da coluna
        const column = container.closest('.selector-column');
        const statusEl = column.querySelector('.column-status');
        
        // Remove seleção anterior e aplica nova
        container.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
        container.querySelector(`[data-id="${item.id}"]`)?.classList.add('selected');
        
        // Marca coluna como preenchida com animação
        column.classList.remove('just-filled');
        void column.offsetWidth; // Trigger reflow
        column.classList.add('filled', 'just-filled');
        
        // Atualiza texto do status
        statusEl.querySelector('.status-text').textContent = item.name;
        
        // Som sutil (se AudioContext disponível)
        playSelectionBeep(category);
        
        // Atualiza preview em tempo real
        drawPreview();
        
        // Atualiza fórmula e estado
        checkCraftingReady();
        updateRecipeFormula();
    }
    
    function updateRecipeFormula() {
        const forma = currentSelection.forma?.name || '?';
        const quimica = currentSelection.quimica?.name || '?';
        const fisica = currentSelection.fisica?.name || '?';
        
        // Usa classes coloridas para cada elemento da fórmula
        const formaClass = currentSelection.forma ? 'formula-geo' : 'formula-empty';
        const quimicaClass = currentSelection.quimica ? 'formula-chem' : 'formula-empty';
        const fisicaClass = currentSelection.fisica ? 'formula-phys' : 'formula-empty';
        
        recipeSummary.innerHTML = `
            <span class="${formaClass}">[ ${forma} ]</span>
            <span class="formula-plus">+</span>
            <span class="${quimicaClass}">[ ${quimica} ]</span>
            <span class="formula-plus">+</span>
            <span class="${fisicaClass}">[ ${fisica} ]</span>
        `;
    }
    
    function playSelectionBeep(category) {
        // Frequência baseada na categoria
        const freqs = { forma: 440, quimica: 550, fisica: 660 };
        const frequency = freqs[category] || 500;
        playUIBeep(frequency, 0.12, 0.12);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // PREVIEW RENDERER - Desenha o Golem em tempo real
    // ═══════════════════════════════════════════════════════════════════
    
    function drawPreview() {
        if (!previewCtx) return;
        
        const ctx = previewCtx;
        const w = previewCanvas.width;
        const h = previewCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        
        // Limpa canvas
        ctx.clearRect(0, 0, w, h);
        
        // Background com grid sutil
        drawPreviewBackground(ctx, w, h);
        
        const forma = currentSelection.forma;
        const quimica = currentSelection.quimica;
        const fisica = currentSelection.fisica;
        
        // Determina cor e espessura
        let color = '#334455'; // Wireframe neutro
        let glowColor = '#334455';
        let lineWidth = 2;
        let stability = 0;
        
        if (fisica) {
            color = PHYSICS_COLORS[fisica.id] || '#00ffff';
            glowColor = color;
            stability += 33;
        }
        
        if (quimica) {
            lineWidth = CHEM_LINE_WIDTH[quimica.id] || 2;
            stability += 33;
        }
        
        if (forma) {
            stability += 34;
        }
        
        // Atualiza barra de estabilidade
        if (stabilityFill) stabilityFill.style.width = `${stability}%`;
        if (stabilityValue) stabilityValue.textContent = `${stability}%`;
        
        // Atualiza status do preview
        updatePreviewStatus(forma, quimica, fisica);
        
        // Se não há forma, desenha silhueta pulsante
        if (!forma) {
            drawPulsingPlaceholder(ctx, cx, cy);
            return;
        }
        
        // Desenha a forma com efeitos e textura química
        const chemId = quimica ? quimica.id : null;
        drawGolemShape(ctx, cx, cy, forma.id, color, glowColor, lineWidth, !!fisica, chemId);
        
        // Desenha rosto simplificado se tiver física (energia = vida)
        if (fisica) {
            drawPreviewFace(ctx, cx, cy, color);
        }
    }
    
    function drawPreviewBackground(ctx, w, h) {
        // Grid holográfico
        ctx.strokeStyle = '#112233';
        ctx.lineWidth = 0.5;
        
        const gridSize = 20;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        
        // Cruz central
        ctx.strokeStyle = '#223344';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w/2, h);
        ctx.moveTo(0, h/2);
        ctx.lineTo(w, h/2);
        ctx.stroke();
    }
    
    function drawPulsingPlaceholder(ctx, cx, cy) {
        const time = Date.now() * 0.003;
        const pulse = 0.8 + Math.sin(time) * 0.2;
        const size = 40 * pulse;
        
        ctx.strokeStyle = `rgba(50, 80, 100, ${0.3 + Math.sin(time) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Quadrado tracejado pulsante
        ctx.beginPath();
        ctx.rect(cx - size, cy - size, size * 2, size * 2);
        ctx.stroke();
        
        // Texto
        ctx.setLineDash([]);
        ctx.fillStyle = '#445566';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('AGUARDANDO', cx, cy - 5);
        ctx.fillText('GEOMETRIA', cx, cy + 10);
    }
    
    function drawGolemShape(ctx, cx, cy, shapeId, color, glowColor, lineWidth, hasEnergy, chemId = null) {
        const size = 45;
        
        // Ajuste de cor para materiais especiais
        let effectiveColor = color;
        if (chemId === 'ouro') {
            effectiveColor = blendHexColors(color, '#FFD700', 0.4);
        } else if (chemId === 'ferro') {
            effectiveColor = blendHexColors(color, '#8899AA', 0.2);
        }
        
        // Camada 1: Glow externo (se tiver energia)
        if (hasEnergy) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 20;
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = lineWidth + 6;
            ctx.globalAlpha = 0.3;
            drawShapePath(ctx, cx, cy, shapeId, size);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
        
        // Camada 2: Fill sutil
        ctx.fillStyle = hasEnergy ? effectiveColor : '#223344';
        ctx.globalAlpha = 0.15;
        drawShapePath(ctx, cx, cy, shapeId, size);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Camada 2.5: Padrão químico (textura interna)
        if (chemId) {
            drawChemistryPatternPreview(ctx, cx, cy, shapeId, chemId, size, effectiveColor);
        }
        
        // Camada 3: Stroke principal
        ctx.strokeStyle = effectiveColor;
        ctx.lineWidth = lineWidth;
        drawShapePath(ctx, cx, cy, shapeId, size);
        ctx.stroke();
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // PADRÕES QUÍMICOS - Texturas procedurais para o preview
    // ═══════════════════════════════════════════════════════════════════
    
    function drawChemistryPatternPreview(ctx, cx, cy, shapeId, chemId, size, color) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        
        switch (chemId) {
            case 'ouro':
                // Brilhos especulares
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.ellipse(cx - size * 0.4, cy - size * 0.4, size * 0.2, size * 0.1, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx - size * 0.2, cy - size * 0.55, size * 0.1, size * 0.05, 0, 0, Math.PI * 2);
                ctx.fill();
                // Fill dourado
                ctx.fillStyle = '#FFD700';
                ctx.globalAlpha = 0.25;
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'ferro':
                // Hachuras diagonais
                ctx.strokeStyle = lightenHexColor(color, 0.4);
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.35;
                const spacing = 6;
                const extent = size * 0.85;
                for (let i = -extent * 2; i < extent * 2; i += spacing) {
                    ctx.beginPath();
                    ctx.moveTo(cx + i - extent, cy - extent);
                    ctx.lineTo(cx + i + extent, cy + extent);
                    ctx.stroke();
                }
                break;
                
            case 'cristal':
                // Linhas facetadas
                ctx.strokeStyle = lightenHexColor(color, 0.5);
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.4;
                let facets = 6;
                if (shapeId === 'triangulo') facets = 3;
                else if (shapeId === 'quadrado') facets = 4;
                else if (shapeId === 'pentagono') facets = 5;
                else if (shapeId === 'circulo') facets = 8;
                
                for (let i = 0; i < facets; i++) {
                    const angle = (i * (360 / facets) - 90) * Math.PI / 180;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(angle) * size * 0.8, cy + Math.sin(angle) * size * 0.8);
                    ctx.stroke();
                }
                // Anel interno
                ctx.globalAlpha = 0.25;
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'mercurio':
                // Ondas líquidas
                const time = Date.now() * 0.002;
                ctx.fillStyle = lightenHexColor(color, 0.3);
                ctx.globalAlpha = 0.4;
                const pulseSize = size * 0.3 + Math.sin(time) * size * 0.05;
                ctx.beginPath();
                ctx.arc(cx + Math.sin(time * 1.3) * 2, cy + Math.cos(time) * 2, pulseSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Ondas
                ctx.strokeStyle = lightenHexColor(color, 0.4);
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.35;
                for (let wave = 0; wave < 3; wave++) {
                    ctx.beginPath();
                    const baseY = cy - size * 0.35 + wave * size * 0.3;
                    for (let x = -size * 0.6; x <= size * 0.6; x += 3) {
                        const y = baseY + Math.sin(x * 0.15 + time + wave * 0.7) * 3;
                        if (x === -size * 0.6) ctx.moveTo(cx + x, y);
                        else ctx.lineTo(cx + x, y);
                    }
                    ctx.stroke();
                }
                break;
                
            case 'silicio':
                // Circuito impresso
                const s = size * 0.5;
                ctx.strokeStyle = lightenHexColor(color, 0.4);
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.4;
                
                // Trilhas
                ctx.beginPath();
                ctx.moveTo(cx - s, cy - s * 0.5);
                ctx.lineTo(cx - s * 0.3, cy - s * 0.5);
                ctx.lineTo(cx - s * 0.3, cy);
                ctx.lineTo(cx + s * 0.3, cy);
                ctx.lineTo(cx + s * 0.3, cy + s * 0.5);
                ctx.lineTo(cx + s, cy + s * 0.5);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(cx, cy - s);
                ctx.lineTo(cx, cy - s * 0.3);
                ctx.lineTo(cx + s * 0.5, cy - s * 0.3);
                ctx.lineTo(cx + s * 0.5, cy + s * 0.3);
                ctx.lineTo(cx, cy + s * 0.3);
                ctx.lineTo(cx, cy + s);
                ctx.stroke();
                
                // Nós
                ctx.fillStyle = lightenHexColor(color, 0.5);
                ctx.globalAlpha = 0.5;
                [[cx - s * 0.3, cy - s * 0.5], [cx + s * 0.3, cy], [cx, cy + s * 0.3]].forEach(([nx, ny]) => {
                    ctx.beginPath();
                    ctx.arc(nx, ny, 2, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                // Chip central
                ctx.strokeStyle = lightenHexColor(color, 0.4);
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.45;
                ctx.strokeRect(cx - s * 0.2, cy - s * 0.2, s * 0.4, s * 0.4);
                break;
                
            case 'uranio':
                // Núcleo radioativo
                const t = Date.now() * 0.003;
                ctx.fillStyle = '#00FF00';
                ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.15;
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.18, 0, Math.PI * 2);
                ctx.fill();
                
                // Órbitas
                ctx.strokeStyle = lightenHexColor(color, 0.3);
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.35;
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
                ctx.stroke();
                
                // Elétrons
                ctx.fillStyle = '#FFFF00';
                ctx.globalAlpha = 0.6;
                for (let i = 0; i < 3; i++) {
                    const angle = t * 2 + i * (Math.PI * 2 / 3);
                    const orbitR = size * 0.35 + (i % 2) * size * 0.2;
                    ctx.beginPath();
                    ctx.arc(cx + Math.cos(angle) * orbitR, cy + Math.sin(angle) * orbitR * 0.5, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'carbono':
            default:
                // Grid molecular sutil
                ctx.strokeStyle = lightenHexColor(color, 0.3);
                ctx.lineWidth = 0.5;
                ctx.globalAlpha = 0.2;
                const gridSize = 8;
                const ext = size * 0.6;
                for (let y = -ext; y <= ext; y += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(cx - ext, cy + y);
                    ctx.lineTo(cx + ext, cy + y);
                    ctx.stroke();
                }
                for (let x = -ext; x <= ext; x += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(cx + x, cy - ext);
                    ctx.lineTo(cx + x, cy + ext);
                    ctx.stroke();
                }
                break;
        }
        
        ctx.restore();
    }
    
    // Utilitários de cor para o preview
    function lightenHexColor(hexColor, amount) {
        // Converte hex string para componentes
        let hex = hexColor.replace('#', '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 255 * amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 255 * amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 255 * amount);
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    function blendHexColors(color1, color2, weight) {
        let hex1 = color1.replace('#', '');
        let hex2 = color2.replace('#', '');
        if (hex1.length === 3) hex1 = hex1[0]+hex1[0]+hex1[1]+hex1[1]+hex1[2]+hex1[2];
        if (hex2.length === 3) hex2 = hex2[0]+hex2[0]+hex2[1]+hex2[1]+hex2[2]+hex2[2];
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.floor(r1 * (1 - weight) + r2 * weight);
        const g = Math.floor(g1 * (1 - weight) + g2 * weight);
        const b = Math.floor(b1 * (1 - weight) + b2 * weight);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    function drawShapePath(ctx, cx, cy, shapeId, size) {
        ctx.beginPath();
        
        switch(shapeId) {
            case 'circulo':
                ctx.arc(cx, cy, size, 0, Math.PI * 2);
                break;
            case 'quadrado':
                ctx.rect(cx - size, cy - size, size * 2, size * 2);
                break;
            case 'triangulo':
                ctx.moveTo(cx, cy - size);
                ctx.lineTo(cx + size * 0.866, cy + size * 0.5);
                ctx.lineTo(cx - size * 0.866, cy + size * 0.5);
                ctx.closePath();
                break;
            case 'pentagono':
                drawPolygonPath(ctx, cx, cy, 5, size);
                break;
            case 'hexagono':
                drawPolygonPath(ctx, cx, cy, 6, size);
                break;
            case 'losango':
                ctx.moveTo(cx, cy - size * 1.2);
                ctx.lineTo(cx + size * 0.7, cy);
                ctx.lineTo(cx, cy + size * 1.2);
                ctx.lineTo(cx - size * 0.7, cy);
                ctx.closePath();
                break;
            case 'cruz':
                const t = size * 0.35;
                ctx.moveTo(cx - t, cy - size);
                ctx.lineTo(cx + t, cy - size);
                ctx.lineTo(cx + t, cy - t);
                ctx.lineTo(cx + size, cy - t);
                ctx.lineTo(cx + size, cy + t);
                ctx.lineTo(cx + t, cy + t);
                ctx.lineTo(cx + t, cy + size);
                ctx.lineTo(cx - t, cy + size);
                ctx.lineTo(cx - t, cy + t);
                ctx.lineTo(cx - size, cy + t);
                ctx.lineTo(cx - size, cy - t);
                ctx.lineTo(cx - t, cy - t);
                ctx.closePath();
                break;
            // ═══ FORMAS DO SISTEMA DE ALQUIMIA ═══
            case 'capsula':
                // Retângulo arredondado
                ctx.moveTo(cx - size * 0.4, cy - size);
                ctx.lineTo(cx + size * 0.4, cy - size);
                ctx.arc(cx + size * 0.4, cy - size * 0.6, size * 0.4, -Math.PI/2, Math.PI/2);
                ctx.lineTo(cx - size * 0.4, cy - size * 0.2);
                ctx.arc(cx - size * 0.4, cy - size * 0.6, size * 0.4, Math.PI/2, -Math.PI/2);
                break;
            case 'domo':
                // Semicírculo em base quadrada
                ctx.arc(cx, cy, size, Math.PI, 0);
                ctx.lineTo(cx + size, cy + size * 0.5);
                ctx.lineTo(cx - size, cy + size * 0.5);
                ctx.closePath();
                break;
            case 'monolito':
                // Retângulo vertical estreito
                ctx.rect(cx - size * 0.35, cy - size * 1.2, size * 0.7, size * 2.4);
                break;
            case 'obelisco':
                // Pirâmide alongada
                ctx.moveTo(cx, cy - size * 1.3);
                ctx.lineTo(cx + size * 0.4, cy + size * 0.8);
                ctx.lineTo(cx - size * 0.4, cy + size * 0.8);
                ctx.closePath();
                break;
            case 'cilindro':
                // Elipse + retângulo
                ctx.ellipse(cx, cy - size * 0.7, size * 0.6, size * 0.25, 0, 0, Math.PI * 2);
                ctx.moveTo(cx - size * 0.6, cy - size * 0.7);
                ctx.lineTo(cx - size * 0.6, cy + size * 0.7);
                ctx.ellipse(cx, cy + size * 0.7, size * 0.6, size * 0.25, 0, Math.PI, 0);
                ctx.lineTo(cx + size * 0.6, cy - size * 0.7);
                break;
            case 'cone':
                ctx.moveTo(cx, cy - size);
                ctx.lineTo(cx + size * 0.8, cy + size * 0.7);
                ctx.ellipse(cx, cy + size * 0.7, size * 0.8, size * 0.25, 0, 0, Math.PI);
                ctx.closePath();
                break;
            case 'estrela':
                // Estrela de 5 pontas
                for (let i = 0; i < 5; i++) {
                    const outerAngle = (i * Math.PI * 2 / 5) - Math.PI / 2;
                    const innerAngle = outerAngle + Math.PI / 5;
                    const ox = cx + Math.cos(outerAngle) * size;
                    const oy = cy + Math.sin(outerAngle) * size;
                    const ix = cx + Math.cos(innerAngle) * size * 0.4;
                    const iy = cy + Math.sin(innerAngle) * size * 0.4;
                    if (i === 0) ctx.moveTo(ox, oy);
                    else ctx.lineTo(ox, oy);
                    ctx.lineTo(ix, iy);
                }
                ctx.closePath();
                break;
            case 'piramide':
                // Pirâmide 3D projetada
                ctx.moveTo(cx, cy - size);
                ctx.lineTo(cx + size, cy + size * 0.7);
                ctx.lineTo(cx, cy + size * 0.3);
                ctx.lineTo(cx - size, cy + size * 0.7);
                ctx.closePath();
                break;
            case 'cristal':
                // Octógono alongado
                ctx.moveTo(cx, cy - size * 1.2);
                ctx.lineTo(cx + size * 0.5, cy - size * 0.6);
                ctx.lineTo(cx + size * 0.5, cy + size * 0.6);
                ctx.lineTo(cx, cy + size * 1.2);
                ctx.lineTo(cx - size * 0.5, cy + size * 0.6);
                ctx.lineTo(cx - size * 0.5, cy - size * 0.6);
                ctx.closePath();
                break;
            case 'tesseract':
                // Cubo em perspectiva
                const s2 = size * 0.6;
                const off = size * 0.35;
                ctx.rect(cx - s2, cy - s2, s2 * 2, s2 * 2);
                ctx.moveTo(cx - s2, cy - s2);
                ctx.lineTo(cx - s2 + off, cy - s2 - off);
                ctx.lineTo(cx + s2 + off, cy - s2 - off);
                ctx.lineTo(cx + s2, cy - s2);
                ctx.moveTo(cx + s2, cy + s2);
                ctx.lineTo(cx + s2 + off, cy + s2 - off);
                ctx.lineTo(cx + s2 + off, cy - s2 - off);
                break;
            case 'fractal':
                // Triângulo de Sierpinski simplificado
                drawFractalTriangle(ctx, cx, cy - size * 0.1, size * 0.9, 2);
                break;
            case 'olho':
                // Forma de olho
                ctx.ellipse(cx, cy, size, size * 0.5, 0, 0, Math.PI * 2);
                ctx.moveTo(cx + size * 0.35, cy);
                ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
                break;
            case 'mira':
                // Alvo/Mira
                ctx.arc(cx, cy, size, 0, Math.PI * 2);
                ctx.moveTo(cx + size * 0.5, cy);
                ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
                ctx.moveTo(cx, cy - size * 1.2);
                ctx.lineTo(cx, cy + size * 1.2);
                ctx.moveTo(cx - size * 1.2, cy);
                ctx.lineTo(cx + size * 1.2, cy);
                break;
            default:
                ctx.rect(cx - size, cy - size, size * 2, size * 2);
        }
    }
    
    function drawPolygonPath(ctx, cx, cy, sides, radius) {
        for (let i = 0; i < sides; i++) {
            const angle = (i * Math.PI * 2 / sides) - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }
    
    function drawFractalTriangle(ctx, cx, cy, size, depth) {
        // Triângulo de Sierpinski simplificado
        if (depth <= 0) {
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size * 0.866, cy + size * 0.5);
            ctx.lineTo(cx - size * 0.866, cy + size * 0.5);
            ctx.closePath();
            return;
        }
        
        const h = size * 0.5;
        // Triângulo superior
        drawFractalTriangle(ctx, cx, cy - h * 0.5, h, depth - 1);
        // Triângulo inferior esquerdo
        drawFractalTriangle(ctx, cx - h * 0.433, cy + h * 0.25, h, depth - 1);
        // Triângulo inferior direito  
        drawFractalTriangle(ctx, cx + h * 0.433, cy + h * 0.25, h, depth - 1);
    }
    
    function drawPreviewFace(ctx, cx, cy, color) {
        // Olhos simples
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(cx - 12, cy - 5, 4, 0, Math.PI * 2);
        ctx.arc(cx + 12, cy - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Boca (sorriso)
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 5, 10, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    function updatePreviewStatus(forma, quimica, fisica) {
        if (!previewStatusText || !previewContainer) return;
        
        const count = (forma ? 1 : 0) + (quimica ? 1 : 0) + (fisica ? 1 : 0);
        
        previewContainer.classList.remove('ready', 'partial');
        
        if (count === 3) {
            previewStatusText.textContent = 'PRONTO PARA SÍNTESE';
            previewContainer.classList.add('ready');
        } else if (count > 0) {
            previewStatusText.textContent = `CONFIGURANDO... (${count}/3)`;
            previewContainer.classList.add('partial');
        } else {
            previewStatusText.textContent = 'AGUARDANDO DADOS...';
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // EVENT HANDLERS ATUALIZADOS
    // ═══════════════════════════════════════════════════════════════════

    btnOpen.addEventListener('click', () => {
        // Som de abertura (sweep ascendente)
        UISoundSystem.playOpen();
        
        creationPanel.classList.remove('hidden');
        btnOpen.classList.add('hidden');
        enterCreationMode(); // Time Dilation: bloqueia tempo durante criação
        initHolographicPanel();
    });

    btnCancel.addEventListener('click', () => {
        // Som de fechamento (sweep descendente)
        UISoundSystem.playClose();
        
        stopPreviewAnimation();
        creationPanel.classList.add('hidden');
        btnOpen.classList.remove('hidden');
        exitCreationMode(true); // CANCELAR: Restaura velocidade anterior
        resetSelection();
    });
    
    function resetSelection() {
        currentSelection = { forma: null, quimica: null, fisica: null };
        
        // Reset colunas
        [colForma, colQuimica, colFisica].forEach(col => {
            if (col) col.classList.remove('filled', 'just-filled');
        });
        
        // Reset status texts
        if (statusForma) {
            const st = statusForma.querySelector('.status-text');
            if (st) st.textContent = 'Não Definida';
        }
        if (statusQuimica) {
            const st = statusQuimica.querySelector('.status-text');
            if (st) st.textContent = 'Não Vinculada';
        }
        if (statusFisica) {
            const st = statusFisica.querySelector('.status-text');
            if (st) st.textContent = 'Vazio';
        }
        
        // Reset opções selecionadas
        document.querySelectorAll('.option-item.selected').forEach(el => el.classList.remove('selected'));
        
        // Reset preview
        drawPreview();
        
        // Reset fórmula
        if (recipeSummary) {
            recipeSummary.innerHTML = `
                <span class="formula-empty">[ ? ]</span>
                <span class="formula-plus">+</span>
                <span class="formula-empty">[ ? ]</span>
                <span class="formula-plus">+</span>
                <span class="formula-empty">[ ? ]</span>
            `;
        }
        
        // Reset botão
        btnSynthesize.disabled = true;
        btnSynthesize.innerHTML = '<span class="btn-icon">⏳</span> INCOMPLETO';
        btnSynthesize.classList.remove('synthesis-ready');
    }

    function checkCraftingReady() {
        const isReady = currentSelection.forma && currentSelection.quimica && currentSelection.fisica;
        if (isReady) {
            btnSynthesize.disabled = false;
            btnSynthesize.innerHTML = '<span class="btn-icon"></span> SINTETIZAR';
            btnSynthesize.classList.add('synthesis-ready');
        } else {
            btnSynthesize.disabled = true;
            btnSynthesize.innerHTML = '<span class="btn-icon">⏳</span> INCOMPLETO';
            btnSynthesize.classList.remove('synthesis-ready');
        }
    }

    btnSynthesize.addEventListener('click', () => {
        // Som de síntese (especial, energético)
        UISoundSystem.playClick('synthesize');
        
        btnSynthesize.innerHTML = '<span class="btn-icon">⚡</span> SINTETIZANDO...';
        btnSynthesize.disabled = true;
        
        // Efeito visual no preview durante síntese
        if (previewContainer) {
            previewContainer.classList.add('synthesizing');
        }
        
        setTimeout(async () => {
            const aiResult = await generateGolemData(currentSelection);
            const golemData = { ...currentSelection, aiData: aiResult };
            
            game.events.emit('spawn-golem', golemData);
            
            // ═══ SISTEMA DE DESBLOQUEIO DE FORMAS EVOLUÍDAS ═══
            // Verifica se a forma criada é uma forma evoluída e desbloqueia
            if (evolvedFormsUI && golemData.forma) {
                const formId = golemData.forma.id;
                const isEvolvedForm = ELEMENTS.formaEvoluida.some(f => f.id === formId);
                if (isEvolvedForm) {
                    const wasNewUnlock = unlockForm(evolvedFormsUI, formId);
                    if (wasNewUnlock) {
                        console.log(`[EvolvedForms] Nova forma desbloqueada: ${formId}!`);
                    }
                }
            }
            
            // Remove efeito de síntese
            if (previewContainer) {
                previewContainer.classList.remove('synthesizing');
            }
            
            // Para animação e fecha painel
            stopPreviewAnimation();
            creationPanel.classList.add('hidden');
            btnOpen.classList.remove('hidden');
            exitCreationMode(false); // SINTETIZAR: Mantém 1x para observar spawn
            resetSelection();
            btnSynthesize.innerHTML = '<span class="btn-icon"></span> SINTETIZAR';
        }, 800);
    });

    const inspectModal = document.getElementById('inspect-modal');
    const elName = document.getElementById('inspect-name');
    const elDesc = document.getElementById('inspect-desc');
    const elStr = document.getElementById('val-str');
    const elRes = document.getElementById('val-res');
    const elEng = document.getElementById('val-eng');
    const elDiag = document.getElementById('inspect-dialogue');
    const elArea = document.getElementById('val-area');
    const elPeri = document.getElementById('val-peri');
    const elScale = document.getElementById('val-scale');
    const elFormula = document.getElementById('val-formula');
    const elHistory = document.getElementById('inspect-history');
    const elVisualLarge = document.getElementById('inspect-visual-large');
    const btnCloseInspect = document.getElementById('btn-close-inspect');

    if (btnCloseInspect) {
        btnCloseInspect.addEventListener('click', () => {
            game.events.emit('hide-inspect');
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!inspectModal.classList.contains('hidden')) {
            // Não reposicionar quando o modal estiver em modo expandido (modal-large)
            if (inspectModal.classList.contains('modal-large')) return;
            let top = e.clientY + 15;
            let left = e.clientX + 15;
            if (left > window.innerWidth - 340) left = e.clientX - 340;
            if (top > window.innerHeight - 300) top = e.clientY - 300;
            inspectModal.style.top = `${top}px`;
            inspectModal.style.left = `${left}px`;
        }
    });

    // Referência ao Golem atualmente inspecionado para atualização dinâmica
    let currentInspectedGolem = null;
    let inspectUpdateInterval = null;

    game.events.on('inspect-golem', (data) => {
        const stats = data.stats || {};
        const att = stats.stats || { forca: '?', resistencia: '?', energia: '?' };
        const visual = data.visual || {};
        const liveData = data.liveData || {};

        // Armazena referência para atualização dinâmica
        currentInspectedGolem = liveData.golemRef || null;

        elName.innerText = stats.name || "ANALISANDO...";
        elDesc.innerText = stats.description || "Forma de vida detectada.";

        elStr.innerText = att.forca;
        elRes.innerText = att.resistencia;
        elEng.innerText = att.energia;
        elDiag.innerText = stats.dialogo || "...";

        // Função para atualizar dados dinâmicos (geometria e visual)
        function updateDynamicData() {
            // Usa escala em tempo real do Golem se disponível
            const currentScaleX = currentInspectedGolem?.currentScale || liveData.currentScaleX || att.scaleX || parseFloat(att.scale) || 1;
            const currentScaleY = currentInspectedGolem?.currentScale || liveData.currentScaleY || att.scaleY || parseFloat(att.scale) || 1;
            const lifePhase = currentInspectedGolem?.lifePhase || liveData.lifePhase || 'adult';

            // === VISUAL GRANDE: Atualiza com escala atual ===
            if (elVisualLarge) {
                const shapeId = visual.forma?.id || 'quadrado';
                const chemId = visual.quimica?.id || 'carbono';
                const physId = visual.fisica?.id || 'luz';
                
                const svgHtml = generateGolemSVG(shapeId, chemId, physId, currentScaleX, currentScaleY, 120);
                elVisualLarge.innerHTML = svgHtml;
                
                const physColor = PHYSICS_COLORS[physId] || '#00ffff';
                elVisualLarge.style.boxShadow = `0 0 25px ${physColor}50`;
                elVisualLarge.style.borderColor = physColor;
            }

            // === MATEMÁTICA DINÂMICA: Recalcula com escala atual ===
            if (visual && visual.forma) {
                try {
                    const geoResult = calculateGeometry(visual.forma.id, currentScaleX, currentScaleY, visual.forma.params);
                    
                    elArea.innerText = geoResult.areaFormatted;
                    elPeri.innerText = geoResult.perimeterFormatted;
                    
                    // Mostra fase de vida junto com escala
                    const phaseLabel = { child: '👶', adult: '🧑', old: '👴' }[lifePhase] || '';
                    elScale.innerText = `${currentScaleX.toFixed(2)}× ${phaseLabel}`;
                    
                    elFormula.innerText = geoResult.formula;
                } catch (e) {
                    console.warn('[Inspect] Geometry calc error:', e);
                    elArea.innerText = '--';
                    elPeri.innerText = '--';
                    elScale.innerText = `${currentScaleX.toFixed(2)}×`;
                    elFormula.innerText = 'Erro no cálculo geométrico.';
                }
            } else {
                elArea.innerText = '--';
                elPeri.innerText = '--';
                elScale.innerText = '—';
                elFormula.innerText = 'Selecione uma forma para habilitar cálculo.';
            }
        }

        // Atualização inicial
        updateDynamicData();

        // Limpa intervalo anterior se existir
        if (inspectUpdateInterval) {
            clearInterval(inspectUpdateInterval);
        }

        // Inicia atualização contínua enquanto o modal estiver aberto (a cada 200ms)
        inspectUpdateInterval = setInterval(() => {
            if (!inspectModal.classList.contains('hidden') && currentInspectedGolem?.active) {
                updateDynamicData();
            }
        }, 200);

        // Render life history timeline (animated)
        function renderHistory(log) {
            elHistory.innerHTML = '';
            elHistory.className = 'history-timeline'; // Aplica classe CSS
            
            if (!log || !log.length) {
                elHistory.innerHTML = '<div style="padding:10px; color:#666; font-style:italic;">Sem histórico.</div>';
                return;
            }

            // Mostra do mais recente para o mais antigo ou vice-versa? 
            // Geralmente timeline é mais recente no topo ou base. Vamos colocar mais recente no topo.
            log.slice().reverse().forEach((entry, idx) => {
                const div = document.createElement('div');
                div.className = `history-item ${entry.type}`; // Adiciona classe do tipo para cor
                div.style.animationDelay = `${idx * 100}ms`; // Stagger animation

                const time = new Date(entry.ts).toLocaleTimeString();
                
                div.innerHTML = `
                    <span class="h-time">${time}</span>
                    <strong style="color:#fff; font-size:8px;">${entry.type.toUpperCase()}</strong>
                    <span class="h-detail">${entry.detail}</span>
                `;
                
                elHistory.appendChild(div);
            });
        }

        renderHistory(data.lifeLog || []);

        inspectModal.classList.remove('hidden');
    });

    game.events.on('hide-inspect', () => {
        inspectModal.classList.add('hidden');
        inspectModal.classList.remove('modal-large');
        
        // Limpa atualização dinâmica
        currentInspectedGolem = null;
        if (inspectUpdateInterval) {
            clearInterval(inspectUpdateInterval);
            inspectUpdateInterval = null;
        }
    });

    const tools = document.querySelectorAll('.tool-slot');
    let draggedTool = null;
    let ghostElement = null;

    tools.forEach(tool => {
        tool.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const action = tool.dataset.action;
            const icon = tool.querySelector('.tool-icon').innerText;
            startDrag(action, icon, e.clientX, e.clientY);
        });
    });

    function startDrag(action, iconChar, startX, startY) {
        draggedTool = action;
        document.body.classList.add('grabbing');
        
        // Emite evento global para Golems detectarem ameaça
        game.events.emit('tool-drag-start', { action });

        ghostElement = document.createElement('div');
        ghostElement.classList.add('dragging-ghost');
        ghostElement.innerText = iconChar;
        
        if (action === 'feed') ghostElement.style.borderColor = '#00ff00';
        if (action === 'burn') ghostElement.style.borderColor = '#ffaa00';
        if (action === 'kill') ghostElement.style.borderColor = '#ff0000';
        if (action === 'freeze') ghostElement.style.borderColor = '#00ffff';
        if (action === 'mutate') ghostElement.style.borderColor = '#ff00ff';

        document.body.appendChild(ghostElement);
        updateGhostPosition(startX, startY);

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
    }

    function onDragMove(e) {
        updateGhostPosition(e.clientX, e.clientY);
        
        // Emite posição do mouse para Golems calcularem distância da ameaça
        const canvas = document.querySelector('canvas');
        if (canvas && draggedTool) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const gameX = (e.clientX - rect.left) * scaleX;
            const gameY = (e.clientY - rect.top) * scaleY;
            
            game.events.emit('tool-drag-move', {
                action: draggedTool,
                x: gameX,
                y: gameY
            });
        }
    }

    function updateGhostPosition(x, y) {
        if (ghostElement) {
            ghostElement.style.left = `${x}px`;
            ghostElement.style.top = `${y}px`;
        }
    }

    function onDragEnd(e) {
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.body.classList.remove('grabbing');
        
        // Emite fim do arraste para Golems relaxarem
        game.events.emit('tool-drag-end', { action: draggedTool });
        
        if (ghostElement) ghostElement.remove();

        const canvas = document.querySelector('canvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                
                const gameX = (e.clientX - rect.left) * scaleX;
                const gameY = (e.clientY - rect.top) * scaleY;

                game.events.emit('tool-used', {
                    action: draggedTool,
                    x: gameX,
                    y: gameY
                });
            }
        }
        
        draggedTool = null;
        ghostElement = null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE TUTORIAL (FTUE - First Time User Experience)
    // ═══════════════════════════════════════════════════════════════════
    
    // Instancia o tutorial após todo o DOM estar pronto
    const tutorial = new TutorialSystem(game);
    
    // Expõe para debug (TutorialSystem.reset() para resetar)
    window.tutorial = tutorial;
});