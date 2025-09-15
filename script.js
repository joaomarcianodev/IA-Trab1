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
    { name: 'Áries',       difficulty: 50,  x: 28, y: 37 }, { name: 'Touro',       difficulty: 55,  x: 12, y: 37 },
    { name: 'Gêmeos',      difficulty: 60,  x: 12, y: 31 }, { name: 'Câncer',      difficulty: 70,  x: 28, y: 31 },
    { name: 'Leão',        difficulty: 75,  x: 28, y: 24 }, { name: 'Virgem',      difficulty: 80,  x: 12, y: 24 },
    { name: 'Libra',       difficulty: 85,  x: 12, y: 17 }, { name: 'Escorpião',   difficulty: 90,  x: 28, y: 17 },
    { name: 'Sagitário',   difficulty: 95,  x: 28, y: 10 }, { name: 'Capricórnio', difficulty: 100, x: 12, y: 10 },
    { name: 'Aquário',     difficulty: 110, x: 12, y: 4 },  { name: 'Peixes',      difficulty: 120, x: 28, y: 4 }
];

let knights = JSON.parse(JSON.stringify(INITIAL_KNIGHTS));
let zodiacHouses = JSON.parse(JSON.stringify(INITIAL_ZODIAC_HOUSES));

const START_POS = { x: 37, y: 37 };
const END_POS = { x: 37, y: 4 };

let gameMap = [], path = [], currentPosition = 0, totalTime = 0, completedHouses = [], simulationInterval = null;

function getWalkablePathCoords() {
    const coords = new Set();
    const addRect = (x1, y1, x2, y2) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) coords.add(`${x},${y}`); };
    addRect(3, 3, 38, 5); addRect(3, 9, 38, 11); addRect(3, 16, 38, 18); addRect(3, 23, 38, 25);
    addRect(3, 30, 38, 32); addRect(3, 36, 38, 38); addRect(3, 3, 5, 11); addRect(3, 16, 5, 25);
    addRect(3, 30, 5, 38); addRect(36, 9, 38, 18); addRect(36, 23, 38, 32);
    return Array.from(coords).map(s => { const [x, y] = s.split(',').map(Number); return { x, y }; });
}
const WALKABLE_PATH_COORDS = getWalkablePathCoords();

function initGame() {
    generateMap(); renderMap(); updateKnightsStatus(); updateHousesInfo(); 
    updateCurrentTimeDisplay(); matchHeights();
    document.getElementById('map').addEventListener('click', handleCellClick);
}

function generateMap() {
    gameMap = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill('mountain'));
    WALKABLE_PATH_COORDS.forEach(pos => {
        if (gameMap[pos.y]?.[pos.x]) gameMap[pos.y][pos.x] = Math.random() < 0.7 ? 'plain' : 'rocky';
    });
    for(i=0; i<42; i++){gameMap[i][28] = 'mountain';gameMap[i][12] = 'mountain';}
    zodiacHouses.forEach(h => { if (gameMap[h.y]?.[h.x]) gameMap[h.y][h.x] = 'house'; });
    gameMap[START_POS.y][START_POS.x] = 'start';
    gameMap[END_POS.y][END_POS.x] = 'end';
}

function renderMap() {
    const mapElement = document.getElementById('map'); mapElement.innerHTML = '';
    for (let y = 0; y < MAP_SIZE; y++) { for (let x = 0; x < MAP_SIZE; x++) { const cell = document.createElement('div'); cell.className = `cell ${gameMap[y][x]}`; cell.id = `cell-${x}-${y}`; mapElement.appendChild(cell); } }
}

function handleCellClick(event) {
    const cell = event.target;
    if (!cell.classList.contains('cell') || cell.classList.contains('start') || cell.classList.contains('end') || cell.classList.contains('house')) return;
    const [x, y] = cell.id.split('-').slice(1).map(Number);
    const terrainCycle = { 'plain': 'rocky', 'rocky': 'mountain', 'mountain': 'plain' };
    const newTerrain = terrainCycle[gameMap[y][x]] || 'plain';
    gameMap[y][x] = newTerrain;
    cell.className = `cell ${newTerrain}`;
}

function calculatePath() {
    const waypoints = [START_POS, ...zodiacHouses, END_POS]; path = [];
    for (let i = 0; i < waypoints.length - 1; i++) { const segmentPath = aStarSearch(waypoints[i], waypoints[i + 1]); if (segmentPath.length === 0) { alert(`Não foi possível encontrar um caminho!`); return; } path.push(...(i === 0 ? segmentPath : segmentPath.slice(1))); }
    visualizePath(); document.getElementById('simulateBtn').disabled = false;
}

function aStarSearch(start, goal) {
    const openSet = [{ ...start, g: 0, h: heuristic(start, goal), f: heuristic(start, goal), parent: null }]; const closedSet = new Set();
    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f); const current = openSet.shift();
        if (current.x === goal.x && current.y === goal.y) { const resultPath = []; let node = current; while (node) { resultPath.unshift({ x: node.x, y: node.y }); node = node.parent; } return resultPath; }
        closedSet.add(`${current.x},${current.y}`);
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy]) => {
            const n = { x: current.x + dx, y: current.y + dy };
            const terrain = gameMap[n.y]?.[n.x];
            if (!terrain || closedSet.has(`${n.x},${n.y}`) || terrain === 'mountain') return;
            const g = current.g + getTerrainCost(terrain); const existing = openSet.find(node => node.x === n.x && node.y === n.y);
            if (!existing || g < existing.g) { const h = heuristic(n, goal); if (!existing) openSet.push({ ...n, g, h, f: g + h, parent: current }); else Object.assign(existing, { g, h, f: g + h, parent: current }); }
        });
    }
    return [];
}

function heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function getTerrainCost(t) { return t === 'rocky' ? 5 : 1; }

function visualizePath() {
    document.querySelectorAll('.cell.path, .cell.current, .cell.traveled').forEach(c => c.classList.remove('path', 'current', 'traveled'));
    path.forEach(pos => { const cell = document.getElementById(`cell-${pos.x}-${pos.y}`); if (cell && !['start', 'end', 'house'].some(c => cell.classList.contains(c))) cell.classList.add('path'); });
}

function startSimulation() {
    if (path.length === 0) { alert('Primeiro calcule um caminho!'); return; }
    if (simulationInterval) clearInterval(simulationInterval);
    currentPosition = 0; totalTime = 0; completedHouses = [];
    Object.keys(knights).forEach(k => knights[k].energy = knights[k].maxEnergy);
    renderMap(); visualizePath();
    updateKnightsStatus(); updateHousesInfo(); updateCurrentTimeDisplay();
    document.getElementById('simulateBtn').disabled = true;
    document.getElementById('calculateBtn').disabled = true;
    simulationInterval = setInterval(moveToNextPosition, 50);
}

function moveToNextPosition() {
    if (currentPosition >= path.length) { endSimulation(); return; }
    if (currentPosition > 0) {
        const prevCell = document.getElementById(`cell-${path[currentPosition - 1].x}-${path[currentPosition - 1].y}`);
        if (prevCell) { prevCell.classList.remove('current'); if (!['start', 'end', 'house'].some(c => prevCell.classList.contains(c))) { prevCell.classList.remove('path'); prevCell.classList.add('traveled'); } }
    }
    const pos = path[currentPosition];
    document.getElementById(`cell-${pos.x}-${pos.y}`)?.classList.add('current');
    const house = zodiacHouses.find(h => h.x === pos.x && h.y === pos.y);
    if (house && !completedHouses.includes(house.name)) { runAutoBattle(house); }
    totalTime += getTerrainCost(gameMap[pos.y][pos.x]);
    updateCurrentTimeDisplay();
    currentPosition++;
}

function runAutoBattle(house) {
    const fighters = Object.entries(knights).filter(([, k]) => k.energy > 0).sort(([, a], [, b]) => b.power - a.power).slice(0, 2);
    if (fighters.length === 0) { endSimulation(); return; }
    let totalPower = 0;
    fighters.forEach(([name]) => { totalPower += knights[name].power; knights[name].energy--; });
    totalTime += Math.ceil(house.difficulty / totalPower);
    updateCurrentTimeDisplay();
    completedHouses.push(house.name);
    updateKnightsStatus(); updateHousesInfo();
}

function endSimulation() {
    clearInterval(simulationInterval); simulationInterval = null;
    document.getElementById('simulateBtn').disabled = false;
    const success = completedHouses.length === 12 && Object.values(knights).some(k => k.energy > 0);
    showResults(success);
}

function showResults(success) {
    const resultsHTML = `<div class="result-item"><span>Status da Missão:</span><span style="font-weight: bold; color: ${success ? '#28a745' : '#dc3545'}">${success ? 'Athena foi salva! ✨' : 'FALHA NA MISSÃO 💔'}</span></div><div class="result-item"><span>Tempo Total:</span><span>${totalTime} minutos</span></div><div class="result-item"><span>Casas Completadas:</span><span>${completedHouses.length}/12</span></div><div class="result-item"><span>Cavaleiros Vivos:</span><span>${Object.values(knights).filter(k => k.energy > 0).length}/5</span></div>`;
    $('#modalResultsBody').html(resultsHTML);
    $('#resultsModal').modal('show');
}

function updateCurrentTimeDisplay() { document.getElementById('currentTimeDisplay').textContent = `${totalTime} minutos`; }

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

function _resetCoreState() {
    if (simulationInterval) clearInterval(simulationInterval);
    path = []; currentPosition = 0; totalTime = 0; completedHouses = []; simulationInterval = null;
    
    knights = JSON.parse(JSON.stringify(INITIAL_KNIGHTS));
    zodiacHouses = JSON.parse(JSON.stringify(INITIAL_ZODIAC_HOUSES));

    document.getElementById('simulateBtn').disabled = true;
    document.getElementById('calculateBtn').disabled = false;
    updateCurrentTimeDisplay();
}

function resetSimulation() {
    _resetCoreState(); renderMap(); updateKnightsStatus(); updateHousesInfo();
}

function generateNewMap() {
    _resetCoreState(); generateMap(); renderMap(); updateKnightsStatus(); updateHousesInfo();
}

function matchHeights() {
    const mapContainer = document.querySelector('.map-container'); const sidebar = document.querySelector('.sidebar');
    if (mapContainer && sidebar) sidebar.style.height = `${mapContainer.offsetHeight}px`;
}

window.addEventListener('DOMContentLoaded', initGame);
window.addEventListener('resize', matchHeights);