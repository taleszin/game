import Phaser from 'phaser';
import Golem from '../entities/Golem.js';
import { breedGolemData } from '../services/MockAiService.js';

export default class SanctuaryScene extends Phaser.Scene {
  constructor() {
    super('SanctuaryScene');
    this.isPlacingMode = false;
    this.pendingData = null;
    
    // --- SISTEMA DE GENEALOGIA ---
    this.golemIdCounter = 1;
    this.familyTree = []; // Armazena o histórico de todos os golems
  }

  preload() {
    const graphics = this.make.graphics({x: 0, y: 0, add: false});
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('pixel', 2, 2);
  }

  create() {
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x111111, 1);
    bgGraphics.fillRect(0, 0, 800, 600);
    bgGraphics.lineStyle(1, 0x222222, 1);
    for (let y = 0; y < 600; y += 40) {
        for (let x = 0; x < 800; x += 40) {
            bgGraphics.strokeRect(x, y, 40, 40);
        }
    }

    this.golemsGroup = this.add.group();

    this.cursorText = this.add.text(0, 0, '[ CLIQUE PARA CRIAR ]', {
        fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#0f0', backgroundColor: '#000'
    }).setDepth(100).setVisible(false);

    // Eventos
    this.game.events.on('spawn-golem', (data) => {
        this.pendingData = data;
        this.enterPlacementMode();
    });

    this.game.events.on('tool-used', (data) => {
        this.handleToolAction(data.x, data.y, data.action);
    });

    this.input.on('pointerdown', (pointer) => {
        if (this.isPlacingMode && this.pendingData) {
            try {
                // Criação manual = Geração 0
                this.spawnGolem(pointer.worldX, pointer.worldY, this.pendingData, null);
            } catch (error) { console.error(error); } 
            finally { this.exitPlacementMode(); }
        }
    });

    this.input.on('pointermove', (pointer) => {
        if (this.isPlacingMode && this.cursorText) {
            this.cursorText.setPosition(pointer.worldX + 10, pointer.worldY + 10);
        }
    });

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

  handleToolAction(x, y, action) {
      const golems = this.golemsGroup.getChildren();
      let hit = false;
      for (let i = golems.length - 1; i >= 0; i--) {
          const golem = golems[i];
          const distance = Phaser.Math.Distance.Between(golem.x, golem.y, x, y);
          if (golem.active && distance < 60) {
              this.createHitEffect(golem.x, golem.y, action);
              if (action === 'feed') golem.feed();
              if (action === 'burn') golem.burn();
              if (action === 'kill') golem.kill();
              if (action === 'freeze') golem.freeze();
              if (action === 'mutate') golem.mutate();
              hit = true;
              break; 
          }
      }
      if (!hit) this.createMissEffect(x, y, action);
  }

  createHitEffect(x, y, action) {
      const circle = this.add.circle(x, y, 30);
      circle.setStrokeStyle(3, 0xffffff);
      this.tweens.add({ targets: circle, scale: 2, alpha: 0, duration: 300, onComplete: () => circle.destroy() });
  }

  createMissEffect(x, y, action) {
      const textMap = { 'feed':'🍖', 'burn':'🔥', 'kill':'💀', 'freeze':'❄️', 'mutate':'🧬' };
      const missText = this.add.text(x, y, textMap[action] || '?', { fontSize: '20px' }).setOrigin(0.5);
      this.tweens.add({ targets: missText, y: y - 40, alpha: 0, duration: 600, onComplete: () => missText.destroy() });
  }

  async triggerBreeding(parent1, parent2) {
      const x = (parent1.x + parent2.x) / 2;
      const y = (parent1.y + parent2.y) / 2;
      const swirl = this.add.particles(x, y, 'pixel', { speed: 100, angle: { min: 0, max: 360 }, scale: { start: 2, end: 0 }, tint: 0xffffff, lifespan: 800, blendMode: 'ADD', quantity: 20 });
      this.tweens.add({ targets: [parent1, parent2], angle: 360, duration: 500, yoyo: true });
      const childData = await breedGolemData(parent1.dataAttributes, parent2.dataAttributes);
      
      setTimeout(() => { 
          // Passa os pais para o spawn registrar a linhagem
          this.spawnGolem(x, y + 30, childData, [parent1, parent2]); 
          swirl.destroy(); 
          if(parent1.body) parent1.body.setVelocity(-150, -150); 
          if(parent2.body) parent2.body.setVelocity(150, 150); 
      }, 600);
  }

  spawnGolem(x, y, data, parents) {
      // 1. GERENCIAMENTO DE ID E GERAÇÃO
      const myId = this.golemIdCounter++;
      let generation = 0;
      let parentIds = [];

      if (parents) {
          // Herda geração maior + 1
          const p1Gen = parents[0].dataAttributes.generation || 0;
          const p2Gen = parents[1].dataAttributes.generation || 0;
          generation = Math.max(p1Gen, p2Gen) + 1;
          parentIds = [parents[0].dataAttributes.id, parents[1].dataAttributes.id];
      }

      // Injeta dados de linhagem no objeto data (para o Golem.js guardar)
      data.id = myId;
      data.generation = generation;
      data.parents = parentIds;

      // 2. REGISTRA NA ÁRVORE DA SESSÃO
      this.addToFamilyTree(data);

      // 3. CRIA A ENTIDADE
      new Golem(this, x, y, data);
      
      const circle = this.add.circle(x, y, 5);
      circle.setStrokeStyle(2, 0xffffff);
      this.tweens.add({ targets: circle, scale: 8, alpha: 0, duration: 400, onComplete: () => circle.destroy() });
  }

  addToFamilyTree(data) {
      // Determina cor para o ícone da árvore
      let hexColor = '#00ffff';
      if(data.fisica.id === 'eletricidade') hexColor = '#ffea00';
      if(data.fisica.id === 'calor') hexColor = '#ff4d00';
      if(data.fisica.id === 'radiacao') hexColor = '#00ff00';
      if(data.fisica.id === 'gravidade') hexColor = '#9d00ff';
      if(data.fisica.id === 'luz') hexColor = '#ffffff';

      const record = {
          id: data.id,
          name: data.aiData.name,
          generation: data.generation,
          parents: data.parents,
          color: hexColor,
          shape: data.forma ? data.forma.name : 'Desconhecido'
      };

      this.familyTree.push(record);
      
      // Emite evento global para atualizar a UI
      this.game.events.emit('update-tree', this.familyTree);
  }
}