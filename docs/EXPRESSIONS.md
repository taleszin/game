# Sistema de Expressões dos Golems
## Documentação Técnica e Guia de Design

---

## Visão Geral

O sistema de expressões adiciona rostos minimalistas estilo "doodle neon" aos Golems, permitindo feedback emocional visual instantâneo ao jogador. Os rostos são desenhados com linhas simples (olhos + boca) usando a mesma cor neon do corpo do Golem.

---

## 1. Tabela de Atributos → Expressão

### 1.1 Estado de Vida (Vida Atual / Vida Máxima)

| % de Vida | Humor (`mood`) | Olhos | Boca | Interpretação |
|-----------|---------------|-------|------|---------------|
| **100-70%** | `happy` | ⚫ ⚫ Círculos abertos | ◡ Sorriso suave | Saudável, contente |
| **70-50%** | `neutral` | ● ● Pontos sólidos | ─ Linha reta | Normal, sem emoção forte |
| **50-30%** | `sad` | ─ ─ Semicerrados | ︵ Boca caída | Cansado, precisando de cuidado |
| **30-0%** | `dying` | ✕ ✕ Cruzes + lágrimas | ︵︵ Tremendo | Crítico, prestes a morrer |
| **0%** | `dead` | ✕ ✕ Cruzes estáticas | ○ Boca aberta | Morto |

---

### 1.2 Física/Energia → Personalidade Visual

A física define o **comportamento dos olhos** mesmo em estado neutro:

| Física | ID | Comportamento Ocular | Piscar | Personalidade |
|--------|-----|---------------------|--------|---------------|
| **Eletricidade** | `eletricidade` | Jitter rápido (vibração aleatória) | Rápido (30 ticks) | Hiperativo, nervoso |
| **Calor** | `calor` | Normal | Normal (60 ticks) | Intenso |
| **Radiação** | `radiacao` | Normal | Normal | Misterioso |
| **Gravidade** | `gravidade` | Offset para baixo (+2px) | Lento (100 ticks) | Melancólico, pesado |
| **Luz** | `luz` | Normal, estável | Normal | Sereno, etéreo |
| **Frio** | `frio` | Normal | Muito lento (120 ticks) | Distante, calculista |
| **Magnetismo** | `magnetismo` | Movimento senoidal (seguindo) | Normal | Curioso, observador |

---

### 1.3 Química/Estrutura → Estilo de Linha

A química afeta a **espessura e textura** dos traços do rosto:

| Química | ID | Largura da Linha | Efeito Visual |
|---------|----|-----------------|---------------|
| **Carbono** | `carbono` | 2px | Base, linhas normais |
| **Silício** | `silicio` | 2px | Normal |
| **Ferro** | `ferro` | 3px | Traços mais grossos, marcados |
| **Ouro** | `ouro` | 2.5px | Linhas ligeiramente mais grossas |
| **Cristal** | `cristal` | 1.5px | Linhas finas, delicadas |
| **Mercúrio** | `mercurio` | 2px | Normal |
| **Plasma** | `plasma` | 2px | Normal |

---

## 2. Expressões de Ação (Temporárias)

Quando o Golem sofre uma ação, sua expressão muda temporariamente:

| Ação | Duração | Olhos | Boca | Extras |
|------|---------|-------|------|--------|
| **Nascimento** (`born`) | 2s | 👀 Enormes, surpresos | ○ "O" pequeno | — |
| **Alimentar** (`feed`) | 2s | ^  ^ Fechados felizes | ω Mastigando (anima) | Boca pulsa |
| **Queimar** (`burn`) | 3s | @ @ Espirais girando | ⚡ Zig-zag | Espirais animadas |
| **Congelar** (`freeze`) | 5s | ⊙ ⊙ Arregalados | ○ Pequeno | Cristais de gelo |
| **Mutar** (`mutate`) | 2s | ✦ ✦ Estrelas | D Sorriso largo | — |
| **Acasalar** (`breed`) | 1.5s | ♥ ♥ Corações | 3 Beijinho | — |

---

## 3. Guia de Leitura para o Jogador

### O que cada carinha significa:

```
😊 FELIZ (happy)
   Olhos: Círculos abertos
   Boca: Curvada para cima
   → "Estou bem! Vida acima de 70%"

😐 NEUTRO (neutral)  
   Olhos: Pontos sólidos
   Boca: Linha reta
   → "Estou ok, mas poderia estar melhor"

😢 TRISTE (sad)
   Olhos: Semicerrados
   Boca: Curvada para baixo
   → "Preciso de cuidado! Vida entre 30-50%"

😵 MORRENDO (dying)
   Olhos: X X com lágrimas
   Boca: Tremendo
   → "CRÍTICO! Alimente-me ou vou morrer!"

💀 MORTO (dead)
   Olhos: X X estáticos
   Boca: O aberto
   → "Fim de ciclo"
```

### Expressões Especiais:

```
😋 COMENDO (feed)
   Olhos: ^ ^ fechados
   Boca: Mastigando
   → "Hmm, delicioso! Vida restaurada!"

😵‍💫 QUEIMANDO (burn)
   Olhos: @ @ espirais
   Boca: Zig-zag
   → "AAAH! Perdendo vida rapidamente!"

😨 CONGELADO (freeze)
   Olhos: Arregalados + cristais
   Boca: O pequeno
   → "Frio! Não consigo me mover!"

🤩 MUTANDO (mutate)
   Olhos: ✦ ✦ estrelas
   Boca: D sorriso
   → "Transformação! Nova forma!"

😍 ACASALANDO (breed)
   Olhos: ♥ ♥ corações
   Boca: 3 beijinho
   → "Amor! Criando filho!"

😲 NASCENDO (born)
   Olhos: Enormes
   Boca: O surpreso
   → "Onde estou? O que sou?"
```

---

## 4. Escala Adaptativa

Para garantir legibilidade em Golems de qualquer tamanho:

### Regras de Escala:

1. **Escala Base**: `faceScale = 1 / targetScale` (inverso para compensar container)
2. **Mínimo Garantido**: Se `targetScale < 0.6`, o rosto é proporcionalmente maior
3. **Linha Mínima**: `minLineWidth = max(1.5, 2 / targetScale)` - nunca menor que 1.5px

### Fórmula:

```javascript
const minFaceScale = 0.6;
const rawFaceScale = 1 / this.targetScale;
this.faceScale = Math.max(rawFaceScale, minFaceScale / this.targetScale);
this.minLineWidth = Math.max(1.5, 2 / this.targetScale);
```

---

## 5. Implementação Técnica

### Arquivos Envolvidos:

- **`src/entities/Golem.js`**: Contém todo o sistema de expressão
  - `drawFace()`: Ponto de entrada, determina estado
  - `drawMoodFace()`: Desenha expressões baseadas em vida
  - `drawActionFace()`: Desenha expressões de ação temporárias
  - `updateExpression()`: Loop de atualização (50ms)
  - `setActionExpression()`: Ativa expressão temporária

### Propriedades do Estado:

```javascript
this.expressionState = {
    mood: 'happy',      // happy, neutral, sad, dying, dead
    action: null,       // feed, burn, freeze, mutate, breed, born
    actionTimer: 0      // Timestamp de expiração da ação
};
```

### Fluxo de Atualização:

```
updateExpression() [a cada 50ms]
    ↓
Verifica se action expirou
    ↓
Calcula blinking
    ↓
drawFace()
    ↓
Se action → drawActionFace()
Senão → drawMoodFace() baseado em lifePct
```

---

## 6. Cores

O rosto usa a **mesma cor neon** da física do Golem:

| Física | Cor Hex | Cor RGB |
|--------|---------|---------|
| Eletricidade | `#ffea00` | Amarelo |
| Calor | `#ff4d00` | Laranja-vermelho |
| Radiação | `#00ff00` | Verde |
| Gravidade | `#9d00ff` | Roxo |
| Luz | `#ffffff` | Branco |
| Frio | `#0088ff` | Azul |
| Magnetismo | `#ff00aa` | Rosa |

---

## 7. Debugging

Para debug visual, você pode:

1. **Forçar expressão**: `golem.setActionExpression('burn', 10000)`
2. **Ver estado**: `console.log(golem.expressionState)`
3. **Verificar escala**: `console.log(golem.faceScale, golem.minLineWidth)`

---

*Documento atualizado em: Dezembro 2025*
*Versão do sistema: 2.0 (com escala adaptativa)*
