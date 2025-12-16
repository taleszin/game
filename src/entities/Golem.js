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
        
        this.maxVitality = this.maxLifespan * 0.6;
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
            'magnetismo':   0xff00aa
        };
        
        const fallbackColor = (data && data.fisica) 
            ? (PHYSICS_COLORS[data.fisica.id] || 0x00ffff) 
            : 0x00ffff;
        
        this.visualDNA = {
            bodyColor: data?.visualDNA?.bodyColor || fallbackColor,
            detailColor: data?.visualDNA?.detailColor || fallbackColor,
            auraColor: data?.visualDNA?.auraColor || fallbackColor,
            eyeJitter: data?.visualDNA?.eyeJitter || 1,
            blinkRate: data?.visualDNA?.blinkRate || 1,
            lineWidth: data?.visualDNA?.lineWidth || 2,
            faceGenes: data?.visualDNA?.faceGenes || { eyeType: 'circle', mouthType: 'simple' },
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

        this.setSize(60, 60);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        if (!scene.golemsGroup) scene.golemsGroup = scene.add.group();
        scene.golemsGroup.add(this);

        if (this.body) {
            this.body.setCollideWorldBounds(true);
            this.body.setBounce(1);
            this.setInteractive();
            scene.input.setDraggable(this);

            this.baseSpeed = 50 / this.targetScale;
            if (data.fisica && data.fisica.id === 'eletricidade') this.baseSpeed *= 1.5;

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
            this.on('pointerdown', () => {
                this.pokeStartTime = Date.now();
            });
            this.on('pointerup', () => {
                const clickDuration = Date.now() - this.pokeStartTime;
                if (clickDuration < 200 && !this.isDragging) {
                    this.speakContextual('poke');
                }
            });
            
            this.on('dragstart', () => { 
                this.isDragging = true; 
                this.body.setVelocity(0); 
                this.alpha = 0.6; 
                this.pettingActive = true;
                this.pettingHistory = [];
                scene.game.events.emit('hide-inspect');
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
                if (!mated) this.startRoaming();
            });
            
            this.toolDragMoveHandler = (data) => {
                if (!this.active || this.isDragging) return;
                this.updateInstincts({ x: data.x, y: data.y }, data.action);
            };
            scene.game.events.on('tool-drag-move', this.toolDragMoveHandler);
            
            this.toolDragEndHandler = () => {
                this.clearInstincts();
            };
            scene.game.events.on('tool-drag-end', this.toolDragEndHandler);
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
        
        const fleeSpeed = this.baseSpeed * (2 + this.instincts.intensity * 2);
        const erratic = (Math.random() - 0.5) * 0.4 * this.instincts.intensity;
        
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
        
        if (this.expressionState.action === 'breed' || 
            this.expressionState.action === 'mutate' || 
            this.expressionState.action === 'born' || 
            this.expressionState.action === 'feed') {
            const s = this.faceScale || 1;
            const lineWidth = Math.max(this.minLineWidth, 2 * s);
            this.drawActionFace(g, this.expressionState.action, lineWidth, s);
            return;
        }

        const s = this.faceScale;
        
        this.drawEyes(g, s);
        this.drawMouth(g, s);
        this.drawBrows(g, s);
    }

    drawEyes(g, s) {
        const genes = this.visualDNA.faceGenes;
        const p = this.faceParams;
        
        // --- 1. Parallax & Breathing ---
        // Olhos movem MENOS que o foco para simular profundidade (fundo move menos)
        // Respiração adiciona um bob vertical constante
        const ox = this.eyeOffset.x + (p.focusOffset.x * 0.7) + (Math.random()-0.5) * p.tremor * 10;
        const oy = this.eyeOffset.y + (p.focusOffset.y * 0.7) + p.breathY + (Math.random()-0.5) * p.tremor * 10;
        
        const color = this.visualDNA.detailColor;
        const lineWidth = Math.max(this.minLineWidth, 2 * s);
        
        // --- 2. Sclera (Fundo do Olho) para Contraste ---
        // Cria um brilho sutil atrás do olho para destacá-lo em corpos escuros
        // Só desenha se não estiver piscando
        if (!this.isBlinking) {
            const scleraAlpha = 0.15;
            g.fillStyle(0xffffff, scleraAlpha);
            const w = 5 * s;
            const h = 5 * s * p.eyeOpenness;
            
            // Fundo difuso atrás dos olhos
            if (genes.eyeType !== 'visor') {
                g.fillCircle(-8*s + ox, -5*s + oy, w * 1.5);
                g.fillCircle(8*s + ox, -5*s + oy, w * 1.5);
            }
        }

        g.lineStyle(lineWidth, color, 1);
        
        if (this.isBlinking) {
            // Squash visual ao piscar (linha curva em vez de reta)
            g.beginPath();
            this.drawQuadCurve(g, -12*s + ox, -5*s + oy, -8*s + ox, -4*s + oy, -4*s + ox, -5*s + oy);
            this.drawQuadCurve(g, 4*s + ox, -5*s + oy, 8*s + ox, -4*s + oy, 12*s + ox, -5*s + oy);
            g.strokePath();
            return;
        }

        const h = 5 * s * p.eyeOpenness; 
        const w = 5 * s;
        // Pupilas reagem à emoção (midríase/miose)
        const pupSize = 2 * s * p.pupilSize;

        switch(genes.eyeType) {
            case 'circle':
                g.strokeEllipse(-8*s + ox, -5*s + oy, w, h);
                g.strokeEllipse(8*s + ox, -5*s + oy, w, h);
                g.fillStyle(color, 1);
                // Pupilas seguem o foco com mais intensidade (paralaxe da pupila)
                g.fillCircle(-8*s + ox + p.focusOffset.x * 0.4, -5*s + oy + p.focusOffset.y * 0.4, pupSize);
                g.fillCircle(8*s + ox + p.focusOffset.x * 0.4, -5*s + oy + p.focusOffset.y * 0.4, pupSize);
                
                // Brilho especular na pupila (vida!)
                g.fillStyle(0xffffff, 0.7);
                g.fillCircle(-8*s + ox + p.focusOffset.x * 0.4 - 1*s, -5*s + oy + p.focusOffset.y * 0.4 - 1*s, pupSize * 0.4);
                g.fillCircle(8*s + ox + p.focusOffset.x * 0.4 - 1*s, -5*s + oy + p.focusOffset.y * 0.4 - 1*s, pupSize * 0.4);
                break;
            case 'slit':
                g.strokeEllipse(-8*s + ox, -5*s + oy, w * 0.6, h);
                g.strokeEllipse(8*s + ox, -5*s + oy, w * 0.6, h);
                g.lineStyle(lineWidth, color, 1);
                g.beginPath();
                g.moveTo(-8*s + ox + p.focusOffset.x, -5*s + oy - h + 2*s + p.focusOffset.y); 
                g.lineTo(-8*s + ox + p.focusOffset.x, -5*s + oy + h - 2*s + p.focusOffset.y);
                g.moveTo(8*s + ox + p.focusOffset.x, -5*s + oy - h + 2*s + p.focusOffset.y); 
                g.lineTo(8*s + ox + p.focusOffset.x, -5*s + oy + h - 2*s + p.focusOffset.y);
                g.strokePath();
                break;
            case 'pixel':
                g.strokeRect(-12*s + ox, -5*s + oy - h, w*1.5, h*2);
                g.strokeRect(4*s + ox, -5*s + oy - h, w*1.5, h*2);
                g.fillStyle(color, 1);
                g.fillRect(-10*s + ox + p.focusOffset.x, -5*s + oy - pupSize + p.focusOffset.y, pupSize*2, pupSize*2);
                g.fillRect(6*s + ox + p.focusOffset.x, -5*s + oy - pupSize + p.focusOffset.y, pupSize*2, pupSize*2);
                break;
            case 'dot':
                g.fillStyle(color, 1);
                const dotSize = Math.max(w * p.eyeOpenness, 2*s);
                g.fillCircle(-8*s + ox + p.focusOffset.x, -5*s + oy + p.focusOffset.y, dotSize);
                g.fillCircle(8*s + ox + p.focusOffset.x, -5*s + oy + p.focusOffset.y, dotSize);
                break;
            case 'visor':
                g.lineStyle(lineWidth + 2*s, color, 1);
                g.beginPath();
                // Visor curva com o rosto
                this.drawQuadCurve(g, -15*s + ox, -5*s + oy, 0 + ox, -6*s + oy, 15*s + ox, -5*s + oy);
                g.strokePath();
                // Scanner light que se move
                g.lineStyle(lineWidth + 1*s, 0xffffff, 0.7);
                g.beginPath();
                const visorX = p.focusOffset.x * 3;
                g.moveTo(visorX - 2*s + ox, -5*s + oy); g.lineTo(visorX + 2*s + ox, -5*s + oy);
                g.strokePath();
                break;
            case 'hollow':
                g.strokeCircle(-8*s + ox, -5*s + oy, w * p.eyeOpenness);
                g.strokeCircle(8*s + ox, -5*s + oy, w * p.eyeOpenness);
                g.fillStyle(color, 0.3);
                g.fillCircle(-8*s + ox + p.focusOffset.x, -5*s + oy + p.focusOffset.y, 1.5*s);
                g.fillCircle(8*s + ox + p.focusOffset.x, -5*s + oy + p.focusOffset.y, 1.5*s);
                break;
            default: 
                g.strokeCircle(-8*s + ox, -5*s + oy, w * p.eyeOpenness);
                g.strokeCircle(8*s + ox, -5*s + oy, w * p.eyeOpenness);
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
        this.vitality = this.maxVitality;
        this.currentLife = this.vitality; 
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
        if (this.lifeTimer) this.lifeTimer.timeScale = 5.0;
        this.setActionExpression('burn', 3000);
        this.addLifeEvent('burn', 'Incendiado - perda acelerada');
        this.speakContextual('burn');
    }

    kill() {
        this.addLifeEvent('killed', 'Eliminado manualmente');
        this.currentLife = 0; this.die();
    }

    freeze() {
        this.isFrozen = true; this.body.setVelocity(0); this.graphics.setTint(0x0088ff);
        this.setActionExpression('freeze', 5000);
        this.addLifeEvent('freeze', 'Congelado temporariamente');
        this.speakContextual('freeze');
        this.scene.time.delayedCall(5000, () => { if (this.active) { this.isFrozen = false; this.graphics.clearTint(); this.startRoaming(); } });
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
                if (this.emitter) this.emitter.setTint(this.currentColor);
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
            const vitalityDecay = deltaTime * 0.8; 
            this.vitality -= vitalityDecay;
            this.vitality = Math.max(0, this.vitality);
            this.currentLife = this.vitality;
            const vitalityPct = this.vitality / this.maxVitality;
            this.lifeBar.width = 22 * vitalityPct;
            const agePct = this.age / this.maxLifespan; 
            this.updateLifePhase(agePct);
            if (vitalityPct < 0.2) {
                this.lifeBar.setFillStyle(0xff0000);
            } else {
                this.lifeBar.setFillStyle(this.visualDNA.bodyColor);
            }
            if (this.vitality <= 0) {
                this.addLifeEvent('starved', 'Morreu de fome - vitalidade esgotada');
                this.die();
            } else if (this.age >= this.maxLifespan) {
                this.addLifeEvent('oldAge', 'Morreu de velhice natural');
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
                this.body.setVelocity(Phaser.Math.Between(-this.baseSpeed, this.baseSpeed), Phaser.Math.Between(-this.baseSpeed, this.baseSpeed));
            }
        }});
    }

    die() {
        if (this.lifeTimer) this.lifeTimer.remove();
        if (this.expressionTimer) this.expressionTimer.remove();
        if (this.roamingTimer) this.roamingTimer.remove();
        if (this.emitter) this.emitter.stop();
        if (this.body) this.body.setVelocity(0);
        if (this.typewriterEvent) {
            this.typewriterEvent.remove();
            this.typewriterEvent = null;
        }
        if (this.speechFadeTimer) {
            this.speechFadeTimer.remove();
            this.speechFadeTimer = null;
        }
        this.clearSpeechBubble();
        // Ensure we stop any in-progress eating/feeding animation
        try { this.stopEatingAnimation(); } catch(e) { }
        // Detach event handlers
        try { if (this.scene && this.toolDragMoveHandler) this.scene.game.events.off('tool-drag-move', this.toolDragMoveHandler); } catch(e) {}
        try { if (this.scene && this.toolDragEndHandler) this.scene.game.events.off('tool-drag-end', this.toolDragEndHandler); } catch(e) {}
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
        try {
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
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);  
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
        let basePitch = 400;
        if (this.targetScale < 0.8) {
            basePitch = Phaser.Math.Between(600, 800); 
        } else if (this.targetScale > 1.3) {
            basePitch = Phaser.Math.Between(150, 300); 
        } else {
            basePitch = Phaser.Math.Between(350, 500); 
        }
        if (this.lifePhase === 'child') {
            basePitch += 200; 
        } else if (this.lifePhase === 'old') {
            basePitch -= 80; 
        }
        switch (this.currentPhysics) {
            case 'eletricidade': basePitch += 150; break;
            case 'gravidade': basePitch -= 100; break;
        }
        const pitch = Phaser.Math.Clamp(basePitch + Phaser.Math.Between(-30, 30), 120, 900);
        const waveType = (this.currentPhysics === 'luz' || this.currentPhysics === 'frio') 
            ? 'triangle' 
            : 'square';
        const osc = ctx.createOscillator();
        osc.type = waveType;
        osc.frequency.setValueAtTime(pitch, now);
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.008);  
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05); 
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.055);
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
            if (this.speechQueue.length < 3) {
                this.speechQueue.push(text);
            }
            return;
        }
        this.isSpeaking = true;
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
        const offsetY = 75 + (this.targetScale * 15);
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
                        this.typewriterEvent.remove();
                        this.typewriterEvent = null;
                    }
                    return;
                }
                if (charIndex < text.length) {
                    displayText += text[charIndex];
                    this.speechText.setText(displayText);
                    if (charIndex % 2 === 0 && text[charIndex] !== ' ') {
                        this.playVoiceBeep();
                    }
                    charIndex++;
                } else {
                    this.typewriterEvent.remove();
                    this.typewriterEvent = null;
                    if (!this.active || !this.scene) return;
                    this.speechFadeTimer = this.scene.time.delayedCall(2500, () => {
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
            this.scene.time.delayedCall(300, () => {
                this.speak(nextText);
            });
        }
    }

    clearSpeechBubble() {
        if (this.typewriterEvent) {
            this.typewriterEvent.remove();
            this.typewriterEvent = null;
        }
        if (this.speechUpdateEvent) {
            this.speechUpdateEvent.remove();
            this.speechUpdateEvent = null;
        }
        if (this.speechFadeTimer) {
            this.speechFadeTimer.remove();
            this.speechFadeTimer = null;
        }
        if (this.speechContainer) {
            this.speechContainer.destroy();
            this.speechContainer = null;
        }
        this.speechBubble = null;
        this.speechText = null;
    }

    speakContextual(context) {
        import('../services/MockAiService.js').then(({ generateDialogue }) => {
            const phrase = generateDialogue(this.dataAttributes, context);
            this.speak(phrase);
        }).catch(e => console.warn('Erro ao gerar diálogo:', e));
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