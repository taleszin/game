// src/services/MockAiService.js

const ADJECTIVES = ['Efêmero', 'Eterno', 'Instável', 'Radiante', 'Ancestral'];

export function generateGolemData(ingredients) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // 1. Cálculo de Stats (Simulado)
            // Biologia define base, Química define defesa, Física define energia
            const forca = Math.floor(Math.random() * 10) + 5;
            const resistencia = Math.floor(Math.random() * 10) + 5; // Vem da Química
            const energia = Math.floor(Math.random() * 10) + 5;     // Vem da Física

            // 2. CÁLCULO DO TEMPO DE VIDA (A Lógica da Entropia)
            // Fórmula: (Resistência + Energia) * fator. 
            // Ex: (5 + 5) * 1000 = 10 segundos (Rápido para teste)
            // Para o jogo final, use * 6000 (para minutos)
            const lifespanMs = (resistencia + energia) * 1500; 

            const name = `${ingredients.biologia.name} ${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]}`;
            
            resolve({
                name: name,
                description: `Uma forma de vida baseada em ${ingredients.quimica.name}, mantida por ${ingredients.fisica.name}.`,
                stats: {
                    forca: forca,
                    resistencia: resistencia,
                    energia: energia,
                    lifespan: lifespanMs, // <--- O dado novo
                    maxLifespan: lifespanMs
                },
                dialogo: "Sinto minha energia decaindo a cada segundo..."
            });
        }, 600); // Delay menor para ser ágil
    });
}