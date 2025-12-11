// ═══════════════════════════════════════════════════════════════════
// MOCK AI SERVICE - Simulação de API com Genética Mendeliana
// Arquitetura preparada para integração real com LLMs
// ═══════════════════════════════════════════════════════════════════

import {
    DIALOGUE_BY_PHYSICS,
    DIALOGUE_MODIFIERS_CHEMISTRY,
    DIALOGUE_SPECIAL_ACTIONS,
    PHYSICS_COLORS,
    PHYSICS_PERSONALITY,
    CHEMISTRY_MODIFIERS
} from '../data/dialogueData.js';

// ═══════════════════════════════════════════════════════════════════
// UTILITÁRIOS DE GENÉTICA E COR
// ═══════════════════════════════════════════════════════════════════

/**
 * Interpola entre duas cores hexadecimais (Color Blending)
 * Usa interpolação linear no espaço RGB
 * @param {number} color1 - Primeira cor (hex: 0xRRGGBB)
 * @param {number} color2 - Segunda cor (hex: 0xRRGGBB)
 * @param {number} factor - Fator de mistura (0 = color1, 1 = color2, 0.5 = meio)
 * @returns {number} Cor resultante em hex
 */
export function lerpColor(color1, color2, factor = 0.5) {
    // Extrai componentes RGB da cor 1
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    
    // Extrai componentes RGB da cor 2
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;
    
    // Interpola cada componente
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    // Reconstrói a cor hex
    return (r << 16) | (g << 8) | b;
}

/**
 * Adiciona variação aleatória a uma cor (mutação cromática)
 * @param {number} color - Cor base em hex
 * @param {number} variance - Variância máxima por canal (0-255)
 * @returns {number} Cor mutada
 */
export function mutateColor(color, variance = 20) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    
    const mutateChannel = (c) => {
        const delta = (Math.random() - 0.5) * 2 * variance;
        return Math.max(0, Math.min(255, Math.round(c + delta)));
    };
    
    return (mutateChannel(r) << 16) | (mutateChannel(g) << 8) | mutateChannel(b);
}

/**
 * Aumenta saturação e brilho para criar efeito NEON
 * Converte para HSL, aumenta S e L, retorna para RGB
 * @param {number} color - Cor em hex
 * @param {number} satBoost - Multiplicador de saturação (1.0 = sem mudança, 1.5 = +50%)
 * @param {number} lightBoost - Adição de luminosidade (0-100)
 * @returns {number} Cor neonizada
 */
export function neonizeColor(color, satBoost = 1.4, lightBoost = 15) {
    let r = ((color >> 16) & 0xff) / 255;
    let g = ((color >> 8) & 0xff) / 255;
    let b = (color & 0xff) / 255;
    
    // RGB para HSL
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // Acromático
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    // Boost de saturação e luminosidade
    s = Math.min(1, s * satBoost);
    l = Math.min(0.85, l + lightBoost / 100); // Cap para evitar branco puro
    
    // HSL para RGB
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    
    let rOut, gOut, bOut;
    if (s === 0) {
        rOut = gOut = bOut = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        rOut = hue2rgb(p, q, h + 1/3);
        gOut = hue2rgb(p, q, h);
        bOut = hue2rgb(p, q, h - 1/3);
    }
    
    return (Math.round(rOut * 255) << 16) | (Math.round(gOut * 255) << 8) | Math.round(bOut * 255);
}

/**
 * Aplica herança Mendeliana com mutação a um valor numérico
 * @param {number} value1 - Valor do pai 1
 * @param {number} value2 - Valor do pai 2
 * @param {number} mutationRate - Taxa de mutação (0-1)
 * @param {number} mutationVariance - Variância da mutação (ex: 0.1 = ±10%)
 * @returns {number} Valor herdado com possível mutação
 */
export function inheritWithMutation(value1, value2, mutationRate = 0.3, mutationVariance = 0.1) {
    // Média ponderada aleatória (simula dominância genética variável)
    const dominance = 0.3 + Math.random() * 0.4; // 0.3 a 0.7
    let result = value1 * dominance + value2 * (1 - dominance);
    
    // Aplica mutação
    if (Math.random() < mutationRate) {
        const mutationFactor = 1 + (Math.random() - 0.5) * 2 * mutationVariance;
        result *= mutationFactor;
    }
    
    return result;
}

/**
 * Gera um ID único para o Golem
 */
function generateGolemId() {
    return `golem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════════
// SISTEMA DE DIÁLOGO - Simulação de API
// ═══════════════════════════════════════════════════════════════════

/**
 * Simula uma chamada assíncrona à API de diálogo
 * Estrutura preparada para ser substituída por fetch() real
 * 
 * @param {Object} request - Requisição estruturada
 * @param {Object} request.golemProfile - Perfil do Golem (fisica, quimica)
 * @param {string} request.context - Contexto da fala
 * @param {number} request.temperature - "Criatividade" (0-1)
 * @returns {Promise<Object>} Resposta da "API"
 */
export async function fetchDialogue(request) {
    // Simula latência de rede (20-100ms)
    const latency = 20 + Math.random() * 80;
    await new Promise(resolve => setTimeout(resolve, latency));
    
    const { golemProfile, context, temperature = 0.7 } = request;
    
    const physicsId = golemProfile?.fisica?.id || 'luz';
    const chemId = golemProfile?.quimica?.id || 'carbono';
    
    try {
        // Ações especiais primeiro
        if (context === 'breed' || context === 'mutate') {
            const phrases = DIALOGUE_SPECIAL_ACTIONS[context];
            return {
                success: true,
                dialogue: phrases[Math.floor(Math.random() * phrases.length)],
                metadata: { source: 'special_action', context, latency: Math.round(latency) }
            };
        }
        
        // Busca frases base por física
        const physicsDialogue = DIALOGUE_BY_PHYSICS[physicsId] || DIALOGUE_BY_PHYSICS.luz;
        const contextPhrases = physicsDialogue[context] || physicsDialogue.idle;
        
        let phrase = contextPhrases[Math.floor(Math.random() * contextPhrases.length)];
        
        // Aplica modificador químico baseado na "temperature"
        if (Math.random() < temperature * 0.5) {
            const chemModifier = DIALOGUE_MODIFIERS_CHEMISTRY[chemId];
            if (chemModifier) {
                if (Math.random() < 0.5 && chemModifier.prefix) {
                    const prefix = chemModifier.prefix[Math.floor(Math.random() * chemModifier.prefix.length)];
                    phrase = `${prefix} ${phrase}`;
                } else if (chemModifier.suffix) {
                    const suffix = chemModifier.suffix[Math.floor(Math.random() * chemModifier.suffix.length)];
                    phrase = phrase.replace(/[.!~]+$/, '') + suffix;
                }
            }
        }
        
        return {
            success: true,
            dialogue: phrase,
            metadata: { source: 'physics_dialogue', physicsId, chemId, context, latency: Math.round(latency) }
        };
        
    } catch (error) {
        return { success: false, dialogue: '...', metadata: { error: error.message } };
    }
}

/**
 * Função de conveniência para gerar diálogo (compatibilidade)
 */
export function generateDialogue(golemData, context = 'idle') {
    const physicsId = golemData.fisica?.id || 'luz';
    const chemId = golemData.quimica?.id || 'carbono';
    
    if (context === 'breed' || context === 'mutate') {
        const phrases = DIALOGUE_SPECIAL_ACTIONS[context];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    const physicsDialogue = DIALOGUE_BY_PHYSICS[physicsId] || DIALOGUE_BY_PHYSICS.luz;
    const contextPhrases = physicsDialogue[context] || physicsDialogue.idle;
    let phrase = contextPhrases[Math.floor(Math.random() * contextPhrases.length)];
    
    if (Math.random() < 0.3) {
        const chemModifier = DIALOGUE_MODIFIERS_CHEMISTRY[chemId];
        if (chemModifier) {
            if (Math.random() < 0.5 && chemModifier.prefix) {
                phrase = `${chemModifier.prefix[Math.floor(Math.random() * chemModifier.prefix.length)]} ${phrase}`;
            } else if (chemModifier.suffix) {
                phrase = phrase.replace(/[.!~]+$/, '') + chemModifier.suffix[Math.floor(Math.random() * chemModifier.suffix.length)];
            }
        }
    }
    
    return phrase;
}

// ═══════════════════════════════════════════════════════════════════
// SISTEMA DE ALQUIMIA GEOMÉTRICA
// ═══════════════════════════════════════════════════════════════════

/**
 * FAMÍLIAS GEOMÉTRICAS - Categorização de formas
 * Usado para determinar compatibilidade alquímica
 */
const GEOMETRY_FAMILIES = {
    // Família Redonda: formas curvas e circulares
    ROUND: ['circulo', 'esfera', 'cilindro', 'cone', 'olho', 'capsula', 'domo'],
    // Família Angular: formas com arestas definidas
    ANGULAR: ['quadrado', 'triangulo', 'pentagono', 'hexagono', 'losango', 'piramide', 'obelisco', 'monolito', 'tesseract', 'cubo'],
    // Família Mista: formas complexas/híbridas
    HYBRID: ['cruz', 'estrela', 'fractal', 'cristal', 'mira']
};

/**
 * Retorna a família de uma forma
 */
function getShapeFamily(shapeId) {
    if (GEOMETRY_FAMILIES.ROUND.includes(shapeId)) return 'ROUND';
    if (GEOMETRY_FAMILIES.ANGULAR.includes(shapeId)) return 'ANGULAR';
    if (GEOMETRY_FAMILIES.HYBRID.includes(shapeId)) return 'HYBRID';
    return 'UNKNOWN';
}

/**
 * TABELA DE ALQUIMIA PRIMÁRIA
 * Combinações exatas conhecidas (Receitas Perfeitas)
 */
const ALCHEMY_RECIPES = {
    // Receitas Clássicas (Dimensionalização)
    'circulo+quadrado': 'cilindro',
    'circulo+triangulo': 'cone',
    'quadrado+triangulo': 'piramide',
    
    // Receitas de Duplicação (Evolução)
    'circulo+circulo': 'esfera',
    'quadrado+quadrado': 'tesseract',
    'triangulo+triangulo': 'fractal',
    
    // Receitas Especiais
    'losango+circulo': 'olho',
    'cruz+circulo': 'mira',
    'losango+quadrado': 'cristal',
    'cruz+quadrado': 'obelisco',
    'pentagono+hexagono': 'estrela',
    'triangulo+losango': 'piramide',
    
    // Receitas Avançadas (Formas 3D)
    'esfera+cilindro': 'capsula',
    'piramide+quadrado': 'obelisco',
    'cone+cilindro': 'domo',
    'tesseract+piramide': 'monolito',
    'esfera+cone': 'domo',
    'cilindro+piramide': 'obelisco'
};

/**
 * FALLBACKS POR FAMÍLIA
 * Quando não há receita exata, usa lógica de famílias
 */
const FAMILY_FALLBACKS = {
    // Redonda + Angular = Formas de Transição
    'ROUND+ANGULAR': [
        { id: 'capsula', name: 'Cápsula', desc: 'Harmonia entre curva e aresta.' },
        { id: 'domo', name: 'Domo', desc: 'Abobada geométrica estabilizada.' },
        { id: 'cilindro', name: 'Cilindro', desc: 'Fusão circular-retilínea.' }
    ],
    // Angular + Angular = Formas Compostas
    'ANGULAR+ANGULAR': [
        { id: 'obelisco', name: 'Obelisco', desc: 'Torre de geometria pura.' },
        { id: 'monolito', name: 'Monólito', desc: 'Bloco primário dimensional.' },
        { id: 'cristal', name: 'Cristal', desc: 'Estrutura angular perfeita.' }
    ],
    // Redonda + Redonda = Esferas Evoluídas
    'ROUND+ROUND': [
        { id: 'esfera', name: 'Esfera', desc: 'Perfeita simetria radial.' },
        { id: 'capsula', name: 'Cápsula', desc: 'Esfera alongada.' },
        { id: 'domo', name: 'Domo', desc: 'Semi-esfera cristalizada.' }
    ],
    // Hybrid + Qualquer = Formas Complexas
    'HYBRID+ANY': [
        { id: 'fractal', name: 'Fractal', desc: 'Padrão auto-replicante.' },
        { id: 'estrela', name: 'Estrela', desc: 'Radiação geométrica.' },
        { id: 'cristal', name: 'Cristal', desc: 'Complexidade cristalizada.' }
    ]
};

/**
 * ANOMALIAS - Formas instáveis (variantes raras)
 * Quando nenhum fallback se aplica, gera uma Anomalia
 */
const ANOMALY_TEMPLATES = [
    { name: 'Anomalia Geométrica', desc: 'Forma impossível que desafia a lógica euclidiana.' },
    { name: 'Erro Topológico', desc: 'Glitch dimensional materializado.' },
    { name: 'Singularidade', desc: 'Ponto de colapso geométrico.' },
    { name: 'Quimera Espacial', desc: 'Fusão caótica de dimensões.' },
    { name: 'Paradoxo Euclidiano', desc: 'Forma que não deveria existir.' },
    { name: 'Fragmento Void', desc: 'Pedaço do vazio entre dimensões.' }
];

/**
 * Resolve a combinação de duas formas usando o sistema de Alquimia
 * @returns {{ forma: Object, isAnomaly: boolean, stability: number }}
 */
function resolveAlchemyCombination(shape1, shape2) {
    // 1. Tenta receita exata (ordem não importa)
    const key1 = `${shape1}+${shape2}`;
    const key2 = `${shape2}+${shape1}`;
    
    if (ALCHEMY_RECIPES[key1]) {
        const id = ALCHEMY_RECIPES[key1];
        return {
            forma: { id, name: capitalizeFirst(id), desc: 'Alquimia perfeita.' },
            isAnomaly: false,
            stability: 1.0 // 100% estável
        };
    }
    if (ALCHEMY_RECIPES[key2]) {
        const id = ALCHEMY_RECIPES[key2];
        return {
            forma: { id, name: capitalizeFirst(id), desc: 'Alquimia perfeita.' },
            isAnomaly: false,
            stability: 1.0
        };
    }
    
    // 2. Determina famílias e busca fallback
    const family1 = getShapeFamily(shape1);
    const family2 = getShapeFamily(shape2);
    
    let fallbackKey = `${family1}+${family2}`;
    let fallbackOptions = FAMILY_FALLBACKS[fallbackKey];
    
    // Tenta ordem inversa
    if (!fallbackOptions) {
        fallbackKey = `${family2}+${family1}`;
        fallbackOptions = FAMILY_FALLBACKS[fallbackKey];
    }
    
    // Fallback para HYBRID+ANY
    if (!fallbackOptions && (family1 === 'HYBRID' || family2 === 'HYBRID')) {
        fallbackOptions = FAMILY_FALLBACKS['HYBRID+ANY'];
    }
    
    if (fallbackOptions && fallbackOptions.length > 0) {
        // Escolhe aleatoriamente entre as opções de fallback
        const chosen = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
        return {
            forma: { id: chosen.id, name: chosen.name, desc: chosen.desc },
            isAnomaly: false,
            stability: 0.7 + Math.random() * 0.2 // 70-90% estável
        };
    }
    
    // 3. Nenhum match - gera ANOMALIA (forma procedural rara)
    const anomalyTemplate = ANOMALY_TEMPLATES[Math.floor(Math.random() * ANOMALY_TEMPLATES.length)];
    const s1 = SHAPE_MATH[shape1]?.sides || 4;
    const s2 = SHAPE_MATH[shape2]?.sides || 4;
    let newSides = s1 + s2;
    if (newSides > 12) newSides = Math.floor(newSides / 2) + 3;
    
    return {
        forma: {
            id: 'anomaly', // Tipo especial para renderização com glitch
            name: anomalyTemplate.name,
            desc: anomalyTemplate.desc,
            params: {
                sides: newSides,
                roughness: 0.3 + Math.random() * 0.3, // Alta irregularidade
                seed: Date.now() % 1000,
                glitchIntensity: 0.5 + Math.random() * 0.5 // Para efeito visual
            }
        },
        isAnomaly: true,
        stability: 0.2 + Math.random() * 0.3 // 20-50% estável (instável)
    };
}

/**
 * Helper: Capitaliza primeira letra
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const SHAPE_MATH = {
    'circulo': { sides: 1, complexity: 0 }, 'triangulo': { sides: 3, complexity: 1 },
    'quadrado': { sides: 4, complexity: 1 }, 'losango': { sides: 4, complexity: 2 },
    'pentagono': { sides: 5, complexity: 1 }, 'hexagono': { sides: 6, complexity: 1 },
    'cruz': { sides: 12, complexity: 3 }, 'estrela': { sides: 10, complexity: 4 },
    'esfera': { sides: 1, complexity: 2 }, 'cilindro': { sides: 2, complexity: 2 },
    'cone': { sides: 2, complexity: 2 }, 'piramide': { sides: 4, complexity: 3 },
    'capsula': { sides: 2, complexity: 2 }, 'domo': { sides: 2, complexity: 2 },
    'obelisco': { sides: 4, complexity: 3 }, 'monolito': { sides: 4, complexity: 3 },
    'tesseract': { sides: 8, complexity: 4 }, 'fractal': { sides: 9, complexity: 5 },
    'cristal': { sides: 6, complexity: 3 }, 'anomaly': { sides: 7, complexity: 5 }
};

// ═══════════════════════════════════════════════════════════════════
// INTEGRAÇÃO COM GEOMETRY MATH MODULE
// ═══════════════════════════════════════════════════════════════════

// Importação dinâmica do módulo de geometria (lazy load)
let GeometryMathModule = null;

async function loadGeometryMath() {
    if (!GeometryMathModule) {
        try {
            GeometryMathModule = await import('../utils/GeometryMath.js');
            console.log('[MockAI] GeometryMath module loaded successfully');
        } catch (e) {
            console.warn('[MockAI] GeometryMath module not available, using fallback:', e.message);
        }
    }
    return GeometryMathModule;
}

// Tenta carregar o módulo na inicialização
loadGeometryMath();

/**
 * Calcula estatísticas geométricas usando o novo módulo ou fallback
 * @returns {Object} { area, perimeter, areaRaw, perimeterRaw, formula, description }
 */
function calculateGeoStats(shapeId, scaleX, scaleY, proceduralParams = null) {
    // Tenta usar o módulo de geometria precisa
    if (GeometryMathModule) {
        try {
            const result = GeometryMathModule.calculateGeometry(shapeId, scaleX, scaleY, proceduralParams);
            return {
                area: result.areaFormatted,
                perimeter: result.perimeterFormatted,
                areaRaw: result.area,
                perimeterRaw: result.perimeter,
                formula: result.formula,
                description: result.description,
                scale: `${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`
            };
        } catch (e) {
            console.warn('[MockAI] GeometryMath calculation failed, using fallback:', e.message);
        }
    }
    
    // Fallback: cálculo simplificado (legado)
    const avgScale = (scaleX + scaleY) / 2;
    const baseSize = 30 * avgScale;
    let area = 0, perimeter = 0, vertices = 0;

    if (shapeId === 'procedural' && proceduralParams) {
        vertices = proceduralParams.sides;
        area = (vertices * (baseSize ** 2)) / (4 * Math.tan(Math.PI / vertices));
        perimeter = vertices * (baseSize * 2 * Math.sin(Math.PI / vertices));
    } else {
        const sides = SHAPE_MATH[shapeId]?.sides || 4;
        vertices = sides;
        
        if (shapeId === 'circulo') {
            const rX = 25 * scaleX, rY = 25 * scaleY;
            area = Math.PI * rX * rY;
            const h = ((rX - rY)**2) / ((rX + rY)**2);
            perimeter = Math.PI * (rX + rY) * (1 + (3*h)/(10 + Math.sqrt(4 - 3*h)));
            vertices = "∞";
        } else if (shapeId === 'quadrado') {
            area = 44 * scaleX * 44 * scaleY;
            perimeter = 2 * (44 * scaleX + 44 * scaleY);
        } else {
            area = (baseSize ** 2) * (sides * 0.5);
            perimeter = baseSize * sides;
        }
    }

    return {
        area: Math.floor(area) + ' px²',
        perimeter: Math.floor(perimeter) + ' px',
        areaRaw: area,
        perimeterRaw: perimeter,
        vertices,
        formula: 'Cálculo legado',
        description: `Forma: ${shapeId}`,
        scale: `${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`
    };
}

/**
 * Calcula força baseada na área real da forma
 * Força é proporcional à raiz quadrada da área (balanceamento)
 */
function calculateStrength(areaRaw, baseStrength = 10) {
    // Se o módulo estiver disponível, usa a função dele
    if (GeometryMathModule && GeometryMathModule.calculateStrengthFromArea) {
        return GeometryMathModule.calculateStrengthFromArea(areaRaw, baseStrength);
    }
    
    // Fallback: área de referência (círculo base)
    const referenceArea = Math.PI * 25 * 25; // ~1963 px²
    const areaFactor = Math.sqrt(areaRaw / referenceArea);
    return Math.floor(baseStrength * areaFactor);
}

export function generateGolemData(ingredients) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const baseLife = 30000;
            const scaleX = 0.7 + Math.random() * 0.8;
            const scaleY = 0.7 + Math.random() * 0.8;
            const avgScale = (scaleX + scaleY) / 2;
            
            const physicsId = ingredients.fisica?.id || 'luz';
            const chemId = ingredients.quimica?.id || 'carbono';
            
            const baseColor = PHYSICS_COLORS[physicsId] || 0x00ffff;
            const personality = PHYSICS_PERSONALITY[physicsId] || PHYSICS_PERSONALITY.luz;
            const chemMods = CHEMISTRY_MODIFIERS[chemId] || CHEMISTRY_MODIFIERS.carbono;

            // Calcula geometria usando o novo módulo (ou fallback)
            const geoStats = calculateGeoStats(ingredients.forma.id, scaleX, scaleY);
            
            // Força proporcional à área real calculada
            const strengthFromArea = calculateStrength(geoStats.areaRaw || 1000, 10);

            resolve({
                id: generateGolemId(),
                name: `Entidade ${ingredients.forma.name}`,
                description: "Geometria primitiva instanciada.",
                
                // DNA Visual para herança (Primeira geração: todas as cores são iguais)
                visualDNA: {
                    bodyColor: baseColor,      // Cor do preenchimento/corpo
                    detailColor: baseColor,    // Cor do rosto (detalhes)
                    auraColor: neonizeColor(baseColor, 1.3, 10), // Glow externo (neonizado)
                    eyeJitter: personality.eyeJitter,
                    blinkRate: personality.blinkRate,
                    lineWidth: chemMods.lineWidth
                },
                
                stats: {
                    forca: strengthFromArea, // AGORA PROPORCIONAL À ÁREA REAL
                    resistencia: Math.floor(10 * chemMods.resistanceMod),
                    energia: Math.floor(20 / avgScale),
                    lifespan: baseLife * avgScale,
                    maxLifespan: baseLife * avgScale,
                    scaleX, scaleY,
                    scale: avgScale.toFixed(2),
                    ...geoStats
                },
                dialogo: "Cálculo de área completo."
            });
        }, 500);
    });
}

// ═══════════════════════════════════════════════════════════════════
// BREEDING 2.0 - GENÉTICA MENDELIANA + ALQUIMIA
// ═══════════════════════════════════════════════════════════════════

export function breedGolemData(parent1, parent2) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // ═══ ALQUIMIA GEOMÉTRICA ═══
            const shape1 = parent1.biologia?.id || parent1.forma?.id || 'quadrado';
            const shape2 = parent2.biologia?.id || parent2.forma?.id || 'quadrado';
            
            // Usa o novo sistema de Alquimia
            const alchemyResult = resolveAlchemyCombination(shape1, shape2);
            const childFormaData = alchemyResult.forma;
            const isAnomaly = alchemyResult.isAnomaly;
            const stability = alchemyResult.stability;

            // ═══ HERANÇA DE FÍSICA/QUÍMICA ═══
            const inheritedPhysics = Math.random() > 0.5 ? parent1.fisica : parent2.fisica;
            const inheritedChemistry = Math.random() > 0.5 ? parent1.quimica : parent2.quimica;

            // ═══ GENÉTICA VISUAL HÍBRIDA ═══
            // Regras de herança:
            // 1. BODY (Corpo): Herança discreta (50/50 entre pais)
            // 2. DETAIL (Rosto): Inverso do body (garante contraste genético)
            // 3. AURA (Energia): Blend das cores dos pais (fusão de energias)
            
            const p1Visual = parent1.visualDNA || {};
            const p2Visual = parent2.visualDNA || {};
            
            // Cores base dos pais (fallback para PHYSICS_COLORS se não houver DNA)
            const p1BodyColor = p1Visual.bodyColor || PHYSICS_COLORS[parent1.fisica?.id] || 0x00ffff;
            const p2BodyColor = p2Visual.bodyColor || PHYSICS_COLORS[parent2.fisica?.id] || 0x00ffff;
            
            // Herança Discreta: 50/50 para quem doa o corpo
            const bodyFromParent1 = Math.random() < 0.5;
            let childBodyColor = bodyFromParent1 ? p1BodyColor : p2BodyColor;
            let childDetailColor = bodyFromParent1 ? p2BodyColor : p1BodyColor; // Inverso!
            
            // Aura: Blend 50/50 das cores dos pais + NEONIZAÇÃO
            let childAuraColor = lerpColor(p1BodyColor, p2BodyColor, 0.5);
            childAuraColor = neonizeColor(childAuraColor, 1.5, 20); // Extra neon para aura
            
            // 15% de chance de mutação cromática em cada cor
            if (Math.random() < 0.15) {
                childBodyColor = mutateColor(childBodyColor, 25);
            }
            if (Math.random() < 0.15) {
                childDetailColor = mutateColor(childDetailColor, 25);
            }
            if (Math.random() < 0.20) {
                childAuraColor = mutateColor(childAuraColor, 35); // Aura mais volátil
            }

            // ═══ HERANÇA DE TRAÇOS VISUAIS ═══
            const childVisualDNA = {
                bodyColor: childBodyColor,
                detailColor: childDetailColor,
                auraColor: childAuraColor,
                eyeJitter: inheritWithMutation(p1Visual.eyeJitter || 1, p2Visual.eyeJitter || 1, 0.3, 0.15),
                blinkRate: inheritWithMutation(p1Visual.blinkRate || 1, p2Visual.blinkRate || 1, 0.2, 0.1),
                lineWidth: Math.round(inheritWithMutation(p1Visual.lineWidth || 2, p2Visual.lineWidth || 2, 0.25, 0.2))
            };

            // ═══ HERANÇA DE ESCALA ═══
            const p1Stats = parent1.aiData?.stats || {};
            const p2Stats = parent2.aiData?.stats || {};
            
            const sX1 = p1Stats.scaleX ?? parseFloat(p1Stats.scale) ?? 1;
            const sY1 = p1Stats.scaleY ?? parseFloat(p1Stats.scale) ?? 1;
            const sX2 = p2Stats.scaleX ?? parseFloat(p2Stats.scale) ?? 1;
            const sY2 = p2Stats.scaleY ?? parseFloat(p2Stats.scale) ?? 1;

            const newScaleX = Math.max(0.4, Math.min(2.0, inheritWithMutation(sX1, sX2, 0.4, 0.15)));
            const newScaleY = Math.max(0.4, Math.min(2.0, inheritWithMutation(sY1, sY2, 0.4, 0.15)));

            const geoStats = calculateGeoStats(childFormaData.id, newScaleX, newScaleY, childFormaData.params);

            // ═══ HERANÇA DE ATRIBUTOS (com mutação ±10%) ═══
            // Anomalias têm atributos extremos mas instáveis
            const hybridBonus = isAnomaly ? 1.0 : 1.1; // Vigor híbrido normal
            const anomalyMultiplier = isAnomaly ? (1.5 + Math.random() * 0.5) : 1.0; // Anomalias são 1.5-2x mais fortes
            const lifespanPenalty = isAnomaly ? (0.3 + stability * 0.4) : 1.0; // Anomalias vivem menos (30-70% do normal)
            
            const childStats = {
                forca: Math.floor(inheritWithMutation(p1Stats.forca || 10, p2Stats.forca || 10, 0.3, 0.1) * hybridBonus * anomalyMultiplier),
                resistencia: Math.floor(inheritWithMutation(p1Stats.resistencia || 10, p2Stats.resistencia || 10, 0.3, 0.1) * hybridBonus * (isAnomaly ? 0.7 : 1)), // Anomalias são frágeis
                energia: Math.floor(inheritWithMutation(p1Stats.energia || 20, p2Stats.energia || 20, 0.3, 0.1) * anomalyMultiplier),
                lifespan: inheritWithMutation(p1Stats.maxLifespan || 30000, p2Stats.maxLifespan || 30000, 0.2, 0.1) * lifespanPenalty,
                scaleX: newScaleX,
                scaleY: newScaleY,
                scale: ((newScaleX + newScaleY) / 2).toFixed(2),
                stability: Math.round(stability * 100), // % de estabilidade
                ...geoStats
            };

            // ═══ METADADOS DE ALQUIMIA ═══
            const alchemyMeta = {
                isAnomaly,
                stability,
                recipe: `${shape1} × ${shape2}`,
                family1: getShapeFamily(shape1),
                family2: getShapeFamily(shape2),
                glitchIntensity: childFormaData.params?.glitchIntensity || 0
            };

            resolve({
                id: generateGolemId(),
                forma: childFormaData,
                biologia: childFormaData,
                quimica: inheritedChemistry,
                fisica: inheritedPhysics,
                visualDNA: childVisualDNA,
                alchemyMeta, // Novo: dados de alquimia para efeitos visuais
                aiData: {
                    name: childFormaData.name,
                    description: isAnomaly 
                        ? `⚠️ ${childFormaData.desc}` 
                        : `Fusão alquímica: ${shape1} × ${shape2}.`,
                    stats: { ...childStats, maxLifespan: childStats.lifespan },
                    dialogo: isAnomaly ? "E̷͓̍r̵̰̈́r̶͚͝o̸̱͑.̷̣̓.̶͖͝.̵̜̌ ̵̰̈́S̵̰̈́i̶͚͝s̸̱͑ṭ̷̓e̶͖͝m̵̜̌ä̵̰́" : "Herança confirmada."
                }
            });
        }, 500);
    });
}