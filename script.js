//CONFIGURAÇÕES E CONSTANTES GLOBAIS
const MAP_SIZE = 42;
const TERRAIN_COSTS = { mountain: Infinity, plain: 1, rocky: 5 };
const INITIAL_KNIGHTS = {
    'Seiya':    { power: 1.5, energy: 5, maxEnergy: 5 },
    'Shiryu':   { power: 1.4, energy: 5, maxEnergy: 5 },
    'Hyoga':    { power: 1.3, energy: 5, maxEnergy: 5 },
    'Shun':     { power: 1.2, energy: 5, maxEnergy: 5 },
    'Ikki':     { power: 1.1, energy: 5, maxEnergy: 5 }
};
const INITIAL_ZODIAC_HOUSES = [
    { name: 'Áries',       difficulty: 50,  x: 28, y: 37 },
    { name: 'Touro',       difficulty: 55,  x: 12, y: 37 },
    { name: 'Gêmeos',      difficulty: 60,  x: 12, y: 31 },
    { name: 'Câncer',      difficulty: 70,  x: 28, y: 31 },
    { name: 'Leão',        difficulty: 75,  x: 28, y: 24 },
    { name: 'Virgem',      difficulty: 80,  x: 12, y: 24 },
    { name: 'Libra',       difficulty: 85,  x: 12, y: 17 },
    { name: 'Escorpião',   difficulty: 90,  x: 28, y: 17 },
    { name: 'Sagitário',   difficulty: 95,  x: 28, y: 10 },
    { name: 'Capricórnio', difficulty: 100, x: 12, y: 10 },
    { name: 'Aquário',     difficulty: 110, x: 12, y: 4 },
    { name: 'Peixes',      difficulty: 120, x: 28, y: 4 }
];
const START_POS = { x: 37, y: 37 };
const END_POS = { x: 37, y: 4 };



//VARIÁVEIS DE ESTADO DO JOGO
let knights = JSON.parse(JSON.stringify(INITIAL_KNIGHTS));
let zodiacHouses = JSON.parse(JSON.stringify(INITIAL_ZODIAC_HOUSES));
let gameMap = [];               // Armazena a matriz do mapa
let path = [];                  // Armazena o caminho calculado pelo A*
let currentPosition = 0;        // Índice da posição atual no caminho
let totalTime = 0;              // Tempo total decorrido na simulação
let completedHouses = [];       // Nomes das casas já visitadas
let simulationInterval = null;  // ID do intervalo da simulação (para poder pará-lo)



//GERAR PIXELS ANDÁVEIS
function getWalkablePathCoords() {
    const coords = new Set();
    
    //Adiciona os blocos retangulares andáveis
    function addRect(x1, x2, y1, y2){
        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                coords.add(`${x},${y}`);
            }
        }
    };
    
    //Desenha os caminhos horizontais e verticais
    //Ex segunda linha:
    // de x=3 até x=38
    // de y=9 até y=11
    addRect(3, 38, 3, 5);   //corredor 1
    addRect(3, 38, 9, 11);  //cooredor 2
    addRect(3, 38, 16, 18); //corredor 3
    addRect(3, 38, 23, 25); //corredor 4
    addRect(3, 38, 30, 32); //corredor 5
    addRect(3, 38, 36, 38); //corredor 6

    addRect(3, 5, 3, 11);   //conexão esquerda 1
    addRect(3, 5, 16, 25);  //conexão esquerda 2
    addRect(3, 5, 30, 38);  //conexão esquerda 3
    addRect(36, 38, 9, 18); //conexão direita 1
    addRect(36, 38, 23, 32);//conexão direita 2
    
    //Converte o Set de volta para um array de objetos
    return Array.from(coords).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y };
    });
}
const WALKABLE_PATH_COORDS = getWalkablePathCoords();



//AO CLICAR NO BOTÃO INICIAR
function initGame() {
    generateMap();              // Cria a matriz do mapa
    renderMap();                // Desenha o mapa na tela
    updateKnightsStatus();      // Exibe o status inicial dos cavaleiros
    updateHousesInfo();         // Exibe as informações das casas
    updateCurrentTimeDisplay(); // Zera o display de tempo
    matchHeights();             // Ajusta a altura das barras laterais

    document.getElementById('map').addEventListener('click', handleCellClick);
}



//GERAR MAPA
function generateMap() {
    // 1. Preenche todo o mapa com montanhas (uma matriz)
    gameMap = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill('mountain'));

    // 2. Cria os caminhos andáveis, definindo terrenos aleatórios (plano ou rochoso)
    WALKABLE_PATH_COORDS.forEach(pos => {
        gameMap[pos.y][pos.x] = Math.random() < 0.7 ? 'plain' : 'rocky'; //! Chacne de terreno plano (70%)
    });

    // 3. Coloca montanhas que forçam passar pela "frente" das casas
    for (let i = 0; i < 42; i++) {
        gameMap[i][28] = 'mountain';
        gameMap[i][12] = 'mountain';
    }

    // 4. Posiciona as casas, o início e o fim no mapa
    zodiacHouses.forEach(h => {
        if (gameMap[h.y]?.[h.x]) {
            gameMap[h.y][h.x] = 'house';
        }
    });
    gameMap[START_POS.y][START_POS.x] = 'start';
    gameMap[END_POS.y][END_POS.x] = 'end';
}



//RENDERIZAR MAPA
function renderMap() {
    const mapElement = document.getElementById('map');
    mapElement.innerHTML = '';

    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = `cell ${gameMap[y][x]}`;
            cell.id = `cell-${x}-${y}`;
            mapElement.appendChild(cell);
        }
    }
}



//AO CLICARA NUMA CÉLULA
function handleCellClick(event) {
    const cell = event.target;
    //Ignora cliques em células não-terreno (início, fim, casa)
    if (!cell.classList.contains('cell') || cell.classList.contains('start') || cell.classList.contains('end') || cell.classList.contains('house')) {
        return;
    }

    const [x, y] = cell.id.split('-').slice(1).map(Number);

    //Ciclo: plano -> rochoso -> montanha -> plano
    const terrainCycle = {  'plain': 'rocky',
                            'rocky': 'mountain',
                            'mountain': 'plain' };
    const newTerrain = terrainCycle[gameMap[y][x]] || 'plain';

    gameMap[y][x] = newTerrain;
    cell.className = `cell ${newTerrain}`;
}



//!
//! LÓGICA DO ALGORITMO A*
//!
function calculatePath() {
    //Lista de pontos (casas, start e end) de passagem
    const waypoints = [];
    waypoints.push(START_POS);
    for (let i = 0; i < zodiacHouses.length; i++) {
        waypoints.push(zodiacHouses[i]);
    }
    waypoints.push(END_POS);
    path = [];

    //Calcula o caminho de um ponto até a próximo ponto e junta tudo
    for (let i = 0; i < waypoints.length - 1; i++) {
        const startPoint = waypoints[i];
        const endPoint = waypoints[i + 1];
        
        //Busca A* para encontrar o melhor caminho de um ponto a outro 
        const segmentPath = aStarSearch(startPoint, endPoint);

        //Se a busca retornar um caminho vazio, significa que não há rota
        if (segmentPath.length === 0) {
            alert(`Não foi possível encontrar um caminho! Verifique se não há bloqueios.`);
            return;
        }

        //Adicionar o segmento ao caminho principal
        if (i === 0) {
            //Se for o primeiro segmento, adiciona todos os pontos do segmento ao caminho principal
            for (let j = 0; j < segmentPath.length; j++) {
                path.push(segmentPath[j]);
            }
        } else {
            //Se não, ignora o primeiro ponto do segmento para não duplicar a posição da casa (que já era o final do segmento anterior)
            for (let j = 1; j < segmentPath.length; j++) {
                path.push(segmentPath[j]);
            }
        }
    }

    visualizePath();
    document.getElementById('simulateBtn').disabled = false;
}



//BUSCAR MELHOR CAMINHO DE UM SEGMENTO 
function aStarSearch(start, goal) {
    //g = Custo do início até este nó
    //h = Custo estimado deste nó até o objetivo
    //f = Custo total (g + h)
    //parent = Nó pai

    const startNode = {
        x: start.x,
        y: start.y,
        g: 0, 
        h: heuristic(start, goal), 
        f: 0, 
        parent: null
    };
    startNode.f = startNode.g + startNode.h;

    const openSet = [startNode]; //Lista de nós que ainda precisam ser avaliados
    const closedSet = {};        //Mapa de nós que já foram avaliados

    //Enquanto houver nós para avaliar
    while (openSet.length > 0) {
        
        //Encontrar o nó com o menor custo F na openSet
        let lowestFIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestFIndex].f) {
                lowestFIndex = i;
            }
        }
        const current = openSet[lowestFIndex];

        //Verificar se chegou no objetivo
        if (current.x === goal.x && current.y === goal.y) {
            // Se sim, construir segmento completo
            const resultPath = [];
            let temp = current;
            while (temp !== null) {
                //unshift = inserir no início
                resultPath.unshift({
                    x: temp.x,
                    y: temp.y 
                });
                temp = temp.parent;
            }

            //um caminho foi encontrado
            return resultPath;
        }

        //Mover o nó atual da openSet para a closedSet
        openSet.splice(lowestFIndex, 1);
        const closedSetKey = `${current.x},${current.y}`;
        closedSet[closedSetKey] = true;

        //Molde para explorar os vizinhos
        const neighborCoords = [
            { dx: 1,  dy: 0 },  // Direita
            { dx: -1, dy: 0 },  // Esquerda
            { dx: 0,  dy: 1 },  // Baixo
            { dx: 0,  dy: -1 }  // Cima
        ];

        //Explorando vizinhos do nó atual
        for (let i = 0; i < neighborCoords.length; i++) {
            const coord = neighborCoords[i];
            const neighbor = {
                x: current.x + coord.dx,
                y: current.y + coord.dy
            };

            //Validando o vizinho
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            const terrain = gameMap[neighbor.y]?.[neighbor.x];
            if (closedSet[neighborKey] || !terrain || terrain === 'mountain') {
                continue;
            }

            //Calcular o novo custo para chegar a este vizinho
            //custo até aqui + custo até do próximo terreno
            const gScore = current.g + getTerrainCost(terrain);

            //Se este vizinho já está na openSet.
            let existingNeighborNode = null;
            for (let j = 0; j < openSet.length; j++) {
                if (openSet[j].x === neighbor.x && openSet[j].y === neighbor.y) {
                    existingNeighborNode = openSet[j];
                    break;
                }
            }
            
            if (existingNeighborNode === null) {
                //Se o vizinho não está na openSet, criar um novo nó para ele
                const newNode = {
                    x: neighbor.x,
                    y: neighbor.y,
                    g: gScore,
                    h: heuristic(neighbor, goal),
                    f: 0,
                    parent: current
                };
                newNode.f = newNode.g + newNode.h;
                openSet.push(newNode);
            } else if (gScore < existingNeighborNode.g) {
                // Se já está na openSet, mas foi encontrado um caminho MELHOR
                // Atualizar seus custos e seu nó pai
                existingNeighborNode.g = gScore;
                existingNeighborNode.f = gScore + existingNeighborNode.h;
                existingNeighborNode.parent = current;
            }
        }
    }

    //um caminho NÃO foi encontrado (sem rotas possíveis)
    return [];
}
function heuristic(a, b) {
    //Distância de Manhattan: |(x1-x2)| + |(y1-y2)|
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    
    //Distância de Euclidiana: √((x1-x2)² + (y1-y2)²)
    //return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}
function getTerrainCost(terrain) {
    return terrain === 'rocky' ? 5 : 1;
}



//ADICIONA A CLASSE .path ÀS CÉLULAS DO CAMINHO CALCULADO
function visualizePath() {
    //Limpa visualizações de caminhos anteriores
    document.querySelectorAll('.cell.path, .cell.current, .cell.traveled').forEach(c => c.classList.remove('path', 'current', 'traveled'));
    
    //Percorre o meu resultado e formata as células adicionando o .path
    path.forEach(pos => {
        const cell = document.getElementById(`cell-${pos.x}-${pos.y}`);
        //Não colore células de início, fim ou casas
        if (cell && !['start', 'end', 'house'].some(c => cell.classList.contains(c))) {
            cell.classList.add('path');
        }
    });
}



//!
//! LÓGICA DA SIMULAÇÃO
//!
function startSimulation() {
    if (path.length === 0) {
        alert('Primeiro calcule um caminho!');
        return;
    }

    //Redefinir simulação
    if (simulationInterval) clearInterval(simulationInterval);
    currentPosition = 0;
    totalTime = 0;
    completedHouses = [];
    Object.keys(knights).forEach(k => knights[k].energy = knights[k].maxEnergy);
    renderMap();

    //Mostra o caminho a ser percorrido
    visualizePath();

    //Atualiza a interface
    updateKnightsStatus();
    updateHousesInfo();
    updateCurrentTimeDisplay();
    document.getElementById('simulateBtn').disabled = true;
    document.getElementById('calculateBtn').disabled = true;

    //Chama moveToNextPosition a cada 50ms
    simulationInterval = setInterval(moveToNextPosition, 50); //! Controla o tempo da animação (50ms)
}



//MOVER PARA A PRÓXIMA CÉLULA
function moveToNextPosition() {
    //Se a simulação terminou, para o loop
    if (currentPosition >= path.length) {
        endSimulation();
        return;
    }

    //Limpa a marcação da posição anterior
    if (currentPosition > 0) {
        //Célula anterior
        const prevCell = document.getElementById(`cell-${path[currentPosition - 1].x}-${path[currentPosition - 1].y}`);
        
        if (prevCell) {
            prevCell.classList.remove('current');
            if (!['start', 'end', 'house'].some(c => prevCell.classList.contains(c))) {
                prevCell.classList.remove('path');
                prevCell.classList.add('traveled');
            }
        }
    }

    //Marca a nova posição atual
    const pos = path[currentPosition];
    document.getElementById(`cell-${pos.x}-${pos.y}`)?.classList.add('current');

    //Verifica se a posição atual é uma casa do zodíaco
    const house = zodiacHouses.find(h => h.x === pos.x && h.y === pos.y);
    if (house && !completedHouses.includes(house.name)) {
        //Se for uma casa não completa, inicia a batalha
        runAutoBattle(house);
    }

    //Adiciona o custo do terreno ao tempo total
    totalTime += getTerrainCost(gameMap[pos.y][pos.x]);
    updateCurrentTimeDisplay();
    currentPosition++;
}



//SIMULA UMA BATALHA EM UMA CASA
function runAutoBattle(house) {
    //Seleciona os 2 cavaleiros com mais poder e que ainda têm energia
    const fighters = Object.entries(knights).filter(([, k]) => k.energy > 0).sort(([, a], [, b]) => b.power - a.power).slice(0, 2);

    //Se não há cavaleiros para lutar...
    if (fighters.length === 0) {
        endSimulation();
        return;
    }

    //Calcula a força total e tira uma energia
    let totalPower = 0;
    fighters.forEach(([name]) => {
        totalPower += knights[name].power;
        knights[name].energy--;
    });

    //Calcula o tempo da batalha com base na fórmula
    totalTime += Math.ceil(house.difficulty / totalPower);

    //Atualiza o estado do jogo e a interface
    updateCurrentTimeDisplay();
    completedHouses.push(house.name);
    updateKnightsStatus();
    updateHousesInfo();
}



//FINALIZA A SIMULAÇÃO E EXIBE OS RESULTADOS
function endSimulation() {
    clearInterval(simulationInterval);
    simulationInterval = null;
    document.getElementById('simulateBtn').disabled = false;
    document.getElementById('calculateBtn').disabled = false;

    //Condição de vitória: 12 casas completas AND pelo menos 1 cavaleiro vivo
    const success = completedHouses.length === 12 && Object.values(knights).some(k => k.energy > 0);
    showResults(success);
}
function showResults(success) {
    const resultsHTML = `
        <div class="result-item"><span>Status da Missão:</span><span style="font-weight: bold; color: ${success ? '#28a745' : '#dc3545'}">${success ? 'Athena foi salva! ✨' : 'FALHA NA MISSÃO 💔'}</span></div>
        <div class="result-item"><span>Tempo Total:</span><span>${totalTime} minutos</span></div>
        <div class="result-item"><span>Casas Completadas:</span><span>${completedHouses.length}/12</span></div>
        <div class="result-item"><span>Cavaleiros Vivos:</span><span>${Object.values(knights).filter(k => k.energy > 0).length}/5</span></div>`;
    $('#modalResultsBody').html(resultsHTML);
    $('#resultsModal').modal('show');
}



//FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE
function updateCurrentTimeDisplay() {
    document.getElementById('currentTimeDisplay').textContent = `${totalTime} minutos`;
}
function updateKnightsStatus() {
    const statusDiv = document.getElementById('knightsStatus');
    statusDiv.innerHTML = Object.entries(knights).map(([name, knight]) => `
        <div class="knight ${knight.energy <= 0 ? 'dead' : ''}">
            <span>${name}</span>
            <div class="stat-controls">
                <button class="adjust-btn" onclick="updateKnightPower('${name}', -0.1)">-</button>
                <input type="number" step="0.1" value="${knight.power.toFixed(1)}" onchange="setKnightPower('${name}', this.value)">
                <button class="adjust-btn" onclick="updateKnightPower('${name}', 0.1)">+</button>
            </div>
            <div class="energy-bar">${Array.from({ length: knight.maxEnergy }, (_, i) => `<div class="energy-point ${i < knight.energy ? '' : 'empty'}"></div>`).join('')}</div>
        </div>`).join('');
}
function updateHousesInfo() {
    document.getElementById('housesInfo').innerHTML = zodiacHouses.map((house, index) => `
        <div class="house ${completedHouses.includes(house.name) ? 'completed' : ''}">
            <span>${house.name}</span>
            <div class="stat-controls">
                <button class="adjust-btn" onclick="updateHouseDifficulty(${index}, -5)">-</button>
                <input type="number" step="5" value="${house.difficulty}" onchange="setHouseDifficulty(${index}, this.value)">
                <button class="adjust-btn" onclick="updateHouseDifficulty(${index}, 5)">+</button>
            </div>
        </div>`).join('');
}



//FUNÇÕES DE MANIPULAÇÃO DE ESTADO (PELO USUÁRIO)
function updateKnightPower(name, delta) {
    knights[name].power = Math.max(0.1, parseFloat((knights[name].power + delta).toFixed(1)));
    updateKnightsStatus();
}
function setKnightPower(name, value) {
    knights[name].power = Math.max(0.1, parseFloat(value) || 1.0);
    updateKnightsStatus();
}
function updateHouseDifficulty(index, delta) {
    zodiacHouses[index].difficulty = Math.max(0, zodiacHouses[index].difficulty + delta);
    updateHousesInfo();
}
function setHouseDifficulty(index, value) {
    zodiacHouses[index].difficulty = Math.max(0, parseInt(value) || 50);
    updateHousesInfo();
}



//FUNÇÕES DE CONTROLE DO JOGO
//Resetar o estado lógico principal do jogo
function _resetCoreState() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
    path = [];
    currentPosition = 0;
    totalTime = 0;
    completedHouses = [];
    simulationInterval = null;
    
    //Recarrega o estado inicial dos cavaleiros e casas
    knights = JSON.parse(JSON.stringify(INITIAL_KNIGHTS));
    zodiacHouses = JSON.parse(JSON.stringify(INITIAL_ZODIAC_HOUSES));

    document.getElementById('simulateBtn').disabled = true;
    document.getElementById('calculateBtn').disabled = false;
    updateCurrentTimeDisplay();
}

//Reseta a simulação, mantendo o mapa atual
function resetSimulation() {
    _resetCoreState();
    renderMap();
    updateKnightsStatus();
    updateHousesInfo();
}

//Gera um novo mapa aleatório e reseta a simulação
function generateNewMap() {
    _resetCoreState();
    generateMap();
    renderMap();
    updateKnightsStatus();
    updateHousesInfo();
}

//Faz que as barras laterais tenham a mesma altura do container do mapa
function matchHeights() {
    const mapContainer = document.querySelector('.map-container');
    const sidebar = document.querySelector('.sidebar');
    const leftSidebar = document.querySelector('.left-sidebar');
    if (mapContainer && sidebar && leftSidebar) {
        const mapHeight = `${mapContainer.offsetHeight}px`;
        sidebar.style.height = mapHeight;
        leftSidebar.style.height = mapHeight;
    }
}

//LISTENERS GLOBAIS
window.addEventListener('DOMContentLoaded', initGame);
window.addEventListener('resize', matchHeights);
