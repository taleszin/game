// src/services/MockAiService.js

// TABELA DE ALQUIMIA (Mantida para as formas "Perfeitas")
const GEOMETRY_MIX = {
    'circulo+quadrado': 'cilindro',
    'quadrado+circulo': 'cilindro',
    'circulo+triangulo': 'cone',
    'triangulo+circulo': 'cone',
    'quadrado+triangulo': 'piramide',
    'triangulo+quadrado': 'piramide',
    'triangulo+triangulo': 'fractal',
    'quadrado+quadrado': 'tesseract',
    'circulo+circulo': 'esfera',
    'losango+circulo': 'olho',
    'circulo+losango': 'olho',
    'cruz+circulo': 'mira',
    'circulo+cruz': 'mira'
};

// DADOS MATEMÁTICOS DAS FORMAS BASE (Para cálculos)
const SHAPE_MATH = {
    'circulo': { sides: 1, complexity: 0 },
    'triangulo': { sides: 3, complexity: 1 },
    'quadrado': { sides: 4, complexity: 1 },
    'losango': { sides: 4, complexity: 2 },
    'pentagono': { sides: 5, complexity: 1 },
    'hexagono': { sides: 6, complexity: 1 },
    'cruz': { sides: 12, complexity: 3 },
    'estrela': { sides: 10, complexity: 4 }
};

// CALCULADORA (Atualizada para Procedural e Dimensões Únicas)
function calculateGeoStats(shapeId, scaleX, scaleY, proceduralParams = null) {
    // Base dimensions (approximate radius/half-width)
    // Usamos 30 como base genérica, mas ajustamos por X e Y
    const avgScale = (scaleX + scaleY) / 2;
    const baseSize = 30 * avgScale;
    
    let area = 0;
    let perimeter = 0;
    let vertices = 0;

    if (shapeId === 'procedural' && proceduralParams) {
        // Cálculo aproximado para formas complexas geradas
        vertices = proceduralParams.sides;
        // Área de polígono regular aproximada (distorcida pela escala média)
        area = (vertices * (baseSize ** 2)) / (4 * Math.tan(Math.PI / vertices));
        perimeter = vertices * (baseSize * 2 * Math.sin(Math.PI / vertices));
    } else {
        // Formas conhecidas
        const sides = SHAPE_MATH[shapeId] ? SHAPE_MATH[shapeId].sides : 4;
        vertices = sides;
        
        if (shapeId === 'circulo') {
            // Elipse: Area = pi * a * b
            // Raio base = 25 (do Golem.js)
            const rX = 25 * scaleX;
            const rY = 25 * scaleY;
            area = Math.PI * rX * rY;
            
            // Perímetro Ramanujan approx
            // p ≈ π [ 3(a+b) - sqrt( (3a+b)(a+3b) ) ]
            const h = ((rX - rY)**2) / ((rX + rY)**2);
            perimeter = Math.PI * (rX + rY) * (1 + (3*h)/(10 + Math.sqrt(4 - 3*h)));
            
            vertices = "∞"; // Infinito
        } else if (shapeId === 'quadrado') {
            // Retângulo
            // Base 44x44 (do Golem.js) -> 44*scaleX por 44*scaleY
            const w = 44 * scaleX;
            const h = 44 * scaleY;
            area = w * h;
            perimeter = 2 * (w + h);
        } else {
            // Outras formas (aproximação genérica usando escala média)
            area = (baseSize * baseSize) * (sides * 0.5); 
            perimeter = baseSize * sides;
        }
    }

    return {
        area: Math.floor(area) + ' px²',
        perimeter: Math.floor(perimeter) + ' px',
        vertices: vertices,
        scale: `${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`
    };
}

export function generateGolemData(ingredients) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const baseLife = 30000;
            // Escalas independentes para X e Y (Dimensões Únicas)
            const scaleX = 0.7 + Math.random() * 0.8; 
            const scaleY = 0.7 + Math.random() * 0.8;
            const avgScale = (scaleX + scaleY) / 2;

            const geoStats = calculateGeoStats(ingredients.forma.id, scaleX, scaleY);

            resolve({
                name: `Entidade ${ingredients.forma.name}`,
                description: "Geometria primitiva instanciada.",
                stats: { 
                    forca: Math.floor(10 * avgScale), 
                    resistencia: 10, 
                    energia: Math.floor(20 / avgScale), 
                    lifespan: baseLife * avgScale,
                    maxLifespan: baseLife * avgScale,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    scale: avgScale.toFixed(2), // Fallback
                    ...geoStats
                },
                dialogo: "Cálculo de área completo."
            });
        }, 500);
    });
}

export function breedGolemData(parent1, parent2) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const shape1 = parent1.biologia ? parent1.biologia.id : parent1.forma.id;
            const shape2 = parent2.biologia ? parent2.biologia.id : parent2.forma.id;
            
            const keys = [shape1, shape2].sort();
            const mixKey = `${keys[0]}+${keys[1]}`;
            
            let childFormaData = {};
            let childShapeId = GEOMETRY_MIX[mixKey];

            // --- LÓGICA PROCEDURAL (O SEGREDO) ---
            if (childShapeId) {
                // Caso exista forma "Bonita" definida (ex: Cilindro)
                const displayNames = {
                    'cilindro': 'Cilindro', 'cone': 'Cone', 'piramide': 'Pirâmide',
                    'fractal': 'Fractal', 'tesseract': 'Tesseract', 'esfera': 'Esfera',
                    'olho': 'Olho', 'mira': 'Mira', 'cristal': 'Cristal'
                };
                childFormaData = {
                    id: childShapeId,
                    name: displayNames[childShapeId],
                    desc: 'Forma geométrica estável.'
                };
            } else {
                // CASO NÃO EXISTA: Gera Matemática Procedural
                // Soma os lados dos pais para criar uma forma nova
                const s1 = SHAPE_MATH[shape1] ? SHAPE_MATH[shape1].sides : 4;
                const s2 = SHAPE_MATH[shape2] ? SHAPE_MATH[shape2].sides : 4;
                
                // A nova forma terá a soma ou média dos lados, com variação
                let newSides = s1 + s2;
                if (newSides > 12) newSides = Math.floor(newSides / 2) + 3; // Evita círculos perfeitos demais
                
                // "Seed" baseada nos nomes para ser consistente (A+B sempre gera o mesmo C)
                const seed = (shape1.length + shape2.length) * (s1 + s2);
                
                // Complexidade define o quão "pontudo" ou "irregular" é
                const complexity = (SHAPE_MATH[shape1]?.complexity || 1) + (SHAPE_MATH[shape2]?.complexity || 1);

                childShapeId = 'procedural';
                childFormaData = {
                    id: 'procedural',
                    name: `Polígono-${newSides}`,
                    desc: `Geometria complexa de ${newSides} vértices.`,
                    // Passamos os parâmetros matemáticos para o Golem.js desenhar
                    params: {
                        sides: newSides,
                        roughness: complexity * 0.2, // Quão deformado
                        seed: seed
                    }
                };
            }

            // Herança de Tamanho (Dimensões Independentes)
            const p1Stats = parent1.aiData.stats;
            const p2Stats = parent2.aiData.stats;
            
            // Fallback para scale antigo se scaleX/Y não existirem
            let sX1 = p1Stats.scaleX !== undefined ? parseFloat(p1Stats.scaleX) : (parseFloat(p1Stats.scale) || 1);
            let sY1 = p1Stats.scaleY !== undefined ? parseFloat(p1Stats.scaleY) : (parseFloat(p1Stats.scale) || 1);
            let sX2 = p2Stats.scaleX !== undefined ? parseFloat(p2Stats.scaleX) : (parseFloat(p2Stats.scale) || 1);
            let sY2 = p2Stats.scaleY !== undefined ? parseFloat(p2Stats.scaleY) : (parseFloat(p2Stats.scale) || 1);

            let newScaleX = (sX1 + sX2) / 2;
            let newScaleY = (sY1 + sY2) / 2;
            
            // Mutação independente
            if (Math.random() > 0.6) newScaleX *= (0.85 + Math.random() * 0.3);
            if (Math.random() > 0.6) newScaleY *= (0.85 + Math.random() * 0.3);

            // Calcula stats matemáticos reais da nova forma
            const geoStats = calculateGeoStats(childShapeId, newScaleX, newScaleY, childFormaData.params);

            const bonus = 1.2;

            const newStats = {
                forca: Math.floor(((p1Stats.forca + p2Stats.forca) / 2) * bonus),
                resistencia: Math.floor(((p1Stats.resistencia + p2Stats.resistencia) / 2) * bonus),
                energia: Math.floor(((p1Stats.energia + p2Stats.energia) / 2) * bonus),
                lifespan: ((p1Stats.maxLifespan + p2Stats.maxLifespan) / 2) * bonus,
                scaleX: newScaleX,
                scaleY: newScaleY,
                scale: ((newScaleX + newScaleY)/2).toFixed(2),
                ...geoStats
            };

            resolve({
                forma: childFormaData,
                biologia: childFormaData,
                quimica: Math.random() > 0.5 ? parent1.quimica : parent2.quimica,
                fisica: Math.random() > 0.5 ? parent1.fisica : parent2.fisica,
                aiData: {
                    name: childFormaData.name,
                    description: `Fusão topológica: ${shape1} + ${shape2}.`,
                    stats: { ...newStats, maxLifespan: newStats.lifespan },
                    dialogo: "Minha matemática é única."
                }
            });
        }, 500);
    });
}