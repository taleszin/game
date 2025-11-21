// ... (Imports e Configuração do Phaser mantidos iguais) ...
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
    // ... (Lógica dos botões de criação mantida igual) ...
    let currentSelection = { biologia: null, quimica: null, fisica: null };
    const modal = document.getElementById('creation-modal');
    const btnOpen = document.getElementById('btn-open-lab');
    const btnSynthesize = document.getElementById('btn-synthesize');
    const btnCancel = document.getElementById('btn-cancel');

    if (btnOpen) {
        btnOpen.addEventListener('click', () => { modal.classList.remove('hidden'); btnOpen.classList.add('hidden'); resetSelection(); });
        btnCancel.addEventListener('click', () => { modal.classList.add('hidden'); btnOpen.classList.remove('hidden'); });
    }

    function resetSelection() {
        currentSelection = { biologia: null, quimica: null, fisica: null };
        document.querySelectorAll('.element-item').forEach(el => el.classList.remove('selected'));
        checkCraftingReady();
    }

    function populateColumn(type, containerId) {
        const container = document.querySelector(`#${containerId} .list`);
        if(!container) return;
        container.innerHTML = '';
        ELEMENTS[type].forEach(item => {
            const div = document.createElement('div');
            div.className = 'element-item';
            div.innerHTML = `<strong>${item.name}</strong><span class="desc">${item.desc}</span>`;
            div.addEventListener('click', () => {
                container.querySelectorAll('.element-item').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                currentSelection[type] = item;
                checkCraftingReady();
            });
            container.appendChild(div);
        });
    }

    function checkCraftingReady() {
        const isReady = currentSelection.biologia && currentSelection.quimica && currentSelection.fisica;
        if (isReady) {
            btnSynthesize.removeAttribute('disabled');
            btnSynthesize.innerHTML = "DAR VIDA >";
        } else {
            btnSynthesize.setAttribute('disabled', 'true');
            btnSynthesize.innerHTML = "SELECIONE TODOS";
        }
    }

    populateColumn('biologia', 'col-bio');
    populateColumn('quimica', 'col-chem');
    populateColumn('fisica', 'col-phys');

    if(btnSynthesize) {
        btnSynthesize.addEventListener('click', () => {
            btnSynthesize.innerHTML = "SINTETIZANDO...";
            btnSynthesize.disabled = true;
            setTimeout(async () => {
                const aiResult = await generateGolemData(currentSelection);
                const golemData = { ...currentSelection, aiData: aiResult };
                game.events.emit('spawn-golem', golemData);
                modal.classList.add('hidden');
                btnOpen.classList.remove('hidden');
                resetSelection();
                btnSynthesize.innerHTML = "DAR VIDA";
            }, 500);
        });
    }

    // --- NOVA LÓGICA DE INSPEÇÃO (HOVER) ---
    const inspectModal = document.getElementById('inspect-modal');
    const elName = document.getElementById('inspect-name');
    const elDesc = document.getElementById('inspect-desc');
    const elStr = document.getElementById('val-str');
    const elRes = document.getElementById('val-res');
    const elEng = document.getElementById('val-eng');
    const elDiag = document.getElementById('inspect-dialogue');

    // Atualiza posição do tooltip com o mouse
    document.addEventListener('mousemove', (e) => {
        if (!inspectModal.classList.contains('hidden')) {
            // Offset para não ficar embaixo do cursor
            inspectModal.style.top = `${e.clientY + 15}px`;
            inspectModal.style.left = `${e.clientX + 15}px`;
            
            // Previne sair da tela (Direita/Baixo)
            if (e.clientX > window.innerWidth - 340) inspectModal.style.left = `${e.clientX - 340}px`;
            if (e.clientY > window.innerHeight - 300) inspectModal.style.top = `${e.clientY - 300}px`;
        }
    });

    game.events.on('inspect-golem', (data) => {
        const stats = data.stats || {}; 
        const attributes = stats.stats || { forca: '?', resistencia: '?', energia: '?' };

        elName.innerText = stats.name || "ANALISANDO...";
        elDesc.innerText = stats.description || "Forma de vida detectada.";
        
        elStr.innerText = attributes.forca;
        elRes.innerText = attributes.resistencia;
        elEng.innerText = attributes.energia;
        elDiag.innerText = stats.dialogo || "...";

        inspectModal.classList.remove('hidden');
    });

    // Esconde quando tira o mouse
    game.events.on('hide-inspect', () => {
        inspectModal.classList.add('hidden');
    });
});