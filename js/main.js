// [메인 파일]
// 이 파일은 게임의 핵심 실행 로직을 담당합니다.

import { UNIT_TEMPLATES } from './data.js';
import { Unit } from './unit.js';
import { BattleLogManager, VisualEffectManager, EventManager, StatusEffectManager, battleMaster } from './managers.js';

// 전역 변수 및 매니저 인스턴스
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');

export const logManager = new BattleLogManager(document.getElementById('log'));
export const vfxManager = new VisualEffectManager();
export const eventManager = new EventManager();
export const statusEffectManager = new StatusEffectManager();

const GRID_COLS = 15, GRID_ROWS = 10, CELL_SIZE = 50;
const backgroundCanvas = document.createElement('canvas');
backgroundCanvas.width = canvas.width;
backgroundCanvas.height = canvas.height;
const backgroundCtx = backgroundCanvas.getContext('2d');

let playerUnits = [], enemyUnits = [], allUnits = [];
let isSimulationRunning = false;

const battleContext = {
    weather: '맑음',
    terrain: '숲',
};

function init() {
    logManager.clear();
    playerUnits = [
        new Unit(UNIT_TEMPLATES.p_knight, "player", 1, 4),
        new Unit(UNIT_TEMPLATES.p_warrior, "player", 2, 6),
        new Unit(UNIT_TEMPLATES.p_cavalry, "player", 2, 2),
        new Unit(UNIT_TEMPLATES.p_archer, "player", 0, 1),
        new Unit(UNIT_TEMPLATES.p_mage, "player", 0, 4),
        new Unit(UNIT_TEMPLATES.p_healer, "player", 0, 7),
    ];
    enemyUnits = [
        new Unit(UNIT_TEMPLATES.e_troll, "enemy", 13, 4),
        new Unit(UNIT_TEMPLATES.e_warrior, "enemy", 12, 6),
        new Unit(UNIT_TEMPLATES.e_cavalry, "enemy", 12, 2),
        new Unit(UNIT_TEMPLATES.e_archer, "enemy", 14, 1),
        new Unit(UNIT_TEMPLATES.e_mage, "enemy", 14, 4),
        new Unit(UNIT_TEMPLATES.e_shaman, "enemy", 14, 7),
    ];
    
    allUnits=[...playerUnits,...enemyUnits];

    battleMaster.prepareBattle(allUnits, battleContext);
    allUnits.forEach(unit => unit.registerTriggers());
    
    logManager.add("--- 전투 시작! 패시브 스킬 발동 ---");
    allUnits.forEach(t=>t.applyPassiveSkills());
    logManager.flush();

    logManager.clear();
    logManager.add("전투 준비 완료. 시뮬레이션 시작 버튼을 누르세요.");
    logManager.flush();
    
    let gameLoop = function(){
        render(allUnits);
        if(isSimulationRunning) requestAnimationFrame(gameLoop);
    };
    if(!isSimulationRunning) render(allUnits); // 초기 렌더링
}

async function runTurn() {
    logManager.add("--- 새로운 턴 시작 ---");
    const turnOrder = allUnits.filter(u => !u.isDead).sort((a, b) => a.weight - b.weight);
    for (const unit of turnOrder) {
        if (unit.isDead) continue;
        const enemies = unit.team === 'player' ? enemyUnits.filter(u => !u.isDead) : playerUnits.filter(u => !u.isDead);
        const allies = unit.team === 'player' ? playerUnits.filter(u => !u.isDead) : enemyUnits.filter(u => !u.isDead);
        unit.takeTurn(enemies, allies);
        await sleep(200);
    }
    
    logManager.add("--- 모든 유닛 행동 종료 ---");
    statusEffectManager.updateTurn();
    logManager.flush();

    if (playerUnits.every(u => u.isDead)) {
        logManager.add("패배!", 'death');
        isSimulationRunning = false;
        startBtn.disabled = false;
        logManager.flush();
        return;
    }
    if (enemyUnits.every(u => u.isDead)) {
        logManager.add("승리!", 'death');
        isSimulationRunning = false;
        startBtn.disabled = false;
        logManager.flush();
        return;
    }

    if (isSimulationRunning) setTimeout(runTurn, 500);
}

function render(units) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundCanvas, 0, 0);
    drawUnits(units);
    vfxManager.draw(ctx);
}

function drawUnits(units) {
    units.forEach(unit => {
        if (unit.isDead) return;
        const x = unit.x * CELL_SIZE + CELL_SIZE / 2;
        const y = unit.y * CELL_SIZE + CELL_SIZE / 2;
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(unit.icon, x, y);
        ctx.fillStyle = unit.team === 'player' ? '#3498db' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(x, y + 15, 5, 0, 2 * Math.PI);
        ctx.fill();
        const hpBarWidth = CELL_SIZE * 0.8;
        const hpRatio = unit.hp / unit.maxHp;
        ctx.fillStyle = '#555';
        ctx.fillRect(x - hpBarWidth / 2, y - 20, hpBarWidth, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(x - hpBarWidth / 2, y - 20, hpBarWidth * hpRatio, 5);
        if (unit.maxShield > 0) {
            const shieldRatio = unit.shield / unit.maxShield;
            ctx.fillStyle = '#555';
            ctx.fillRect(x - hpBarWidth / 2, y - 26, hpBarWidth, 5);
            ctx.fillStyle = 'cyan';
            ctx.fillRect(x - hpBarWidth / 2, y - 26, hpBarWidth * shieldRatio, 5);
        }
        vfxManager.drawStatusIcons(ctx, unit);
    });
}

function preRenderGrid() {
    backgroundCtx.strokeStyle = '#7f8c8d';
    backgroundCtx.lineWidth = 1;
    for (let i = 0; i <= GRID_COLS; i++) {
        backgroundCtx.beginPath();
        backgroundCtx.moveTo(i * CELL_SIZE, 0);
        backgroundCtx.lineTo(i * CELL_SIZE, GRID_ROWS * CELL_SIZE);
        backgroundCtx.stroke();
    }
    for (let i = 0; i <= GRID_ROWS; i++) {
        backgroundCtx.beginPath();
        backgroundCtx.moveTo(0, i * CELL_SIZE);
        backgroundCtx.lineTo(GRID_COLS * CELL_SIZE, i * CELL_SIZE);
        backgroundCtx.stroke();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

startBtn.addEventListener('click', () => {
    if (isSimulationRunning) return;
    isSimulationRunning = true;
    startBtn.disabled = true;
    init();

    let gameLoop = function() {
        render(allUnits);
        if(isSimulationRunning) requestAnimationFrame(gameLoop);
    };
    requestAnimationFrame(gameLoop);
    runTurn();
});

window.onload = () => {
    preRenderGrid();
    init();
};
