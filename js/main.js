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
    InputManager,
    // 새로운 매니저들
    RenderLoopManager,
    GameLoopManager
} from './managers/index.js';

// --- 전역 변수 및 UI 요소 ---
const startBtn = document.getElementById('startBtn');
const uiControls = { startBtn };

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

const allManagers = {
  logManager, vfxManager, eventManager, statusEffectManager, battleMaster,
  aiManager, metaAiManager, delayManager, animationManager, imageManager,
  bindingManager, decorationManager,
};

// --- 매니저 인스턴스 생성 (2단계: 시뮬레이션 및 루프 매니저) ---
const simulationManager = new SimulationManager(allManagers, uiControls);
const inputManager = new InputManager(simulationManager.canvas);
simulationManager.setInputManager(inputManager);
vfxManager.setCellSize(simulationManager.CELL_SIZE);

// 루프 매니저 생성 및 연결
const renderLoopManager = new RenderLoopManager(simulationManager);
const gameLoopManager = new GameLoopManager(simulationManager.combatManager, delayManager);

// --- 게임 시작 함수 ---
async function start() {
    // 1. 시뮬레이션 환경 초기화 (유닛 생성, 배경 로드 등)
    await simulationManager.init();

    // 2. 렌더링 루프 시작
    renderLoopManager.start();

    // 3. "시작" 버튼 클릭 시 게임 로직 루프 시작
    startBtn.addEventListener('click', () => {
        startBtn.disabled = true;
        simulationManager.combatManager.init();
        gameLoopManager.start();
    });
}

// --- DOM 로드 후 게임 실행 ---
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    start();
} else {
    window.addEventListener('DOMContentLoaded', start);
}
