// [메인 파일]
// 이 파일은 게임의 핵심 실행 로직을 담당합니다.

import { UNIT_TEMPLATES } from './data.js';
import { Unit } from './unit.js';
import { BattleLogManager, VisualEffectManager, EventManager, StatusEffectManager, battleMaster } from './managers.js';

// --- 전역 변수 및 매니저 인스턴스 생성 ---
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
let animationFrameId;

const battleContext = {
    weather: '맑음',
    terrain: '숲',
};

// --- 핵심 기능 함수 ---

function init() {
    logManager.clear();
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // 유닛 생성
    const playerTemplates = ['p_knight','p_warrior','p_cavalry','p_archer','p_mage','p_healer'];
    const enemyTemplates = ['e_troll','e_warrior','e_cavalry','e_archer','e_mage','e_shaman'];
    
    playerUnits = playerTemplates.map((key, i) => new Unit(UNIT_TEMPLATES[key], "player", 1, i + 2));
    enemyUnits = enemyTemplates.map((key, i) => new Unit(UNIT_TEMPLATES[key], "enemy", GRID_COLS - 2, i + 2));
    
    allUnits=[...playerUnits,...enemyUnits];

    // 매니저 시스템 작동
    battleMaster.prepareBattle(allUnits, battleContext, logManager);
    allUnits.forEach(unit => unit.registerTriggers());
    
    logManager.add("--- 전투 시작! 패시브 스킬 발동 ---");
    allUnits.forEach(t=>t.applyPassiveSkills());
    logManager.flush();

    logManager.clear();
    logManager.add("전투 준비 완료. 시뮬레이션 시작 버튼을 누르세요.");
    logManager.flush();
    
    // 초기 화면 렌더링
    render(allUnits);
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

    // 승리/패배 조건 확인
    if (playerUnits.every(u => u.isDead)) {
        logManager.add("패배!", 'death');
        stopSimulation();
        return;
    }
    if (enemyUnits.every(u => u.isDead)) {
        logManager.add("승리!", 'death');
        stopSimulation();
        return;
    }

    if (isSimulationRunning) setTimeout(runTurn, 500);
}

function stopSimulation() {
    isSimulationRunning = false;
    startBtn.disabled = false;
    cancelAnimationFrame(animationFrameId);
}

// --- 렌더링 관련 함수 ---

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

function gameLoop() {
    render(allUnits);
    if(isSimulationRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// --- 이벤트 리스너 및 초기 실행 ---

startBtn.addEventListener('click', () => {
    if (isSimulationRunning) return;
    
    stopSimulation(); // 이전 루프가 혹시 남아있다면 정리
    isSimulationRunning = true;
    startBtn.disabled = true;
    
    init();
    
    animationFrameId = requestAnimationFrame(gameLoop);
    runTurn();
});

window.onload = () => {
    preRenderGrid();
    init();
};
