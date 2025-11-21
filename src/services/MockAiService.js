const GEOMETRY_MIX = {
    'circulo+quadrado': 'squircle',
    'quadrado+circulo': 'squircle',
    
    'circulo+triangulo': 'cone',
    'triangulo+circulo': 'cone',
    
    'circulo+pentagono': 'escudo',
    'pentagono+circulo': 'escudo',
    
    'circulo+cruz': 'trevo',
    'cruz+circulo': 'trevo',
    
    'circulo+losango': 'olho',
    'losango+circulo': 'olho',

    'quadrado+triangulo': 'cristal',
    'triangulo+quadrado': 'cristal',
    
    'quadrado+losango': 'pipa',
    'losango+quadrado': 'pipa',
    
    'quadrado+cruz': 'grade',
    'cruz+quadrado': 'grade',

    'triangulo+triangulo': 'estrela6',
    'quadrado+quadrado': 'estrela8',
    'pentagono+pentagono': 'decagono',
    'circulo+circulo': 'vesica',
    
    'pentagono+triangulo': 'estrela5',
    'triangulo+pentagono': 'estrela5',
    
    'hexagono+triangulo': 'virus',
    'triangulo+hexagono': 'virus'
};

export function generateGolemData(ingredients) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const baseLife = 15000;
            resolve({
                name: `Entidade ${ingredients.forma.name}`,
                description: "Forma geométrica pura estabilizada.",
                stats: { forca: 10, resistencia: 10, energia: 10, lifespan: baseLife, maxLifespan: baseLife },
                dialogo: "Minha geometria é absoluta."
            });
        }, 600);
    });
}

export function breedGolemData(parent1, parent2) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const shape1 = parent1.biologia ? parent1.biologia.id : parent1.forma.id;
            const shape2 = parent2.biologia ? parent2.biologia.id : parent2.forma.id;
            
            const keys = [shape1, shape2].sort();
            const mixKey = `${keys[0]}+${keys[1]}`;
            
            let childShapeId = GEOMETRY_MIX[mixKey];
            
            if (!childShapeId) {
                childShapeId = Math.random() > 0.5 ? shape1 : shape2;
            }

            const displayNames = {
                'squircle': 'Quadrado Suave',
                'cone': 'Cone Cônico',
                'escudo': 'Escudo Abaulado',
                'trevo': 'Trevo Energético',
                'olho': 'Olho Místico',
                'cristal': 'Obelisco',
                'pipa': 'Prisma Rhombus',
                'grade': 'Grade Estrutural',
                'estrela6': 'Hexagrama',
                'estrela8': 'Octograma',
                'estrela5': 'Estrela Radiante',
                'vesica': 'Vesica Piscis',
                'decagono': 'Decágono',
                'virus': 'Fago Geométrico'
            };

            const childForma = {
                id: childShapeId,
                name: displayNames[childShapeId] || "Híbrido",
                desc: 'Geometria resultante de fusão lógica.'
            };

            const p1Stats = parent1.aiData.stats;
            const p2Stats = parent2.aiData.stats;
            const bonus = 1.2;

            const newStats = {
                forca: Math.floor((p1Stats.forca + p2Stats.forca) / 2 * bonus),
                resistencia: Math.floor((p1Stats.resistencia + p2Stats.resistencia) / 2 * bonus),
                energia: Math.floor((p1Stats.energia + p2Stats.energia) / 2 * bonus),
                lifespan: ((p1Stats.maxLifespan + p2Stats.maxLifespan) / 2) * bonus
            };

            resolve({
                forma: childForma,
                biologia: childForma,
                quimica: Math.random() > 0.5 ? parent1.quimica : parent2.quimica,
                fisica: Math.random() > 0.5 ? parent1.fisica : parent2.fisica,
                aiData: {
                    name: `Descendente ${childForma.name}`,
                    description: `Fusão de ${shape1} com ${shape2}.`,
                    stats: { ...newStats, maxLifespan: newStats.lifespan },
                    dialogo: "Eu sou a soma das formas."
                }
            });
        }, 500);
    });
}