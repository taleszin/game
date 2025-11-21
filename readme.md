# 📐 Project Golem: Geometry Creator

> **Um simulador lúdico-científico onde Geometria encontra Biologia.**
> Crie, observe e evolua entidades vivas baseadas em formas matemáticas puras.

![Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Tech](https://img.shields.io/badge/Engine-Phaser%203-orange)

---

## 📖 Sobre o Projeto

**Project Golem** é um experimento interativo que explora a vida artificial através da geometria. O jogador assume o papel de um "Arquiteto", sintetizando criaturas chamadas **Golems** a partir de três pilares fundamentais: Forma, Química e Física.

O diferencial do projeto é o uso de **matemática real** para definir os atributos das criaturas. A área, perímetro e complexidade dos polígonos influenciam diretamente na força, resistência e tempo de vida dos Golems.

---

## 🧬 A Tríade da Vida

Cada Golem é composto por três camadas de dados que definem sua existência:

### 1. Forma (Biologia)
Define a geometria base e os atributos vitais.
*   **Primitivas**: Círculo, Quadrado, Triângulo.
*   **Complexas**: Pentágono, Hexágono, Cruz.
*   **Procedurais**: Formas geradas matematicamente via mutação.
*   **Impacto**: Define a `Vida Máxima` e `Escala`.

### 2. Estrutura (Química)
Define o material e a composição visual.
*   **Materiais**: Ouro, Ferro, Cristal, Mercúrio, Carbono.
*   **Impacto**: Define a espessura do traço e estilo visual (neon/brilho).

### 3. Energia (Física)
Define o comportamento e interação com o mundo.
*   **Tipos**: Eletricidade, Fogo, Gravidade, Magnetismo.
*   **Impacto**: Define a cor do núcleo, partículas e comportamento de movimento (ex: Eletricidade é mais rápida/errática).

---

## 🧮 O Core Matemático

O coração do jogo é o cálculo preciso de propriedades geométricas. O sistema não apenas desenha as formas, mas as "compreende" matematicamente.

### Cálculos de Geometria
As formas são calculadas em tempo real considerando escalas independentes (`scaleX`, `scaleY`).

| Forma | Área ($A$) | Perímetro ($P$) | Notas |
| :--- | :--- | :--- | :--- |
| **Círculo (Elipse)** | $\pi \cdot a \cdot b$ | Ramanujan Approx. | $a, b$ são os raios maior/menor. |
| **Retângulo** | $w \cdot h$ | $2(w + h)$ | Baseado na escala do quadrado. |
| **Polígono Regular** | $\frac{1}{2} n R^2 \sin(\frac{2\pi}{n})$ | $n \cdot \text{lado}$ | $n$ = lados, $R$ = raio. |
| **Procedural** | *Shoelace Algorithm* | Soma das distâncias | Vértices gerados via ruído. |

#### Fórmulas Detalhadas
*   **Elipse**: $A = \pi ab$
*   **Polígono Regular**: $A = 0.5 \cdot n \cdot R^2 \cdot \sin(2\pi/n)$
*   **Shoelace (Área Arbitrária)**: $A = \frac{1}{2} | \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) |$
*   **Perímetro Poligonal**: $P = \sum_{i=0}^{n-1} \text{dist}(v_i, v_{i+1})$

### Genealogia e Cruzamento (Breeding)
Quando dois Golems se reproduzem, o sistema utiliza uma tabela de alquimia geométrica ou gera uma nova forma procedural.

**Exemplos de Alquimia:**
*   `Círculo` + `Quadrado` = **Cilindro**
*   `Triângulo` + `Triângulo` = **Fractal**
*   `Quadrado` + `Quadrado` = **Tesseract**

Se a combinação não existir na tabela, o sistema cria um **Polígono Procedural** herdando a média de lados dos pais e aplicando uma "semente" genética baseada em seus IDs.

---

## 🛠️ Arquitetura Técnica

O projeto utiliza **Phaser 3** para renderização e física, com uma arquitetura baseada em componentes e eventos.

### Estrutura de Pastas
```
src/
├── entities/       # GameObjects do Phaser
│   └── Golem.js    # Lógica visual, física e ciclo de vida
├── scenes/         # Cenas do jogo
│   └── Sanctuary.js # Cena principal (Laboratório)
├── services/       # Lógica de Negócios (Agnóstica de Engine)
│   └── MockAiService.js # Cálculos matemáticos e genética
└── main.js         # Entry point e Gerenciamento de UI (DOM)
```

### Tecnologias
- **Phaser 3** — engine de jogo (Canvas/WebGL, física Arcade)
- **Vite** — bundler de desenvolvimento
- **HTML/CSS** — layer de UI (modais, árvore genealógica)
- **JavaScript (ES modules)** — lógica do jogo

---

## 📊 Análise Combinatória

Para fins educativos, o número de combinações possíveis de Golems iniciais é dado por:

$$ Total = N_{forma} \times N_{quimica} \times N_{fisica} $$

Considerando as variações contínuas de `scaleX` e `scaleY` e as gerações procedurais infinitas, o universo de Golems únicos é virtualmente ilimitado.

**Exemplo Numérico:**
Se houver 10 formas, 6 químicas e 6 físicas:
$$ Total = 10 \times 6 \times 6 = 360 \text{ combinações base} $$

---

## 🚀 Como Rodar

Pré-requisitos: `Node.js` (v14+) e `npm`.

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

3.  **Acesse:**
    Abra `http://localhost:5173` (ou a porta indicada) no navegador.

---

## 🎮 Controles e Ferramentas

### Modo Criação
1.  Clique em **Novo Experimento**.
2.  Selecione **Forma**, **Estrutura** e **Energia**.
3.  Clique em **Sintetizar**.

### Modo Deus (God Tools)
Interaja com os Golems vivos usando a barra de ferramentas:
*   🍖 **Nutrir**: Restaura vida e aumenta escala.
*   🔥 **Incendiar**: Drena vida rapidamente.
*   ❄️ **Congelar**: Para o movimento e física.
*   🧬 **Mutar**: Altera a forma geométrica aleatoriamente.
*   💀 **Eliminar**: Remove a entidade.

---

*Desenvolvido para exploração criativa e educativa.*
