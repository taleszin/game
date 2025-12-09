// ═══════════════════════════════════════════════════════════════════
// DIALOGUE DATABASE - Dados de Diálogo Externalizados
// Simula estrutura de resposta de API/Banco de Dados
// ═══════════════════════════════════════════════════════════════════

/**
 * Banco de frases por FÍSICA (Personalidade base)
 * Estrutura: { [physicsId]: { [context]: string[] } }
 */
export const DIALOGUE_BY_PHYSICS = {
    eletricidade: {
        idle: ["ZZZT! ZZZT!", "ENERGIA!!", "CARGA TOTAL!", "*faísca*", "VOLTAGEM OK!", "BZZZZ...", "ELÉTRONS!", "CIRCUITO VIVO!"],
        born: ["ZZAP! NASCI!", "CHOQUE INICIAL!", "SPARK!!", "ATIVADO!!"],
        poke: ["AI! CURTO!", "ZZZT! NÃO!", "DESCARGA!", "QUEM FOI?!"],
        feed: ["RECARGA!!", "AMPERES++!", "BATERIA UP!"],
        burn: ["SOBRECARGA!!", "FUSÍVEL!!", "QUEIMANDO!!"],
        freeze: ["C-C-CRISTAL...", "GELO... ZZZ...", "CONGELANDO..."],
        dying: ["energia... baixa...", "zzzt...", "apagando..."]
    },
    gravidade: {
        idle: ["P  E  S  O...", "Caindo...", "Denso...", "Atração...", "Centro...", "Órbita...", "Massa...", "Lento..."],
        born: ["Aterrisei...", "Chegando...", "Impacto...", "Pouso..."],
        poke: ["Pesado...", "Não empurra...", "Inamovível...", "Firmeza..."],
        feed: ["Absorvendo...", "Engolindo...", "Mais massa..."],
        burn: ["Derretendo...", "Colapsando...", "Quente..."],
        freeze: ["Cristalizando...", "Sólido...", "Parado..."],
        dying: ["Afundando...", "Sumindo...", "..."]
    },
    luz: {
        idle: ["Iluminando~", "Fótons...", "Brilho~", "Refletindo...", "Espectro...", "Ondas~", "Claridade...", "Aurora~"],
        born: ["Flash!", "Nasci brilhando~", "Primeira luz!", "Apareci~"],
        poke: ["Reflexo!", "Cintilando~", "Opalescente!", "Prisma!"],
        feed: ["Absorvendo luz~", "Mais brilho!", "Radiante!"],
        burn: ["Incandescente!", "Supernova!", "Branco quente!"],
        freeze: ["Luz fria...", "Congelando...", "Aurora boreal..."],
        dying: ["Escurecendo...", "Penumbra...", "Última luz..."]
    },
    calor: {
        idle: ["Quentinho~", "Fervendo!", "Brasas...", "Lava!", "Combustão!", "Quente...", "Plasma!", "Magma~"],
        born: ["Ignição!", "Acendi!", "Chama viva!", "Nascido do fogo!"],
        poke: ["Ai! Cuidado!", "Queima!", "Não toca!", "Quente demais!"],
        feed: ["Combustível!", "Mais lenha!", "Alimentando!"],
        burn: ["MÁXIMO!!", "EXPLOSÃO!", "INFERNO!"],
        freeze: ["Vapor...", "Esfriando...", "Tsc tsc..."],
        dying: ["Cinzas...", "Apagando...", "Última brasa..."]
    },
    frio: {
        idle: ["Geladinho...", "Cristal...", "Neve...", "Gelo...", "Zero graus...", "Frio...", "Inverno...", "Nevasca..."],
        born: ["Congelei~", "Flocos...", "Nasci do gelo~", "Primeiro floco!"],
        poke: ["Brr! Frio!", "Gelado!", "Craquelando...", "Cristal!"],
        feed: ["Esfriando mais!", "Nitrogênio!", "Sub-zero!"],
        burn: ["Derretendo...", "Não...", "Vapor..."],
        freeze: ["PERFEITO!", "Absoluto!", "Máximo gelo!"],
        dying: ["Sublimando...", "Evaporando...", "Último floco..."]
    },
    radiacao: {
        idle: ["☢ Ativo...", "Decaindo...", "Emitindo...", "Radioativo...", "Meia-vida...", "Partículas...", "Gama...", "Núcleo..."],
        born: ["Reação!", "Fissão!", "Ativado!", "Crítico!"],
        poke: ["Contaminando!", "Cuidado!", "Radiação!", "Isótopo!"],
        feed: ["Mais urânio!", "Enriquecendo!", "Plutônio!"],
        burn: ["MELTDOWN!", "CRÍTICO!", "EXPLOSÃO!"],
        freeze: ["Esfriando reator...", "Contenção...", "Barras de controle..."],
        dying: ["Decaindo...", "Meia-vida...", "Último átomo..."]
    },
    magnetismo: {
        idle: ["Atraindo~", "Pólo norte...", "Campo...", "Magnético...", "Repelindo...", "Indução...", "Fluxo...", "Tesla~"],
        born: ["Polarizado!", "Campo ativo!", "Norte-Sul!", "Orientado!"],
        poke: ["Repulsão!", "Atração!", "Bipolar!", "Oscilando!"],
        feed: ["Mais campo!", "Gauss++!", "Intensificando!"],
        burn: ["Desmagnetizando!", "Curie!", "Perdendo campo!"],
        freeze: ["Supercondutor!", "Zero resistência!", "Levitando!"],
        dying: ["Perdendo pólo...", "Neutro...", "Último gauss..."]
    }
};

/**
 * Modificadores de personalidade por QUÍMICA
 * Estrutura: { [chemId]: { prefix: string[], suffix: string[] } }
 */
export const DIALOGUE_MODIFIERS_CHEMISTRY = {
    ouro: {
        prefix: ["Brilho puro!", "Nobreza...", "Valor!", "24k!"],
        suffix: ["...dourado.", "...precioso.", "...nobre."]
    },
    ferro: {
        prefix: ["Blindagem!", "Resistente!", "Sólido!", "Forjado!"],
        suffix: ["...robusto.", "...firme.", "...forte."]
    },
    carbono: {
        prefix: ["Orgânico!", "Vida!", "Base!", "Fundamental!"],
        suffix: ["...vivo.", "...natural.", "...básico."]
    },
    cristal: {
        prefix: ["Perfeito!", "Facetas!", "Prismático!", "Geométrico!"],
        suffix: ["...cristalino.", "...puro.", "...angular."]
    },
    mercurio: {
        prefix: ["Fluido~", "Líquido~", "Mutável~", "Volátil~"],
        suffix: ["...mercurial.", "...instável.", "...fluido."]
    },
    silicio: {
        prefix: ["Processando...", "Binário!", "Digital!", "Chip!"],
        suffix: ["...computado.", "...lógico.", "...processado."]
    },
    uranio: {
        prefix: ["Instável!", "Crítico!", "Nuclear!", "Fissão!"],
        suffix: ["...radioativo.", "...atômico.", "...nuclear."]
    }
};

/**
 * Frases especiais para ações (independentes de física/química)
 */
export const DIALOGUE_SPECIAL_ACTIONS = {
    breed: ["♥ Amor! ♥", "Fusão!", "União~", "Juntos!", "Combinando!", "♥♥♥"],
    mutate: ["MUTANDO!", "TRANSFORMANDO!", "DNA++!", "EVOLUÇÃO!", "METAMORFOSE!", "ALTERANDO!"]
};

/**
 * Mapeamento de cores por física (para herança visual)
 */
export const PHYSICS_COLORS = {
    eletricidade: 0xffea00,
    calor: 0xff4d00,
    radiacao: 0x00ff00,
    gravidade: 0x9d00ff,
    luz: 0xffffff,
    frio: 0x0088ff,
    magnetismo: 0xff00aa
};

/**
 * Valores default de personalidade visual por física
 */
export const PHYSICS_PERSONALITY = {
    eletricidade: { eyeJitter: 3.0, blinkRate: 0.8, voicePitchMod: 150 },
    gravidade: { eyeJitter: 0.5, blinkRate: 1.5, voicePitchMod: -100 },
    luz: { eyeJitter: 1.0, blinkRate: 1.0, voicePitchMod: 50 },
    calor: { eyeJitter: 2.0, blinkRate: 0.7, voicePitchMod: 80 },
    frio: { eyeJitter: 0.3, blinkRate: 2.0, voicePitchMod: -50 },
    radiacao: { eyeJitter: 2.5, blinkRate: 0.5, voicePitchMod: 100 },
    magnetismo: { eyeJitter: 1.5, blinkRate: 1.2, voicePitchMod: 0 }
};

/**
 * Valores de resistência/modificadores por química
 */
export const CHEMISTRY_MODIFIERS = {
    carbono: { resistanceMod: 1.0, weightMod: 1.0, lineWidth: 2 },
    ferro: { resistanceMod: 1.5, weightMod: 1.3, lineWidth: 4 },
    silicio: { resistanceMod: 0.8, weightMod: 0.9, lineWidth: 2 },
    ouro: { resistanceMod: 1.2, weightMod: 1.1, lineWidth: 3 },
    cristal: { resistanceMod: 0.6, weightMod: 0.7, lineWidth: 1 },
    mercurio: { resistanceMod: 0.9, weightMod: 1.4, lineWidth: 5 }
};
