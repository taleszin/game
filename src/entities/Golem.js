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
        
        const stats = data.aiData ? data.aiData.stats : {};
        this.maxLife = stats.lifespan || 30000;
        this.currentLife = this.maxLife;
        
        // Escala (Dimensões Únicas)
        this.targetScaleX = stats.scaleX ? parseFloat(stats.scaleX) : (stats.scale ? parseFloat(stats.scale) : 1);
        this.targetScaleY = stats.scaleY ? parseFloat(stats.scaleY) : (stats.scale ? parseFloat(stats.scale) : 1);
        
        // Mantém targetScale como média para compatibilidade com lógica de velocidade/partículas
        this.targetScale = (this.targetScaleX + this.targetScaleY) / 2;
        
        this.setScale(this.targetScaleX, this.targetScaleY);

        // --- VISUAL: DNA HÍBRIDO DE 3 CORES ---
        // bodyColor: Preenchimento do corpo
        // detailColor: Rosto e detalhes
        // auraColor: Glow externo (energia)
        
        const PHYSICS_COLORS = {
            'eletricidade': 0xffea00,
            'calor':        0xff4d00,
            'radiacao':     0x00ff00,
            'gravidade':    0x9d00ff,
            'luz':          0xffffff,
            'frio':         0x0088ff,
            'magnetismo':   0xff00aa
        };
        
        // Fallback padrão baseado na física
        const fallbackColor = (data && data.fisica) 
            ? (PHYSICS_COLORS[data.fisica.id] || 0x00ffff) 
            : 0x00ffff;
        
        // Inicializa visualDNA (herança genética ou padrão)
        this.visualDNA = {
            bodyColor: data?.visualDNA?.bodyColor || fallbackColor,
            detailColor: data?.visualDNA?.detailColor || fallbackColor,
            auraColor: data?.visualDNA?.auraColor || fallbackColor,
            eyeJitter: data?.visualDNA?.eyeJitter || 1,
            blinkRate: data?.visualDNA?.blinkRate || 1,
            lineWidth: data?.visualDNA?.lineWidth || 2
        };
        
        // Mantém currentColor para compatibilidade legada
        const neonColor = this.visualDNA.bodyColor;

        this.graphics = scene.add.graphics();
        
        // Dados de forma
        const shapeData = data.forma || data.biologia;
        this.currentShapeType = shapeData ? shapeData.id : 'quadrado';
        this.proceduralParams = shapeData ? shapeData.params : null; // Pega parâmetros matemáticos
        
        this.currentColor = neonColor;
        this.currentChem = data.quimica ? data.quimica.id : 'carbono';
        this.currentPhysics = data.fisica ? data.fisica.id : 'luz';

        // --- SISTEMA DE EXPRESSÃO (ROSTO) ---
        this.faceGraphics = scene.add.graphics();
        this.expressionState = {
            mood: 'happy',      // happy, neutral, sad, dying, dead
            action: null,       // feed, burn, freeze, mutate, breed, born
            actionTimer: 0
        };
        this.eyeOffset = { x: 0, y: 0 };  // Para animação de olhos
        this.blinkTimer = 0;
        this.isBlinking = false;

        // Escala adaptativa do rosto: mínimo garantido para legibilidade
        // Se o Golem for muito pequeno, o rosto é proporcionalmente maior
        const minFaceScale = 0.6;
        const rawFaceScale = 1 / this.targetScale; // Inverso para compensar escala do container
        this.faceScale = Math.max(rawFaceScale, minFaceScale / this.targetScale);
        // Garantir linha mínima visível
        this.minLineWidth = Math.max(1.5, 2 / this.targetScale);

        // --- SISTEMA DE ANOMALIA (GLITCH) ---
        this.alchemyMeta = data?.alchemyMeta || null;
        this.isAnomaly = this.alchemyMeta?.isAnomaly || false;
        this.glitchIntensity = this.alchemyMeta?.glitchIntensity || 0;
        this.stability = this.alchemyMeta?.stability || 1.0;
        this.glitchTimer = 0;
        this.glitchOffset = { x: 0, y: 0 };

        // --- SISTEMA DE FALA (VOZ + BALÃO) ---
        this.speechBubble = null;
        this.speechText = null;
        this.isSpeaking = false;
        this.speechQueue = [];
        
        // Inicializa AudioContext (Web Audio API) de forma lazy
        this.audioContext = null;
        this.masterGain = null;

        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE INSTINTOS REATIVOS EM TEMPO REAL
        // Steering behaviors: seek, flee, separation
        // ═══════════════════════════════════════════════════════════════════
        
        this.instincts = {
            active: false,
            state: null,           // 'seeking', 'fleeing', 'freezing', null
            intensity: 0,          // 0-1: força da reação
            targetPos: null,       // posição do mouse/ferramenta
            steeringForce: { x: 0, y: 0 },
            tremor: { x: 0, y: 0 },
            lastUpdate: 0
        };
        
        this.INSTINCT_RADIUS = 200;
        this.MAX_STEERING_FORCE = 150;
        this.SEPARATION_RADIUS = 80;
        this.SEPARATION_FORCE = 60;

        this.drawNeonShape(this.currentShapeType, this.currentColor, this.currentChem);
        this.drawFace();
        this.add(this.graphics);
        this.add(this.faceGraphics);

        // Animação do corpo
        this.pulseTween = scene.tweens.add({
            targets: this.graphics,
            scaleX: 1.05, scaleY: 1.05, alpha: 0.9,
            duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Timer de expressão e animação de olhos
        this.expressionTimer = scene.time.addEvent({
            delay: 50, loop: true,
            callback: () => this.updateExpression()
        });

        // Expressão de nascimento + fala de boas-vindas
        this.setActionExpression('born', 2000);
        // Delay pequeno para garantir que o Golem está pronto
        scene.time.delayedCall(500, () => this.speakContextual('born'));

        // Nome e Barra
        const nameStr = (data.aiData) ? data.aiData.name.split(' ')[0] : "GLIFO";
        const nameTag = scene.add.text(0, -60, nameStr, {
            fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ffffff', 
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
        nameTag.setScale(1 / this.targetScale);

        const barBg = scene.add.rectangle(0, -50, 24, 4, 0x000000);
        this.lifeBar = scene.add.rectangle(0, -50, 22, 2, neonColor);
        this.add([nameTag, barBg, this.lifeBar]);

        // Registro inicial: nasceu
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

        // Partículas
        this.emitter = scene.add.particles(0, 0, 'pixel', {
            speed: 20 * this.targetScale, 
            scale: { start: 0.4 * this.targetScale, end: 0 }, 
            blendMode: 'ADD', lifespan: 600, tint: neonColor, quantity: 1
        });
        this.emitter.startFollow(this);

        // --- FÍSICA ---
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

            // Eventos
            this.on('pointerover', () => {
                if (!this.isDragging) {
                    scene.selectedGolem = this;
                    scene.game.events.emit('inspect-golem', { visual: this.dataAttributes, stats: data.aiData, lifeLog: this.lifeLog });
                    this.graphics.alpha = 1;
                }
            });
            this.on('pointerout', () => { scene.game.events.emit('hide-inspect'); this.graphics.scale = 1; });
            
            // Clique simples = poke (cutucar)
            this.pokeStartTime = 0;
            this.on('pointerdown', () => {
                this.pokeStartTime = Date.now();
            });
            this.on('pointerup', () => {
                // Se foi um clique rápido (< 200ms) e não arrastou, é um poke
                const clickDuration = Date.now() - this.pokeStartTime;
                if (clickDuration < 200 && !this.isDragging) {
                    this.speakContextual('poke');
                }
            });
            
            this.on('dragstart', () => { 
                this.isDragging = true; this.body.setVelocity(0); this.alpha = 0.6; 
                scene.game.events.emit('hide-inspect');
            });
            this.on('drag', (p, x, y) => { this.x = x; this.y = y; });
            this.on('dragend', () => {
                this.isDragging = false; this.alpha = 1;
                const others = scene.golemsGroup.getChildren();
                let mated = false;
                for (let other of others) {
                    if (other !== this && other.active && Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y) < (60 * this.targetScale)) {
                         scene.triggerBreeding(this, other); mated = true; break;
                    }
                }
                if (!mated) this.startRoaming();
            });
            
            // ═══════════════════════════════════════════════════════════════════
            // LISTENERS DE INSTINTOS REATIVOS
            // ═══════════════════════════════════════════════════════════════════
            
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

    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE INSTINTOS REATIVOS - Steering Behaviors
    // ═══════════════════════════════════════════════════════════════════

    updateInstincts(mousePos, activeTool) {
        if (!this.body || this.isFrozen || this.isDragging) return;
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, mousePos.x, mousePos.y);
        
        if (distance > this.INSTINCT_RADIUS) {
            if (this.instincts.active) this.clearInstincts();
            return;
        }
        
        this.instincts.active = true;
        this.instincts.targetPos = mousePos;
        this.instincts.intensity = Math.pow(1 - (distance / this.INSTINCT_RADIUS), 1.5);
        
        let steeringX = 0, steeringY = 0;
        
        switch (activeTool) {
            case 'feed':
                this.instincts.state = 'seeking';
                const seekForce = this.calculateSeek(mousePos);
                steeringX = seekForce.x;
                steeringY = seekForce.y;
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
                
                this.graphics.x = 0;
                this.graphics.y = 0;
                this.faceGraphics.x = 0;
                this.faceGraphics.y = 0;
            }
        });
    }

    drawNeonShape(type, color, chemType) {
        const g = this.graphics;
        g.clear();
        
        // Usa DNA visual para cores separadas
        const bodyColor = this.visualDNA?.bodyColor || color;
        const auraColor = this.visualDNA?.auraColor || color;
        
        // === COR MATERIAL: Ouro tinge o corpo ===
        let effectiveBodyColor = bodyColor;
        if (chemType === 'ouro') {
            effectiveBodyColor = this.blendColors(bodyColor, 0xFFD700, 0.4);
        } else if (chemType === 'ferro') {
            effectiveBodyColor = this.blendColors(bodyColor, 0x8899AA, 0.2);
        }
        
        // === EFEITO GLITCH PARA ANOMALIAS ===
        if (this.isAnomaly && this.glitchIntensity > 0) {
            this.drawAnomalyGlitch(g, type, effectiveBodyColor, auraColor, chemType);
            return;
        }
        
        // === TRAÇOS REFINADOS: Linhas mais finas e elegantes ===
        let lineWidth = 1.5; // Base mais fina
        if (chemType === 'ferro') lineWidth = 2.5;
        else if (chemType === 'ouro') lineWidth = 2;
        else if (chemType === 'cristal') lineWidth = 1;
        else if (chemType === 'mercurio') lineWidth = 2;
        else if (chemType === 'silicio') lineWidth = 1.5;
        else if (chemType === 'uranio') lineWidth = 2;
        
        // Helper function para desenhar path do cilindro
        const drawCylinderPath = () => {
            g.beginPath();
            g.moveTo(-20, -25); g.lineTo(-20, 25);
            g.moveTo(20, -25); g.lineTo(20, 25);
            g.strokePath();
            g.strokeEllipse(0, -25, 40, 15);
            g.strokeEllipse(0, 25, 40, 15);
        };
        
        // Helper function para desenhar path do cone
        const drawConePath = () => {
            g.beginPath();
            g.moveTo(0, -35); g.lineTo(25, 25);
            g.moveTo(0, -35); g.lineTo(-25, 25);
            g.strokePath();
            g.strokeEllipse(0, 25, 50, 15);
        };
        
        // Tratamento especial para formas com base elíptica (cilindro / cone)
        if (type === 'cilindro') {
            // 1. FILL: Preenchimento sutil
            g.fillStyle(effectiveBodyColor, 0.12);
            g.beginPath();
            g.moveTo(-20, -25); g.lineTo(20, -25); g.lineTo(20, 25); g.lineTo(-20, 25); g.closePath();
            g.fillPath();
            g.fillEllipse(0, -25, 40, 15);
            g.fillEllipse(0, 25, 40, 15);
            
            // 2. CHEMISTRY PATTERN
            this.drawChemistryPattern(g, type, chemType, 25, effectiveBodyColor);

            // 3-7. AURA LAYERS (5 camadas suaves)
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
            
            // 8. TRAÇO PRINCIPAL
            g.lineStyle(lineWidth, effectiveBodyColor, 0.9);
            drawCylinderPath();
            return;
        }

        if (type === 'cone') {
            // 1. FILL: Preenchimento sutil
            g.fillStyle(effectiveBodyColor, 0.12);
            g.beginPath();
            g.moveTo(0, -35); g.lineTo(25, 25); g.lineTo(-25, 25); g.closePath();
            g.fillPath();
            g.fillEllipse(0, 25, 50, 15);
            
            // 2. CHEMISTRY PATTERN
            this.drawChemistryPattern(g, type, chemType, 25, effectiveBodyColor);

            // 3-7. AURA LAYERS (5 camadas suaves)
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
            
            // 8. TRAÇO PRINCIPAL
            g.lineStyle(lineWidth, effectiveBodyColor, 0.9);
            drawConePath();
            return;
        }

        // ═══ DEFAULT: Renderização com 5 camadas (refinada) ═══
        
        // 1. FILL: Preenchimento sutil com gradiente interno
        g.fillStyle(effectiveBodyColor, 0.12);
        this.drawPath(g, type);
        g.fillPath();
        
        // 2. PADRÃO QUÍMICO: Textura interna baseada no material
        this.drawChemistryPattern(g, type, chemType, 25, effectiveBodyColor);

        // 3. AURA EXTERNA: Glow suave em múltiplas passadas
        // Camada 1: Glow externo difuso
        g.lineStyle(lineWidth + 12, auraColor, 0.08);
        this.drawPath(g, type);
        g.strokePath();
        
        // Camada 2: Glow médio
        g.lineStyle(lineWidth + 6, auraColor, 0.15);
        this.drawPath(g, type);
        g.strokePath();
        
        // Camada 3: Glow interno
        g.lineStyle(lineWidth + 3, auraColor, 0.25);
        this.drawPath(g, type);
        g.strokePath();

        // 4. CONTORNO PRINCIPAL: Traço fino e nítido
        g.lineStyle(lineWidth, effectiveBodyColor, 0.9);
        this.drawPath(g, type);
        g.strokePath();
        
        // 5. HIGHLIGHT INTERNO: Brilho sutil no centro
        g.lineStyle(lineWidth * 0.5, 0xFFFFFF, 0.15);
        this.drawPath(g, type);
        g.strokePath();
    }

    drawPath(g, type) {
        g.beginPath();
        
        // SE FOR PROCEDURAL, USA A MATEMÁTICA
        if (type === 'procedural' && this.proceduralParams) {
            const { sides, roughness, seed } = this.proceduralParams;
            const radius = 28;
            
            for (let i = 0; i <= sides; i++) {
                const angle = (i * (Math.PI * 2)) / sides;
                // Usa o seno para criar irregularidade consistente baseada no seed
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

        // FORMAS PADRÃO
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
            
            // Formas 3D
            case 'cilindro': g.moveTo(-20,-25); g.lineTo(-20,25); g.moveTo(20,-25); g.lineTo(20,25); g.strokeEllipse(0,-25,40,15); g.strokeEllipse(0,25,40,15); break;
            case 'cone': g.moveTo(0,-35); g.lineTo(25,25); g.moveTo(0,-35); g.lineTo(-25,25); g.strokeEllipse(0,25,50,15); break;
            case 'piramide': g.moveTo(0,-35); g.lineTo(30,20); g.lineTo(0,35); g.lineTo(-30,20); g.closePath(); g.moveTo(0,-35); g.lineTo(0,35); break;
            case 'obelisco': g.strokeRect(-15, -40, 30, 80); g.moveTo(-15, -40); g.lineTo(0, -55); g.lineTo(15, -40); break;
            case 'fractal': g.moveTo(0,-35); g.lineTo(30,25); g.lineTo(-30,25); g.closePath(); g.moveTo(0,25); g.lineTo(15,-5); g.lineTo(-15,-5); g.closePath(); break;
            case 'esfera': g.strokeCircle(0, 0, 28); g.strokeEllipse(0, 0, 56, 20); g.strokeEllipse(0, 0, 20, 56); break;
            case 'mira': g.strokeCircle(0, 0, 25); g.moveTo(0, -35); g.lineTo(0, 35); g.moveTo(-35, 0); g.lineTo(35, 0); break;
            case 'cristal': g.moveTo(0, -40); g.lineTo(20, 0); g.lineTo(0, 40); g.lineTo(-20, 0); g.closePath(); g.moveTo(0, -40); g.lineTo(0, 40); g.moveTo(-20, 0); g.lineTo(20, 0); break;
            
            // === NOVAS FORMAS DE ALQUIMIA ===
            // Cápsula: Cilindro com extremidades arredondadas
            case 'capsula': 
                g.arc(0, -20, 18, Math.PI, 0); // Topo arredondado
                g.lineTo(18, 20);
                g.arc(0, 20, 18, 0, Math.PI); // Base arredondada
                g.lineTo(-18, -20);
                g.closePath();
                break;
            
            // Domo: Semi-esfera sobre base
            case 'domo':
                g.arc(0, 10, 28, Math.PI, 0); // Cúpula
                g.lineTo(28, 25);
                g.lineTo(-28, 25);
                g.closePath();
                g.moveTo(-28, 10); g.lineTo(28, 10); // Linha da base
                break;
            
            // Monólito: Retângulo vertical imponente
            case 'monolito':
                g.strokeRect(-12, -45, 24, 90);
                // Linhas internas para profundidade
                g.moveTo(-8, -40); g.lineTo(-8, 40);
                g.moveTo(8, -40); g.lineTo(8, 40);
                // Topo chanfrado
                g.moveTo(-12, -45); g.lineTo(0, -50); g.lineTo(12, -45);
                break;
            
            // Tesseract: Cubo 4D (representação 2D)
            case 'tesseract':
                // Cubo externo
                g.strokeRect(-25, -25, 50, 50);
                // Cubo interno
                g.strokeRect(-15, -15, 30, 30);
                // Conectores (arestas da 4ª dimensão)
                g.moveTo(-25, -25); g.lineTo(-15, -15);
                g.moveTo(25, -25); g.lineTo(15, -15);
                g.moveTo(-25, 25); g.lineTo(-15, 15);
                g.moveTo(25, 25); g.lineTo(15, 15);
                break;
            
            // Estrela: Polígono estrelado de 5 pontas
            case 'estrela':
                for (let i = 0; i < 10; i++) {
                    const angle = (i * 36 - 90) * Math.PI / 180;
                    const r = i % 2 === 0 ? 28 : 12; // Alterna raio
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * r;
                    if (i === 0) g.moveTo(px, py);
                    else g.lineTo(px, py);
                }
                g.closePath();
                break;
            
            // ═══ DLC: EXOTIC MATTER - ESPIRAL DE FIBONACCI ═══
            case 'espiral':
                // Espiral de Arquimedes: r = a + b*θ
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
                // Não fecha o path - espiral é aberta
                break;
            
            // Olho: Forma de amêndoa com círculo central
            case 'olho':
                // Contorno do olho (duas curvas)
                g.moveTo(-30, 0);
                g.quadraticCurveTo(0, -25, 30, 0);
                g.quadraticCurveTo(0, 25, -30, 0);
                // Íris
                g.moveTo(12, 0);
                g.arc(0, 0, 12, 0, Math.PI * 2);
                // Pupila
                g.moveTo(5, 0);
                g.arc(0, 0, 5, 0, Math.PI * 2);
                break;
            
            // Anomaly: Renderizado pelo sistema de Glitch, fallback para polígono irregular
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
                    // Fallback: hexágono distorcido
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

    // ══════════ SISTEMA DE TEXTURAS QUÍMICAS (MATERIAIS) ══════════
    
    /**
     * Desenha padrões internos baseados no material químico
     * Cada material tem uma textura procedural única
     */
    drawChemistryPattern(g, shapeId, chemId, size, color) {
        if (!chemId) return;
        
        // Cor do padrão (mais clara que o corpo)
        const patternColor = this.lightenColor(color, 0.4);
        const patternAlpha = 0.35;
        
        switch (chemId) {
            case 'ouro':
                // OURO: Brilhos especulares (pequenas elipses brilhantes)
                this.drawGoldSpecular(g, size, patternColor, patternAlpha);
                break;
                
            case 'ferro':
                // FERRO: Hachuras diagonais (metal reforçado)
                this.drawIronHatching(g, shapeId, size, patternColor, patternAlpha);
                break;
                
            case 'cristal':
                // CRISTAL: Linhas do centro aos vértices (facetado)
                this.drawCrystalFacets(g, shapeId, size, patternColor, patternAlpha);
                break;
                
            case 'mercurio':
                // MERCURIO: Ondas/bolhas internas (líquido)
                this.drawMercuryWaves(g, size, patternColor, patternAlpha);
                break;
                
            case 'silicio':
                // SILÍCIO: Circuito impresso (linhas ortogonais)
                this.drawSiliconCircuit(g, size, patternColor, patternAlpha);
                break;
                
            case 'uranio':
                // URÂNIO: Núcleo radioativo + anéis de órbita
                this.drawUraniumCore(g, size, patternColor, patternAlpha);
                break;
            
            // ═══ DLC: EXOTIC MATTER ═══
            case 'bismuto':
                // BISMUTO: Degraus quadrados concêntricos iridescentes
                this.drawBismutoCrystal(g, size, patternAlpha);
                break;
                
            case 'carbono':
            default:
                // CARBONO: Grid sutil (estrutura molecular)
                this.drawCarbonGrid(g, size, patternColor, patternAlpha * 0.5);
                break;
        }
    }
    
    // === OURO: Brilhos especulares ===
    drawGoldSpecular(g, size, color, alpha) {
        g.fillStyle(0xFFFFFF, alpha * 1.2);
        
        // Brilho principal (canto superior esquerdo)
        g.fillEllipse(-size * 0.4, -size * 0.4, size * 0.25, size * 0.12);
        
        // Brilho secundário menor
        g.fillEllipse(-size * 0.2, -size * 0.55, size * 0.12, size * 0.06);
        
        // Brilho inferior direito (reflexo)
        g.fillStyle(0xFFFFFF, alpha * 0.6);
        g.fillEllipse(size * 0.3, size * 0.3, size * 0.15, size * 0.08);
        
        // Preenchimento dourado extra
        g.fillStyle(0xFFD700, alpha * 0.4);
        g.fillCircle(0, 0, size * 0.5);
    }
    
    // === FERRO: Hachuras diagonais ===
    drawIronHatching(g, shapeId, size, color, alpha) {
        g.lineStyle(1, color, alpha);
        
        const spacing = 6;
        const extent = size * 0.85;
        
        // Linhas diagonais ////
        for (let i = -extent * 2; i < extent * 2; i += spacing) {
            g.beginPath();
            g.moveTo(i - extent, -extent);
            g.lineTo(i + extent, extent);
            g.strokePath();
        }
        
        // Segunda camada cruzada (para efeito metálico)
        g.lineStyle(0.5, color, alpha * 0.5);
        for (let i = -extent * 2; i < extent * 2; i += spacing * 2) {
            g.beginPath();
            g.moveTo(i + extent, -extent);
            g.lineTo(i - extent, extent);
            g.strokePath();
        }
    }
    
    // === CRISTAL: Linhas facetadas do centro aos vértices ===
    drawCrystalFacets(g, shapeId, size, color, alpha) {
        g.lineStyle(1, color, alpha);
        
        // Número de facetas baseado na forma
        let facets = 6;
        switch (shapeId) {
            case 'triangulo': facets = 3; break;
            case 'quadrado': facets = 4; break;
            case 'pentagono': facets = 5; break;
            case 'hexagono': facets = 6; break;
            case 'circulo': facets = 8; break;
            default: facets = 6;
        }
        
        // Linhas do centro aos vértices
        for (let i = 0; i < facets; i++) {
            const angle = (i * (360 / facets) - 90) * Math.PI / 180;
            const px = Math.cos(angle) * size * 0.85;
            const py = Math.sin(angle) * size * 0.85;
            
            g.beginPath();
            g.moveTo(0, 0);
            g.lineTo(px, py);
            g.strokePath();
        }
        
        // Anel interno (estrutura cristalina)
        g.lineStyle(0.5, color, alpha * 0.7);
        g.strokeCircle(0, 0, size * 0.4);
    }
    
    // === MERCÚRIO: Ondas líquidas ===
    drawMercuryWaves(g, size, color, alpha) {
        const time = Date.now() * 0.002;
        
        // Bolha interna pulsante
        const pulseSize = size * 0.35 + Math.sin(time) * size * 0.08;
        g.fillStyle(color, alpha * 0.6);
        g.fillCircle(Math.sin(time * 1.3) * 3, Math.cos(time) * 3, pulseSize);
        
        // Ondas senoidais
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
    
    // === SILÍCIO: Circuito impresso ===
    drawSiliconCircuit(g, size, color, alpha) {
        g.lineStyle(1, color, alpha);
        
        const s = size * 0.6;
        
        // Trilhas horizontais
        g.beginPath();
        g.moveTo(-s, -s * 0.5); g.lineTo(-s * 0.3, -s * 0.5);
        g.lineTo(-s * 0.3, 0); g.lineTo(s * 0.3, 0);
        g.lineTo(s * 0.3, s * 0.5); g.lineTo(s, s * 0.5);
        g.strokePath();
        
        // Trilha vertical
        g.beginPath();
        g.moveTo(0, -s); g.lineTo(0, -s * 0.3);
        g.lineTo(s * 0.5, -s * 0.3); g.lineTo(s * 0.5, s * 0.3);
        g.lineTo(0, s * 0.3); g.lineTo(0, s);
        g.strokePath();
        
        // Nós (conexões)
        g.fillStyle(color, alpha * 1.5);
        g.fillCircle(-s * 0.3, -s * 0.5, 2);
        g.fillCircle(s * 0.3, 0, 2);
        g.fillCircle(0, s * 0.3, 2);
        g.fillCircle(s * 0.5, -s * 0.3, 2);
        
        // Chip central
        g.lineStyle(1.5, color, alpha);
        g.strokeRect(-s * 0.2, -s * 0.2, s * 0.4, s * 0.4);
    }
    
    // === URÂNIO: Núcleo radioativo ===
    drawUraniumCore(g, size, color, alpha) {
        const time = Date.now() * 0.003;
        
        // Núcleo pulsante
        const pulseAlpha = alpha * (0.7 + Math.sin(time * 2) * 0.3);
        g.fillStyle(0x00FF00, pulseAlpha);
        g.fillCircle(0, 0, size * 0.2);
        
        // Anéis de órbita
        g.lineStyle(1, color, alpha * 0.7);
        g.strokeCircle(0, 0, size * 0.4);
        g.strokeCircle(0, 0, size * 0.6);
        
        // Elétrons orbitando
        g.fillStyle(0xFFFF00, alpha * 1.2);
        for (let i = 0; i < 3; i++) {
            const angle = time * 2 + i * (Math.PI * 2 / 3);
            const orbitRadius = size * 0.4 + (i % 2) * size * 0.2;
            const ex = Math.cos(angle) * orbitRadius;
            const ey = Math.sin(angle) * orbitRadius * 0.5; // Elipse
            g.fillCircle(ex, ey, 3);
        }
    }
    
    // === CARBONO: Grid molecular sutil ===
    drawCarbonGrid(g, size, color, alpha) {
        g.lineStyle(0.5, color, alpha);
        
        const gridSize = 8;
        const extent = size * 0.7;
        
        // Grid horizontal
        for (let y = -extent; y <= extent; y += gridSize) {
            g.beginPath();
            g.moveTo(-extent, y);
            g.lineTo(extent, y);
            g.strokePath();
        }
        
        // Grid vertical
        for (let x = -extent; x <= extent; x += gridSize) {
            g.beginPath();
            g.moveTo(x, -extent);
            g.lineTo(x, extent);
            g.strokePath();
        }
    }
    
    // ═══ DLC: EXOTIC MATTER ═══
    
    // === BISMUTO: Degraus cristalinos iridescentes ===
    drawBismutoCrystal(g, size, alpha) {
        const time = Date.now() * 0.001;
        const layers = 5;
        
        // Cores iridescentes (arco-íris metálico)
        const iridescent = [
            0xFF6B9D, // Rosa
            0xFFB347, // Laranja
            0xFFEB3B, // Amarelo
            0x4ECDC4, // Turquesa
            0x9B59B6, // Roxo
            0x3498DB  // Azul
        ];
        
        // Degraus quadrados concêntricos
        for (let i = layers; i >= 0; i--) {
            const layerSize = size * (0.2 + i * 0.15);
            const offset = i * 2.5; // Deslocamento 3D
            
            // Cor muda com tempo (efeito holográfico)
            const colorIndex = Math.floor((i + time) % iridescent.length);
            const nextColor = iridescent[(colorIndex + 1) % iridescent.length];
            const currentColor = iridescent[colorIndex];
            
            // Interpolação suave entre cores
            const blend = (Math.sin(time * 2 + i) + 1) / 2;
            const finalColor = this.blendColors(currentColor, nextColor, blend);
            
            // Face superior (mais clara)
            g.fillStyle(finalColor, alpha * (0.4 + i * 0.08));
            g.fillRect(-layerSize / 2 - offset, -layerSize / 2 - offset, layerSize, layerSize);
            
            // Borda (efeito de degrau)
            g.lineStyle(1.5, 0xFFFFFF, alpha * 0.5);
            g.strokeRect(-layerSize / 2 - offset, -layerSize / 2 - offset, layerSize, layerSize);
        }
        
        // Brilho especular central
        g.fillStyle(0xFFFFFF, alpha * 0.8);
        g.fillCircle(-size * 0.2, -size * 0.2, 3);
    }
    
    // === UTILITÁRIOS DE COR ===
    
    /**
     * Clareia uma cor hexadecimal
     */
    lightenColor(color, amount) {
        const r = Math.min(255, ((color >> 16) & 0xFF) + 255 * amount);
        const gr = Math.min(255, ((color >> 8) & 0xFF) + 255 * amount);
        const b = Math.min(255, (color & 0xFF) + 255 * amount);
        return (Math.floor(r) << 16) | (Math.floor(gr) << 8) | Math.floor(b);
    }
    
    /**
     * Mistura duas cores com um peso
     */
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

    // ══════════ SISTEMA DE ANOMALIA (GLITCH VISUAL) ══════════
    
    /**
     * Renderiza uma Anomalia com efeito de glitch/instabilidade
     * Cria múltiplas camadas deslocadas e cores caóticas
     */
    drawAnomalyGlitch(g, type, bodyColor, auraColor, chemType) {
        const intensity = this.glitchIntensity || 0.5;
        const time = Date.now() * 0.01;
        
        // Atualiza offset de glitch (vibração)
        if (Math.random() < 0.3 * intensity) {
            this.glitchOffset.x = (Math.random() - 0.5) * 8 * intensity;
            this.glitchOffset.y = (Math.random() - 0.5) * 6 * intensity;
        }
        
        // Cores glitchadas (shift RGB)
        const glitchColor1 = this.shiftColor(auraColor, 40, 0, -40); // Cyan shift
        const glitchColor2 = this.shiftColor(auraColor, -40, 0, 40); // Magenta shift
        
        const lineWidth = this.visualDNA?.lineWidth || 2;
        const params = this.proceduralParams || { sides: 7, roughness: 0.3, seed: 42 };
        
        // === CAMADA 1: Sombra Glitch (Cyan) ===
        g.save();
        g.translateCanvas(this.glitchOffset.x * 1.5, this.glitchOffset.y * 0.5);
        g.lineStyle(lineWidth + 4, glitchColor1, 0.4);
        this.drawAnomalyPath(g, params, time * 0.7);
        g.strokePath();
        g.restore();
        
        // === CAMADA 2: Sombra Glitch (Magenta) ===
        g.save();
        g.translateCanvas(-this.glitchOffset.x, this.glitchOffset.y * 1.2);
        g.lineStyle(lineWidth + 4, glitchColor2, 0.4);
        this.drawAnomalyPath(g, params, time * 1.3);
        g.strokePath();
        g.restore();
        
        // === CAMADA 3: Fill com opacidade variável ===
        const fillAlpha = 0.1 + Math.sin(time * 0.5) * 0.05 * intensity;
        g.fillStyle(bodyColor, fillAlpha);
        this.drawAnomalyPath(g, params, time);
        g.fillPath();
        
        // === CAMADA 3.5: Padrão Químico (mesmo em anomalias) ===
        if (chemType) {
            this.drawChemistryPattern(g, 'anomaly', chemType, 25, bodyColor);
        }
        
        // === CAMADA 4: Aura pulsante ===
        const pulseSize = 6 + Math.sin(time * 2) * 2 * intensity;
        g.lineStyle(lineWidth + pulseSize, auraColor, 0.25 + Math.sin(time) * 0.1);
        this.drawAnomalyPath(g, params, time);
        g.strokePath();
        
        // === CAMADA 5: Corpo principal (vibra levemente) ===
        g.save();
        g.translateCanvas(this.glitchOffset.x * 0.3, this.glitchOffset.y * 0.3);
        g.lineStyle(lineWidth, bodyColor, 1);
        this.drawAnomalyPath(g, params, time);
        g.strokePath();
        g.restore();
        
        // === CAMADA 6: Linhas de interferência (scanlines) ===
        if (Math.random() < 0.4 * intensity) {
            this.drawScanlines(g, intensity);
        }
    }
    
    /**
     * Desenha o path de uma anomalia (forma procedural instável)
     */
    drawAnomalyPath(g, params, timeOffset = 0) {
        const { sides, roughness, seed } = params;
        const radius = 28;
        
        g.beginPath();
        for (let i = 0; i <= sides; i++) {
            const angle = (i * (Math.PI * 2)) / sides;
            // Adiciona instabilidade temporal à forma
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
    
    /**
     * Desenha linhas de interferência (efeito CRT/VHS)
     */
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
    
    /**
     * Desloca componentes RGB de uma cor
     */
    shiftColor(color, rShift, gShift, bShift) {
        let r = ((color >> 16) & 0xff) + rShift;
        let g = ((color >> 8) & 0xff) + gShift;
        let b = (color & 0xff) + bShift;
        
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        
        return (r << 16) | (g << 8) | b;
    }

    // ========== SISTEMA DE EXPRESSÃO (ROSTO) ==========
    
    drawFace() {
        if (!this.faceGraphics || !this.expressionState) return;
        
        const g = this.faceGraphics;
        g.clear();
        
        const state = this.expressionState;
        const lifePct = this.maxLife > 0 ? this.currentLife / this.maxLife : 1;
        
        // INSTINTOS REATIVOS: Sobrepõe tudo quando ativo
        if (this.instincts?.active && this.instincts.intensity > 0.05) {
            this.drawInstinctFace(g, this.faceScale || 1);
            return;
        }
        
        const previousMood = state.mood;
        
        // Determina o humor baseado na vida (se não há ação especial)
        if (!state.action) {
            if (lifePct > 0.7) state.mood = 'happy';
            else if (lifePct > 0.5) state.mood = 'neutral';
            else if (lifePct > 0.3) state.mood = 'sad';
            else if (lifePct > 0) state.mood = 'dying';
            else state.mood = 'dead';
            
            if (state.mood === 'dying' && previousMood !== 'dying' && !this.hasDyingSpoken) {
                this.hasDyingSpoken = true;
                this.speakContextual('dying');
            }
        }
        
        // Escala adaptativa: Golems pequenos têm rostos proporcionalmente maiores
        const scale = this.faceScale || 1;
        const minLine = this.minLineWidth || 1.5;
        
        // Estilo de linha baseado na química (com mínimo garantido)
        let lineWidth = Math.max(minLine, 2 * scale);
        switch(this.currentChem) {
            case 'ferro': lineWidth = Math.max(minLine, 3 * scale); break;
            case 'ouro': lineWidth = Math.max(minLine, 2.5 * scale); break;
            case 'cristal': lineWidth = Math.max(minLine, 1.5 * scale); break;
            case 'mercurio': lineWidth = Math.max(minLine, 2 * scale); break;
            case 'plasma': lineWidth = Math.max(minLine, 2 * scale); break;
        }
        
        // Offset dos olhos baseado na física (personalidade)
        let eyeJitter = { x: 0, y: 0 };
        const physics = this.currentPhysics || 'luz';
        switch(physics) {
            case 'eletricidade':
                eyeJitter.x = (Math.random() - 0.5) * 3 * scale;
                eyeJitter.y = (Math.random() - 0.5) * 2 * scale;
                break;
            case 'gravidade':
                eyeJitter.y = 2 * scale; // Olhos caídos
                break;
            case 'magnetismo':
                eyeJitter.x = Math.sin(Date.now() / 500) * 2 * scale;
                break;
        }
        
        this.eyeOffset.x = eyeJitter.x;
        this.eyeOffset.y = eyeJitter.y;
        
        // Desenha o rosto baseado no estado atual
        if (state.action) {
            this.drawActionFace(g, state.action, lineWidth, scale);
        } else {
            this.drawMoodFace(g, state.mood, lineWidth, scale);
        }
    }
    
    drawMoodFace(g, mood, lineWidth, scale = 1) {
        // Usa detailColor para o rosto (herança genética cruzada)
        const color = this.visualDNA?.detailColor || this.currentColor || 0x00ffff;
        const ox = this.eyeOffset.x || 0;
        const oy = this.eyeOffset.y || 0;
        const blinking = this.isBlinking;
        const s = scale; // Escala adaptativa
        
        // Glow nos olhos com cor de detalhe
        g.lineStyle(lineWidth + 4 * s, color, 0.3);
        
        switch(mood) {
            case 'happy':
                // Olhos: círculos brilhantes
                if (!blinking) {
                    g.strokeCircle(-8*s + ox, -5*s + oy, 4*s);
                    g.strokeCircle(8*s + ox, -5*s + oy, 4*s);
                } else {
                    g.beginPath();
                    g.moveTo(-12*s + ox, -5*s + oy); g.lineTo(-4*s + ox, -5*s + oy);
                    g.moveTo(4*s + ox, -5*s + oy); g.lineTo(12*s + ox, -5*s + oy);
                    g.strokePath();
                }
                // Boca: sorriso
                g.beginPath();
                g.arc(0, 5*s, 8*s, 0.2, Math.PI - 0.2);
                g.strokePath();
                break;
                
            case 'neutral':
                // Olhos: pontos
                if (!blinking) {
                    g.fillStyle(color, 0.8);
                    g.fillCircle(-8*s + ox, -5*s + oy, 3*s);
                    g.fillCircle(8*s + ox, -5*s + oy, 3*s);
                } else {
                    g.beginPath();
                    g.moveTo(-11*s + ox, -5*s + oy); g.lineTo(-5*s + ox, -5*s + oy);
                    g.moveTo(5*s + ox, -5*s + oy); g.lineTo(11*s + ox, -5*s + oy);
                    g.strokePath();
                }
                // Boca: linha reta
                g.beginPath();
                g.moveTo(-6*s, 8*s); g.lineTo(6*s, 8*s);
                g.strokePath();
                break;
                
            case 'sad':
                // Olhos: semicerrados
                g.beginPath();
                g.moveTo(-12*s + ox, -6*s + oy); g.lineTo(-4*s + ox, -4*s + oy);
                g.moveTo(4*s + ox, -4*s + oy); g.lineTo(12*s + ox, -6*s + oy);
                g.strokePath();
                // Boca: triste
                g.beginPath();
                g.arc(0, 12*s, 6*s, Math.PI + 0.3, -0.3);
                g.strokePath();
                break;
                
            case 'dying':
                // Olhos: X com lágrimas
                g.beginPath();
                g.moveTo(-11*s + ox, -8*s + oy); g.lineTo(-5*s + ox, -2*s + oy);
                g.moveTo(-5*s + ox, -8*s + oy); g.lineTo(-11*s + ox, -2*s + oy);
                g.moveTo(5*s + ox, -8*s + oy); g.lineTo(11*s + ox, -2*s + oy);
                g.moveTo(11*s + ox, -8*s + oy); g.lineTo(5*s + ox, -2*s + oy);
                g.strokePath();
                // Lágrimas (gotas)
                g.fillStyle(color, 0.5);
                g.fillCircle(-8*s + ox, 2*s + oy, 2*s);
                g.fillCircle(8*s + ox, 2*s + oy, 2*s);
                // Boca tremendo
                const wobble = Math.sin(Date.now() / 100) * 2 * s;
                g.beginPath();
                g.arc(0 + wobble, 12*s, 5*s, Math.PI + 0.2, -0.2);
                g.strokePath();
                break;
                
            case 'dead':
                // Olhos: X X
                g.beginPath();
                g.moveTo(-11*s, -8*s); g.lineTo(-5*s, -2*s);
                g.moveTo(-5*s, -8*s); g.lineTo(-11*s, -2*s);
                g.moveTo(5*s, -8*s); g.lineTo(11*s, -2*s);
                g.moveTo(11*s, -8*s); g.lineTo(5*s, -2*s);
                g.strokePath();
                // Boca: O aberto
                g.strokeCircle(0, 10*s, 5*s);
                break;
        }
        
        // Traço interno (branco) - repete o desenho
        g.lineStyle(lineWidth, 0xffffff, 1);
        this.drawMoodFaceInner(g, mood, ox, oy, blinking, s);
    }
    
    drawMoodFaceInner(g, mood, ox, oy, blinking, scale = 1) {
        const s = scale;
        switch(mood) {
            case 'happy':
                if (!blinking) {
                    g.strokeCircle(-8*s + ox, -5*s + oy, 4*s);
                    g.strokeCircle(8*s + ox, -5*s + oy, 4*s);
                } else {
                    g.beginPath();
                    g.moveTo(-12*s + ox, -5*s + oy); g.lineTo(-4*s + ox, -5*s + oy);
                    g.moveTo(4*s + ox, -5*s + oy); g.lineTo(12*s + ox, -5*s + oy);
                    g.strokePath();
                }
                g.beginPath();
                g.arc(0, 5*s, 8*s, 0.2, Math.PI - 0.2);
                g.strokePath();
                break;
            case 'neutral':
                if (!blinking) {
                    g.fillStyle(0xffffff, 1);
                    g.fillCircle(-8*s + ox, -5*s + oy, 2*s);
                    g.fillCircle(8*s + ox, -5*s + oy, 2*s);
                } else {
                    g.beginPath();
                    g.moveTo(-11*s + ox, -5*s + oy); g.lineTo(-5*s + ox, -5*s + oy);
                    g.moveTo(5*s + ox, -5*s + oy); g.lineTo(11*s + ox, -5*s + oy);
                    g.strokePath();
                }
                g.beginPath();
                g.moveTo(-6*s, 8*s); g.lineTo(6*s, 8*s);
                g.strokePath();
                break;
            case 'sad':
                g.beginPath();
                g.moveTo(-12*s + ox, -6*s + oy); g.lineTo(-4*s + ox, -4*s + oy);
                g.moveTo(4*s + ox, -4*s + oy); g.lineTo(12*s + ox, -6*s + oy);
                g.strokePath();
                g.beginPath();
                g.arc(0, 12*s, 6*s, Math.PI + 0.3, -0.3);
                g.strokePath();
                break;
            case 'dying':
                g.beginPath();
                g.moveTo(-11*s + ox, -8*s + oy); g.lineTo(-5*s + ox, -2*s + oy);
                g.moveTo(-5*s + ox, -8*s + oy); g.lineTo(-11*s + ox, -2*s + oy);
                g.moveTo(5*s + ox, -8*s + oy); g.lineTo(11*s + ox, -2*s + oy);
                g.moveTo(11*s + ox, -8*s + oy); g.lineTo(5*s + ox, -2*s + oy);
                g.strokePath();
                const wobble = Math.sin(Date.now() / 100) * 2 * s;
                g.beginPath();
                g.arc(0 + wobble, 12*s, 5*s, Math.PI + 0.2, -0.2);
                g.strokePath();
                break;
            case 'dead':
                g.beginPath();
                g.moveTo(-11*s, -8*s); g.lineTo(-5*s, -2*s);
                g.moveTo(-5*s, -8*s); g.lineTo(-11*s, -2*s);
                g.moveTo(5*s, -8*s); g.lineTo(11*s, -2*s);
                g.moveTo(11*s, -8*s); g.lineTo(5*s, -2*s);
                g.strokePath();
                g.strokeCircle(0, 10*s, 5*s);
                break;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ROSTO DE INSTINTOS - Expressão dinâmica baseada na ferramenta próxima
    // ═══════════════════════════════════════════════════════════════════
    
    drawInstinctFace(g, scale = 1) {
        const s = scale;
        const inst = this.instincts;
        const intensity = inst.intensity || 0;
        const tremor = inst.tremor || { x: 0, y: 0 };
        const state = inst.state;
        const lineWidth = Math.max(this.minLineWidth || 1.5, s * 1.5);
        const baseColor = this.visualDNA?.detailColor || this.currentColor || 0x00ffff;
        const time = Date.now();
        
        switch (state) {
            case 'seeking':
                this.drawSeekingFace(g, s, intensity, baseColor, time, lineWidth);
                break;
                
            case 'fleeing':
                this.drawFleeingFace(g, s, intensity, tremor, time, lineWidth);
                break;
                
            case 'freezing':
                this.drawFreezingFace(g, s, intensity, tremor, time, lineWidth);
                break;
                
            case 'curious':
                this.drawCuriousFace(g, s, intensity, baseColor, time, lineWidth);
                break;
                
            default:
                this.drawMoodFace(g, 'neutral', lineWidth, s);
        }
    }
    
    drawCuriousFace(g, s, intensity, color, time, lineWidth) {
        const tilt = Math.sin(time / 200) * 3 * s * intensity;
        const blink = Math.sin(time / 120);
        
        const mutateColor = 0xff66ff;
        g.lineStyle(lineWidth + 3 * s, mutateColor, 0.4 * intensity);
        
        const eyeSize = (4 + intensity) * s;
        g.strokeCircle(-8 * s + tilt, -5 * s, eyeSize);
        g.strokeCircle(8 * s + tilt, -5 * s, eyeSize + blink * s);
        
        g.fillStyle(mutateColor, 0.8);
        g.fillCircle(-7 * s + tilt, -6 * s, 2 * s);
        g.fillCircle(9 * s + tilt, -6 * s, 2 * s);
        
        g.lineStyle(lineWidth, 0xffffff, 1);
        g.strokeCircle(-8 * s + tilt, -5 * s, eyeSize);
        g.strokeCircle(8 * s + tilt, -5 * s, eyeSize + blink * s);
        
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(-6 * s + tilt, -7 * s, 1 * s);
        g.fillCircle(10 * s + tilt, -7 * s, 1 * s);
        
        g.lineStyle(lineWidth, 0xffffff, 1);
        g.beginPath();
        g.moveTo(-4 * s, 8 * s);
        g.lineTo(0, 10 * s);
        g.lineTo(4 * s, 8 * s);
        g.strokePath();
        
        g.lineStyle(lineWidth, 0xffffff, 0.8);
        g.beginPath();
        g.moveTo(-11 * s, -11 * s); g.lineTo(-5 * s, -9 * s);
        g.moveTo(11 * s, -9 * s); g.lineTo(5 * s, -11 * s);
        g.strokePath();
        
        if (intensity > 0.5) {
            g.lineStyle(2, mutateColor, 0.3);
            g.beginPath();
            g.moveTo(14 * s, -8 * s);
            g.lineTo(18 * s, -12 * s);
            g.lineTo(16 * s, -8 * s);
            g.strokePath();
        }
    }
    
    drawSeekingFace(g, s, intensity, color, time, lineWidth) {
        // Olhos brilhando de excitação - pupilas dilatadas
        const pupilGrow = 1 + intensity * 0.8;
        const sparkle = Math.sin(time / 80) * 0.3 + 0.7;
        const eyeBounce = Math.sin(time / 100) * 2 * intensity * s;
        
        // Glow dourado/verde de fome
        const hungerColor = 0x88ff44;
        g.lineStyle(lineWidth + 4 * s, hungerColor, 0.4 * intensity);
        
        // Olhos arregalados de expectativa
        const eyeSize = (5 + intensity * 2) * s;
        g.strokeCircle(-8 * s, -5 * s + eyeBounce, eyeSize);
        g.strokeCircle(8 * s, -5 * s + eyeBounce, eyeSize);
        
        // Pupilas grandes e brilhantes (dilatadas de desejo)
        g.fillStyle(hungerColor, sparkle);
        g.fillCircle(-8 * s, -5 * s + eyeBounce, 3 * s * pupilGrow);
        g.fillCircle(8 * s, -5 * s + eyeBounce, 3 * s * pupilGrow);
        
        // Brilho nos olhos (reflexo)
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(-6 * s, -7 * s + eyeBounce, 1.2 * s);
        g.fillCircle(10 * s, -7 * s + eyeBounce, 1.2 * s);
        
        // Traço branco interno
        g.lineStyle(lineWidth, 0xffffff, 1);
        g.strokeCircle(-8 * s, -5 * s + eyeBounce, eyeSize);
        g.strokeCircle(8 * s, -5 * s + eyeBounce, eyeSize);
        
        // Boca: sorriso crescente de antecipação
        const smileWidth = 0.3 + intensity * 0.5;
        g.lineStyle(lineWidth + 2 * s, hungerColor, 0.3);
        g.beginPath();
        g.arc(0, 6 * s, 8 * s, smileWidth, Math.PI - smileWidth);
        g.strokePath();
        
        g.lineStyle(lineWidth, 0xffffff, 1);
        g.beginPath();
        g.arc(0, 6 * s, 8 * s, smileWidth, Math.PI - smileWidth);
        g.strokePath();
        
        // Sobrancelhas levantadas (surpresa feliz)
        g.lineStyle(lineWidth, 0xffffff, 0.8);
        g.beginPath();
        g.moveTo(-12 * s, -12 * s - intensity * 3 * s);
        g.lineTo(-4 * s, -14 * s - intensity * 3 * s);
        g.moveTo(4 * s, -14 * s - intensity * 3 * s);
        g.lineTo(12 * s, -12 * s - intensity * 3 * s);
        g.strokePath();
        
        // Gotinha de saliva (intensidade alta)
        if (intensity > 0.6) {
            const drip = Math.sin(time / 150) * 2 * s;
            g.fillStyle(0x88ccff, 0.6);
            g.fillCircle(6 * s, 14 * s + drip, 2 * s * intensity);
        }
    }
    
    drawFleeingFace(g, s, intensity, tremor, time, lineWidth) {
        // TERROR PURO - olhos arregalados, pupilas minúsculas, boca aberta
        const jitterX = (Math.random() - 0.5) * 4 * intensity;
        const jitterY = (Math.random() - 0.5) * 3 * intensity;
        
        // Cor avermelhada de pânico
        const terrorColor = 0xff4444;
        
        // Pupilas contráem com o medo (resposta primitiva)
        const pupilSize = Math.max(0.5, 3 - intensity * 2.5) * s;
        const eyeOpenness = (6 + intensity * 4) * s;
        
        // Glow vermelho de terror
        g.lineStyle(lineWidth + 4 * s, terrorColor, 0.5 * intensity);
        
        // Olhos ARREGALADOS
        const leftX = -8 * s + jitterX + tremor.x;
        const leftY = -5 * s + jitterY + tremor.y;
        const rightX = 8 * s + jitterX + tremor.x;
        const rightY = -5 * s + jitterY + tremor.y;
        
        g.strokeCircle(leftX, leftY, eyeOpenness);
        g.strokeCircle(rightX, rightY, eyeOpenness);
        
        // Pupilas minúsculas (contraídas pelo terror)
        g.fillStyle(terrorColor, 1);
        g.fillCircle(leftX, leftY, pupilSize);
        g.fillCircle(rightX, rightY, pupilSize);
        
        // Traço branco
        g.lineStyle(lineWidth, 0xffffff, 1);
        g.strokeCircle(leftX, leftY, eyeOpenness);
        g.strokeCircle(rightX, rightY, eyeOpenness);
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(leftX, leftY, pupilSize * 0.6);
        g.fillCircle(rightX, rightY, pupilSize * 0.6);
        
        // Boca: "O" de horror (grito silencioso)
        const mouthWobble = Math.sin(time / 40) * 3 * s * intensity;
        const mouthSize = (5 + intensity * 3) * s;
        
        g.lineStyle(lineWidth + 2 * s, terrorColor, 0.4 * intensity);
        g.strokeCircle(mouthWobble + tremor.x, 10 * s + tremor.y, mouthSize);
        
        g.lineStyle(lineWidth, 0xffffff, 1);
        g.strokeCircle(mouthWobble + tremor.x, 10 * s + tremor.y, mouthSize);
        
        // Sobrancelhas: levantadas e arqueadas (medo)
        const browRaise = intensity * 5 * s;
        g.lineStyle(lineWidth * 1.5, 0xffffff, 0.9);
        g.beginPath();
        g.moveTo(-14 * s + tremor.x, -10 * s - browRaise + tremor.y);
        g.lineTo(-8 * s + tremor.x, -14 * s - browRaise + tremor.y);
        g.lineTo(-2 * s + tremor.x, -11 * s - browRaise + tremor.y);
        g.moveTo(2 * s + tremor.x, -11 * s - browRaise + tremor.y);
        g.lineTo(8 * s + tremor.x, -14 * s - browRaise + tremor.y);
        g.lineTo(14 * s + tremor.x, -10 * s - browRaise + tremor.y);
        g.strokePath();
        
        // Lágrimas de medo
        if (intensity > 0.4) {
            const tearDrop = Math.sin(time / 120) * 2 * s;
            g.fillStyle(0x88ccff, 0.7);
            g.fillCircle(leftX - 4 * s, leftY + 10 * s + tearDrop, 2.5 * s * intensity);
            g.fillCircle(rightX + 4 * s, rightY + 10 * s + tearDrop, 2.5 * s * intensity);
        }
        
        // Linhas de estresse (intensidade muito alta)
        if (intensity > 0.7) {
            g.lineStyle(1, terrorColor, 0.4);
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 / 4) * i + time / 400;
                g.beginPath();
                g.moveTo(Math.cos(angle) * 18 * s, Math.sin(angle) * 18 * s);
                g.lineTo(Math.cos(angle) * 25 * s, Math.sin(angle) * 25 * s);
                g.strokePath();
            }
        }
    }
    
    drawFreezingFace(g, s, intensity, tremor, time, lineWidth) {
        // Tremendo de frio - olhos semicerrados, boca tensa
        const shiver = Math.sin(time / 30) * 2 * intensity;
        
        // Cor azulada de frio
        const coldColor = 0x66ccff;
        
        g.lineStyle(lineWidth + 3 * s, coldColor, 0.4 * intensity);
        
        // Olhos semicerrados (tentando se proteger)
        const eyeSquint = 3 + (1 - intensity) * 3;
        g.strokeCircle(-8 * s + tremor.x + shiver, -5 * s + tremor.y, eyeSquint * s);
        g.strokeCircle(8 * s + tremor.x + shiver, -5 * s + tremor.y, eyeSquint * s);
        
        // Pupilas pequenas
        g.fillStyle(coldColor, 0.8);
        g.fillCircle(-8 * s + tremor.x + shiver, -5 * s + tremor.y, 1.5 * s);
        g.fillCircle(8 * s + tremor.x + shiver, -5 * s + tremor.y, 1.5 * s);
        
        // Traço branco
        g.lineStyle(lineWidth, 0xffffff, 1);
        g.strokeCircle(-8 * s + tremor.x + shiver, -5 * s + tremor.y, eyeSquint * s);
        g.strokeCircle(8 * s + tremor.x + shiver, -5 * s + tremor.y, eyeSquint * s);
        
        // Boca: linha tremendo
        const mouthWobble = Math.sin(time / 50) * 4 * s * intensity;
        g.lineStyle(lineWidth + 1 * s, coldColor, 0.3);
        g.beginPath();
        g.moveTo(-6 * s + tremor.x + mouthWobble, 10 * s + tremor.y);
        g.lineTo(-2 * s + tremor.x - mouthWobble, 12 * s + tremor.y);
        g.lineTo(2 * s + tremor.x + mouthWobble, 10 * s + tremor.y);
        g.lineTo(6 * s + tremor.x - mouthWobble, 12 * s + tremor.y);
        g.strokePath();
        
        g.lineStyle(lineWidth, 0xffffff, 1);
        g.beginPath();
        g.moveTo(-6 * s + tremor.x + mouthWobble, 10 * s + tremor.y);
        g.lineTo(-2 * s + tremor.x - mouthWobble, 12 * s + tremor.y);
        g.lineTo(2 * s + tremor.x + mouthWobble, 10 * s + tremor.y);
        g.lineTo(6 * s + tremor.x - mouthWobble, 12 * s + tremor.y);
        g.strokePath();
        
        // Sobrancelhas tensas (preocupadas)
        g.lineStyle(lineWidth, 0xffffff, 0.8);
        g.beginPath();
        g.moveTo(-12 * s + tremor.x, -10 * s + tremor.y);
        g.lineTo(-4 * s + tremor.x, -12 * s + tremor.y);
        g.moveTo(4 * s + tremor.x, -12 * s + tremor.y);
        g.lineTo(12 * s + tremor.x, -10 * s + tremor.y);
        g.strokePath();
        
        // Cristais de gelo ao redor
        if (intensity > 0.3) {
            g.lineStyle(1, coldColor, 0.5);
            const crystals = Math.floor(3 + intensity * 3);
            for (let i = 0; i < crystals; i++) {
                const angle = (Math.PI * 2 / crystals) * i + time / 1000;
                const dist = 16 * s;
                const cx = Math.cos(angle) * dist + tremor.x;
                const cy = Math.sin(angle) * dist + tremor.y;
                
                g.beginPath();
                g.moveTo(cx, cy - 3 * s); g.lineTo(cx, cy + 3 * s);
                g.moveTo(cx - 2 * s, cy - 1 * s); g.lineTo(cx + 2 * s, cy + 1 * s);
                g.moveTo(cx - 2 * s, cy + 1 * s); g.lineTo(cx + 2 * s, cy - 1 * s);
                g.strokePath();
            }
        }
    }
    
    drawActionFace(g, action, lineWidth, scale = 1) {
        const color = this.currentColor || 0x00ffff;
        const s = scale;
        
        g.lineStyle(lineWidth + 4*s, color, 0.3);
        
        switch(action) {
            case 'born':
                // Olhos enormes de surpresa
                g.strokeCircle(-8*s, -5*s, 6*s);
                g.strokeCircle(8*s, -5*s, 6*s);
                g.fillStyle(color, 0.8);
                g.fillCircle(-8*s, -5*s, 3*s);
                g.fillCircle(8*s, -5*s, 3*s);
                // Boca: O pequeno
                g.strokeCircle(0, 10*s, 4*s);
                break;
                
            case 'feed':
                // Olhos fechados felizes (^ ^)
                g.beginPath();
                g.arc(-8*s, -5*s, 5*s, Math.PI + 0.5, -0.5);
                g.arc(8*s, -5*s, 5*s, Math.PI + 0.5, -0.5);
                g.strokePath();
                // Boca: mastigando (ω)
                const chew = Math.sin(Date.now() / 80) * 2 * s;
                g.beginPath();
                g.arc(-4*s, 8*s + chew, 4*s, 0, Math.PI);
                g.arc(4*s, 8*s + chew, 4*s, 0, Math.PI);
                g.strokePath();
                break;
                
            case 'burn':
                // Olhos espirais (@ @)
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
                // Boca: zig-zag
                g.beginPath();
                g.moveTo(-8*s, 8*s); g.lineTo(-4*s, 12*s); g.lineTo(0, 8*s); g.lineTo(4*s, 12*s); g.lineTo(8*s, 8*s);
                g.strokePath();
                break;
                
            case 'freeze':
                // Olhos arregalados
                g.strokeCircle(-8*s, -5*s, 5*s);
                g.strokeCircle(8*s, -5*s, 5*s);
                g.fillStyle(0x88ccff, 0.8);
                g.fillCircle(-8*s, -5*s, 2*s);
                g.fillCircle(8*s, -5*s, 2*s);
                // Boca: o pequeno
                g.strokeCircle(0, 10*s, 3*s);
                // Cristais de gelo nas bordas
                g.lineStyle(Math.max(1, s), 0x88ccff, 0.5);
                g.beginPath();
                g.moveTo(-15*s, -10*s); g.lineTo(-12*s, -5*s); g.lineTo(-15*s, 0);
                g.moveTo(15*s, -10*s); g.lineTo(12*s, -5*s); g.lineTo(15*s, 0);
                g.strokePath();
                break;
                
            case 'mutate':
                // Olhos de estrela (✦ ✦)
                this.drawStar(g, -8*s, -5*s, 5*s, 5*s, 4);
                this.drawStar(g, 8*s, -5*s, 5*s, 5*s, 4);
                // Boca: D (sorriso largo)
                g.beginPath();
                g.arc(0, 8*s, 8*s, -Math.PI/2, Math.PI/2);
                g.strokePath();
                break;
                
            case 'breed':
                this.drawHeart(g, -8*s, -5*s, 6*s);
                this.drawHeart(g, 8*s, -5*s, 6*s);
                g.beginPath();
                g.arc(-2*s, 8*s, 4*s, -Math.PI/2, Math.PI/2);
                g.strokePath();
                break;
                
            case 'begging':
                const blink = Math.sin(Date.now() / 150);
                const eyeY = -5*s + blink * 2 * s;
                g.strokeCircle(-8*s, eyeY, 5*s);
                g.strokeCircle(8*s, eyeY, 5*s);
                g.fillStyle(color, 0.9);
                g.fillCircle(-6*s, eyeY - 1*s, 2*s);
                g.fillCircle(10*s, eyeY - 1*s, 2*s);
                const wobble = Math.sin(Date.now() / 100) * 2 * s;
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
                const pupilSize = Math.max(1, 3 - intensity * 2) * s;
                g.strokeCircle(-8*s + tremor.x, -5*s + tremor.y, 7*s);
                g.strokeCircle(8*s + tremor.x, -5*s + tremor.y, 7*s);
                g.fillStyle(0xff3333, 0.8);
                g.fillCircle(-8*s + tremor.x, -5*s + tremor.y, pupilSize);
                g.fillCircle(8*s + tremor.x, -5*s + tremor.y, pupilSize);
                const mouthWobble = Math.sin(Date.now() / 40) * 3 * s * intensity;
                g.strokeCircle(mouthWobble + tremor.x, 10*s + tremor.y, 6*s);
                g.lineStyle(Math.max(1, s), 0x88ccff, 0.6);
                g.fillStyle(0x88ccff, 0.5);
                g.fillCircle(-12*s, 4*s, 2*s);
                g.fillCircle(12*s, 4*s, 2*s);
                break;
        }
        
        g.lineStyle(lineWidth, 0xffffff, 1);
        this.drawActionFaceInner(g, action, s);
    }
    
    drawActionFaceInner(g, action, scale = 1) {
        const s = scale;
        switch(action) {
            case 'born':
                g.strokeCircle(-8*s, -5*s, 6*s);
                g.strokeCircle(8*s, -5*s, 6*s);
                g.fillStyle(0xffffff, 1);
                g.fillCircle(-8*s, -5*s, 2*s);
                g.fillCircle(8*s, -5*s, 2*s);
                g.strokeCircle(0, 10*s, 4*s);
                break;
            case 'feed':
                g.beginPath();
                g.arc(-8*s, -5*s, 5*s, Math.PI + 0.5, -0.5);
                g.arc(8*s, -5*s, 5*s, Math.PI + 0.5, -0.5);
                g.strokePath();
                const chew = Math.sin(Date.now() / 80) * 2 * s;
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
                g.fillStyle(0xffffff, 1);
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
        // Desenha coração usando linhas simples (Phaser Graphics não suporta bezierCurveTo)
        const points = [];
        const segments = 20;
        
        // Gera pontos do coração usando equação paramétrica
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            // Equação paramétrica do coração
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            // Escala e posiciona
            points.push({
                x: cx + (x / 16) * size * 0.5,
                y: cy + (y / 16) * size * 0.5 - size * 0.1
            });
        }
        
        // Desenha o coração conectando os pontos
        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            g.lineTo(points[i].x, points[i].y);
        }
        g.closePath();
        g.strokePath();
    }
    
    setActionExpression(action, duration = 1500) {
        this.expressionState.action = action;
        this.expressionState.actionTimer = Date.now() + duration;
    }
    
    updateExpression() {
        // Verifica se a ação expirou
        if (this.expressionState.action && Date.now() > this.expressionState.actionTimer) {
            this.expressionState.action = null;
        }
        
        // ═══ DLC: EXOTIC MATTER - Efeitos de Física Especial ═══
        this.applyExoticPhysicsEffects();
        
        // Piscar aleatório (mais lento se gravidade, mais rápido se eletricidade)
        this.blinkTimer++;
        let blinkInterval = 60; // ~3 segundos em 50ms ticks
        if (this.currentPhysics === 'eletricidade') blinkInterval = 30;
        if (this.currentPhysics === 'gravidade') blinkInterval = 100;
        if (this.currentPhysics === 'frio') blinkInterval = 120;
        if (this.currentPhysics === 'entropia') blinkInterval = 20; // Piscar errático
        if (this.currentPhysics === 'sonico') blinkInterval = 45;
        
        if (this.blinkTimer >= blinkInterval) {
            this.isBlinking = true;
            this.scene.time.delayedCall(100, () => { this.isBlinking = false; });
            this.blinkTimer = 0;
        }
        
        // Redesenha o rosto
        this.drawFace();
    }
    
    // ═══ DLC: EXOTIC MATTER - Efeitos visuais de física exótica ═══
    applyExoticPhysicsEffects() {
        const time = Date.now();
        
        // ENTROPIA: Glitch visual - vértices tremem aleatoriamente
        if (this.currentPhysics === 'entropia') {
            // Tremor do graphics (corpo)
            const glitchX = (Math.random() - 0.5) * 4;
            const glitchY = (Math.random() - 0.5) * 4;
            this.graphics.x = glitchX;
            this.graphics.y = glitchY;
            
            // Ocasionalmente, glitch de cor (força redesenho com cor alterada)
            if (Math.random() < 0.08) {
                const glitchColors = [0xFF0000, 0x00FF00, 0x0000FF, 0x2a0033];
                this.entropyGlitchColor = glitchColors[Math.floor(Math.random() * glitchColors.length)];
                // Força redesenho do shape com cor glitchada
                this.drawNeonShape(this.currentShape, this.entropyGlitchColor, this.currentChem);
            } else if (this.entropyGlitchColor) {
                // Restaura cor original
                this.entropyGlitchColor = null;
                this.drawNeonShape(this.currentShape, this.currentColor, this.currentChem);
            }
            
            // Partículas de dissolução (pixels se soltando)
            if (this.emitter && Math.random() < 0.15) {
                this.emitter.explode(1);
            }
        }
        
        // SÔNICO: Vibração senoidal das bordas
        else if (this.currentPhysics === 'sonico') {
            // Vibração harmônica
            const vibration = Math.sin(time * 0.02) * 2;
            const secondHarmonic = Math.sin(time * 0.04) * 1;
            
            this.graphics.x = vibration + secondHarmonic;
            this.graphics.y = Math.cos(time * 0.015) * 1.5;
            
            // Escala pulsante (como onda sonora)
            const pulseScale = 1 + Math.sin(time * 0.01) * 0.03;
            this.graphics.setScale(pulseScale);
        }
        
        // Resetar efeitos para outras físicas
        else if (this.graphics.x !== 0 || this.graphics.y !== 0) {
            // Só reseta se estiver deslocado
            if (this.currentPhysics !== 'entropia' && this.currentPhysics !== 'sonico') {
                this.graphics.x = 0;
                this.graphics.y = 0;
                this.graphics.setScale(1);
            }
        }
    }

    // Ações e logging de vida
    addLifeEvent(type, detail) {
        try {
            const entry = { ts: Date.now(), type, detail: detail || '' };
            this.lifeLog.push(entry);
            if (this.scene && this.scene.golemRecords) {
                // emit para atualizar UI (tree/registro)
                this.scene.game.events.emit('update-tree', this.scene.golemRecords);
            }
        } catch (e) { console.warn('addLifeEvent error', e); }
    }

    feed() {
        this.currentLife = this.maxLife;
        this.scene.tweens.add({ targets: this, scale: this.targetScale * 1.3, yoyo: true, duration: 200 });
        this.setActionExpression('feed', 2000);
        this.addLifeEvent('feed', 'Nutriu - vida restaurada');
        this.speakContextual('feed');
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
        // Na mutação, gera uma nova forma procedural aleatória
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
    
    startLifeCycle() {
        this.lifeTimer = this.scene.time.addEvent({ delay: 100, loop: true, callback: () => {
            const decay = 100 * (this.lifeTimer.timeScale||1);
            this.currentLife -= decay;
            const pct = Math.max(0, this.currentLife / this.maxLife);
            this.lifeBar.width = 22 * pct;
            if (pct < 0.3) this.lifeBar.setFillStyle(0xff0000); else this.lifeBar.setFillStyle(this.lifeBar.fillColor);
            if (this.currentLife <= 0) this.die();
        }});
    }
    startRoaming() {
        if(!this.body || this.isFrozen) return;
        this.body.setVelocity(Phaser.Math.Between(-this.baseSpeed, this.baseSpeed), Phaser.Math.Between(-this.baseSpeed, this.baseSpeed));
        this.scene.time.addEvent({ delay: 2000, loop: true, callback: () => {
            if(this.active && !this.isDragging && !this.isFrozen && this.body) {
                this.body.setVelocity(Phaser.Math.Between(-this.baseSpeed, this.baseSpeed), Phaser.Math.Between(-this.baseSpeed, this.baseSpeed));
            }
        }});
    }
    die() {
        if (this.lifeTimer) this.lifeTimer.remove();
        if (this.expressionTimer) this.expressionTimer.remove();
        if (this.emitter) this.emitter.stop();
        if (this.body) this.body.setVelocity(0);
        
        // Limpa balão de fala se existir
        this.clearSpeechBubble();
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

    // Chamado pela cena durante breeding
    setBreedingExpression() {
        this.setActionExpression('breed', 1500);
        this.speakContextual('breed');
    }

    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE FALA - VOZ 8-BITS + BALÃO RETRÔ
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Inicializa o AudioContext de forma lazy (necessário após interação do usuário)
     */
    initAudio() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.15; // Volume baixo para não irritar
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.warn('Web Audio API não disponível:', e);
        }
    }

    /**
     * Toca um bip 8-bits estilo Tamagotchi/Undertale
     * O pitch varia com tamanho e o tipo de onda com o elemento
     */
    playVoiceTone() {
        this.initAudio();
        if (!this.audioContext) return;
        
        // Resume context se estiver suspenso (política de autoplay)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // === PITCH BASEADO NO TAMANHO ===
        // Pequenos = agudo (400-600Hz), Grandes = grave (150-250Hz)
        const basePitch = 500 - (this.targetScale * 200); // Inverte: menor escala = maior pitch
        const pitch = Phaser.Math.Clamp(basePitch, 150, 600);
        
        // Variação aleatória para soar mais natural
        const pitchVariation = pitch + Phaser.Math.Between(-50, 50);

        // === TIPO DE ONDA BASEADO NO ELEMENTO ===
        let waveType = 'square'; // Padrão: onda quadrada (8-bits clássico)
        
        switch (this.currentPhysics) {
            case 'eletricidade':
                waveType = 'square';     // Harsh, digital
                break;
            case 'luz':
                waveType = 'sine';       // Suave, etéreo
                break;
            case 'calor':
                waveType = 'sawtooth';   // Agressivo
                break;
            case 'frio':
                waveType = 'triangle';   // Suave, cristalino
                break;
            case 'gravidade':
                waveType = 'sine';       // Profundo
                break;
            case 'magnetismo':
                waveType = 'square';     // Bipolar
                break;
            case 'radiacao':
                waveType = 'sawtooth';   // Instável
                break;
            default:
                waveType = 'square';
        }

        // === CRIA O OSCILADOR ===
        const osc = ctx.createOscillator();
        osc.type = waveType;
        osc.frequency.setValueAtTime(pitchVariation, now);

        // Envelope de volume (attack-release curto = bip)
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);  // Attack rápido
        gainNode.gain.linearRampToValueAtTime(0, now + 0.06);    // Release curto

        // Conecta e toca
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.07); // Duração total: 70ms
    }

    /**
     * Toca um beep 8-bits estilo Tamagotchi para cada letra
     * Versão otimizada com variação de pitch mais expressiva
     */
    playVoiceBeep() {
        this.initAudio();
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // === PITCH DINÂMICO POR TAMANHO + FÍSICA ===
        let basePitch = 400;
        
        // Tamanho afeta o pitch base
        if (this.targetScale < 0.8) {
            basePitch = Phaser.Math.Between(600, 800); // Pequeno = agudo
        } else if (this.targetScale > 1.3) {
            basePitch = Phaser.Math.Between(150, 300); // Grande = grave
        } else {
            basePitch = Phaser.Math.Between(350, 500); // Médio
        }
        
        // Física modifica ainda mais
        switch (this.currentPhysics) {
            case 'eletricidade':
                basePitch += 150; // Mais agudo
                break;
            case 'gravidade':
                basePitch -= 100; // Mais grave
                break;
        }

        // Variação aleatória pequena para naturalidade
        const pitch = Phaser.Math.Clamp(basePitch + Phaser.Math.Between(-30, 30), 120, 900);

        // Tipo de onda (8-bits crocante)
        const waveType = (this.currentPhysics === 'luz' || this.currentPhysics === 'frio') 
            ? 'triangle' 
            : 'square';

        // Oscilador
        const osc = ctx.createOscillator();
        osc.type = waveType;
        osc.frequency.setValueAtTime(pitch, now);

        // Envelope ultra-curto (bip de digitação)
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.008);  // Attack: 8ms
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05); // Decay: 42ms

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.055);
    }

    /**
     * Sistema de Balão Flutuante - Estilo "Hard Retro RPG" (SNES/GameBoy)
     * O balão é adicionado à CENA (não ao container) para ignorar escala do pai
     * Usa dimensionamento dinâmico baseado no tamanho real do texto renderizado
     * @param {string} text - Texto a ser falado
     */
    speak(text) {
        if (!text) return;
        
        // Se já está falando, enfileira
        if (this.isSpeaking) {
            if (this.speechQueue.length < 3) {
                this.speechQueue.push(text);
            }
            return;
        }

        this.isSpeaking = true;
        this.clearSpeechBubble();

        // === CONFIGURAÇÕES RETRO ===
        const fontSize = 7;
        const padding = 6;
        const maxTextWidth = 110;
        const tailHeight = 6;
        const shadowOffset = 3;
        const chamfer = 2; // Cantos chanfrados 45°

        // === PASSO 1: Criar texto PRIMEIRO para medir dimensões reais ===
        // Texto temporário invisível para medição
        const measureText = this.scene.add.text(0, 0, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: `${fontSize}px`,
            fill: '#000000',
            wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
            align: 'left',
            resolution: 2 // Nitidez pixel-perfect
        });
        measureText.setVisible(false);

        // === PASSO 2: Obter dimensões REAIS do texto ===
        const textBounds = measureText.getBounds();
        const realTextWidth = Math.ceil(textBounds.width);
        const realTextHeight = Math.ceil(textBounds.height);
        
        // Destruir texto de medição
        measureText.destroy();

        // === PASSO 3: Calcular dimensões do balão baseado no texto real ===
        const bubbleWidth = realTextWidth + (padding * 2);
        const bubbleHeight = realTextHeight + (padding * 2);

        // Posição acima do Golem
        const offsetY = 75 + (this.targetScale * 15);
        
        // Container na CENA (escala fixa)
        this.speechContainer = this.scene.add.container(0, 0);
        this.speechContainer.setDepth(1000);

        // === PASSO 4: DESENHAR BALÃO ESTILO "HARD RETRO" ===
        this.speechBubble = this.scene.add.graphics();
        
        // --- DROP SHADOW SÓLIDO (sem alpha) ---
        this.speechBubble.fillStyle(0x000000, 1);
        this.drawChamferedRect(this.speechBubble, shadowOffset, shadowOffset, bubbleWidth, bubbleHeight, chamfer);
        
        // --- FUNDO BRANCO PURO ---
        this.speechBubble.fillStyle(0xffffff, 1);
        this.drawChamferedRect(this.speechBubble, 0, 0, bubbleWidth, bubbleHeight, chamfer);
        
        // --- BORDA PRETA FINA (1px interno) ---
        this.speechBubble.lineStyle(1, 0x000000, 1);
        this.drawChamferedRectStroke(this.speechBubble, 0, 0, bubbleWidth, bubbleHeight, chamfer);
        
        // --- TAIL (Ponta triangular) ---
        const tailX = bubbleWidth / 2;
        const tailY = bubbleHeight;
        
        // Sombra do tail
        this.speechBubble.fillStyle(0x000000, 1);
        this.speechBubble.fillTriangle(
            tailX - 4 + shadowOffset, tailY,
            tailX + 4 + shadowOffset, tailY,
            tailX + shadowOffset, tailY + tailHeight
        );
        
        // Tail branco
        this.speechBubble.fillStyle(0xffffff, 1);
        this.speechBubble.fillTriangle(
            tailX - 4, tailY - 1,
            tailX + 4, tailY - 1,
            tailX, tailY + tailHeight
        );
        
        // Borda do tail
        this.speechBubble.lineStyle(1, 0x000000, 1);
        this.speechBubble.lineBetween(tailX - 4, tailY - 1, tailX, tailY + tailHeight);
        this.speechBubble.lineBetween(tailX + 4, tailY - 1, tailX, tailY + tailHeight);
        
        // Centraliza o balão
        this.speechBubble.setPosition(-bubbleWidth / 2, -bubbleHeight - tailHeight);
        this.speechContainer.add(this.speechBubble);

        // === PASSO 5: TEXTO REAL (posicionado precisamente) ===
        this.speechText = this.scene.add.text(0, -bubbleHeight / 2 - tailHeight, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: `${fontSize}px`,
            fill: '#000000',
            wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
            align: 'left',
            resolution: 2
        }).setOrigin(0.5, 0.5);
        this.speechContainer.add(this.speechText);

        // === ANIMAÇÃO DE ENTRADA (pop retro) ===
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

        // === ATUALIZA POSIÇÃO A CADA FRAME ===
        this.speechUpdateEvent = this.scene.time.addEvent({
            delay: 16,
            loop: true,
            callback: () => {
                if (this.speechContainer && this.active) {
                    this.speechContainer.setPosition(this.x, this.y - offsetY);
                }
            }
        });

        // === TYPEWRITER EFFECT ===
        let charIndex = 0;
        let displayText = '';
        
        this.typewriterEvent = this.scene.time.addEvent({
            delay: 40,
            loop: true,
            callback: () => {
                if (charIndex < text.length) {
                    displayText += text[charIndex];
                    this.speechText.setText(displayText);
                    
                    // Som a cada 2 caracteres (não em espaços)
                    if (charIndex % 2 === 0 && text[charIndex] !== ' ') {
                        this.playVoiceBeep();
                    }
                    
                    charIndex++;
                } else {
                    this.typewriterEvent.remove();
                    this.typewriterEvent = null;
                    
                    // Aguarda 2.5s e faz fade out
                    this.scene.time.delayedCall(2500, () => {
                        this.fadeOutSpeechBubble();
                    });
                }
            }
        });
    }

    /**
     * Desenha um retângulo com cantos chanfrados (45°) - Preenchimento
     * Estilo pixel art SNES/GameBoy
     */
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

    /**
     * Desenha um retângulo com cantos chanfrados (45°) - Apenas borda
     */
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

    /**
     * Fade out suave do balão de fala
     */
    fadeOutSpeechBubble() {
        if (!this.speechContainer) {
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

    /**
     * Finaliza o estado de fala e processa a fila
     */
    finishSpeaking() {
        this.isSpeaking = false;
        
        // Processa próxima fala da fila
        if (this.speechQueue.length > 0) {
            const nextText = this.speechQueue.shift();
            // Pequeno delay entre falas
            this.scene.time.delayedCall(300, () => {
                this.speak(nextText);
            });
        }
    }

    /**
     * Limpa todos os elementos do balão de fala
     */
    clearSpeechBubble() {
        if (this.typewriterEvent) {
            this.typewriterEvent.remove();
            this.typewriterEvent = null;
        }
        if (this.speechUpdateEvent) {
            this.speechUpdateEvent.remove();
            this.speechUpdateEvent = null;
        }
        if (this.speechContainer) {
            this.speechContainer.destroy();
            this.speechContainer = null;
        }
        this.speechBubble = null;
        this.speechText = null;
    }

    /**
     * Fala uma frase contextual baseada na situação
     * @param {string} context - Contexto: 'idle', 'born', 'poke', 'feed', 'burn', 'freeze', 'dying', 'breed', 'mutate'
     */
    speakContextual(context) {
        // Importação dinâmica para evitar dependência circular
        import('../services/MockAiService.js').then(({ generateDialogue }) => {
            const phrase = generateDialogue(this.dataAttributes, context);
            this.speak(phrase);
        }).catch(e => console.warn('Erro ao gerar diálogo:', e));
    }
}