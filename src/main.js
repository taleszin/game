import Phaser from 'phaser';
import SanctuaryScene from './scenes/SanctuaryScene';
import { ELEMENTS } from './data/gameData.js';
import './style.css';

// --- 1. CONFIGURAÇÃO DO PHASER ---
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000',
  pixelArt: true, // Crucial para 16-bits
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [SanctuaryScene]
};

// Inicia o jogo
const game = new Phaser.Game(config);


// --- 2. LÓGICA DA INTERFACE (UI) ---

// Estado da seleção do jogador
let currentSelection = {
    biologia: null,
    quimica: null,
    fisica: null
};

// Referências aos elementos HTML
const modal = document.getElementById('creation-modal');
const btnOpen = document.getElementById('btn-open-lab');
const btnSynthesize = document.getElementById('btn-synthesize');
const btnCancel = document.getElementById('btn-cancel');

// Abrir Modal
btnOpen.addEventListener('click', () => {
    modal.classList.remove('hidden');
    btnOpen.classList.add('hidden');
    resetSelection(); // Opcional: Limpa seleção ao abrir
});

// Fechar Modal
btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
    btnOpen.classList.remove('hidden');
});

// Função para resetar (visual e dados)
function resetSelection() {
    currentSelection = { biologia: null, quimica: null, fisica: null };
    document.querySelectorAll('.element-item').forEach(el => el.classList.remove('selected'));
    checkCraftingReady();
}

// Função para preencher as colunas HTML com os dados do JS
function populateColumn(type, containerId) {
    const container = document.querySelector(`#${containerId} .list`);
    const items = ELEMENTS[type];

    // Limpa antes de adicionar (segurança)
    container.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'element-item';
        div.innerHTML = `
            <strong>${item.name}</strong>
            <span class="desc">${item.desc}</span>
        `;
        
        // Evento de Clique
        div.addEventListener('click', () => {
            // Remove classe 'selected' dos irmãos
            container.querySelectorAll('.element-item').forEach(el => el.classList.remove('selected'));
            
            // Adiciona neste
            div.classList.add('selected');
            
            // Salva no estado
            currentSelection[type] = item;
            
            // Verifica se pode liberar o botão
            checkCraftingReady();
        });

        container.appendChild(div);
    });
}

// Verifica se os 3 ingredientes estão prontos
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

// Inicializa as listas
populateColumn('biologia', 'col-bio');
populateColumn('quimica', 'col-chem');
populateColumn('fisica', 'col-phys');

// AÇÃO FINAL (O CLIQUE MÁGICO)
btnSynthesize.addEventListener('click', () => {
    // Aqui entra a chamada da API depois
    console.log("Iniciando síntese com:", currentSelection);
    
    // Feedback visual simples
    btnSynthesize.innerHTML = "PROCESSANDO...";
    
    setTimeout(() => {
        alert(`CRIATURA GERADA!\n\nBase: ${currentSelection.biologia.name}\nEstrutura: ${currentSelection.quimica.name}\nEnergia: ${currentSelection.fisica.name}`);
        
        // Fecha o menu
        modal.classList.add('hidden');
        btnOpen.classList.remove('hidden');
        resetSelection();
    }, 1000);
});