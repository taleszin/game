import Phaser from 'phaser';

export default class Golem extends Phaser.GameObjects.Container {
    constructor(scene, x, y, data) {
        super(scene, x, y);
        this.scene = scene;
        this.dataAttributes = data; // Guarda o JSON da biologia/quimica/fisica

        // 1. Definir aparência baseada na QUÍMICA (Cor)
        let colorTint = 0xffffff;
        switch(data.quimica.id) {
            case 'carbono': colorTint = 0x8d5524; break; // Marrom pele/orgânico
            case 'ferro':   colorTint = 0xa0a0a0; break; // Cinza metálico
            case 'silicio': colorTint = 0x00ffff; break; // Ciano cristalino
            default: colorTint = 0xffffff;
        }

        // 2. Criar o Corpo (Placeholder: um quadrado simples por enquanto)
        // Futuramente aqui você carregará: 'body_' + data.biologia.id
        const body = scene.add.rectangle(0, 0, 32, 48, 0xffffff);
        body.setStrokeStyle(2, 0x000000);
        body.setTint(colorTint); // Aplica a cor do elemento químico
        
        // 3. Adicionar Partículas/Detalhes baseados na FÍSICA
        if (data.fisica.id === 'eletricidade') {
            // Exemplo simples: um contorno amarelo piscando (depois viram partículas)
            body.setStrokeStyle(2, 0xffff00);
        } else if (data.fisica.id === 'radiacao') {
             body.setStrokeStyle(2, 0x00ff00);
        }

        // 4. Nome Flutuante (Baseado na Biologia ou Gerado)
        const nameTag = scene.add.text(0, -40, data.biologia.name, {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            fill: '#ffffff',
            backgroundColor: '#000000aa'
        }).setOrigin(0.5);

        // Adiciona tudo ao Container
        this.add([body, nameTag]);

        // Adiciona o Container à cena e habilita física básica
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Colisão com o mundo (impede sair da tela)
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0.2);
        
        // Inicia comportamento (andar aleatório)
        this.startRoaming();
    }

    startRoaming() {
        // Movimento aleatório simples estilo "proteção de tela"
        const speed = 50;
        this.body.setVelocity(
            Phaser.Math.Between(-speed, speed), 
            Phaser.Math.Between(-speed, speed)
        );

        // Muda de direção a cada 2 segundos
        this.scene.time.addEvent({
            delay: 2000,
            callback: () => {
                if(this.active) { // Só move se ainda existir
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