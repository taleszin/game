// ═══════════════════════════════════════════════════════════════════
// DIALOGUE DATABASE - V3.0 (GENERATIVE TEMPLATES)
// "A alma reside no texto dinâmico."
// ═══════════════════════════════════════════════════════════════════

/**
 * ═══════════════════════════════════════════════════════════════════
 * VOCABULÁRIO POR FÍSICA - Para sistema de templates generativos
 * Estrutura: { [physicsId]: { substantivos, verbos, adjetivos } }
 * ═══════════════════════════════════════════════════════════════════
 */
export const PHYSICS_VOCABULARY = {
    eletricidade: {
        substantivos: ['bateria', 'circuito', 'fiação', 'carga', 'voltagem', 'elétron', 'faísca', 'fusível', 'resistor', 'capacitor', 'amperagem', 'corrente', 'energia'],
        verbos: ['vibrar', 'pulsar', 'carregar', 'descarregar', 'curto-circuitar', 'energizar', 'conduzir', 'oscilar', 'zumbir', 'eletrocutar'],
        adjetivos: ['elétrica', 'carregada', 'instável', 'pulsante', 'energizada', 'sobrecarregada', 'estática', 'alternada', 'alta-tensão', 'ionizada']
    },
    gravidade: {
        substantivos: ['massa', 'órbita', 'núcleo', 'horizonte', 'vácuo', 'matéria', 'singularidade', 'peso', 'densidade', 'buraco negro', 'graviton'],
        verbos: ['atrair', 'colapsar', 'orbitar', 'afundar', 'comprimir', 'distorcer', 'puxar', 'cair', 'esmagar', 'dobrar'],
        adjetivos: ['densa', 'pesada', 'massiva', 'profunda', 'colapsada', 'infinita', 'esmagadora', 'inexorável', 'atraente', 'curvada']
    },
    luz: {
        substantivos: ['fóton', 'raio', 'espectro', 'brilho', 'aurora', 'prisma', 'lúmen', 'reflexo', 'claridade', 'onda', 'partícula'],
        verbos: ['brilhar', 'refletir', 'refratar', 'iluminar', 'cintilar', 'irradiar', 'difundir', 'resplandecer', 'flamear', 'clarear'],
        adjetivos: ['luminosa', 'brilhante', 'radiante', 'pura', 'cristalina', 'translúcida', 'cintilante', 'etérea', 'iridescente', 'incandescente']
    },
    calor: {
        substantivos: ['chama', 'brasa', 'lava', 'fornalha', 'combustão', 'cinza', 'fumaça', 'plasma', 'caloria', 'fagulha', 'inferno'],
        verbos: ['queimar', 'ferver', 'carbonizar', 'inflamar', 'aquecer', 'derreter', 'vaporizar', 'explodir', 'arder', 'abrasar'],
        adjetivos: ['quente', 'ardente', 'incandescente', 'flamejante', 'abrasadora', 'escaldante', 'vulcânica', 'infernal', 'térmica', 'explosiva']
    },
    frio: {
        substantivos: ['gelo', 'cristal', 'floco', 'nevasca', 'glaciar', 'neve', 'geada', 'inverno', 'avalanche', 'iceberg', 'permafrost'],
        verbos: ['congelar', 'cristalizar', 'esfriar', 'solidificar', 'preservar', 'nevar', 'gelar', 'craquear', 'estilhaçar', 'hibernar'],
        adjetivos: ['gelada', 'gélida', 'cristalina', 'congelante', 'sub-zero', 'glacial', 'ártica', 'frígida', 'preservada', 'imóvel']
    },
    radiacao: {
        substantivos: ['núcleo', 'isótopo', 'partícula', 'reação', 'decaimento', 'meia-vida', 'urânio', 'plutônio', 'geiger', 'radiação', 'fissão'],
        verbos: ['decair', 'irradiar', 'contaminar', 'mutar', 'ionizar', 'emitir', 'fissionar', 'fundir', 'envenenar', 'brilhar'],
        adjetivos: ['radioativa', 'instável', 'tóxica', 'mutante', 'crítica', 'nuclear', 'letal', 'ionizada', 'cancerígena', 'glitchada']
    },
    magnetismo: {
        substantivos: ['polo', 'campo', 'fluxo', 'imã', 'bússola', 'atração', 'repulsão', 'spin', 'tesla', 'gauss', 'ferro'],
        verbos: ['atrair', 'repelir', 'polarizar', 'alinhar', 'induzir', 'magnetizar', 'oscilar', 'orientar', 'grudar', 'levitar'],
        adjetivos: ['magnética', 'polarizada', 'atraente', 'repulsiva', 'bipolar', 'alinhada', 'ferromagnética', 'oscilante', 'induzida', 'orientada']
    },
    entropia: {
        substantivos: ['caos', 'desordem', 'vazio', 'fragmento', 'ruína', 'poeira', 'cinza', 'nada', 'silêncio', 'dissolução', 'fim'],
        verbos: ['dissolver', 'fragmentar', 'decair', 'desintegrar', 'espalhar', 'colapsar', 'esfriar', 'acabar', 'corroer', 'morrer'],
        adjetivos: ['caótica', 'dissolvida', 'fragmentada', 'irreversível', 'inevitável', 'fria', 'vazia', 'final', 'entrópica', 'corroída']
    },
    sonico: {
        substantivos: ['frequência', 'onda', 'vibração', 'nota', 'harmônico', 'ressonância', 'eco', 'tom', 'acorde', 'amplitude', 'decibel'],
        verbos: ['vibrar', 'ressoar', 'ecoar', 'pulsar', 'oscilar', 'harmonizar', 'amplificar', 'silenciar', 'modular', 'sintetizar'],
        adjetivos: ['sônica', 'vibrante', 'ressonante', 'harmônica', 'pulsante', 'musical', 'rítmica', 'modulada', 'amplificada', 'dissonante']
    }
};

/**
 * ═══════════════════════════════════════════════════════════════════
 * TIPOS FÍSICOS OPOSTOS - Para sistema de resposta social
 * ═══════════════════════════════════════════════════════════════════
 */
export const PHYSICS_OPPOSITES = {
    calor: 'frio',
    frio: 'calor',
    luz: 'entropia',
    entropia: 'luz',
    eletricidade: 'magnetismo',
    magnetismo: 'eletricidade',
    gravidade: 'luz',
    radiacao: 'frio',
    sonico: 'gravidade'
};

/**
 * ═══════════════════════════════════════════════════════════════════
 * TEMPLATES DE RESPOSTA SOCIAL - Para interações entre Golems
 * ═══════════════════════════════════════════════════════════════════
 */
export const SOCIAL_RESPONSE_TEMPLATES = {
    // Resposta quando o vizinho é do MESMO tipo físico
    friendly: [
        "Eu te entendo, {substantivo}!",
        "Somos {adjetivo}s juntos!",
        "Minha {substantivo} também {verbo}!",
        "Sim! A {substantivo} é {adjetivo}!",
        "Concordo, irmão {adjetivo}!",
        "{adjetivo}... como eu!",
        "Somos feitos da mesma {substantivo}~",
        "Ei! Eu também {verbo}!",
        "Finalmente alguém {adjetivo}!",
        "Nossa {substantivo} compartilhada..."
    ],
    // Resposta quando o vizinho é do tipo OPOSTO
    hostile: [
        "Afaste-se, {substantivo}!",
        "Você é muito {adjetivo}...",
        "Não chegue perto com essa {substantivo}!",
        "Minha {substantivo} não gosta de você!",
        "Vá {verbo} longe daqui!",
        "Incompatível! {adjetivo} demais!",
        "Cuidado! Minha {substantivo} reage!",
        "Tsc... Você é {adjetivo}...",
        "Mantenha distância, {substantivo}!",
        "Não me faça {verbo}!"
    ],
    // Resposta quando o vizinho é de tipo NEUTRO
    neutral: [
        "Hmm... {substantivo}...",
        "Interessante, {adjetivo}...",
        "Eu ouvi você {verbo}...",
        "Uma {substantivo} diferente...",
        "Curioso... {adjetivo}...",
        "Sua {substantivo}... peculiar.",
        "Vejo que você {verbo}...",
        "{adjetivo}... diferente de mim.",
        "Olá, {substantivo}...",
        "Cada um com sua {substantivo}~"
    ]
};

/**
 * Banco de frases por FÍSICA (Personalidade base)
 * Agora com TEMPLATES usando placeholders: {substantivo}, {verbo}, {adjetivo}
 * Estrutura: { [physicsId]: { [context]: string[] } }
 */
export const DIALOGUE_BY_PHYSICS = {
    // ⚡ ELETRICIDADE: Hiperativo, ansioso, rápido, fala em CAPS, termos técnicos elétricos.
    eletricidade: {
        idle: [
            "ZZZT! ZZZT!", "ENERGIA!!", "CARGA EM 99%...", "PRECISO DE UM FIO TERRA!",
            "*estática*", "VOLTAGEM OK!", "BZZZZ... HZ... BZZ...", "ELÉTRONS ORBITANDO!",
            "CIRCUITO VIVO!", "CORRENTE ALTERNADA!", "AMPERAGEM SUBINDO!", "1.21 GIGAWATTS!",
            "TÃO... RÁPIDO...", "VIBRANDO EM 60HZ", "ESTATICA.EXE", "LOOP DE FEEDBACK!",
            // Templates generativos
            "Minha {substantivo} está {adjetivo}!",
            "Sinto a {substantivo} {verbo}!",
            "{substantivo} {adjetivo}!!",
            "Preciso {verbo} minha {substantivo}!"
        ],
        born: [
            "ZZAP! SISTEMA ONLINE!", "BOOT COMPLETO!", "SPARK DE VIDA!", "IGNIÇÃO ELÉTRICA!",
            "CONECTADO À REDE!", "OLÁ MUNDO (VOLTAGEM ALTA)!", "SURTO DE POTÊNCIA!",
            "Minha {substantivo} nasceu {adjetivo}!"
        ],
        poke: [
            "AI! CURTO-CIRCUITO!", "ZZZT! NÃO TOCA!", "DESCARGA ELETROSTÁTICA!", "QUEM FOI?!",
            "PERIGO: ALTA TENSÃO!", "VOU DAR CHOQUE!", "ISOLAMENTO ROMPIDO!", "INTERFERÊNCIA!",
            "Não toque na minha {substantivo}!",
            "Vou {verbo} você!!"
        ],
        feed: [
            "RECARGA COMPLETA!!", "AMPERES++!", "BATERIA: 100%!", "DELÍCIA DE ÍONS!",
            "CONDUTIVIDADE AUMENTADA!", "ENERGIA PURA!", "MAIS JOULES!", "POWER UP!",
            "Minha {substantivo} está {adjetivo}!",
            "{substantivo} {verbo}ndo forte!"
        ],
        burn: [
            "SOBRECARGA TÉRMICA!!", "FUSÍVEL QUEIMADO!!", "RESISTÊNCIA FALHANDO!!", "CURTO FATAL!",
            "SISTEMA SUPERAQUECIDO!", "DERRETENDO CABOS!", "ERRO CRÍTICO: FOGO!", "DESLIGAMENTO DE EMERGÊNCIA!",
            "Minha {substantivo} vai {verbo}!!"
        ],
        freeze: [
            "C-c-condutividade... b-baixa...", "S-supercondutor...?", "R-r-resistência... zero...", 
            "E-elétrons... p-parando...", "C-circuito... f-frio...", "L-lag... lag...",
            "M-minha {substantivo}... f-fria..."
        ],
        dying: [
            "Bateria... fraca...", "Desconectando...", "Zzzt... off...", "Sem sinal...",
            "Apagão...", "Blue screen...", "Capacitor... vazio...", "Descarregado...",
            "Minha {substantivo}... acabando..."
        ]
    },

    // 🌑 GRAVIDADE: Lento, pesado, espaçado, filosófico sobre massa e atração.
    gravidade: {
        idle: [
            "P  E  S  O...", "Caindo... para... sempre...", "Denso...", "A   t   r   a   ç   ã   o...",
            "Centro... de... massa...", "Órbita... estável...", "Matéria... escura...", "Distorcendo... o... espaço...",
            "Horizonte... de... eventos...", "Tudo... vem... a mim...", "Colapso... lento...", "G  R  A  V  I  T  O  N  S...",
            // Templates generativos
            "Minha {substantivo}... {adjetivo}...",
            "A {substantivo}... {verbo}... tudo...",
            "{substantivo}... {adjetivo}... sempre..."
        ],
        born: [
            "Aterrisei...", "Impacto... confirmado...", "Massa... registrada...", "Cheguei... pesado...",
            "O... espaço... dobra...", "Singularidade... iniciada...", "Pouso...",
            "Minha {substantivo}... nasceu..."
        ],
        poke: [
            "Pesado... demais...", "Não... me... mova...", "Inércia...", "Firmeza...",
            "Estou... ancorado...", "Gravidade... aumenta...", "Resistindo...",
            "Minha {substantivo}... inabalável..."
        ],
        feed: [
            "Absorvendo... matéria...", "Engolindo...", "Aumentando... densidade...", "Mais... massa...",
            "Acreção...", "Compactando...", "Expandindo... horizonte...",
            "{substantivo}... {adjetivo}..."
        ],
        burn: [
            "Núcleo... instável...", "Colapsando...", "Fusão... não...", "Calor... excessivo...",
            "Massa... crítica...", "Desintegrando...", "Perdendo... coesão...",
            "A {substantivo}... vai {verbo}..."
        ],
        freeze: [
            "Parado... no... tempo...", "Entropia... zero...", "Sólido... absoluto...", "Congelado... no... vácuo...",
            "Cristalizando... o... tempo...", "Estático..."
        ],
        dying: [
            "Afundando... no... nada...", "Sumindo...", "Colapso... final...", "Hawking... radiation...",
            "Evaporando...", "Singularidade... desfeita...", "Adeus... massa...",
            "Minha {substantivo}... desvanece..."
        ]
    },

    // LUZ: Etéreo, espiritual, rápido, fala sobre óptica, verdade e pureza.
    luz: {
        idle: [
            "Iluminando~", "Fótons dançando...", "Brilho~", "Refletindo verdades...",
            "Espectro visível...", "Ondas e partículas~", "Claridade...", "Aurora~",
            "Viajando a c...", "Sem sombra...", "Difração...", "Prisma da alma...",
            // Templates generativos
            "Meu {substantivo} está {adjetivo}~",
            "A {substantivo} {verbo} suavemente...",
            "{adjetivo}... tão {adjetivo}~"
        ],
        born: [
            "Flash!", "Haja luz!", "Nasci brilhando~", "Primeiro raio!",
            "Amanhecer!", "Fóton emitido!", "Iluminação!",
            "Meu {substantivo} brilha!"
        ],
        poke: [
            "Reflexo!", "Cintilando~", "Opalescente!", "Não bloqueie meu brilho!",
            "Refração!", "Dispersão!", "Cuidado com a sombra!",
            "Não ofusque meu {substantivo}!"
        ],
        feed: [
            "Absorvendo lúmens~", "Mais brilho!", "Radiante!", "Fotossíntese virtual!",
            "Aumentando intensidade!", "Incandescência!", "Lux++!",
            "Minha {substantivo} fica {adjetivo}!"
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
            "Fade out...", "Apagando...", "Noite eterna...",
            "Meu {substantivo}... escureceu..."
        ]
    },

    // 🔥 CALOR: Agressivo, apaixonado, impaciente, fala sobre temperatura e combustão.
    calor: {
        idle: [
            "Quentinho~", "Fervendo!", "Brasas...", "Lava fluindo!",
            "Combustão interna!", "Quente... muito quente...", "Plasma!", "Magma~",
            "Entropia térmica!", "Agitação molecular!", "Calor latente!", "Vaporizando!",
            // Templates generativos
            "Minha {substantivo} está {adjetivo}!",
            "A {substantivo} vai {verbo}!",
            "{substantivo} {adjetivo}!!",
            "Sinto a {substantivo} {verbo}!"
        ],
        born: [
            "Ignição!", "Acendi!", "Chama viva!", "Nascido do fogo!",
            "Combustão espontânea!", "Faísca inicial!", "Inferno pessoal!",
            "Minha {substantivo} acendeu!"
        ],
        poke: [
            "Ai! Cuidado!", "Queima!", "Não toca!", "Quente demais para você!",
            "Vou te carbonizar!", "Toque proibido!", "Pele de fogo!",
            "Vou {verbo} você!",
            "Não mexa na minha {substantivo}!"
        ],
        feed: [
            "Combustível!", "Mais lenha!", "Alimentando a fornalha!", "Temperatura crítica!",
            "Oxidando!", "Reação exotérmica!", "Mais carvão!",
            "Minha {substantivo} fica {adjetivo}!"
        ],
        burn: [
            "É ISSO QUE EU GOSTO!!", "MAIS FOGO!", "POTÊNCIA MÁXIMA!", "EXPLOSÃO!",
            "EU SOU O FOGO!", "ARDENDO!", "CHAOS TÉRMICO!",
            "MINHA {substantivo} É {adjetivo}!!"
        ],
        freeze: [
            "Vapor... sumindo...", "Esfriando...", "Não... meu calor...", "Pedra fria...",
            "Tsc tsc... (chiado)", "Apagando a chama...", "Gelo... dói...",
            "Minha {substantivo}... esfriando..."
        ],
        dying: [
            "Cinzas...", "Fumaça...", "Última brasa...", "Esfriou...",
            "Sufocado...", "Sem oxigênio...", "Frio... final...",
            "Minha {substantivo}... apagou..."
        ]
    },

    // ❄️ FRIO: Analítico, calmo, preservador, cristalino, fala sobre zero absoluto e estase.
    frio: {
        idle: [
            "Geladinho...", "Cristal...", "Neve cai...", "Gelo eterno...",
            "Zero Kelvin...", "Frio preserva...", "Inverno nuclear...", "Nevasca...",
            "Baixa entropia...", "Átomos lentos...", "Silêncio branco...", "Glaciar...",
            // Templates generativos
            "Minha {substantivo} está {adjetivo}...",
            "A {substantivo} {verbo} lentamente...",
            "{substantivo}... {adjetivo}..."
        ],
        born: [
            "Congelei~", "Flocos...", "Nasci do gelo~", "Primeiro floco!",
            "Sopro de inverno...", "Estrutura cristalina!", "Sub-zero!",
            "Minha {substantivo} cristalizou~"
        ],
        poke: [
            "Brr! Frio!", "Gelado!", "Craquelando...", "Cuidado, quebra!",
            "Toque gélido...", "Calafrio...", "Não derreta minha arte...",
            "Cuidado com minha {substantivo}..."
        ],
        feed: [
            "Esfriando mais!", "Nitrogênio líquido!", "Sub-zero!", "Preservando...",
            "Solidificando...", "Mais gelo...", "Entalpia negativa!",
            "Minha {substantivo} fica {adjetivo}..."
        ],
        burn: [
            "Derretendo...", "Não... calor...", "Vaporizando...", "Minha forma...",
            "Água... suja...", "Perdendo estrutura...", "Caos térmico...",
            "Minha {substantivo}... derretendo..."
        ],
        freeze: [
            "PERFEITO!", "Absoluto!", "Máximo gelo!", "Estase eterna!",
            "O tempo para...", "Cristalização total!", "Belo...",
            "Minha {substantivo} está {adjetivo}!"
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
    
    // ═══ COMPORTAMENTO AUTÔNOMO: CORTEJO ═══
    // Golems compatíveis se aproximam e tentam reproduzir
    courting: [
        "Sua geometria é perfeita...",
        "Vamos compilar juntos?",
        "Sintetizando atração...",
        "Você me completa~",
        "Compatibilidade: 100%",
        "Quero fusionar...",
        "Seus ângulos são belos...",
        "Sinto... atração...",
        "DNA compatível detectado!",
        "♥ Olá... ♥",
        "Juntos somos... mais.",
        "Sua frequência... ressoa.",
        "Código genético... lindo~",
        "Podemos... criar algo?",
        "Você é como eu..."
    ],
    
    // ═══ COMPORTAMENTO AUTÔNOMO: COMBATE ═══
    // Golems de elementos opostos brigam por território
    combat_start: [
        "Saia do meu espaço!",
        "Incompatível! AFASTE-SE!",
        "Vou te deletar!",
        "Este território é meu!",
        "Você não pertence aqui!",
        "Invasor detectado!",
        "Preparar para conflito!",
        "Seu tipo... me irrita!",
        "COLISÃO IMINENTE!",
        "Oponente hostil!",
        "Erro de compatibilidade!",
        "Sistema de defesa: ATIVO!"
    ],
    
    // Reação ao ser atingido em combate
    combat_hit: [
        "Ai!",
        "Glitch detectado!",
        "Meus pixels!",
        "DANO RECEBIDO!",
        "Erro crítico!",
        "Integridade comprometida!",
        "*crash*",
        "Oof!",
        "Buffer overflow!",
        "Segmentation fault!",
        "Isso... doeu...",
        "Contra-ataque!"
    ],
    
    // Vitória em combate (outro fugiu ou morreu)
    combat_victory: [
        "Território seguro.",
        "Invasor eliminado!",
        "Dominância confirmada.",
        "Esse é MEU espaço!",
        "Sistema estabilizado.",
        "Ameaça neutralizada."
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