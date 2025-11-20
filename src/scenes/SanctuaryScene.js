import Phaser from 'phaser';
import Golem from '../entities/Golem.js';

export default class SanctuaryScene extends Phaser.Scene {
  constructor() {
    super('SanctuaryScene');
  }

  create() {
    // --- 1. AMBIENTAÇÃO (O Mapa Procedural) ---
    // Vamos desenhar um chão de ladrilhos para parecer um laboratório retrô
    const bgGraphics = this.add.graphics();
    
    // Cor de fundo base (Concreto escuro)
    bgGraphics.fillStyle(0x222222, 1);
    bgGraphics.fillRect(0, 0, 800, 600);

    // Desenhar ladrilhos (Tiles)
    bgGraphics.lineStyle(1, 0x333333, 1);
    bgGraphics.fillStyle(0x2a2a2a, 1);
    
    const tileSize = 40;
    for (let y = 0; y < 600; y += tileSize) {
        for (let x = 0; x < 800; x += tileSize) {
            // Desenha quadrado levemente mais claro intercalado
            if ((x + y) % (tileSize * 2) === 0) {
                bgGraphics.fillRect(x, y, tileSize, tileSize);
            }
            // Linhas da grade
            bgGraphics.strokeRect(x, y, tileSize, tileSize);
        }
    }

    // Desenhar uma "Área de Contenção" no centro (Onde os monstros nascem)
    const zoneGraphics = this.add.graphics();
    zoneGraphics.lineStyle(4, 0x9d00ff, 0.5); // Roxo neon meio transparente
    zoneGraphics.strokeRect(100, 100, 600, 400); // Uma borda grande
    
    // Detalhe: Cantos tecnológicos
    zoneGraphics.fillStyle(0x9d00ff, 1);
    zoneGraphics.fillRect(90, 90, 20, 20);   // Canto sup esq
    zoneGraphics.fillRect(690, 90, 20, 20);  // Canto sup dir
    zoneGraphics.fillRect(90, 490, 20, 20);  // Canto inf esq
    zoneGraphics.fillRect(690, 490, 20, 20); // Canto inf dir

    // --- 2. SISTEMA DE EVENTOS ---
    this.game.events.on('spawn-golem', (data) => {
        this.spawnGolem(data);
    });

    // Adiciona limites físicos no mundo (Parede invisível nas bordas da tela)
    this.physics.world.setBounds(0, 0, 800, 600);

    console.log('Ambiente do laboratório gerado.');
  }

  spawnGolem(data) {
    // Gera posição aleatória, mas DENTRO da área de contenção (margem de 150px)
    const x = Phaser.Math.Between(150, 650);
    const y = Phaser.Math.Between(150, 450);

    const newGolem = new Golem(this, x, y, data);
    
    // Feedback visual de nascimento (Explosão de partículas simples)
    this.createSpawnEffect(x, y, data.quimica.id);
    
    console.log("Golem gerado:", newGolem);
  }

  createSpawnEffect(x, y, type) {
      // Cria um círculo que cresce e some (efeito de impacto)
      const circle = this.add.circle(x, y, 5, 0xffffff);
      
      this.tweens.add({
          targets: circle,
          scale: 10,
          alpha: 0,
          duration: 500,
          onComplete: () => circle.destroy()
      });
  }
}