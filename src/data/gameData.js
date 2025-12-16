export const ELEMENTS = {
    // FORMA (Geometria Sagrada)
    // ═══════════════════════════════════════════════════════════════════
    // PRIMORDIAIS: Formas bases visíveis no menu de seleção
    // ═══════════════════════════════════════════════════════════════════
    forma: [
        { id: 'circulo', name: 'Circular', desc: 'Geometria sem arestas. Estável e fluido.' },
        { id: 'quadrado', name: 'Quadrangular', desc: 'Quatro vértices rígidos. Alta defesa.' },
        { id: 'triangulo', name: 'Triangular', desc: 'Três vértices agudos. Alta velocidade.' }
    ],

    // ═══════════════════════════════════════════════════════════════════
    // EVOLUÍDAS: Formas desbloqueáveis via Alquimia (não aparecem no menu inicial)
    // ═══════════════════════════════════════════════════════════════════
    formaEvoluida: [
        // Formas 3D simples (síntese de primordiais)
        { id: 'cilindro', name: 'Cilíndrica', desc: 'Fusão Circular + Quadrada. Estabilidade rotacional.' },
        { id: 'cone', name: 'Cônica', desc: 'Fusão Circular + Triangular. Velocidade focada.' },
        { id: 'piramide', name: 'Piramidal', desc: 'Fusão Quadrada + Triangular. Poder concentrado.' },
        { id: 'esfera', name: 'Esférica', desc: 'Evolução Circular. Simetria perfeita em 3D.' },
        { id: 'tesseract', name: 'Tesserato', desc: 'Evolução Quadrada. Dimensão além do visível.' },

        // Formas avançadas (sínteses múltiplas)
        { id: 'pentagono', name: 'Pentagonal', desc: 'Harmonia de 5 eixos. Equilíbrio raro.' },
        { id: 'hexagono', name: 'Hexagonal', desc: 'Estrutura de colmeia. Eficiência suprema.' },
        { id: 'cruz', name: 'Ortogonal', desc: 'Intersecção de eixos. Poder distribuído.' },
        { id: 'estrela', name: 'Estelar', desc: 'Radiação geométrica. Energia expansiva.' },
        
        // Formas exóticas (descobertas raras)
        { id: 'capsula', name: 'Cápsula', desc: 'Híbrido Esfera-Cilindro. Contenção perfeita.' },
        { id: 'domo', name: 'Domo', desc: 'Semi-esfera cristalizada. Proteção arqueada.' },
        { id: 'obelisco', name: 'Obelisco', desc: 'Torre de puro poder geométrico.' },
        { id: 'monolito', name: 'Monólito', desc: 'Bloco primário dimensional. Peso infinito.' },
        { id: 'cristal', name: 'Cristal', desc: 'Estrutura angular perfeita. Refratividade pura.' },
        { id: 'fractal', name: 'Fractal', desc: 'Padrão auto-replicante. Complexidade infinita.' },
        
        // Formas de erro (anomalias dimensionais)
        { id: 'espiral', name: 'Espiral', desc: 'Crescimento logarítmico áureo. Curva do caos.' }
    ],

    // ESTRUTURA (Material da Borda)
    quimica: [
        { id: 'carbono', name: 'Carbono', desc: 'Polímero base flexível.' },
        { id: 'ferro', name: 'Ferro', desc: 'Liga metálica pesada.' },
        { id: 'silicio', name: 'Silício', desc: 'Cristal lógico translúcido.' },
        { id: 'ouro', name: 'Ouro', desc: 'Condutor nobre.' },
        { id: 'cristal', name: 'Cristal', desc: 'Estrutura vítrea refrativa.' }, // NOVO
        { id: 'mercurio', name: 'Mercúrio', desc: 'Metal líquido instável.' }, // NOVO
        { id: 'bismuto', name: 'Bismuto', desc: 'Cristalização geométrica iridescente.' } // DLC: Exotic Matter
    ],

    // ENERGIA (Cor do Neon)
    fisica: [
        { id: 'eletricidade', name: 'Eletricidade', desc: 'Alta voltagem vibrante.' },
        { id: 'calor', name: 'Termodinâmica', desc: 'Agitação molecular.' },
        { id: 'radiacao', name: 'Radiação', desc: 'Decaimento instável.' },
        { id: 'gravidade', name: 'Gravidade', desc: 'Singularidade densa.' },
        { id: 'luz', name: 'Fotônica', desc: 'Luz sólida pura.' }, // NOVO
        { id: 'frio', name: 'Zero Absoluto', desc: 'Paralisia molecular.' }, // NOVO
        { id: 'magnetismo', name: 'Magnetismo', desc: 'Campos de atração polar.' }, // NOVO
        { id: 'entropia', name: 'Entropia', desc: 'Tendência inevitável à desordem.' }, // DLC: Exotic Matter
        { id: 'sonico', name: 'Sônico', desc: 'Ressonância de frequência pura.' } // DLC: Exotic Matter
    ]
};