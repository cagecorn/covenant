// [메인 파일]
// 이 파일은 게임의 핵심 실행 로직을 담당합니다.

import { BattleLogManager, VisualEffectManager, EventManager, StatusEffectManager, battleMaster } from './managers.js';
import { CombatManager } from './combatManager.js'; // 새로 만든 CombatManager를 가져옵니다.

// --- 전역 변수 및 UI 요소 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const CELL_SIZE = 50, GRID_COLS = 15, GRID_ROWS = 10;

// --- 매니저 인스턴스 생성 ---
const logManager = new BattleLogManager(document.getElementById('log'));
const vfxManager = new VisualEffectManager();
const eventManager = new EventManager();
const statusEffectManager = new StatusEffectManager();

// 모든 매니저를 하나의 객체로 묶어 관리
const allManagers = {
    logManager,
    vfxManager,
    eventManager,
    statusEffectManager,
    battleMaster // battleMaster도 매니저 그룹에 포함
};

// --- CombatManager 인스턴스 생성 ---
const combatManager = new CombatManager(allManagers);


// --- 렌더링 관련 함수 ---

// 그리드 배경 미리 그리기
const backgroundCanvas = document.createElement('canvas');
backgroundCanvas.width = canvas.width;
backgroundCanvas.height = canvas.height;
const backgroundCtx = backgroundCanvas.getContext('2d');

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

function drawUnits(units) {
    units.forEach(unit => {
        if (unit.isDead) return;
        const x = unit.x * CELL_SIZE + CELL_SIZE / 2;
        const y = unit.y * CELL_SIZE + CELL_SIZE / 2;
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(unit.icon, x, y);

        // 팀 구분 색상
        ctx.fillStyle = unit.team === 'player' ? '#3498db' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(x, y + 15, 5, 0, 2 * Math.PI);
        ctx.fill();

        // 체력 및 보호막 바
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

function render(units) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundCanvas, 0, 0);
    if (units) {
        drawUnits(units);
    }
    vfxManager.draw(ctx);
}

// --- 게임 루프 및 이벤트 리스너 ---

function gameLoop(units) {
    render(units);
}

startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    combatManager.stopSimulation(); // 이전 시뮬레이션 정리
    combatManager.startSimulation(gameLoop);
});

// 게임오버 이벤트 구독
eventManager.subscribe('gameOver', (payload) => {
    console.log(`게임 종료: ${payload.result}`);
    startBtn.disabled = false; // 버튼 다시 활성화
});


window.onload = () => {
    preRenderGrid();
    combatManager.init(); // 초기 유닛 정보 표시를 위해 init 호출
    render(combatManager.allUnits);
};
