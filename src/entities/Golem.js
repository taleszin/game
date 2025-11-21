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

        // --- VISUAL ---
        let neonColor = 0x00ffff;
        if (data && data.fisica) {
            switch(data.fisica.id) {
                case 'eletricidade': neonColor = 0xffea00; break;
                case 'calor':        neonColor = 0xff4d00; break;
                case 'radiacao':     neonColor = 0x00ff00; break;
                case 'gravidade':    neonColor = 0x9d00ff; break;
                case 'luz':          neonColor = 0xffffff; break;
                case 'frio':         neonColor = 0x0088ff; break;
                case 'magnetismo':   neonColor = 0xff00aa; break;
            }
        }

        this.graphics = scene.add.graphics();
        
        // Dados de forma
        const shapeData = data.forma || data.biologia;
        this.currentShapeType = shapeData ? shapeData.id : 'quadrado';
        this.proceduralParams = shapeData ? shapeData.params : null; // Pega parâmetros matemáticos
        
        this.currentColor = neonColor;
        this.currentChem = data.quimica ? data.quimica.id : 'carbono';

        this.drawNeonShape(this.currentShapeType, this.currentColor, this.currentChem);
        this.add(this.graphics);

        // Animação
        this.pulseTween = scene.tweens.add({
            targets: this.graphics,
            scaleX: 1.05, scaleY: 1.05, alpha: 0.9,
            duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

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
            if (data.fisica.id === 'eletricidade') this.baseSpeed *= 1.5;

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
        let lineWidth = 2;
        if (chemType === 'ferro') lineWidth = 4;
        if (chemType === 'ouro') lineWidth = 3;
        if (chemType === 'cristal') lineWidth = 1;
        if (chemType === 'mercurio') lineWidth = 5;
        
        g.lineStyle(lineWidth + 6, color, 0.3); 
        this.drawPath(g, type);
        g.strokePath();
        
        g.lineStyle(lineWidth, 0xffffff, 1); 
        this.drawPath(g, type);
        g.strokePath();
        
        g.fillStyle(color, 0.15);
        this.drawPath(g, type);
        g.fillPath();
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
            
            case 'cilindro': g.moveTo(-20,-25); g.lineTo(-20,25); g.moveTo(20,-25); g.lineTo(20,25); g.strokeEllipse(0,-25,40,15); g.strokeEllipse(0,25,40,15); break;
            case 'cone': g.moveTo(0,-35); g.lineTo(25,25); g.moveTo(0,-35); g.lineTo(-25,25); g.strokeEllipse(0,25,50,15); break;
            case 'piramide': g.moveTo(0,-35); g.lineTo(30,20); g.lineTo(0,35); g.lineTo(-30,20); g.closePath(); g.moveTo(0,-35); g.lineTo(0,35); break;
            case 'obelisco': g.strokeRect(-15, -40, 30, 80); g.moveTo(-15, -40); g.lineTo(0, -55); g.lineTo(15, -40); break;
            case 'fractal': g.moveTo(0,-35); g.lineTo(30,25); g.lineTo(-30,25); g.closePath(); g.moveTo(0,25); g.lineTo(15,-5); g.lineTo(-15,-5); g.closePath(); break;
            case 'esfera': g.strokeCircle(0, 0, 28); g.strokeEllipse(0, 0, 56, 20); g.strokeEllipse(0, 0, 20, 56); break;
            case 'mira': g.strokeCircle(0, 0, 25); g.moveTo(0, -35); g.lineTo(0, 35); g.moveTo(-35, 0); g.lineTo(35, 0); break;
            case 'cristal': g.moveTo(0, -40); g.lineTo(20, 0); g.lineTo(0, 40); g.lineTo(-20, 0); g.closePath(); g.moveTo(0, -40); g.lineTo(0, 40); g.moveTo(-20, 0); g.lineTo(20, 0); break;
            
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
        this.addLifeEvent('feed', 'Nutriu - vida restaurada');
    }

    burn() {
        if (this.lifeTimer) this.lifeTimer.timeScale = 5.0;
        this.addLifeEvent('burn', 'Incendiado - perda acelerada');
    }

    kill() {
        this.addLifeEvent('killed', 'Eliminado manualmente');
        this.currentLife = 0; this.die();
    }

    freeze() {
        this.isFrozen = true; this.body.setVelocity(0); this.graphics.setTint(0x0088ff);
        this.addLifeEvent('freeze', 'Congelado temporariamente');
        this.scene.time.delayedCall(5000, () => { if (this.active) { this.isFrozen = false; this.graphics.clearTint(); this.startRoaming(); } });
    }

    mutate() {
        // Na mutação, gera uma nova forma procedural aleatória
        const newSides = 3 + Math.floor(Math.random() * 7);
        const newParams = { sides: newSides, roughness: Math.random(), seed: Math.random() * 100 };

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
        if (this.emitter) this.emitter.stop();
        if (this.body) this.body.setVelocity(0);
        this.addLifeEvent('died', 'Fim do ciclo - dados perdidos');
        const msg = this.scene.add.text(this.x, this.y - 50, "DADOS PERDIDOS", { fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ff0000' }).setOrigin(0.5);
        this.scene.tweens.add({ targets: msg, y: this.y - 80, alpha: 0, duration: 2000 });
        this.scene.tweens.add({ targets: this, alpha: 0, scale: 0.1, duration: 1000, onComplete: () => { msg.destroy(); if (this.emitter) this.emitter.destroy(); this.destroy(); } });
    }
}