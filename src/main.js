import Phaser from 'phaser';
import { generateGolemData } from './services/MockAiService.js';
import SanctuaryScene from './scenes/SanctuaryScene';
import { ELEMENTS } from './data/gameData.js';
import './style.css';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000',
  pixelArt: true,
  roundPixels: true,
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SanctuaryScene]
};

const game = new Phaser.Game(config);

document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS DE ESTADO E UI ---
    let currentSelection = { forma: null, quimica: null, fisica: null };
    
    // Modais e Botões
    const creationPanel = document.getElementById('creation-panel');
    const btnOpen = document.getElementById('btn-open-lab');
    const btnSynthesize = document.getElementById('btn-synthesize');
    const btnCancel = document.getElementById('btn-cancel');
    
    // Tree Elements
    const btnTree = document.getElementById('btn-tree');
    const treeModal = document.getElementById('tree-modal');
    const btnCloseTree = document.getElementById('btn-close-tree');
    const treeContent = document.getElementById('tree-content');

    // --- CONTROLE DA ÁRVORE GENEALÓGICA ---
    if (btnTree) {
        btnTree.addEventListener('click', () => {
            treeModal.classList.toggle('hidden');
        });
    }
    if (btnCloseTree) {
        btnCloseTree.addEventListener('click', () => {
            treeModal.classList.add('hidden');
        });
    }

    // Escuta atualizações da árvore vindas do Phaser
    game.events.on('update-tree', (familyData) => {
        renderFamilyTree(familyData);
    });

    function renderFamilyTree(data) {
        treeContent.innerHTML = '';
        
        // Agrupa por geração
        const generations = {};
        data.forEach(golem => {
            if (!generations[golem.generation]) generations[golem.generation] = [];
            generations[golem.generation].push(golem);
        });

        // Renderiza cada geração
        Object.keys(generations).forEach(gen => {
            const genDiv = document.createElement('div');
            genDiv.className = 'generation-row';
            
            const label = document.createElement('div');
            label.className = 'gen-label';
            label.innerText = `GERAÇÃO ${gen}`;
            genDiv.appendChild(label);

            generations[gen].forEach(golem => {
                const node = document.createElement('div');
                node.className = 'golem-node';
                
                // Visual simples do nó
                const icon = document.createElement('div');
                icon.className = 'node-icon';
                icon.style.borderColor = golem.color;
                
                const info = document.createElement('div');
                info.className = 'node-info';
                
                const name = document.createElement('div');
                name.className = 'node-name';
                name.innerText = golem.name;
                
                info.appendChild(name);

                // Mostra pais se tiver
                if (golem.parents && golem.parents.length > 0) {
                    const parentInfo = document.createElement('div');
                    parentInfo.className = 'node-parents';
                    // Encontra nomes dos pais (simplificado via ID)
                    parentInfo.innerText = `Filho de #${golem.parents[0]} & #${golem.parents[1]}`;
                    info.appendChild(parentInfo);
                }

                node.appendChild(icon);
                node.appendChild(info);
                genDiv.appendChild(node);
            });

            treeContent.appendChild(genDiv);
        });
    }

    // --- LÓGICA DO BUILDER (Criação) ---
    if (btnOpen) {
        btnOpen.addEventListener('click', () => {
            creationPanel.classList.remove('hidden');
            btnOpen.classList.add('hidden');
            resetSelection();
        });
    }
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            creationPanel.classList.add('hidden');
            btnOpen.classList.remove('hidden');
        });
    }

    function resetSelection() {
        currentSelection = { forma: null, quimica: null, fisica: null };
        const slots = document.querySelectorAll('.slot');
        slots.forEach(s => {
            s.classList.remove('filled', 'active');
            s.querySelector('.slot-icon').innerText = '?';
            s.querySelector('.slot-name').innerText = 'Selecione';
        });
        // Ativa o primeiro slot
        document.getElementById('slot-forma').classList.add('active');
        checkCraftingReady();
        
        // Limpa e renderiza o grid para a categoria 'forma'
        renderGrid('forma');
    }

    // Sistema de Abas do Builder
    const slotForma = document.getElementById('slot-forma');
    const slotChem = document.getElementById('slot-chem');
    const slotPhys = document.getElementById('slot-phys');
    const gridContainer = document.getElementById('options-grid');
    const recipeSummary = document.getElementById('recipe-summary');

    if (slotForma) {
        slotForma.addEventListener('click', () => renderGrid('forma'));
        slotChem.addEventListener('click', () => renderGrid('quimica'));
        slotPhys.addEventListener('click', () => renderGrid('fisica'));
    }

    function renderGrid(category) {
        // Atualiza abas
        [slotForma, slotChem, slotPhys].forEach(s => s.classList.remove('active'));
        if(category === 'forma') slotForma.classList.add('active');
        if(category === 'quimica') slotChem.classList.add('active');
        if(category === 'fisica') slotPhys.classList.add('active');

        gridContainer.innerHTML = '';
        const items = ELEMENTS[category];

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'grid-item';
            if (currentSelection[category] && currentSelection[category].id === item.id) {
                div.classList.add('selected');
            }
            div.innerHTML = `<strong>${item.name}</strong><span class="desc">${item.desc}</span>`;
            
            div.addEventListener('click', () => {
                selectItem(category, item);
            });
            gridContainer.appendChild(div);
        });
    }

    function selectItem(category, item) {
        currentSelection[category] = item;
        
        // Atualiza Slot Visual
        let slot;
        let icon = '?';
        if (category === 'forma') { slot = slotForma; icon = '📐'; }
        if (category === 'quimica') { slot = slotChem; icon = '🧪'; }
        if (category === 'fisica') { slot = slotPhys; icon = '⚡'; }
        
        slot.classList.add('filled');
        slot.querySelector('.slot-icon').innerText = icon;
        slot.querySelector('.slot-name').innerText = item.name;

        // Avança
        if (category === 'forma' && !currentSelection.quimica) renderGrid('quimica');
        else if (category === 'quimica' && !currentSelection.fisica) renderGrid('fisica');
        else renderGrid(category); // Re-renderiza para mostrar seleção

        checkCraftingReady();
    }

    function checkCraftingReady() {
        const isReady = currentSelection.forma && currentSelection.quimica && currentSelection.fisica;
        if (isReady) {
            btnSynthesize.removeAttribute('disabled');
            btnSynthesize.innerHTML = "SINTETIZAR";
            recipeSummary.innerText = `${currentSelection.forma.name} + ${currentSelection.quimica.name}`;
        } else {
            btnSynthesize.setAttribute('disabled', 'true');
            btnSynthesize.innerHTML = "INCOMPLETO";
            recipeSummary.innerText = '...';
        }
    }

    // Botão Sintetizar
    if(btnSynthesize) {
        btnSynthesize.addEventListener('click', () => {
            btnSynthesize.innerHTML = "PROCESSANDO...";
            btnSynthesize.disabled = true;
            setTimeout(async () => {
                const aiResult = await generateGolemData(currentSelection);
                const golemData = { ...currentSelection, aiData: aiResult };
                game.events.emit('spawn-golem', golemData);
                
                creationPanel.classList.add('hidden');
                btnOpen.classList.remove('hidden');
                resetSelection();
                btnSynthesize.innerHTML = "DAR VIDA";
            }, 500);
        });
    }

    // --- LÓGICA DE INSPEÇÃO E DRAG (MANTIDA) ---
    const inspectModal = document.getElementById('inspect-modal');
    
    document.addEventListener('mousemove', (e) => {
        if (!inspectModal.classList.contains('hidden')) {
            let top = e.clientY + 15; let left = e.clientX + 15;
            if (left > window.innerWidth - 340) left = e.clientX - 340;
            if (top > window.innerHeight - 300) top = e.clientY - 300;
            inspectModal.style.top = `${top}px`; inspectModal.style.left = `${left}px`;
        }
    });

    game.events.on('inspect-golem', (data) => {
        const stats = data.stats || {}; 
        const att = stats.stats || { forca:'?', resistencia:'?', energia:'?' };
        document.getElementById('inspect-name').innerText = stats.name || "ANALISANDO...";
        document.getElementById('inspect-desc').innerText = stats.description || "Forma de vida detectada.";
        document.getElementById('val-str').innerText = att.forca;
        document.getElementById('val-res').innerText = att.resistencia;
        document.getElementById('val-eng').innerText = att.energia;
        document.getElementById('inspect-dialogue').innerText = stats.dialogo || "...";
        inspectModal.classList.remove('hidden');
    });

    game.events.on('hide-inspect', () => { inspectModal.classList.add('hidden'); });

    // Drag Logic
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
        ghostElement = document.createElement('div');
        ghostElement.classList.add('dragging-ghost');
        ghostElement.innerText = iconChar;
        
        if(action==='feed') ghostElement.style.borderColor='#00ff00';
        if(action==='burn') ghostElement.style.borderColor='#ffaa00';
        if(action==='kill') ghostElement.style.borderColor='#ff0000';
        if(action==='freeze') ghostElement.style.borderColor='#00ffff';
        if(action==='mutate') ghostElement.style.borderColor='#ff00ff';

        document.body.appendChild(ghostElement);
        updateGhostPosition(startX, startY);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
    }

    function onDragMove(e) { updateGhostPosition(e.clientX, e.clientY); }
    function updateGhostPosition(x, y) {
        if(ghostElement) { ghostElement.style.left = `${x}px`; ghostElement.style.top = `${y}px`; }
    }
    function onDragEnd(e) {
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.body.classList.remove('grabbing');
        if(ghostElement) ghostElement.remove();

        const canvas = document.querySelector('canvas');
        if(canvas) {
            const rect = canvas.getBoundingClientRect();
            if(e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                game.events.emit('tool-used', {
                    action: draggedTool,
                    x: (e.clientX - rect.left) * scaleX,
                    y: (e.clientY - rect.top) * scaleY
                });
            }
        }
        draggedTool = null; ghostElement = null;
    }
    
    // Renderização inicial do grid (apenas para carregar algo se necessário, mas o resetSelection já cuida)
    // populateColumn helper removido pois usamos renderGrid diretamente agora
});