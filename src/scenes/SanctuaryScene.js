import Phaser from 'phaser';
import Golem from '../entities/Golem.js';
import { breedGolemData } from '../services/MockAiService.js';

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
        }
        
        // ═══ INICIA TUTORIAL SE FOR NOVO JOGO ═══
        if (this.isNewGame) {
            console.log('[SanctuaryScene] Novo jogo detectado - iniciando tutorial...');
            // Pequeno delay para garantir que a UI está pronta
            this.time.delayedCall(300, () => {
                this.game.events.emit('start-tutorial');
            });
        }
        
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
        this.threatPosition = { x: data.x, y: data.y };
        
        // Verifica se há Golem sob o cursor para Target Lock
        if (this.golemsGroup) {
            const golems = this.golemsGroup.getChildren();
            let foundTarget = null;
            
            for (const golem of golems) {
                if (!golem.active) continue;
                const dist = Phaser.Math.Distance.Between(golem.x, golem.y, data.x, data.y);
                if (dist < 60) {
                    foundTarget = golem;
                    break;
                }
            }
            
            if (foundTarget) {
                // Determina tipo de target lock
                let lockType = 'neutral';
                if (['kill', 'taser', 'burn'].includes(data.action)) lockType = 'hostile';
                if (['feed'].includes(data.action)) lockType = 'friendly';
                
                // Converte posição do jogo para tela
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const screenX = rect.left + (foundTarget.x / 800) * rect.width;
                    const screenY = rect.top + (foundTarget.y / 600) * rect.height;
                    
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

      // ═══ SINGULARITY - Afeta área, não precisa de alvo direto ═══
      if (action === 'singularity') {
          this.createSingularity(x, y);
          return;
      }

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

    // Overlay MUITO sutil - apenas um véu visual
    this.pauseOverlay = this.add.graphics();
    this.pauseOverlay.setDepth(50); // Abaixo dos Golems para não bloquear
    this.pauseOverlay.fillStyle(0x000000, 0.15); // Bem transparente
    this.pauseOverlay.fillRect(0, 0, 800, 600);

    // Ícone de pausa no canto (não centralizado para não atrapalhar)
    const pauseIcon = this.add.text(780, 20, '⏸', {
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
   */
  update(time, delta) {
      if (this.isPaused) return;
      
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
}