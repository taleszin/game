import Phaser from 'phaser';

export default class Golem extends Phaser.GameObjects.Container {
    constructor(scene, x, y, data) {
        super(scene, x, y);
        this.scene = scene;
        this.dataAttributes = data;
        this.isDragging = false;
        this.isFrozen = false;
        
        this.maxLife = (data.aiData && data.aiData.stats) ? data.aiData.stats.lifespan : 15000;
        this.currentLife = this.maxLife;

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
        this.currentShapeType = data.forma ? data.forma.id : 'quadrado';
        this.currentColor = neonColor;
        this.currentChem = data.quimica ? data.quimica.id : 'carbono';

        this.drawNeonShape(this.currentShapeType, this.currentColor, this.currentChem);
        this.add(this.graphics);

        this.pulseTween = scene.tweens.add({
            targets: this.graphics,
            scaleX: 1.05, scaleY: 1.05, alpha: 0.9,
            duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        const nameStr = (data.aiData) ? data.aiData.name.split(' ')[0] : "GLIFO";
        const nameTag = scene.add.text(0, -55, nameStr, {
            fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ffffff', 
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);

        const barBg = scene.add.rectangle(0, -45, 24, 4, 0x000000);
        this.lifeBar = scene.add.rectangle(0, -45, 22, 2, neonColor);
        this.add([nameTag, barBg, this.lifeBar]);

        this.emitter = scene.add.particles(0, 0, 'pixel', {
            speed: 20, scale: { start: 0.4, end: 0 }, 
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

            this.baseSpeed = 50;
            if (data.fisica.id === 'eletricidade') this.baseSpeed = 100;

            this.startRoaming();
            this.startLifeCycle();

            this.on('pointerover', () => {
                if (!this.isDragging) {
                    scene.selectedGolem = this;
                    scene.game.events.emit('inspect-golem', { visual: this.dataAttributes, stats: data.aiData });
                    this.graphics.alpha = 1; this.graphics.scale = 1.1;
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
                    if (other !== this && other.active && Phaser.Geom.Intersects.RectangleToRectangle(this.getBounds(), other.getBounds())) {
                         scene.triggerBreeding(this, other); mated = true; break;
                    }
                }
                if (!mated) this.startRoaming();
            });
        }
    }

    freeze() {
        this.isFrozen = true;
        this.body.setVelocity(0);
        this.graphics.setTint(0x0088ff);
        if(this.emitter) this.emitter.stop();
        this.scene.time.delayedCall(5000, () => {
            if(this.active) {
                this.isFrozen = false;
                this.graphics.clearTint();
                if(this.emitter) this.emitter.start();
                this.startRoaming();
            }
        });
    }

    mutate() {
        this.scene.tweens.add({
            targets: this, scaleX: 0.1, scaleY: 0.1, duration: 200, yoyo: true,
            onYoyo: () => {
                const shapes = ['circulo', 'quadrado', 'triangulo', 'pentagono', 'losango', 'hexagono'];
                this.currentShapeType = shapes[Math.floor(Math.random() * shapes.length)];
                this.currentColor = Math.random() * 0xffffff;
                this.drawNeonShape(this.currentShapeType, this.currentColor, this.currentChem);
                if(this.emitter) this.emitter.setTint(this.currentColor);
                this.lifeBar.setFillStyle(this.currentColor);
            }
        });
    }

    feed() {
        this.currentLife = this.maxLife;
        this.scene.tweens.add({ targets: this, scale: 1.3, yoyo: true, duration: 200 });
        const healPart = this.scene.add.particles(this.x, this.y, 'pixel', {
            speed: 60, quantity: 10, lifespan: 600, tint: 0x00ff00, scale: { start: 2, end: 0 }, blendMode: 'ADD'
        });
        setTimeout(() => healPart.destroy(), 1000);
    }

    burn() {
        if (!this.fireEmitter) {
            this.fireEmitter = this.scene.add.particles(0, 0, 'pixel', {
                speed: { min: 20, max: 60 }, angle: { min: 220, max: 320 },
                scale: { start: 4, end: 0 }, tint: [0xffaa00, 0xff0000],
                lifespan: 500, quantity: 3, blendMode: 'ADD'
            });
            this.fireEmitter.startFollow(this);
        }
        if(this.lifeTimer) this.lifeTimer.timeScale = 5.0;
    }

    kill() { this.currentLife = 0; this.die(); }

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
        
        g.lineStyle(lineWidth, (chemType === 'ouro' ? 0xffd700 : 0xffffff), 1); 
        this.drawPath(g, type);
        g.strokePath();
        
        g.fillStyle(color, 0.15);
        this.drawPath(g, type);
        g.fillPath();
    }

    drawPath(g, type) {
        g.beginPath();
        switch(type) {
            // PRIMITIVOS
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

            // HÍBRIDOS LÓGICOS
            case 'squircle': // Quadrado + Círculo = Quadrado com cantos redondos
                g.fillRoundedRect(-22, -22, 44, 44, 15);
                g.strokeRoundedRect(-22, -22, 44, 44, 15);
                break;

            case 'cone': // Triângulo + Círculo = Gota/Cone
                g.moveTo(0, -30);
                g.lineTo(18, 10);
                g.arc(0, 10, 18, 0, Math.PI);
                g.lineTo(-18, 10);
                g.closePath();
                break;

            case 'escudo': // Pentágono + Círculo = Escudo
                g.moveTo(-20, -10); g.lineTo(20, -10);
                g.lineTo(20, 5);
                g.quadraticBezierTo(0, 35, -20, 5);
                g.closePath();
                break;

            case 'trevo': // Cruz + Círculo = Trevo
                g.strokeCircle(0, -15, 10); g.strokeCircle(0, 15, 10);
                g.strokeCircle(-15, 0, 10); g.strokeCircle(15, 0, 10);
                break;

            case 'olho': // Losango + Círculo
                g.moveTo(-30,0); g.quadraticBezierTo(0,-20, 30,0); 
                g.quadraticBezierTo(0,20, -30,0); 
                g.strokeCircle(0,0,10);
                break;

            case 'cristal': // Quadrado + Triângulo = Obelisco
                g.moveTo(0,-30); g.lineTo(15,-10); g.lineTo(15,25); 
                g.lineTo(-15,25); g.lineTo(-15,-10); g.closePath();
                g.moveTo(-15,-10); g.lineTo(15,-10); // Linha de faceta
                break;

            case 'pipa': // Quadrado + Losango = Pipa
                g.moveTo(0,-30); g.lineTo(20,-10); g.lineTo(0,30); g.lineTo(-20,-10); g.closePath();
                g.moveTo(0,-30); g.lineTo(0,30); g.moveTo(-20,-10); g.lineTo(20,-10);
                break;

            case 'grade': // Quadrado + Cruz
                g.strokeRect(-22,-22,44,44);
                g.moveTo(0,-22); g.lineTo(0,22);
                g.moveTo(-22,0); g.lineTo(22,0);
                break;

            case 'estrela6': // Triângulo + Triângulo
                g.moveTo(0,-25); g.lineTo(20,10); g.lineTo(-20,10); g.closePath();
                g.moveTo(0,25); g.lineTo(20,-10); g.lineTo(-20,-10); g.closePath();
                break;

            case 'estrela8': // Quadrado + Quadrado
                g.strokeRect(-18,-18,36,36);
                const r = 18 * Math.sqrt(2);
                g.moveTo(0,-r); g.lineTo(r,0); g.lineTo(0,r); g.lineTo(-r,0); g.closePath();
                break;

            case 'estrela5': // Pentágono + Triângulo
                const points = 5; const inner=10; const outer=30;
                for(let i=0; i<points*2; i++){
                    const r=(i%2===0)?outer:inner; const a=(i*Math.PI/points)-Math.PI/2;
                    if(i===0)g.moveTo(Math.cos(a)*r,Math.sin(a)*r); else g.lineTo(Math.cos(a)*r,Math.sin(a)*r);
                } g.closePath();
                break;

            case 'vesica': // Círculo + Círculo
                g.strokeCircle(-10, 0, 20);
                g.strokeCircle(10, 0, 20);
                break;

            default: // Fallback
                g.strokeRect(-20,-20,40,40); 
                break;
        }
    }

    drawPolygon(g, sides, size) {
        for(let i=0; i<sides; i++) {
            const angle = (i * (360/sides) - 90) * Math.PI / 180;
            const px = Math.cos(angle) * size; 
            const py = Math.sin(angle) * size;
            if(i===0) g.moveTo(px,py); else g.lineTo(px,py);
        }
        g.closePath();
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
        if(this.lifeTimer) this.lifeTimer.remove();
        if(this.fireEmitter) this.fireEmitter.destroy();
        if(this.emitter) this.emitter.stop();
        if(this.body) this.body.setVelocity(0);
        const msg = this.scene.add.text(this.x, this.y - 50, "DADOS PERDIDOS", { fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ff0000' }).setOrigin(0.5);
        this.scene.tweens.add({ targets: msg, y: this.y - 80, alpha: 0, duration: 2000 });
        this.scene.tweens.add({ targets: this, alpha: 0, scale: 0.1, duration: 1000, onComplete: () => { msg.destroy(); if(this.emitter) this.emitter.destroy(); this.destroy(); } });
    }
}