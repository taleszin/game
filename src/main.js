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

    game.events.on('update-tree', (familyData) => {
        renderFamilyTree(familyData);
    });

    function renderFamilyTree(data) {
        treeContent.innerHTML = '';
        const generations = {};
        data.forEach(golem => {
            if (!generations[golem.generation]) generations[golem.generation] = [];
            generations[golem.generation].push(golem);
        });

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
                const icon = document.createElement('div');
                icon.className = 'node-icon';
                icon.style.borderColor = golem.color;
                const info = document.createElement('div');
                info.className = 'node-info';
                const name = document.createElement('div');
                name.className = 'node-name';
                name.innerText = golem.name;
                info.appendChild(name);

                if (golem.parents && golem.parents.length > 0) {
                    const parentInfo = document.createElement('div');
                    parentInfo.className = 'node-parents';
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

    btnOpen.addEventListener('click', () => {
        creationPanel.classList.remove('hidden');
        btnOpen.classList.add('hidden');
        switchTab('forma');
    });

    btnCancel.addEventListener('click', () => {
        creationPanel.classList.add('hidden');
        btnOpen.classList.remove('hidden');
        resetSelection();
    });

    slotForma.addEventListener('click', () => switchTab('forma'));
    slotChem.addEventListener('click', () => switchTab('quimica'));
    slotPhys.addEventListener('click', () => switchTab('fisica'));

    function switchTab(category) {
        activeCategory = category;
        [slotForma, slotChem, slotPhys].forEach(s => s.classList.remove('active'));
        if(category === 'forma') slotForma.classList.add('active');
        if(category === 'quimica') slotChem.classList.add('active');
        if(category === 'fisica') slotPhys.classList.add('active');
        renderGrid(category);
    }

    function renderGrid(category) {
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
        updateSlotVisual(category, item);
        renderGrid(category);

        if (category === 'forma' && !currentSelection.quimica) {
            setTimeout(() => switchTab('quimica'), 200);
        } else if (category === 'quimica' && !currentSelection.fisica) {
            setTimeout(() => switchTab('fisica'), 200);
        }
        checkCraftingReady();
    }

    function updateSlotVisual(category, item) {
        let slot;
        let icon = '?';
        if (category === 'forma') { slot = slotForma; icon = '📐'; }
        if (category === 'quimica') { slot = slotChem; icon = '🧪'; }
        if (category === 'fisica') { slot = slotPhys; icon = '⚡'; }

        slot.classList.add('filled');
        slot.querySelector('.slot-icon').innerText = icon;
        slot.querySelector('.slot-name').innerText = item.name;
    }

    function resetSelection() {
        currentSelection = { forma: null, quimica: null, fisica: null };
        [slotForma, slotChem, slotPhys].forEach(s => {
            s.classList.remove('filled');
            s.querySelector('.slot-icon').innerText = '?';
            s.querySelector('.slot-name').innerText = 'Selecione';
        });
        btnSynthesize.disabled = true;
        recipeSummary.innerText = '...';
        switchTab('forma');
    }

    function checkCraftingReady() {
        const isReady = currentSelection.forma && currentSelection.quimica && currentSelection.fisica;
        if (isReady) {
            btnSynthesize.removeAttribute('disabled');
            btnSynthesize.innerHTML = "SINTETIZAR";
            recipeSummary.innerText = `${currentSelection.forma.name} + ${currentSelection.quimica.name} + ${currentSelection.fisica.name}`;
        } else {
            btnSynthesize.setAttribute('disabled', 'true');
            btnSynthesize.innerHTML = "INCOMPLETO";
            recipeSummary.innerText = 'Preencha todos os slots';
        }
    }

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

    document.addEventListener('mousemove', (e) => {
        if (!inspectModal.classList.contains('hidden')) {
            let top = e.clientY + 15;
            let left = e.clientX + 15;
            if (left > window.innerWidth - 340) left = e.clientX - 340;
            if (top > window.innerHeight - 300) top = e.clientY - 300;
            inspectModal.style.top = `${top}px`;
            inspectModal.style.left = `${left}px`;
        }
    });

    game.events.on('inspect-golem', (data) => {
        const stats = data.stats || {}; 
        const att = stats.stats || { forca: '?', resistencia: '?', energia: '?', area: '?', perimeter: '?', scale: '1x' };

        elName.innerText = stats.name || "ANALISANDO...";
        elDesc.innerText = stats.description || "Forma de vida detectada.";
        
        elStr.innerText = att.forca;
        elRes.innerText = att.resistencia;
        elEng.innerText = att.energia;
        elArea.innerText = att.area;
        elPeri.innerText = att.perimeter;
        elScale.innerText = att.scale;
        elDiag.innerText = stats.dialogo || "...";

        inspectModal.classList.remove('hidden');
    });

    game.events.on('hide-inspect', () => {
        inspectModal.classList.add('hidden');
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
});