export const ELEMENTS = {
    // ═══════════════════════════════════════════════════════════════════
    // MATRIZ GEOMÉTRICA (Topologia Fundamental)
    // Classificação por vértices, simetria e dimensionalidade
    // ═══════════════════════════════════════════════════════════════════
    forma: [
        { id: 'circulo', name: 'Circular', desc: 'Topologia sem vértices (n=∞). Simetria rotacional contínua. Taxa de rolamento: máxima.' },
        { id: 'quadrado', name: 'Quadrangular', desc: 'Polígono regular (n=4). Simetria D₄ com ângulos de 90°. Módulo de resistência: elevado.' },
        { id: 'triangulo', name: 'Triangular', desc: 'Polígono mínimo (n=3). Distribuição de força vetorial. Coeficiente aerodinâmico: otimizado.' }
    ],

    // ═══════════════════════════════════════════════════════════════════
    // FORMAS EVOLUÍDAS: Sínteses Geométricas Avançadas
    // Desbloqueio via combinação alquímica de matrizes primordiais
    // ═══════════════════════════════════════════════════════════════════
    formaEvoluida: [
        // Extrusões Tridimensionais (Síntese de Primordiais)
        { id: 'cilindro', name: 'Cilíndrica', desc: 'Extrusão linear de base circular. Momento de inércia: I = ½mr². Estabilidade giroscópica.' },
        { id: 'cone', name: 'Cônica', desc: 'Revolução de triângulo retângulo. Centro de massa deslocado. Penetração balística otimizada.' },
        { id: 'piramide', name: 'Piramidal', desc: 'Convergência tetraédrica. Volume = ⅓Ah. Focalização de energia no apex.' },
        { id: 'esfera', name: 'Esférica', desc: 'Revolução circular completa. Superfície mínima para volume máximo. Isotropia perfeita.' },
        { id: 'tesseract', name: 'Tesserato', desc: 'Hipercubo 4D projetado em 3D. 8 células cúbicas. Desdobramento dimensional detectado.' },

        // Polígonos Complexos (Sínteses Múltiplas)
        { id: 'pentagono', name: 'Pentagonal', desc: 'Polígono regular (n=5). Proporção áurea intrínseca (φ=1.618). Harmonia quase-cristalina.' },
        { id: 'hexagono', name: 'Hexagonal', desc: 'Tesselação perfeita. Eficiência de empacotamento: 90.69%. Estrutura de grafeno.' },
        { id: 'cruz', name: 'Ortogonal', desc: 'Intersecção de eixos cartesianos. Distribuição cruciforme de tensão. Alcance: 4 vetores.' },
        { id: 'estrela', name: 'Estelar', desc: 'Polígono estrelado auto-intersectante. Radiação geométrica em n pontas. Expansão omnidirecional.' },
        
        // Geometrias Híbridas (Descobertas Raras)
        { id: 'capsula', name: 'Cápsula', desc: 'Cilindro com terminais hemisféricos. Contenção de pressão otimizada. Uso farmacêutico padrão.' },
        { id: 'domo', name: 'Domo', desc: 'Semi-esfera geodésica. Distribuição de carga estrutural máxima. Blindagem arqueada.' },
        { id: 'obelisco', name: 'Obelisco', desc: 'Prisma quadrangular cônico. Razão altura/base > 10:1. Monumento de poder vertical.' },
        { id: 'monolito', name: 'Monólito', desc: 'Paralelepípedo de proporção 1:4:9. Ressonância primordial. Origem: [DADOS CORROMPIDOS].' },
        { id: 'cristal', name: 'Cristal', desc: 'Estrutura anisotrópica poliédrica. Sistema cristalino hexagonal. Birrefringência ativa.' },
        { id: 'fractal', name: 'Fractal', desc: 'Padrão de Sierpiński recursivo. Dimensão de Hausdorff: 1.585. Iteração: ∞.' },
        
        // Anomalias Topológicas
        { id: 'espiral', name: 'Espiral', desc: 'Curva logarítmica de Fibonacci. Taxa de crescimento: φⁿ. Vórtice dimensional estável.' }
    ],

    // ═══════════════════════════════════════════════════════════════════
    // ESTRUTURA MOLECULAR (Composição Química)
    // Classificação por estrutura atômica e propriedades materiais
    // ═══════════════════════════════════════════════════════════════════
    quimica: [
        { 
            id: 'carbono', 
            name: 'Carbono', 
            desc: 'Polímero de cadeia longa (C-C). Alta plasticidade e base para vida orgânica. Hibridização sp³.',
            color: '#333333'
        },
        { 
            id: 'ferro', 
            name: 'Ferro', 
            desc: 'Liga ferrosa Fe-26 de alta densidade. Estrutura cristalina BCC (cúbica de corpo centrado). Blindagem pesada.',
            color: '#708090'
        },
        { 
            id: 'silicio', 
            name: 'Silício', 
            desc: 'Semicondutor Si-14 translúcido. Matriz de SiO₂ purificado para processamento lógico. Band gap: 1.12 eV.',
            color: '#4a6fa5'
        },
        { 
            id: 'ouro', 
            name: 'Ouro', 
            desc: 'Metal de transição nobre Au-79. Condutividade elétrica: 4.11×10⁷ S/m. Resistência à oxidação absoluta.',
            color: '#ffd700'
        },
        { 
            id: 'cristal', 
            name: 'Cristal', 
            desc: 'Quartzo piezoelétrico (SiO₂). Índice de refração: 1.544. Amplificação de ressonância harmônica ativa.',
            color: '#e0ffff'
        },
        { 
            id: 'mercurio', 
            name: 'Mercúrio', 
            desc: 'Amálgama líquido Hg-80 à temperatura ambiente (Tm: -38.83°C). Tensão superficial instável. ⚠️ TOXICIDADE ELEVADA.',
            color: '#c0c0c0'
        },
        { 
            id: 'bismuto', 
            name: 'Bismuto', 
            desc: 'Bi-83 com cristalização em funil iridescente. Diamagnetismo natural: χ = -1.66×10⁻⁴. Geometria fractal óxida.',
            color: '#ff69b4'
        }
    ],

    // ═══════════════════════════════════════════════════════════════════
    // NÚCLEO DE ENERGIA (Campo de Força Primário)
    // Classificação por tipo de partícula, radiação e temperatura
    // ⚠️ PROTOCOLOS DE CONTENÇÃO OBRIGATÓRIOS
    // ═══════════════════════════════════════════════════════════════════
    fisica: [
        { 
            id: 'eletricidade', 
            name: 'Eletricidade', 
            desc: 'Fluxo de elétrons de alta voltagem (>10kV). Potencial de ionização instável. Taxa de descarga: variável.',
            danger: 2
        },
        { 
            id: 'calor', 
            name: 'Termodinâmica', 
            desc: 'Agitação molecular exotérmica. Emissão infravermelha >1000°K. Risco de ignição espontânea.',
            danger: 2
        },
        { 
            id: 'radiacao', 
            name: 'Radiação', 
            desc: 'Decaimento isotópico instável. Emissão constante de partículas α/β/γ. ⚠️ CONTENÇÃO CLASSE-3 OBRIGATÓRIA.',
            danger: 4
        },
        { 
            id: 'gravidade', 
            name: 'Gravidade', 
            desc: 'Micro-singularidade contida (r < 10⁻¹⁵m). Distorção localizada do tecido espaço-tempo. Horizonte de eventos: estável.',
            danger: 5
        },
        { 
            id: 'luz', 
            name: 'Fotônica', 
            desc: 'Fótons em estado condensado. Coerência de fase laser (λ = 532nm). Luminescência pura: 10⁶ cd/m².',
            danger: 1
        },
        { 
            id: 'frio', 
            name: 'Zero Absoluto', 
            desc: 'Entropia térmica nula. Estado de condensado Bose-Einstein próximo a 0°K (T < 10⁻⁹ K). Superfluidez ativa.',
            danger: 3
        },
        { 
            id: 'magnetismo', 
            name: 'Magnetismo', 
            desc: 'Campo dipolar de alto fluxo (B > 10T). Alinhamento de spin eletrônico forçado. Efeito Hall quântico.',
            danger: 2
        },
        { 
            id: 'entropia', 
            name: 'Entropia', 
            desc: 'Decaimento quântico acelerado. Ruptura da causalidade local. ⚠️ VIOLAÇÃO TERMODINÂMICA DETECTADA.',
            danger: 5
        },
        { 
            id: 'sonico', 
            name: 'Sônico', 
            desc: 'Ressonância acústica destrutiva. Ondas de pressão ultrassônica (>20kHz). Cavitação induzida: ativa.',
            danger: 3
        }
    ]
};