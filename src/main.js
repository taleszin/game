import Phaser from 'phaser';
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
  // --- ATENÇÃO: ESTA PARTE É CRÍTICA PARA O BONECO ANDAR ---
  physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 0 }, 
        debug: true // Deixei true para vermos a caixa de colisão (quadrado roxo)
    }
  },
  // ---------------------------------------------------------
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [SanctuaryScene]
};

const game = new Phaser.Game(config);

// --- LÓGICA DA UI (Mantenha igual ao que você já tem) ---
// ... (Seu código de botões aqui permanece o mesmo) ...
// Só garanta que o evento final está emitindo os dados:
const btnSynthesize = document.getElementById('btn-synthesize');
// ... resto do código dos botões ...