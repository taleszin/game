import Phaser from 'phaser';

export default class Golem extends Phaser.GameObjects.Container {
    constructor(scene, x, y, data) {
        super(scene, x, y);
        this.scene = scene;
        this.dataAttributes = data;

        let colorTint = 0xffffff;
        if (data && data.quimica) {
            switch(data.quimica.id) {
                case 'carbono': colorTint = 0x8d5524; break;
                case 'ferro':   colorTint = 0xa0a0a0; break;
                case 'silicio': colorTint = 0x00ffff; break;
            }
        }

        const bodyShape = scene.add.rectangle(0, 0, 32, 48, 0xffffff);
        bodyShape.setStrokeStyle(2, 0x000000);
        bodyShape.setFillStyle(colorTint); 
        
        const nameStr = (data && data.biologia) ? data.biologia.name : "Amostra";
        const nameTag = scene.add.text(0, -40, nameStr, {
            fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff', backgroundColor: '#00000088'
        }).setOrigin(0.5);

        this.add([bodyShape, nameTag]);

        this.setSize(32, 48); 
        
        scene.add.existing(this);
        
        if (scene.physics) {
            scene.physics.add.existing(this);
            
            if (this.body) {
                this.body.setCollideWorldBounds(true);
                this.body.setBounce(1);
                this.startRoaming();
            }
        }
    }

    startRoaming() {
        if (!this.body) return;
        
        const speed = 60;
        this.body.setVelocity(
            Phaser.Math.Between(-speed, speed), 
            Phaser.Math.Between(-speed, speed)
        );

        if (this.scene) {
            this.scene.time.addEvent({
                delay: 2000,
                callback: () => {
                    if (this.active && this.body) {
                        this.body.setVelocity(
                            Phaser.Math.Between(-speed, speed), 
                            Phaser.Math.Between(-speed, speed)
                        );
                    }
                },
                loop: true
            });
        }
    }
}