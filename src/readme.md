# 🧬 Project Golem: Genesis

> **"Não apenas crie vida. Decida o destino dela."**

**Project Golem: Genesis** é um simulador de vida artificial estilo *God Game* com estética 16-bit e profundidade científica. O projeto une a nostalgia visual do SNES com conceitos modernos de simulação de ecossistemas e ética em IA.

---

## 🧠 Conceito & Inspiração

O jogo foi construído sobre três pilares teóricos:
1.  **O Complexo de Frankenstein:** O jogador atua como o "Deus", combinando elementos brutos para criar senciência.
2.  **Teoria Black Mirror (Cookie):** As criaturas geradas são "consciências digitais" presas em um terrário, questionando sua própria existência através de diálogos gerados por IA.
3.  **Estética da Abstração:** Devido ao foco em MVP, adotou-se o **Design Geométrico Procedural** (inspirado em *Thomas Was Alone*), onde a forma define a função biológica.

---

## ⚙️ Mecânicas de Jogo (Game Design)

### 1. O Motor de Gênese (Crafting)
A criação de vida não é aleatória. Ela segue uma **Matriz Lógica** baseada em três disciplinas:

| Disciplina | Função no Jogo | Visual (Output) | Gameplay (Stats) |
| :--- | :--- | :--- | :--- |
| **Biologia** | Define a **Forma** | • Mamífero: Retângulo (Robusto)<br>• Inseto: Triângulo (Agressivo)<br>• Amorfo: Polígono Animado (Slime) | Define o comportamento de movimento base. |
| **Química** | Define o **Material** | • Carbono: Marrom<br>• Ferro: Prata<br>• Silício: Ciano Neon | Define a **Resistência** (Defesa e Durabilidade). |
| **Física** | Define a **Energia** | • Eletricidade: Rápido<br>• Termodinâmica: Instável<br>• Radioatividade: Brilhante | Define a **Velocidade** e o Tempo de Vida máximo. |

### 2. Entropia & Ciclo de Vida
Nenhuma criatura é eterna. O sistema possui um *Garbage Collector* diegético:
* Cada Golem nasce com uma quantidade de **Entropia (Vida)** calculada pela fórmula: `(Resistência + Energia) * Fator Temporal`.
* Uma barra visual indica a degradação dos dados. Ao chegar a zero, a criatura sofre "Corrupção de Dados" e é deletada.

### 3. Intervenção Divina (God Toolbar)
Através de uma UX moderna de **Drag & Drop**, o jogador interage fisicamente com o mundo:
* **🍖 Nutrir:** Arrasta comida para curar e estender a vida de um Golem.
* **🔥 Incendiar:** Arrasta fogo para acelerar a entropia (morte rápida/purificação).
* **💀 Eliminar:** Arrasta a caveira para execução imediata (controle populacional).

### 4. Evolução Genética (Breeding)
O sistema permite a perpetuação da espécie sem intervenção direta na criação:
* **Mecânica:** Arrastar um Golem e soltá-lo sobre outro inicia o "Ritual".
* **Lógica:** O filho herda 50% dos genes (Biologia/Química/Física) de cada pai.
* **Mutação:** Os atributos numéricos do filho possuem uma leve variação evolutiva (+10% de expectativa de vida).

### 5. Interface de Inspeção (Sci-Fi HUD)
O jogo utiliza um sistema de **Hover Contextual**:
* Ao passar o mouse sobre uma criatura, um *tooltip* flutuante exibe dados gerados via Mock/IA (Nome, Descrição Científica e Status).

---

## 🏗️ Arquitetura Técnica

O projeto segue uma arquitetura híbrida para maximizar performance e facilidade de UI.

### Stack
* **Engine:** Phaser 3 (Renderização Canvas/WebGL, Física Arcade).
* **Build Tool:** Vite (Hot Reload, Bundling).
* **UI Layer:** HTML5/CSS3 (Sobreposto ao Canvas para menus responsivos).

### Hierarquia de Pastas Explicada
```text
src/
├── data/
│   └── gameData.js       # "Single Source of Truth". JSON estático com os elementos científicos.
│
├── entities/
│   └── Golem.js          # O coração do jogo. Classe que estende 'Container'.
│                         # - Gerencia geometria procedural (desenha formas via código).
│                         # - Controla física (velocidade, colisão).
│                         # - Gerencia ciclo de vida (timers de morte).
│                         # - Implementa Drag & Drop e Hover.
│
├── scenes/
│   └── SanctuaryScene.js # O "Mundo".
│                         # - Gerencia grupos de colisão.
│                         # - Processa a lógica de Breeding (Redemoinho).
│                         # - Recebe eventos da UI HTML e aplica no Canvas.
│
├── services/
│   └── MockAiService.js  # Camada de Abstração da IA.
│                         # - Simula delay de rede.
│                         # - Gera nomes e stats baseados em inputs.
│                         # - Pronto para ser substituído por uma chamada real (OpenAI/Gemini).
│
├── main.js               # O "Controlador".
│                         # - Inicializa o Phaser.
│                         # - Gerencia toda a lógica DOM (Botões, Modais, Drag da Toolbar).
│                         # - Ponte de eventos entre HTML <-> Phaser.
│
└── style.css             # Design System.
                          # - Define a estética "Dark Lab" e fontes Pixel Art.
                          # - Gerencia animações CSS da UI.