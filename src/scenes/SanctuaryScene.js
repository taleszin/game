import Phaser from 'phaser';

export default class SanctuaryScene extends Phaser.Scene {
  constructor() {
    super('SanctuaryScene');
  }

  preload() {
    // Futuramente carregaremos os sprites aqui
    // this.load.image('bg', 'assets/lab_bg.png');
  }

  create() {
    // 1. Fundo (Chão do Laboratório)
    const graphics = this.add.graphics();
    
    // Chão Escuro
    graphics.fillStyle(0x1a1a2e, 1); 
    graphics.fillRect(0, 0, 800, 600);
    
    // Grid do chão (efeito perspectiva simples)
    graphics.lineStyle(2, 0x2a2a40, 1);
    for(let i = 0; i < 800; i += 50) {
        graphics.moveTo(i, 0);
        graphics.lineTo(i, 600);
    }
    for(let i = 0; i < 600; i += 50) {
        graphics.moveTo(0, i);
        graphics.lineTo(800, i);
    }

    // Texto de Debug no Canvas
    this.add.text(400, 300, 'SISTEMA DE CONTENÇÃO DE VIDA', { 
      fontFamily: '"Press Start 2P"', 
      fontSize: '14px', 
      fill: '#333' 
    }).setOrigin(0.5);

    console.log('Cena Santuário Ativa');
  }
}