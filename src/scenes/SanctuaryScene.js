import Phaser from 'phaser';
import Golem from '../entities/Golem.js';
import { breedGolemData } from '../services/MockAiService.js';

export default class SanctuaryScene extends Phaser.Scene {
  constructor() {
    super('SanctuaryScene');
    this.isPlacingMode = false;
    this.pendingData = null;
  }

  preload() {
    const graphics = this.make.graphics({x: 0, y: 0, add: false});
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('pixel', 2, 2);
  }

  create() {
        this.golemRecords = [];
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
                this.spawnGolem(pointer.worldX, pointer.worldY, this.pendingData);
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
    
    // === IDLE CHATTER: Golems falam aleatoriamente ===
    this.idleChatterTimer = this.time.addEvent({
        delay: 8000, // A cada 8 segundos
        loop: true,
        callback: () => this.triggerIdleChatter()
    });
  }

  // Escolhe um Golem aleatório para falar algo ocioso
  triggerIdleChatter() {
      if (!this.golemsGroup) return;
      
      const golems = this.golemsGroup.getChildren().filter(g => g.active && !g.isSpeaking);
      if (golems.length === 0) return;
      
      // Escolhe um Golem aleatório
      const randomGolem = golems[Math.floor(Math.random() * golems.length)];
      
      // 30% de chance de falar (para não ser muito frequente)
      if (Math.random() < 0.3) {
          randomGolem.speakContextual('idle');
      }
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
              this.createHitEffect(golem.x, golem.y, action, golem);
              
              if (action === 'feed') golem.feed();
              if (action === 'burn') golem.burn();
              if (action === 'kill') golem.kill();
              if (action === 'freeze') golem.freeze();
              if (action === 'mutate') golem.mutate();
              
              hit = true;
              break; 
          }
      }

      if (!hit) {
          this.createMissEffect(x, y, action);
      }
  }

  createHitEffect(x, y, action, golem = null) {
      // Usa auraColor do Golem para efeito de partículas (energia híbrida)
      const effectColor = golem?.visualDNA?.auraColor || 0xffffff;
      
      const circle = this.add.circle(x, y, 30);
      circle.setStrokeStyle(3, effectColor);
      this.tweens.add({
          targets: circle, scale: 2.5, alpha: 0, duration: 350, onComplete: () => circle.destroy()
      });
      
      // Segundo anel com cor de corpo para contraste
      if (golem?.visualDNA?.bodyColor) {
          const innerCircle = this.add.circle(x, y, 15);
          innerCircle.setStrokeStyle(2, golem.visualDNA.bodyColor);
          this.tweens.add({
              targets: innerCircle, scale: 2, alpha: 0, duration: 250, onComplete: () => innerCircle.destroy()
          });
      }
  }

  createMissEffect(x, y, action) {
      let text = '?';
      if (action === 'feed') text = '🍖';
      if (action === 'burn') text = '🔥';
      if (action === 'kill') text = '💀';
      if (action === 'freeze') text = '❄️';
      if (action === 'mutate') text = '🧬';

      const missText = this.add.text(x, y, text, { fontSize: '20px' }).setOrigin(0.5);
      this.tweens.add({
          targets: missText, y: y - 40, alpha: 0, duration: 600, onComplete: () => missText.destroy()
      });
  }

  async triggerBreeding(parent1, parent2) {
      const x = (parent1.x + parent2.x) / 2;
      const y = (parent1.y + parent2.y) / 2;

      // Ativa expressão de acasalamento nos pais
      if (parent1.setBreedingExpression) parent1.setBreedingExpression();
      if (parent2.setBreedingExpression) parent2.setBreedingExpression();

      // === PARTÍCULAS INICIAIS (Neutras) ===
      const swirl = this.add.particles(x, y, 'pixel', {
          speed: 100, angle: { min: 0, max: 360 },
          scale: { start: 2, end: 0 }, tint: 0xffffff,
          lifespan: 800, blendMode: 'ADD', quantity: 20
      });

      this.tweens.add({
          targets: [parent1, parent2],
          angle: 360, duration: 500, yoyo: true
      });

      try {
          const childData = await breedGolemData(parent1.dataAttributes, parent2.dataAttributes);
          // Anota os pais para o registro de vida
          childData.parents = [parent1.id || null, parent2.id || null];
          
          // === FEEDBACK VISUAL DE ESTABILIDADE ===
          // Partículas coloridas baseadas no resultado da Alquimia
          const isAnomaly = childData.alchemyMeta?.isAnomaly || false;
          const stability = childData.alchemyMeta?.stability || 1.0;
          
          // Cor do feedback: Dourado (estável) → Vermelho (instável)
          let feedbackColor = 0xffd700; // Dourado (Alquimia perfeita)
          if (stability < 0.9) feedbackColor = 0x00ff00; // Verde (Fallback)
          if (stability < 0.6) feedbackColor = 0xff8800; // Laranja (Instável)
          if (isAnomaly) feedbackColor = 0xff0044; // Vermelho (Anomalia)
          
          // Partículas de resultado
          const resultParticles = this.add.particles(x, y, 'pixel', {
              speed: { min: 50, max: 150 },
              angle: { min: 0, max: 360 },
              scale: { start: isAnomaly ? 3 : 2, end: 0 },
              tint: feedbackColor,
              lifespan: isAnomaly ? 1200 : 600,
              blendMode: 'ADD',
              quantity: isAnomaly ? 40 : 15,
              frequency: isAnomaly ? 50 : -1 // Anomalias emitem continuamente
          });
          
          // Efeito de glitch visual para Anomalias
          if (isAnomaly) {
              // Flash de tela
              const flash = this.add.rectangle(400, 300, 800, 600, feedbackColor, 0.3);
              this.tweens.add({
                  targets: flash,
                  alpha: 0,
                  duration: 200,
                  yoyo: true,
                  repeat: 2,
                  onComplete: () => flash.destroy()
              });
              
              // Texto de alerta
              const warningText = this.add.text(x, y - 50, '⚠️ ANOMALIA', {
                  fontFamily: '"Press Start 2P"',
                  fontSize: '10px',
                  fill: '#ff0044',
                  backgroundColor: '#000000'
              }).setOrigin(0.5);
              
              this.tweens.add({
                  targets: warningText,
                  y: y - 80,
                  alpha: 0,
                  duration: 1500,
                  onComplete: () => warningText.destroy()
              });
          } else if (stability >= 0.9) {
              // Alquimia perfeita: texto dourado
              const alchemyText = this.add.text(x, y - 50, '✨ ALQUIMIA', {
                  fontFamily: '"Press Start 2P"',
                  fontSize: '8px',
                  fill: '#ffd700',
                  backgroundColor: '#000000'
              }).setOrigin(0.5);
              
              this.tweens.add({
                  targets: alchemyText,
                  y: y - 70,
                  alpha: 0,
                  duration: 1200,
                  onComplete: () => alchemyText.destroy()
              });
          }
          
          await new Promise(r => setTimeout(r, 600));
          
          // Limpa partículas de resultado
          resultParticles.destroy();

          this.spawnGolem(x, y + 30, childData);
          
          if(parent1.body) parent1.body.setVelocity(-150, -150);
          if(parent2.body) parent2.body.setVelocity(150, 150);

      } catch (error) {
          console.error(error);
      } finally {
          swirl.destroy();
      }
  }

  spawnGolem(x, y, data) {
    new Golem(this, x, y, data);
    const circle = this.add.circle(x, y, 5);
    circle.setStrokeStyle(2, 0xffffff);
    this.tweens.add({ targets: circle, scale: 8, alpha: 0, duration: 400, onComplete: () => circle.destroy() });
  }
}