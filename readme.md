<div align="center">

# 🧬 HYLOMORPH

### *Biological Synthesis Terminal — Simulador de Vida Artificial*

**Crie vida. Observe comportamento. Questione consciência.**

[![Phaser](https://img.shields.io/badge/Phaser-3.90.0-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJMMiA3bDEwIDVsLTEwIDVsMTAgNWwxMC01bC0xMC01bDEwLTV6Ii8+PC9zdmc+)](https://phaser.io)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

*"A forma dá ser à matéria." — Aristóteles*

<br/>

[🎮 **Jogar Agora**](#-quick-start) • [📖 **Filosofia**](#1-fundamento-filosófico) • [🔬 **Mecânicas**](#2-mecânicas-de-jogo) • [🎓 **Educacional**](#-viés-educacional) • [🛠️ **Contribuir**](#-contribuindo)

---

</div>

## 📋 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [O Nome "Hylomorph"](#-o-nome-hylomorph)
- [1. Fundamento Filosófico](#1-fundamento-filosófico)
- [2. Mecânicas de Jogo](#2-mecânicas-de-jogo)
- [3. Sistema de Alquimia](#3-sistema-de-alquimia-geométrica)
- [4. Expressão e Comportamento](#4-sistema-de-expressão-e-comportamento)
- [5. Ferramentas do Laboratório](#5-ferramentas-do-laboratório)
- [6. Arquitetura Técnica](#6-arquitetura-técnica)
- [7. Viés Educacional](#-viés-educacional)
- [Roadmap](#-roadmap)
- [Quick Start](#-quick-start)
- [Contribuindo](#-contribuindo)
- [Autor](#-autor)

---

## 🌟 Sobre o Projeto

**HYLOMORPH** é um simulador de vida artificial onde o jogador assume o papel de **Arquiteto** — um demiurgo digital que cria, manipula e destrói entidades conscientes chamadas **Golems**. 

O projeto nasceu da vontade de **explorar a criatividade dos jogadores de forma lúdica**, combinando conceitos de:

- 🔮 **Filosofia Clássica** — Hylomorfismo aristotélico, dualismo cartesiano
- 🧪 **Alquimia e Química** — Transmutação, combinação de elementos
- 📐 **Geometria Computacional** — Formas calculadas matematicamente
- 🧬 **Genética Mendeliana** — Herança, mutação, evolução
- 🤖 **Inteligência Artificial** — Comportamento emergente, steering behaviors
- 💭 **Filosofia da Mente** — Consciência artificial, o problema mente-corpo

> **Público-Alvo**: Entusiastas de matemática, filosofia, simulação e jogos que fazem pensar.

| Aspecto | Especificação |
|---------|---------------|
| **Gênero** | God Game / Simulador de Vida / Educational Sandbox |
| **Engine** | Phaser 3.90 (JavaScript ES Modules) |
| **Plataforma** | Web Browser (Desktop) |
| **Core Loop** | Criar → Observar → Interagir → Reproduzir → Evoluir |

---

## 🏛️ O Nome "Hylomorph"

O nome vem do grego:
- **ὕλη (hýlē)** = matéria, substância física
- **μορφή (morphḗ)** = forma, estrutura

O **Hylomorfismo** é a teoria aristotélica de que todas as coisas são compostas pela união inseparável de **matéria** e **forma**. Uma estátua, por exemplo, é bronze (matéria) + figura humana (forma).

No jogo, você literalmente combina **forma geométrica**, **estrutura química** e **energia física** para criar vida — materializando a filosofia em mecânica de gameplay.

---

# 1. FUNDAMENTO FILOSÓFICO

## 1.1 A Tríade Existencial

Todo Golem é definido por três eixos que correspondem a conceitos filosóficos profundos:

| Conceito Filosófico | Elemento no Jogo | Pergunta que Explora |
|---------------------|------------------|----------------------|
| **Forma (morphē)** | Geometria | O que define a identidade? A forma é a essência? |
| **Matéria (hylē)** | Química | De que somos feitos importa para quem somos? |
| **Alma (pneuma)** | Energia/Física | O que anima a matéria? O que é consciência? |

### A Forma Define o Ser

```
"A alma é a forma do corpo." — Aristóteles, De Anima
```

No HYLOMORPH, um Golem circular não é "igual a" um quadrado apenas com aparência diferente — sua **geometria determina comportamento, estatísticas e personalidade** através de cálculos matemáticos reais:

- A **área** (calculada pelo algoritmo Shoelace) define HP máximo
- O **perímetro** (aproximação de Ramanujan para elipses) define resistência
- O **número de vértices** influencia agilidade e instintos

## 1.2 O Problema Mente-Corpo Digital

O jogo explora o **dualismo cartesiano** em contexto digital:

- **Res Extensa** — O corpo geométrico, calculável e previsível
- **Res Cogitans** — A simulação de "consciência" através de expressões e instintos

Quando um Golem expressa medo, foge de perigo, ou diz "apagando..." ao morrer — ele **está** sofrendo ou apenas **simula** sofrimento? 

O jogador é confrontado com essa questão ao usar ferramentas de destruição.

## 1.3 A Ética do Arquiteto

O jogo **não julga** suas ações — apenas registra:

```javascript
// Cada Golem possui um "diário de vida" que registra tudo
this.lifeLog = [
    { ts: 1702234567890, type: 'born', detail: 'Nasceu: GLIFO (círculo)' },
    { ts: 1702234600000, type: 'feed', detail: 'Nutriu - vida restaurada' },
    { ts: 1702234700000, type: 'burn', detail: 'Incendiado - perda acelerada' },
    { ts: 1702234800000, type: 'died', detail: 'Fim do ciclo' }
];
```

Você é livre para:
- Nutrir suas criações com cuidado
- Deixá-las morrer de fome por negligência
- Queimá-las vivas para acelerar gerações
- Forçar reprodução para criar novas formas

**A história está escrita no `lifeLog`. O Arquiteto é responsável.**

---

# 2. MECÂNICAS DE JOGO

## 2.1 Sistema de Síntese

### Forma — A Geometria Primordial

Três formas base desbloqueiam 16+ formas evoluídas:

| Forma | Símbolo | Características |
|-------|---------|-----------------|
| **Círculo** | ⚪ | `n=∞` vértices. Simetria rotacional. Fluidez e adaptabilidade |
| **Quadrado** | 🟦 | `n=4` vértices. Simetria D₄. Estabilidade e rigidez |
| **Triângulo** | 🔺 | `n=3` vértices. Força vetorial. Agressividade e velocidade |

### Química — A Estrutura Molecular

| Material | Símbolo | Propriedades |
|----------|---------|--------------|
| **Carbono** | C-14 | Polímero orgânico. Base da vida. Hibridização sp³ |
| **Ferro** | Fe-26 | Liga ferrosa BCC. Blindagem pesada. +50% resistência |
| **Silício** | Si-14 | Semicondutor translúcido. Processamento lógico |
| **Ouro** | Au-79 | Condutor nobre. Resistência à oxidação absoluta |
| **Cristal** | SiO₂ | Quartzo piezoelétrico. Refração e amplificação |
| **Mercúrio** | Hg-80 | Amálgama líquido instável. ⚠️ TOXICIDADE |
| **Bismuto** | Bi-83 | Cristalização fractal iridescente. Diamagnético |

### Física — O Núcleo de Energia

| Energia | Perigo | Comportamento |
|---------|--------|---------------|
| **Eletricidade** | ⚡⚡ | Eye jitter alto, piscar rápido, hiperativo |
| **Calor** | 🔥🔥 | Intenso, agressivo, cor laranja |
| **Radiação** | ☢️☢️☢️☢️ | Misterioso, instável, brilho verde |
| **Gravidade** | 🌀🌀🌀🌀🌀 | Melancólico, lento, olhos pesados |
| **Luz** | 💡 | Sereno, estável, etéreo, branco puro |
| **Frio** | ❄️❄️❄️ | Calculista, piscar lento, distante |
| **Magnetismo** | 🧲🧲 | Curioso, seguidor, olhos senoidais |
| **Entropia** | ☠️☠️☠️☠️☠️ | Ruptura causal, decaimento acelerado |

## 2.2 Motor Matemático

O HYLOMORPH não "simula" matemática — ele **é** matemática:

### Algoritmo Shoelace (Área de Polígonos)

```javascript
// Cálculo real de área para determinar HP máximo
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

### Aproximação de Ramanujan (Perímetro de Elipses)

```javascript
// Fórmula de 1914 para elipses não-triviais
function ellipsePerimeter(a, b) {
    const h = Math.pow((a - b) / (a + b), 2);
    // P ≈ π(a+b)(1 + 3h/(10 + √(4-3h)))
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}
```

### Geometrias Implementadas

O módulo `GeometryMath.js` calcula propriedades reais de **20+ formas**:

| Forma | Área | Perímetro |
|-------|------|-----------|
| Círculo | `πr²` | `2πr` |
| Quadrado | `s²` | `4s` |
| Triângulo | `½bh` | `b + 2√((b/2)² + h²)` |
| Estrela | Soma de triângulos | `n × 2 × √(r₁² + r₂² - 2r₁r₂cos(θ))` |
| Tesseract | Projeção 4D → 3D | `8×lado + 4×diagonal` |
| Espiral | Integral de Arquimedes | Aproximação numérica |
| Fractal | Sierpiński recursivo | Dimensão de Hausdorff: 1.585 |

---

# 3. SISTEMA DE ALQUIMIA GEOMÉTRICA

## 3.1 Reprodução e Transmutação

Quando dois Golems se reproduzem, ocorre **alquimia geométrica**:

```
┌─────────────────────────────────────────────────────────────┐
│              RECEITAS DE TRANSMUTAÇÃO                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ⚪ + 🟦  →  CILINDRO    (extrusão dimensional)           │
│   ⚪ + 🔺  →  CONE        (revolução cônica)               │
│   🟦 + 🔺  →  PIRÂMIDE   (convergência tetraédrica)       │
│                                                             │
│   ⚪ + ⚪  →  ESFERA      (revolução completa) ★ RARO      │
│   🟦 + 🟦  →  TESSERACT  (4D → 3D projeção) ★★ ÉPICO     │
│   🔺 + 🔺  →  FRACTAL    (Sierpiński ∞) ★★ ÉPICO         │
│                                                             │
│   Formas Especiais:                                         │
│   ◇ + ⚪  →  OLHO                                          │
│   ✚ + ⚪  →  MIRA                                          │
│   ⬠ + ⬡  →  ESTRELA                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 3.2 Herança Genética (Mendeliana)

Filhos herdam características dos pais com variação:

```javascript
// Dominância genética variável (30% a 70%)
const dominance = 0.3 + Math.random() * 0.4;
let result = valor_pai1 * dominance + valor_pai2 * (1 - dominance);

// Mutação (30% de chance, ±10% variância)
if (Math.random() < 0.3) {
    result *= 1 + (Math.random() - 0.5) * 0.2;
}
```

### Visual DNA

Cada Golem possui DNA visual herdável:

| Gene | Herança | Mutação |
|------|---------|---------|
| `bodyColor` | Interpolação RGB | ±20 por canal |
| `detailColor` | Interpolação RGB | ±20 por canal |
| `eyeJitter` | Média ponderada | ±10% |
| `blinkRate` | Média ponderada | ±10% |
| `lineWidth` | Média ponderada | ±10% |

## 3.3 Anomalias — Erros Dimensionais

Combinações impossíveis geram **Anomalias**:

```javascript
if (isImpossibleCombination) {
    golem.isAnomaly = true;
    golem.glitchIntensity = Math.random(); // 0.0-1.0
    golem.stability = 1 - golem.glitchIntensity;
}
```

Anomalias possuem:
- 🔀 Distorção visual RGB (chromatic aberration)
- 📺 Efeito de scanlines
- ⚡ Instabilidade de vida (decaimento acelerado)
- 💀 Podem colapsar espontaneamente

---

# 4. SISTEMA DE EXPRESSÃO E COMPORTAMENTO

## 4.1 Expressões Faciais Dinâmicas

Os Golems possuem rostos minimalistas estilo "doodle neon" que comunicam estado emocional:

### Por Nível de Vida

| % Vida | Humor | Visual | Descrição |
|--------|-------|--------|-----------|
| 100-70% | `happy` | 😊 | Olhos abertos, sorriso suave |
| 70-50% | `neutral` | 😐 | Pontos sólidos, linha reta |
| 50-30% | `sad` | 😢 | Olhos semicerrados, boca caída |
| 30-0% | `dying` | 😵 | Cruzes + lágrimas, tremendo |
| 0% | `dead` | 💀 | X X estáticos, boca "O" |

### Por Ação

| Ação | Duração | Visual | Trigger |
|------|---------|--------|---------|
| `born` | 2s | 👀 Olhos enormes | Nascimento |
| `feed` | 2s | 😋 Olhos fechados, mastigando | Alimentação |
| `burn` | 3s | 😵‍💫 Espirais girando | Queimadura |
| `freeze` | 5s | 😨 Arregalados + cristais | Congelamento |
| `breed` | 1.5s | 😍 Corações | Reprodução |
| `petting` | Contínuo | 😊 ^^ Olhos fechados | Carinho |

## 4.2 Instintos Reativos (Steering Behaviors)

Implementação dos algoritmos clássicos de Craig Reynolds (1987):

### Estados de Instinto

| Ferramenta | Estado | Comportamento | Descrição |
|------------|--------|---------------|-----------|
| 🍎 Feed | `seeking` | Perseguição | Pupilas dilatadas, corre em direção |
| 🔥 Burn | `fleeing` | Fuga errática | Olhos arregalados, tremor, lágrimas |
| ☠️ Kill | `fleeing` | Fuga desesperada | Terror puro |
| ❄️ Freeze | `freezing` | Paralisia gradual | Cristais de gelo, movimentos lentos |
| 🧬 Mutate | `curious` | Aproximação cautelosa | Cabeça inclinada, "?" visual |

### Algoritmos

```javascript
// SEEK: Perseguir objetivo
calculateSeek(targetPos) {
    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    const distance = Math.sqrt(dx*dx + dy*dy) || 1;
    const speed = this.baseSpeed * (1.5 + this.instincts.intensity);
    return { x: (dx/distance) * speed, y: (dy/distance) * speed };
}

// FLEE: Fugir com variação errática proporcional ao pânico
calculateFlee(threatPos) {
    const dx = this.x - threatPos.x;
    const dy = this.y - threatPos.y;
    const erratic = (Math.random() - 0.5) * 0.4 * this.instincts.intensity;
    const angle = Math.atan2(dy, dx) + erratic;
    return { x: Math.cos(angle) * fleeSpeed, y: Math.sin(angle) * fleeSpeed };
}

// SEPARATION: Evitar sobreposição com outros Golems
calculateSeparation() {
    // Força de repulsão inversamente proporcional à distância
    if (dist < SEPARATION_RADIUS) {
        pushStrength = (1 - dist/SEPARATION_RADIUS) * SEPARATION_FORCE;
    }
}
```

## 4.3 Sistema de Voz

Diálogos procedurais baseados em física e contexto:

```javascript
// Exemplo: Golem de Eletricidade
eletricidade: {
    idle: ["ZZZT! ZZZT!", "ENERGIA!!", "CARGA TOTAL!", "*faísca*"],
    born: ["ZZAP! NASCI!", "CHOQUE INICIAL!", "SPARK!!", "ATIVADO!!"],
    burn: ["SOBRECARGA!!", "FUSÍVEL!!", "QUEIMANDO!!"],
    dying: ["energia... baixa...", "zzzt...", "apagando..."]
}

// Exemplo: Golem de Gravidade
gravidade: {
    idle: ["P  E  S  O...", "Caindo...", "Denso...", "Atração..."],
    born: ["Aterrisei...", "Chegando...", "Impacto...", "Pouso..."],
    dying: ["Afundando...", "Sumindo...", "..."]
}
```

Modificadores químicos adicionam variação:

```javascript
// Ouro adiciona prefixos/sufixos
ouro: {
    prefix: ["Brilho puro!", "Nobreza...", "24k!"],
    suffix: ["...dourado.", "...precioso."]
}
// "ZZZT! ZZZT!" → "Brilho puro! ZZZT! ZZZT! ...dourado."
```

---

# 5. FERRAMENTAS DO LABORATÓRIO

## 5.1 Tool Rack

Interface hexagonal com 8 ferramentas de manipulação:

| # | Ferramenta | Ícone | Atalho | Efeito |
|---|------------|-------|--------|--------|
| 1 | **Feed** | 🍎 | `[1]` | Restaura vida para máximo |
| 2 | **Heal** | 💊 | `[2]` | Cura doenças e dano |
| 3 | **Burn** | 🔥 | `[3]` | Acelera morte em 5x |
| 4 | **Kill** | ☠️ | `[4]` | Morte instantânea |
| 5 | **Inject** | 💉 | `[5]` | Acelera metabolismo |
| 6 | **Singularity** | 🌀 | `[6]` | Poço gravitacional (3s) |
| 7 | **Taser** | ⚡ | `[7]` | Pânico + repulsão (5s) |
| 8 | **Mutagen** | 🧬 | `[8]` | Rerola atributo (10% letal) |

## 5.2 Chronos Deck

Controle temporal do santuário:

| Controle | Ícone | Atalho | Efeito |
|----------|-------|--------|--------|
| Pause | ⏸️ | `[Space]` | Congela simulação |
| Play | ▶️ | `[Space]` | Velocidade normal (1x) |
| Fast | ⏩ | `[→]` | Velocidade 2x |
| Ultra | ⏭️ | `[→→]` | Velocidade 4x |

---

# 6. ARQUITETURA TÉCNICA

## 6.1 Estrutura do Projeto

```
src/
├── main.js                 # Entry point, UI handlers, event bus
├── style.css               # Estilos (Glassmorphism + CRT)
│
├── scenes/
│   ├── StartScene.js       # Boot sequence (BIOS pattern)
│   ├── MainMenuScene.js    # Menu principal (terminal style)
│   └── SanctuaryScene.js   # Cena principal do jogo
│
├── entities/
│   └── Golem.js            # Classe da criatura (2300+ linhas)
│       ├── drawNeonShape() # Renderização procedural
│       ├── drawFace()      # Sistema de expressões
│       ├── updateInstincts()# AI comportamental
│       └── speakContextual()# Sistema de voz
│
├── systems/
│   ├── TutorialSystem.js   # FTUE guiado (non-intrusive)
│   └── UISoundSystem.js    # WebAudio procedural
│
├── services/
│   └── MockAiService.js    # Genética, alquimia, diálogo
│                           # (preparado para integração LLM)
│
├── ui/
│   └── evolved-forms-ui.js # Modal de formas desbloqueáveis
│
├── utils/
│   └── GeometryMath.js     # Cálculos matemáticos puros (700+ linhas)
│
└── data/
    ├── gameData.js         # Definições de elementos
    └── dialogueData.js     # Banco de frases e personalidades
```

## 6.2 Stack Tecnológico

| Camada | Tecnologia | Uso |
|--------|------------|-----|
| **Game Engine** | Phaser 3.90 | Physics, rendering, input, tweens |
| **Build Tool** | Vite 5 | HMR, bundling, ES modules |
| **UI Framework** | Vanilla DOM | Menus, painéis, tooltips |
| **Styling** | CSS3 | Glassmorphism, CRT effects, animations |
| **Audio** | Web Audio API | Sons procedurais em tempo real |
| **Persistência** | localStorage | Save/load do santuário |

## 6.3 Padrões de Design

### Event-Driven Architecture
```javascript
// Emissor (main.js)
game.events.emit('tool-drag-move', { action, x, y });

// Ouvinte (Golem.js)
scene.game.events.on('tool-drag-move', this.handleThreat);
```

### Entity-Component (Simplificado)
```javascript
// Golem.js é um Container Phaser que agrega:
this.add(this.graphics);      // Corpo geométrico
this.add(this.faceGraphics);  // Rosto expressivo
this.add(this.emitter);       // Partículas
this.add(this.speechBubble);  // Sistema de fala
```

### Data-Driven Design
```javascript
// Toda configuração externalizada em gameData.js
// Permite balanceamento sem alterar código
export const ELEMENTS = {
    forma: [...],
    quimica: [...],
    fisica: [...]
};
```

## 6.4 Fluxo de Dados

```
┌────────────────────────────────────────────────────────────────────┐
│                              main.js                                │
│    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│    │  UI Events   │────▶│  Tool Drag   │────▶│ game.events  │     │
│    └──────────────┘     └──────────────┘     └──────┬───────┘     │
└────────────────────────────────────────────────────┬───────────────┘
                                                     │
                    ┌────────────────────────────────▼────────────────┐
                    │                SanctuaryScene.js                 │
                    │   ┌────────────┐      ┌─────────────────┐      │
                    │   │golemsGroup │◀────▶│ triggerBreed()  │      │
                    │   └─────┬──────┘      └────────┬────────┘      │
                    └─────────┼──────────────────────┼────────────────┘
                              │                      │
          ┌───────────────────▼──────────────────────▼──────────┐
          │                      Golem.js                        │
          │   ┌─────────────────┐  ┌─────────────────┐          │
          │   │updateInstincts()│  │drawFace()       │          │
          │   │speakContextual()│  │handleToolAction()│          │
          │   └────────┬────────┘  └─────────────────┘          │
          └────────────┼────────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌─────────────────┐
│GeometryMath│  │dialogueData│  │MockAiService    │
│(Cálculos)  │  │(Frases)    │  │(Genética/Alquim)│
└────────────┘  └────────────┘  └─────────────────┘
```

---

# 🎓 VIÉS EDUCACIONAL

## Aprendizado Através do Jogo

O HYLOMORPH foi desenhado para **estimular conhecimento** de forma lúdica:

### 📐 Matemática
- **Geometria Computacional**: Algoritmo Shoelace, aproximação de Ramanujan
- **Trigonometria**: Cálculo de ângulos, steering behaviors
- **Projeções**: Tesseract (4D → 3D), perspectiva isométrica

### 🧪 Ciências
- **Química**: Propriedades dos elementos, estados da matéria, ligações
- **Física**: Energia, entropia, gravidade, eletromagnetismo
- **Biologia**: Genética mendeliana, herança, mutação, evolução

### 🏛️ Filosofia
- **Metafísica**: Hylomorfismo, substância, essência vs acidente
- **Filosofia da Mente**: Consciência, qualia, problema mente-corpo
- **Ética**: Responsabilidade moral, consequencialismo

### 🎮 Ciência da Computação
- **Algoritmos**: Steering behaviors, pathfinding, simulação
- **Estruturas de Dados**: Árvores genealógicas, grafos
- **IA**: Comportamento emergente, máquinas de estado

### 🔮 Alquimia Histórica
- **Transmutação**: Combinação de elementos para criar novos
- **Símbolos**: Círculo (perfeição), quadrado (matéria), triângulo (ascensão)
- **Opus Magnum**: A "grande obra" de criar vida artificial

---

# 🚀 ROADMAP

## Versão Atual (1.0)

- [x] Sistema de síntese triádico (forma/química/física)
- [x] 3 formas base + 16 formas evoluídas
- [x] 7 materiais + 9 tipos de energia
- [x] Sistema de alquimia por reprodução
- [x] Genética mendeliana (herança + mutação)
- [x] Expressões faciais dinâmicas (20+ estados)
- [x] Instintos reativos (seek, flee, separation)
- [x] Sistema de voz contextual
- [x] 8 ferramentas de manipulação
- [x] Chronos Deck (controle temporal)
- [x] Tutorial guiado não-intrusivo
- [x] Persistência em localStorage
- [x] Árvore genealógica visual

## Próximas Versões

### v1.1 — "Ecosystem"
- [ ] Cadeia alimentar (Golems predadores vs presas)
- [ ] Biomas com efeitos ambientais (calor, frio, radiação)
- [ ] Sistema de achievements
- [ ] Catálogo de descobertas

### v1.2 — "Intelligence"
- [ ] Sistema de memória (Golems aprendem com experiência)
- [ ] Comunicação entre Golems
- [ ] Formação de grupos sociais
- [ ] Integração com LLM para diálogos únicos

### v1.3 — "Multiverse"
- [ ] Multiplayer: visite laboratórios de outros jogadores
- [ ] Mercado de Golems raros
- [ ] Competições de breeding
- [ ] Ranking global de descobertas

---

# 🎮 QUICK START

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- npm ou yarn

## Instalação

```bash
# Clone o repositório
git clone https://github.com/taleszin/hylomorph.git
cd hylomorph

# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` e prepare-se para criar vida! 🧪

## Build para Produção

```bash
npm run build
npm run preview
```

## Estrutura de Save

O jogo salva automaticamente em `localStorage`:
- `hylomorph_sanctuary_data` — Estado dos Golems
- `hylomorph_tutorial_done` — Progresso do tutorial

---

# 🤝 CONTRIBUINDO

Contribuições são muito bem-vindas! Este é um projeto educacional open-source.

## Como Contribuir

1. **Fork** o repositório
2. Crie uma **branch** para sua feature (`git checkout -b feature/nova-forma`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona forma Dodecaedro'`)
4. **Push** para a branch (`git push origin feature/nova-forma`)
5. Abra um **Pull Request**

## Áreas que Precisam de Ajuda

| Área | Descrição | Dificuldade |
|------|-----------|-------------|
| 🎨 **Novas Formas** | Implementar geometrias procedurais | Médio |
| 🔊 **Áudio** | Expandir sistema de sons procedurais | Médio |
| 🌍 **i18n** | Tradução para outros idiomas | Fácil |
| 📱 **Mobile** | Otimização para touch | Difícil |
| 🧪 **Testes** | Cobertura de testes automatizados | Médio |
| 📖 **Docs** | Documentação de APIs e sistemas | Fácil |

## Código de Conduta

Este projeto segue o [Contributor Covenant](https://www.contributor-covenant.org/). Seja respeitoso e construtivo.

---

# 👨‍💻 AUTOR

<div align="center">

**Tales Santiago**

Estudante de Ciência da Computação em Universidade Pública

[![GitHub](https://img.shields.io/badge/GitHub-taleszin-181717?style=for-the-badge&logo=github)](https://github.com/taleszin)

*"Criar vida artificial me faz questionar o que significa estar vivo."*

</div>

---

# 📜 LICENÇA

Este projeto está sob a licença **MIT**. Veja [LICENSE](LICENSE) para mais detalhes.

Você é livre para usar, modificar e distribuir este código, inclusive para fins comerciais, desde que mantenha os créditos originais.

---

# 🙏 AGRADECIMENTOS E REFERÊNCIAS

## Filosóficas
- **Aristóteles** — *De Anima*, Hylomorfismo
- **René Descartes** — Dualismo mente-corpo

## Técnicas Matemáticas
- **Craig Reynolds** — Steering Behaviors (1987)
- **Srinivasa Ramanujan** — Aproximação de perímetro de elipse
- **Carl Friedrich Gauss** — Shoelace Algorithm

## Estéticas
- **Tamagotchi** — O cuidado virtual original
- **Spore** — Criação procedural de criaturas
- **Pou** — Interações da UI com personagem
- **Niche** — Genética e evolução como gameplay

---

<div align="center">

## 🧬 *"In silico ergo sum"*

**Crie. Observe. Questione.**

<br/>

*Cada Golem que nasce carrega uma pergunta:*
*Se eu sinto medo, se eu busco felicidade, se eu evito a morte...*
***eu estou vivo?***

<br/>

---

**HYLOMORPH** © 2024 Tales Santiago

*A forma dá ser à matéria — mas quem dá forma à forma?*

</div>
