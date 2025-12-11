// ═══════════════════════════════════════════════════════════════════
// GEOMETRY MATH MODULE - Cálculos Precisos de Área e Perímetro
// Autor: Matemático Computacional AI
// ═══════════════════════════════════════════════════════════════════

/**
 * CONSTANTES GEOMÉTRICAS COMPARTILHADAS
 * Usadas tanto para renderização (Golem.js) quanto para cálculo
 */
export const GEOMETRY_CONSTANTS = {
    // Base radius para formas circulares
    BASE_RADIUS: 25,
    
    // Dimensões do quadrado base
    SQUARE_SIDE: 44,
    
    // Dimensões do triângulo
    TRIANGLE_HEIGHT: 46, // De -28 a +18
    TRIANGLE_BASE: 48,   // De -24 a +24
    
    // Polígonos regulares
    POLYGON_RADIUS: 26,
    
    // Losango
    LOSANGO_DIAG_MAIOR: 60,  // De -30 a +30 (vertical)
    LOSANGO_DIAG_MENOR: 40,  // De -20 a +20 (horizontal)
    
    // Cruz
    CRUZ_ARM_LENGTH: 24,
    CRUZ_ARM_WIDTH: 16,
    
    // Cilindro (2.5D)
    CILINDRO_WIDTH: 40,
    CILINDRO_HEIGHT: 50,
    CILINDRO_ELLIPSE_A: 20,
    CILINDRO_ELLIPSE_B: 7.5,
    
    // Cone (2.5D)
    CONE_HEIGHT: 60,
    CONE_BASE_A: 25,
    CONE_BASE_B: 7.5,
    
    // Cápsula
    CAPSULA_RADIUS: 18,
    CAPSULA_HEIGHT: 40,  // Distância entre centros das semicírculos
    
    // Domo
    DOMO_RADIUS: 28,
    DOMO_BASE_WIDTH: 56,
    DOMO_BASE_HEIGHT: 15,
    
    // Monólito
    MONOLITO_WIDTH: 24,
    MONOLITO_HEIGHT: 90,
    MONOLITO_TIP_HEIGHT: 10,
    
    // Obelisco
    OBELISCO_WIDTH: 30,
    OBELISCO_HEIGHT: 80,
    OBELISCO_TIP_HEIGHT: 15,
    
    // Tesseract (cubo 4D projetado)
    TESSERACT_OUTER: 50,
    TESSERACT_INNER: 30,
    
    // Estrela
    ESTRELA_OUTER_R: 28,
    ESTRELA_INNER_R: 12,
    ESTRELA_POINTS: 5,
    
    // Esfera (círculo com meridianos)
    ESFERA_RADIUS: 28,
    
    // Mira (crosshair)
    MIRA_RADIUS: 25,
    MIRA_CROSSHAIR_LENGTH: 35,
    
    // Cristal
    CRISTAL_DIAG_MAIOR: 80,
    CRISTAL_DIAG_MENOR: 40,
    
    // Olho
    OLHO_WIDTH: 60,
    OLHO_HEIGHT: 25,
    OLHO_IRIS_R: 12,
    OLHO_PUPIL_R: 5,
    
    // Pirâmide (losango 3D)
    PIRAMIDE_WIDTH: 60,
    PIRAMIDE_HEIGHT: 70,
    
    // Fractal (triângulo de Sierpinski básico)
    FRACTAL_OUTER_HEIGHT: 60,
    FRACTAL_OUTER_BASE: 60,
    
    // DLC: Exotic Matter - Espiral de Fibonacci/Arquimedes
    ESPIRAL_TURNS: 3,           // Número de voltas
    ESPIRAL_GROWTH_RATE: 5,     // Taxa de crescimento (a) na equação r = a*θ
    ESPIRAL_START_RADIUS: 3,    // Raio inicial
    ESPIRAL_MAX_RADIUS: 30      // Raio máximo para cálculo de área bounding
};

// Alias para acesso rápido
const C = GEOMETRY_CONSTANTS;

/**
 * Aproximação de Ramanujan para perímetro de elipse
 * P ≈ π(a+b)(1 + 3h/(10 + √(4-3h)))  onde h = ((a-b)/(a+b))²
 */
function ellipsePerimeter(a, b) {
    if (a === b) return 2 * Math.PI * a; // Círculo
    const h = Math.pow((a - b) / (a + b), 2);
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

/**
 * Área de elipse: A = πab
 */
function ellipseArea(a, b) {
    return Math.PI * a * b;
}

/**
 * Área de polígono regular: A = (n × s² × cot(π/n)) / 4
 * ou A = (1/2) × n × r² × sin(2π/n)
 */
function regularPolygonArea(sides, radius) {
    return 0.5 * sides * radius * radius * Math.sin((2 * Math.PI) / sides);
}

/**
 * Perímetro de polígono regular: P = n × 2r × sin(π/n)
 */
function regularPolygonPerimeter(sides, radius) {
    return sides * 2 * radius * Math.sin(Math.PI / sides);
}

/**
 * Área de estrela de n pontas
 * Calculada como: n triângulos externos + n triângulos internos
 */
function starArea(points, outerR, innerR) {
    // Cada "ponta" é um triângulo isósceles
    // Área total = n × (área do triângulo grande - área do triângulo pequeno)
    const angleStep = Math.PI / points;
    
    // Triângulo formado por: centro, ponta externa, ponto interno
    // Usando fórmula: A = 0.5 * base * altura
    // Base = distância entre dois pontos internos consecutivos
    // Altura = distância do centro à ponta
    
    // Simplificação: soma das áreas dos triângulos
    let area = 0;
    for (let i = 0; i < points * 2; i++) {
        const r1 = i % 2 === 0 ? outerR : innerR;
        const r2 = (i + 1) % 2 === 0 ? outerR : innerR;
        const angle = angleStep;
        // Área do triângulo com dois lados r1, r2 e ângulo entre eles
        area += 0.5 * r1 * r2 * Math.sin(angle);
    }
    return area;
}

/**
 * Perímetro de estrela
 */
function starPerimeter(points, outerR, innerR) {
    // Distância entre ponto externo e interno adjacente
    const angleStep = Math.PI / points;
    const segmentLength = Math.sqrt(
        outerR * outerR + innerR * innerR - 
        2 * outerR * innerR * Math.cos(angleStep)
    );
    return points * 2 * segmentLength;
}

// ═══════════════════════════════════════════════════════════════════
// CALCULADORAS POR FORMA
// ═══════════════════════════════════════════════════════════════════

const SHAPE_CALCULATORS = {
    
    // ═══ FORMAS BÁSICAS ═══
    
    circulo: (scaleX, scaleY) => {
        const rX = C.BASE_RADIUS * scaleX;
        const rY = C.BASE_RADIUS * scaleY;
        const isCircle = Math.abs(scaleX - scaleY) < 0.01;
        
        return {
            area: ellipseArea(rX, rY),
            perimeter: ellipsePerimeter(rX, rY),
            formula: isCircle 
                ? `A = πr² = π×${rX.toFixed(1)}² | P = 2πr = 2π×${rX.toFixed(1)}`
                : `A = πab = π×${rX.toFixed(1)}×${rY.toFixed(1)} | P ≈ π(a+b)[1+3h/(10+√(4-3h))]`,
            description: isCircle ? 'Círculo Perfeito' : 'Elipse'
        };
    },
    
    quadrado: (scaleX, scaleY) => {
        const w = C.SQUARE_SIDE * scaleX;
        const h = C.SQUARE_SIDE * scaleY;
        const isSquare = Math.abs(scaleX - scaleY) < 0.01;
        
        return {
            area: w * h,
            perimeter: 2 * (w + h),
            formula: isSquare 
                ? `A = s² = ${w.toFixed(1)}² | P = 4s = 4×${w.toFixed(1)}`
                : `A = w×h = ${w.toFixed(1)}×${h.toFixed(1)} | P = 2(w+h)`,
            description: isSquare ? 'Quadrado Perfeito' : 'Retângulo'
        };
    },
    
    triangulo: (scaleX, scaleY) => {
        const base = C.TRIANGLE_BASE * scaleX;
        const height = C.TRIANGLE_HEIGHT * scaleY;
        // Triângulo isósceles: lados = √((base/2)² + h²)
        const side = Math.sqrt((base / 2) ** 2 + height ** 2);
        
        return {
            area: 0.5 * base * height,
            perimeter: base + 2 * side,
            formula: `A = ½bh = ½×${base.toFixed(1)}×${height.toFixed(1)} | P = b + 2s`,
            description: 'Triângulo Isósceles'
        };
    },
    
    losango: (scaleX, scaleY) => {
        const d1 = C.LOSANGO_DIAG_MAIOR * scaleY; // Diagonal maior (vertical)
        const d2 = C.LOSANGO_DIAG_MENOR * scaleX; // Diagonal menor (horizontal)
        // Lado = √((d1/2)² + (d2/2)²)
        const side = Math.sqrt((d1 / 2) ** 2 + (d2 / 2) ** 2);
        
        return {
            area: (d1 * d2) / 2,
            perimeter: 4 * side,
            formula: `A = (d₁×d₂)/2 = (${d1.toFixed(1)}×${d2.toFixed(1)})/2 | P = 4×√((d₁/2)²+(d₂/2)²)`,
            description: 'Losango (Rhombus)'
        };
    },
    
    pentagono: (scaleX, scaleY) => {
        const r = C.POLYGON_RADIUS * ((scaleX + scaleY) / 2);
        return {
            area: regularPolygonArea(5, r),
            perimeter: regularPolygonPerimeter(5, r),
            formula: `A = (5r²sin(72°))/2 | P = 5×2r×sin(36°)`,
            description: 'Pentágono Regular'
        };
    },
    
    hexagono: (scaleX, scaleY) => {
        const r = C.POLYGON_RADIUS * ((scaleX + scaleY) / 2);
        return {
            area: regularPolygonArea(6, r),
            perimeter: regularPolygonPerimeter(6, r),
            formula: `A = (3√3/2)r² ≈ 2.598r² | P = 6r`,
            description: 'Hexágono Regular'
        };
    },
    
    cruz: (scaleX, scaleY) => {
        // Cruz = 5 quadrados sobrepostos (formato +)
        // Área = 5 × (armWidth × armWidth) - 4 × cantos sobrepostos
        // Simplificado: 2 retângulos cruzados
        const armLen = C.CRUZ_ARM_LENGTH * ((scaleX + scaleY) / 2);
        const armWid = C.CRUZ_ARM_WIDTH * ((scaleX + scaleY) / 2);
        const fullLen = 2 * armLen; // Comprimento total de cada braço
        
        // Área = 2 retângulos - quadrado central (contado duas vezes)
        const area = 2 * (fullLen * armWid) - (armWid * armWid);
        // Perímetro = contorno externo (12 segmentos)
        const perimeter = 4 * fullLen + 8 * ((armLen - armWid / 2));
        
        return {
            area,
            perimeter,
            formula: `A = 2(L×w) - w² | P = 12 segmentos`,
            description: 'Cruz Geométrica'
        };
    },
    
    // ═══ FORMAS 3D (PROJEÇÕES 2D) ═══
    
    cilindro: (scaleX, scaleY) => {
        // Cilindro em vista frontal: retângulo + 2 elipses (topos)
        const w = C.CILINDRO_WIDTH * scaleX;
        const h = C.CILINDRO_HEIGHT * scaleY;
        const ellipseA = C.CILINDRO_ELLIPSE_A * scaleX;
        const ellipseB = C.CILINDRO_ELLIPSE_B * scaleY;
        
        // Área projetada = retângulo + 2 elipses
        const rectArea = w * h;
        const ellArea = 2 * ellipseArea(ellipseA, ellipseB);
        
        // Perímetro visível = 2 linhas laterais + 2 elipses
        const perim = 2 * h + 2 * ellipsePerimeter(ellipseA, ellipseB);
        
        return {
            area: rectArea + ellArea,
            perimeter: perim,
            formula: `A = w×h + 2πab | P = 2h + 2×P_elipse`,
            description: 'Cilindro (Projeção Frontal)'
        };
    },
    
    cone: (scaleX, scaleY) => {
        // Cone em vista frontal: triângulo + elipse na base
        const h = C.CONE_HEIGHT * scaleY;
        const baseA = C.CONE_BASE_A * scaleX;
        const baseB = C.CONE_BASE_B * scaleY;
        const baseWidth = 2 * baseA;
        
        // Triângulo lateral (isósceles)
        const triArea = 0.5 * baseWidth * h;
        // Elipse da base
        const ellArea = ellipseArea(baseA, baseB);
        
        // Geratriz (lado do triângulo)
        const slant = Math.sqrt((baseWidth / 2) ** 2 + h ** 2);
        const perim = 2 * slant + ellipsePerimeter(baseA, baseB);
        
        return {
            area: triArea + ellArea,
            perimeter: perim,
            formula: `A = ½bh + πab | P = 2g + P_elipse (g = geratriz)`,
            description: 'Cone (Projeção Frontal)'
        };
    },
    
    piramide: (scaleX, scaleY) => {
        // Pirâmide vista de cima: losango com linhas para o centro
        const w = C.PIRAMIDE_WIDTH * scaleX;
        const h = C.PIRAMIDE_HEIGHT * scaleY;
        
        // Área = 2 triângulos (visão frontal de pirâmide quadrada)
        const area = (w * h) / 2;
        
        // Perímetro = 4 arestas visíveis
        const edge = Math.sqrt((w / 2) ** 2 + (h / 2) ** 2);
        const perim = 4 * edge + w; // Base + 2 arestas laterais duplas
        
        return {
            area,
            perimeter: perim,
            formula: `A = (d₁×d₂)/2 | P = 4×aresta`,
            description: 'Pirâmide (Vista Isométrica)'
        };
    },
    
    capsula: (scaleX, scaleY) => {
        // Cápsula = Retângulo + 2 semicírculos
        const r = C.CAPSULA_RADIUS * scaleX;
        const h = C.CAPSULA_HEIGHT * scaleY;
        
        // Área = retângulo central + círculo completo (2 semicírculos)
        const rectArea = 2 * r * h;
        const circleArea = Math.PI * r * r;
        
        // Perímetro = 2 linhas retas + circunferência completa
        const perim = 2 * h + 2 * Math.PI * r;
        
        return {
            area: rectArea + circleArea,
            perimeter: perim,
            formula: `A = 2rh + πr² | P = 2h + 2πr`,
            description: 'Cápsula (Stadium Shape)'
        };
    },
    
    domo: (scaleX, scaleY) => {
        // Domo = Semicírculo + Retângulo de base
        const r = C.DOMO_RADIUS * ((scaleX + scaleY) / 2);
        const baseW = C.DOMO_BASE_WIDTH * scaleX;
        const baseH = C.DOMO_BASE_HEIGHT * scaleY;
        
        // Área = semicírculo + retângulo de base
        const semiArea = (Math.PI * r * r) / 2;
        const baseArea = baseW * baseH;
        
        // Perímetro = semicircunferência + base
        const perim = Math.PI * r + baseW + 2 * baseH;
        
        return {
            area: semiArea + baseArea,
            perimeter: perim,
            formula: `A = πr²/2 + w×h | P = πr + w + 2h`,
            description: 'Domo (Semi-Esfera + Base)'
        };
    },
    
    monolito: (scaleX, scaleY) => {
        // Monólito = Retângulo alto + triângulo no topo
        const w = C.MONOLITO_WIDTH * scaleX;
        const h = C.MONOLITO_HEIGHT * scaleY;
        const tipH = C.MONOLITO_TIP_HEIGHT * scaleY;
        
        const rectArea = w * h;
        const tipArea = (w * tipH) / 2;
        
        // Perímetro com topo chanfrado
        const tipSide = Math.sqrt((w / 2) ** 2 + tipH ** 2);
        const perim = 2 * h + w + 2 * tipSide;
        
        return {
            area: rectArea + tipArea,
            perimeter: perim,
            formula: `A = w×h + ½w×t | P = 2h + w + 2×lado_topo`,
            description: 'Monólito (Obelisco Maciço)'
        };
    },
    
    obelisco: (scaleX, scaleY) => {
        // Obelisco = Retângulo + Pirâmide no topo
        const w = C.OBELISCO_WIDTH * scaleX;
        const h = C.OBELISCO_HEIGHT * scaleY;
        const tipH = C.OBELISCO_TIP_HEIGHT * scaleY;
        
        const rectArea = w * h;
        const tipArea = (w * tipH) / 2;
        
        const tipSide = Math.sqrt((w / 2) ** 2 + tipH ** 2);
        const perim = 2 * h + w + 2 * tipSide;
        
        return {
            area: rectArea + tipArea,
            perimeter: perim,
            formula: `A = w×h + ½w×t | P = contorno total`,
            description: 'Obelisco (Torre Piramidal)'
        };
    },
    
    tesseract: (scaleX, scaleY) => {
        // Tesseract = 2 quadrados concêntricos + 4 linhas de conexão
        const outer = C.TESSERACT_OUTER * ((scaleX + scaleY) / 2);
        const inner = C.TESSERACT_INNER * ((scaleX + scaleY) / 2);
        
        // Área = quadrado externo (o interno é "dentro")
        // Para visualização, consideramos a área do anel entre eles
        const outerArea = outer * outer;
        const innerArea = inner * inner;
        
        // Perímetro = 2 quadrados + 4 diagonais de conexão
        const diagonal = Math.sqrt(2) * (outer - inner) / 2;
        const perim = 4 * outer + 4 * inner + 4 * diagonal;
        
        return {
            area: outerArea, // Área total ocupada
            perimeter: perim,
            formula: `A = s²_externo = ${outer.toFixed(1)}² | P = 8s + 4d`,
            description: 'Tesseract (Hipercubo 4D Projetado)'
        };
    },
    
    estrela: (scaleX, scaleY) => {
        const avgScale = (scaleX + scaleY) / 2;
        const outerR = C.ESTRELA_OUTER_R * avgScale;
        const innerR = C.ESTRELA_INNER_R * avgScale;
        
        return {
            area: starArea(C.ESTRELA_POINTS, outerR, innerR),
            perimeter: starPerimeter(C.ESTRELA_POINTS, outerR, innerR),
            formula: `A = Σ(½r₁r₂sin(θ)) | P = 10×segmento`,
            description: 'Estrela de 5 Pontas'
        };
    },
    
    esfera: (scaleX, scaleY) => {
        // Esfera em 2D = Círculo com meridianos (visual)
        // Geometricamente, projeção = círculo
        const r = C.ESFERA_RADIUS * ((scaleX + scaleY) / 2);
        
        return {
            area: Math.PI * r * r,
            perimeter: 2 * Math.PI * r,
            formula: `A = πr² = π×${r.toFixed(1)}² | P = 2πr`,
            description: 'Esfera (Projeção Circular)'
        };
    },
    
    mira: (scaleX, scaleY) => {
        // Mira = Círculo + Cruz interna
        const r = C.MIRA_RADIUS * ((scaleX + scaleY) / 2);
        const crossLen = C.MIRA_CROSSHAIR_LENGTH * ((scaleX + scaleY) / 2);
        
        // Área = apenas o círculo (linhas não adicionam área)
        const area = Math.PI * r * r;
        // Perímetro = circunferência + 4 braços da cruz
        const perim = 2 * Math.PI * r + 4 * crossLen;
        
        return {
            area,
            perimeter: perim,
            formula: `A = πr² | P = 2πr + 4×braço`,
            description: 'Mira (Círculo com Retícula)'
        };
    },
    
    cristal: (scaleX, scaleY) => {
        // Cristal = Losango com linhas internas
        const d1 = C.CRISTAL_DIAG_MAIOR * scaleY;
        const d2 = C.CRISTAL_DIAG_MENOR * scaleX;
        const side = Math.sqrt((d1 / 2) ** 2 + (d2 / 2) ** 2);
        
        return {
            area: (d1 * d2) / 2,
            perimeter: 4 * side,
            formula: `A = (d₁×d₂)/2 | P = 4×√((d₁/2)²+(d₂/2)²)`,
            description: 'Cristal (Losango Refratário)'
        };
    },
    
    olho: (scaleX, scaleY) => {
        // Olho = Forma de amêndoa (2 arcos) + círculos internos
        const w = C.OLHO_WIDTH * scaleX;
        const h = C.OLHO_HEIGHT * scaleY;
        const irisR = C.OLHO_IRIS_R * ((scaleX + scaleY) / 2);
        const pupilR = C.OLHO_PUPIL_R * ((scaleX + scaleY) / 2);
        
        // Área da amêndoa ≈ 2/3 da área da elipse circunscrita
        const almondArea = (2 / 3) * Math.PI * (w / 2) * (h / 2);
        // Íris e pupila já estão "dentro"
        
        // Perímetro ≈ 2 arcos de parábola
        const perim = 2 * Math.sqrt(2) * Math.sqrt((w / 2) ** 2 + (h / 2) ** 2) * 1.5;
        
        return {
            area: almondArea,
            perimeter: perim,
            formula: `A ≈ (2/3)πab | P ≈ 2×arco_curvo`,
            description: 'Olho (Forma de Amêndoa)'
        };
    },
    
    fractal: (scaleX, scaleY) => {
        // Fractal de Sierpinski (nível 1): Triângulo grande - triângulo central
        const base = C.FRACTAL_OUTER_BASE * scaleX;
        const h = C.FRACTAL_OUTER_HEIGHT * scaleY;
        
        // Triângulo externo
        const outerArea = 0.5 * base * h;
        // Triângulo central removido (1/4 da área)
        const innerArea = outerArea / 4;
        // Área líquida (3/4 do original)
        const area = outerArea - innerArea;
        
        // Perímetro = triângulo externo + triângulo interno
        const outerSide = Math.sqrt((base / 2) ** 2 + h ** 2);
        const innerSide = outerSide / 2;
        const perim = base + 2 * outerSide + 3 * innerSide;
        
        return {
            area,
            perimeter: perim,
            formula: `A = ¾×(½bh) = ¾×A_triângulo | P = P_ext + P_int`,
            description: 'Fractal de Sierpinski (N1)'
        };
    },
    
    // ═══ DLC: EXOTIC MATTER - ESPIRAL ═══
    espiral: (scaleX, scaleY) => {
        // Espiral de Arquimedes: r = a + b*θ
        // Onde a = raio inicial, b = taxa de crescimento
        const avgScale = (scaleX + scaleY) / 2;
        const a = C.ESPIRAL_START_RADIUS * avgScale;
        const b = C.ESPIRAL_GROWTH_RATE * avgScale;
        const turns = C.ESPIRAL_TURNS;
        const thetaMax = turns * 2 * Math.PI;
        
        // Comprimento do arco (integral numérica):
        // L = ∫₀^θmax √(r² + (dr/dθ)²) dθ
        // Para r = a + b*θ: dr/dθ = b
        // L = ∫₀^θmax √((a + b*θ)² + b²) dθ
        let arcLength = 0;
        const steps = 100;
        const dTheta = thetaMax / steps;
        
        for (let i = 0; i < steps; i++) {
            const theta = i * dTheta;
            const r = a + b * theta;
            const drdt = b;
            const ds = Math.sqrt(r * r + drdt * drdt) * dTheta;
            arcLength += ds;
        }
        
        // Área aproximada: círculo circunscrito com raio máximo
        // Área exata da espiral de Arquimedes: A = (1/6)b*θ³ + (1/2)a*θ² (integração)
        const rMax = a + b * thetaMax;
        const exactArea = (b * Math.pow(thetaMax, 3)) / 6 + (a * Math.pow(thetaMax, 2)) / 2;
        
        // Ajuste: a área "visual" é mais próxima do círculo inscrito
        const boundingArea = Math.PI * rMax * rMax;
        const area = Math.min(exactArea * 0.4, boundingArea * 0.6); // Fator de correção visual
        
        return {
            area,
            perimeter: arcLength,
            formula: `L = ∫√(r² + (dr/dθ)²)dθ | A ≈ πr²_max × 0.6`,
            description: `Espiral de Arquimedes (${turns} voltas)`
        };
    },
    
    anomaly: (scaleX, scaleY, proceduralParams) => {
        // Anomalia = Polígono irregular procedural
        const avgScale = (scaleX + scaleY) / 2;
        const baseRadius = 28 * avgScale;
        const sides = proceduralParams?.sides || 7;
        const roughness = proceduralParams?.roughness || 0.3;
        
        // Área aproximada (polígono regular com variação)
        const baseArea = regularPolygonArea(sides, baseRadius);
        // Roughness reduz área efetiva ligeiramente
        const area = baseArea * (1 - roughness * 0.2);
        
        // Perímetro aumenta com roughness
        const basePerim = regularPolygonPerimeter(sides, baseRadius);
        const perim = basePerim * (1 + roughness * 0.5);
        
        return {
            area,
            perimeter: perim,
            formula: `A ≈ Polígono_${sides} × (1 - ξ) | P ≈ P_base × (1 + ξ)`,
            description: `Anomalia (${sides} lados, ξ=${(roughness * 100).toFixed(0)}%)`
        };
    }
};

// ═══════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE CÁLCULO
// ═══════════════════════════════════════════════════════════════════

/**
 * Calcula área e perímetro precisos para qualquer forma do jogo
 * 
 * @param {string} shapeId - Identificador da forma (ex: 'circulo', 'tesseract')
 * @param {number} scaleX - Escala horizontal (1.0 = tamanho base)
 * @param {number} scaleY - Escala vertical (1.0 = tamanho base)
 * @param {Object} proceduralParams - Parâmetros para formas procedurais (anomaly)
 * @returns {Object} { area: number, perimeter: number, formula: string, description: string }
 */
export function calculateGeometry(shapeId, scaleX = 1, scaleY = 1, proceduralParams = null) {
    const calculator = SHAPE_CALCULATORS[shapeId];
    
    if (!calculator) {
        // Fallback para formas desconhecidas: usa quadrado
        console.warn(`[GeometryMath] Forma desconhecida: ${shapeId}, usando fallback quadrado`);
        const fallback = SHAPE_CALCULATORS.quadrado(scaleX, scaleY);
        fallback.description = `Forma Desconhecida (${shapeId})`;
        return {
            ...fallback,
            areaFormatted: formatNumber(fallback.area) + ' px²',
            perimeterFormatted: formatNumber(fallback.perimeter) + ' px'
        };
    }
    
    const result = calculator(scaleX, scaleY, proceduralParams);
    
    return {
        ...result,
        areaFormatted: formatNumber(result.area) + ' px²',
        perimeterFormatted: formatNumber(result.perimeter) + ' px'
    };
}

/**
 * Calcula a "Força" baseada na área real
 * Força é proporcional à raiz quadrada da área (para balanceamento)
 */
export function calculateStrengthFromArea(area, baseStrength = 10) {
    // Área de referência (círculo base sem escala)
    const referenceArea = Math.PI * C.BASE_RADIUS * C.BASE_RADIUS; // ~1963 px²
    
    // Força = base × √(área / área_referência)
    const areaFactor = Math.sqrt(area / referenceArea);
    
    return Math.floor(baseStrength * areaFactor);
}

/**
 * Formata número com precisão adequada
 */
function formatNumber(num) {
    if (num >= 10000) return Math.round(num).toLocaleString('pt-BR');
    if (num >= 100) return Math.round(num).toString();
    if (num >= 10) return num.toFixed(1);
    return num.toFixed(2);
}

/**
 * Retorna todas as constantes para debug/UI
 */
export function getConstants() {
    return { ...GEOMETRY_CONSTANTS };
}

/**
 * Lista todas as formas suportadas
 */
export function getSupportedShapes() {
    return Object.keys(SHAPE_CALCULATORS);
}
