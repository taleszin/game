import Phaser from 'phaser';
import Golem from '../entities/Golem.js';

export default class SanctuaryScene extends Phaser.Scene {
  constructor() {
    super('SanctuaryScene');
    this.isPlacingMode = false;
    this.pendingData = null;
    this.cursorText = null;
  }
  preload() {
    // Gera um quadrado branco 2x2 na memória para usar como partícula
    // Isso evita ter que baixar/criar um arquivo png minúsculo
    const graphics = this.make.graphics({x: 0, y: 0, add: false});
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('pixel', 2, 2);
  }

  create() {
    // --- 1. AMBIENTE ---
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x222222, 1);
    bgGraphics.fillRect(0, 0, 800, 600);

    // Grid
    bgGraphics.lineStyle(1, 0x333333, 1);
    const tileSize = 40;
    for (let y = 0; y < 600; y += tileSize) {
        for (let x = 0; x < 800; x += tileSize) {
            bgGraphics.strokeRect(x, y, tileSize, tileSize);
        }
    }

    // --- 2. TEXTO DA MIRA ---
    this.cursorText = this.add.text(0, 0, '[ CLIQUE PARA CRIAR ]', {
        fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#0f0', backgroundColor: '#000'
    }).setDepth(100).setVisible(false);

    // --- 3. EVENTO QUE VEM DA UI ---
    this.game.events.on('spawn-golem', (data) => {
        this.pendingData = data;
        this.enterPlacementMode();
    });

    // --- 4. CLIQUE PARA CRIAR ---
    this.input.on('pointerdown', (pointer) => {
        if (this.isPlacingMode && this.pendingData) {
            try {
                this.spawnGolem(pointer.worldX, pointer.worldY, this.pendingData);
            } catch (error) {
                console.error("Erro ao criar Golem:", error);
            } finally {
                // Garante que a mira saia, com erro ou sem erro
                this.exitPlacementMode();
            }
        }
    });

    // Mover texto junto com o mouse
    this.input.on('pointermove', (pointer) => {
        if (this.isPlacingMode && this.cursorText) {
            this.cursorText.setPosition(pointer.worldX + 10, pointer.worldY + 10);
        }
    });

    // Limites do mundo
    this.physics.world.setBounds(0, 0, 800, 600);
  }

  enterPlacementMode() {
      this.isPlacingMode = true;
      this.cursorText.setVisible(true);
      this.input.setDefaultCursor('crosshair');
  }

  exitPlacementMode() {
      this.isPlacingMode = false;
      this.pendingData = null;
      this.cursorText.setVisible(false);
      this.input.setDefaultCursor('default');
  }

  spawnGolem(x, y, data) {
    new Golem(this, x, y, data);
    
    // Efeito visual
    const circle = this.add.circle(x, y, 10, 0xffffff);
    this.tweens.add({
        targets: circle, scale: 5, alpha: 0, duration: 300,
        onComplete: () => circle.destroy()
    });
  }
}
