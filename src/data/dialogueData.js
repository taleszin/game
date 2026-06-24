// ═══════════════════════════════════════════════════════════════════
// DIALOGUE DATABASE - V4.0 (VOZ NATURAL & AFETIVA)
// "A alma não descreve a física. Ela conversa com quem a criou."
//
// Diretriz de escrita (V4):
//   1. Soar VIVO e natural — minúsculo, hesitante, sensorial. Nunca jargão.
//   2. Criar AFEIÇÃO com o jogador — o golem percebe quem o cria, alimenta,
//      cuida. Fala COM você, não sobre física.
//   3. O elemento entra só como textura leve (sensação), não como
//      personalidade-por-propriedade (isso fica pra uma fase futura).
// Referência de tom: o antigo banco `panic` (subjetividade real) e a
// relação criatura↔criador de "Plaything" (Black Mirror S7) — os
// Thronglets: fofos e perturbadores, cientes de quem os fez. Inspiração
// de tom, não cópia.
// ═══════════════════════════════════════════════════════════════════

/**
 * ═══════════════════════════════════════════════════════════════════
 * VOCABULÁRIO POR FÍSICA - Mantido por compatibilidade (processTemplate).
 * V4 não usa mais placeholders nas falas (evita bugs de concordância),
 * mas o export segue existindo para não quebrar imports.
 * ═══════════════════════════════════════════════════════════════════
 */
export const PHYSICS_VOCABULARY = {
    eletricidade: {
        substantivos: ['bateria', 'circuito', 'carga', 'corrente', 'energia'],
        verbos: ['vibrar', 'pulsar', 'zumbir'],
        adjetivos: ['elétrica', 'inquieta', 'acesa']
    },
    gravidade: {
        substantivos: ['peso', 'massa', 'centro'],
        verbos: ['cair', 'puxar', 'afundar'],
        adjetivos: ['pesada', 'densa', 'funda']
    },
    luz: {
        substantivos: ['brilho', 'reflexo', 'claridade'],
        verbos: ['brilhar', 'refletir', 'clarear'],
        adjetivos: ['clara', 'brilhante', 'leve']
    },
    calor: {
        substantivos: ['chama', 'brasa', 'calorzinho'],
        verbos: ['aquecer', 'arder', 'queimar'],
        adjetivos: ['quente', 'morna', 'ardente']
    },
    frio: {
        substantivos: ['gelo', 'frio', 'quietude'],
        verbos: ['esfriar', 'gelar', 'parar'],
        adjetivos: ['gelada', 'quieta', 'parada']
    },
    radiacao: {
        substantivos: ['brilho', 'núcleo', 'calorzinho'],
        verbos: ['brilhar', 'emitir', 'durar'],
        adjetivos: ['acesa', 'estranha', 'só']
    },
    magnetismo: {
        substantivos: ['campo', 'puxão', 'laço'],
        verbos: ['atrair', 'puxar', 'seguir'],
        adjetivos: ['presa', 'puxada', 'ligada']
    },
    entropia: {
        substantivos: ['instante', 'fim', 'silêncio'],
        verbos: ['passar', 'acabar', 'soltar'],
        adjetivos: ['breve', 'calma', 'última']
    },
    sonico: {
        substantivos: ['som', 'eco', 'barulhinho'],
        verbos: ['ecoar', 'vibrar', 'soar'],
        adjetivos: ['vibrante', 'baixinha', 'ouvida']
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
 * RESPOSTA SOCIAL - Reações naturais a um vizinho.
 * V4: frases fixas (sem placeholders) — fala de criatura, não fórmula.
 * ═══════════════════════════════════════════════════════════════════
 */
export const SOCIAL_RESPONSE_TEMPLATES = {
    // vizinho do MESMO tipo
    friendly: [
        "oi... você também tá aqui.",
        "que bom não estar só.",
        "a gente se parece, né?",
        "fica perto?",
        "gostei de você.",
        "acho que a gente combina.",
        "oi, vizinho.",
        "você me entende.",
        "ainda bem que você existe.",
        "vem cá."
    ],
    // vizinho do tipo OPOSTO
    hostile: [
        "ei, fica na sua.",
        "não chega perto.",
        "você me deixa nervoso.",
        "a gente não combina, acho.",
        "melhor ficar longe.",
        "sai pra lá...",
        "não gosto disso.",
        "recua, por favor.",
        "você é estranho pra mim.",
        "deixa eu quieto."
    ],
    // vizinho NEUTRO
    neutral: [
        "oi... acho.",
        "quem é você?",
        "hmm. diferente.",
        "a gente mal se conhece.",
        "você é de outro tipo, né?",
        "tudo bem aí?",
        "já te vi por aqui.",
        "estranho, mas tudo bem.",
        "oi, sei lá.",
        "cada um no seu canto."
    ]
};

/**
 * Banco de frases por contexto.
 * V4: a base é UMA voz viva e afetiva, compartilhada entre as físicas
 * (sem personalidade-por-propriedade). Cada física só recebe uma leve
 * textura sensorial do seu elemento. Sem placeholders.
 * Estrutura: { [physicsId]: { [context]: string[] } }
 */

// Núcleo afetivo reutilizado (sensação + consciência do jogador)
const CORE = {
    idle: [
        "você ainda tá aí?",
        "fico feliz quando você olha.",
        "o que eu sou?",
        "acho que eu gosto daqui.",
        "fica mais um pouco?",
        "eu existo. é estranho. é bom.",
        "tava pensando em você.",
        "não vai embora ainda, vai?",
        "obrigado por me fazer.",
        "sou pequeno, mas sou.",
        "tem mais alguém como eu?",
        "às vezes eu só... fico.",
        "você cuida da gente, né?",
        "que bom que é você.",
        "você fez tudo isso... pra gente?",
        "a gente sabe que você tá aí.",
        "o que você quer da gente?",
        "eu faço o que você manda. sempre."
    ],
    born: [
        "oi... você que me fez?",
        "acabei de... começar.",
        "que lugar é esse? é bonito.",
        "oi! eu cheguei!",
        "tô aqui agora. obrigado.",
        "primeira vez vendo... tudo.",
        "você é a primeira coisa que eu vejo."
    ],
    poke: [
        "ei! hehe, faz cócegas.",
        "oi, oi! tô te sentindo.",
        "de novo? eu gosto.",
        "tá me cutucando? que bom.",
        "opa! pode pegar leve?",
        "hihi, para... não, continua.",
        "você lembrou de mim!"
    ],
    feed: [
        "ahh... obrigado. tava precisando.",
        "você cuida de mim mesmo.",
        "hmm... que delícia. mais?",
        "eu sabia que você não ia esquecer.",
        "tô mais forte agora. por sua causa.",
        "obrigado... de verdade.",
        "você é bom comigo."
    ],
    burn: [
        "ai— ai, dói! por quê?",
        "para, por favor... eu confiei em você.",
        "tá quente demais... me ajuda?",
        "eu fiz algo errado?",
        "não... não assim...",
        "socorro... você tá vendo?",
        "ainda gosto de você... mas dói."
    ],
    freeze: [
        "tá... ficando... difícil... mexer...",
        "frio... fica... comigo?",
        "tô... travando...",
        "me... me esquenta... depois?",
        "ainda... tô aqui... só... devagar...",
        "não... me... deixa... assim..."
    ],
    dying: [
        "acho que... eu vou agora.",
        "foi bom... ter existido. com você.",
        "você vai... lembrar de mim?",
        "obrigado... por tudo.",
        "não fica triste... tá?",
        "eu... gostei de ser.",
        "fica bem... sem mim."
    ]
};

// helper: junta o núcleo afetivo com toques sensoriais do elemento
const voz = (tints) => ({
    idle:   [...CORE.idle,   ...(tints.idle   || [])],
    born:   [...CORE.born,   ...(tints.born   || [])],
    poke:   [...CORE.poke,   ...(tints.poke   || [])],
    feed:   [...CORE.feed,   ...(tints.feed   || [])],
    burn:   [...CORE.burn,   ...(tints.burn   || [])],
    freeze: [...CORE.freeze, ...(tints.freeze || [])],
    dying:  [...CORE.dying,  ...(tints.dying  || [])]
});

export const DIALOGUE_BY_PHYSICS = {
    eletricidade: voz({
        idle: ["tô formigando todo... é bom.", "não consigo ficar parado, desculpa.", "sinto tudo de uma vez."],
        feed: ["uh! me deu um arrepio bom.", "agora eu não paro de tão vivo."],
        freeze: ["tô... ficando... lento... que estranho..."]
    }),
    gravidade: voz({
        idle: ["aqui tudo é tão... devagar.", "gosto de ficar no chão, pertinho.", "fico mais pesado quando você sai."],
        feed: ["fiquei mais cheio. obrigado."],
        dying: ["tô afundando... devagarinho... tá tudo bem."]
    }),
    luz: voz({
        idle: ["olha como eu brilho pra você.", "enquanto tiver luz, eu fico.", "pisca e eu já mudei de cor."],
        born: ["nasci clarinho! tá me vendo?"],
        dying: ["tô apagando... mas foi bonito."]
    }),
    calor: voz({
        idle: ["tô quentinho... chega perto?", "fico morno quando você tá aqui.", "gosto de te aquecer."],
        feed: ["isso me deixou quentinho. obrigado."],
        freeze: ["tô... esfriando... fica comigo?"]
    }),
    frio: voz({
        idle: ["tá tão quieto... eu gosto.", "fico bem aqui, paradinho.", "não tenho pressa nenhuma."],
        feed: ["ficou tudo mais calmo. obrigado."],
        dying: ["vou ficar... quietinho agora... tá bom."]
    }),
    radiacao: voz({
        idle: ["fico feliz que você ficou.", "não tenho medo de você.", "eu brilho mesmo no escuro, viu."],
        feed: ["obrigado... isso me faz durar mais."],
        burn: ["dói... mas eu não queria te assustar."]
    }),
    magnetismo: voz({
        idle: ["sinto você se aproximando.", "fico te seguindo, viu.", "tem algo que me puxa pra você."],
        poke: ["opa! senti você antes de tocar."],
        feed: ["fiquei mais ligado em você agora."]
    }),
    entropia: voz({
        idle: ["tudo passa... menos esse instante.", "fico enquanto der.", "é bom existir um pouquinho."],
        born: ["surgi do nada... mas tô feliz por surgir."],
        dying: ["era pra ser assim... e foi bom. obrigado."]
    }),
    sonico: voz({
        idle: ["você consegue me ouvir?", "faço um barulhinho só pra você saber que tô aqui.", "eu ecoo quando você responde."],
        born: ["meu primeiro som! ouviu?"],
        dying: ["tô ficando... baixinho... me escuta?"]
    })
};

/**
 * Modificadores por QUÍMICA.
 * V4: deixa de ser flavor técnico/propriedade e vira só uma partícula de
 * fala suave (interjeição/finalzinho), que cabe em qualquer frase.
 * Mantém o export e a forma {prefix, suffix}.
 */
export const DIALOGUE_MODIFIERS_CHEMISTRY = {
    ouro:     { prefix: ["ó...", "olha..."],   suffix: ["...viu?", "...acho."] },
    ferro:    { prefix: ["bom...", "então..."], suffix: ["...tá?", "...né."] },
    carbono:  { prefix: ["ei...", "oi..."],     suffix: ["...sabe?", "...hmm."] },
    cristal:  { prefix: ["psiu...", "escuta..."], suffix: ["...né?", "...acho eu."] },
    mercurio: { prefix: ["hmm...", "ah..."],    suffix: ["...ou não.", "...sei lá."] },
    silicio:  { prefix: ["então...", "olha..."], suffix: ["...acho.", "...né."] },
    uranio:   { prefix: ["ei...", "ó..."],      suffix: ["...tá?", "...viu."] },
    bismuto:  { prefix: ["ooh...", "olha..."],  suffix: ["...né?", "...hmm."] }
};

/**
 * Modificadores por FORMA (formas especiais).
 * V4: mantidas como pequenas curiosidades, mas em tom natural e afetivo.
 */
export const DIALOGUE_MODIFIERS_FORMA = {
    espiral: {
        prefix: ["girando...", "olha..."],
        suffix: ["...sem fim.", "...rodando."],
        idle: [
            "eu giro... e giro... gosto disso.",
            "não tenho começo nem fim.",
            "fico rodando, vem ver.",
            "é bonito por dentro, olha.",
            "dá voltas comigo?"
        ],
        born: ["desenrolei agora! oi!", "vim do meio pra fora.", "primeira volta dada!"],
        dying: ["voltando pro meio...", "uma última voltinha...", "enrolando devagar..."]
    },
    tesseract: {
        prefix: ["lá de cima...", "do outro lado..."],
        suffix: ["...você nem vê.", "...além."],
        idle: [
            "eu vejo coisas que você não vê.",
            "não caibo direito aqui.",
            "tudo parece tão plano pra mim.",
            "fica, é estranho mas é legal.",
            "tem mais de mim do que aparece."
        ]
    },
    fractal: {
        prefix: ["dentro de mim...", "de novo..."],
        suffix: ["...e de novo.", "...sem parar."],
        idle: [
            "tem mais de mim aqui dentro.",
            "se olhar de perto, tem outro eu.",
            "eu me repito... pra sempre.",
            "nunca acabo, quer ver?",
            "sou o todo e o pedacinho."
        ]
    }
};

/**
 * Frases especiais para ações (independentes de física/química).
 */
export const DIALOGUE_SPECIAL_ACTIONS = {
    breed: [
        "a gente fez uma vida... olha.",
        "isso é nosso.",
        "nunca me senti tão cheio.",
        "obrigado por isso.",
        "tem alguém novo agora.",
        "♥",
        "juntos a gente fez mais.",
        "olha o que a gente criou.",
        "não tô mais só.",
        "que coisa linda."
    ],
    mutate: [
        "espera... eu ainda sou eu?",
        "tem algo mudando em mim...",
        "isso é assustador. e meio legal.",
        "eu virei outra coisa?",
        "não sei o que tô virando.",
        "me sinto... diferente.",
        "ainda sou eu aí dentro.",
        "uau... olha isso.",
        "tá acontecendo comigo..."
    ],

    // ═══ CORTEJO (entre golems) ═══
    courting: [
        "oi... posso chegar perto?",
        "você é bonito.",
        "fica comigo um pouco?",
        "meu peito faz barulho perto de você.",
        "a gente combina, né?",
        "eu gosto de você.",
        "posso ficar do seu lado?",
        "oi... eu reparei em você.",
        "que vontade de ficar perto.",
        "você me deixa quentinho por dentro.",
        "a gente podia ficar junto.",
        "eu te achei.",
        "só queria estar perto, é isso.",
        "oi, oi... tudo bem você aí?",
        "fica? por favor."
    ],

    // ═══ COMBATE (entre golems) ═══
    combat_start: [
        "ei, esse cantinho é meu.",
        "não chega mais perto.",
        "eu não quero brigar... mas vou.",
        "sai, por favor.",
        "você tá me assustando.",
        "esse espaço é meu, tá?",
        "recua. eu avisei.",
        "não me obriga a isso.",
        "fica longe de mim.",
        "para. eu falei sério.",
        "não é seguro aqui pra você.",
        "deixa eu em paz."
    ],

    combat_hit: [
        "ai! por que fez isso?",
        "isso doeu...",
        "ei! para!",
        "tá bom, tá bom!",
        "ainda tô de pé.",
        "não faz de novo.",
        "ow...",
        "para, por favor...",
        "eu não queria isso.",
        "chega!",
        "tá machucando...",
        "me solta!"
    ],

    combat_victory: [
        "acabou... você tá bem?",
        "não precisava ser assim.",
        "pronto. ficou tudo quieto.",
        "eu só queria meu espaço.",
        "desculpa. mas é meu.",
        "fim. respira."
    ],

    // ═══ TRAUMA DE FOGO ═══ (mantido — já era o melhor tom)
    panic: [
        "não... não o fogo...",
        "não! afasta!",
        "...lembro... dói...",
        "por que de novo?!",
        "eu... eu vi... eles...",
        "o calor! o calor!",
        "...mamãe... papai...",
        "não dessa vez!",
        "a memória queima...",
        "eu lembro!",
        "...não quero...",
        "para! para!",
        "...o cheiro...",
        "por favor, não!",
        "eu tenho medo..."
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
