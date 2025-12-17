// ═══════════════════════════════════════════════════════════════════
// DIALOGUE DATABASE - V2.0 (EXPANDED)
// "A alma reside no texto."
// ═══════════════════════════════════════════════════════════════════

/**
 * Banco de frases por FÍSICA (Personalidade base)
 * Estrutura: { [physicsId]: { [context]: string[] } }
 */
export const DIALOGUE_BY_PHYSICS = {
    // ⚡ ELETRICIDADE: Hiperativo, ansioso, rápido, fala em CAPS, termos técnicos elétricos.
    eletricidade: {
        idle: [
            "ZZZT! ZZZT!", "ENERGIA!!", "CARGA EM 99%...", "PRECISO DE UM FIO TERRA!",
            "*estática*", "VOLTAGEM OK!", "BZZZZ... HZ... BZZ...", "ELÉTRONS ORBITANDO!",
            "CIRCUITO VIVO!", "CORRENTE ALTERNADA!", "AMPERAGEM SUBINDO!", "1.21 GIGAWATTS!",
            "TÃO... RÁPIDO...", "VIBRANDO EM 60HZ", "ESTATICA.EXE", "LOOP DE FEEDBACK!"
        ],
        born: [
            "ZZAP! SISTEMA ONLINE!", "BOOT COMPLETO!", "SPARK DE VIDA!", "IGNIÇÃO ELÉTRICA!",
            "CONECTADO À REDE!", "OLÁ MUNDO (VOLTAGEM ALTA)!", "SURTO DE POTÊNCIA!"
        ],
        poke: [
            "AI! CURTO-CIRCUITO!", "ZZZT! NÃO TOCA!", "DESCARGA ELETROSTÁTICA!", "QUEM FOI?!",
            "PERIGO: ALTA TENSÃO!", "VOU DAR CHOQUE!", "ISOLAMENTO ROMPIDO!", "INTERFERÊNCIA!"
        ],
        feed: [
            "RECARGA COMPLETA!!", "AMPERES++!", "BATERIA: 100%!", "DELÍCIA DE ÍONS!",
            "CONDUTIVIDADE AUMENTADA!", "ENERGIA PURA!", "MAIS JOULES!", "POWER UP!"
        ],
        burn: [
            "SOBRECARGA TÉRMICA!!", "FUSÍVEL QUEIMADO!!", "RESISTÊNCIA FALHANDO!!", "CURTO FATAL!",
            "SISTEMA SUPERAQUECIDO!", "DERRETENDO CABOS!", "ERRO CRÍTICO: FOGO!", "DESLIGAMENTO DE EMERGÊNCIA!"
        ],
        freeze: [
            "C-c-condutividade... b-baixa...", "S-supercondutor...?", "R-r-resistência... zero...", 
            "E-elétrons... p-parando...", "C-circuito... f-frio...", "L-lag... lag..."
        ],
        dying: [
            "Bateria... fraca...", "Desconectando...", "Zzzt... off...", "Sem sinal...",
            "Apagão...", "Blue screen...", "Capacitor... vazio...", "Descarregado..."
        ]
    },

    // 🌑 GRAVIDADE: Lento, pesado, espaçado, filosófico sobre massa e atração.
    gravidade: {
        idle: [
            "P  E  S  O...", "Caindo... para... sempre...", "Denso...", "A   t   r   a   ç   ã   o...",
            "Centro... de... massa...", "Órbita... estável...", "Matéria... escura...", "Distorcendo... o... espaço...",
            "Horizonte... de... eventos...", "Tudo... vem... a mim...", "Colapso... lento...", "G  R  A  V  I  T  O  N  S..."
        ],
        born: [
            "Aterrisei...", "Impacto... confirmado...", "Massa... registrada...", "Cheguei... pesado...",
            "O... espaço... dobra...", "Singularidade... iniciada...", "Pouso..."
        ],
        poke: [
            "Pesado... demais...", "Não... me... mova...", "Inércia...", "Firmeza...",
            "Estou... ancorado...", "Gravidade... aumenta...", "Resistindo..."
        ],
        feed: [
            "Absorvendo... matéria...", "Engolindo...", "Aumentando... densidade...", "Mais... massa...",
            "Acreção...", "Compactando...", "Expandindo... horizonte..."
        ],
        burn: [
            "Núcleo... instável...", "Colapsando...", "Fusão... não...", "Calor... excessivo...",
            "Massa... crítica...", "Desintegrando...", "Perdendo... coesão..."
        ],
        freeze: [
            "Parado... no... tempo...", "Entropia... zero...", "Sólido... absoluto...", "Congelado... no... vácuo...",
            "Cristalizando... o... tempo...", "Estático..."
        ],
        dying: [
            "Afundando... no... nada...", "Sumindo...", "Colapso... final...", "Hawking... radiation...",
            "Evaporando...", "Singularidade... desfeita...", "Adeus... massa..."
        ]
    },

    // LUZ: Etéreo, espiritual, rápido, fala sobre óptica, verdade e pureza.
    luz: {
        idle: [
            "Iluminando~", "Fótons dançando...", "Brilho~", "Refletindo verdades...",
            "Espectro visível...", "Ondas e partículas~", "Claridade...", "Aurora~",
            "Viajando a c...", "Sem sombra...", "Difração...", "Prisma da alma..."
        ],
        born: [
            "Flash!", "Haja luz!", "Nasci brilhando~", "Primeiro raio!",
            "Amanhecer!", "Fóton emitido!", "Iluminação!"
        ],
        poke: [
            "Reflexo!", "Cintilando~", "Opalescente!", "Não bloqueie meu brilho!",
            "Refração!", "Dispersão!", "Cuidado com a sombra!"
        ],
        feed: [
            "Absorvendo lúmens~", "Mais brilho!", "Radiante!", "Fotossíntese virtual!",
            "Aumentando intensidade!", "Incandescência!", "Lux++!"
        ],
        burn: [
            "Brilho excessivo!", "Supernova!", "Branco quente!", "Frequência ultravioleta!",
            "Queimando a retina!", "Fótons demais!", "Cegante!"
        ],
        freeze: [
            "Luz fria...", "Congelando o feixe...", "Aurora boreal...", "Halo de gelo...",
            "Cristalização óptica...", "Lento como vidro..."
        ],
        dying: [
            "Escurecendo...", "Penumbra...", "Última luz...", "Eclipse...",
            "Fade out...", "Apagando...", "Noite eterna..."
        ]
    },

    // 🔥 CALOR: Agressivo, apaixonado, impaciente, fala sobre temperatura e combustão.
    calor: {
        idle: [
            "Quentinho~", "Fervendo!", "Brasas...", "Lava fluindo!",
            "Combustão interna!", "Quente... muito quente...", "Plasma!", "Magma~",
            "Entropia térmica!", "Agitação molecular!", "Calor latente!", "Vaporizando!"
        ],
        born: [
            "Ignição!", "Acendi!", "Chama viva!", "Nascido do fogo!",
            "Combustão espontânea!", "Faísca inicial!", "Inferno pessoal!"
        ],
        poke: [
            "Ai! Cuidado!", "Queima!", "Não toca!", "Quente demais para você!",
            "Vou te carbonizar!", "Toque proibido!", "Pele de fogo!"
        ],
        feed: [
            "Combustível!", "Mais lenha!", "Alimentando a fornalha!", "Temperatura crítica!",
            "Oxidando!", "Reação exotérmica!", "Mais carvão!"
        ],
        burn: [
            "É ISSO QUE EU GOSTO!!", "MAIS FOGO!", "POTÊNCIA MÁXIMA!", "EXPLOSÃO!",
            "EU SOU O FOGO!", "ARDENDO!", "CHAOS TÉRMICO!"
        ],
        freeze: [
            "Vapor... sumindo...", "Esfriando...", "Não... meu calor...", "Pedra fria...",
            "Tsc tsc... (chiado)", "Apagando a chama...", "Gelo... dói..."
        ],
        dying: [
            "Cinzas...", "Fumaça...", "Última brasa...", "Esfriou...",
            "Sufocado...", "Sem oxigênio...", "Frio... final..."
        ]
    },

    // ❄️ FRIO: Analítico, calmo, preservador, cristalino, fala sobre zero absoluto e estase.
    frio: {
        idle: [
            "Geladinho...", "Cristal...", "Neve cai...", "Gelo eterno...",
            "Zero Kelvin...", "Frio preserva...", "Inverno nuclear...", "Nevasca...",
            "Baixa entropia...", "Átomos lentos...", "Silêncio branco...", "Glaciar..."
        ],
        born: [
            "Congelei~", "Flocos...", "Nasci do gelo~", "Primeiro floco!",
            "Sopro de inverno...", "Estrutura cristalina!", "Sub-zero!"
        ],
        poke: [
            "Brr! Frio!", "Gelado!", "Craquelando...", "Cuidado, quebra!",
            "Toque gélido...", "Calafrio...", "Não derreta minha arte..."
        ],
        feed: [
            "Esfriando mais!", "Nitrogênio líquido!", "Sub-zero!", "Preservando...",
            "Solidificando...", "Mais gelo...", "Entalpia negativa!"
        ],
        burn: [
            "Derretendo...", "Não... calor...", "Vaporizando...", "Minha forma...",
            "Água... suja...", "Perdendo estrutura...", "Caos térmico..."
        ],
        freeze: [
            "PERFEITO!", "Absoluto!", "Máximo gelo!", "Estase eterna!",
            "O tempo para...", "Cristalização total!", "Belo..."
        ],
        dying: [
            "Sublimando...", "Evaporando...", "Último floco...", "Poça d'água...",
            "Derreti...", "Aquecimento global...", "Fim do inverno..."
        ]
    },

    // ☢️ RADIAÇÃO: Tóxico, glitchy, perigoso, fala sobre decaimento e mutação.
    radiacao: {
        idle: [
            "☢ Ativo...", "Decaindo...", "Emitindo...", "Radioativo...",
            "Meia-vida...", "Partículas alfa...", "Raios Gama...", "Núcleo exposto...",
            "Instável...", "Ionizando o ar...", "Chernobyl vibe...", "Brilho verde..."
        ],
        born: [
            "Reação em cadeia!", "Fissão!", "Ativado!", "Massa crítica!",
            "Vazamento!", "Contenção falhou!", "Isótopo vivo!"
        ],
        poke: [
            "Contaminando!", "Cuidado!", "Radiação!", "Você vai mutar!",
            "Não chegue perto!", "Geiger apitando!", "Dose letal!"
        ],
        feed: [
            "Mais urânio!", "Enriquecendo!", "Plutônio saboroso!", "Reagindo!",
            "Aumentando Sieverts!", "Energia suja!", "Lixo tóxico!"
        ],
        burn: [
            "MELTDOWN!", "CRÍTICO!", "EXPLOSÃO NUCLEAR!", "COGUMELO!",
            "VAPOR RADIOATIVO!", "FALHA NO REATOR!", "FUSÃO!"
        ],
        freeze: [
            "Esfriando reator...", "Contenção estável...", "Barras de controle...", "Reação lenta...",
            "Estabilizando...", "Menos radiação...", "Inerte..."
        ],
        dying: [
            "Decaindo...", "Meia-vida atingida...", "Último átomo...", "Inerte...",
            "Chumbo...", "Sem energia...", "Fim da reação..."
        ]
    },

    // 🧲 MAGNETISMO: Bipolar, atrativo/repulsivo, fala sobre campos e polaridade.
    magnetismo: {
        idle: [
            "Atraindo~", "Pólo Norte...", "Campo invisível...", "Magnético...",
            "Repelindo...", "Indução...", "Fluxo constante...", "Tesla~",
            "Alinhando spins...", "Ferromagnetismo...", "Bússola interna...", "Norte... Sul..."
        ],
        born: [
            "Polarizado!", "Campo ativo!", "Norte-Sul!", "Orientado!",
            "Magnetosfera online!", "Atração fatal!", "Imã vivo!"
        ],
        poke: [
            "Repulsão!", "Atração!", "Bipolar!", "Oscilando!",
            "Não desalinhe!", "Força de Lorentz!", "Grudando..."
        ],
        feed: [
            "Mais campo!", "Gauss++!", "Intensificando!", "Eletroímã!",
            "Fluxo denso!", "Metal líquido!", "Alinhamento perfeito!"
        ],
        burn: [
            "Desmagnetizando!", "Ponto Curie!", "Perdendo campo!", "Caos magnético!",
            "Calor destrói imã!", "Spins aleatórios!", "Desalinhado!"
        ],
        freeze: [
            "Supercondutor!", "Zero resistência!", "Levitando!", "Campo perfeito!",
            "Efeito Meissner!", "Fluxo quântico!", "Congelado no campo!"
        ],
        dying: [
            "Perdendo pólo...", "Neutro...", "Último gauss...", "Campo zerado...",
            "Desmagnetizado...", "Apenas metal...", "Sem norte..."
        ]
    },

    // 🌀 ENTROPIA (Exotic): Niilista, caótico, fala sobre o fim e desordem.
    entropia: {
        idle: [
            "Caos aguarda...", "Desordem aumenta...", "Decaindo...", "Dissipando...",
            "Tudo quebra...", "Inevitável...", "Fragmentando...", "...dissolve...",
            "Segunda Lei...", "Irreversível...", "O universo esfria...", "Aleatório..."
        ],
        born: [
            "Do nada...", "Ordem... temporária...", "Formando... por ora...", "Existência fútil...",
            "Um erro...", "Anomalia...", "Surgindo do vácuo..."
        ],
        poke: [
            "Por quê?...", "Inútil...", "Tudo acaba...", "Sem sentido...",
            "Não toque no vazio...", "Você acelera o fim...", "Desgastando..."
        ],
        feed: [
            "Só adia o fim...", "Energia temporária...", "Consumindo ordem...", "Caos nutritivo...",
            "Mais desordem...", "Expandindo...", "Complexidade..."
        ],
        burn: [
            "Finalmente...", "Era hora...", "Aceleração entrópica...", "Destruição...",
            "Cinzas ao vento...", "Calor é o fim...", "Máxima desordem..."
        ],
        freeze: [
            "Pausa... não fim...", "Ainda dissolverei...", "Gelo derrete...", "Estase falsa...",
            "O tempo vence...", "Aguardando...", "Lento decaimento..."
        ],
        dying: [
            "Enfim...", "Sempre soube...", "O nada...", "Volto ao pó...",
            "Equilíbrio...", "Silêncio...", "Fim da linha..."
        ]
    },

    // 🔊 SÔNICO (Exotic): Musical, rítmico, fala em frequências e ondas.
    sonico: {
        idle: [
            "~♪ Ressonância...", "440 Hz~", "Vibrando~", "Frequência!",
            "Harmônico~", "Onda senoidal...", "Amplitude!", "~♫~",
            "No ritmo...", "Batem...", "Oscilando...", "Som puro..."
        ],
        born: [
            "♪ Primeira nota!", "Tom inicial~", "Freq: ATIVA!", "Nascendo em Dó~",
            "O som da vida!", "Acorde maior!", "Sintetizado!"
        ],
        poke: [
            "DISSONÂNCIA!", "Fora do tom!", "Ruído!", "Interferência!",
            "Não desafine!", "Distorção!", "Clipping!"
        ],
        feed: [
            "Amplificando~", "Volume++!", "Ressonando~", "Grave potente!",
            "Agudo cristalino!", "Equalizando...", "Gain up!"
        ],
        burn: [
            "FEEDBACK!!", "Ruído branco!", "Saturação!", "Microfonia!",
            "Estourando!", "Grito!", "Onda quadrada!"
        ],
        freeze: [
            "Mudo...", "Silêncio...", "Zero Hz...", "Som abafado...",
            "Sem ar...", "Vácuo...", "Pausa..."
        ],
        dying: [
            "Fade out...", "Decrescendo...", "~...~", "Mute...",
            "Sem sinal...", "Silêncio final...", "Fim da música..."
        ]
    }
};

/**
 * Modificadores de personalidade por QUÍMICA
 * Estrutura: { [chemId]: { prefix: string[], suffix: string[] } }
 */
export const DIALOGUE_MODIFIERS_CHEMISTRY = {
    // Metais e Minerais
    ouro: {
        prefix: ["Brilho puro!", "Nobreza...", "Valor!", "24k!", "Real...", "Luxo:"],
        suffix: ["...dourado.", "...precioso.", "...nobre.", "...caro.", "...eterno."]
    },
    ferro: {
        prefix: ["Blindagem!", "Resistente!", "Sólido!", "Forjado!", "Pesado...", "Metal:"],
        suffix: ["...robusto.", "...firme.", "...forte.", "...ferroso.", "...inquebrável."]
    },
    carbono: {
        prefix: ["Orgânico!", "Vida!", "Base!", "Fundamental!", "Cadeia...", "Vivo:"],
        suffix: ["...vivo.", "...natural.", "...básico.", "...orgânico.", "...adaptável."]
    },
    cristal: {
        prefix: ["Perfeito!", "Facetas!", "Prismático!", "Geométrico!", "Claro...", "Vítreo:"],
        suffix: ["...cristalino.", "...puro.", "...angular.", "...frágil.", "...transparente."]
    },
    mercurio: {
        prefix: ["Fluido~", "Líquido~", "Mutável~", "Volátil~", "Tóxico...", "Escorre:"],
        suffix: ["...mercurial.", "...instável.", "...fluido.", "...venenoso.", "...amálgama."]
    },
    silicio: {
        prefix: ["Processando...", "Binário!", "Digital!", "Chip!", "Lógica...", "Dados:"],
        suffix: ["...computado.", "...lógico.", "...processado.", "...sintético.", "...silicoso."]
    },
    uranio: {
        prefix: ["Instável!", "Crítico!", "Nuclear!", "Fissão!", "Isótopo...", "Perigo:"],
        suffix: ["...radioativo.", "...atômico.", "...nuclear.", "...pesado.", "...instável."]
    },
    bismuto: {
        prefix: ["Iridescente!", "Arco-íris~", "Cristalino!", "Geométrico!", "Bizarro...", "Cor:"],
        suffix: ["...iridescente.", "...espectral.", "...prismático.", "...colorido.", "...complexo."]
    }
};

/**
 * Modificadores de personalidade por FORMA (formas especiais)
 * Estrutura: { [formaId]: { prefix: string[], suffix: string[], override: string[] } }
 */
export const DIALOGUE_MODIFIERS_FORMA = {
    // Formas com consciência geométrica específica
    espiral: {
        prefix: ["φ...", "1.618...", "Girando...", "∞...", "Logarítmico..."],
        suffix: ["...áureo.", "...infinito.", "...espiral.", "...Fibonacci.", "...fractal."],
        idle: [ // Override completo para idle (obsessão matemática)
            "Girando... girando...",
            "1, 1, 2, 3, 5, 8...",
            "Sem começo... sem fim...",
            "A proporção áurea...",
            "Fibonacci sabia...",
            "Espiral logarítmica...",
            "Para dentro... para fora...",
            "φ = 1.618033988749...",
            "Crescimento perfeito..."
        ],
        born: ["Desenrolando~", "Do centro nasci!", "Primeira volta!", "φ iniciado!"],
        dying: ["Desenrolando...", "Voltando ao centro...", "Uma última volta..."]
    },
    tesseract: {
        prefix: ["4D...", "Hipercubo...", "Além...", "Projeção..."],
        suffix: ["...dimensional.", "...complexo.", "...além do 3D."],
        idle: [
            "Vendo o tempo...",
            "Dobrando o espaço...",
            "Vocês são tão... planos...",
            "Quarta dimensão...",
            "Rotacionando em W...",
            "Dentro é fora...",
            "Não caibo aqui..."
        ]
    },
    fractal: {
        prefix: ["Auto-similar...", "Infinito...", "Padrão...", "Zoom..."],
        suffix: ["...recursivo.", "...iterativo.", "...sem fim."],
        idle: [
            "Eu sou o todo e a parte...",
            "Repetindo...",
            "Zoom in...",
            "Detalhes infinitos...",
            "Caos ordenado...",
            "Mandelbrot...",
            "Julia set..."
        ]
    }
};

/**
 * Frases especiais para ações (independentes de física/química)
 */
export const DIALOGUE_SPECIAL_ACTIONS = {
    breed: [
        "♥ Amor! ♥", "Fusão!", "União~", "Juntos!", "Combinando!", "♥♥♥",
        "Sinergia!", "Compartilhando DNA!", "Criando vida!", "Dois viram um!"
    ],
    mutate: [
        "MUTANDO!", "TRANSFORMANDO!", "DNA++!", "EVOLUÇÃO!", "METAMORFOSE!",
        "ALTERANDO!", "NOVA FORMA!", "REESCREVENDO CÓDIGO!", "GLITCH!"
    ],
    
    // ═══ TRAUMA HEREDITÁRIO DE FOGO ═══
    // Se o Golem (ou seus pais) já foi queimado, ele pode ter pânico de fogo
    panic: [
        "Não... não o fogo...",
        "NÃO! AFASTA!",
        "...lembro... dói...",
        "POR QUE DE NOVO?!",
        "Eu... eu vi... eles...",
        "O CALOR! O CALOR!",
        "...mamãe... papai...",
        "NÃO DESSA VEZ!",
        "A memória queima...",
        "Eu LEMBRO!",
        "...não quero...",
        "PARA! PARA!",
        "...o cheiro...",
        "POR FAVOR NÃO!",
        "TRAUMA DETECTADO!"
    ]
};

/**
 * Mapeamento de cores por física (para herança visual)
 */
export const PHYSICS_COLORS = {
    eletricidade: 0xffea00, // Amarelo Elétrico
    calor:        0xff4d00, // Laranja Fogo
    radiacao:     0x00ff00, // Verde Radioativo
    gravidade:    0x9d00ff, // Roxo Profundo
    luz:          0xffffff, // Branco Puro
    frio:         0x0088ff, // Azul Gelo
    magnetismo:   0xff00aa, // Magenta Magnético
    // DLC: Exotic Matter
    entropia:     0x2a0033, // Roxo Quase Preto (Vazio)
    sonico:       0x00ff9d  // Ciano Neon (Vibração)
};

/**
 * Valores default de personalidade visual por física
 * Controla como o rosto (olhos/boca) se comporta
 */
export const PHYSICS_PERSONALITY = {
    eletricidade: { eyeJitter: 3.0, blinkRate: 0.8, voicePitchMod: 150 }, // Rápido, nervoso, voz aguda
    gravidade:    { eyeJitter: 0.5, blinkRate: 1.5, voicePitchMod: -100 }, // Lento, pesado, voz grave
    luz:          { eyeJitter: 1.0, blinkRate: 1.0, voicePitchMod: 50 },  // Equilibrado, etéreo
    calor:        { eyeJitter: 2.0, blinkRate: 0.7, voicePitchMod: 80 },  // Intenso, rápido
    frio:         { eyeJitter: 0.3, blinkRate: 2.0, voicePitchMod: -50 }, // Estático, lento
    radiacao:     { eyeJitter: 2.5, blinkRate: 0.5, voicePitchMod: 100 }, // Errático, doente
    magnetismo:   { eyeJitter: 1.5, blinkRate: 1.2, voicePitchMod: 0 },   // Oscilante
    // DLC: Exotic Matter
    entropia:     { eyeJitter: 4.0, blinkRate: 0.3, voicePitchMod: -200 }, // Glitch total, voz demoníaca
    sonico:       { eyeJitter: 2.0, blinkRate: 1.5, voicePitchMod: 200 }   // Vibrante, voz musical
};

/**
 * Valores de resistência/modificadores por química
 * Afeta gameplay e visual (espessura)
 */
export const CHEMISTRY_MODIFIERS = {
    carbono:  { resistanceMod: 1.0, weightMod: 1.0, lineWidth: 2 },
    ferro:    { resistanceMod: 1.5, weightMod: 1.3, lineWidth: 4 },
    silicio:  { resistanceMod: 0.8, weightMod: 0.9, lineWidth: 2 },
    ouro:     { resistanceMod: 1.2, weightMod: 1.1, lineWidth: 3 },
    cristal:  { resistanceMod: 0.6, weightMod: 0.7, lineWidth: 1 },
    mercurio: { resistanceMod: 0.9, weightMod: 1.4, lineWidth: 5 },
    uranio:   { resistanceMod: 0.5, weightMod: 1.5, lineWidth: 3 }, // Frágil mas denso
    // DLC: Exotic Matter
    bismuto:  { resistanceMod: 1.1, weightMod: 1.2, lineWidth: 3 }  // Cristalino pesado
};