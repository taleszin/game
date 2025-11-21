# Project Golem — README

Este documento substitui e amplia o README anterior. Contém visão geral do jogo, tecnologias usadas, descrição das formas geométricas (incluindo tridimensionais projetadas em 2D), a matemática por trás dos cálculos (área, perímetro, vértices), e fórmulas para contar combinações possíveis entre componentes.

---

## Sumário
- Visão geral do jogo
- Tecnologias usadas
- Componentes e como contar combinações possíveis (fórmulas)
- Tipos de formas e como são calculadas (detalhes matemáticos)
- Como o sistema gera formas procedurais
- Notas para desenvolvedores e como rodar localmente

---

## Visão geral

Project Golem é um simulador lúdico-científico que permite ao jogador criar, observar e cruzar entidades geométricas chamadas "Golems". Cada Golem é definido por três camadas principais: forma (biologia), material (química) e energia (física). A forma determina a representação geométrica e está ligada a uma série de estatísticas (força, resistência, energia, tempo de vida).

O objetivo do README atualizado é documentar com precisão como os valores geométricos são calculados e como estimar o número de combinações possíveis para fins educativos e de balanceamento.

---

## Tecnologias

- Phaser 3 — engine de jogo (Canvas/WebGL, física Arcade)
- Vite — bundler de desenvolvimento
- HTML/CSS — layer de UI (modais, árvore genealógica)
- JavaScript (ES modules) — lógica do jogo

Arquivos chave:
- `src/entities/Golem.js` — lógica de desenho das formas (Phaser Graphics), aplicação de `scaleX`/`scaleY`, geração de formas procedurais.
- `src/services/MockAiService.js` — regras de combinação (`GEOMETRY_MIX`), geração de stats e cálculos geométricos (função `calculateGeoStats`).
- `src/main.js` — UI, modal de inspeção (render SVG), funções auxiliares de métricas como `computeShapeMetrics`.

---

## Componentes e contagem de combinações

O jogador compõe um Golem escolhendo um componente de cada disciplina: Forma (F), Química (Q), Física (P). Seja:
- n_F = número de opções de Forma
- n_Q = número de opções de Química
- n_P = número de opções de Física

O número total de combinações possíveis para criar um Golem (considerando escolha independente de cada disciplina) é:

Total_creation = n_F × n_Q × n_P

Exemplo: se houver 10 formas, 6 químicas e 6 físicas, então Total_creation = 10 × 6 × 6 = 360 combinações.

Breeding (cruzamento): quando dois pais se combinam para gerar um filho, a forma resultante pode ser:
- um produto predefinido da tabela `GEOMETRY_MIX` (determinístico), ou
- uma forma `procedural` derivada dos parâmetros dos pais.

Se considerarmos apenas o conjunto de formas base (n_F), o número de pares não ordenados de formas possíveis (com repetição permitida, pois dois pais com mesma forma são válidos) é:

Pairs = n_F × (n_F + 1) / 2

Como cada par pode resultar em uma forma fixa (se existir no `GEOMETRY_MIX`) ou em uma forma procedural (muitos resultados possíveis), o espaço total de resultados é >= Pairs (na prática muito maior devido à variância dos parâmetros procedurais `sides`, `roughness` e `seed`).

Observação sobre escalas (scaleX/scaleY): `scaleX` e `scaleY` são contínuos (floats) no motor de geração, então, teoricamente, multiplicam o espaço de possibilidades para infinito; para fins práticos de balanceamento costuma-se quantizar ou limitar a variação (ex.: passos de 0.05 entre 0.7 e 1.5).

---

## Tipos de formas e seus cálculos (resumo matemático)

O jogo trata as formas de duas maneiras:
- Formas "2D" básicas (círculo, quadrado, triângulo, pentágono, hexágono, losango, cruz etc.) desenhadas diretamente e calculadas geometricamente.
- Formas "3D projetadas" (cilindro, cone, pirâmide, obelisco, esfera) representadas em 2D para inspeção e também aproximadas para fins de estatísticas.

Para todas as formas, as dimensões reais usadas nos cálculos são afetadas por `scaleX` e `scaleY`.

1) Círculo → Elipse (quando scaleX ≠ scaleY)
- Se a forma base é um círculo com raio base r0 (no código r0 ≈ 25 px), os raios finais são:
	- a = r0 × scaleX
	- b = r0 × scaleY
- Área: A = π · a · b
- Perímetro: aproximado por Ramanujan:
	- h = ((a − b) / (a + b))²
	- P ≈ π · (a + b) · (1 + (3h) / (10 + √(4 − 3h)))

2) Quadrado → Retângulo
- Base do quadrado: s0 (no código s0 ≈ 44 px). Com escala:
	- largura = s0 × scaleX
	- altura = s0 × scaleY
- Área: A = largura × altura
- Perímetro: P = 2 × (largura + altura)

3) Triângulo (pontos definidos)
- Triângulos usados no desenho têm vértices fixos relativos ao centro; ao aplicar `scaleX`/`scaleY` escalamos cada vértice (x_i × scaleX, y_i × scaleY) e então usamos:
	- Área: algoritmo do polígono (shoelace) ou fórmula (base × altura / 2)
	- Perímetro: soma das distâncias entre vértices

4) Polígonos regulares (pentágono, hexágono)
- Para um polígono regular de n lados com raio circunscrito R:
	- Área: A = 0.5 · n · R² · sin(2π/n)
	- Lado ≈ 2 · R · sin(π/n)
	- Perímetro: P = n × lado

5) Formas procedurais (`procedural`)
- Parâmetros: `sides` (número de vértices), `roughness` (amplitude de ruído), `seed` (determinismo)
- Construção: gera-se uma lista de vértices polar (angle_i, r_i) onde r_i = R + noise(i, seed, roughness). Em seguida:
	- Área e perímetro: calculados por `polyMetrics` (método do polígono / shoelace para área, distância sequencial para perímetro)

6) Formas 3D (projeção 2D)
- Para fins de inspeção e leitura pedagógica, formas como `cilindro`, `cone`, `piramide`, `obelisco`, `esfera` são desenhadas em 2D e tem medidas aproximadas (por exemplo, cilindro tratado como retângulo com elipses nas extremidades). Essas aproximações fornecem A/P aproximados coerentes com a representação visual.

---

## Implementação — onde procurar o código

- `src/entities/Golem.js`:
	- `drawPath(g, type)` e `drawPolygon(g, sides, size)` — desenham as formas no canvas (Phaser Graphics).
	- `procedural` path usa `sides`, `roughness`, `seed` para gerar vértices.
	- `setScale(scaleX, scaleY)` aplicado ao `Container` para respeitar proporções visuais.

- `src/services/MockAiService.js`:
	- `GEOMETRY_MIX` — tabela de combinações determinísticas.
	- `calculateGeoStats(shapeId, scaleX, scaleY, proceduralParams)` — função que retorna `{ area, perimeter, vertices, scale }` e é usada para gerar stats de AI e exibir valores.

- `src/main.js`:
	- `computeShapeMetrics(id, scaleX, scaleY)` — ajuda a gerar strings de decomposição (breakdown) para o modal educativo.
	- Renderização SVG no modal: respeita `scaleX`/`scaleY` para representar elipses/retângulos/projeções 2D.

---

## Fórmulas importantes (resumo rápido)

- Elipse: A = πab
- Retângulo: A = w·h
- Polígono regular: A = 0.5·n·R²·sin(2π/n)
- Polígono arbitrário (shoelace): A = 1/2 · | Σ_{i=0..n-1} (x_i y_{i+1} − x_{i+1} y_i) |
- Perímetro poligonal: P = Σ_{i=0..n-1} distance(v_i, v_{i+1})

---

## Exemplos numéricos rápidos

- Forma: `circulo` com r0=25, `scaleX=1.0`, `scaleY=0.5` → elipse com a=25, b=12.5
	- A ≈ π × 25 × 12.5 ≈ 981 px² (aprox)

- Forma: `quadrado` com s0=44, `scaleX=1.2`, `scaleY=0.8` → w=52.8, h=35.2
	- A = 52.8 × 35.2 ≈ 1857 px²

---

## Observações pedagógicas e limites práticos

- O espaço de variações pode ser controlado por quantização de `scaleX/scaleY` (ex.: passos de 0.05) para criar exercícios didáticos com um número finito de combinações.
- Formas procedurais, por projeto, devem limitar `sides` a um intervalo (3..12) para manter reconhecimento visual.

---

## Como rodar localmente (rápido)

Pré-requisitos: Node.js (>=14) e npm

No diretório do projeto:

```powershell
npm install
npm run dev
```

