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
} from './managers/index.js';

// --- 전역 변수 및 UI 요소 ---
const startBtn = document.getElementById('startBtn');

// --- 매니저 인스턴스 생성 ---
const logManager = new BattleLogManager(document.getElementById('log'));
const vfxManager = new VisualEffectManager();
const eventManager = new EventManager();
const statusEffectManager = new StatusEffectManager(logManager);
const metaAiManager = new MetaAiManager();
const aiManager = new AiManager(metaAiManager);
const delayManager = new DelayManager();
const animationManager = new AnimationManager(delayManager);

const allManagers = { logManager, vfxManager, eventManager, statusEffectManager, battleMaster, aiManager, metaAiManager, delayManager, animationManager };
const uiControls = { startBtn };

const simulationManager = new SimulationManager(allManagers, uiControls);

window.onload = () => {
    simulationManager.init();
};
