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
        }
    }

    drawNeonShape(type, color, chemType) {
        const g = this.graphics;
        g.clear();
        
        // Usa DNA visual para cores separadas
        const bodyColor = this.visualDNA?.bodyColor || color;
        const auraColor = this.visualDNA?.auraColor || color;
        
        // === EFEITO GLITCH PARA ANOMALIAS ===
        if (this.isAnomaly && this.glitchIntensity > 0) {
            this.drawAnomalyGlitch(g, type, bodyColor, auraColor, chemType);
            return;
        }
        
        let lineWidth = this.visualDNA?.lineWidth || 2;
        if (chemType === 'ferro') lineWidth = 4;
        if (chemType === 'ouro') lineWidth = 3;
        if (chemType === 'cristal') lineWidth = 1;
        if (chemType === 'mercurio') lineWidth = 5;
        
        // Tratamento especial para formas com base elíptica (cilindro / cone)
        if (type === 'cilindro') {
            // Preenche o corpo com BODY COLOR
            g.fillStyle(bodyColor, 0.18);
            g.beginPath();
            g.moveTo(-20, -25); g.lineTo(20, -25); g.lineTo(20, 25); g.lineTo(-20, 25); g.closePath();
            g.fillPath();
            g.fillEllipse(0, -25, 40, 15);
            g.fillEllipse(0, 25, 40, 15);

            // Glow externo com AURA COLOR (energia)
            g.lineStyle(lineWidth + 8, auraColor, 0.35);
            g.beginPath();
            g.moveTo(-20, -25); g.lineTo(-20, 25);
            g.moveTo(20, -25); g.lineTo(20, 25);
            g.strokePath();
            g.strokeEllipse(0, -25, 40, 15);
            g.strokeEllipse(0, 25, 40, 15);

            // Traço interno com BODY COLOR (sólido)
            g.lineStyle(lineWidth, bodyColor, 1);
            g.beginPath();
            g.moveTo(-20, -25); g.lineTo(-20, 25);
            g.moveTo(20, -25); g.lineTo(20, 25);
            g.strokePath();
            g.strokeEllipse(0, -25, 40, 15);
            g.strokeEllipse(0, 25, 40, 15);
            return;
        }

        if (type === 'cone') {
            // Preenche com BODY COLOR
            g.fillStyle(bodyColor, 0.18);
            g.beginPath();
            g.moveTo(0, -35); g.lineTo(25, 25); g.lineTo(-25, 25); g.closePath();
            g.fillPath();
            g.fillEllipse(0, 25, 50, 15);

            // Glow com AURA COLOR
            g.lineStyle(lineWidth + 8, auraColor, 0.35);
            g.beginPath();
            g.moveTo(0, -35); g.lineTo(25, 25);
            g.moveTo(0, -35); g.lineTo(-25, 25);
            g.strokePath();
            g.strokeEllipse(0, 25, 50, 15);

            // Traço interno com BODY COLOR
            g.lineStyle(lineWidth, bodyColor, 1);
            g.beginPath();
            g.moveTo(0, -35); g.lineTo(25, 25);
            g.moveTo(0, -35); g.lineTo(-25, 25);
            g.strokePath();
            g.strokeEllipse(0, 25, 50, 15);
            return;
        }

        // ═══ DEFAULT: Renderização com 3 camadas ═══
        // 1. FILL: Preenchimento com bodyColor
        g.fillStyle(bodyColor, 0.18);
        this.drawPath(g, type);
        g.fillPath();

        // 2. AURA: Glow externo com auraColor (fusão de energias)
        g.lineStyle(lineWidth + 8, auraColor, 0.35);
        this.drawPath(g, type);
        g.strokePath();

        // 3. BODY: Traço sólido interno com bodyColor
        g.lineStyle(lineWidth, bodyColor, 1);
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
        if (!this.faceGraphics || !this.expressionState) return; // Null check
        
        const g = this.faceGraphics;
        g.clear();
        
        const state = this.expressionState;
        const lifePct = this.maxLife > 0 ? this.currentLife / this.maxLife : 1;
        
        // Guarda o mood anterior para detectar transição
        const previousMood = state.mood;
        
        // Determina o humor baseado na vida (se não há ação especial)
        if (!state.action) {
            if (lifePct > 0.7) state.mood = 'happy';
            else if (lifePct > 0.5) state.mood = 'neutral';
            else if (lifePct > 0.3) state.mood = 'sad';
            else if (lifePct > 0) state.mood = 'dying';
            else state.mood = 'dead';
            
            // Fala quando entra no estado dying (apenas uma vez)
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
    
    drawActionFace(g, action, lineWidth, scale = 1) {
        const color = this.currentColor || 0x00ffff;
        const s = scale;
        
        // Glow
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
                // Olhos de coração ♥ ♥
                this.drawHeart(g, -8*s, -5*s, 6*s);
                this.drawHeart(g, 8*s, -5*s, 6*s);
                // Boca: 3 (beijinho)
                g.beginPath();
                g.arc(-2*s, 8*s, 4*s, -Math.PI/2, Math.PI/2);
                g.strokePath();
                break;
        }
        
        // Traço branco
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
        
        // Piscar aleatório (mais lento se gravidade, mais rápido se eletricidade)
        this.blinkTimer++;
        let blinkInterval = 60; // ~3 segundos em 50ms ticks
        if (this.currentPhysics === 'eletricidade') blinkInterval = 30;
        if (this.currentPhysics === 'gravidade') blinkInterval = 100;
        if (this.currentPhysics === 'frio') blinkInterval = 120;
        
        if (this.blinkTimer >= blinkInterval) {
            this.isBlinking = true;
            this.scene.time.delayedCall(100, () => { this.isBlinking = false; });
            this.blinkTimer = 0;
        }
        
        // Redesenha o rosto
        this.drawFace();
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