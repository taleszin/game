import Phaser from 'phaser';
import SanctuaryScene from './scenes/SanctuaryScene';
import { ELEMENTS } from './data/gameData.js';
import './style.css';

// 1. CONFIGURAÇÃO DO PHASER
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
    arcade: {
        gravity: { y: 0 },
        debug: false // Mude para true se quiser ver os quadrados de colisão
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [SanctuaryScene]
};

// Inicia o jogo
const game = new Phaser.Game(config);

// 2. LÓGICA DA UI (Protegida)
// Espera o DOM carregar para não dar erro de "null"
document.addEventListener('DOMContentLoaded', () => {
    
    // Estado da seleção
    let currentSelection = {
        biologia: null,
        quimica: null,
        fisica: null
    };

    const modal = document.getElementById('creation-modal');
    const btnOpen = document.getElementById('btn-open-lab');
    const btnSynthesize = document.getElementById('btn-synthesize');
    const btnCancel = document.getElementById('btn-cancel');

    // Verifica se os botões existem antes de adicionar eventos
    if (!btnOpen || !btnSynthesize) {
        console.error("ERRO CRÍTICO: Botões não encontrados no HTML!");
        return;
    }

    btnOpen.addEventListener('click', () => {
        modal.classList.remove('hidden');
        btnOpen.classList.add('hidden');
        resetSelection();
    });

    btnCancel.addEventListener('click', () => {
        modal.classList.add('hidden');
        btnOpen.classList.remove('hidden');
    });

    function resetSelection() {
        currentSelection = { biologia: null, quimica: null, fisica: null };
        document.querySelectorAll('.element-item').forEach(el => el.classList.remove('selected'));
        checkCraftingReady();
    }

    function populateColumn(type, containerId) {
        const container = document.querySelector(`#${containerId} .list`);
        if(!container) return;
        
        const items = ELEMENTS[type];
        container.innerHTML = '';

        items.forEach(item => {
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

    // Inicializa colunas
    populateColumn('biologia', 'col-bio');
    populateColumn('quimica', 'col-chem');
    populateColumn('fisica', 'col-phys');

    // AÇÃO FINAL
    btnSynthesize.addEventListener('click', () => {
        btnSynthesize.innerHTML = "SINTETIZANDO...";
        btnSynthesize.disabled = true;

        setTimeout(() => {
            // Clona os dados para enviar ao Phaser
            const golemData = JSON.parse(JSON.stringify(currentSelection));
            game.events.emit('spawn-golem', golemData);

            // Reseta UI
            modal.classList.add('hidden');
            btnOpen.classList.remove('hidden');
            resetSelection();
            btnSynthesize.innerHTML = "DAR VIDA";
        }, 500); // 0.5s de delay é suficiente
    });
});