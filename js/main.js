// [메인 파일]
// 이 파일은 게임의 핵심 실행 로직을 담당합니다.

import {
    BattleLogManager,
    VisualEffectManager,
    EventManager,
    StatusEffectManager,
    battleMaster,
    AiManager,
    MetaAiManager,
    SimulationManager,
    DelayManager,
    AnimationManager,
    ImageManager,
    BindingManager,
    DecorationManager,
    // 새로운 매니저들
    RenderLoopManager,
    GameLoopManager,
    RendererManager
} from './managers/index.js';

// --- 전역 변수 및 UI 요소 ---
const startBtn = document.getElementById('startBtn');
const uiControls = { startBtn };
const canvas = document.getElementById('gameCanvas');

// --- 매니저 인스턴스 생성 (1단계: 기본 매니저) ---
const logManager = new BattleLogManager(document.getElementById('log'));
const vfxManager = new VisualEffectManager();
const eventManager = new EventManager();
const statusEffectManager = new StatusEffectManager(logManager);
const metaAiManager = new MetaAiManager();
const aiManager = new AiManager(metaAiManager);
const delayManager = new DelayManager();
const animationManager = new AnimationManager(delayManager);
const imageManager = new ImageManager();
const bindingManager = new BindingManager(imageManager);
const decorationManager = new DecorationManager(bindingManager);

const baseManagers = {
  logManager, vfxManager, eventManager, statusEffectManager, battleMaster,
  aiManager, metaAiManager, delayManager, animationManager, imageManager,
  bindingManager, decorationManager,
};

// --- 매니저 인스턴스 생성 (2단계: 시뮬레이션 및 루프 매니저) ---
const simulationManager = new SimulationManager(baseManagers, uiControls);

// 렌더링 및 루프 전문 매니저 생성
const rendererManager = new RendererManager(canvas, {
    combatManager: simulationManager.combatManager,
    layerManager: simulationManager.managers.layerManager,
    inputManager: simulationManager.managers.inputManager
});
vfxManager.setCellSize(rendererManager.CELL_SIZE);

const renderLoopManager = new RenderLoopManager(rendererManager);
const gameLoopManager = new GameLoopManager(simulationManager.combatManager, delayManager);

// --- 게임 시작 함수 ---
async function start() {
    await simulationManager.init();
    rendererManager.autoFit();
    renderLoopManager.start();

    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        simulationManager.combatManager.init();
        await simulationManager.prepareUnits();
        gameLoopManager.start();
    });
}

// --- DOM 로드 후 게임 실행 ---
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    start();
} else {
    window.addEventListener('DOMContentLoaded', start);
}
