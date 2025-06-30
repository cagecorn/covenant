// [메인 파일]
// 이 파일은 게임의 핵심 실행 로직을 담당합니다.

import { BattleLogManager, VisualEffectManager, EventManager, StatusEffectManager, battleMaster } from './managers.js';
import { CombatManager } from './combatManager.js';

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

const allManagers = { logManager, vfxManager, eventManager, statusEffectManager, battleMaster };
const uiControls = { startBtn };

// --- CombatManager 인스턴스 생성 ---
const combatManager = new CombatManager(allManagers, uiControls);

// --- 렌더링 관련 함수 ---
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

function render(units) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundCanvas, 0, 0);
    if (units) {
        drawUnits(units);
    }
    vfxManager.draw(ctx);
}

// --- 이벤트 리스너 ---
startBtn.addEventListener('click', () => {
    combatManager.startSimulation(render);
});

window.onload = () => {
    preRenderGrid();
    combatManager.init();
    render(combatManager.allUnits);
};
