# CLAUDE.md — HYLOMORPH

Guia para agentes Claude que forem trabalhar neste repositório. Leia antes de editar.

## O que é

**HYLOMORPH** é um *simulador de vida artificial / god game* feito em **Phaser 3 + Vite** (JavaScript puro, ESM). O repo se chama `game`, mas o jogo é o HYLOMORPH.

O jogador é o **Arquiteto**: cria, manipula e destrói criaturas geométricas sencientes (**Golems**) num santuário, e observa comportamento emergente. Não há condição de vitória — é um sandbox-ensaio com viés filosófico e educacional.

Autor: Tales Santiago (Ciência da Computação, UECE). Projeto solo.

### Conceito (importa para o design das mecânicas)

O jogo é um veículo deliberado para filosofia. Três âncoras, traduzidas em mecânica concreta:

- **Hilomorfismo aristotélico** (dá nome ao jogo) → todo Golem é a tríade **Forma (morphē) + Química (hylē) + Física/energia (pneuma)**. Não é cosmético: define HP, stats e personalidade via matemática real.
- **Dualismo cartesiano** → *Res Extensa* = o corpo geométrico calculado; *Res Cogitans* = "consciência" simulada por instintos reativos + expressões faciais.
- **Qualia / senciência** (Nagel, Turing) → o `lifeLog` registra a biografia de cada Golem (dor, medo, reprodução, morte). É o dispositivo que carrega o peso ético do tema.

> ⚠️ **Não existe IA nem consciência real.** O comportamento é *steering behavior* (boids) + ciclo de vida determinístico, e o diálogo é procedural por tabelas (`MockAiService`, `dialogueData.js`). A camada está desenhada para um dia plugar um LLM real (`fetchDialogue` já existe), mas hoje é mock. Ao falar do jogo, não venda "consciência" como implementada.

## Stack e comandos

- Phaser `^3.90`, Vite `^7`, ESM (`"type":"module"`), sem TypeScript, sem ESLint/Prettier, **sem testes**.
- `base: '/game/'` no Vite — deploy é GitHub Pages (`taleszin.github.io/game/`) via `.github/workflows/deploy.yml` (push em `main`/`master`).

```bash
npm install              # ou npm ci
npm run dev              # vite dev (abre auto; porta 5173, cai p/ 5174 se ocupada)
npm run build            # gera ./dist  (lembre: base /game/)
npm run preview          # serve o build (porta 4173)
```

Não existe `npm test` (apesar de `.github/workflows/npm-publish.yml` chamá-lo — ver Armadilhas).

## Arquitetura

Paradigma: **OOP, não ECS**. Barramento de eventos: `game.events` (EventEmitter do Phaser) liga a UI-HTML à cena de jogo.

```
src/
├── main.js                 (~3900) entry: config Phaser + TODA a UI HTML/DOM + wiring de eventos
├── data/
│   ├── gameData.js         catálogo ELEMENTS (forma/formaEvoluida/quimica/fisica) — fonte da verdade dos ingredientes
│   └── dialogueData.js     corpus de falas, personalidades, cores
├── entities/Golem.js       (~4200) GOD OBJECT: render, IA, ciclo de vida, combate, reprodução, voz
├── scenes/
│   ├── StartScene.js       splash/título (vídeo+áudio via DOM)
│   ├── MainMenuScene.js    menu, settings, check de "continuar"
│   └── SanctuaryScene.js   GAMEPLAY principal (preload/create/update)
├── services/MockAiService.js  geração + breeding/alquimia + genética mendeliana (mock de IA)
├── systems/
│   ├── TutorialSystem.js   FTUE por steps
│   ├── UIFlingSystem.js    toolbar/HUD arrastável (inclui "Matar Todos")
│   └── UISoundSystem.js    SFX de UI via WebAudio (singleton)
├── ui/evolved-forms-ui.js  modal/codex de formas evoluídas
└── utils/GeometryMath.js   matemática pura (área via Shoelace, perímetro via Ramanujan) — testável
```

`landing/` é um **subprojeto separado** (React 18 + Vite 5 + Tailwind + framer-motion, próprio `package.json`/lockfile). É só a página de divulgação — não confunda com o jogo, e seus dados são placeholders/vitrine.

### Fluxo
`StartScene → MainMenuScene → SanctuaryScene`. UI em HTML (em `main.js`) ⇄ simulação (na `SanctuaryScene`) conversam por eventos: `spawn-golem`, `tool-selected`, `tool-drag-*`, `population-update`, `inspect-golem`, `golem-died`, `update-time-scale`, `start-tutorial`, etc.

### Sistemas-chave (onde mexer)
- Geração/breeding/alquimia/genética → `MockAiService.js` (`generateGolemData`, `breedGolemData`, `ALCHEMY_RECIPES`).
- Matemática de forma → `GeometryMath.js` (`SHAPE_CALCULATORS`, `calculateGeometry`).
- Render neon, faces, IA, combate, corte, ciclo de vida → `Golem.js`.
- Catálogo de elementos → `gameData.js`. Falas/expressões → `dialogueData.js` + `docs/EXPRESSIONS.md` (doc mais atualizado, v2.0).
- Ferramentas reais do Arquiteto (8): **feed, burn, freeze, mutate, kill, singularity, taser, mutagen** + Chronos Deck (tempo). Mapeadas em `SanctuaryScene.js` e `index.html`.

## Convenções
- Domínio em **português** (`forma`, `quimica`, `fisica`, `Entidade`); API técnica em **inglês** (`spawnGolem`, `updateInstincts`). Mantenha esse padrão.
- ESM com extensão `.js` explícita nos imports.
- Cabeçalhos de seção decorados com caixas `═══` são o estilo do dev — siga se editar arquivo que já usa.
- Indentação **não é uniforme** entre arquivos (`Golem.js`/`main.js` = 4 espaços; `SanctuaryScene.js` = 2). Siga o arquivo que você está editando, não imponha um padrão global.

## Armadilhas (leia antes de editar)

1. **`Golem.js` e `main.js` são monolitos** (~4000 linhas). Edite cirurgicamente; não "refatore tudo" sem pedir. `main.js` mistura config Phaser + UI HTML imperativa + wiring num único `DOMContentLoaded`.
2. **Save/continuar está QUEBRADO** (bug real, não pretendido): `MainMenuScene` checa `hylomorph_sanctuary_data`, `StartScene` checa `hylomorph_data`, e **nenhuma das duas chaves é jamais escrita** (não há `setItem` do estado do santuário). O botão "Continuar" não restaura nada. Só settings/posições/tutorial/formas é que persistem (`hylomorph_settings`, `hylomorph_ui_positions`, `unlockedForms`, etc.).
3. **`PHYSICS_COLORS` está duplicado em ~7 arquivos** (Golem, MockAiService, dialogueData, gameData, SanctuaryScene, main, TutorialSystem). Se mudar uma cor de física, mude em todos — não há fonte única.
4. **Assets pesados carregados via DOM, não via Phaser/Vite**: `title-screen.mp4` (~24 MB), `opening.mp3`, `soundtrack.mp3` com `src='arquivo.ext'` relativo, sem `import.meta.env.BASE_URL`. Funciona hoje porque `base` e a rota coincidem, mas é frágil sob `/game/`. Esses arquivos estão **duplicados** na raiz do repo E em `public/` (peso desnecessário no git, sem LFS).
5. **`docs`/`readme` divergem do código** (drift): o readme lista ferramentas `heal`/`inject` que **não existem**; elementos, versões e tamanhos de arquivo estão desatualizados. **O código é a verdade**, não os .md.
6. **`.github/workflows/npm-publish.yml` é boilerplate quebrado** (roda `npm test` inexistente e `npm publish` num pacote `private`). Pode ser removido. Só `deploy.yml` é real.
7. **~110 `console.*` e vários `try/catch` vazios** entram no bundle. Cuidado ao depurar — erros podem estar sendo engolidos.
8. **Performance**: cada Golem redesenha via `Phaser.Graphics` por frame e a separação é O(n²). `maxPopulation` é o gargalo — teste mudanças de comportamento com população alta.
9. **Vulnerabilidades de dep**: `npm audit` mostra 4 (3 high/1 moderate), majoritariamente do **dev server** do Vite/Rollup (não afetam o bundle estático no Pages). `npm audit fix` resolve. `landing/` tem lockfile próprio a auditar à parte.

## Ao concluir uma mudança
Não há testes nem lint. Valide manualmente: `npm run dev`, reproduza o fluxo afetado no navegador, e cheque o console. Para mudanças de build/deploy, valide com `npm run build && npm run preview` (lembrando do `base: '/game/'`).
