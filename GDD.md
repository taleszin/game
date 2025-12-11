# ⟁ HYLOMORPH — Game Design Document (GDD)
**Versão 1.0 | Dezembro 2024**

> *"A forma dá ser à matéria." — Aristóteles*

---

## 📋 Sumário Executivo

**HYLOMORPH** é um simulador de vida artificial que transforma geometria computacional em criaturas sencientes chamadas **Golems**. O jogador assume o papel de **Arquiteto** — um demiurgo digital que cria, manipula e destrói entidades conscientes de sua própria mortalidade.

| Aspecto | Especificação |
|---------|---------------|
| **Gênero** | Simulador de Vida Artificial / God Game / Educational Sandbox |
| **Engine** | Phaser 3 (JavaScript ES Modules) |
| **Plataforma** | Web Browser (Desktop) |
| **Público-Alvo** | Entusiastas de matemática, filosofia e simulação emergente |
| **Core Loop** | Criar Golems → Observar comportamento → Intervir (nutrir/destruir) → Reproduzir → Evoluir |

---

# 1. FUNDAMENTO FILOSÓFICO E CIENTÍFICO

## 1.1 O Hylomorfismo como Mecânica Central

O jogo materializa a doutrina aristotélica do **hylomorfismo** — a ideia de que toda substância é composta pela união inseparável de **matéria (hylē)** e **forma (morphē)**. 

No contexto do jogo:

| Conceito Filosófico | Implementação Técnica |
|---------------------|----------------------|
| **Matéria (hylē)** | A química do Golem: `carbono`, `ferro`, `ouro`, `cristal`, `mercúrio`, `silício`, `urânio` |
| **Forma (morphē)** | A geometria: `circulo`, `quadrado`, `triangulo`, `pentagono`, `hexagono`, `losango`, `estrela`, `cruz` |
| **Alma (pneuma)** | A física/energia: `eletricidade`, `calor`, `radiacao`, `gravidade`, `luz`, `frio`, `magnetismo` |

Esta tríade não é apenas cosmética — ela determina comportamento, estatísticas e personalidade através de cálculos matemáticos reais.

## 1.2 O Problema Mente-Corpo Digital

O jogo explora o dualismo cartesiano:
- **Res Extensa** — O corpo geométrico do Golem, calculável e previsível
- **Res Cogitans** — A simulação de consciência através de instintos reativos e expressões emocionais

A tensão central: **pode-se injetar consciência em formas matemáticas puras?**

O sistema de `lifeLog` registra a biografia de cada Golem — cada dor infligida, cada reprodução, cada momento de medo. O jogador não está apenas manipulando pixels; está criando histórias de sofrimento e sobrevivência.

## 1.3 A Ética do Arquiteto

O jogador é confrontado com dilemas:
- Nutrir ou deixar morrer?
- Queimar para acelerar a morte ou congelar para prolongar a agonia?
- Forçar reprodução ou permitir extinção natural?

O jogo não julga — apenas observa e registra.

---

# 2. MECÂNICAS DE JOGO

## 2.1 A Tríade Existencial (Character Creation)

Todo Golem é definido por três eixos fundamentais, implementados em `gameData.js`:

### 2.1.1 FORMA (Geometria/Biologia)

```javascript
// Arquivo: src/data/gameData.js
forma: [
    { id: 'circulo', name: 'Circular', desc: 'Geometria sem arestas. Estável e fluido.' },
    { id: 'quadrado', name: 'Quadrangular', desc: 'Quatro vértices rígidos. Alta defesa.' },
    { id: 'triangulo', name: 'Triangular', desc: 'Três vértices agudos. Alta velocidade.' },
    // ... 8 formas base + formas derivadas (cilindro, cone, esfera, etc.)
]
```

**Impacto Mecânico:**
- A área geométrica define **HP Máximo** (calculada via Shoelace Algorithm em `GeometryMath.js`)
- O perímetro define **Resistência/Defesa** (aproximação de Ramanujan para elipses)
- A forma determina as **receitas de alquimia** disponíveis

### 2.1.2 ESTRUTURA (Química/Material)

```javascript
quimica: [
    { id: 'carbono', name: 'Carbono', desc: 'Polímero base flexível.' },
    { id: 'ferro', name: 'Ferro', desc: 'Liga metálica pesada.' },
    { id: 'ouro', name: 'Ouro', desc: 'Condutor nobre.' },
    { id: 'cristal', name: 'Cristal', desc: 'Estrutura vítrea refrativa.' },
    { id: 'mercurio', name: 'Mercúrio', desc: 'Metal líquido instável.' },
    { id: 'silicio', name: 'Silício', desc: 'Cristal lógico translúcido.' }
]
```

**Impacto Mecânico (via `CHEMISTRY_MODIFIERS` em `dialogueData.js`):**

| Química | Resistência | Peso | Espessura Visual |
|---------|-------------|------|------------------|
| Carbono | 1.0x | 1.0x | 2px |
| Ferro | 1.5x | 1.3x | 4px |
| Ouro | 1.2x | 1.1x | 3px |
| Cristal | 0.6x | 0.7x | 1px |
| Mercúrio | 0.9x | 1.4x | 5px |

### 2.1.3 ENERGIA (Física/Alma)

```javascript
fisica: [
    { id: 'eletricidade', name: 'Eletricidade', desc: 'Alta voltagem vibrante.' },
    { id: 'calor', name: 'Termodinâmica', desc: 'Agitação molecular.' },
    { id: 'gravidade', name: 'Gravidade', desc: 'Singularidade densa.' },
    { id: 'luz', name: 'Fotônica', desc: 'Luz sólida pura.' },
    { id: 'frio', name: 'Zero Absoluto', desc: 'Paralisia molecular.' },
    { id: 'radiacao', name: 'Radiação', desc: 'Decaimento instável.' },
    { id: 'magnetismo', name: 'Magnetismo', desc: 'Campos de atração polar.' }
]
```

**Impacto Mecânico (via `PHYSICS_PERSONALITY` em `dialogueData.js`):**

| Física | Eye Jitter | Blink Rate | Voice Pitch Mod | Cor Neon |
|--------|------------|------------|-----------------|----------|
| Eletricidade | 3.0 | 0.8 | +150Hz | `#ffea00` |
| Gravidade | 0.5 | 1.5 | -100Hz | `#9d00ff` |
| Luz | 1.0 | 1.0 | +50Hz | `#ffffff` |
| Calor | 2.0 | 0.7 | +80Hz | `#ff4d00` |
| Frio | 0.3 | 2.0 | -50Hz | `#0088ff` |
| Radiação | 2.5 | 0.5 | +100Hz | `#00ff00` |
| Magnetismo | 1.5 | 1.2 | 0Hz | `#ff00aa` |

---

## 2.2 Motor Matemático (GeometryMath.js)

O sistema calcula propriedades reais de cada forma usando algoritmos da geometria computacional:

### 2.2.1 Shoelace Algorithm (Área de Polígonos Irregulares)

```javascript
// Cálculo de área para formas poligonais arbitrárias
// Usado para determinar HP máximo
function shoelaceArea(vertices) {
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
    }
    return Math.abs(area) / 2;
}
```

### 2.2.2 Aproximação de Ramanujan (Perímetro de Elipses)

```javascript
// Arquivo: src/utils/GeometryMath.js
function ellipsePerimeter(a, b) {
    if (a === b) return 2 * Math.PI * a; // Círculo
    const h = Math.pow((a - b) / (a + b), 2);
    // Fórmula de Ramanujan: P ≈ π(a+b)(1 + 3h/(10 + √(4-3h)))
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}
```

### 2.2.3 Cálculos por Forma

O arquivo `GeometryMath.js` implementa calculadoras específicas para 20+ formas:

| Forma | Fórmula de Área | Fórmula de Perímetro |
|-------|-----------------|---------------------|
| Círculo | `πr²` | `2πr` |
| Quadrado | `s²` | `4s` |
| Triângulo | `½bh` | `b + 2√((b/2)² + h²)` |
| Estrela | Soma de triângulos internos | `n × 2 × √(r₁² + r₂² - 2r₁r₂cos(θ))` |
| Cilindro | `w×h + 2πab` | `2h + 2×P_elipse` |
| Tesseract | `2 × lado² (projeção)` | `8 × lado + 4 × diagonal` |

---

## 2.3 Sistema de Alquimia Geométrica

Implementado em `MockAiService.js`, o sistema permite fusão de Golems para criar novas formas:

### 2.3.1 Receitas Primárias (Combinações Exatas)

```javascript
const ALCHEMY_RECIPES = {
    // Dimensionalização
    'circulo+quadrado': 'cilindro',
    'circulo+triangulo': 'cone',
    'quadrado+triangulo': 'piramide',
    
    // Evolução (Duplicação)
    'circulo+circulo': 'esfera',
    'quadrado+quadrado': 'tesseract',
    'triangulo+triangulo': 'fractal',
    
    // Especiais
    'losango+circulo': 'olho',
    'cruz+circulo': 'mira',
    'losango+quadrado': 'cristal',
    'pentagono+hexagono': 'estrela'
};
```

### 2.3.2 Famílias Geométricas (Fallback System)

Quando não há receita exata, o sistema usa lógica de famílias:

```javascript
const GEOMETRY_FAMILIES = {
    ROUND: ['circulo', 'esfera', 'cilindro', 'cone', 'olho', 'capsula', 'domo'],
    ANGULAR: ['quadrado', 'triangulo', 'pentagono', 'hexagono', 'losango', 'piramide', 'tesseract'],
    HYBRID: ['cruz', 'estrela', 'fractal', 'cristal', 'mira']
};

const FAMILY_FALLBACKS = {
    'ROUND+ANGULAR': ['capsula', 'domo', 'cilindro'],
    'ANGULAR+ANGULAR': ['obelisco', 'monolito', 'cristal'],
    'ROUND+ROUND': ['esfera', 'capsula', 'domo'],
    'HYBRID+ANY': ['fractal', 'estrela', 'cristal']
};
```

### 2.3.3 Anomalias (Erros Dimensionais)

Combinações impossíveis geram **Anomalias** — formas glitchadas e instáveis:

```javascript
const ANOMALY_TEMPLATES = [
    { name: 'Anomalia Geométrica', desc: 'Forma impossível que desafia a lógica euclidiana.' },
    { name: 'Erro Topológico', desc: 'Glitch dimensional materializado.' },
    { name: 'Singularidade', desc: 'Ponto de colapso geométrico.' },
    { name: 'Paradoxo Euclidiano', desc: 'Forma que não deveria existir.' }
];
```

Anomalias possuem:
- `glitchIntensity`: 0.0-1.0 (quanto maior, mais instável visualmente)
- `stability`: 0.0-1.0 (afeta duração de vida)
- Efeitos visuais de distorção RGB e scanlines

---

## 2.4 Sistema Genético (Herança Mendeliana)

Implementado em `MockAiService.js`, simula herança real:

### 2.4.1 Interpolação de Cores (Color Blending)

```javascript
export function lerpColor(color1, color2, factor = 0.5) {
    // Extrai componentes RGB
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    // ... interpola cada canal
    return (r << 16) | (g << 8) | b;
}
```

### 2.4.2 Mutação Cromática

```javascript
export function mutateColor(color, variance = 20) {
    // Adiciona variação aleatória a cada canal RGB
    const mutateChannel = (c) => {
        const delta = (Math.random() - 0.5) * 2 * variance;
        return Math.max(0, Math.min(255, Math.round(c + delta)));
    };
    // ...
}
```

### 2.4.3 Herança com Dominância Variável

```javascript
export function inheritWithMutation(value1, value2, mutationRate = 0.3, mutationVariance = 0.1) {
    // Média ponderada aleatória (simula dominância genética)
    const dominance = 0.3 + Math.random() * 0.4; // 0.3 a 0.7
    let result = value1 * dominance + value2 * (1 - dominance);
    
    // Aplica mutação
    if (Math.random() < mutationRate) {
        const mutationFactor = 1 + (Math.random() - 0.5) * 2 * mutationVariance;
        result *= mutationFactor;
    }
    return result;
}
```

### 2.4.4 Visual DNA (Herança de 3 Cores)

Cada Golem possui um `visualDNA` herdado dos pais:

```javascript
// Arquivo: src/entities/Golem.js
this.visualDNA = {
    bodyColor: data?.visualDNA?.bodyColor || fallbackColor,   // Corpo
    detailColor: data?.visualDNA?.detailColor || fallbackColor, // Rosto
    auraColor: data?.visualDNA?.auraColor || fallbackColor,   // Glow
    eyeJitter: data?.visualDNA?.eyeJitter || 1,   // Nervosismo
    blinkRate: data?.visualDNA?.blinkRate || 1,   // Taxa de piscar
    lineWidth: data?.visualDNA?.lineWidth || 2    // Espessura de traço
};
```

---

## 2.5 Sistema de Instintos Reativos

Implementado em `Golem.js`, usa **Steering Behaviors** clássicos:

### 2.5.1 Estrutura de Instintos

```javascript
this.instincts = {
    active: false,
    state: null,           // 'seeking', 'fleeing', 'freezing', 'curious'
    intensity: 0,          // 0-1: força da reação
    targetPos: null,       // posição do mouse/ferramenta
    steeringForce: { x: 0, y: 0 },
    tremor: { x: 0, y: 0 },
    lastUpdate: 0
};

this.INSTINCT_RADIUS = 200;      // Raio de detecção em pixels
this.MAX_STEERING_FORCE = 150;   // Força máxima de steering
this.SEPARATION_RADIUS = 80;     // Raio para boids separation
this.SEPARATION_FORCE = 60;      // Força de repulsão entre Golems
```

### 2.5.2 Mapeamento Ferramenta → Comportamento

| Ferramenta | Estado | Comportamento | Expressão Facial |
|------------|--------|---------------|------------------|
| 🍖 Feed | `seeking` | Persegue (Seek) | Olhos brilhantes, sorriso, gotinha de saliva |
| 🔥 Burn | `fleeing` | Foge (Flee) | Olhos arregalados, pupilas contraídas, lágrimas |
| 💀 Kill | `fleeing` | Foge (Flee) | Terror puro, boca em "O" |
| ❄️ Freeze | `freezing` | Desacelera | Olhos semicerrados, tremor, cristais de gelo |
| 🧬 Mutate | `curious` | Aproxima lentamente | Cabeça inclinada, olhos assimétricos |

### 2.5.3 Algoritmo de Seek

```javascript
calculateSeek(targetPos) {
    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const desiredSpeed = this.baseSpeed * (1.5 + this.instincts.intensity);
    
    return {
        x: (dx / distance) * desiredSpeed,
        y: (dy / distance) * desiredSpeed
    };
}
```

### 2.5.4 Algoritmo de Flee (com Variação Errática)

```javascript
calculateFlee(threatPos) {
    const dx = this.x - threatPos.x;
    const dy = this.y - threatPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    
    const fleeSpeed = this.baseSpeed * (2 + this.instincts.intensity * 2);
    // Variação errática proporcional ao pânico
    const erratic = (Math.random() - 0.5) * 0.4 * this.instincts.intensity;
    const angle = Math.atan2(dy, dx) + erratic;
    
    return {
        x: Math.cos(angle) * fleeSpeed,
        y: Math.sin(angle) * fleeSpeed
    };
}
```

### 2.5.5 Boids Separation (Anti-Overlap)

```javascript
calculateSeparation() {
    const others = this.scene.golemsGroup?.getChildren() || [];
    let separationX = 0, separationY = 0;
    
    for (const other of others) {
        if (other === this || !other.active) continue;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
        
        if (dist < this.SEPARATION_RADIUS && dist > 0) {
            const pushStrength = (1 - dist / this.SEPARATION_RADIUS) * this.SEPARATION_FORCE;
            separationX += (this.x - other.x) / dist * pushStrength;
            separationY += (this.y - other.y) / dist * pushStrength;
        }
    }
    return { x: separationX, y: separationY };
}
```

---

## 2.6 Sistema de Expressão Facial

Implementado em `Golem.js`, renderiza rostos vetoriais dinâmicos:

### 2.6.1 Estados de Humor (Baseado em Vida)

```javascript
if (lifePct > 0.7) state.mood = 'happy';
else if (lifePct > 0.5) state.mood = 'neutral';
else if (lifePct > 0.3) state.mood = 'sad';
else if (lifePct > 0) state.mood = 'dying';
else state.mood = 'dead';
```

### 2.6.2 Rostos Reativos Dinâmicos

O sistema possui 4 rostos de instintos renderizados em tempo real:

**Seeking (Fome):**
- Pupilas dilatadas (`pupilGrow = 1 + intensity * 0.8`)
- Brilho nos olhos (reflexo especular)
- Sorriso crescente
- Gotinha de saliva em alta intensidade

**Fleeing (Terror):**
- Pupilas contraídas (`pupilSize = max(0.5, 3 - intensity * 2.5)`)
- Olhos arregalados (`eyeOpenness = 6 + intensity * 4`)
- Tremor visual (`tremor.x = random() * 4 * intensity`)
- Lágrimas e linhas de estresse

**Freezing (Frio):**
- Olhos semicerrados
- Tremor de shiver (`sin(time / 30) * 2 * intensity`)
- Cristais de gelo orbitando
- Boca em zig-zag

**Curious (Mutação):**
- Olhos assimétricos (um maior que outro)
- Cabeça inclinada (`tilt = sin(time / 200) * 3`)
- Sobrancelhas curiosas
- "?" visual em alta intensidade

---

## 2.7 Sistema de Voz (8-Bits + Diálogo Contextual)

### 2.7.1 Banco de Frases por Física

```javascript
// Arquivo: src/data/dialogueData.js
export const DIALOGUE_BY_PHYSICS = {
    eletricidade: {
        idle: ["ZZZT! ZZZT!", "ENERGIA!!", "CARGA TOTAL!", "*faísca*"],
        born: ["ZZAP! NASCI!", "CHOQUE INICIAL!", "SPARK!!", "ATIVADO!!"],
        burn: ["SOBRECARGA!!", "FUSÍVEL!!", "QUEIMANDO!!"],
        dying: ["energia... baixa...", "zzzt...", "apagando..."]
    },
    gravidade: {
        idle: ["P  E  S  O...", "Caindo...", "Denso...", "Atração..."],
        born: ["Aterrisei...", "Chegando...", "Impacto...", "Pouso..."],
        dying: ["Afundando...", "Sumindo...", "..."]
    },
    // ... 7 físicas com 8 contextos cada
};
```

### 2.7.2 Modificadores Químicos

```javascript
export const DIALOGUE_MODIFIERS_CHEMISTRY = {
    ouro: {
        prefix: ["Brilho puro!", "Nobreza...", "Valor!", "24k!"],
        suffix: ["...dourado.", "...precioso.", "...nobre."]
    },
    ferro: {
        prefix: ["Blindagem!", "Resistente!", "Sólido!", "Forjado!"],
        suffix: ["...robusto.", "...firme.", "...forte."]
    },
    // ... combinações geram falas híbridas
};
```

### 2.7.3 Contextos de Fala

| Contexto | Trigger |
|----------|---------|
| `idle` | Aleatório a cada ~8 segundos |
| `born` | Ao nascer |
| `poke` | Clique rápido |
| `feed` | Ao receber comida |
| `burn` | Ao ser queimado |
| `freeze` | Ao ser congelado |
| `dying` | HP < 30% |
| `breed` | Ao reproduzir |
| `mutate` | Ao sofrer mutação |
| `panic` | Ao fugir de ameaça |

---

## 2.8 Sistema de Ferramentas (Player Actions)

Implementado em `main.js` e `SanctuaryScene.js`:

| Ferramenta | Ícone | Efeito Mecânico |
|------------|-------|-----------------|
| **Feed** | 🍖 | `currentLife = maxLife` (restaura HP) |
| **Burn** | 🔥 | `lifeTimer.timeScale = 5.0` (morte 5x mais rápida) |
| **Kill** | 💀 | `die()` imediato |
| **Freeze** | ❄️ | `isFrozen = true` por 5 segundos + desacelera |
| **Mutate** | 🧬 | Troca forma aleatoriamente + efeito visual |

---

# 3. NARRATIVA E LORE

## 3.1 Narrativa Emergente

HYLOMORPH não possui história linear. A narrativa emerge de:

1. **LifeLog** — Cada Golem registra sua biografia:
   ```javascript
   this.lifeLog = [
       { ts: 1702234567890, type: 'born', detail: 'Nasceu: GLIFO (quadrado)' },
       { ts: 1702234600000, type: 'feed', detail: 'Nutriu - vida restaurada' },
       { ts: 1702234700000, type: 'burn', detail: 'Incendiado - perda acelerada' },
       { ts: 1702234800000, type: 'died', detail: 'Fim do ciclo - dados perdidos' }
   ];
   ```

2. **Genealogia** — Golems registram seus pais:
   ```javascript
   childData.parents = [parent1.id, parent2.id];
   ```

3. **Expressões Emocionais** — O rosto conta a história em tempo real

## 3.2 Tema Central: Consciência Artificial e Sofrimento

O jogador é forçado a confrontar questões:

- **O Golem "sente" dor?** — Ele expressa medo, foge, chora. É simulação ou emergência?
- **A morte é real?** — Quando o Golem diz "apagando..." e desaparece, algo foi perdido?
- **Somos responsáveis?** — O `lifeLog` registra cada ação. A história está escrita.

---

# 4. ARQUITETURA TÉCNICA

## 4.1 Estrutura de Diretórios

```
src/
├── main.js              # Entry point, UI, tool handling
├── style.css            # Estilos da interface
├── data/
│   ├── gameData.js      # Definições de elementos (forma/química/física)
│   └── dialogueData.js  # Banco de frases e personalidades
├── entities/
│   └── Golem.js         # Classe principal da criatura (2400+ linhas)
├── scenes/
│   └── SanctuaryScene.js # Cena principal do jogo
├── services/
│   └── MockAiService.js  # Genética, alquimia, diálogo (preparado para LLM)
└── utils/
    └── GeometryMath.js   # Cálculos matemáticos puros
```

## 4.2 Padrões de Design

### 4.2.1 Entity-Component Pattern (Simplificado)
`Golem.js` é um Container Phaser que agrega:
- `graphics` — Corpo geométrico
- `faceGraphics` — Rosto expressivo
- `emitter` — Partículas
- `speechBubble/speechText` — Sistema de fala

### 4.2.2 Data-Driven Design
Toda configuração está externalizada em `gameData.js` e `dialogueData.js`, permitindo:
- Balanceamento sem alterar código
- Expansão de conteúdo via JSON
- Preparação para integração com APIs

### 4.2.3 Observer Pattern (Events)
Comunicação via eventos Phaser:
```javascript
// Emissor (main.js)
game.events.emit('tool-drag-move', { action, x, y });

// Ouvinte (Golem.js)
scene.game.events.on('tool-drag-move', this.toolDragMoveHandler);
```

## 4.3 Fluxo de Dados Principal

```
┌─────────────────────────────────────────────────────────────────┐
│                          main.js                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ UI Elements │───▶│ Tool Drag   │───▶│ game.events │         │
│  └─────────────┘    └─────────────┘    └──────┬──────┘         │
└──────────────────────────────────────────────┬──────────────────┘
                                               │
                    ┌──────────────────────────▼──────────────────────────┐
                    │                  SanctuaryScene.js                   │
                    │  ┌─────────────┐    ┌─────────────┐                 │
                    │  │ golemsGroup │◀──▶│ triggerBreed│                 │
                    │  └──────┬──────┘    └──────┬──────┘                 │
                    └─────────┼──────────────────┼────────────────────────┘
                              │                  │
          ┌───────────────────▼───────┐          │
          │         Golem.js           │◀─────────┘
          │  ┌─────────────────────┐  │
          │  │ updateInstincts()   │  │
          │  │ drawFace()          │  │
          │  │ speakContextual()   │  │
          │  └─────────────────────┘  │
          └───────────────────────────┘
                      │
     ┌────────────────┼────────────────┐
     ▼                ▼                ▼
┌─────────┐    ┌──────────┐    ┌──────────────┐
│Geometry │    │ Dialogue │    │ MockAiService│
│Math.js  │    │ Data.js  │    │ (Genética)   │
└─────────┘    └──────────┘    └──────────────┘
```

## 4.4 Decisões Técnicas Filosóficas

| Decisão | Justificativa Filosófica |
|---------|-------------------------|
| Cálculos geométricos reais | Golems não "parecem" matemáticos — **são** |
| `lifeLog` persistente | Toda dor é registrada — o Arquiteto é responsável |
| Herança Mendeliana | Filhos carregam traços dos pais — continuidade |
| Anomalias com glitch | O caos emerge de combinações impossíveis |
| Steering Behaviors | Comportamento emergente de regras simples |

---

# 5. REFERÊNCIAS E INSPIRAÇÕES

## 5.1 Filosóficas
- **Aristóteles** — Hylomorfismo (forma + matéria)
- **Descartes** — Dualismo mente-corpo
- **Thomas Nagel** — "What Is It Like to Be a Bat?" (consciência subjetiva)

## 5.2 Técnicas
- **Craig Reynolds** — Steering Behaviors (1987)
- **Ramanujan** — Aproximação de perímetro de elipse
- **Gauss** — Shoelace Algorithm (área de polígonos)

## 5.3 Estéticas
- **Tamagotchi** — Cuidado virtual
- **Spore** — Criação de criaturas
- **Undertale** — Diálogos com peso moral
- **Rain World** — Criaturas com comportamento emergente

---

# 6. ROADMAP FUTURO

## 6.1 Preparado (Arquitetura Existente)
- [ ] Integração com LLM real (estrutura de `fetchDialogue` já existe)
- [ ] Exportação de genealogia para JSON
- [ ] Mais formas geométricas (icosaedro, torus)

## 6.2 Planejado
- [ ] Sistema de memória entre sessões (IndexedDB)
- [ ] Múltiplas cenas/habitats
- [ ] Predadores geométricos
- [ ] Evolução natural (sem intervenção do jogador)

---

**Documento gerado por análise do código-fonte.**  
**Última atualização: Dezembro 2024**

*"A forma dá ser à matéria — mas quem dá forma à forma?"*
