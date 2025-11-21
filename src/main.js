import Phaser from 'phaser';
import { generateGolemData } from './services/MockAiService.js';
import SanctuaryScene from './scenes/SanctuaryScene';
import { ELEMENTS } from './data/gameData.js';
import './style.css';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SanctuaryScene]
};

const game = new Phaser.Game(config);

document.addEventListener('DOMContentLoaded', () => {
    let currentSelection = { forma: null, quimica: null, fisica: null };
    let activeCategory = 'forma';

    // Helpers para métricas geométricas simples (usadas para validação/educação)
    function polyMetrics(pts){
        let area = 0; let peri = 0;
        for(let i=0;i<pts.length;i++){
            const p1 = pts[i]; const p2 = pts[(i+1)%pts.length];
            area += p1.x * p2.y - p2.x * p1.y;
            peri += Math.hypot(p2.x - p1.x, p2.y - p1.y);
        }
        return { area: Math.abs(area) / 2, peri };
    }

    function computeShapeMetrics(id, scaleX = 1, scaleY = 1){
        let area = null, peri = null, breakdown = '';
        
        // Helper to scale points
        const scalePts = (pts) => pts.map(p => ({x: p.x * scaleX, y: p.y * scaleY}));

        switch(id){
            case 'circulo': {
                const rX = 25 * scaleX;
                const rY = 25 * scaleY;
                area = Math.PI * rX * rY;
                // Ramanujan approx for perimeter of ellipse
                const h = ((rX - rY)**2) / ((rX + rY)**2);
                peri = Math.PI * (rX + rY) * (1 + (3*h)/(10 + Math.sqrt(4 - 3*h)));
                
                breakdown = `Elipse (Escala ${scaleX.toFixed(2)}x, ${scaleY.toFixed(2)}x)\nÁrea = π·a·b\n a=${rX.toFixed(1)}, b=${rY.toFixed(1)}\n Área ≈ ${Math.round(area)} px²\nPerímetro ≈ ${Math.round(peri)} px`;
                break;
            }
            case 'quadrado': {
                const w = 44 * scaleX;
                const h = 44 * scaleY;
                area = w * h;
                peri = 2 * (w + h);
                breakdown = `Retângulo\nLargura = ${w.toFixed(1)}, Altura = ${h.toFixed(1)}\nÁrea = ${w.toFixed(1)}·${h.toFixed(1)} = ${Math.round(area)} px²\nPerímetro = 2·(L+A) = ${Math.round(peri)} px`;
                break;
            }
            case 'triangulo': {
                const pts = scalePts([{x:0,y:-28},{x:24,y:18},{x:-24,y:18}]);
                ({area, peri} = polyMetrics(pts));
                breakdown = `Triângulo (Escalado)\nÁrea ≈ ${Math.round(area)} px²\nPerímetro ≈ ${Math.round(peri)} px`;
                break;
            }
            case 'pentagono': {
                const R = 26; const n = 5;
                const pts = [];
                for(let i=0; i<n; i++) {
                    const angle = (i * (360/n) - 90) * Math.PI / 180;
                    pts.push({x: Math.cos(angle)*R, y: Math.sin(angle)*R});
                }
                const scaledPts = scalePts(pts);
                ({area, peri} = polyMetrics(scaledPts));
                breakdown = `Pentágono (Escalado)\nÁrea ≈ ${Math.round(area)} px²\nPerímetro ≈ ${Math.round(peri)} px`;
                break;
            }
            case 'hexagono': {
                const R = 26; const n = 6;
                const pts = [];
                for(let i=0; i<n; i++) {
                    const angle = (i * (360/n) - 90) * Math.PI / 180;
                    pts.push({x: Math.cos(angle)*R, y: Math.sin(angle)*R});
                }
                const scaledPts = scalePts(pts);
                ({area, peri} = polyMetrics(scaledPts));
                breakdown = `Hexágono (Escalado)\nÁrea ≈ ${Math.round(area)} px²\nPerímetro ≈ ${Math.round(peri)} px`;
                break;
            }
            case 'losango': {
                const pts = scalePts([{x:0,y:-30},{x:20,y:0},{x:0,y:30},{x:-20,y:0}]); 
                ({area, peri} = polyMetrics(pts));
                const d1 = 60 * scaleY; 
                const d2 = 40 * scaleX;
                breakdown = `Losango\nDiagonais: ${d1.toFixed(1)} x ${d2.toFixed(1)}\nÁrea = (D1·D2)/2 = ${Math.round(area)} px²\nPerímetro ≈ ${Math.round(peri)} px`;
                break;
            }
            default: {
                const avgScale = (scaleX + scaleY) / 2;
                const baseSize = 30 * avgScale;
                area = baseSize * baseSize; 
                peri = baseSize * 4;
                breakdown = `Forma Complexa\nÁrea Estimada ≈ ${Math.round(area)} px²`;
                break;
            }
        }
        return { area, peri, breakdown };
    }

    // Helpers para métricas geométricas simples (usadas para validação/educação)
    // (Definidas no escopo superior para uso na árvore genealógica também)
    const creationPanel = document.getElementById('creation-panel');
    const btnOpen = document.getElementById('btn-open-lab');
    const btnSynthesize = document.getElementById('btn-synthesize');
    const btnCancel = document.getElementById('btn-cancel');
    const gridContainer = document.getElementById('options-grid');
    const recipeSummary = document.getElementById('recipe-summary');

    const slotForma = document.getElementById('slot-forma');
    const slotChem = document.getElementById('slot-chem');
    const slotPhys = document.getElementById('slot-phys');

    const btnTree = document.getElementById('btn-tree');
    const treeModal = document.getElementById('tree-modal');
    const btnCloseTree = document.getElementById('btn-close-tree');
    const treeContent = document.getElementById('tree-content');

    if (btnTree) {
        btnTree.addEventListener('click', () => {
            treeModal.classList.toggle('hidden');
        });
    }
    if (btnCloseTree) {
        btnCloseTree.addEventListener('click', () => {
            treeModal.classList.add('hidden');
        });
    }

    game.events.on('update-tree', (familyData) => {
        renderFamilyTree(familyData);
    });

    function renderFamilyTree(data) {
        treeContent.innerHTML = '';
        if (!data || !data.length) {
            treeContent.innerHTML = '<div style="text-align:center; color:#666; margin-top:50px;">Nenhum registro de vida disponível.</div>';
            return;
        }

        // 1. Mapeamento ID -> Dados
        const map = {};
        data.forEach(d => map[d.id] = d);

        // 2. Determinar Gerações
        const generations = {}; 
        const nodeGen = {}; 

        function getGen(id) {
            if (nodeGen[id] !== undefined) return nodeGen[id];
            const node = map[id];
            // Se não existe ou não tem pais conhecidos no registro, é Geração 0
            if (!node || !node.parents || node.parents.length === 0) {
                nodeGen[id] = 0;
                return 0;
            }
            
            // Se tem pais, mas nenhum está no mapa (ex: deletados?), é Geração 0
            const knownParents = node.parents.filter(pid => map[pid]);
            if (knownParents.length === 0) {
                nodeGen[id] = 0;
                return 0;
            }

            let maxP = -1;
            knownParents.forEach(pid => {
                const pGen = getGen(pid);
                if (pGen > maxP) maxP = pGen;
            });
            
            const myGen = maxP + 1;
            nodeGen[id] = myGen;
            return myGen;
        }

        data.forEach(d => {
            const g = getGen(d.id);
            if (!generations[g]) generations[g] = [];
            generations[g].push(d);
        });

        // 3. Renderizar por Geração
        const genKeys = Object.keys(generations).sort((a,b) => a-b);
        
        genKeys.forEach(key => {
            const row = document.createElement('div');
            row.className = 'tree-generation-row';
            
            const label = document.createElement('div');
            label.className = 'gen-label';
            label.innerText = `GERAÇÃO ${key}`;
            row.appendChild(label);

            const rowContent = document.createElement('div');
            rowContent.className = 'gen-content';

            generations[key].forEach(golem => {
                const card = createGolemCard(golem, map);
                rowContent.appendChild(card);
            });
            
            row.appendChild(rowContent);
            treeContent.appendChild(row);
        });
    }

    function createGolemCard(rec, map) {
        const card = document.createElement('div');
        card.className = 'golem-card';
        
        // Cor baseada na física (elemento)
        let color = '#888';
        if (rec.fisica) {
            switch(rec.fisica.id) {
                case 'eletricidade': color = '#ffea00'; break;
                case 'calor':        color = '#ff4d00'; break;
                case 'radiacao':     color = '#00ff00'; break;
                case 'gravidade':    color = '#9d00ff'; break;
                case 'luz':          color = '#ffffff'; break;
                case 'frio':         color = '#0088ff'; break;
                case 'magnetismo':   color = '#ff00aa'; break;
            }
        }
        card.style.borderColor = color;

        const header = document.createElement('div');
        header.className = 'golem-card-header';

        const icon = document.createElement('div');
        icon.className = 'golem-icon';
        icon.style.borderColor = color;
        icon.style.color = color;
        // Ícone simples baseado na forma
        let shapeIcon = '⬜';
        if(rec.forma) {
            if(rec.forma.id === 'circulo') shapeIcon = '⚪';
            if(rec.forma.id === 'triangulo') shapeIcon = '🔺';
            if(rec.forma.id === 'pentagono') shapeIcon = '⬠';
            if(rec.forma.id === 'hexagono') shapeIcon = '⬡';
        }
        icon.innerText = shapeIcon;

        const info = document.createElement('div');
        info.className = 'golem-info';
        
        const name = document.createElement('div');
        name.className = 'golem-name';
        name.innerText = rec.name || 'Desconhecido';
        
        const meta = document.createElement('div');
        meta.className = 'golem-meta';
        const born = rec.bornAt ? new Date(rec.bornAt).toLocaleTimeString() : '--:--';
        meta.innerText = `${born}`;

        info.appendChild(name);
        info.appendChild(meta);
        header.appendChild(icon);
        header.appendChild(info);
        card.appendChild(header);

        // Parents info
        if (rec.parents && rec.parents.length > 0) {
            const pDiv = document.createElement('div');
            pDiv.className = 'golem-parents';
            pDiv.innerHTML = '<strong>PAIS:</strong>';
            
            rec.parents.forEach((pid, idx) => {
                if(!pid) return;
                const pName = map[pid] ? map[pid].name : '???';
                const span = document.createElement('span');
                span.className = 'parent-link';
                span.innerText = pName;
                span.title = `ID: ${pid}`;
                
                pDiv.appendChild(span);
                if (idx < rec.parents.length - 1) {
                    pDiv.appendChild(document.createTextNode(' & '));
                }
            });
            card.appendChild(pDiv);
        }

        // Stats summary
        const statsDiv = document.createElement('div');
        statsDiv.style.fontSize = '8px';
        statsDiv.style.color = '#aaa';
        statsDiv.style.marginTop = '5px';
        const evCount = (rec.lifeLog && rec.lifeLog.length) ? rec.lifeLog.length : 0;
        statsDiv.innerText = `${evCount} eventos registrados`;
        card.appendChild(statsDiv);

        // Math Info
        if (rec.forma) {
            const sX = rec.stats ? (rec.stats.scaleX || parseFloat(rec.stats.scale) || 1) : 1;
            const sY = rec.stats ? (rec.stats.scaleY || parseFloat(rec.stats.scale) || 1) : 1;
            const metrics = computeShapeMetrics(rec.forma.id, sX, sY);
            if (metrics.area) {
                const mathDiv = document.createElement('div');
                mathDiv.style.marginTop = '8px';
                mathDiv.style.padding = '6px';
                mathDiv.style.background = '#111';
                mathDiv.style.border = '1px dashed #444';
                mathDiv.style.fontSize = '8px';
                mathDiv.style.fontFamily = 'monospace';
                mathDiv.style.color = '#00ffff';
                
                mathDiv.innerHTML = `
                    <div style="margin-bottom:4px;">ÁREA: ${Math.round(metrics.area)} px²</div>
                    <div style="color:#888; white-space:pre-wrap; font-size:7px;">${metrics.breakdown}</div>
                `;
                card.appendChild(mathDiv);
            }
        }

        // click: abrir modal de inspeção com detalhes completos
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            // Monta payload compatível com handler de inspeção
            const data = {
                stats: {
                    name: rec.name || 'Desconhecido',
                    description: rec.forma ? (rec.forma.name || rec.forma.id) : '—',
                    dialogo: rec.dialogo || '...','stats': { forca: '?', resistencia: '?', energia: '?' }
                },
                visual: {
                    forma: rec.forma || null,
                    quimica: rec.quimica || null,
                    fisica: rec.fisica || null
                },
                lifeLog: rec.lifeLog || []
            };

            // Fecha a janela da árvore para focar no modal
            if (treeModal) treeModal.classList.add('hidden');

            // Força o modal para modo grande e centralizado
            if (inspectModal) {
                inspectModal.classList.add('modal-large');
            }

            // Emite o evento para usar o handler existente
            game.events.emit('inspect-golem', data);
        });

        return card;
    }

    btnOpen.addEventListener('click', () => {
        creationPanel.classList.remove('hidden');
        btnOpen.classList.add('hidden');
        switchTab('forma');
    });

    btnCancel.addEventListener('click', () => {
        creationPanel.classList.add('hidden');
        btnOpen.classList.remove('hidden');
        resetSelection();
    });

    slotForma.addEventListener('click', () => switchTab('forma'));
    slotChem.addEventListener('click', () => switchTab('quimica'));
    slotPhys.addEventListener('click', () => switchTab('fisica'));

    function switchTab(category) {
        activeCategory = category;
        [slotForma, slotChem, slotPhys].forEach(s => s.classList.remove('active'));
        if(category === 'forma') slotForma.classList.add('active');
        if(category === 'quimica') slotChem.classList.add('active');
        if(category === 'fisica') slotPhys.classList.add('active');
        renderGrid(category);
    }

    function renderGrid(category) {
        gridContainer.innerHTML = '';
        const items = ELEMENTS[category];

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'grid-item';
            if (currentSelection[category] && currentSelection[category].id === item.id) {
                div.classList.add('selected');
            }

            div.innerHTML = `<strong>${item.name}</strong><span class="desc">${item.desc}</span>`;
            div.addEventListener('click', () => {
                selectItem(category, item);
            });
            gridContainer.appendChild(div);
        });
    }

    function selectItem(category, item) {
        currentSelection[category] = item;
        updateSlotVisual(category, item);
        renderGrid(category);

        if (category === 'forma' && !currentSelection.quimica) {
            setTimeout(() => switchTab('quimica'), 200);
        } else if (category === 'quimica' && !currentSelection.fisica) {
            setTimeout(() => switchTab('fisica'), 200);
        }
        checkCraftingReady();
    }

    function updateSlotVisual(category, item) {
        let slot;
        let icon = '?';
        if (category === 'forma') { slot = slotForma; icon = '📐'; }
        if (category === 'quimica') { slot = slotChem; icon = '🧪'; }
        if (category === 'fisica') { slot = slotPhys; icon = '⚡'; }

        slot.classList.add('filled');
        slot.querySelector('.slot-icon').innerText = icon;
        slot.querySelector('.slot-name').innerText = item.name;
    }

    function resetSelection() {
        currentSelection = { forma: null, quimica: null, fisica: null };
        [slotForma, slotChem, slotPhys].forEach(s => {
            s.classList.remove('filled');
            s.querySelector('.slot-icon').innerText = '?';
            s.querySelector('.slot-name').innerText = 'Selecione';
        });
        btnSynthesize.disabled = true;
        recipeSummary.innerText = '...';
        switchTab('forma');
    }

    function checkCraftingReady() {
        const isReady = currentSelection.forma && currentSelection.quimica && currentSelection.fisica;
        if (isReady) {
            btnSynthesize.removeAttribute('disabled');
            btnSynthesize.innerHTML = "SINTETIZAR";
            recipeSummary.innerText = `${currentSelection.forma.name} + ${currentSelection.quimica.name} + ${currentSelection.fisica.name}`;
        } else {
            btnSynthesize.setAttribute('disabled', 'true');
            btnSynthesize.innerHTML = "INCOMPLETO";
            recipeSummary.innerText = 'Preencha todos os slots';
        }
    }

    btnSynthesize.addEventListener('click', () => {
        btnSynthesize.innerHTML = "PROCESSANDO...";
        btnSynthesize.disabled = true;
        
        setTimeout(async () => {
            const aiResult = await generateGolemData(currentSelection);
            const golemData = { ...currentSelection, aiData: aiResult };
            
            game.events.emit('spawn-golem', golemData);
            
            creationPanel.classList.add('hidden');
            btnOpen.classList.remove('hidden');
            resetSelection();
            btnSynthesize.innerHTML = "DAR VIDA";
        }, 500);
    });

    const inspectModal = document.getElementById('inspect-modal');
    const elName = document.getElementById('inspect-name');
    const elDesc = document.getElementById('inspect-desc');
    const elStr = document.getElementById('val-str');
    const elRes = document.getElementById('val-res');
    const elEng = document.getElementById('val-eng');
    const elDiag = document.getElementById('inspect-dialogue');
    const elArea = document.getElementById('val-area');
    const elPeri = document.getElementById('val-peri');
    const elScale = document.getElementById('val-scale');
    const elFormula = document.getElementById('val-formula');
    const elHistory = document.getElementById('inspect-history');
    const elVisualLarge = document.getElementById('inspect-visual-large');
    const btnCloseInspect = document.getElementById('btn-close-inspect');

    if (btnCloseInspect) {
        btnCloseInspect.addEventListener('click', () => {
            game.events.emit('hide-inspect');
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!inspectModal.classList.contains('hidden')) {
            // Não reposicionar quando o modal estiver em modo expandido (modal-large)
            if (inspectModal.classList.contains('modal-large')) return;
            let top = e.clientY + 15;
            let left = e.clientX + 15;
            if (left > window.innerWidth - 340) left = e.clientX - 340;
            if (top > window.innerHeight - 300) top = e.clientY - 300;
            inspectModal.style.top = `${top}px`;
            inspectModal.style.left = `${left}px`;
        }
    });

    game.events.on('inspect-golem', (data) => {
        const stats = data.stats || {};
        const att = stats.stats || { forca: '?', resistencia: '?', energia: '?' };
        const visual = data.visual || {};

        elName.innerText = stats.name || "ANALISANDO...";
        elDesc.innerText = stats.description || "Forma de vida detectada.";

        elStr.innerText = att.forca;
        elRes.innerText = att.resistencia;
        elEng.innerText = att.energia;
        elDiag.innerText = stats.dialogo || "...";

        // Renderizar visual grande (SVG simples)
        if (elVisualLarge) {
            elVisualLarge.innerHTML = '';
            if (visual.forma) {
                let svgShape = '';
                let color = '#00ffff';
                if (visual.fisica) {
                    switch(visual.fisica.id) {
                        case 'eletricidade': color = '#ffea00'; break;
                        case 'calor':        color = '#ff4d00'; break;
                        case 'radiacao':     color = '#00ff00'; break;
                        case 'gravidade':    color = '#9d00ff'; break;
                        case 'luz':          color = '#ffffff'; break;
                        case 'frio':         color = '#0088ff'; break;
                        case 'magnetismo':   color = '#ff00aa'; break;
                    }
                }
                
                const s = 100; // size
                const c = s/2; // center
                
                // Aspect Ratio Logic (Visualização Proporcional)
                const scX = att ? (att.scaleX || parseFloat(att.scale) || 1) : 1;
                const scY = att ? (att.scaleY || parseFloat(att.scale) || 1) : 1;
                const maxSc = Math.max(scX, scY);
                const nX = scX / maxSc;
                const nY = scY / maxSc;

                switch(visual.forma.id) {
                    case 'circulo':
                        svgShape = `<ellipse cx="${c}" cy="${c}" rx="${s*0.4*nX}" ry="${s*0.4*nY}" stroke="${color}" stroke-width="4" fill="none" />`;
                        break;
                    case 'quadrado': {
                        const w = s*0.7*nX;
                        const h = s*0.7*nY;
                        svgShape = `<rect x="${c-w/2}" y="${c-h/2}" width="${w}" height="${h}" stroke="${color}" stroke-width="4" fill="none" />`;
                        break;
                    }
                    case 'triangulo':
                        svgShape = `<polygon points="${c},${c - s*0.4*nY} ${c + s*0.35*nX},${c + s*0.3*nY} ${c - s*0.35*nX},${c + s*0.3*nY}" stroke="${color}" stroke-width="4" fill="none" />`;
                        break;
                    case 'pentagono':
                        svgShape = `<g transform="translate(50,50) scale(${nX}, ${nY}) translate(-50,-50)">
                            <polygon points="50,10 90,40 75,90 25,90 10,40" transform="scale(1.5) translate(-15,-15)" stroke="${color}" stroke-width="3" fill="none" />
                        </g>`;
                        break;
                    case 'hexagono':
                        svgShape = `<g transform="translate(50,50) scale(${nX}, ${nY}) translate(-50,-50)">
                            <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" transform="scale(1.5) translate(-15,-15)" stroke="${color}" stroke-width="3" fill="none" />
                        </g>`;
                        break;
                    case 'losango':
                        svgShape = `<g transform="translate(50,50) scale(${nX}, ${nY}) translate(-50,-50)">
                            <polygon points="50,10 80,50 50,90 20,50" transform="scale(1.5) translate(-15,-15)" stroke="${color}" stroke-width="3" fill="none" />
                        </g>`;
                        break;
                    // --- Tridimensionais (representação 2D simplificada) ---
                    case 'cilindro':
                        svgShape = `
                            <g stroke="${color}" stroke-width="2" fill="none">
                                <ellipse cx="${c}" cy="${c-28*0.5}" rx="${s*0.35*nX}" ry="${s*0.12}" />
                                <rect x="${c - s*0.35*nX}" y="${c-28*0.5}" width="${s*0.7*nX}" height="${s*0.6*nY}" />
                                <ellipse cx="${c}" cy="${c-28*0.5 + s*0.6*nY}" rx="${s*0.35*nX}" ry="${s*0.12}" />
                            </g>`;
                        break;
                    case 'cone':
                        svgShape = `
                            <g stroke="${color}" stroke-width="2" fill="none">
                                <polygon points="${c},${c - s*0.45*nY} ${c + s*0.35*nX},${c + s*0.3*nY} ${c - s*0.35*nX},${c + s*0.3*nY}" />
                                <ellipse cx="${c}" cy="${c + s*0.3*nY}" rx="${s*0.33*nX}" ry="${s*0.09}" />
                            </g>`;
                        break;
                    case 'piramide':
                        svgShape = `
                            <g stroke="${color}" stroke-width="2" fill="none">
                                <polygon points="${c},${c - s*0.45*nY} ${c + s*0.36*nX},${c + s*0.32*nY} ${c - s*0.36*nX},${c + s*0.32*nY}" />
                                <line x1="${c}" y1="${c - s*0.45*nY}" x2="${c}" y2="${c + s*0.32*nY}" />
                            </g>`;
                        break;
                    case 'obelisco':
                        svgShape = `
                            <g stroke="${color}" stroke-width="2" fill="none">
                                <rect x="${c - s*0.12*nX}" y="${c - s*0.45*nY}" width="${s*0.24*nX}" height="${s*0.9*nY}" />
                                <polygon points="${c - s*0.12*nX},${c - s*0.45*nY} ${c},${c - s*0.6*nY} ${c + s*0.12*nX},${c - s*0.45*nY}" />
                            </g>`;
                        break;
                    case 'esfera':
                        svgShape = `
                            <g stroke="${color}" stroke-width="2" fill="none">
                                <circle cx="${c}" cy="${c}" r="${s*0.36* (nX+nY)/2 }" />
                                <ellipse cx="${c}" cy="${c}" rx="${s*0.36*nX}" ry="${s*0.12*nY}" />
                            </g>`;
                        break;
                    case 'cristal':
                        svgShape = `
                            <g stroke="${color}" stroke-width="2" fill="none">
                                <polygon points="${c},${c - s*0.45*nY} ${c + s*0.18*nX},${c} ${c + s*0.05*nX},${c + s*0.45*nY} ${c - s*0.05*nX},${c + s*0.45*nY} ${c - s*0.18*nX},${c}" />
                                <line x1="${c}" y1="${c - s*0.45*nY}" x2="${c + s*0.18*nX}" y2="${c}" />
                                <line x1="${c}" y1="${c - s*0.45*nY}" x2="${c - s*0.18*nX}" y2="${c}" />
                            </g>`;
                        break;
                    case 'tesseract':
                    case 'fractal':
                        // Abstract cube-like / complex symbol
                        svgShape = `
                            <g stroke="${color}" stroke-width="2" fill="none">
                                <rect x="${c - s*0.22}" y="${c - s*0.22}" width="${s*0.44}" height="${s*0.44}" />
                                <rect x="${c - s*0.12}" y="${c - s*0.32}" width="${s*0.44}" height="${s*0.44}" transform="rotate(12 ${c} ${c})" />
                            </g>`;
                        break;
                    default:
                        svgShape = `<text x="50%" y="50%" fill="${color}" font-size="30" text-anchor="middle" dy=".3em">?</text>`;
                }
                
                elVisualLarge.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100">${svgShape}</svg>`;
                // Efeito de brilho
                elVisualLarge.style.boxShadow = `0 0 20px ${color}40`;
                elVisualLarge.style.borderColor = color;
            }
        }

        // Mostrar área/perímetro apenas se houver elementos suficientes para validar
        if (visual && visual.forma && visual.quimica) {
            const sX = att ? (att.scaleX || parseFloat(att.scale) || 1) : 1;
            const sY = att ? (att.scaleY || parseFloat(att.scale) || 1) : 1;
            const metrics = computeShapeMetrics(visual.forma.id, sX, sY);

            if (metrics.area && !Number.isNaN(metrics.area)) {
                elArea.innerText = Math.round(metrics.area);
                elPeri.innerText = Math.round(metrics.peri);
                elScale.innerText = `${sX.toFixed(2)}x / ${sY.toFixed(2)}x`;
                elFormula.innerText = metrics.breakdown || '';
            } else {
                elArea.innerText = '--';
                elPeri.innerText = '--';
                elScale.innerText = '1x';
                elFormula.innerText = 'Cálculo não disponível para esta forma.';
            }
        } else {
            elArea.innerText = '--';
            elPeri.innerText = '--';
            elScale.innerText = '—';
            elFormula.innerText = 'Preencha `Forma` e `Estrutura` para habilitar cálculo.';
        }

        // Render life history timeline (animated)
        function renderHistory(log) {
            elHistory.innerHTML = '';
            elHistory.className = 'history-timeline'; // Aplica classe CSS
            
            if (!log || !log.length) {
                elHistory.innerHTML = '<div style="padding:10px; color:#666; font-style:italic;">Sem histórico.</div>';
                return;
            }

            // Mostra do mais recente para o mais antigo ou vice-versa? 
            // Geralmente timeline é mais recente no topo ou base. Vamos colocar mais recente no topo.
            log.slice().reverse().forEach((entry, idx) => {
                const div = document.createElement('div');
                div.className = `history-item ${entry.type}`; // Adiciona classe do tipo para cor
                div.style.animationDelay = `${idx * 100}ms`; // Stagger animation

                const time = new Date(entry.ts).toLocaleTimeString();
                
                div.innerHTML = `
                    <span class="h-time">${time}</span>
                    <strong style="color:#fff; font-size:8px;">${entry.type.toUpperCase()}</strong>
                    <span class="h-detail">${entry.detail}</span>
                `;
                
                elHistory.appendChild(div);
            });
        }

        renderHistory(data.lifeLog || []);

        inspectModal.classList.remove('hidden');
    });

    game.events.on('hide-inspect', () => {
        inspectModal.classList.add('hidden');
        inspectModal.classList.remove('modal-large');
    });

    const tools = document.querySelectorAll('.tool-slot');
    let draggedTool = null;
    let ghostElement = null;

    tools.forEach(tool => {
        tool.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const action = tool.dataset.action;
            const icon = tool.querySelector('.tool-icon').innerText;
            startDrag(action, icon, e.clientX, e.clientY);
        });
    });

    function startDrag(action, iconChar, startX, startY) {
        draggedTool = action;
        document.body.classList.add('grabbing');

        ghostElement = document.createElement('div');
        ghostElement.classList.add('dragging-ghost');
        ghostElement.innerText = iconChar;
        
        if (action === 'feed') ghostElement.style.borderColor = '#00ff00';
        if (action === 'burn') ghostElement.style.borderColor = '#ffaa00';
        if (action === 'kill') ghostElement.style.borderColor = '#ff0000';
        if (action === 'freeze') ghostElement.style.borderColor = '#00ffff';
        if (action === 'mutate') ghostElement.style.borderColor = '#ff00ff';

        document.body.appendChild(ghostElement);
        updateGhostPosition(startX, startY);

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
    }

    function onDragMove(e) {
        updateGhostPosition(e.clientX, e.clientY);
    }

    function updateGhostPosition(x, y) {
        if (ghostElement) {
            ghostElement.style.left = `${x}px`;
            ghostElement.style.top = `${y}px`;
        }
    }

    function onDragEnd(e) {
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.body.classList.remove('grabbing');
        
        if (ghostElement) ghostElement.remove();

        const canvas = document.querySelector('canvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                
                const gameX = (e.clientX - rect.left) * scaleX;
                const gameY = (e.clientY - rect.top) * scaleY;

                game.events.emit('tool-used', {
                    action: draggedTool,
                    x: gameX,
                    y: gameY
                });
            }
        }
        
        draggedTool = null;
        ghostElement = null;
    }
});