import Phaser from 'phaser';

export default class Golem extends Phaser.GameObjects.Container {
    constructor(scene, x, y, data) {
        super(scene, x, y);
        this.scene = scene;
        this.dataAttributes = data;
        this.isDragging = false;
        this.isFrozen = false;
        this.id = `golem_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        this.lifeLog = [];
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE PETTING (Interação Tátil)
        // ═══════════════════════════════════════════════════════════════════
        this.pettingActive = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.pettingVelocity = 0;
        this.pettingHistory = []; // Últimas 3 posições para detectar scrubbing
        
        this.lifePhase = 'child';
        this.currentScale = 0.5;
        this.isAdult = false;
        this.hasSpokenGrowth = false;
        this.hasSpokenDying = false;
        
        const stats = data.aiData ? data.aiData.stats : {};
        
        this.age = 0;
        this.maxLifespan = stats.lifespan || 80000; 
        
        // Vitalidade = barra de vida/fome (drena com tempo, restaura com alimentação)
        // maxVitality é independente de maxLifespan - representa a "fome" máxima
        // Valor alto para que a barra drene de forma visível mas não mate muito rápido
        this.maxVitality = 50000; // 50 segundos de vida sem alimentação
        this.vitality = this.maxVitality;
        
        this.maxLife = this.maxVitality;
        this.currentLife = this.vitality;
        
        this.targetScaleX = stats.scaleX ? parseFloat(stats.scaleX) : (stats.scale ? parseFloat(stats.scale) : 1);
        this.targetScaleY = stats.scaleY ? parseFloat(stats.scaleY) : (stats.scale ? parseFloat(stats.scale) : 1);
        this.targetScale = (this.targetScaleX + this.targetScaleY) / 2;
        
        this.setScale(this.targetScaleX, this.targetScaleY);

        const PHYSICS_COLORS = {
            'eletricidade': 0xffea00,
            'calor':        0xff4d00,
            'radiacao':     0x00ff00,
            'gravidade':    0x9d00ff,
            'luz':          0xffffff,
            'frio':         0x0088ff,
            'magnetismo':   0xff00aa,
            'entropia':     0xff3366,
            'sonico':       0x00ffaa
        };
        
        // Cores dos olhos/rosto baseadas na QUÍMICA (mais personalidade!)
        const CHEMISTRY_FACE_COLORS = {
            'carbono':   0x00ff88,   // Verde orgânico
            'ferro':     0xff6b35,   // Laranja ferrugem
            'silicio':   0x00d4ff,   // Azul digital
            'ouro':      0xffd700,   // Dourado
            'cristal':   0xff00ff,   // Magenta cristalino
            'mercurio':  0xc0c0c0,   // Prata líquido
            'bismuto':   0xff69b4,   // Rosa iridescente
            'uranio':    0x39ff14    // Verde radioativo
        };
        
        const fallbackColor = (data && data.fisica) 
            ? (PHYSICS_COLORS[data.fisica.id] || 0x00ffff) 
            : 0x00ffff;
        
        // Cor do rosto/olhos vem da química
        const faceColor = (data && data.quimica)
            ? (CHEMISTRY_FACE_COLORS[data.quimica.id] || 0x00ffff)
            : 0x00ffff;
        
        this.visualDNA = {
            bodyColor: data?.visualDNA?.bodyColor || fallbackColor,
            detailColor: data?.visualDNA?.detailColor || faceColor,  // Rosto usa cor da química!
            auraColor: data?.visualDNA?.auraColor || fallbackColor,
            eyeColor: data?.visualDNA?.eyeColor || faceColor,        // Cor específica dos olhos
            eyeJitter: data?.visualDNA?.eyeJitter || 1,
            blinkRate: data?.visualDNA?.blinkRate || 1,
            lineWidth: data?.visualDNA?.lineWidth || 2,
            faceGenes: data?.visualDNA?.faceGenes || this.generateFaceGenes(data?.quimica?.id),
            asymmetry: (Math.random() - 0.5) * 0.15 // Personalidade assimétrica
        };
        
        const neonColor = this.visualDNA.bodyColor;

        this.graphics = scene.add.graphics();
        
        const shapeData = data.forma || data.biologia;
        this.currentShapeType = shapeData ? shapeData.id : 'quadrado';
        this.proceduralParams = shapeData ? shapeData.params : null;
        
        this.currentColor = neonColor;
        this.currentChem = data.quimica ? data.quimica.id : 'carbono';
        this.currentPhysics = data.fisica ? data.fisica.id : 'luz';

        this.faceGraphics = scene.add.graphics();
        this.expressionState = {
            mood: 'happy',
            action: null,
            actionTimer: 0
        };
        
        this.faceParams = {
            browAngle: 0,
            browY: -12,
            eyeOpenness: 1,
            mouthCurve: 0.5,
            pupilSize: 1,
            focusOffset: { x: 0, y: 0 },
            tremor: 0,
            breathY: 0
        };

        this.eyeOffset = { x: 0, y: 0 };
        this.blinkTimer = 0;
        this.isBlinking = false;

        const minFaceScale = 0.6;
        const rawFaceScale = 1 / this.targetScale;
        this.faceScale = Math.max(rawFaceScale, minFaceScale / this.targetScale);
        this.minLineWidth = Math.max(1.5, 2 / this.targetScale);

        this.alchemyMeta = data?.alchemyMeta || null;
        this.isAnomaly = this.alchemyMeta?.isAnomaly || false;
        this.glitchIntensity = this.alchemyMeta?.glitchIntensity || 0;
        this.stability = this.alchemyMeta?.stability || 1.0;
        this.glitchTimer = 0;
        this.glitchOffset = { x: 0, y: 0 };

        this.speechBubble = null;
        this.speechText = null;
        this.isSpeaking = false;
        this.speechQueue = [];
        
        this.audioContext = null;
        this.masterGain = null;

        this.instincts = {
            active: false,
            state: null,
            intensity: 0,
            targetPos: null,
            steeringForce: { x: 0, y: 0 },
            tremor: { x: 0, y: 0 },
            lastUpdate: 0
        };

        // Eating/feeding visual state and timers
        this.isBeingFed = false;
        this.eatingChew = 0; // 0..1 phase driven by tween for chew motion
        this.eatingTween = null; // tween for mouth movement during feeding
        this.chewMouthTween = null; // tween for mouth curvature while chewing
        this.eatingAudioEvent = null; // repeated munch sound while feeding
        this.munchEmitter = null; // particle emitter for crumbs
        this.feedCooldown = 0; // Proteção temporária contra decay após alimentar
        
        // Fire state
        this.isOnFire = false;
        this.isPanicking = false;
        this.fireEmitter = null;
        this.smokeEmitter = null;
        this.fireDamageEvent = null;
        this.panicEvent = null;
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE AUTONOMIA - Comportamento emergente
        // ═══════════════════════════════════════════════════════════════════
        this.autonomy = {
            lastDecisionTime: 0,
            decisionInterval: 2000, // Sincronizado com roaming timer
            state: 'idle', // idle, courting, combat, fleeing
            target: null,  // Golem alvo (para combate ou cortejo)
            cooldowns: {
                breeding: 0,      // Cooldown pessoal de reprodução
                combat: 0,        // Cooldown de combate
                socialSpeak: 0    // Cooldown de fala autônoma
            },
            aggression: 0.5, // Será calculado após setup
            attractiveness: 0.5, // Será calculado após setup
            // Limite simples de reprodução por indivíduo para evitar overpopulation
            maxBreeds: 2 + Math.floor(Math.random() * 3), // 2-4 vezes (variação genética)
            breedCount: 0,
            // Vitalidade (percentual) dentro do qual o Golem consegue reproduzir
            // Golems muito cheios (recém-nascidos) ou muito fracos (idosos) NÃO se reproduzem
            breedVitalityRange: { min: 0.2, max: 0.9 }
        };
        
        // Calcula após inicialização para evitar erros
        this.scene.time.delayedCall(100, () => {
            if (this.active) {
                this.autonomy.aggression = this.calculateAggression();
                this.autonomy.attractiveness = this.calculateAttractiveness();
            }
        });
        
        // Cooldown global de reprodução para evitar superpopulação
        if (!this.scene.globalBreedingCooldown) {
            this.scene.globalBreedingCooldown = 0;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // ASSINATURA VOCAL - Pitch único por Golem
        // ═══════════════════════════════════════════════════════════════════
        this.voiceSignature = this.generateVoiceSignature();
        
        // Probabilidade de falar (0-100). Pode ser definida via data.aiData.talkativeness ou gerada aleatoriamente no nascimento.
        this.talkativeness = (data?.aiData?.talkativeness != null)
            ? Phaser.Math.Clamp(Number(data.aiData.talkativeness), 0, 100)
            : Math.floor(Math.random() * 101);

        // ═══════════════════════════════════════════════════════════════════
        // LIP SYNC - Animação de boca durante fala
        // ═══════════════════════════════════════════════════════════════════
        this.lipSyncPhase = 0;
        this.lipSyncSpeed = 0.3 + Math.random() * 0.2;
        
        this.INSTINCT_RADIUS = 200;
        this.MAX_STEERING_FORCE = 150;
        this.SEPARATION_RADIUS = 80;
        this.SEPARATION_FORCE = 60;

        this.drawNeonShape(this.currentShapeType, this.currentColor, this.currentChem);
        this.drawFace();
        this.add(this.graphics);
        this.add(this.faceGraphics);

        this.pulseTween = scene.tweens.add({
            targets: this.graphics,
            scaleX: 1.05, scaleY: 1.05, alpha: 0.9,
            duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        this.expressionTimer = scene.time.addEvent({
            delay: 50, loop: true,
            callback: () => this.updateExpression()
        });

        this.setActionExpression('born', 2000);
        scene.time.delayedCall(500, () => this.speakContextual('born'));

        const nameStr = (data.aiData) ? data.aiData.name.split(' ')[0] : "GLIFO";
        const nameTag = scene.add.text(0, -60, nameStr, {
            fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ffffff', 
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
        nameTag.setScale(1 / this.targetScale);

        const barBg = scene.add.rectangle(0, -50, 24, 4, 0x000000);
        this.lifeBar = scene.add.rectangle(0, -50, 22, 2, neonColor);
        this.add([nameTag, barBg, this.lifeBar]);

        try {
            const bornMsg = `Nasceu: ${nameTag.text} (${this.currentShapeType})`;
            this.lifeLog.push({ ts: Date.now(), type: 'born', detail: bornMsg });
            if (!this.scene.golemRecords) this.scene.golemRecords = [];
            this.scene.golemRecords.push({ 
                id: this.id, 
                name: nameTag.text, 
                forma: data.forma || null, 
                quimica: data.quimica || null, 
                fisica: data.fisica || null, 
                parents: data.parents || null, 
                bornAt: Date.now(), 
                lifeLog: this.lifeLog,
                stats: data.aiData ? data.aiData.stats : {} 
            });
            this.scene.game.events.emit('update-tree', this.scene.golemRecords);
        } catch (e) { console.warn('life record error', e); }

        this.emitter = scene.add.particles(0, 0, 'pixel', {
            speed: 20 * this.targetScale, 
            scale: { start: 0.4 * this.targetScale, end: 0 }, 
            blendMode: 'ADD', lifespan: 600, tint: neonColor, quantity: 1
        });
        this.emitter.startFollow(this);

        // Tamanho do hitbox baseado na escala real do golem (raio base = 28)
        const hitboxSize = Math.max(50, 60 * this.targetScale);
        this.setSize(hitboxSize, hitboxSize);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        if (!scene.golemsGroup) scene.golemsGroup = scene.add.group();
        scene.golemsGroup.add(this);

        if (this.body) {
            // Ajusta o body de física para o tamanho correto (colisão precisa)
            this.body.setSize(hitboxSize, hitboxSize);
            this.body.setOffset(-hitboxSize / 2, -hitboxSize / 2);
            this.body.setCollideWorldBounds(true);
            this.body.setBounce(1);
            
            // Aumenta MUITO a área de clique para facilitar no mobile (Forgiving UI)
            // interactionRadius = 1.6x maior que o raio visual
            const interactionRadius = (hitboxSize / 2) * 1.6;
            this.setInteractive({
                hitArea: new Phaser.Geom.Circle(0, 0, interactionRadius),
                hitAreaCallback: Phaser.Geom.Circle.Contains,
                useHandCursor: true
            });
            scene.input.setDraggable(this);
            
            // DEBUG: Visualizar hitbox de interação (descomente para debug)
            // this.scene.input.enableDebug(this);

            // Velocidade base mais lenta para melhor UX (mais fácil de acertar)
            this.baseSpeed = 35 / this.targetScale;
            // Eletricidade ainda é mais rápido, mas não excessivamente
            if (data.fisica && data.fisica.id === 'eletricidade') this.baseSpeed *= 1.3;
            // Gravidade é mais lento
            if (data.fisica && data.fisica.id === 'gravidade') this.baseSpeed *= 0.7;
            // Frio também mais lento
            if (data.fisica && data.fisica.id === 'frio') this.baseSpeed *= 0.8;

            this.startRoaming();
            this.startLifeCycle();

            this.on('pointerover', () => {
                if (!this.isDragging) {
                    scene.selectedGolem = this;
                    scene.game.events.emit('inspect-golem', { 
                        visual: this.dataAttributes, 
                        stats: data.aiData, 
                        lifeLog: this.lifeLog,
                        liveData: {
                            currentScaleX: this.currentScale || this.targetScale,
                            currentScaleY: this.currentScale || this.targetScale,
                            lifePhase: this.lifePhase,
                            age: this.age,
                            maxLifespan: this.maxLifespan,
                            vitality: this.vitality,
                            maxVitality: this.maxVitality,
                            golemRef: this
                        }
                    });
                    this.graphics.alpha = 1;
                }
            });
            this.on('pointerout', () => { scene.game.events.emit('hide-inspect'); this.graphics.scale = 1; });
            
            this.pokeStartTime = 0;
            // Rotation / press gesture state
            this.isPointerDown = false;
            this.rotationPending = false; // will be true after a short hold
            this.isRotating = false; // true while actively rotating
            this.pointerDownDelayedCall = null;
            this.rotationStartAngle = 0;
            this.rotationAnchorAngle = 0;
            this.targetRotation = this.rotation || 0;
            this.pointerDownStart = null;

            this.on('pointerdown', (pointer) => {
                this.pokeStartTime = Date.now();
                this.isPointerDown = true;
                this.pointerDownStart = { x: pointer.worldX, y: pointer.worldY };

                // Se segura por mais que 160ms sem iniciar drag, entra em modo de rotação
                try { if (this.pointerDownDelayedCall) this.pointerDownDelayedCall.remove(); } catch(e) {}
                this.pointerDownDelayedCall = scene.time.delayedCall(160, () => {
                    if (!this.isDragging) {
                        this.rotationPending = true;
                        // Inicializa estado de rotação baseada no ângulo atual do ponteiro
                        const anchor = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
                        this.lastPointerAngle = anchor; // usado para calcular deltas incrementais
                        this.targetRotation = this.rotation; // mantém a rotação atual como base
                        // Visual feedback: cara de tonto durante rotação
                        this.setActionExpression('dizzy', 800);
                    }
                });
            });
            this.on('pointerup', (pointer) => {
                const clickDuration = Date.now() - this.pokeStartTime;
                // Cleanup delayed call
                try { if (this.pointerDownDelayedCall) { this.pointerDownDelayedCall.remove(); this.pointerDownDelayedCall = null; } } catch(e) {}

                // If rotation was pending/active, finish rotation (no poke sound)
                if (this.rotationPending || this.isRotating) {
                    this.rotationPending = false;
                    this.isRotating = false;
                    this.lastPointerAngle = null;
                    // small wobble to finish
                    this.scene.tweens.add({ targets: this, rotation: this.targetRotation, duration: 220, ease: 'Sine.easeOut' });
                    return;
                }

                if (clickDuration < 200 && !this.isDragging) {
                    this.speakContextual('poke');
                }
                this.isPointerDown = false;
            });
            
            this.on('dragstart', () => { 
                // Cancel any pending rotation when starting a drag (moving the golem)
                try { if (this.pointerDownDelayedCall) { this.pointerDownDelayedCall.remove(); this.pointerDownDelayedCall = null; } } catch(e) {}
                this.rotationPending = false;
                this.isPointerDown = false;

                this.isDragging = true; 
                this.body.setVelocity(0); 
                this.alpha = 0.6; 
                this.pettingActive = true;
                this.pettingHistory = [];
                scene.game.events.emit('hide-inspect');

                // Drag trail: remember origin and create graphics
                try {
                    this._dragOrigin = { x: this.x, y: this.y };
                    if (this.dragTrail) { try { this.dragTrail.destroy(); } catch(e) {} }
                    this.dragTrail = this.scene.add.graphics();
                    this.dragTrail.setDepth(1200);
                    this._dragTrailColor = 'red';
                    this._dragTrailPulse = 0;
                } catch (e) { console.warn('drag trail init error', e); }
            });
            this.on('drag', (p, x, y) => { 
                this.x = x; 
                this.y = y;
                
                // ═══════════════════════════════════════════════════════════════════
                // DETECÇÃO DE PETTING (Scrubbing rápido)
                // ═══════════════════════════════════════════════════════════════════
                const currentPos = { x, y };
                this.pettingHistory.push(currentPos);
                if (this.pettingHistory.length > 3) this.pettingHistory.shift();
                
                // Se tem histórico suficiente, calcula velocidade
                if (this.pettingHistory.length >= 2) {
                    const prev = this.pettingHistory[this.pettingHistory.length - 2];
                    const dx = currentPos.x - prev.x;
                    const dy = currentPos.y - prev.y;
                    this.pettingVelocity = Math.sqrt(dx*dx + dy*dy);
                    
                    // Petting rápido = fechar olhos e emitir corações
                    if (this.pettingVelocity > 8) {
                        this.isBlinking = true;
                        
                        // Emite corações
                        if (Math.random() < 0.3) {
                            this.emitHearts();
                        }
                    }
                }

                // ═══════════════════════════════════════════════════════════════════
                // DRAG TRAIL: atualização visual e validação de destino (verde = vai fundir)
                // ═══════════════════════════════════════════════════════════════════
                try {
                    if (this.dragTrail && this._dragOrigin) {
                        // Procura parceiro compatível e próximo
                        const others = this.scene.golemsGroup?.getChildren() || [];
                        let willFuse = false;
                        let closestMate = null;
                        let bestDist = Infinity;
                        const breedDist = 80 * Math.max(this.targetScale, 0.5);
                        for (const other of others) {
                            if (other === this || !other.active) continue;
                            const dist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
                            if (dist < bestDist) { bestDist = dist; closestMate = other; }
                            // Check compatibility quickly
                            if (dist <= breedDist && this.isCompatibleForBreeding(other)) {
                                willFuse = true; break;
                            }
                        }

                        this._dragTrailColor = willFuse ? 'green' : 'red';
                        this._updateDragTrail();
                    }
                } catch (e) { console.warn('drag trail update error', e); }
            });
            this.on('dragend', () => {
                this.isDragging = false; 
                this.alpha = 1;
                this.pettingActive = false;
                this.isBlinking = false;
                
                const others = scene.golemsGroup.getChildren();
                let mated = false;
                for (let other of others) {
                    if (other !== this && other.active && Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y) < (60 * this.targetScale)) {
                         scene.triggerBreeding(this, other); mated = true; break;
                    }
                }

                // If not mated, do a playful slingshot back to origin instead of teleporting
                try {
                    if (!mated && this._dragOrigin) {
                        // perform slingshot return (handles trail cleanup and sounds)
                        this.slingBackToOrigin(this._dragOrigin.x, this._dragOrigin.y);
                    } else {
                        // Fallback: still play an 'oops' if it was an invalid drop at least
                        if (!mated && this._dragTrailColor === 'red') {
                            this.playOopsSound();
                        }
                        // Cleanup trail gracefully
                        if (this.dragTrail) {
                            const g = this.dragTrail;
                            this.scene.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => { try { g.destroy(); } catch(e) {} } });
                            this.dragTrail = null;
                        }
                        if (!mated) this.startRoaming();
                    }
                } catch (e) {
                    console.warn('slingshot error', e);
                    if (!mated) this.startRoaming();
                }
            });

            // Pointer move handler (scene-level) - supports rotation even if pointer leaves the golem
            this._pointerMoveHandler = (pointer) => {
                if (!this.active || this.scene.isPaused) return;
                if (!pointer.isDown) return;
                if (!this.rotationPending) return;

                // Begin active rotating state
                this.isRotating = true;

                // Calcula ângulo atual e delta incremental desde o último movimento
                const newAngle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
                let last = (typeof this.lastPointerAngle === 'number') ? this.lastPointerAngle : newAngle;
                let delta = Phaser.Math.Angle.Wrap(newAngle - last);

                // Limita delta por frame para evitar saltos grandes
                const MAX_DELTA = 0.6; // radianos (~34°) por evento
                delta = Phaser.Math.Clamp(delta, -MAX_DELTA, MAX_DELTA);

                // Aplica rotação incremental diretamente na targetRotation
                this.targetRotation = Phaser.Math.Angle.Wrap((typeof this.targetRotation === 'number' ? this.targetRotation : this.rotation) + delta);

                // Atualiza o último ângulo do ponteiro
                this.lastPointerAngle = newAngle;

                // Refresh dizzy expression while rotating
                this.setActionExpression('dizzy', 600);
            };
            scene.input.on('pointermove', this._pointerMoveHandler);

            // Smoothly interpolate rotation towards target on each frame
            this._rotationUpdate = (time, dt) => {
                if (!this.active) return;
                if (typeof this.targetRotation !== 'number') return;
                // dt is ms; compute step as radians per frame
                const maxStep = 0.12 * (dt / 16);
                this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, this.targetRotation, maxStep);
            };
            scene.events.on('update', this._rotationUpdate);
            
            this.toolDragMoveHandler = (data) => {
                if (!this.active || this.isDragging) return;
                this.updateInstincts({ x: data.x, y: data.y }, data.action);
            };
            scene.game.events.on('tool-drag-move', this.toolDragMoveHandler);
            
            this.toolDragEndHandler = () => {
                this.clearInstincts();
            };
            scene.game.events.on('tool-drag-end', this.toolDragEndHandler);
            
            // ═══════════════════════════════════════════════════════════════════
            // SISTEMA DE RESPOSTA SOCIAL - Golems "ouvem" e respondem uns aos outros
            // ═══════════════════════════════════════════════════════════════════
            this.socialResponseCooldown = 0; // Cooldown para evitar spam de respostas
            this.SOCIAL_RESPONSE_RADIUS = 150; // Distância máxima para "ouvir"
            this.SOCIAL_RESPONSE_CHANCE = 0.08; // 8% de chance de responder (reduzido para melhor UX)
            
            this.golemSpokeHandler = (eventData) => {
                // Não responde a si mesmo
                if (eventData.golemId === this.id) return;
                
                // Verifica cooldown
                if (this.socialResponseCooldown > 0) return;
                
                // Não responde se estiver morto ou congelado
                if (!this.active || this.isFrozen || this.isDragging) return;
                
                // Não responde se já estiver falando
                if (this.isSpeaking || this.speechQueue.length > 0) return;
                
                // Calcula distância do falante
                const distance = Phaser.Math.Distance.Between(
                    this.x, this.y, 
                    eventData.x, eventData.y
                );
                
                // Só responde se estiver perto o suficiente
                if (distance > this.SOCIAL_RESPONSE_RADIUS) return;
                
                // Chance de responder (30%)
                if (Math.random() > this.SOCIAL_RESPONSE_CHANCE) return;
                
                // Responde com delay proporcional à distância (mais perto = resposta mais rápida)
                const responseDelay = 800 + (distance / this.SOCIAL_RESPONSE_RADIUS) * 700;
                
                scene.time.delayedCall(responseDelay, () => {
                    if (!this.active || this.isSpeaking) return;
                    
                    // Gera resposta social baseada na relação física
                    this.speakSocialResponse(eventData.physicsId);
                });
                
                // Ativa cooldown maior (10s) para evitar spam
                this.socialResponseCooldown = 10000;
                scene.time.delayedCall(10000, () => {
                    this.socialResponseCooldown = 0;
                });
            };
            scene.events.on('golem-spoke', this.golemSpokeHandler);
        }
    }

    updateInstincts(mousePos, activeTool) {
        if (!this.body || this.isFrozen || this.isDragging) return;
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, mousePos.x, mousePos.y);
        
        if (distance > this.INSTINCT_RADIUS) {
            if (this.instincts.active) this.clearInstincts();
            return;
        }
        
        this.instincts.active = true;
        this.instincts.targetPos = mousePos; // Salva alvo para os olhos
        this.instincts.activeTool = activeTool; // Salva ferramenta para emoção
        this.instincts.intensity = Math.pow(1 - (distance / this.INSTINCT_RADIUS), 1.5);
        
        let steeringX = 0, steeringY = 0;
        
        switch (activeTool) {
            case 'feed':
                this.instincts.state = 'seeking';
                const seekForce = this.calculateSeek(mousePos);
                steeringX = seekForce.x;
                steeringY = seekForce.y;

                // If the food/tool is very close, show a 'begging' expression, but don't actually chew until dropped
                const feedDist = Phaser.Math.Distance.Between(this.x, this.y, mousePos.x, mousePos.y);
                const FEED_ANIMATE_DIST = 72 * (this.targetScale || 1); // increase threshold for easier feeding
                const isNearFood = feedDist < (FEED_ANIMATE_DIST * 0.6);
                if (isNearFood) {
                    this.setActionExpression('begging', 1000);
                }
                break;
                
            case 'burn':
            case 'kill':
                this.instincts.state = 'fleeing';
                const fleeForce = this.calculateFlee(mousePos);
                steeringX = fleeForce.x * 1.5;
                steeringY = fleeForce.y * 1.5;
                this.instincts.tremor.x = (Math.random() - 0.5) * 6 * this.instincts.intensity;
                this.instincts.tremor.y = (Math.random() - 0.5) * 4 * this.instincts.intensity;
                break;
                
            case 'freeze':
                this.instincts.state = 'freezing';
                if (this.body.velocity) {
                    this.body.velocity.scale(0.92);
                }
                this.instincts.tremor.x = (Math.random() - 0.5) * 3 * this.instincts.intensity;
                this.instincts.tremor.y = (Math.random() - 0.5) * 2 * this.instincts.intensity;
                break;
                
            case 'mutate':
                this.instincts.state = 'curious';
                const curiousForce = this.calculateSeek(mousePos);
                steeringX = curiousForce.x * 0.5;
                steeringY = curiousForce.y * 0.5;
                break;
                
            default:
                return;
        }
        
        if (activeTool === 'feed') {
            const separation = this.calculateSeparation();
            steeringX += separation.x;
            steeringY += separation.y;
        }
        
        const magnitude = Math.sqrt(steeringX * steeringX + steeringY * steeringY);
        if (magnitude > this.MAX_STEERING_FORCE) {
            const scale = this.MAX_STEERING_FORCE / magnitude;
            steeringX *= scale;
            steeringY *= scale;
        }
        
        this.instincts.steeringForce.x = Phaser.Math.Linear(
            this.instincts.steeringForce.x, steeringX, 0.15
        );
        this.instincts.steeringForce.y = Phaser.Math.Linear(
            this.instincts.steeringForce.y, steeringY, 0.15
        );
        
        if (activeTool !== 'freeze') {
            const currentVX = this.body.velocity.x || 0;
            const currentVY = this.body.velocity.y || 0;
            this.body.setVelocity(
                currentVX + this.instincts.steeringForce.x * 0.1,
                currentVY + this.instincts.steeringForce.y * 0.1
            );
        }
        
        this.graphics.x = this.instincts.tremor.x;
        this.graphics.y = this.instincts.tremor.y;
        this.faceGraphics.x = this.instincts.tremor.x;
        this.faceGraphics.y = this.instincts.tremor.y;
    }

    calculateSeek(targetPos) {
        const dx = targetPos.x - this.x;
        const dy = targetPos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const desiredSpeed = this.baseSpeed * (1.5 + this.instincts.intensity);
        
        return {
            x: (dx / distance) * desiredSpeed,
            y: (dy / distance) * desiredSpeed
        };
    }

    calculateFlee(threatPos) {
        const dx = this.x - threatPos.x;
        const dy = this.y - threatPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Velocidade de fuga mais moderada para melhor UX (não muito rápido!)
        const fleeSpeed = this.baseSpeed * (1.2 + this.instincts.intensity * 0.8);
        // Menos erraticidade para ser mais previsível
        const erratic = (Math.random() - 0.5) * 0.2 * this.instincts.intensity;
        
        const angle = Math.atan2(dy, dx) + erratic;
        
        return {
            x: Math.cos(angle) * fleeSpeed,
            y: Math.sin(angle) * fleeSpeed
        };
    }

    calculateSeparation() {
        const others = this.scene.golemsGroup?.getChildren() || [];
        let separationX = 0, separationY = 0;
        let count = 0;
        
        for (const other of others) {
            if (other === this || !other.active) continue;
            
            const dist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
            
            if (dist < this.SEPARATION_RADIUS && dist > 0) {
                const pushStrength = (1 - dist / this.SEPARATION_RADIUS) * this.SEPARATION_FORCE;
                separationX += (this.x - other.x) / dist * pushStrength;
                separationY += (this.y - other.y) / dist * pushStrength;
                count++;
            }
        }
        
        if (count > 0) {
            separationX /= count;
            separationY /= count;
        }
        
        return { x: separationX, y: separationY };
    }

    /**
     * Gera genes faciais baseados na química do Golem
     * Cada química tem personalidade visual única (estilo 16-bit)
     */
    generateFaceGenes(chemId) {
        const CHEM_FACE_GENES = {
            'carbono':   { eyeType: 'circle', mouthType: 'simple', hasFreckles: false, hasScar: false },
            'ferro':     { eyeType: 'pixel', mouthType: 'stitch', hasFreckles: false, hasScar: true },
            'silicio':   { eyeType: 'visor', mouthType: 'digital', hasFreckles: false, hasScar: false },
            'ouro':      { eyeType: 'circle', mouthType: 'simple', hasFreckles: false, hasScar: false, hasSparkle: true },
            'cristal':   { eyeType: 'hollow', mouthType: 'void', hasFreckles: false, hasScar: false },
            'mercurio':  { eyeType: 'slit', mouthType: 'simple', hasFreckles: true, hasScar: false },
            'bismuto':   { eyeType: 'dot', mouthType: 'beak', hasFreckles: true, hasScar: false },
            'uranio':    { eyeType: 'circle', mouthType: 'void', hasFreckles: false, hasScar: false, hasGlow: true }
        };
        
        return CHEM_FACE_GENES[chemId] || { eyeType: 'circle', mouthType: 'simple', hasFreckles: false, hasScar: false };
    }

    clearInstincts() {
        if (!this.instincts.active) return;
        
        this.scene.tweens.add({
            targets: this.instincts,
            intensity: 0,
            duration: 300,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.instincts.active = false;
                this.instincts.state = null;
                this.instincts.tremor = { x: 0, y: 0 };
                this.instincts.steeringForce = { x: 0, y: 0 };
                this.instincts.targetPos = null;
                this.instincts.activeTool = null;
                
                this.graphics.x = 0;
                this.graphics.y = 0;
                this.faceGraphics.x = 0;
                this.faceGraphics.y = 0;

                // Stop any feeding/eating animations when instincts clear
                try { this.stopEatingAnimation(); } catch(e) { /* ignore */ }
            }
        });
    }

    // Helper: Desenha curvas quadráticas no Phaser Graphics usando linhas
    // Phaser Graphics não tem quadraticCurveTo nativo na API de contexto
    drawQuadCurve(g, x1, y1, cx, cy, x2, y2) {
        const segments = 12;
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const invT = 1 - t;
            // Equação de Bezier Quadrática: (1-t)²P0 + 2(1-t)tP1 + t²P2
            const px = (invT * invT * x1) + (2 * invT * t * cx) + (t * t * x2);
            const py = (invT * invT * y1) + (2 * invT * t * cy) + (t * t * y2);
            g.lineTo(px, py);
        }
    }

    drawNeonShape(type, color, chemType) {
        const g = this.graphics;
        g.clear();
        
        const bodyColor = this.visualDNA?.bodyColor || color;
        const auraColor = this.visualDNA?.auraColor || color;
        
        let effectiveBodyColor = bodyColor;
        if (chemType === 'ouro') {
            effectiveBodyColor = this.blendColors(bodyColor, 0xFFD700, 0.4);
        } else if (chemType === 'ferro') {
            effectiveBodyColor = this.blendColors(bodyColor, 0x8899AA, 0.2);
        }
        
        if (this.isAnomaly && this.glitchIntensity > 0) {
            this.drawAnomalyGlitch(g, type, effectiveBodyColor, auraColor, chemType);
            return;
        }
        
        let lineWidth = 1.5; 
        if (chemType === 'ferro') lineWidth = 2.5;
        else if (chemType === 'ouro') lineWidth = 2;
        else if (chemType === 'cristal') lineWidth = 1;
        else if (chemType === 'mercurio') lineWidth = 2;
        else if (chemType === 'silicio') lineWidth = 1.5;
        else if (chemType === 'uranio') lineWidth = 2;
        
        const drawCylinderPath = () => {
            g.beginPath();
            g.moveTo(-20, -25); g.lineTo(-20, 25);
            g.moveTo(20, -25); g.lineTo(20, 25);
            g.strokePath();
            g.strokeEllipse(0, -25, 40, 15);
            g.strokeEllipse(0, 25, 40, 15);
        };
        
        const drawConePath = () => {
            g.beginPath();
            g.moveTo(0, -35); g.lineTo(25, 25);
            g.moveTo(0, -35); g.lineTo(-25, 25);
            g.strokePath();
            g.strokeEllipse(0, 25, 50, 15);
        };
        
        if (type === 'cilindro') {
            g.fillStyle(effectiveBodyColor, 0.12);
            g.beginPath();
            g.moveTo(-20, -25); g.lineTo(20, -25); g.lineTo(20, 25); g.lineTo(-20, 25); g.closePath();
            g.fillPath();
            g.fillEllipse(0, -25, 40, 15);
            g.fillEllipse(0, 25, 40, 15);
            
            this.drawChemistryPattern(g, type, chemType, 25, effectiveBodyColor);

            const auraLayers = [
                { width: lineWidth + 14, alpha: 0.08 },
                { width: lineWidth + 10, alpha: 0.15 },
                { width: lineWidth + 6, alpha: 0.22 },
                { width: lineWidth + 3, alpha: 0.35 }
            ];
            
            for (const layer of auraLayers) {
                g.lineStyle(layer.width, auraColor, layer.alpha);
                drawCylinderPath();
            }
            
            g.lineStyle(lineWidth, effectiveBodyColor, 0.9);
            drawCylinderPath();
            return;
        }

        if (type === 'cone') {
            g.fillStyle(effectiveBodyColor, 0.12);
            g.beginPath();
            g.moveTo(0, -35); g.lineTo(25, 25); g.lineTo(-25, 25); g.closePath();
            g.fillPath();
            g.fillEllipse(0, 25, 50, 15);
            
            this.drawChemistryPattern(g, type, chemType, 25, effectiveBodyColor);

            const auraLayers = [
                { width: lineWidth + 14, alpha: 0.08 },
                { width: lineWidth + 10, alpha: 0.15 },
                { width: lineWidth + 6, alpha: 0.22 },
                { width: lineWidth + 3, alpha: 0.35 }
            ];
            
            for (const layer of auraLayers) {
                g.lineStyle(layer.width, auraColor, layer.alpha);
                drawConePath();
            }
            
            g.lineStyle(lineWidth, effectiveBodyColor, 0.9);
            drawConePath();
            return;
        }

        g.fillStyle(effectiveBodyColor, 0.12);
        this.drawPath(g, type);
        g.fillPath();
        
        this.drawChemistryPattern(g, type, chemType, 25, effectiveBodyColor);

        g.lineStyle(lineWidth + 12, auraColor, 0.08);
        this.drawPath(g, type);
        g.strokePath();
        
        g.lineStyle(lineWidth + 6, auraColor, 0.15);
        this.drawPath(g, type);
        g.strokePath();
        
        g.lineStyle(lineWidth + 3, auraColor, 0.25);
        this.drawPath(g, type);
        g.strokePath();

        g.lineStyle(lineWidth, effectiveBodyColor, 0.9);
        this.drawPath(g, type);
        g.strokePath();
        
        g.lineStyle(lineWidth * 0.5, 0xFFFFFF, 0.15);
        this.drawPath(g, type);
        g.strokePath();
    }

    drawPath(g, type) {
        g.beginPath();
        
        if (type === 'procedural' && this.proceduralParams) {
            const { sides, roughness, seed } = this.proceduralParams;
            const radius = 28;
            
            for (let i = 0; i <= sides; i++) {
                const angle = (i * (Math.PI * 2)) / sides;
                const noise = Math.sin(i * 123.45 + seed) * (radius * roughness);
                const r = radius + noise;
                
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                
                if (i === 0) g.moveTo(px, py);
                else g.lineTo(px, py);
            }
            g.closePath();
            return;
        }

        switch(type) {
            case 'circulo': g.arc(0, 0, 25, 0, Math.PI * 2); break;
            case 'quadrado': g.strokeRect(-22,-22,44,44); break;
            case 'triangulo': g.moveTo(0,-28); g.lineTo(24,18); g.lineTo(-24,18); g.closePath(); break;
            case 'pentagono': this.drawPolygon(g, 5, 26); break;
            case 'hexagono': this.drawPolygon(g, 6, 26); break;
            case 'losango': g.moveTo(0, -30); g.lineTo(20, 0); g.lineTo(0, 30); g.lineTo(-20, 0); g.closePath(); break;
            case 'cruz': 
                g.moveTo(-8,-24); g.lineTo(8,-24); g.lineTo(8,-8); g.lineTo(24,-8); g.lineTo(24,8); 
                g.lineTo(8,8); g.lineTo(8,24); g.lineTo(-8,24); g.lineTo(-8,8); g.lineTo(-24,8); 
                g.lineTo(-24,-8); g.lineTo(-8,-8); g.closePath(); break;
            
            case 'cilindro': g.moveTo(-20,-25); g.lineTo(-20,25); g.moveTo(20,-25); g.lineTo(20,25); g.strokeEllipse(0,-25,40,15); g.strokeEllipse(0,25,40,15); break;
            case 'cone': g.moveTo(0,-35); g.lineTo(25,25); g.moveTo(0,-35); g.lineTo(-25,25); g.strokeEllipse(0,25,50,15); break;
            case 'piramide': g.moveTo(0,-35); g.lineTo(30,20); g.lineTo(0,35); g.lineTo(-30,20); g.closePath(); g.moveTo(0,-35); g.lineTo(0,35); break;
            case 'obelisco': g.strokeRect(-15, -40, 30, 80); g.moveTo(-15, -40); g.lineTo(0, -55); g.lineTo(15, -40); break;
            case 'fractal': g.moveTo(0,-35); g.lineTo(30,25); g.lineTo(-30,25); g.closePath(); g.moveTo(0,25); g.lineTo(15,-5); g.lineTo(-15,-5); g.closePath(); break;
            case 'esfera': g.strokeCircle(0, 0, 28); g.strokeEllipse(0, 0, 56, 20); g.strokeEllipse(0, 0, 20, 56); break;
            case 'mira': g.strokeCircle(0, 0, 25); g.moveTo(0, -35); g.lineTo(0, 35); g.moveTo(-35, 0); g.lineTo(35, 0); break;
            case 'cristal': g.moveTo(0, -40); g.lineTo(20, 0); g.lineTo(0, 40); g.lineTo(-20, 0); g.closePath(); g.moveTo(0, -40); g.lineTo(0, 40); g.moveTo(-20, 0); g.lineTo(20, 0); break;
            
            case 'capsula': 
                g.arc(0, -20, 18, Math.PI, 0); 
                g.lineTo(18, 20);
                g.arc(0, 20, 18, 0, Math.PI); 
                g.lineTo(-18, -20);
                g.closePath();
                break;
            
            case 'domo':
                g.arc(0, 10, 28, Math.PI, 0); 
                g.lineTo(28, 25);
                g.lineTo(-28, 25);
                g.closePath();
                g.moveTo(-28, 10); g.lineTo(28, 10); 
                break;
            
            case 'monolito':
                g.strokeRect(-12, -45, 24, 90);
                g.moveTo(-8, -40); g.lineTo(-8, 40);
                g.moveTo(8, -40); g.lineTo(8, 40);
                g.moveTo(-12, -45); g.lineTo(0, -50); g.lineTo(12, -45);
                break;
            
            case 'tesseract':
                g.strokeRect(-25, -25, 50, 50);
                g.strokeRect(-15, -15, 30, 30);
                g.moveTo(-25, -25); g.lineTo(-15, -15);
                g.moveTo(25, -25); g.lineTo(15, -15);
                g.moveTo(-25, 25); g.lineTo(-15, 15);
                g.moveTo(25, 25); g.lineTo(15, 15);
                break;
            
            case 'estrela':
                for (let i = 0; i < 10; i++) {
                    const angle = (i * 36 - 90) * Math.PI / 180;
                    const r = i % 2 === 0 ? 28 : 12; 
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * r;
                    if (i === 0) g.moveTo(px, py);
                    else g.lineTo(px, py);
                }
                g.closePath();
                break;
            
            case 'espiral':
                const spiralTurns = 3;
                const spiralGrowth = 4;
                const spiralStart = 2;
                const spiralSteps = 80;
                const spiralThetaMax = spiralTurns * 2 * Math.PI;
                
                g.moveTo(spiralStart, 0);
                for (let i = 1; i <= spiralSteps; i++) {
                    const theta = (i / spiralSteps) * spiralThetaMax;
                    const r = spiralStart + spiralGrowth * theta;
                    const px = Math.cos(theta) * r;
                    const py = Math.sin(theta) * r;
                    g.lineTo(px, py);
                }
                break;
            
            case 'olho':
                g.moveTo(-30, 0);
                this.drawQuadCurve(g, -30, 0, 0, -25, 30, 0);
                this.drawQuadCurve(g, 30, 0, 0, 25, -30, 0);
                g.moveTo(12, 0);
                g.arc(0, 0, 12, 0, Math.PI * 2);
                g.moveTo(5, 0);
                g.arc(0, 0, 5, 0, Math.PI * 2);
                break;
            
            case 'anomaly':
                if (this.proceduralParams) {
                    const { sides, roughness, seed } = this.proceduralParams;
                    const radius = 28;
                    for (let i = 0; i <= sides; i++) {
                        const angle = (i * (Math.PI * 2)) / sides;
                        const noise = Math.sin(i * 123.45 + seed) * (radius * roughness);
                        const r = radius + noise;
                        const px = Math.cos(angle) * r;
                        const py = Math.sin(angle) * r;
                        if (i === 0) g.moveTo(px, py);
                        else g.lineTo(px, py);
                    }
                    g.closePath();
                } else {
                    this.drawPolygon(g, 7, 26);
                }
                break;
            
            default: g.strokeRect(-20,-20,40,40); break;
        }
    }

    drawPolygon(g, sides, size) {
        for(let i=0; i<sides; i++) {
            const angle = (i * (360/sides) - 90) * Math.PI / 180;
            const px = Math.cos(angle) * size; const py = Math.sin(angle) * size;
            if(i===0) g.moveTo(px,py); else g.lineTo(px,py);
        } g.closePath();
    }

    drawChemistryPattern(g, shapeId, chemId, size, color) {
        if (!chemId) return;
        
        const patternColor = this.lightenColor(color, 0.4);
        const patternAlpha = 0.35;
        
        switch (chemId) {
            case 'ouro':
                this.drawGoldSpecular(g, size, patternColor, patternAlpha);
                break;
                
            case 'ferro':
                this.drawIronHatching(g, shapeId, size, patternColor, patternAlpha);
                break;
                
            case 'cristal':
                this.drawCrystalFacets(g, shapeId, size, patternColor, patternAlpha);
                break;
                
            case 'mercurio':
                this.drawMercuryWaves(g, size, patternColor, patternAlpha);
                break;
                
            case 'silicio':
                this.drawSiliconCircuit(g, size, patternColor, patternAlpha);
                break;
                
            case 'uranio':
                this.drawUraniumCore(g, size, patternColor, patternAlpha);
                break;
            
            case 'bismuto':
                this.drawBismutoCrystal(g, size, patternAlpha);
                break;
                
            case 'carbono':
            default:
                this.drawCarbonGrid(g, size, patternColor, patternAlpha * 0.5);
                break;
        }
    }
    
    drawGoldSpecular(g, size, color, alpha) {
        g.fillStyle(0xFFFFFF, alpha * 1.2);
        g.fillEllipse(-size * 0.4, -size * 0.4, size * 0.25, size * 0.12);
        g.fillEllipse(-size * 0.2, -size * 0.55, size * 0.12, size * 0.06);
        g.fillStyle(0xFFFFFF, alpha * 0.6);
        g.fillEllipse(size * 0.3, size * 0.3, size * 0.15, size * 0.08);
        g.fillStyle(0xFFD700, alpha * 0.4);
        g.fillCircle(0, 0, size * 0.5);
    }
    
    drawIronHatching(g, shapeId, size, color, alpha) {
        g.lineStyle(1, color, alpha);
        const spacing = 6;
        const extent = size * 0.85;
        for (let i = -extent * 2; i < extent * 2; i += spacing) {
            g.beginPath();
            g.moveTo(i - extent, -extent);
            g.lineTo(i + extent, extent);
            g.strokePath();
        }
        g.lineStyle(0.5, color, alpha * 0.5);
        for (let i = -extent * 2; i < extent * 2; i += spacing * 2) {
            g.beginPath();
            g.moveTo(i + extent, -extent);
            g.lineTo(i - extent, extent);
            g.strokePath();
        }
    }
    
    drawCrystalFacets(g, shapeId, size, color, alpha) {
        g.lineStyle(1, color, alpha);
        let facets = 6;
        switch (shapeId) {
            case 'triangulo': facets = 3; break;
            case 'quadrado': facets = 4; break;
            case 'pentagono': facets = 5; break;
            case 'hexagono': facets = 6; break;
            case 'circulo': facets = 8; break;
            default: facets = 6;
        }
        for (let i = 0; i < facets; i++) {
            const angle = (i * (360 / facets) - 90) * Math.PI / 180;
            const px = Math.cos(angle) * size * 0.85;
            const py = Math.sin(angle) * size * 0.85;
            g.beginPath();
            g.moveTo(0, 0);
            g.lineTo(px, py);
            g.strokePath();
        }
        g.lineStyle(0.5, color, alpha * 0.7);
        g.strokeCircle(0, 0, size * 0.4);
    }
    
    drawMercuryWaves(g, size, color, alpha) {
        const time = Date.now() * 0.002;
        const pulseSize = size * 0.35 + Math.sin(time) * size * 0.08;
        g.fillStyle(color, alpha * 0.6);
        g.fillCircle(Math.sin(time * 1.3) * 3, Math.cos(time) * 3, pulseSize);
        g.lineStyle(1.5, color, alpha);
        for (let wave = 0; wave < 3; wave++) {
            g.beginPath();
            const baseY = -size * 0.4 + wave * size * 0.35;
            const waveOffset = time + wave * 0.7;
            for (let x = -size * 0.7; x <= size * 0.7; x += 3) {
                const y = baseY + Math.sin(x * 0.15 + waveOffset) * 4;
                if (x === -size * 0.7) g.moveTo(x, y);
                else g.lineTo(x, y);
            }
            g.strokePath();
        }
    }
    
    drawSiliconCircuit(g, size, color, alpha) {
        g.lineStyle(1, color, alpha);
        const s = size * 0.6;
        g.beginPath();
        g.moveTo(-s, -s * 0.5); g.lineTo(-s * 0.3, -s * 0.5);
        g.lineTo(-s * 0.3, 0); g.lineTo(s * 0.3, 0);
        g.lineTo(s * 0.3, s * 0.5); g.lineTo(s, s * 0.5);
        g.strokePath();
        g.beginPath();
        g.moveTo(0, -s); g.lineTo(0, -s * 0.3);
        g.lineTo(s * 0.5, -s * 0.3); g.lineTo(s * 0.5, s * 0.3);
        g.lineTo(0, s * 0.3); g.lineTo(0, s);
        g.strokePath();
        g.fillStyle(color, alpha * 1.5);
        g.fillCircle(-s * 0.3, -s * 0.5, 2);
        g.fillCircle(s * 0.3, 0, 2);
        g.fillCircle(0, s * 0.3, 2);
        g.fillCircle(s * 0.5, -s * 0.3, 2);
        g.lineStyle(1.5, color, alpha);
        g.strokeRect(-s * 0.2, -s * 0.2, s * 0.4, s * 0.4);
    }
    
    drawUraniumCore(g, size, color, alpha) {
        const time = Date.now() * 0.003;
        const pulseAlpha = alpha * (0.7 + Math.sin(time * 2) * 0.3);
        g.fillStyle(0x00FF00, pulseAlpha);
        g.fillCircle(0, 0, size * 0.2);
        g.lineStyle(1, color, alpha * 0.7);
        g.strokeCircle(0, 0, size * 0.4);
        g.strokeCircle(0, 0, size * 0.6);
        g.fillStyle(0xFFFF00, alpha * 1.2);
        for (let i = 0; i < 3; i++) {
            const angle = time * 2 + i * (Math.PI * 2 / 3);
            const orbitRadius = size * 0.4 + (i % 2) * size * 0.2;
            const ex = Math.cos(angle) * orbitRadius;
            const ey = Math.sin(angle) * orbitRadius * 0.5; 
            g.fillCircle(ex, ey, 3);
        }
    }
    
    drawCarbonGrid(g, size, color, alpha) {
        g.lineStyle(0.5, color, alpha);
        const gridSize = 8;
        const extent = size * 0.7;
        for (let y = -extent; y <= extent; y += gridSize) {
            g.beginPath();
            g.moveTo(-extent, y);
            g.lineTo(extent, y);
            g.strokePath();
        }
        for (let x = -extent; x <= extent; x += gridSize) {
            g.beginPath();
            g.moveTo(x, -extent);
            g.lineTo(x, extent);
            g.strokePath();
        }
    }
    
    drawBismutoCrystal(g, size, alpha) {
        const time = Date.now() * 0.001;
        const layers = 5;
        const iridescent = [0xFF6B9D, 0xFFB347, 0xFFEB3B, 0x4ECDC4, 0x9B59B6, 0x3498DB];
        for (let i = layers; i >= 0; i--) {
            const layerSize = size * (0.2 + i * 0.15);
            const offset = i * 2.5; 
            const colorIndex = Math.floor((i + time) % iridescent.length);
            const nextColor = iridescent[(colorIndex + 1) % iridescent.length];
            const currentColor = iridescent[colorIndex];
            const blend = (Math.sin(time * 2 + i) + 1) / 2;
            const finalColor = this.blendColors(currentColor, nextColor, blend);
            g.fillStyle(finalColor, alpha * (0.4 + i * 0.08));
            g.fillRect(-layerSize / 2 - offset, -layerSize / 2 - offset, layerSize, layerSize);
            g.lineStyle(1.5, 0xFFFFFF, alpha * 0.5);
            g.strokeRect(-layerSize / 2 - offset, -layerSize / 2 - offset, layerSize, layerSize);
        }
        g.fillStyle(0xFFFFFF, alpha * 0.8);
        g.fillCircle(-size * 0.2, -size * 0.2, 3);
    }
    
    lightenColor(color, amount) {
        const r = Math.min(255, ((color >> 16) & 0xFF) + 255 * amount);
        const gr = Math.min(255, ((color >> 8) & 0xFF) + 255 * amount);
        const b = Math.min(255, (color & 0xFF) + 255 * amount);
        return (Math.floor(r) << 16) | (Math.floor(gr) << 8) | Math.floor(b);
    }
    
    blendColors(color1, color2, weight) {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;
        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;
        const r = Math.floor(r1 * (1 - weight) + r2 * weight);
        const g = Math.floor(g1 * (1 - weight) + g2 * weight);
        const b = Math.floor(b1 * (1 - weight) + b2 * weight);
        return (r << 16) | (g << 8) | b;
    }

    drawAnomalyGlitch(g, type, bodyColor, auraColor, chemType) {
        const intensity = this.glitchIntensity || 0.5;
        const time = Date.now() * 0.01;
        
        if (Math.random() < 0.3 * intensity) {
            this.glitchOffset.x = (Math.random() - 0.5) * 8 * intensity;
            this.glitchOffset.y = (Math.random() - 0.5) * 6 * intensity;
        }
        
        const glitchColor1 = this.shiftColor(auraColor, 40, 0, -40); 
        const glitchColor2 = this.shiftColor(auraColor, -40, 0, 40); 
        
        const lineWidth = this.visualDNA?.lineWidth || 2;
        const params = this.proceduralParams || { sides: 7, roughness: 0.3, seed: 42 };
        
        g.save();
        g.translateCanvas(this.glitchOffset.x * 1.5, this.glitchOffset.y * 0.5);
        g.lineStyle(lineWidth + 4, glitchColor1, 0.4);
        this.drawAnomalyPath(g, params, time * 0.7);
        g.strokePath();
        g.restore();
        
        g.save();
        g.translateCanvas(-this.glitchOffset.x, this.glitchOffset.y * 1.2);
        g.lineStyle(lineWidth + 4, glitchColor2, 0.4);
        this.drawAnomalyPath(g, params, time * 1.3);
        g.strokePath();
        g.restore();
        
        const fillAlpha = 0.1 + Math.sin(time * 0.5) * 0.05 * intensity;
        g.fillStyle(bodyColor, fillAlpha);
        this.drawAnomalyPath(g, params, time);
        g.fillPath();
        
        if (chemType) {
            this.drawChemistryPattern(g, 'anomaly', chemType, 25, bodyColor);
        }
        
        const pulseSize = 6 + Math.sin(time * 2) * 2 * intensity;
        g.lineStyle(lineWidth + pulseSize, auraColor, 0.25 + Math.sin(time) * 0.1);
        this.drawAnomalyPath(g, params, time);
        g.strokePath();
        
        g.save();
        g.translateCanvas(this.glitchOffset.x * 0.3, this.glitchOffset.y * 0.3);
        g.lineStyle(lineWidth, bodyColor, 1);
        this.drawAnomalyPath(g, params, time);
        g.strokePath();
        g.restore();
        
        if (Math.random() < 0.4 * intensity) {
            this.drawScanlines(g, intensity);
        }
    }
    
    drawAnomalyPath(g, params, timeOffset = 0) {
        const { sides, roughness, seed } = params;
        const radius = 28;
        
        g.beginPath();
        for (let i = 0; i <= sides; i++) {
            const angle = (i * (Math.PI * 2)) / sides;
            const noise = Math.sin(i * 123.45 + seed + timeOffset * 0.1) * (radius * roughness);
            const wobble = Math.sin(timeOffset * 0.5 + i) * 2 * this.glitchIntensity;
            const r = radius + noise + wobble;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
        }
        g.closePath();
    }
    
    drawScanlines(g, intensity) {
        const numLines = Math.floor(2 + Math.random() * 3 * intensity);
        for (let i = 0; i < numLines; i++) {
            const y = (Math.random() - 0.5) * 50;
            const width = 20 + Math.random() * 30;
            const alpha = 0.3 + Math.random() * 0.3;
            g.lineStyle(1, 0xffffff, alpha);
            g.beginPath();
            g.moveTo(-width / 2, y);
            g.lineTo(width / 2, y);
            g.strokePath();
        }
    }
    
    shiftColor(color, rShift, gShift, bShift) {
        let r = ((color >> 16) & 0xff) + rShift;
        let g = ((color >> 8) & 0xff) + gShift;
        let b = (color & 0xff) + bShift;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return (r << 16) | (g << 8) | b;
    }

    drawFace() {
        if (!this.faceGraphics) return;
        const g = this.faceGraphics;
        g.clear();
        
        // ═══ NOVAS EXPRESSÕES DE AÇÃO ═══
        if (this.expressionState.action === 'breed' || 
            this.expressionState.action === 'mutate' || 
            this.expressionState.action === 'born' || 
            this.expressionState.action === 'feed' ||
            this.expressionState.action === 'angry' ||
            this.expressionState.action === 'love' ||
            this.expressionState.action === 'hurt') {
            const s = this.faceScale || 1;
            const lineWidth = Math.max(this.minLineWidth, 2 * s);
            this.drawActionFace(g, this.expressionState.action, lineWidth, s);
            return;
        }

        const s = this.faceScale;
        
        this.drawEyes(g, s);
        this.drawMouth(g, s);
        this.drawBrows(g, s);
        this.drawFaceExtras(g, s);
    }
    
    /**
     * Desenha extras faciais baseados nos genes (sardas, cicatrizes, etc)
     * Estilo 16-bit com detalhes pixel
     */
    drawFaceExtras(g, s) {
        const genes = this.visualDNA.faceGenes;
        const color = this.visualDNA.detailColor;
        const p = this.faceParams;
        
        // Sardas (mercúrio, bismuto)
        if (genes.hasFreckles) {
            g.fillStyle(color, 0.4);
            // Padrão fixo de sardas (baseado em "DNA")
            const frecklePositions = [
                [-12, 2], [-10, 4], [-14, 5],
                [10, 2], [12, 4], [14, 3]
            ];
            frecklePositions.forEach(([fx, fy]) => {
                g.fillCircle(fx * s, fy * s + p.breathY, 1 * s);
            });
        }
        
        // Cicatriz (ferro - guerreiro)
        if (genes.hasScar) {
            g.lineStyle(1.5 * s, color, 0.6);
            g.beginPath();
            g.moveTo(-14 * s, -8 * s);
            g.lineTo(-10 * s, 0);
            g.lineTo(-12 * s, 4 * s);
            g.strokePath();
        }
        
        // Blush/rubor quando feliz ou envergonhado
        if (this.expressionState.mood === 'happy' || this.pettingActive) {
            g.fillStyle(0xff6b6b, 0.2);
            g.fillEllipse(-14 * s, 2 * s + p.breathY, 4 * s, 2.5 * s);
            g.fillEllipse(14 * s, 2 * s + p.breathY, 4 * s, 2.5 * s);
        }
        
        // Gotículas de suor quando assustado/fugindo
        if (this.instincts.state === 'fleeing' && this.instincts.intensity > 0.5) {
            const sweatY = -12 * s + Math.sin(Date.now() * 0.01) * 2 * s;
            g.fillStyle(0x88ccff, 0.7);
            g.fillEllipse(14 * s, sweatY, 2 * s, 3 * s);
            // Brilho
            g.fillStyle(0xffffff, 0.8);
            g.fillCircle(14 * s - 0.5 * s, sweatY - 1 * s, 0.8 * s);
        }
        
        // Lágrimas quando morrendo
        if (this.expressionState.mood === 'dying') {
            const tearY = 2 * s + (Date.now() % 1000) / 1000 * 8 * s;
            g.fillStyle(0x66ccff, 0.6);
            g.fillEllipse(-10 * s, tearY, 1.5 * s, 2.5 * s);
            g.fillEllipse(10 * s, tearY + 2 * s, 1.5 * s, 2.5 * s);
        }
    }

    drawEyes(g, s) {
        const genes = this.visualDNA.faceGenes;
        const p = this.faceParams;
        
        // --- 1. Parallax & Breathing ---
        const ox = this.eyeOffset.x + (p.focusOffset.x * 0.7) + (Math.random()-0.5) * p.tremor * 10;
        const oy = this.eyeOffset.y + (p.focusOffset.y * 0.7) + p.breathY + (Math.random()-0.5) * p.tremor * 10;
        
        const color = this.visualDNA.detailColor;
        const eyeColor = this.visualDNA.eyeColor || color;
        const lineWidth = Math.max(this.minLineWidth, 2 * s);
        
        // --- 2. Sclera (Fundo branco do olho) - Estilo 16-bit ---
        if (!this.isBlinking) {
            const w = 5 * s;
            const h = 5 * s * p.eyeOpenness;
            
            // Sombra escura atrás (depth)
            if (genes.eyeType !== 'visor' && genes.eyeType !== 'dot') {
                g.fillStyle(0x000000, 0.4);
                g.fillEllipse(-8*s + ox + 1, -5*s + oy + 1, w * 1.3, h * 1.2);
                g.fillEllipse(8*s + ox + 1, -5*s + oy + 1, w * 1.3, h * 1.2);
                
                // Sclera branca (olhos com branco interno)
                g.fillStyle(0xffffff, 0.9);
                g.fillEllipse(-8*s + ox, -5*s + oy, w * 1.2, h);
                g.fillEllipse(8*s + ox, -5*s + oy, w * 1.2, h);
            }
        }

        g.lineStyle(lineWidth, eyeColor, 1);
        
        if (this.isBlinking) {
            // Olhos fechados - linha curva estilo anime/16-bit
            g.lineStyle(lineWidth + 0.5, eyeColor, 1);
            g.beginPath();
            this.drawQuadCurve(g, -12*s + ox, -5*s + oy, -8*s + ox, -3*s + oy, -4*s + ox, -5*s + oy);
            this.drawQuadCurve(g, 4*s + ox, -5*s + oy, 8*s + ox, -3*s + oy, 12*s + ox, -5*s + oy);
            g.strokePath();
            
            // Linha de expressão abaixo (sobrancelha relaxada)
            g.lineStyle(lineWidth * 0.5, eyeColor, 0.4);
            g.beginPath();
            g.moveTo(-11*s + ox, -7*s + oy);
            g.lineTo(-5*s + ox, -7*s + oy);
            g.moveTo(5*s + ox, -7*s + oy);
            g.lineTo(11*s + ox, -7*s + oy);
            g.strokePath();
            return;
        }

        const h = 5 * s * p.eyeOpenness; 
        const w = 5 * s;
        const pupSize = 2.5 * s * p.pupilSize;

        switch(genes.eyeType) {
            case 'circle':
                // Contorno do olho
                g.lineStyle(lineWidth, eyeColor, 1);
                g.strokeEllipse(-8*s + ox, -5*s + oy, w, h);
                g.strokeEllipse(8*s + ox, -5*s + oy, w, h);
                
                // Íris colorida (maior, mais expressiva)
                const irisSize = pupSize * 1.8;
                g.fillStyle(eyeColor, 0.8);
                g.fillCircle(-8*s + ox + p.focusOffset.x * 0.5, -5*s + oy + p.focusOffset.y * 0.5, irisSize);
                g.fillCircle(8*s + ox + p.focusOffset.x * 0.5, -5*s + oy + p.focusOffset.y * 0.5, irisSize);
                
                // Pupila preta central
                g.fillStyle(0x000000, 1);
                g.fillCircle(-8*s + ox + p.focusOffset.x * 0.5, -5*s + oy + p.focusOffset.y * 0.5, pupSize * 0.7);
                g.fillCircle(8*s + ox + p.focusOffset.x * 0.5, -5*s + oy + p.focusOffset.y * 0.5, pupSize * 0.7);
                
                // Brilho especular (16-bit highlight)
                g.fillStyle(0xffffff, 0.95);
                g.fillCircle(-8*s + ox + p.focusOffset.x * 0.3 - 1.5*s, -5*s + oy + p.focusOffset.y * 0.3 - 1.5*s, pupSize * 0.5);
                g.fillCircle(8*s + ox + p.focusOffset.x * 0.3 - 1.5*s, -5*s + oy + p.focusOffset.y * 0.3 - 1.5*s, pupSize * 0.5);
                // Brilho secundário menor
                g.fillStyle(0xffffff, 0.6);
                g.fillCircle(-8*s + ox + p.focusOffset.x * 0.3 + 1*s, -5*s + oy + p.focusOffset.y * 0.3 + 1*s, pupSize * 0.25);
                g.fillCircle(8*s + ox + p.focusOffset.x * 0.3 + 1*s, -5*s + oy + p.focusOffset.y * 0.3 + 1*s, pupSize * 0.25);
                break;
                
            case 'slit':
                // Olho de réptil/gato
                g.fillStyle(eyeColor, 0.7);
                g.fillEllipse(-8*s + ox, -5*s + oy, w * 0.8, h);
                g.fillEllipse(8*s + ox, -5*s + oy, w * 0.8, h);
                g.strokeEllipse(-8*s + ox, -5*s + oy, w * 0.8, h);
                g.strokeEllipse(8*s + ox, -5*s + oy, w * 0.8, h);
                
                // Fenda vertical
                g.fillStyle(0x000000, 1);
                const slitW = 1.5 * s;
                const slitH = h * 0.9;
                g.fillEllipse(-8*s + ox + p.focusOffset.x * 0.3, -5*s + oy + p.focusOffset.y * 0.3, slitW, slitH);
                g.fillEllipse(8*s + ox + p.focusOffset.x * 0.3, -5*s + oy + p.focusOffset.y * 0.3, slitW, slitH);
                
                // Brilho
                g.fillStyle(0xffffff, 0.8);
                g.fillCircle(-8*s + ox - 2*s, -5*s + oy - 2*s, pupSize * 0.3);
                g.fillCircle(8*s + ox - 2*s, -5*s + oy - 2*s, pupSize * 0.3);
                break;
                
            case 'pixel':
                // Olhos quadrados estilo 8-bit/16-bit
                g.fillStyle(0x000000, 0.5);
                g.fillRect(-12*s + ox + 1, -5*s + oy - h + 1, w*1.6, h*2);
                g.fillRect(4*s + ox + 1, -5*s + oy - h + 1, w*1.6, h*2);
                
                g.fillStyle(0xffffff, 0.9);
                g.fillRect(-12*s + ox, -5*s + oy - h, w*1.5, h*2);
                g.fillRect(4*s + ox, -5*s + oy - h, w*1.5, h*2);
                
                g.lineStyle(lineWidth, eyeColor, 1);
                g.strokeRect(-12*s + ox, -5*s + oy - h, w*1.5, h*2);
                g.strokeRect(4*s + ox, -5*s + oy - h, w*1.5, h*2);
                
                // Pixel pupila
                g.fillStyle(eyeColor, 1);
                const pixelSize = pupSize * 1.2;
                g.fillRect(-10*s + ox + p.focusOffset.x * 0.5 - pixelSize/2, -5*s + oy + p.focusOffset.y * 0.5 - pixelSize/2, pixelSize, pixelSize);
                g.fillRect(6*s + ox + p.focusOffset.x * 0.5 - pixelSize/2, -5*s + oy + p.focusOffset.y * 0.5 - pixelSize/2, pixelSize, pixelSize);
                
                // Highlight pixel
                g.fillStyle(0xffffff, 0.9);
                g.fillRect(-11*s + ox, -5*s + oy - h + 1*s, 2*s, 2*s);
                g.fillRect(5*s + ox, -5*s + oy - h + 1*s, 2*s, 2*s);
                break;
                
            case 'dot':
                // Olhos simples ponto (slime/blob)
                g.fillStyle(0x000000, 0.3);
                g.fillCircle(-8*s + ox + 1, -5*s + oy + 1, w * p.eyeOpenness * 1.1);
                g.fillCircle(8*s + ox + 1, -5*s + oy + 1, w * p.eyeOpenness * 1.1);
                
                g.fillStyle(eyeColor, 1);
                const dotSize = Math.max(w * p.eyeOpenness, 2*s);
                g.fillCircle(-8*s + ox + p.focusOffset.x * 0.5, -5*s + oy + p.focusOffset.y * 0.5, dotSize);
                g.fillCircle(8*s + ox + p.focusOffset.x * 0.5, -5*s + oy + p.focusOffset.y * 0.5, dotSize);
                
                // Brilho
                g.fillStyle(0xffffff, 0.9);
                g.fillCircle(-8*s + ox - 1.5*s, -5*s + oy - 1.5*s, dotSize * 0.35);
                g.fillCircle(8*s + ox - 1.5*s, -5*s + oy - 1.5*s, dotSize * 0.35);
                break;
                
            case 'visor':
                // Visor estilo robô/sci-fi
                g.fillStyle(0x000000, 0.7);
                g.fillRoundedRect(-16*s + ox, -8*s + oy, 32*s, 6*s, 3*s);
                
                g.lineStyle(lineWidth + 1*s, eyeColor, 1);
                g.strokeRoundedRect(-15*s + ox, -7*s + oy, 30*s, 4*s, 2*s);
                
                // Scanner interno
                g.fillStyle(eyeColor, 0.6);
                g.fillRoundedRect(-14*s + ox, -6*s + oy, 28*s, 2*s, 1*s);
                
                // Scanner light que se move
                const scanX = p.focusOffset.x * 4;
                g.fillStyle(0xffffff, 0.95);
                g.fillRoundedRect(scanX - 3*s + ox, -6*s + oy, 6*s, 2*s, 1*s);
                break;
                
            case 'hollow':
                // Olhos vazios/fantasma
                g.lineStyle(lineWidth + 1, eyeColor, 1);
                g.strokeCircle(-8*s + ox, -5*s + oy, w * p.eyeOpenness);
                g.strokeCircle(8*s + ox, -5*s + oy, w * p.eyeOpenness);
                
                // Brilho interno sutil
                g.fillStyle(eyeColor, 0.2);
                g.fillCircle(-8*s + ox, -5*s + oy, w * p.eyeOpenness * 0.7);
                g.fillCircle(8*s + ox, -5*s + oy, w * p.eyeOpenness * 0.7);
                
                // Ponto de luz
                g.fillStyle(eyeColor, 0.6);
                g.fillCircle(-8*s + ox + p.focusOffset.x * 0.5, -5*s + oy + p.focusOffset.y * 0.5, 2*s);
                g.fillCircle(8*s + ox + p.focusOffset.x * 0.5, -5*s + oy + p.focusOffset.y * 0.5, 2*s);
                break;
                
            default: 
                g.strokeCircle(-8*s + ox, -5*s + oy, w * p.eyeOpenness);
                g.strokeCircle(8*s + ox, -5*s + oy, w * p.eyeOpenness);
        }
        
        // --- Detalhes extras baseados nos genes ---
        if (genes.hasSparkle && !this.isBlinking) {
            // Sparkles para ouro
            const time = Date.now() * 0.003;
            g.fillStyle(0xffffff, 0.5 + Math.sin(time) * 0.3);
            g.fillCircle(-12*s + ox + Math.sin(time * 2) * 2, -8*s + oy, 1.5*s);
            g.fillCircle(12*s + ox + Math.cos(time * 2) * 2, -8*s + oy, 1.5*s);
        }
        
        if (genes.hasGlow) {
            // Glow radioativo
            const glowAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
            g.fillStyle(eyeColor, glowAlpha);
            g.fillCircle(-8*s + ox, -5*s + oy, w * 2);
            g.fillCircle(8*s + ox, -5*s + oy, w * 2);
        }
    }

    drawMouth(g, s) {
        const genes = this.visualDNA.faceGenes;
        const p = this.faceParams;
        const color = this.visualDNA.detailColor;
        const lineWidth = Math.max(this.minLineWidth, 2 * s);
        
        // Boca move um pouco menos que os olhos (fundo do rosto)
        const ox = (p.focusOffset.x * 0.5) + (Math.random()-0.5) * p.tremor * 5;
        const oy = 8 * s + (p.focusOffset.y * 0.5) + p.breathY + (Math.random()-0.5) * p.tremor * 5;
        
        g.lineStyle(lineWidth, color, 1);
        const curve = p.mouthCurve * 8 * s;

        switch(genes.mouthType) {
            case 'simple':
                g.beginPath();
                if (Math.abs(curve) < 1) {
                    g.moveTo(-6*s + ox, oy); g.lineTo(6*s + ox, oy);
                } else {
                    g.moveTo(-6*s + ox, oy - curve*0.5);
                    this.drawQuadCurve(g, -6*s + ox, oy - curve*0.5, 0 + ox, oy + curve, 6*s + ox, oy - curve*0.5);
                }
                g.strokePath();
                break;
            case 'stitch':
                g.beginPath();
                g.moveTo(-8*s + ox, oy); g.lineTo(8*s + ox, oy);
                g.strokePath();
                g.lineStyle(1, color, 1);
                for(let i=-6; i<=6; i+=4) {
                    g.beginPath(); g.moveTo(i*s + ox, oy-2*s); g.lineTo(i*s + ox, oy+2*s); g.strokePath();
                }
                break;
            case 'beak':
                g.beginPath();
                g.moveTo(-4*s + ox, oy - 2*s);
                g.lineTo(0 + ox, oy + 4*s);
                g.lineTo(4*s + ox, oy - 2*s);
                g.lineTo(0 + ox, oy - 4*s);
                g.closePath();
                g.strokePath();
                break;
            case 'void':
                g.fillStyle(0x000000, 1);
                g.fillEllipse(0 + ox, oy + 2*s, 6*s, 4*s * (0.5 + Math.abs(p.mouthCurve)));
                g.strokeEllipse(0 + ox, oy + 2*s, 6*s, 4*s * (0.5 + Math.abs(p.mouthCurve)));
                break;
            case 'speaker':
                g.strokeRect(-8*s + ox, oy - 2*s, 16*s, 6*s);
                g.lineStyle(1, color, 0.5);
                g.beginPath(); g.moveTo(-8*s + ox, oy+1*s); g.lineTo(8*s + ox, oy+1*s); g.strokePath();
                break;
            case 'digital':
                const moodY = curve > 0 ? -1 : 1;
                g.beginPath();
                g.moveTo(-6*s + ox, oy - 2*s*moodY); g.lineTo(-2*s + ox, oy + 2*s*moodY);
                g.lineTo(2*s + ox, oy + 2*s*moodY); g.lineTo(6*s + ox, oy - 2*s*moodY);
                g.strokePath();
                break;
            default:
                g.beginPath();
                g.moveTo(-6*s + ox, oy); g.lineTo(6*s + ox, oy);
                g.strokePath();
        }
    }

    drawBrows(g, s) {
        const p = this.faceParams;
        const color = this.visualDNA.detailColor;
        const lineWidth = Math.max(this.minLineWidth, 1.5 * s);
        
        g.lineStyle(lineWidth, color, 0.8);
        
        // Sobrancelhas movem MAIS que os olhos (ficam "saltadas" do rosto)
        const ox = p.focusOffset.x * 0.9;
        const oyOffset = p.focusOffset.y * 0.9 + p.breathY;
        
        const yBase = -14 * s + p.browY * 0.2 + oyOffset; 
        const angle = p.browAngle * 5 * s; 
        
        // Aplica assimetria genética (uma sobrancelha mais alta/arqueada)
        const asym = this.visualDNA.asymmetry * 10 * s;
        
        // Esquerda
        g.beginPath();
        // Curva quadrática para expressão (triste = U invertido, bravo = V)
        const browCurve = p.browAngle * 2 * s; 
        this.drawQuadCurve(g, -12*s + ox, yBase - angle - asym, -8*s + ox, yBase - browCurve - asym, -4*s + ox, yBase + angle - asym);
        g.strokePath();
        
        // Direita
        g.beginPath();
        this.drawQuadCurve(g, 4*s + ox, yBase + angle + asym, 8*s + ox, yBase - browCurve + asym, 12*s + ox, yBase - angle + asym);
        g.strokePath();
    }
    
    setActionExpression(action, duration = 1500) {
        this.expressionState.action = action;
        this.expressionState.actionTimer = Date.now() + duration;
    }
    
    /**
     * Método genérico para definir expressão (usado pelo UIFlingSystem)
     * @param {string} expression - 'angry', 'happy', 'sad', 'neutral', 'love', 'hurt', etc
     * @param {number} duration - Duração em ms (padrão 2000)
     */
    setExpression(expression, duration = 2000) {
        // Se for uma action expression (angry, breed, etc), usa o sistema de action
        const actionExpressions = ['angry', 'breed', 'mutate', 'born', 'feed', 'begging', 'panic', 'burn', 'freeze', 'love', 'hurt', 'dizzy'];
        
        if (actionExpressions.includes(expression)) {
            this.setActionExpression(expression, duration);
        } else {
            // Se for mood (happy, sad, neutral, dying), define direto
            this.expressionState.mood = expression;
        }
        
        // Salva a expressão atual para referência
        this.currentExpression = expression;
    }
    
    updateExpression() {
        if (this.expressionState.action && Date.now() > this.expressionState.actionTimer) {
            this.expressionState.action = null;
        }
        
        this.applyExoticPhysicsEffects();
        
        // --- RESPIRAÇÃO (Idle Animation) ---
        const time = Date.now() * 0.002;
        // Um leve bob vertical para dar vida
        this.faceParams.breathY = Math.sin(time) * 1.5; 
        
        this.blinkTimer++;
        let blinkInterval = 60;
        if (this.currentPhysics === 'eletricidade') blinkInterval = 30;
        if (this.currentPhysics === 'gravidade') blinkInterval = 100;
        if (this.currentPhysics === 'frio') blinkInterval = 120;
        if (this.currentPhysics === 'entropia') blinkInterval = 20; 
        if (this.currentPhysics === 'sonico') blinkInterval = 45;
        
        if (this.blinkTimer >= blinkInterval) {
            this.isBlinking = true;
            this.scene.time.delayedCall(100, () => { this.isBlinking = false; });
            this.blinkTimer = 0;
        }

        const lifePct = this.maxLife > 0 ? this.currentLife / this.maxLife : 1;
        let mood = 'neutral';
        if (lifePct > 0.7) mood = 'happy';
        else if (lifePct > 0.5) mood = 'neutral';
        else if (lifePct > 0.3) mood = 'sad';
        else if (lifePct > 0) mood = 'dying';
        else mood = 'dead';
        
        this.expressionState.mood = mood;

        let target = { open: 1, curve: 0, brow: 0, pupil: 1, tremor: 0, y: 0 };
        
        // --- LÓGICA DE EYE TRACKING E REAÇÃO A FERRAMENTAS ---
        let lookTarget = null;
        let lookIntensity = 0; // 0 a 1

        // Prioridade 1: Instintos Ativos (Ferramenta sendo arrastada)
        if (this.instincts.active && this.instincts.targetPos) {
            lookTarget = this.instincts.targetPos;
            lookIntensity = 1.0; // Foco total na ameaça/comida

            // Modificadores emocionais baseados na ferramenta ativa
            const tool = this.instincts.activeTool;
            
            if (tool === 'burn' || tool === 'kill') {
                // TERROR: Olhos arregalados, pupilas minúsculas (miose), sobrancelhas arqueadas
                target = { open: 1.4, curve: -0.8, brow: 0.8, pupil: 0.4, tremor: 1.2, y: -3 };
            } else if (tool === 'feed') {
                // FOME: Olhos abertos, pupilas dilatadas (midríase), "begging"
                target = { open: 1.2, curve: 0.5, brow: -0.3, pupil: 1.4, tremor: 0.1, y: 0 };
            } else if (tool === 'mutate' || tool === 'freeze') {
                // CURIOSIDADE/DÚVIDA: Olhos normais, sobrancelha levantada
                target = { open: 1.0, curve: 0.0, brow: 0.4, pupil: 0.9, tremor: 0.3, y: -1 };
            }
        
        } 
        // Prioridade 2: Mouse Idle (Olhar casual se estiver perto)
        else {
            const pointer = this.scene.input.activePointer;
            // Verifica se o mouse moveu recentemente para não travar em posição morta
            const isActive = (Date.now() - pointer.moveTime < 3000) || pointer.isDown;
            
            if (isActive) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, pointer.worldX, pointer.worldY);
                if (dist < 250) { // Raio de visão casual
                    lookTarget = { x: pointer.worldX, y: pointer.worldY };
                    lookIntensity = Math.max(0, 1 - (dist / 250)); // Foco diminui com distância
                }
            }
            
            // Mood padrão se não houver instinto forte
            if (!this.instincts.active && !this.expressionState.action) {
                switch(mood) {
                    case 'happy': target = { open: 1, curve: 0.6, brow: -0.2, pupil: 1, tremor: 0, y: 0 }; break;
                    case 'neutral': target = { open: 0.9, curve: 0, brow: 0, pupil: 1, tremor: 0, y: 0 }; break;
                    case 'sad': target = { open: 0.7, curve: -0.5, brow: 0.4, pupil: 1, tremor: 0, y: 0 }; break;
                    case 'dying': target = { open: 0.5, curve: -0.3, brow: 0.6, pupil: 0.8, tremor: 0.5, y: 2 }; break;
                    case 'dead': target = { open: 0.1, curve: 0, brow: 0, pupil: 0, tremor: 0, y: 0 }; break;
                }
            }
        }

        // Aplica modificadores de física (mantém identidade elemental)
        if (this.currentPhysics === 'eletricidade') { target.tremor += 0.2; target.open = 0.8 + Math.random()*0.4; }
        if (this.currentPhysics === 'calor') { target.curve += (Math.random()-0.5)*0.2; }
        if (this.currentPhysics === 'frio') { target.tremor += 0.1; }

        // --- CÁLCULO VETORIAL DO OLHAR ---
        if (lookTarget) {
            const dx = lookTarget.x - this.x;
            const dy = lookTarget.y - this.y;
            const angle = Math.atan2(dy, dx);
            
            // Limite de movimento do olho (em pixels relativos à escala)
            const maxEyeMove = 4; 
            
            const targetFocusX = Math.cos(angle) * maxEyeMove * lookIntensity;
            const targetFocusY = Math.sin(angle) * maxEyeMove * lookIntensity;
            
            // Lerp suave para o alvo
            this.faceParams.focusOffset.x = Phaser.Math.Linear(this.faceParams.focusOffset.x, targetFocusX, 0.2);
            this.faceParams.focusOffset.y = Phaser.Math.Linear(this.faceParams.focusOffset.y, targetFocusY, 0.2);
        } else {
            // Retorna suavemente ao centro
            this.faceParams.focusOffset.x = Phaser.Math.Linear(this.faceParams.focusOffset.x, 0, 0.1);
            this.faceParams.focusOffset.y = Phaser.Math.Linear(this.faceParams.focusOffset.y, 0, 0.1);
        }

        // Interpolação dos parâmetros faciais (Lerp)
        const lerp = 0.2;
        this.faceParams.eyeOpenness = Phaser.Math.Linear(this.faceParams.eyeOpenness, target.open, lerp);
        this.faceParams.mouthCurve = Phaser.Math.Linear(this.faceParams.mouthCurve, target.curve, lerp);
        this.faceParams.browAngle = Phaser.Math.Linear(this.faceParams.browAngle, target.brow, lerp);
        this.faceParams.pupilSize = Phaser.Math.Linear(this.faceParams.pupilSize, target.pupil, lerp);
        this.faceParams.tremor = Phaser.Math.Linear(this.faceParams.tremor, target.tremor, lerp);
        this.faceParams.browY = Phaser.Math.Linear(this.faceParams.browY, -12 + target.y, lerp);
        
        this.drawFace();
    }
    
    applyExoticPhysicsEffects() {
        const time = Date.now();
        if (this.currentPhysics === 'entropia') {
            const glitchX = (Math.random() - 0.5) * 4;
            const glitchY = (Math.random() - 0.5) * 4;
            this.graphics.x = glitchX;
            this.graphics.y = glitchY;
            if (Math.random() < 0.08) {
                const glitchColors = [0xFF0000, 0x00FF00, 0x0000FF, 0x2a0033];
                this.entropyGlitchColor = glitchColors[Math.floor(Math.random() * glitchColors.length)];
                this.drawNeonShape(this.currentShape, this.entropyGlitchColor, this.currentChem);
            } else if (this.entropyGlitchColor) {
                this.entropyGlitchColor = null;
                this.drawNeonShape(this.currentShape, this.currentColor, this.currentChem);
            }
            if (this.emitter && Math.random() < 0.15) {
                this.emitter.explode(1);
            }
        } else if (this.currentPhysics === 'sonico') {
            const vibration = Math.sin(time * 0.02) * 2;
            const secondHarmonic = Math.sin(time * 0.04) * 1;
            this.graphics.x = vibration + secondHarmonic;
            this.graphics.y = Math.cos(time * 0.015) * 1.5;
            const pulseScale = 1 + Math.sin(time * 0.01) * 0.03;
            this.graphics.setScale(pulseScale);
        } else if (this.graphics.x !== 0 || this.graphics.y !== 0) {
            if (this.currentPhysics !== 'entropia' && this.currentPhysics !== 'sonico') {
                this.graphics.x = 0;
                this.graphics.y = 0;
                this.graphics.setScale(1);
            }
        }
    }

    addLifeEvent(type, detail) {
        try {
            const entry = { ts: Date.now(), type, detail: detail || '' };
            this.lifeLog.push(entry);
            if (this.scene && this.scene.golemRecords) {
                this.scene.game.events.emit('update-tree', this.scene.golemRecords);
            }
        } catch (e) { console.warn('addLifeEvent error', e); }
    }

    feed() {
        // Visual feedback for feeding: ensure chewing animation starts
        this.startEatingAnimation();
        
        // Restaura vitalidade completamente
        this.vitality = this.maxVitality;
        this.currentLife = this.vitality;
        
        // Cooldown de 2 segundos (tempo real, não simulado) para proteger contra decay
        // Isso garante que a barra de vida mostre 100% por tempo suficiente
        this.feedCooldown = 2000;
        
        // Atualiza a barra de vida IMEDIATAMENTE
        if (this.lifeBar) {
            const vitalityPct = this.vitality / this.maxVitality;
            this.lifeBar.width = 22 * vitalityPct;
            this.lifeBar.setFillStyle(this.visualDNA.bodyColor);
        }
        
        this.scene.tweens.add({ targets: this, scale: this.targetScale * 1.3, yoyo: true, duration: 200 });
        this.setActionExpression('feed', 2000);
        // small burst of particles from the mouth to reinforce feedback
        try {
            if (this.munchEmitter) {
                this.munchEmitter.explode(6, this.x, this.y + (12 * (this.faceScale || 1)));
            } else if (this.emitter) {
                this.emitter.explode(8);
            }
        } catch (e) { }
        this.addLifeEvent('feed', 'Nutriu - vitalidade restaurada (idade mantida)');
        this.speakContextual('feed');

        // stop chewing after setActionExpression duration
        try { this.scene.time.delayedCall(1200, () => this.stopEatingAnimation()); } catch(e) {}
    }

    burn() {
        // Já está queimando? Não aplica de novo
        if (this.isOnFire) return;
        
        this.isOnFire = true;
        this.addLifeEvent('burn', 'PEGOU FOGO! 🔥');
        this.speakContextual('burn');
        this.setActionExpression('burn', 5000);
        
        // ═══════════════════════════════════════════════════════════════════
        // ANIMAÇÃO DE FOGO - Partículas realistas
        // ═══════════════════════════════════════════════════════════════════
        const fireColors = [0xff4400, 0xff6600, 0xff8800, 0xffaa00, 0xffcc00];
        
        this.fireEmitter = this.scene.add.particles(0, 0, 'pixel', {
            follow: this,
            speed: { min: 30, max: 80 },
            angle: { min: 250, max: 290 }, // Fogo sobe
            scale: { start: 0.8 * this.targetScale, end: 0 },
            lifespan: { min: 300, max: 600 },
            blendMode: 'ADD',
            tint: fireColors,
            quantity: 3,
            frequency: 50,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Circle(0, 0, 20 * this.targetScale)
            }
        });
        
        // Fumaça
        this.smokeEmitter = this.scene.add.particles(0, 0, 'pixel', {
            follow: this,
            speed: { min: 10, max: 30 },
            angle: { min: 260, max: 280 },
            scale: { start: 0.4 * this.targetScale, end: 1.2 * this.targetScale },
            alpha: { start: 0.4, end: 0 },
            lifespan: { min: 500, max: 1000 },
            tint: [0x333333, 0x444444, 0x555555],
            quantity: 1,
            frequency: 100
        });
        
        // ═══════════════════════════════════════════════════════════════════
        // DANO POR FOGO - Reduz vida gradualmente
        // ═══════════════════════════════════════════════════════════════════
        const fireDamagePerTick = this.maxVitality * 0.08; // 8% da vida por tick
        const fireDuration = 5000; // 5 segundos de fogo
        const tickInterval = 500; // Dano a cada 0.5s
        let ticksRemaining = Math.floor(fireDuration / tickInterval);
        
        this.fireDamageEvent = this.scene.time.addEvent({
            delay: tickInterval,
            repeat: ticksRemaining - 1,
            callback: () => {
                if (!this.active || !this.isOnFire) return;
                
                // Aplica dano
                this.vitality = Math.max(0, this.vitality - fireDamagePerTick);
                
                // Flash vermelho
                if (this.graphics) {
                    this.scene.tweens.add({
                        targets: this.graphics,
                        alpha: 0.3,
                        yoyo: true,
                        duration: 100
                    });
                }
                
                // Morte por fogo
                if (this.vitality <= 0) {
                    this.stopFire();
                    this.die();
                }
            }
        });
        
        // ═══════════════════════════════════════════════════════════════════
        // PÂNICO - Corre desesperadamente APÓS pegar fogo
        // ═══════════════════════════════════════════════════════════════════
        // Pequeno delay para mostrar a reação de surpresa primeiro
        this.scene.time.delayedCall(300, () => {
            if (!this.active || !this.isOnFire) return;
            
            // Velocidade de pânico (3x mais rápido)
            this.panicSpeed = this.baseSpeed * 3;
            this.isPanicking = true;
            
            // Movimento caótico
            this.panicEvent = this.scene.time.addEvent({
                delay: 200,
                loop: true,
                callback: () => {
                    if (!this.active || !this.isOnFire || !this.isPanicking) return;
                    
                    // Direção aleatória
                    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                    const vx = Math.cos(angle) * this.panicSpeed;
                    const vy = Math.sin(angle) * this.panicSpeed;
                    
                    if (this.body) {
                        this.body.setVelocity(vx, vy);
                    }
                }
            });
        });
        
        // ═══════════════════════════════════════════════════════════════════
        // FIM DO FOGO - Para após duração
        // ═══════════════════════════════════════════════════════════════════
        this.scene.time.delayedCall(fireDuration, () => {
            this.stopFire();
        });
    }
    
    stopFire() {
        if (!this.isOnFire) return;
        
        this.isOnFire = false;
        this.isPanicking = false;
        
        // Para emitters de fogo
        if (this.fireEmitter) {
            this.fireEmitter.stop();
            this.scene.time.delayedCall(600, () => {
                if (this.fireEmitter) {
                    this.fireEmitter.destroy();
                    this.fireEmitter = null;
                }
            });
        }
        
        if (this.smokeEmitter) {
            this.smokeEmitter.stop();
            this.scene.time.delayedCall(1000, () => {
                if (this.smokeEmitter) {
                    this.smokeEmitter.destroy();
                    this.smokeEmitter = null;
                }
            });
        }
        
        // Para eventos
        if (this.fireDamageEvent) {
            this.fireDamageEvent.remove();
            this.fireDamageEvent = null;
        }
        
        if (this.panicEvent) {
            this.panicEvent.remove();
            this.panicEvent = null;
        }
        
        // Volta à velocidade normal
        if (this.body) {
            this.body.setVelocity(0, 0);
        }
        
        // Suspiro de alívio se sobreviveu
        if (this.active && this.vitality > 0) {
            this.speak('*ufa*... sobrevivi...');
            this.addLifeEvent('survived_fire', 'Sobreviveu ao fogo! 💨');
        }
    }

    kill() {
        this.addLifeEvent('killed', 'Eliminado manualmente');
        
        // Emite evento para tutorial e outros sistemas
        if (this.scene?.game?.events) {
            this.scene.game.events.emit('golem-killed', { golemId: this.id });
        }
        
        this.currentLife = 0; this.die();
    }

    /**
     * 🎨 Redesenha o Golem com seus atributos visuais atuais
     * Usado após mutações para aplicar novas cores
     */
    redraw() {
        // Atualiza cor do corpo se visualDNA.bodyColor mudou
        if (this.visualDNA && this.visualDNA.bodyColor !== undefined) {
            this.currentColor = this.visualDNA.bodyColor;
        }
        
        // Redesenha a forma
        this.drawNeonShape(this.currentShapeType, this.currentColor, this.currentChem);
        
        // Atualiza o emitter de partículas
        if (this.emitter) {
            this.emitter.stop();
            this.emitter.destroy();
            this.emitter = this.scene.add.particles(0, 0, 'pixel', {
                speed: 20 * this.targetScale,
                scale: { start: 0.4 * this.targetScale, end: 0 },
                blendMode: 'ADD', lifespan: 600, 
                tint: this.visualDNA.auraColor || this.currentColor, 
                quantity: 1
            });
            this.emitter.startFollow(this);
        }
        
        // Atualiza a barra de vida
        if (this.lifeBar) {
            this.lifeBar.setFillStyle(this.currentColor);
        }
        
        // Redesenha a face (que usa eyeColor)
        this.drawFace();
        
        this.addLifeEvent('redraw', 'Aparência atualizada');
    }

    freeze() {
        this.isFrozen = true;
        this.body.setVelocity(0);
        
        // Salva cor original e aplica cor de gelo
        this._originalColor = this.currentColor;
        this.currentColor = 0x0088ff;
        this.drawNeonShape(this.currentShapeType, this.currentColor, this.currentChem);
        
        this.setActionExpression('freeze', 5000);
        this.addLifeEvent('freeze', 'Congelado temporariamente');
        this.speakContextual('freeze');
        
        this.scene.time.delayedCall(5000, () => {
            if (this.active) {
                this.isFrozen = false;
                // Restaura cor original
                this.currentColor = this._originalColor || this.visualDNA.bodyColor;
                this.drawNeonShape(this.currentShapeType, this.currentColor, this.currentChem);
                this.startRoaming();
            }
        });
    }

    mutate() {
        const newSides = 3 + Math.floor(Math.random() * 7);
        const newParams = { sides: newSides, roughness: Math.random(), seed: Math.random() * 100 };
        this.setActionExpression('mutate', 2000);
        this.speakContextual('mutate');
        this.scene.tweens.add({
            targets: this, scaleX: 0.1, scaleY: 0.1, duration: 200, yoyo: true,
            onYoyo: () => {
                this.proceduralParams = newParams;
                this.currentColor = Math.random() * 0xffffff;
                this.drawNeonShape('procedural', this.currentColor, this.currentChem);
                // Recriar emitter com nova cor (ParticleEmitter não tem setTint)
                if (this.emitter) {
                    this.emitter.stop();
                    this.emitter.destroy();
                    this.emitter = this.scene.add.particles(0, 0, 'pixel', {
                        speed: 20 * this.targetScale,
                        scale: { start: 0.4 * this.targetScale, end: 0 },
                        blendMode: 'ADD', lifespan: 600, tint: this.currentColor, quantity: 1
                    });
                    this.emitter.startFollow(this);
                }
                this.lifeBar.setFillStyle(this.currentColor);
                this.addLifeEvent('mutate', `Mutado: sides=${newSides}`);
            }
        });
    }

    startEatingAnimation() {
        if (this.isBeingFed) return;
        this.isBeingFed = true;
        // Make the face go into the feed expression
        this.setActionExpression('feed', 999999);

        // Create a subtle eater emitter for crumbs if not present
        try {
            if (!this.munchEmitter && this.scene) {
                this.munchEmitter = this.scene.add.particles(0, 0, 'pixel', {
                    speed: 26 * this.targetScale,
                    scale: { start: 0.28 * this.targetScale, end: 0 },
                    blendMode: 'ADD', lifespan: 400, tint: this.visualDNA.detailColor, quantity: 1
                });
            }
            if (this.munchEmitter) {
                this.munchEmitter.startFollow(this, 0, 12 * (this.faceScale || 1));
            }
        } catch(e) { }

        // Animates chewing phase: 0..1 continuous
        if (!this.eatingTween && this.scene) {
            this.eatingTween = this.scene.tweens.add({
                targets: this,
                eatingChew: 1,
                duration: 220,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Also animate the mouth curve for a more fluid chew
        if (!this.chewMouthTween && this.scene) {
            this.chewMouthTween = this.scene.tweens.add({
                targets: this.faceParams,
                mouthCurve: 1.2,
                duration: 180,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Periodic munch sound and particle bursts (tighter rhythm while chewing)
        if (!this.eatingAudioEvent && this.scene) {
            this.eatingAudioEvent = this.scene.time.addEvent({ delay: 160, loop: true, callback: () => {
                try { this.playMunchSound(); } catch(e) {}
                try { if (this.munchEmitter) this.munchEmitter.explode(3, this.x, this.y + (14 * (this.faceScale || 1))); } catch(e) {}
            }});
        }
    }

    stopEatingAnimation() {
        if (!this.isBeingFed) return;
        this.isBeingFed = false;

        try {
            if (this.eatingTween) { this.eatingTween.stop(); this.eatingTween = null; }
            if (this.chewMouthTween) { this.chewMouthTween.stop(); this.chewMouthTween = null; }
            if (this.eatingAudioEvent) { this.eatingAudioEvent.remove(); this.eatingAudioEvent = null; }
            if (this.munchEmitter) { this.munchEmitter.stop(); this.munchEmitter.destroy(); this.munchEmitter = null; }
            this.eatingChew = 0;
            // reset faceParams mouthCurve smoothing
            if (this.faceParams) this.faceParams.mouthCurve = Phaser.Math.Linear(this.faceParams.mouthCurve, 0.5, 0.6);
        } catch (e) { }

        // Revert expression if it was exclusively feed
        if (this.expressionState && this.expressionState.action === 'feed') {
            this.expressionState.action = null;
        }
    }
    
    startLifeCycle() {
        this.currentScale = 0.5;
        this.setScale(this.targetScaleX * this.currentScale, this.targetScaleY * this.currentScale);
        this._lastVelocity = { x: 0, y: 0 };
        this.lifeTimer = this.scene.time.addEvent({ delay: 100, loop: true, callback: () => {
            if (this.scene.isPaused) {
                if (this.body && this.body.velocity) {
                    if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
                        this._lastVelocity = { x: this.body.velocity.x, y: this.body.velocity.y };
                    }
                    this.body.setVelocity(0, 0);
                }
                return; 
            } else {
                if (this._lastVelocity && (this._lastVelocity.x !== 0 || this._lastVelocity.y !== 0)) {
                    if (this.body && this.body.velocity.x === 0 && this.body.velocity.y === 0) {
                        this.body.setVelocity(this._lastVelocity.x, this._lastVelocity.y);
                    }
                    this._lastVelocity = { x: 0, y: 0 };
                }
            }
            const simSpeed = this.scene.simulationSpeed || 1.0;
            const deltaTime = 100 * simSpeed; 
            this.age += deltaTime;
            
            // Decrementa cooldown de alimentação (tempo real, não simulado)
            if (this.feedCooldown > 0) {
                this.feedCooldown -= 100; // 100ms por tick (tempo real)
            }
            
            // Só decai vitalidade se não estiver em cooldown de alimentação
            if (this.feedCooldown <= 0) {
                // Decay mais lento: ~0.5 por tick = 50000/0.5 = 100 segundos para morrer de fome
                const vitalityDecay = deltaTime * 0.5; 
                this.vitality -= vitalityDecay;
                this.vitality = Math.max(0, this.vitality);
            }
            
            this.currentLife = this.vitality;
            const vitalityPct = this.vitality / this.maxVitality;
            this.lifeBar.width = 22 * vitalityPct;
            
            // Idade controla fase de vida (criança/adulto/idoso), não a barra
            const agePct = this.age / this.maxLifespan; 
            this.updateLifePhase(agePct);
            
            // Barra vermelha quando vitalidade baixa
            if (vitalityPct < 0.2) {
                this.lifeBar.setFillStyle(0xff0000);
            } else {
                this.lifeBar.setFillStyle(this.visualDNA.bodyColor);
            }
            
            // Morte: APENAS quando vitalidade chega a ZERO
            // Velhice agora apenas deixa o Golem mais fraco, não mata diretamente
            if (this.vitality <= 0) {
                const deathReason = this.age >= this.maxLifespan 
                    ? 'Morreu de velhice - corpo fraco demais'
                    : 'Morreu de fome - vitalidade esgotada';
                this.addLifeEvent('died', deathReason);
                this.die();
            }
        }});
    }
    
    updateLifePhase(agePct) {
        if (agePct <= 0.2) {
            const growthProgress = agePct / 0.2; 
            this.currentScale = Phaser.Math.Linear(0.5, 1.0, growthProgress);
            this.setScale(this.targetScaleX * this.currentScale, this.targetScaleY * this.currentScale);
            this.lifePhase = 'child';
            if (growthProgress > 0.8 && !this.hasSpokenGrowth) {
                this.hasSpokenGrowth = true;
            }
        } else if (agePct <= 0.8) {
            if (!this.isAdult) {
                this.isAdult = true;
                this.currentScale = 1.0;
                this.setScale(this.targetScaleX, this.targetScaleY);
            }
            this.lifePhase = 'adult';
            if (this.graphics) {
                this.graphics.alpha = 1.0;
            }
        } else {
            this.lifePhase = 'old';
            const ageProgress = (agePct - 0.8) / 0.2; 
            if (!this.scene.isPaused) {
                const slowdownFactor = Phaser.Math.Linear(1.0, 0.5, ageProgress);
                if (this.body && this.baseSpeed) {
                    const currentSpeed = this.body.velocity.length();
                    if (currentSpeed > 0) {
                        const targetSpeed = this.baseSpeed * slowdownFactor;
                        this.body.velocity.normalize().scale(targetSpeed);
                    }
                }
            }
            if (this.graphics) {
                this.graphics.alpha = Phaser.Math.Linear(1.0, 0.6, ageProgress);
            }
            if (this.emitter) {
                this.emitter.setAlpha(Phaser.Math.Linear(1.0, 0.3, ageProgress));
            }
            if (this.pulseTween && ageProgress > 0.5 && !this.scene.isPaused) {
                this.pulseTween.timeScale = 0.6 + Math.random() * 0.4; 
            }
            if (ageProgress > 0.7 && !this.hasSpokenDying) {
                this.hasSpokenDying = true;
                this.expressionState.mood = 'dying';
                this.drawFace();
                if (Math.random() < 0.5 && !this.scene.isPaused) {
                    this.scene.time.delayedCall(500, () => this.speakContextual('dying'));
                }
            }
        }
    }
    
    onSimulationSpeedChanged(speed) {
        const isPaused = (speed === 0);
        const safeSpeed = isPaused ? 1 : speed; 
        if (this.lifeTimer) {
            this.lifeTimer.timeScale = safeSpeed;
        }
        if (this.expressionTimer) {
            this.expressionTimer.timeScale = isPaused ? 0.5 : safeSpeed; 
        }
        if (this.pulseTween) {
            this.pulseTween.timeScale = isPaused ? 0.3 : safeSpeed;
        }
        if (this.emitter) {
            if (isPaused) {
                this.emitter.setFrequency(200); 
            } else {
                this.emitter.setFrequency(100 / speed);
            }
        }
    }

    startRoaming() {
        if(!this.body || this.isFrozen) return;
        this.body.setVelocity(Phaser.Math.Between(-this.baseSpeed, this.baseSpeed), Phaser.Math.Between(-this.baseSpeed, this.baseSpeed));
        this.roamingTimer = this.scene.time.addEvent({ delay: 2000, loop: true, callback: () => {
            if(this.active && this.scene && !this.isDragging && !this.isFrozen && this.body) {
                // Integra comportamento autônomo no ciclo de roaming
                this.updateAutonomousBehavior();
                
                // Movimento padrão só se não estiver em estado autônomo especial
                if (this.autonomy.state === 'idle') {
                    this.body.setVelocity(Phaser.Math.Between(-this.baseSpeed, this.baseSpeed), Phaser.Math.Between(-this.baseSpeed, this.baseSpeed));
                }
            }
        }});
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SISTEMA DE AUTONOMIA - Comportamento Emergente
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Calcula nível de agressividade baseado na física
     * Fogo/Radiação = agressivo, Luz/Frio = pacífico
     */
    calculateAggression() {
        const aggressionMap = {
            'calor': 0.9,
            'radiacao': 0.8,
            'eletricidade': 0.7,
            'entropia': 0.85,
            'magnetismo': 0.5,
            'gravidade': 0.4,
            'sonico': 0.5,
            'luz': 0.2,
            'frio': 0.3
        };
        return aggressionMap[this.currentPhysics] || 0.5;
    }
    
    /**
     * Calcula atratividade baseado na química
     * Ouro/Cristal = atraente, Urânio = repelente
     */
    calculateAttractiveness() {
        const attractMap = {
            'ouro': 0.95,
            'cristal': 0.85,
            'bismuto': 0.7,
            'carbono': 0.5,
            'silicio': 0.6,
            'ferro': 0.4,
            'mercurio': 0.5,
            'uranio': 0.2
        };
        return attractMap[this.currentChem] || 0.5;
    }
    
    /**
     * Gera assinatura vocal única baseada em atributos
     */
    generateVoiceSignature() {
        // Base pitch: Golems pequenos = agudo, grandes = grave
        let basePitch = 500 - (this.targetScale * 200);
        
        // Modificador por física
        const physicsMod = {
            'eletricidade': 150,
            'gravidade': -150,
            'luz': 80,
            'calor': 50,
            'frio': -50,
            'radiacao': 100,
            'magnetismo': 0,
            'entropia': -200,
            'sonico': 180
        };
        basePitch += physicsMod[this.currentPhysics] || 0;
        
        // Variação individual (DNA único)
        basePitch += (Math.random() - 0.5) * 80;
        
        // Tipo de onda por física
        const waveTypes = {
            'eletricidade': 'square',
            'luz': 'sine',
            'calor': 'sawtooth',
            'frio': 'triangle',
            'gravidade': 'sine',
            'radiacao': 'sawtooth',
            'magnetismo': 'square',
            'entropia': 'sawtooth',
            'sonico': 'sine'
        };
        
        return {
            basePitch: Phaser.Math.Clamp(basePitch, 120, 800),
            waveType: waveTypes[this.currentPhysics] || 'square',
            speechSpeed: this.targetScale < 0.8 ? 1.3 : (this.targetScale > 1.3 ? 0.7 : 1.0),
            vibrato: this.currentPhysics === 'eletricidade' ? 20 : 5
        };
    }
    
    /**
     * Verifica se dois Golems são compatíveis para reprodução
     * MAIS PERMISSIVO: qualquer par pode tentar, exceto opostos de física
     */
    isCompatibleForBreeding(other) {
        if (!other || !other.active || other === this) return false;
        // Apenas golems 'old' não podem reproduzir; recém-nascidos agora podem participar
        if (other.lifePhase === 'old' || this.lifePhase === 'old') return false;
        if (other.isFrozen || this.isFrozen) return false;
        
        // Física oposta = NÃO PODE (são inimigos)
        const PHYSICS_OPPOSITES = {
            'calor': 'frio', 'frio': 'calor',
            'luz': 'entropia', 'entropia': 'luz',
            'eletricidade': 'gravidade', 'gravidade': 'eletricidade'
        };
        const isOpposite = PHYSICS_OPPOSITES[this.currentPhysics] === other.currentPhysics;
        
        // Se são opostos físicos, não podem reproduzir (são inimigos!)
        if (isOpposite) return false; // qualquer não-inimigo pode tentar
        
        // Removida restrição de vitalidade — apenas 'old' bloqueia a reprodução agora.
        
        // Qualquer outro par pode tentar reproduzir
        // Bônus de compatibilidade (para log/debug) mas não bloqueia
        const sameShape = this.currentShapeType === other.currentShapeType;
        const samePhysics = this.currentPhysics === other.currentPhysics;
        const sameChem = this.currentChem === other.currentChem;
        
        // Debug: mostra compatibilidade
        // console.log(`[COMPAT] shape:${sameShape} phys:${samePhysics} chem:${sameChem}`);
        
        return true; // Qualquer não-inimigo pode tentar
    }
    
    /**
     * Verifica se dois Golems são inimigos naturais
     */
    isEnemyOf(other) {
        if (!other || !other.active || other === this) return false;
        
        const PHYSICS_OPPOSITES = {
            'calor': 'frio', 'frio': 'calor',
            'luz': 'entropia', 'entropia': 'luz',
            'eletricidade': 'gravidade', 'gravidade': 'eletricidade',
            'radiacao': 'frio', 'magnetismo': 'entropia'
        };
        
        return PHYSICS_OPPOSITES[this.currentPhysics] === other.currentPhysics;
    }
    
    /**
     * Ciclo de decisão autônoma - chamado pelo roaming timer (a cada 2s)
     */
    updateAutonomousBehavior() {
        if (!this.active || this.isFrozen || this.isDragging || !this.scene) return;
        if (this.scene.isPaused) return;
        
        // Decrementa cooldowns (2000ms por ciclo)
        const dt = 2000;
        if (this.autonomy.cooldowns.breeding > 0) this.autonomy.cooldowns.breeding -= dt;
        if (this.autonomy.cooldowns.combat > 0) this.autonomy.cooldowns.combat -= dt;
        if (this.autonomy.cooldowns.socialSpeak > 0) this.autonomy.cooldowns.socialSpeak -= dt;
        if (this.scene.globalBreedingCooldown > 0) this.scene.globalBreedingCooldown -= dt;
        
        // Scan de outros Golems próximos - raio maior para mais interações
        const others = this.scene.golemsGroup?.getChildren() || [];
        const scanRadius = 350; // Aumentado de 180 para 350
        
        let closestEnemy = null;
        let closestMate = null;
        let enemyDist = Infinity;
        let mateDist = Infinity;
        
        for (const other of others) {
            if (other === this || !other.active) continue;
            const dist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
            if (dist > scanRadius) continue;
            
            // Verifica inimigo
            if (this.isEnemyOf(other) && dist < enemyDist) {
                closestEnemy = other;
                enemyDist = dist;
            }
            
            // Verifica parceiro
            if (this.isCompatibleForBreeding(other) && dist < mateDist) {
                // Checa limites de reprodução por indivíduo
                const myCanBreed = (this.autonomy.breedCount || 0) < (this.autonomy.maxBreeds || 0);
                const otherCanBreed = (other.autonomy && (other.autonomy.breedCount || 0) < (other.autonomy.maxBreeds || 0));
                if (myCanBreed && otherCanBreed) {
                    closestMate = other;
                    mateDist = dist;
                }
            }
        }
        
        // ═══ DECISÃO DE COMPORTAMENTO ═══
        // Debug: log para verificar se está rodando
        // console.log(`[AUTONOMY] ${this.nameText?.text || 'Golem'} scanning... enemies:${closestEnemy?'YES':'no'} mates:${closestMate?'YES':'no'}`);
        
        // Prioridade 1: Combate (se tiver inimigo perto e for agressivo)
        if (closestEnemy && this.autonomy.cooldowns.combat <= 0) {
            // Probabilidade aumentada com baseline (aggression + 15%), cap em 0.98
            const fightChance = Math.min(0.98, this.autonomy.aggression * 1.0 + 0.15);
            const roll = Math.random();
            
            if (roll < fightChance) {
                console.log(`[COMBAT] ${this.nameText?.text || 'Golem'} atacando ${closestEnemy.nameText?.text || 'inimigo'}! (roll:${roll.toFixed(2)} < chance:${fightChance.toFixed(2)})`);
                this.startCombat(closestEnemy);
                return;
            }
        }
        
        // Prioridade 2: Cortejo (energia alta, adulto)
        const canBreed = this.autonomy.cooldowns.breeding <= 0 && (this.scene.globalBreedingCooldown || 0) <= 0;
        
        // Não permite cortejo apenas se algum dos dois for 'old' (exceto no tutorial)
        const isTutorialCase = (this.dataAttributes && this.dataAttributes.__tutorialSpawn) || (typeof window !== 'undefined' && window.tutorial && window.tutorial.isActive);
        if (closestMate && (isTutorialCase || (this.lifePhase !== 'old' && closestMate.lifePhase !== 'old')) && canBreed) {
            // Probabilidade aumentada: attractiveness * 0.7 (era * 0.5)
            const courtChance = this.autonomy.attractiveness * 0.7;
            const roll = Math.random();
            
            if (roll < courtChance) {
                console.log(`[COURT] ${this.nameText?.text || 'Golem'} cortejando ${closestMate.nameText?.text || 'parceiro'}! (roll:${roll.toFixed(2)} < chance:${courtChance.toFixed(2)})`);
                this.startCourting(closestMate);
                return;
            }
        }
        
        // Estado padrão: idle
        this.autonomy.state = 'idle';
        this.autonomy.target = null;
    }
    
    /**
     * Inicia comportamento de cortejo
     */
    startCourting(target) {
        if (!target || !target.active) return;
        
        this.autonomy.state = 'courting';
        this.autonomy.target = target;
        
        // Expressão de amor em ambos
        this.setActionExpression('love', 3000);
        if (target.setActionExpression) target.setActionExpression('love', 2000);
        
        // Fala de cortejo
        if (this.autonomy.cooldowns.socialSpeak <= 0) {
            this.speakContextual('courting');
            this.autonomy.cooldowns.socialSpeak = 12000; // mais tempo entre falas
        }
        // Move em direção ao parceiro
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const speed = this.baseSpeed * 1.5; // Mais rápido para chegar logo
        if (this.body) this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        
        // Verifica se chegou perto o suficiente para acasalar
        const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        const breedDist = 80 * Math.max(this.targetScale, 0.5); // Distância mais generosa
        
        if (dist < breedDist) {
            console.log(`[BREED] ${this.nameText?.text || 'Golem'} + ${target.nameText?.text || 'parceiro'} reproduzindo!`);
            
            // Atualiza contador de reprodução para ambos os pais
            this.autonomy.breedCount = (this.autonomy.breedCount || 0) + 1;
            if (target.autonomy) target.autonomy.breedCount = (target.autonomy.breedCount || 0) + 1;
            console.log(`[BREED COUNT] ${this.nameText?.text || 'Golem'} (${this.autonomy.breedCount}/${this.autonomy.maxBreeds}), ${target.nameText?.text || 'parceiro'} (${target.autonomy.breedCount}/${target.autonomy.maxBreeds})`);
            if (this.autonomy.breedCount >= this.autonomy.maxBreeds) {
                console.log(`[BREED LIMIT] ${this.nameText?.text || 'Golem'} atingiu o limite de reprodução`);
                this.setActionExpression('sad', 1200);
            }
            if (target.autonomy && target.autonomy.breedCount >= target.autonomy.maxBreeds) {
                if (target.setActionExpression) target.setActionExpression('sad', 1000);
                console.log(`[BREED LIMIT] ${target.nameText?.text || 'Golem'} atingiu o limite de reprodução`);
            }
            
            // Tenta reproduzir!
            this.autonomy.cooldowns.breeding = 20000; // 20s cooldown pessoal (era 30s)
            if (target.autonomy) target.autonomy.cooldowns.breeding = 20000;
            this.scene.globalBreedingCooldown = 8000; // 8s cooldown global (era 10s)
            
            if (this.scene.triggerBreeding) {
                this.scene.triggerBreeding(this, target);
            }
            
            this.autonomy.state = 'idle';
            this.autonomy.target = null;
        } else {
            // Se ainda não chegou, agenda próxima verificação
            this.scene.time.delayedCall(500, () => {
                if (this.active && target.active && this.autonomy.state === 'courting') {
                    this.startCourting(target); // Continua perseguindo
                }
            });
        }
    }
    
    /**
     * Inicia comportamento de combate
     */
    startCombat(enemy) {
        if (!enemy || !enemy.active) return;
        
        this.autonomy.state = 'combat';
        this.autonomy.target = enemy;
        
        // Expressão agressiva em ambos
        this.setActionExpression('angry', 2000);
        if (enemy.setActionExpression) enemy.setActionExpression('angry', 1500);
        
        // Fala de combate
        if (this.autonomy.cooldowns.socialSpeak <= 0) {
            this.speakContextual('combat_start');
            this.autonomy.cooldowns.socialSpeak = 10000; // reduzir frequência de falas em combate
        }
        
        // Bump Attack! Acelera em direção ao inimigo
        const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
        const chargeSpeed = this.baseSpeed * 3.5; // Mais rápido
        if (this.body) this.body.setVelocity(Math.cos(angle) * chargeSpeed, Math.sin(angle) * chargeSpeed);
        
        // Cooldown de combate imediato (reduzido para aumentar frequência)
        this.autonomy.cooldowns.combat = 3000;
        
        // Verifica colisão para knockback com delay
        this.scene.time.delayedCall(300, () => {
            if (!this.active || !enemy.active) return;
            
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            const hitDist = 100 * Math.max(this.targetScale, 0.5); // Distância mais generosa
            
            if (dist < hitDist) {
                this.performCombatHit(enemy);
            } else {
                // Ainda longe? Continua perseguindo
                if (this.autonomy.state === 'combat') {
                    const newAngle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
                    if (this.body) this.body.setVelocity(Math.cos(newAngle) * chargeSpeed, Math.sin(newAngle) * chargeSpeed);
                    
                    // Segunda tentativa de hit
                    this.scene.time.delayedCall(400, () => {
                        if (this.active && enemy.active && this.autonomy.state === 'combat') {
                            const d2 = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                            if (d2 < hitDist * 1.2) {
                                this.performCombatHit(enemy);
                            }
                        }
                        this.autonomy.state = 'idle';
                    });
                }
            }
        });
    }
    
    /**
     * Executa hit de combate com knockback e efeitos
     */
    performCombatHit(enemy) {
        if (!enemy || !enemy.active || !this.scene) return;
        
        // Knockback em ambos
        const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
        const knockbackForce = 200;
        
        // Empurra inimigo para longe
        if (enemy.body) {
            enemy.body.setVelocity(
                Math.cos(angle) * knockbackForce,
                Math.sin(angle) * knockbackForce
            );
        }
        
        // Recuo próprio
        if (this.body) {
            this.body.setVelocity(
                -Math.cos(angle) * knockbackForce * 0.5,
                -Math.sin(angle) * knockbackForce * 0.5
            );
        }
        
        // Dano leve em ambos
        const damage = 2000; // ~4% da vitalidade
        this.vitality = Math.max(0, this.vitality - damage * 0.5);
        enemy.vitality = Math.max(0, enemy.vitality - damage);
        
        // Expressão de dor
        this.setActionExpression('hurt', 500);
        enemy.setActionExpression('hurt', 800);
        
        // Fala de hit
        if (Math.random() < 0.6) {
            enemy.speakContextual('combat_hit');
        }
        
        // Efeito visual: faíscas/partículas
        this.createCombatEffect(enemy);
        
        // Som de impacto
        this.playCombatSound();
        
        // Reseta estado
        this.autonomy.state = 'idle';
        this.autonomy.target = null;
    }
    
    /**
     * Cria efeito visual de colisão de combate
     */
    createCombatEffect(enemy) {
        if (!this.scene) return;
        
        const midX = (this.x + enemy.x) / 2;
        const midY = (this.y + enemy.y) / 2;
        
        // Partículas de faísca
        const sparks = this.scene.add.particles(midX, midY, 'pixel', {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            tint: [0xffff00, 0xff8800, 0xffffff],
            lifespan: 300,
            blendMode: 'ADD',
            quantity: 15
        });
        
        // Círculo de impacto
        const impact = this.scene.add.circle(midX, midY, 20, 0xffffff, 0.8);
        this.scene.tweens.add({
            targets: impact,
            scale: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => impact.destroy()
        });
        
        // Limpa partículas após animação
        this.scene.time.delayedCall(400, () => {
            if (sparks) sparks.destroy();
        });
    }
    
    /**
     * Som de impacto de combate
     */
    playCombatSound() {
        this.initAudio();
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Som de impacto: ruído breve + tom grave
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    die() {
        // ══════════════════════════════════════════════════════════════════
        // PRIMEIRO: Limpa balão de fala IMEDIATAMENTE para evitar que fique na tela
        // ══════════════════════════════════════════════════════════════════
        this.clearSpeechBubble();
        
        // Para todos os tweens no Golem
        if (this.scene) {
            try { this.scene.tweens.killTweensOf(this); } catch(e) {}
        }
        
        // Remove todos os timers com safety
        try { if (this.lifeTimer) this.lifeTimer.remove(); } catch(e) {}
        try { if (this.expressionTimer) this.expressionTimer.remove(); } catch(e) {}
        try { if (this.roamingTimer) this.roamingTimer.remove(); } catch(e) {}
        try { if (this.emitter) this.emitter.stop(); } catch(e) {}
        try { if (this.body) this.body.setVelocity(0); } catch(e) {}
        
        // Limpa estado de fogo
        try { 
            this.isOnFire = false;
            this.isPanicking = false;
            if (this.fireEmitter) { this.fireEmitter.destroy(); this.fireEmitter = null; }
            if (this.smokeEmitter) { this.smokeEmitter.destroy(); this.smokeEmitter = null; }
            if (this.fireDamageEvent) { this.fireDamageEvent.remove(); this.fireDamageEvent = null; }
            if (this.panicEvent) { this.panicEvent.remove(); this.panicEvent = null; }
        } catch(e) {}
        
        // Timers de fala já removidos pelo clearSpeechBubble, mas garantir que estão nulos
        this.typewriterEvent = null;
        this.speechFadeTimer = null;
        this.speechUpdateEvent = null;
        // Remove trail se existir
        try { if (this.dragTrail) { this.dragTrail.destroy(); this.dragTrail = null; } } catch(e) {}
        
        // Ensure we stop any in-progress eating/feeding animation
        try { this.stopEatingAnimation(); } catch(e) { }
        // Detach event handlers
        try { if (this.scene && this.toolDragMoveHandler) this.scene.game.events.off('tool-drag-move', this.toolDragMoveHandler); } catch(e) {}
        try { if (this.scene && this.toolDragEndHandler) this.scene.game.events.off('tool-drag-end', this.toolDragEndHandler); } catch(e) {}
        // Remove pointermove and update handlers we added
        try { if (this.scene && this._pointerMoveHandler) this.scene.input.off('pointermove', this._pointerMoveHandler); } catch(e) {}
        try { if (this.scene && this._rotationUpdate) this.scene.events.off('update', this._rotationUpdate); } catch(e) {}
        // Remove social listener
        try { if (this.scene && this.golemSpokeHandler) this.scene.events.off('golem-spoke', this.golemSpokeHandler); } catch(e) {}
        this.isSpeaking = false;
        this.speechQueue = []; 
        this.expressionState.mood = 'dead';
        this.expressionState.action = null;
        this.drawFace();
        this.addLifeEvent('died', 'Fim do ciclo - dados perdidos');
        const msg = this.scene.add.text(this.x, this.y - 50, "DADOS PERDIDOS", { fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ff0000' }).setOrigin(0.5);
        this.scene.tweens.add({ targets: msg, y: this.y - 80, alpha: 0, duration: 2000 });
        this.scene.tweens.add({ targets: this, alpha: 0, scale: 0.1, duration: 1000, onComplete: () => { msg.destroy(); if (this.emitter) this.emitter.destroy(); if (this.faceGraphics) this.faceGraphics.destroy(); this.destroy(); } });
    }

    setBreedingExpression() {
        this.setActionExpression('breed', 1500);
        this.speakContextual('breed');
    }

    initAudio() {
        if (this.audioContext) return;

        // Preferir o AudioContext centralizado do UISoundSystem quando disponível,
        // assim todos os SFX compartilham o mesmo ganho SFX e respeitam o volume global.
        try {
            if (window.uiSounds && typeof window.uiSounds.ensureContext === 'function' && window.uiSounds.ensureContext()) {
                // Usa o mesmo AudioContext do sistema de som e o gain de SFX
                this.audioContext = window.uiSounds.audioContext;
                this.masterGain = window.uiSounds.getSfxGain();
                return;
            }

            // Fallback: cria um AudioContext local (compatibilidade)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.15;
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.warn('Web Audio API não disponível:', e);
        }
    }

    playVoiceTone() {
        this.initAudio();
        if (!this.audioContext) return;
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const basePitch = 500 - (this.targetScale * 200); 
        const pitch = Phaser.Math.Clamp(basePitch, 150, 600);
        const pitchVariation = pitch + Phaser.Math.Between(-50, 50);
        let waveType = 'square'; 
        switch (this.currentPhysics) {
            case 'eletricidade': waveType = 'square'; break;
            case 'luz': waveType = 'sine'; break;
            case 'calor': waveType = 'sawtooth'; break;
            case 'frio': waveType = 'triangle'; break;
            case 'gravidade': waveType = 'sine'; break;
            case 'magnetismo': waveType = 'square'; break;
            case 'radiacao': waveType = 'sawtooth'; break;
            default: waveType = 'square';
        }
        const osc = ctx.createOscillator();
        osc.type = waveType;
        osc.frequency.setValueAtTime(pitchVariation, now);
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.6, now + 0.01);  // aumentado para voz mais alta
        gainNode.gain.linearRampToValueAtTime(0, now + 0.06);    
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.07); 
    }

    playVoiceBeep() {
        this.initAudio();
        if (!this.audioContext) return;
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // ═══ USA ASSINATURA VOCAL ÚNICA DO GOLEM ═══
        const sig = this.voiceSignature || { basePitch: 400, waveType: 'square', vibrato: 5 };
        
        // Pitch base da assinatura + variação
        let basePitch = sig.basePitch;
        
        // Modificador por fase de vida
        if (this.lifePhase === 'child') {
            basePitch += 150; // Crianças mais agudas
        } else if (this.lifePhase === 'old') {
            basePitch -= 60; // Idosos mais graves
        }
        
        // Variação aleatória por beep
        const pitch = Phaser.Math.Clamp(basePitch + Phaser.Math.Between(-40, 40), 100, 950);
        
        const osc = ctx.createOscillator();
        osc.type = sig.waveType;
        osc.frequency.setValueAtTime(pitch, now);
        
        // Adiciona vibrato para personalidade
        if (sig.vibrato > 0) {
            const vibrato = ctx.createOscillator();
            const vibratoGain = ctx.createGain();
            vibrato.frequency.value = 8; // 8Hz de modulação
            vibratoGain.gain.value = sig.vibrato;
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            vibrato.start(now);
            vibrato.stop(now + 0.06);
        }
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.008);  // aumento de volume
        gainNode.gain.exponentialRampToValueAtTime(0.02, now + 0.05); 
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.055);
        
        // ═══ LIP SYNC: Atualiza fase da boca ═══
        if (this.isSpeaking) {
            this.lipSyncPhase = (this.lipSyncPhase + this.lipSyncSpeed) % 1;
        }
    }

    playMunchSound() {
        this.initAudio();
        if (!this.audioContext) return;
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const pitch = Phaser.Math.Between(300, 650);
        osc.frequency.setValueAtTime(pitch, now);
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.006);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // Drag trail: draw dotted/gummy line between drag origin and current position
    _updateDragTrail() {
        if (!this.dragTrail || !this._dragOrigin) return;
        try {
            const g = this.dragTrail;
            g.clear();
            const color = (this._dragTrailColor === 'green') ? 0x00ff88 : 0xff4444;
            const alpha = (this._dragTrailColor === 'green') ? 0.95 : 0.85;

            // Draw origin blob
            g.fillStyle(color, 0.8);
            g.fillCircle(this._dragOrigin.x, this._dragOrigin.y - 10, 6);

            // Dotted / goo line: place small circles along the line
            const dx = this.x - this._dragOrigin.x;
            const dy = this.y - this._dragOrigin.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const step = 14; // spacing between dots
            const count = Math.max(2, Math.floor(dist / step));
            for (let i = 1; i <= count; i++) {
                const t = i / (count + 1);
                const nx = this._dragOrigin.x + dx * t;
                const ny = this._dragOrigin.y + dy * t;
                const size = 3 + Math.sin((t + (Date.now() / 300)) * Math.PI * 2) * 1.2;
                g.fillStyle(color, alpha * (0.7 + 0.3 * (1 - Math.abs(0.5 - t) * 2)));
                g.fillCircle(nx, ny, Math.abs(size));
            }

            // Tip blob at current position
            g.fillStyle(color, 1);
            g.fillCircle(this.x, this.y - 10, 6);

            // Outline around potential mate if green
            if (this._dragTrailColor === 'green') {
                g.lineStyle(2, 0xffffff, 0.6);
                g.strokeCircle(this.x, this.y - 10, 10);
            }
        } catch (e) {
            console.warn('dragTrail draw error', e);
        }
    }

    _clearDragTrail() {
        try {
            if (this.dragTrail) {
                try { this.dragTrail.destroy(); } catch(e) {}
                this.dragTrail = null;
            }
            this._dragOrigin = null;
            this._dragTrailColor = null;
        } catch (e) {}
    }

    // Humorous 'oops' sound when dropping in invalid spot
    playOopsSound() {
        this.initAudio();
        if (!this.audioContext) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Slide whistle style: quick glide + soft pitch bend
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.22);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.26);

        // Small playful noise 'slip' using triangle at end
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(240, now + 0.12);
        g2.gain.setValueAtTime(0.06, now + 0.12);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc2.connect(g2); g2.connect(this.masterGain);
        osc2.start(now + 0.12); osc2.stop(now + 0.28);
    }

    // Fun slingshot sound for playful return
    playSlingshotSound() {
        this.initAudio();
        if (!this.audioContext) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        // Short boing: quick up then settle
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(560, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.18);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.36, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain); gain.connect(this.masterGain);
        osc.start(now); osc.stop(now + 0.25);
    }

    // Slingshot back to origin with overshoot and oscillation
    slingBackToOrigin(ox, oy) {
        if (!this.scene) { this.startRoaming(); return; }
        // If origin not provided, fallback
        if (typeof ox !== 'number' || typeof oy !== 'number') { this.startRoaming(); return; }

        // Disable physics while tweening
        try { if (this.body) { this.body.setVelocity(0); this.body.enable = false; } } catch(e) {}

        const cx = this.x; const cy = this.y;
        const vx = ox - cx; const vy = oy - cy;
        const overshootFactor = 0.25;
        const targetX = ox + vx * overshootFactor;
        const targetY = oy + vy * overshootFactor;

        // Play slingshot sound
        try { this.playSlingshotSound(); } catch(e) {}

        // Main swoop with Back.Out for overshoot
        this.scene.tweens.add({
            targets: this,
            x: targetX, y: targetY,
            duration: 480,
            ease: 'Back.easeOut',
            onUpdate: () => {
                // update drag trail too for visual continuity
                if (this.dragTrail) this._updateDragTrail();
            },
            onComplete: () => {
                // Small settle oscillation using yoyo repeats
                this.scene.tweens.add({
                    targets: this,
                    x: ox, y: oy,
                    duration: 360,
                    ease: 'Sine.easeOut',
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => {
                        // re-enable physics and resume roaming
                        try { if (this.body) { this.body.enable = true; } } catch(e) {}
                        // If last trail color was red, play oops at end for clarity
                        try { if (this._dragTrailColor === 'red') { this.playOopsSound(); } } catch(e) {}
                        this._clearDragTrail();
                        this.startRoaming();
                    }
                });
            }
        });
    }

    /**
     * Emite corações flutuantes ao redor do Golem (efeito de carinho)
     * Usado quando o jogador faz petting/scrubbing rápido
     */
    emitHearts() {
        const heartCount = 3 + Math.floor(Math.random() * 2); // 3-4 corações
        
        for (let i = 0; i < heartCount; i++) {
            // Posição aleatória ao redor do Golem
            const angle = (Math.random() * Math.PI * 2);
            const dist = 30 + Math.random() * 20;
            const startX = this.x + Math.cos(angle) * dist;
            const startY = this.y + Math.sin(angle) * dist - 40;
            
            // Cria um texto com coração
            const heart = this.scene.add.text(startX, startY, '♥', {
                fontFamily: 'Arial',
                fontSize: '20px',
                fill: '#ff6b9d',
                fontStyle: 'bold'
            });
            heart.setOrigin(0.5, 0.5);
            heart.setDepth(100);
            
            // Animação: flutua para cima e desaparece
            this.scene.tweens.add({
                targets: heart,
                y: startY - 40,
                alpha: 0,
                duration: 1000,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    heart.destroy();
                }
            });
        }
    }

    speak(text) {
        if (!text) return;
        if (this.isSpeaking) {
            if (this.speechQueue.length < 1) {
                this.speechQueue.push(text);
            }
            return;
        }
        this.isSpeaking = true;
        
        // ═══════════════════════════════════════════════════════════════════
        // EMITE EVENTO SOCIAL - Outros Golems podem "ouvir" e responder
        // ═══════════════════════════════════════════════════════════════════
        if (this.scene && this.scene.events) {
            this.scene.events.emit('golem-spoke', {
                golemId: this.id,
                x: this.x,
                y: this.y,
                physicsId: this.currentPhysics || 'luz',
                text: text
            });
        }
        
        this.clearSpeechBubble();
        const fontSize = 7;
        const padding = 6;
        const maxTextWidth = 110;
        const tailHeight = 6;
        const shadowOffset = 3;
        const chamfer = 2; 
        const measureText = this.scene.add.text(0, 0, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: `${fontSize}px`,
            fill: '#000000',
            wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
            align: 'left',
            resolution: 2 
        });
        measureText.setVisible(false);
        const textBounds = measureText.getBounds();
        const realTextWidth = Math.ceil(textBounds.width);
        const realTextHeight = Math.ceil(textBounds.height);
        measureText.destroy();
        const bubbleWidth = realTextWidth + (padding * 2);
        const bubbleHeight = realTextHeight + (padding * 2);
        // Offset calculado com valor base fixo (20) - balão "flutua" logo acima da cabeça
        // Valor menor para parecer mais integrado e menos "flutuante"
        const offsetY = (20 * this.targetScale) + bubbleHeight + tailHeight - 5;
        this.speechContainer = this.scene.add.container(0, 0);
        this.speechContainer.setDepth(1000);
        this.speechBubble = this.scene.add.graphics();
        this.speechBubble.fillStyle(0x000000, 1);
        this.drawChamferedRect(this.speechBubble, shadowOffset, shadowOffset, bubbleWidth, bubbleHeight, chamfer);
        this.speechBubble.fillStyle(0xffffff, 1);
        this.drawChamferedRect(this.speechBubble, 0, 0, bubbleWidth, bubbleHeight, chamfer);
        this.speechBubble.lineStyle(1, 0x000000, 1);
        this.drawChamferedRectStroke(this.speechBubble, 0, 0, bubbleWidth, bubbleHeight, chamfer);
        const tailX = bubbleWidth / 2;
        const tailY = bubbleHeight;
        this.speechBubble.fillStyle(0x000000, 1);
        this.speechBubble.fillTriangle(
            tailX - 4 + shadowOffset, tailY,
            tailX + 4 + shadowOffset, tailY,
            tailX + shadowOffset, tailY + tailHeight
        );
        this.speechBubble.fillStyle(0xffffff, 1);
        this.speechBubble.fillTriangle(
            tailX - 4, tailY - 1,
            tailX + 4, tailY - 1,
            tailX, tailY + tailHeight
        );
        this.speechBubble.lineStyle(1, 0x000000, 1);
        this.speechBubble.lineBetween(tailX - 4, tailY - 1, tailX, tailY + tailHeight);
        this.speechBubble.lineBetween(tailX + 4, tailY - 1, tailX, tailY + tailHeight);
        this.speechBubble.setPosition(-bubbleWidth / 2, -bubbleHeight - tailHeight);
        this.speechContainer.add(this.speechBubble);
        this.speechText = this.scene.add.text(0, -bubbleHeight / 2 - tailHeight, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: `${fontSize}px`,
            fill: '#000000',
            wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
            align: 'left',
            resolution: 2
        }).setOrigin(0.5, 0.5);
        this.speechContainer.add(this.speechText);
        this.speechContainer.setAlpha(0);
        this.speechContainer.setScale(0.7, 0);
        this.scene.tweens.add({
            targets: this.speechContainer,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 120,
            ease: 'Back.easeOut'
        });
        this.speechUpdateEvent = this.scene.time.addEvent({
            delay: 16,
            loop: true,
            callback: () => {
                if (!this.active || !this.scene) {
                    if (this.speechUpdateEvent) {
                        this.speechUpdateEvent.remove();
                        this.speechUpdateEvent = null;
                    }
                    return;
                }
                if (this.speechContainer && this.active) {
                    this.speechContainer.setPosition(this.x, this.y - offsetY);
                }
            }
        });
        let charIndex = 0;
        let displayText = '';
        this.typewriterEvent = this.scene.time.addEvent({
            delay: 40,
            loop: true,
            callback: () => {
                if (!this.active || !this.scene) {
                    if (this.typewriterEvent) {
                        try { this.typewriterEvent.remove(); } catch(e) {}
                        this.typewriterEvent = null;
                    }
                    return;
                }
                if (charIndex < text.length) {
                    if (!this.speechText) return; // Safety check
                    displayText += text[charIndex];
                    this.speechText.setText(displayText);
                    if (charIndex % 2 === 0 && text[charIndex] !== ' ') {
                        this.playVoiceBeep();
                    }
                    charIndex++;
                } else {
                    if (this.typewriterEvent) {
                        try { this.typewriterEvent.remove(); } catch(e) {}
                        this.typewriterEvent = null;
                    }
                    if (!this.active || !this.scene) return;
                    this.speechFadeTimer = this.scene.time.delayedCall(2500, () => {
                        if (!this.active || !this.scene) return;
                        this.fadeOutSpeechBubble();
                    });
                }
            }
        });
    }

    drawChamferedRect(graphics, x, y, width, height, chamfer) {
        graphics.beginPath();
        graphics.moveTo(x + chamfer, y);
        graphics.lineTo(x + width - chamfer, y);
        graphics.lineTo(x + width, y + chamfer);
        graphics.lineTo(x + width, y + height - chamfer);
        graphics.lineTo(x + width - chamfer, y + height);
        graphics.lineTo(x + chamfer, y + height);
        graphics.lineTo(x, y + height - chamfer);
        graphics.lineTo(x, y + chamfer);
        graphics.closePath();
        graphics.fillPath();
    }

    drawChamferedRectStroke(graphics, x, y, width, height, chamfer) {
        graphics.beginPath();
        graphics.moveTo(x + chamfer, y);
        graphics.lineTo(x + width - chamfer, y);
        graphics.lineTo(x + width, y + chamfer);
        graphics.lineTo(x + width, y + height - chamfer);
        graphics.lineTo(x + width - chamfer, y + height);
        graphics.lineTo(x + chamfer, y + height);
        graphics.lineTo(x, y + height - chamfer);
        graphics.lineTo(x, y + chamfer);
        graphics.closePath();
        graphics.strokePath();
    }

    fadeOutSpeechBubble() {
        if (!this.speechContainer) {
            this.finishSpeaking();
            return;
        }
        if (!this.scene || !this.active) {
            this.clearSpeechBubble();
            this.finishSpeaking();
            return;
        }
        this.scene.tweens.add({
            targets: this.speechContainer,
            alpha: 0,
            y: this.speechContainer.y - 20,
            scale: 0.8,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.clearSpeechBubble();
                this.finishSpeaking();
            }
        });
    }

    finishSpeaking() {
        if (!this.active || !this.scene) {
            return;
        }
        this.isSpeaking = false;
        if (this.speechQueue.length > 0) {
            const nextText = this.speechQueue.shift();
            // Store the delayed call so it can be cancelled if the golem dies
            if (this.scheduledSpeakCall) {
                try { this.scheduledSpeakCall.remove(); } catch(e) {}
                this.scheduledSpeakCall = null;
            }
            this.scheduledSpeakCall = this.scene.time.delayedCall(300, () => {
                // Double-check we're still active before speaking
                if (!this.active || !this.scene) { this.scheduledSpeakCall = null; return; }
                this.speak(nextText);
                this.scheduledSpeakCall = null;
            });
        }
    }

    clearSpeechBubble() {
        // Remove todos os timers relacionados a fala
        if (this.typewriterEvent) {
            try { this.typewriterEvent.remove(); } catch(e) {}
            this.typewriterEvent = null;
        }
        if (this.speechUpdateEvent) {
            try { this.speechUpdateEvent.remove(); } catch(e) {}
            this.speechUpdateEvent = null;
        }
        if (this.speechFadeTimer) {
            try { this.speechFadeTimer.remove(); } catch(e) {}
            this.speechFadeTimer = null;
        }
        // Cancel any scheduled speak calls (to avoid recreating bubbles after death)
        if (this.scheduledSpeakCall) {
            try { this.scheduledSpeakCall.remove(); } catch(e) {}
            this.scheduledSpeakCall = null;
        }
        
        // Para TODOS os tweens em andamento no container e filhos
        if (this.scene && this.scene.tweens) {
            if (this.speechContainer) {
                try { this.scene.tweens.killTweensOf(this.speechContainer); } catch(e) {}
            }
            if (this.speechBubble) {
                try { this.scene.tweens.killTweensOf(this.speechBubble); } catch(e) {}
            }
            if (this.speechText) {
                try { this.scene.tweens.killTweensOf(this.speechText); } catch(e) {}
            }
        }
        
        // Destrói container e filhos
        if (this.speechContainer) {
            try {
                this.speechContainer.destroy(true); // true = destroy children
            } catch(e) {}
            this.speechContainer = null;
        }
        
        // Destrói elementos individuais se ainda existirem (fallback)
        if (this.speechBubble) {
            try { this.speechBubble.destroy(); } catch(e) {}
            this.speechBubble = null;
        }
        if (this.speechText) {
            try { this.speechText.destroy(); } catch(e) {}
            this.speechText = null;
        }
        
        this.isSpeaking = false;
        this.speechQueue = [];
    }

    speakContextual(context) {
        // Não falar durante rotação para reduzir poluição visual
        if (this.rotationPending || this.isRotating) return;

        // Chance de falar controlada por `talkativeness` (0..100)
        // Quanto maior o valor, mais provável que o Golem fale; caso contrário, suprime para reduzir ruído visual.
        try {
            const chance = Phaser.Math.Clamp(Number(this.talkativeness ?? 0), 0, 100);
            if (Math.random() * 100 > chance) {
                // Suprimido por baixa verbalidade
                return;
            }
        } catch (e) {
            // Se algo der errado, prossegue normalmente
        }

        import('../services/MockAiService.js').then(({ generateDialogue }) => {
            const phrase = generateDialogue(this.dataAttributes, context);
            this.speak(phrase);
        }).catch(e => console.warn('Erro ao gerar diálogo:', e));
    }
    
    /**
     * Gera uma resposta social baseada na física do Golem que falou
     * @param {string} speakerPhysicsId - ID da física do Golem que falou
     */
    speakSocialResponse(speakerPhysicsId) {
        import('../services/MockAiService.js').then(({ generateSocialResponse }) => {
            const selfPhysicsId = this.currentPhysics || 'luz';
            const phrase = generateSocialResponse(selfPhysicsId, speakerPhysicsId);
            this.speak(phrase);
        }).catch(e => console.warn('Erro ao gerar resposta social:', e));
    }
    
    // Helper: Desenha curvas quadráticas no Phaser Graphics usando linhas
    // Phaser Graphics não tem quadraticCurveTo nativo na API de contexto
    drawQuadCurve(g, x1, y1, cx, cy, x2, y2) {
        const segments = 12;
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const invT = 1 - t;
            // Equação de Bezier Quadrática: (1-t)²P0 + 2(1-t)tP1 + t²P2
            const px = (invT * invT * x1) + (2 * invT * t * cx) + (t * t * x2);
            const py = (invT * invT * y1) + (2 * invT * t * cy) + (t * t * y2);
            g.lineTo(px, py);
        }
    }
    
    drawActionFace(g, action, lineWidth, scale = 1) {
        const color = this.currentColor || 0x00ffff;
        const s = scale;
        
        g.lineStyle(lineWidth + 4*s, color, 0.3);
        
        switch(action) {
            case 'born':
                g.strokeCircle(-8*s, -5*s, 6*s);
                g.strokeCircle(8*s, -5*s, 6*s);
                g.fillStyle(color, 0.8);
                g.fillCircle(-8*s, -5*s, 3*s);
                g.fillCircle(8*s, -5*s, 3*s);
                g.strokeCircle(0, 10*s, 4*s);
                break;
                
            case 'feed':
                g.beginPath();
                g.arc(-8*s, -5*s, 5*s, Math.PI + 0.5, -0.5);
                g.arc(8*s, -5*s, 5*s, Math.PI + 0.5, -0.5);
                g.strokePath();
                const chewAmplitude = (this.isBeingFed ? 5 : 2) * s;
                // If a tween drives `eatingChew` (0..1), map to 0..2pi for sin wave
                const phase = Phaser.Math.Clamp(this.eatingChew || 0, 0, 1);
                const chew = Math.sin(phase * Math.PI * 2) * chewAmplitude;
                g.beginPath();
                g.arc(-4*s, 8*s + chew, 4*s, 0, Math.PI);
                g.arc(4*s, 8*s + chew, 4*s, 0, Math.PI);
                g.strokePath();
                break;
                
            case 'burn':
                const spiral = Date.now() / 50;
                for (let i = 0; i < 2; i++) {
                    const ex = (i === 0 ? -8 : 8) * s;
                    g.beginPath();
                    for (let a = 0; a < Math.PI * 4; a += 0.3) {
                        const r = (a / 3) * s;
                        const px = ex + Math.cos(a + spiral) * r;
                        const py = -5*s + Math.sin(a + spiral) * r;
                        if (a === 0) g.moveTo(px, py);
                        else g.lineTo(px, py);
                    }
                    g.strokePath();
                }
                g.beginPath();
                g.moveTo(-8*s, 8*s); g.lineTo(-4*s, 12*s); g.lineTo(0, 8*s); g.lineTo(4*s, 12*s); g.lineTo(8*s, 8*s);
                g.strokePath();
                break;
            case 'freeze':
                g.strokeCircle(-8*s, -5*s, 5*s);
                g.strokeCircle(8*s, -5*s, 5*s);
                g.fillStyle(0xffffff, 1);
                g.fillCircle(-8*s, -5*s, 1.5*s);
                g.fillCircle(8*s, -5*s, 1.5*s);
                g.strokeCircle(0, 10*s, 3*s);
                break;
            case 'mutate':
                this.drawStar(g, -8*s, -5*s, 4*s, 4*s, 4);
                this.drawStar(g, 8*s, -5*s, 4*s, 4*s, 4);
                g.beginPath();
                g.arc(0, 8*s, 8*s, -Math.PI/2, Math.PI/2);
                g.strokePath();
                break;
            case 'breed':
                this.drawHeart(g, -8*s, -5*s, 5*s);
                this.drawHeart(g, 8*s, -5*s, 5*s);
                g.beginPath();
                g.arc(-2*s, 8*s, 4*s, -Math.PI/2, Math.PI/2);
                g.strokePath();
                break;

            case 'dizzy':
                // Pequenos espirais/estrelas nas áreas dos olhos para indicar tontura/rotação
                const spin = (Date.now() / 240) % (Math.PI * 2);
                const spiralRadius = 4 * s;
                g.lineStyle(1.2 * s, this.visualDNA.detailColor || 0xffffff, 1);
                for (let i = 0; i < 2; i++) {
                    const ex = (i === 0 ? -8 : 8) * s;
                    // Desenha 3 pequenos pontos em arco rotacionando
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 1.5) {
                        const r = 1.5 * s + Math.sin(Date.now() / 180 + a) * (0.8 * s);
                        const px = ex + Math.cos(a + spin) * r;
                        const py = -5*s + Math.sin(a + spin) * r;
                        g.beginPath(); g.fillStyle(this.visualDNA.detailColor || 0xffffff, 1); g.fillCircle(px, py, 1.2 * s);
                    }
                }
                break; 
                
            case 'begging':
                const blink = Math.sin(Date.now() / 150);
                const eyeY = -5*s + blink * 2 * s;
                g.strokeCircle(-8*s, eyeY, 5*s);
                g.strokeCircle(8*s, eyeY, 5*s);
                g.fillStyle(0xffffff, 1);
                g.fillCircle(-6*s, eyeY - 1*s, 1.5*s);
                g.fillCircle(10*s, eyeY - 1*s, 1.5*s);
                g.beginPath();
                g.arc(0, 12*s, 5*s, Math.PI + 0.4, -0.4);
                g.strokePath();
                g.beginPath();
                g.moveTo(-12*s, -12*s); g.lineTo(-6*s, -8*s);
                g.moveTo(12*s, -12*s); g.lineTo(6*s, -8*s);
                g.strokePath();
                break;
                
            case 'panic':
                const tremor = this.instincts?.tremor || { x: 0, y: 0 };
                const intensity = this.instincts?.intensity || 0.5;
                const pupilSize = Math.max(0.8, 2.5 - intensity * 1.5) * s;
                g.strokeCircle(-8*s + tremor.x, -5*s + tremor.y, 7*s);
                g.strokeCircle(8*s + tremor.x, -5*s + tremor.y, 7*s);
                g.fillStyle(0xff3333, 0.8);
                g.fillCircle(-8*s + tremor.x, -5*s + tremor.y, pupilSize);
                g.fillCircle(8*s + tremor.x, -5*s + tremor.y, pupilSize);
                const mouthWobble = Math.sin(Date.now() / 40) * 3 * s * intensity;
                g.strokeCircle(mouthWobble + tremor.x, 10*s + tremor.y, 6*s);
                break;
                
            case 'angry':
                // ═══ CARA DE RAIVA (GRR!) ═══
                // Olhos semicerrados furiosos
                g.lineStyle(lineWidth + 2*s, 0xff4444, 0.9);
                g.beginPath();
                g.moveTo(-12*s, -8*s);
                g.lineTo(-4*s, -4*s);
                g.moveTo(4*s, -4*s);
                g.lineTo(12*s, -8*s);
                g.strokePath();
                
                // Pupilas pequenas e intensas
                g.fillStyle(0xff0000, 1);
                g.fillCircle(-8*s, -5*s, 2*s);
                g.fillCircle(8*s, -5*s, 2*s);
                
                // Sobrancelhas em V de raiva
                g.lineStyle(lineWidth + 3*s, color, 1);
                g.beginPath();
                g.moveTo(-14*s, -14*s);
                g.lineTo(-6*s, -10*s);
                g.moveTo(6*s, -10*s);
                g.lineTo(14*s, -14*s);
                g.strokePath();
                
                // Boca em zig-zag de raiva (GRR teeth)
                g.lineStyle(lineWidth + 2*s, 0xff6666, 0.9);
                g.beginPath();
                const wobble = Math.sin(Date.now() / 50) * 1.5 * s;
                g.moveTo(-10*s, 8*s + wobble);
                g.lineTo(-6*s, 12*s + wobble);
                g.lineTo(-2*s, 8*s + wobble);
                g.lineTo(2*s, 12*s + wobble);
                g.lineTo(6*s, 8*s + wobble);
                g.lineTo(10*s, 12*s + wobble);
                g.strokePath();
                
                // Veias de raiva (linhas saindo da cabeça)
                g.lineStyle(lineWidth, 0xff4444, 0.6);
                g.beginPath();
                g.moveTo(-16*s, -16*s); g.lineTo(-20*s, -22*s);
                g.moveTo(16*s, -16*s); g.lineTo(20*s, -22*s);
                g.strokePath();
                break;
                
            case 'love':
                // ═══ CARA DE AMOR/CORTEJO ═══
                // Olhos em forma de coração (ou muito brilhantes/grandes)
                g.lineStyle(lineWidth + 2*s, 0xff6b9d, 0.9);
                
                // Desenha corações como olhos
                this.drawHeart(g, -8*s, -5*s, 7*s);
                this.drawHeart(g, 8*s, -5*s, 7*s);
                
                // Preenchimento rosa nos olhos
                g.fillStyle(0xff6b9d, 0.6);
                g.fillCircle(-8*s, -5*s, 4*s);
                g.fillCircle(8*s, -5*s, 4*s);
                
                // Brilhos nos olhos
                g.fillStyle(0xffffff, 1);
                g.fillCircle(-10*s, -7*s, 1.5*s);
                g.fillCircle(6*s, -7*s, 1.5*s);
                
                // Bochechas coradas
                g.fillStyle(0xff6b6b, 0.4);
                g.fillEllipse(-14*s, 2*s, 5*s, 3*s);
                g.fillEllipse(14*s, 2*s, 5*s, 3*s);
                
                // Sorriso tímido/apaixonado
                g.lineStyle(lineWidth + 2*s, 0xff9999, 0.9);
                g.beginPath();
                const loveWave = Math.sin(Date.now() / 200) * 2 * s;
                g.arc(0, 8*s + loveWave, 6*s, 0.2, Math.PI - 0.2);
                g.strokePath();
                
                // Partículas de coração flutuando (efeito visual)
                const heartFloat = (Date.now() % 2000) / 2000;
                g.fillStyle(0xff6b9d, 0.5 - heartFloat * 0.5);
                g.fillCircle(-16*s, -20*s - heartFloat * 15*s, 2*s);
                g.fillCircle(16*s, -18*s - heartFloat * 12*s, 1.5*s);
                break;
                
            case 'hurt':
                // ═══ CARA DE DOR/DANO ═══
                // Olhos em X (knocked out style)
                g.lineStyle(lineWidth + 3*s, 0xff4444, 0.9);
                
                // X no olho esquerdo
                g.beginPath();
                g.moveTo(-12*s, -9*s); g.lineTo(-4*s, -1*s);
                g.moveTo(-4*s, -9*s); g.lineTo(-12*s, -1*s);
                g.strokePath();
                
                // X no olho direito
                g.beginPath();
                g.moveTo(4*s, -9*s); g.lineTo(12*s, -1*s);
                g.moveTo(12*s, -9*s); g.lineTo(4*s, -1*s);
                g.strokePath();
                
                // Sobrancelhas de dor (arqueadas para cima)
                g.lineStyle(lineWidth + 2*s, color, 0.8);
                g.beginPath();
                g.moveTo(-14*s, -10*s);
                g.lineTo(-8*s, -14*s);
                g.lineTo(-4*s, -10*s);
                g.moveTo(4*s, -10*s);
                g.lineTo(8*s, -14*s);
                g.lineTo(14*s, -10*s);
                g.strokePath();
                
                // Boca aberta de dor (O)
                const hurtShake = Math.sin(Date.now() / 30) * 2 * s;
                g.lineStyle(lineWidth + 2*s, 0xffaaaa, 0.9);
                g.strokeCircle(hurtShake, 10*s, 5*s);
                
                // Lágrimas/gotas de suor
                g.fillStyle(0x66ccff, 0.7);
                const tearDrop = (Date.now() % 500) / 500 * 8 * s;
                g.fillEllipse(-14*s, -2*s + tearDrop, 2*s, 3*s);
                g.fillEllipse(14*s, 0 + tearDrop * 0.8, 2*s, 3*s);
                
                // Estrelas de impacto girando
                g.lineStyle(lineWidth, 0xffff00, 0.6);
                const starSpin = Date.now() / 100;
                for (let i = 0; i < 3; i++) {
                    const angle = starSpin + (i * Math.PI * 2 / 3);
                    const sx = Math.cos(angle) * 20 * s;
                    const sy = -15*s + Math.sin(angle) * 8 * s;
                    g.strokeCircle(sx, sy, 2*s);
                }
                break;
        }
    }
    
    drawStar(g, cx, cy, outerR, innerR, points) {
        g.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI / points) - Math.PI / 2;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            if (i === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
        }
        g.closePath();
        g.strokePath();
    }
    
    drawHeart(g, cx, cy, size) {
        const points = [];
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            points.push({
                x: cx + (x / 16) * size * 0.5,
                y: cy + (y / 16) * size * 0.5 - size * 0.1
            });
        }
        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            g.lineTo(points[i].x, points[i].y);
        }
        g.closePath();
        g.strokePath();
    }
}