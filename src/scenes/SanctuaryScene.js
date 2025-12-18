import Phaser from 'phaser';
import Golem from '../entities/Golem.js';
import { breedGolemData } from '../services/MockAiService.js';
import { initUIFlingSystem } from '../systems/UIFlingSystem.js';

export default class SanctuaryScene extends Phaser.Scene {
  constructor() {
    super('SanctuaryScene');
    this.isPlacingMode = false;
    this.pendingData = null;
    
    // ═══ ENGINE DE TEMPO ═══
    this.simulationSpeed = 1.0;
    this.isPaused = false;
    this.pauseOverlay = null;
  }

  /**
   * Recebe parâmetros passados pelo MainMenuScene
   */
  init(data) {
    this.loadGame = data?.loadGame || false;
    this.isNewGame = data?.newGame || false;
    
    console.log(`[SanctuaryScene] Init - LoadGame: ${this.loadGame}, NewGame: ${this.isNewGame}`);
  }

  preload() {
    const graphics = this.make.graphics({x: 0, y: 0, add: false});
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('pixel', 2, 2);
    
    // Fallback: carrega background se não foi carregado no MainMenu
    if (!this.textures.exists('sanctuary-bg')) {
      console.log('[SanctuaryScene] Carregando background (fallback)...');
      this.load.image('sanctuary-bg', 'background.png');
    }
  }

  create() {
        // ═══ MOSTRA CANVAS E UI DO JOGO ═══
        const gameContainer = document.getElementById('game-container');
        const uiLayer = document.getElementById('ui-layer');
        
        if (gameContainer) {
            gameContainer.style.opacity = '1';
            gameContainer.style.pointerEvents = 'auto';
        }
        
        if (uiLayer) {
            uiLayer.style.opacity = '1';
            // NÃO definir pointer-events: auto no ui-layer!
            // O ui-layer deve ser "transparente" para cliques passarem ao canvas
            // Elementos filhos que precisam de interação já têm pointer-events: all
        }
        
        // ═══ MOSTRA BOTÃO "NOVO EXPERIMENTO" (fora do ui-layer) ═══
        const btnOpenLab = document.getElementById('btn-open-lab');
        if (btnOpenLab) {
            btnOpenLab.style.display = 'block';
        }
        
        // ═══ INICIA TUTORIAL SE FOR NOVO JOGO ═══
        if (this.isNewGame) {
            console.log('[SanctuaryScene] Novo jogo detectado - iniciando tutorial...');
            // Pequeno delay para garantir que a UI está pronta
            this.time.delayedCall(300, () => {
                this.game.events.emit('start-tutorial');
            });
        }
        
        // ═══ INICIALIZA UI FLING SYSTEM (God Mode!) ═══
        this.uiFlingSystem = initUIFlingSystem(this);
        console.log('[SanctuaryScene] 🎯 UI Fling System ativado - GOD MODE!');
        
        this.golemRecords = [];
        
        // Usa dimensões dinâmicas do game
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        // ═══ BACKGROUND DO SANTUÁRIO ═══
        this._createBackground(gameWidth, gameHeight);

    this.golemsGroup = this.add.group();

    this.cursorText = this.add.text(0, 0, '[ CLIQUE PARA CRIAR ]', {
        fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#0f0', backgroundColor: '#000'
    }).setDepth(100).setVisible(false);

    this.game.events.on('spawn-golem', (data) => {
        this.pendingData = data;
        this.enterPlacementMode();
    });

    this.game.events.on('tool-used', (data) => {
        // Converte coordenadas do canvas para coordenadas do mundo (considerando zoom)
        const worldPoint = this.cameras.main.getWorldPoint(data.x, data.y);
        this.handleToolAction(worldPoint.x, worldPoint.y, data.action);
    });
    
    // ═══ SISTEMA DE REAÇÃO DE MEDO ═══
    // Golems reagem quando ferramentas perigosas são arrastadas
    this.currentThreat = null;
    this.threatPosition = { x: 0, y: 0 };
    
    this.game.events.on('tool-drag-start', (data) => {
        const dangerousTools = ['kill', 'taser', 'burn', 'singularity'];
        if (dangerousTools.includes(data.action)) {
            this.currentThreat = data.action;
        }
    });
    
    this.game.events.on('tool-drag-move', (data) => {
        // Converte coordenadas do canvas para coordenadas do mundo (considerando zoom)
        const worldPoint = this.cameras.main.getWorldPoint(data.x, data.y);
        this.threatPosition = { x: worldPoint.x, y: worldPoint.y };
        
        // Verifica se há Golem sob o cursor para Target Lock
        if (this.golemsGroup) {
            const golems = this.golemsGroup.getChildren();
            let foundTarget = null;
            
            for (const golem of golems) {
                if (!golem.active) continue;
                const dist = Phaser.Math.Distance.Between(golem.x, golem.y, worldPoint.x, worldPoint.y);
                // Usa mesmo critério de distância do handleToolAction
                const hitRadius = Math.max(60, 40 * (golem.targetScale || 1));
                if (dist < hitRadius) {
                    foundTarget = golem;
                    break;
                }
            }
            
            if (foundTarget) {
                // Determina tipo de target lock
                let lockType = 'neutral';
                if (['kill', 'taser', 'burn'].includes(data.action)) lockType = 'hostile';
                if (['feed'].includes(data.action)) lockType = 'friendly';
                
                // Converte posição do jogo para tela (considerando zoom)
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const cam = this.cameras.main;
                    // Converte world coords para screen coords
                    const screenX = rect.left + ((foundTarget.x - cam.scrollX) * cam.zoom / cam.width) * rect.width + rect.width/2;
                    const screenY = rect.top + ((foundTarget.y - cam.scrollY) * cam.zoom / cam.height) * rect.height + rect.height/2;
                    
                    this.game.events.emit('show-target-lock', {
                        screenX, screenY, type: lockType
                    });
                }
            } else {
                this.game.events.emit('hide-target-lock');
            }
        }
    });
    
    this.game.events.on('tool-drag-end', () => {
        this.currentThreat = null;
        this.game.events.emit('hide-target-lock');
    });

    // ═══ CONTROLE DE TEMPO ═══
    this.game.events.on('update-time-scale', (speed) => {
        this.setSimulationSpeed(speed);
    });

    this.input.on('pointerdown', (pointer) => {
        if (this.isPlacingMode && this.pendingData) {
            try {
                // Usa dimensões do game para clamp
                const gameWidth = this.sys.game.config.width;
                const gameHeight = this.sys.game.config.height;
                
                // Usa worldX/worldY que já considera câmera/zoom
                // Clamp para bounds do mundo com margem
                const spawnX = Phaser.Math.Clamp(pointer.worldX, 50, gameWidth - 50);
                const spawnY = Phaser.Math.Clamp(pointer.worldY, 50, gameHeight - 50);
                
                // Cria ripple visual no ponto de spawn
                this._createPlacementRipple(pointer.x, pointer.y);
                
                this.spawnGolem(spawnX, spawnY, this.pendingData);
            } catch (error) { console.error(error); } 
            finally { this.exitPlacementMode(); }
        }
    });

    this.input.on('pointermove', (pointer) => {
        if (this.isPlacingMode && this.cursorText) {
            this.cursorText.setPosition(pointer.worldX + 10, pointer.worldY + 10);
        }
    });

    // Usa dimensões dinâmicas do game config (reutiliza gameWidth/gameHeight do início)
    this.physics.world.setBounds(0, 0, gameWidth, gameHeight);
    
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
      
      // ═══ MOBILE: Mostra overlay com instruções de placement ═══
      this._showPlacementOverlay();
  }

  exitPlacementMode() {
      this.isPlacingMode = false;
      this.pendingData = null;
      this.cursorText.setVisible(false);
      this.input.setDefaultCursor('default');
      
      // ═══ MOBILE: Remove overlay ═══
      this._hidePlacementOverlay();
  }
  
  /**
   * Mostra overlay visual para indicar que usuário deve clicar para posicionar
   */
  _showPlacementOverlay() {
      // Remove overlay anterior se existir
      this._hidePlacementOverlay();
      
      // Cria overlay
      this.placementOverlay = document.createElement('div');
      this.placementOverlay.className = 'placement-overlay active';
      this.placementOverlay.innerHTML = `
          <div class="placement-hint">
              <div class="placement-hint-icon">👆</div>
              <div class="placement-hint-text">TOQUE NA TELA</div>
              <div class="placement-hint-subtext">para posicionar seu Golem</div>
          </div>
      `;
      document.body.appendChild(this.placementOverlay);
      
      // Permite que cliques passem para o canvas (pointer-events: none no CSS)
      // mas adiciona listener para criar ripple visual e esconder hint
      const hint = this.placementOverlay.querySelector('.placement-hint');
      if (hint) {
          hint.style.pointerEvents = 'auto';
          hint.addEventListener('click', () => {
              // Esconde o hint ao clicar nele, usuário entendeu
              hint.style.display = 'none';
          });
      }
  }
  
  /**
   * Cria efeito ripple no ponto de toque
   */
  _createPlacementRipple(x, y) {
      const ripple = document.createElement('div');
      ripple.className = 'placement-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      document.body.appendChild(ripple);
      
      // Remove após animação
      setTimeout(() => ripple.remove(), 600);
  }
  
  /**
   * Remove overlay de placement
   */
  _hidePlacementOverlay() {
      if (this.placementOverlay) {
          this.placementOverlay.classList.remove('active');
          if (this._placementTouchHandler) {
              this.placementOverlay.removeEventListener('touchstart', this._placementTouchHandler);
              this.placementOverlay.removeEventListener('mousedown', this._placementTouchHandler);
          }
          setTimeout(() => {
              this.placementOverlay?.remove();
              this.placementOverlay = null;
          }, 300);
      }
  }

  handleToolAction(x, y, action) {
      const golems = this.golemsGroup.getChildren();
      let hit = false;

      // ═══ SINGULARITY - Afeta área, não precisa de alvo direto ═══
      if (action === 'singularity') {
          this.createSingularity(x, y);
          return;
      }

      for (let i = golems.length - 1; i >= 0; i--) {
          const golem = golems[i];
          const distance = Phaser.Math.Distance.Between(golem.x, golem.y, x, y);
          
          // Distância de hit escala com o tamanho do Golem
          const hitRadius = Math.max(60, 40 * (golem.targetScale || 1));
          
          if (golem.active && distance < hitRadius) {
              this.createHitEffect(golem.x, golem.y, action, golem);
              
              if (action === 'feed') golem.feed();
              if (action === 'burn') golem.burn();
              if (action === 'kill') golem.kill();
              if (action === 'freeze') golem.freeze();
              if (action === 'mutate') golem.mutate();
              if (action === 'taser') this.applyTaser(golem);
              if (action === 'mutagen') this.applyMutagen(golem);
              
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
      if (action === 'singularity') text = '🌀';
      if (action === 'taser') text = '⚡';
      if (action === 'mutagen') text = '💉';

      const missText = this.add.text(x, y, text, { fontSize: '20px' }).setOrigin(0.5);
      this.tweens.add({
          targets: missText, y: y - 40, alpha: 0, duration: 600, onComplete: () => missText.destroy()
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // NOVAS FERRAMENTAS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 🌀 SINGULARITY - Cria poço gravitacional que puxa Golems
   */
  createSingularity(x, y) {
      console.log('[Singularity] Criando poço gravitacional em', x, y);
      
      // Efeito visual do buraco negro
      const blackHole = this.add.circle(x, y, 10, 0x000000);
      blackHole.setStrokeStyle(3, 0x9900ff);
      blackHole.setDepth(50);
      
      // Anéis de acreção
      const ring1 = this.add.circle(x, y, 40);
      ring1.setStrokeStyle(2, 0x9900ff, 0.5);
      const ring2 = this.add.circle(x, y, 60);
      ring2.setStrokeStyle(1, 0x6600cc, 0.3);
      
      // Animação dos anéis
      this.tweens.add({
          targets: [ring1, ring2],
          scale: { from: 0.5, to: 1.5 },
          alpha: { from: 0.8, to: 0 },
          duration: 500,
          repeat: 5,
          yoyo: false
      });
      
      // Expande o buraco
      this.tweens.add({
          targets: blackHole,
          scale: 3,
          duration: 300,
          ease: 'Quad.easeOut'
      });
      
      // Aplica força gravitacional por 3 segundos
      const duration = 3000;
      const startTime = Date.now();
      const pullStrength = 150;
      const pullRadius = 200;
      
      const gravityEvent = this.time.addEvent({
          delay: 16,
          repeat: Math.floor(duration / 16),
          callback: () => {
              const elapsed = Date.now() - startTime;
              const progress = elapsed / duration;
              const currentStrength = pullStrength * (1 - progress * 0.5); // Enfraquece ao longo do tempo
              
              const golems = this.golemsGroup.getChildren();
              for (const golem of golems) {
                  if (!golem.active || !golem.body) continue;
                  
                  const dist = Phaser.Math.Distance.Between(golem.x, golem.y, x, y);
                  if (dist < pullRadius && dist > 20) {
                      const angle = Phaser.Math.Angle.Between(golem.x, golem.y, x, y);
                      const force = currentStrength * (1 - dist / pullRadius);
                      
                      golem.body.velocity.x += Math.cos(angle) * force * 0.5;
                      golem.body.velocity.y += Math.sin(angle) * force * 0.5;
                  }
              }
          }
      });
      
      // Cleanup após 3 segundos
      this.time.delayedCall(duration, () => {
          this.tweens.add({
              targets: [blackHole, ring1, ring2],
              scale: 0,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                  blackHole.destroy();
                  ring1.destroy();
                  ring2.destroy();
              }
          });
      });
  }

  /**
   * ⚡ TASER - Induz pânico e repulsão
   */
  applyTaser(golem) {
      if (!golem.active) return;
      
      console.log('[Taser] Aplicando choque em', golem.golemId);
      
      // Efeito visual de eletricidade
      const lightning = this.add.text(golem.x, golem.y - 30, '⚡⚡⚡', { 
          fontSize: '16px' 
      }).setOrigin(0.5);
      
      // Flash amarelo
      this.cameras.main.flash(100, 255, 255, 0, false);
      
      // Shake no golem
      this.tweens.add({
          targets: golem,
          x: golem.x + Phaser.Math.Between(-5, 5),
          duration: 50,
          repeat: 10,
          yoyo: true
      });
      
      // Remove texto
      this.tweens.add({
          targets: lightning,
          y: golem.y - 60,
          alpha: 0,
          duration: 500,
          onComplete: () => lightning.destroy()
      });
      
      // Aplica força de repulsão forte
      if (golem.body) {
          const repulseAngle = Math.random() * Math.PI * 2;
          golem.body.velocity.x = Math.cos(repulseAngle) * 300;
          golem.body.velocity.y = Math.sin(repulseAngle) * 300;
      }
      
      // Estado de pânico por 5 segundos
      golem.isPanicked = true;
      golem.panicEndTime = Date.now() + 5000;
      
      // Expressão de medo
      if (golem.setFearExpression) golem.setFearExpression();
      
      // Faz o golem gritar
      if (golem.speakContextual) golem.speakContextual('pain');
      
      // Remove estado de pânico após 5s
      this.time.delayedCall(5000, () => {
          if (golem.active) {
              golem.isPanicked = false;
              if (golem.resetExpression) golem.resetExpression();
          }
      });
  }

  /**
   * 💉 MUTAGEN - Rerola atributo com chance de morte
   */
  applyMutagen(golem) {
      if (!golem.active) return;
      
      console.log('[Mutagen] Injetando mutageno em', golem.golemId);
      
      // Efeito visual de injeção
      const syringe = this.add.text(golem.x + 20, golem.y, '💉', { 
          fontSize: '20px' 
      }).setOrigin(0.5);
      
      this.tweens.add({
          targets: syringe,
          x: golem.x,
          duration: 200,
          onComplete: () => {
              syringe.destroy();
              
              // 10% chance de morte
              if (Math.random() < 0.1) {
                  console.log('[Mutagen] CRÍTICO! Golem morreu pela mutação.');
                  
                  // Efeito de morte tóxica
                  const deathText = this.add.text(golem.x, golem.y - 20, '☠️ CRITICAL', {
                      fontFamily: '"Press Start 2P"',
                      fontSize: '10px',
                      color: '#ff0000'
                  }).setOrigin(0.5);
                  
                  this.tweens.add({
                      targets: deathText,
                      y: golem.y - 60,
                      alpha: 0,
                      duration: 1000,
                      onComplete: () => deathText.destroy()
                  });
                  
                  golem.kill();
                  return;
              }
              
              // Rerola um atributo aleatório
              this.rerollGolemAttribute(golem);
          }
      });
  }

  /**
   * Rerola um atributo visual do Golem
   */
  rerollGolemAttribute(golem) {
      if (!golem.visualDNA) return;
      
      const attributes = ['bodyColor', 'auraColor', 'eyeColor'];
      const chosenAttr = attributes[Math.floor(Math.random() * attributes.length)];
      
      // Gera nova cor aleatória
      const newColor = Phaser.Display.Color.RandomRGB().color;
      
      console.log(`[Mutagen] Rerolando ${chosenAttr} para`, newColor.toString(16));
      
      // Aplica mutação
      golem.visualDNA[chosenAttr] = newColor;
      
      // Força redesenho se o método existir
      if (golem.redraw) {
          golem.redraw();
      }
      
      // Efeito visual de transformação
      const mutateText = this.add.text(golem.x, golem.y - 30, '🧪 MUTATED', {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: '#00ff88'
      }).setOrigin(0.5);
      
      this.tweens.add({
          targets: mutateText,
          y: golem.y - 60,
          alpha: 0,
          duration: 1000,
          onComplete: () => mutateText.destroy()
      });
      
      // Flash verde
      const flash = this.add.circle(golem.x, golem.y, 30, 0x00ff88, 0.5);
      this.tweens.add({
          targets: flash,
          scale: 2,
          alpha: 0,
          duration: 300,
          onComplete: () => flash.destroy()
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
              // Flash de tela - usa dimensões dinâmicas
              const gw = this.sys.game.config.width;
              const gh = this.sys.game.config.height;
              const flash = this.add.rectangle(gw/2, gh/2, gw, gh, feedbackColor, 0.3);
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
              const alchemyText = this.add.text(x, y - 50, ' ALQUIMIA', {
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

          // Emite evento para desbloquear forma evoluída se aplicável
          if (childData.forma) {
            this.game.events.emit('golem-created-with-form', { formId: childData.forma.id });
          }

          this.spawnGolem(x, y + 30, childData);
          
          // Emite evento de breeding bem-sucedido (para Tutorial)
          this.game.events.emit('breed-success', { 
            childData, 
            parent1Id: parent1.id, 
            parent2Id: parent2.id 
          });
          
          if(parent1.body) parent1.body.setVelocity(-150, -150);
          if(parent2.body) parent2.body.setVelocity(150, 150);

      } catch (error) {
          console.error(error);
      } finally {
          swirl.destroy();
      }
  }

  spawnGolem(x, y, data) {
    // ═══ SPAWN SEGURO: Garante velocidade estável antes de criar ═══
    // Previne "saltos" de física no primeiro frame
    const previousSpeed = this.simulationSpeed;
    if (previousSpeed !== 1) {
      this.setSimulationSpeed(1);
    }
    
    new Golem(this, x, y, data);
    
    const circle = this.add.circle(x, y, 5);
    circle.setStrokeStyle(2, 0xffffff);
    this.tweens.add({ targets: circle, scale: 8, alpha: 0, duration: 400, onComplete: () => circle.destroy() });
  }

  // ═══════════════════════════════════════════════════════════════════
  // ENGINE DE TEMPO - Controle Global de Simulação
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Define a velocidade da simulação (afeta física, timers e ciclos de vida)
   * ACTIVE PAUSE: Input e hover continuam funcionando, só simulação para
   * @param {number} speed - Velocidade (0 = pausa, 1 = normal, 5 = rápido)
   */
  setSimulationSpeed(speed) {
    const previousSpeed = this.simulationSpeed;
    this.simulationSpeed = speed;
    this.isPaused = (speed === 0);

    // ═══ ACTIVE PAUSE: NÃO pausamos physics.world diretamente ═══
    // Isso permite que pointer events continuem funcionando
    // Em vez disso, cada Golem checa isPaused antes de mover/decair vida
    
    if (speed === 0) {
      // Pausa: Golems param de se mover via flag, não via physics
      // Mantemos physics rodando para permitir hover/click detection
      this.physics.world.timeScale = 1; // Mantém normal para detecção
    } else {
      // Velocidade ativa: ajusta timeScale invertido
      this.physics.world.timeScale = 1 / speed;
    }

    // ═══ TIMERS: Ajusta com proteção contra valores inválidos ═══
    const safeSpeed = Math.max(0.001, speed); // Evita divisão por zero
    
    if (this.idleChatterTimer) {
      if (speed === 0) {
        this.idleChatterTimer.paused = true;
      } else {
        this.idleChatterTimer.paused = false;
        this.idleChatterTimer.timeScale = safeSpeed;
      }
    }

    // ═══ GOLEMS: Notifica com debounce para evitar crash ═══
    if (this._speedChangeTimeout) {
      clearTimeout(this._speedChangeTimeout);
    }
    
    this._speedChangeTimeout = setTimeout(() => {
      const golems = this.golemsGroup?.getChildren() || [];
      golems.forEach(golem => {
        if (golem.active && golem.onSimulationSpeedChanged) {
          golem.onSimulationSpeedChanged(speed);
        }
      });
    }, 50); // Debounce de 50ms

    // ═══ EFEITO VISUAL DE PAUSA (sutil, sem bloquear input) ═══
    if (this.isPaused) {
      this.showPauseOverlay();
    } else {
      this.hidePauseOverlay();
    }

    console.log(`[TIME] Speed: ${speed}x | Paused: ${this.isPaused}`);
  }

  /**
   * Exibe overlay visual de pausa - SUTIL, não bloqueia input
   */
  showPauseOverlay() {
    if (this.pauseOverlay) return;

    // Dimensões dinâmicas
    const gw = this.sys.game.config.width;
    const gh = this.sys.game.config.height;

    // Overlay MUITO sutil - apenas um véu visual
    this.pauseOverlay = this.add.graphics();
    this.pauseOverlay.setDepth(50); // Abaixo dos Golems para não bloquear
    this.pauseOverlay.fillStyle(0x000000, 0.15); // Bem transparente
    this.pauseOverlay.fillRect(0, 0, gw, gh);

    // Ícone de pausa no canto (não centralizado para não atrapalhar)
    const pauseIcon = this.add.text(gw - 20, 20, '⏸', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#ff4400'
    }).setOrigin(1, 0).setDepth(51).setAlpha(0.8);

    // Animação sutil
    this.tweens.add({
      targets: pauseIcon,
      alpha: { from: 0.8, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.pauseOverlay.pauseIcon = pauseIcon;
  }

  /**
   * Remove o overlay de pausa
   */
  hidePauseOverlay() {
    if (!this.pauseOverlay) return;

    if (this.pauseOverlay.pauseIcon) {
      this.tweens.killTweensOf(this.pauseOverlay.pauseIcon);
      this.pauseOverlay.pauseIcon.destroy();
    }
    this.pauseOverlay.destroy();
    this.pauseOverlay = null;
  }

  /**
   * Update loop - Processa reação de medo ao cursor com ferramenta
   * + Gestos Mobile (Pinch-to-Zoom, Pan)
   */
  update(time, delta) {
      if (this.isPaused) return;
      
      // ═══════════════════════════════════════════════════════════════
      // MOBILE GESTURES: Pinch-to-Zoom e Pan
      // ═══════════════════════════════════════════════════════════════
      const isMobile = !this.sys.game.device.os.desktop;
      
      if (isMobile) {
          const pointer1 = this.input.pointer1;
          const pointer2 = this.input.pointer2;
          
          // Safety check - pointers may not exist
          if (!pointer1 || !pointer2) return;
          
          // ═══ PINCH-TO-ZOOM ═══
          if (pointer1.isDown && pointer2.isDown) {
              const dist = Phaser.Math.Distance.Between(
                  pointer1.x, pointer1.y,
                  pointer2.x, pointer2.y
              );
              
              if (this.lastPinchDist === undefined) {
                  this.lastPinchDist = dist;
              }
              
              const pinchDelta = dist - this.lastPinchDist;
              const zoomSpeed = 0.002;
              const smoothing = 0.15; // Lerp factor
              
              if (Math.abs(pinchDelta) > 2) {
                  const targetZoom = this.cameras.main.zoom + (pinchDelta * zoomSpeed);
                  const clampedZoom = Phaser.Math.Clamp(targetZoom, 0.5, 2.5);
                  
                  // Smooth zoom with lerp
                  this.cameras.main.zoom = Phaser.Math.Linear(
                      this.cameras.main.zoom,
                      clampedZoom,
                      smoothing
                  );
              }
              
              this.lastPinchDist = dist;
              this.isPinching = true;
          } else {
              this.lastPinchDist = undefined;
              this.isPinching = false;
          }
          
          // ═══ PAN (Mover Câmera) - Single finger drag no fundo ═══
          if (pointer1.isDown && !pointer2.isDown && !this.isPinching && !this.isPlacingMode) {
              // Só faz pan se não estiver sobre um Golem
              const hitGolem = this.golemsGroup?.getChildren().some(g => {
                  if (!g.active) return false;
                  const dist = Phaser.Math.Distance.Between(g.x, g.y, pointer1.worldX, pointer1.worldY);
                  return dist < 40;
              });
              
              if (!hitGolem) {
                  if (this.lastPanPos === undefined) {
                      this.lastPanPos = { x: pointer1.x, y: pointer1.y };
                  }
                  
                  const panDeltaX = this.lastPanPos.x - pointer1.x;
                  const panDeltaY = this.lastPanPos.y - pointer1.y;
                  
                  if (Math.abs(panDeltaX) > 1 || Math.abs(panDeltaY) > 1) {
                      this.cameras.main.scrollX += panDeltaX / this.cameras.main.zoom;
                      this.cameras.main.scrollY += panDeltaY / this.cameras.main.zoom;
                      
                      // Clamp camera to world bounds
                      const cam = this.cameras.main;
                      const worldW = this.sys.game.config.width;
                      const worldH = this.sys.game.config.height;
                      const maxScrollX = worldW - (cam.width / cam.zoom);
                      const maxScrollY = worldH - (cam.height / cam.zoom);
                      cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, Math.max(0, maxScrollX));
                      cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, Math.max(0, maxScrollY));
                  }
                  
                  this.lastPanPos = { x: pointer1.x, y: pointer1.y };
              }
          } else {
              this.lastPanPos = undefined;
          }
      }
      
      // ═══ REAÇÃO DE MEDO ═══
      // Golems fogem lentamente quando ferramentas perigosas estão sendo arrastadas
      if (this.currentThreat && this.golemsGroup) {
          const dangerousTools = ['kill', 'taser', 'burn'];
          const fearRadius = 120;
          const fleeSpeed = 30;
          
          if (dangerousTools.includes(this.currentThreat)) {
              const golems = this.golemsGroup.getChildren();
              
              for (const golem of golems) {
                  if (!golem.active || !golem.body) continue;
                  
                  const dist = Phaser.Math.Distance.Between(
                      golem.x, golem.y, 
                      this.threatPosition.x, this.threatPosition.y
                  );
                  
                  if (dist < fearRadius) {
                      // Calcula direção de fuga (oposta ao cursor)
                      const angle = Phaser.Math.Angle.Between(
                          this.threatPosition.x, this.threatPosition.y,
                          golem.x, golem.y
                      );
                      
                      // Força de fuga diminui com a distância
                      const fearIntensity = 1 - (dist / fearRadius);
                      const fleeForce = fleeSpeed * fearIntensity * (delta / 16);
                      
                      golem.body.velocity.x += Math.cos(angle) * fleeForce;
                      golem.body.velocity.y += Math.sin(angle) * fleeForce;
                      
                      // Mostra expressão de medo (se não estiver já)
                      if (!golem.isFearful && golem.setFearExpression) {
                          golem.isFearful = true;
                          golem.setFearExpression();
                      }
                  } else if (golem.isFearful) {
                      // Reset expressão quando longe da ameaça
                      golem.isFearful = false;
                      if (golem.resetExpression) golem.resetExpression();
                  }
              }
          }
      }
      
      // ═══ COMPORTAMENTO DE PÂNICO (TASER) ═══
      if (this.golemsGroup) {
          const golems = this.golemsGroup.getChildren();
          const now = Date.now();
          
          for (const golem of golems) {
              if (!golem.active || !golem.body || !golem.isPanicked) continue;
              
              // Movimento errático durante pânico
              if (Math.random() < 0.1) {
                  const panicAngle = Math.random() * Math.PI * 2;
                  golem.body.velocity.x = Math.cos(panicAngle) * 150;
                  golem.body.velocity.y = Math.sin(panicAngle) * 150;
              }
              
              // Verifica se o pânico acabou
              if (now > golem.panicEndTime) {
                  golem.isPanicked = false;
                  if (golem.resetExpression) golem.resetExpression();
              }
          }
      }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // BACKGROUND SYSTEM - Cemitério de Formas Geométricas (SNES Style!)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Cria background do santuário com imagem + efeitos SNES
   */
  _createBackground(gameWidth, gameHeight) {
      // Layer 0: Cor de fallback (caso imagem falhe)
      const fallbackBg = this.add.graphics();
      fallbackBg.fillStyle(0x0a0510, 1);
      fallbackBg.fillRect(0, 0, gameWidth, gameHeight);
      fallbackBg.setDepth(-100);
      
      // Layer 1: Imagem de background com parallax
      if (this.textures.exists('sanctuary-bg')) {
          const texture = this.textures.get('sanctuary-bg');
          const frame = texture.getSourceImage();
          const imgWidth = frame.width;
          const imgHeight = frame.height;
          
          // Escala para "cover" + margem extra para parallax
          const scaleX = gameWidth / imgWidth;
          const scaleY = gameHeight / imgHeight;
          const scale = Math.max(scaleX, scaleY) * 1.15; // 15% extra para movimento
          
          this.backgroundImage = this.add.image(
              gameWidth / 2, 
              gameHeight / 2, 
              'sanctuary-bg'
          );
          this.backgroundImage.setScale(scale);
          this.backgroundImage.setDepth(-99);
          this.backgroundImage.setAlpha(0.9);
          
          // Salva posição original para parallax
          this.bgOriginalPos = { x: gameWidth / 2, y: gameHeight / 2 };
          
          console.log(`[SanctuaryScene] Background carregado: ${imgWidth}x${imgHeight}, scale: ${scale.toFixed(2)}`);
      } else {
          console.warn('[SanctuaryScene] Background não encontrado, usando fallback');
          fallbackBg.lineStyle(1, 0x1a0f20, 0.3);
          for (let y = 0; y < gameHeight; y += 40) {
              for (let x = 0; x < gameWidth; x += 40) {
                  fallbackBg.strokeRect(x, y, 40, 40);
              }
          }
      }
      
      // Layer 2: Vignette escura nas bordas
      this._createVignette(gameWidth, gameHeight);
      
      // Layer 3: Névoa sutil no chão
      this._createFog(gameWidth, gameHeight);
      
      // Layer 4: Partículas de energia (estilo SNES)
      this._createEnergyParticles(gameWidth, gameHeight);
      
      // Layer 5: Overlay de efeitos CSS (scanlines, glow)
      this._createCRTOverlay();
      
      // ═══ SISTEMA DE ANIMAÇÃO DO BACKGROUND ═══
      this._initBackgroundAnimation(gameWidth, gameHeight);
  }
  
  /**
   * Cria vignette com gradiente radial
   */
  _createVignette(gameWidth, gameHeight) {
      const vignette = this.add.graphics();
      vignette.setDepth(-98);
      
      const cx = gameWidth / 2;
      const cy = gameHeight / 2;
      const maxRadius = Math.sqrt(cx * cx + cy * cy);
      
      for (let i = 20; i > 0; i--) {
          const radius = (maxRadius / 20) * i;
          const alpha = (20 - i) * 0.018;
          vignette.fillStyle(0x000000, alpha);
          vignette.fillEllipse(cx, cy, radius * 2.2, radius * 1.8);
      }
  }
  
  /**
   * Cria névoa no chão com animação
   */
  _createFog(gameWidth, gameHeight) {
      this.fogLayers = [];
      const fogHeight = gameHeight * 0.35;
      
      // Múltiplas camadas de névoa para efeito de profundidade
      for (let layer = 0; layer < 3; layer++) {
          const fog = this.add.graphics();
          fog.setDepth(-97 + layer * 0.1);
          
          const baseAlpha = 0.12 - (layer * 0.03);
          const yOffset = layer * 20;
          
          for (let i = 0; i < 8; i++) {
              const y = gameHeight - fogHeight + (fogHeight / 8) * i + yOffset;
              const alpha = baseAlpha - (i * 0.012);
              fog.fillStyle(0x1a0820, Math.max(0, alpha));
              fog.fillRect(0, y, gameWidth, fogHeight / 8);
          }
          
          this.fogLayers.push({
              graphics: fog,
              baseX: 0,
              speed: 0.1 + layer * 0.05,
              amplitude: 3 + layer * 2
          });
      }
  }
  
  /**
   * Cria partículas de energia flutuante (SNES magic particles)
   * REDUZIDO para dar destaque aos Golems
   */
  _createEnergyParticles(gameWidth, gameHeight) {
      this.energyParticles = [];
      const numParticles = 18; // Reduzido de 40 para não competir com Golems
      
      // Cores sutis, desaturadas para não competir com Golems
      const subtleColors = [
          0x4a3060, // Roxo escuro
          0x304050, // Azul escuro
          0x403050, // Índigo
          0x503040, // Magenta escuro
          0x305040, // Verde escuro
          0x504030, // Âmbar escuro
      ];
      
      for (let i = 0; i < numParticles; i++) {
          const particle = this.add.graphics();
          particle.setDepth(-95);
          
          const size = 1 + Math.random() * 1.5; // Menores
          const color = Phaser.Math.RND.pick(subtleColors);
          const alpha = 0.15 + Math.random() * 0.2; // Mais sutis
          
          // Desenha partícula simples (sem glow forte)
          particle.fillStyle(color, alpha);
          particle.fillCircle(0, 0, size);
          
          // Halo externo muito sutil
          particle.fillStyle(color, alpha * 0.15);
          particle.fillCircle(0, 0, size * 1.5);
          
          particle.x = Math.random() * gameWidth;
          particle.y = Math.random() * gameHeight;
          
          this.energyParticles.push({
              graphics: particle,
              baseX: particle.x,
              baseY: particle.y,
              speedX: (Math.random() - 0.5) * 0.5,
              speedY: -0.2 - Math.random() * 0.3, // Sobe lentamente
              amplitude: 15 + Math.random() * 25,
              phase: Math.random() * Math.PI * 2,
              pulseSpeed: 1 + Math.random() * 2,
              color: color,
              maxY: gameHeight
          });
      }
  }
  
  /**
   * Cria overlay CSS com efeitos CRT (scanlines, glow, flicker)
   */
  _createCRTOverlay() {
      // Remove overlay existente se houver
      const existing = document.getElementById('sanctuary-crt-overlay');
      if (existing) existing.remove();
      
      // Container do overlay
      const overlay = document.createElement('div');
      overlay.id = 'sanctuary-crt-overlay';
      overlay.innerHTML = `
          <div class="scanlines"></div>
          <div class="glow-pulse"></div>
          <div class="vhs-noise"></div>
      `;
      
      // Estilos do overlay
      const style = document.createElement('style');
      style.id = 'sanctuary-crt-styles';
      style.textContent = `
          #sanctuary-crt-overlay {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              pointer-events: none;
              z-index: 5;
              overflow: hidden;
          }
          
          /* ═══ SCANLINES ANIMADAS (sutis para não competir com Golems) ═══ */
          .scanlines {
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              background: repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  transparent 3px,
                  rgba(0, 0, 0, 0.06) 3px,
                  rgba(0, 0, 0, 0.06) 6px
              );
              animation: scanline-scroll 12s linear infinite;
          }
          
          @keyframes scanline-scroll {
              0% { background-position: 0 0; }
              100% { background-position: 0 100px; }
          }
          
          /* ═══ GLOW PULSE (muito sutil - Golems são protagonistas) ═══ */
          .glow-pulse {
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              background: radial-gradient(
                  ellipse at center,
                  transparent 50%,
                  rgba(138, 43, 226, 0.015) 75%,
                  rgba(75, 0, 130, 0.025) 100%
              );
              animation: glow-breathe 8s ease-in-out infinite;
          }
          
          @keyframes glow-breathe {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.01); }
          }
          
          /* ═══ VHS NOISE (quase invisível) ═══ */
          .vhs-noise {
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              opacity: 0.008;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
              animation: noise-flicker 0.1s steps(5) infinite;
          }
          
          @keyframes noise-flicker {
              0% { transform: translate(0, 0); }
              25% { transform: translate(-1px, 1px); }
              50% { transform: translate(1px, -1px); }
              75% { transform: translate(-1px, -1px); }
              100% { transform: translate(1px, 1px); }
          }
          
          /* ═══ OCCASIONAL GLITCH (raro) ═══ */
          @keyframes rare-glitch {
              0%, 99% { clip-path: none; filter: none; }
              99.5% { 
                  clip-path: inset(20% 0 30% 0); 
                  filter: hue-rotate(90deg);
              }
              100% { clip-path: none; filter: none; }
          }
      `;
      
      // Remove estilo antigo se existir
      const oldStyle = document.getElementById('sanctuary-crt-styles');
      if (oldStyle) oldStyle.remove();
      
      document.head.appendChild(style);
      document.body.appendChild(overlay);
      
      this.crtOverlay = overlay;
  }
  
  /**
   * Inicializa sistema de animação do background
   */
  _initBackgroundAnimation(gameWidth, gameHeight) {
      // Timer principal de animação (60fps)
      this.bgAnimTime = 0;
      
      this.time.addEvent({
          delay: 16, // ~60fps
          callback: () => this._updateBackgroundEffects(gameWidth, gameHeight),
          loop: true
      });
      
      // Timer de color cycling (bem lento para não distrair)
      this.colorCycleIndex = 0;
      this.time.addEvent({
          delay: 500, // Ciclo de cor a cada 500ms (mais lento)
          callback: () => this._updateColorCycling(),
          loop: true
      });
      
      // Timer de parallax (vinculado ao movimento do mouse/câmera)
      this.input.on('pointermove', (pointer) => {
          this._updateParallax(pointer, gameWidth, gameHeight);
      });
  }
  
  /**
   * Atualiza efeitos do background (chamado a cada frame)
   */
  _updateBackgroundEffects(gameWidth, gameHeight) {
      this.bgAnimTime += 0.016;
      const time = this.bgAnimTime;
      
      // ═══ PARALLAX BREATHING (background "respira") ═══
      if (this.backgroundImage && this.bgOriginalPos) {
          const breatheX = Math.sin(time * 0.3) * 2;
          const breatheY = Math.cos(time * 0.2) * 1.5;
          this.backgroundImage.x = this.bgOriginalPos.x + breatheX;
          this.backgroundImage.y = this.bgOriginalPos.y + breatheY;
      }
      
      // ═══ FOG DRIFT (névoa se move) ═══
      if (this.fogLayers) {
          for (const fog of this.fogLayers) {
              const drift = Math.sin(time * fog.speed) * fog.amplitude;
              fog.graphics.x = fog.baseX + drift;
          }
      }
      
      // ═══ ENERGY PARTICLES (partículas mágicas) ═══
      if (this.energyParticles) {
          for (const p of this.energyParticles) {
              // Movimento senoidal horizontal
              p.graphics.x = p.baseX + Math.sin(time * 0.5 + p.phase) * p.amplitude;
              
              // Sobe lentamente
              p.baseY += p.speedY;
              p.graphics.y = p.baseY + Math.cos(time * 0.3 + p.phase) * 5;
              
              // Pulso de alpha (pisca suavemente)
              const pulse = 0.5 + Math.sin(time * p.pulseSpeed + p.phase) * 0.5;
              p.graphics.setAlpha(0.2 + pulse * 0.5);
              
              // Wrap around quando sai da tela
              if (p.baseY < -20) {
                  p.baseY = p.maxY + 20;
                  p.baseX = Math.random() * gameWidth;
              }
          }
      }
  }
  
  /**
   * Color cycling - técnica clássica SNES (sutil)
   */
  _updateColorCycling() {
      if (!this.energyParticles) return;
      
      this.colorCycleIndex = (this.colorCycleIndex + 1) % 6;
      
      // Cores sutis que não competem com Golems
      const subtleColors = [
          0x4a3060, 0x304050, 0x403050, 
          0x503040, 0x305040, 0x504030
      ];
      
      for (let i = 0; i < this.energyParticles.length; i++) {
          // Apenas 30% das partículas fazem cycling
          if (i % 3 === 0) {
              const p = this.energyParticles[i];
              const newColorIndex = (this.colorCycleIndex + i) % subtleColors.length;
              p.color = subtleColors[newColorIndex];
              
              // Redesenha com nova cor
              p.graphics.clear();
              const size = 1 + (i % 3);
              const alpha = 0.3 + (i % 5) * 0.1;
              
              p.graphics.fillStyle(p.color, alpha);
              p.graphics.fillCircle(0, 0, size);
              p.graphics.fillStyle(p.color, alpha * 0.3);
              p.graphics.fillCircle(0, 0, size * 2);
          }
      }
  }
  
  /**
   * Parallax baseado na posição do mouse
   */
  _updateParallax(pointer, gameWidth, gameHeight) {
      if (!this.backgroundImage || !this.bgOriginalPos) return;
      
      // Calcula offset baseado na posição do mouse (efeito parallax sutil)
      const centerX = gameWidth / 2;
      const centerY = gameHeight / 2;
      
      const offsetX = (pointer.x - centerX) / centerX; // -1 a 1
      const offsetY = (pointer.y - centerY) / centerY; // -1 a 1
      
      // Movimento parallax suave (máximo 15px)
      const parallaxStrength = 15;
      this.bgOriginalPos.x = centerX - (offsetX * parallaxStrength);
      this.bgOriginalPos.y = centerY - (offsetY * parallaxStrength * 0.5);
  }
  
  /**
   * Cleanup do overlay CRT ao sair da cena
   */
  shutdown() {
      // Remove overlay CSS
      const overlay = document.getElementById('sanctuary-crt-overlay');
      if (overlay) overlay.remove();
      
      const style = document.getElementById('sanctuary-crt-styles');
      if (style) style.remove();
  }
}