import Phaser from 'phaser';

export default class Golem extends Phaser.GameObjects.Container {
    constructor(scene, x, y, data) {
        super(scene, x, y);
        this.scene = scene;
        this.dataAttributes = data;
        this.isDragging = false;

        // --- 1. VISUAL (Cores e Formas) ---
        let colorTint = 0xffffff;
        if (data && data.quimica) {
            switch(data.quimica.id) {
                case 'carbono': colorTint = 0x8d5524; break;
                case 'ferro':   colorTint = 0xa0a0a0; break;
                case 'silicio': colorTint = 0x00ffff; break;
                default: colorTint = 0xcccccc;
            }
        }

        let bodyShape;
        const bioType = data.biologia ? data.biologia.id : 'mamifero';

        switch (bioType) {
            case 'inseto':
                // Triângulo Agressivo
                bodyShape = scene.add.triangle(0, 5, -16, 24, 16, 24, 0, -24, colorTint);
                break;

            case 'slime':
                // SLIME 16-BITS (Polígono desenhado à mão)
                // Cria a silhueta clássica de "Gota" com base reta
                // Pontos: [x1,y1, x2,y2, ...]
                const slimePoints = [
                    -20, 20,  // Canto inferior esquerdo
                    20, 20,   // Canto inferior direito
                    15, 0,    // Lado direito
                    0, -15,   // Topo
                    -15, 0    // Lado esquerdo
                ];
                bodyShape = scene.add.polygon(0, 5, slimePoints, colorTint);
                
                // Animação de "Respirar" (Geleia)
                scene.tweens.add({
                    targets: bodyShape,
                    scaleX: 1.15, // Estica os lados
                    scaleY: 0.85, // Achata o topo
                    y: 8,         // Desce um pouco para manter a base no chão
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                break;

            case 'mamifero':
            default:
                // Retângulo Padrão
                bodyShape = scene.add.rectangle(0, 0, 32, 48, colorTint);
                break;
        }
        
        bodyShape.setStrokeStyle(2, 0xffffff);

        // --- REMOVIDO: O Núcleo Branco (this.core) foi deletado ---

        // Nome
        const nameStr = (data.aiData) ? data.aiData.name : ((data.biologia) ? data.biologia.name : "Ser");
        const nameTag = scene.add.text(0, -40, nameStr, {
            fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff', backgroundColor: '#000000aa'
        }).setOrigin(0.5);

        // Barra de Vida
        const barBg = scene.add.rectangle(0, -32, 30, 4, 0x000000);
        this.lifeBar = scene.add.rectangle(0, -32, 28, 2, 0x00ff00);

        this.add([bodyShape, nameTag, barBg, this.lifeBar]);

        // Partículas
        this.emitter = scene.add.particles(0, 0, 'pixel', {
            speed: 20, scale: { start: 0.5, end: 0 }, blendMode: 'ADD', lifespan: 500, tint: colorTint
        });
        this.emitter.startFollow(this);

        // --- 2. FÍSICA E INPUT ---
        this.setSize(40, 50);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        if (this.body) {
            this.body.setCollideWorldBounds(true);
            this.body.setBounce(1);

            // Velocidade baseada no tipo
            let baseSpeed = 50;
            if (data.fisica && data.fisica.id === 'eletricidade') baseSpeed = 100;
            if (bioType === 'slime') baseSpeed = 25; // Slimes são mais lentos

            // Interatividade
            this.setInteractive();
            scene.input.setDraggable(this);

            this.startRoaming(baseSpeed);
            
            const lifespan = (data.aiData && data.aiData.stats) ? data.aiData.stats.lifespan : 15000;
            this.startLifeCycle(lifespan);

            // Eventos
            this.on('pointerover', () => {
                if (!this.isDragging) {
                    scene.game.events.emit('inspect-golem', {
                        visual: this.dataAttributes,
                        stats: data.aiData,
                        active: true
                    });
                    bodyShape.setStrokeStyle(4, 0x00ffaa);
                }
            });

            this.on('pointerout', () => {
                scene.game.events.emit('hide-inspect');
                bodyShape.setStrokeStyle(2, 0xffffff);
            });

            this.on('dragstart', () => {
                this.isDragging = true;
                this.body.setVelocity(0);
                this.setAlpha(0.6);
                scene.game.events.emit('hide-inspect');
            });

            this.on('drag', (pointer, dragX, dragY) => {
                this.x = dragX;
                this.y = dragY;
            });

            this.on('dragend', () => {
                this.isDragging = false;
                this.setAlpha(1);
            });
        }
    }

    // ... MÉTODOS AUXILIARES (startLifeCycle, die, startRoaming) MANTIDOS IGUAIS ...
    startLifeCycle(duration) {
        this.scene.tweens.add({
            targets: this.lifeBar, width: 0, duration: duration, ease: 'Linear',
            onUpdate: (tween) => { if (tween.progress > 0.7) this.lifeBar.setFillStyle(0xff0000); }
        });
        this.scene.time.delayedCall(duration, () => { this.die(); });
    }

    die() {
        if(this.body) this.body.setVelocity(0);
        if(this.emitter) this.emitter.stop();
        const msg = this.scene.add.text(this.x, this.y - 50, "DADOS CORROMPIDOS...", {
            fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ff0000', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
        
        this.scene.tweens.add({ targets: msg, y: this.y - 80, alpha: 0, duration: 2000 });
        this.scene.tweens.add({
            targets: this, alpha: 0, scaleX: 0.1, scaleY: 0.1, duration: 1000,
            onComplete: () => { msg.destroy(); if(this.emitter) this.emitter.destroy(); this.destroy(); }
        });
    }

    startRoaming(speed) {
        if (!this.body) return;
        this.body.setVelocity(Phaser.Math.Between(-speed, speed), Phaser.Math.Between(-speed, speed));
        if (this.scene) {
            this.scene.time.addEvent({
                delay: 2000,
                callback: () => {
                    if (this.active && this.body && !this.isDragging) {
                        this.body.setVelocity(
                            Phaser.Math.Between(-speed, speed), 
                            Phaser.Math.Between(-speed, speed)
                        );
                    }
                }, loop: true
            });
        }
    }
}