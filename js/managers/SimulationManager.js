import { CombatManager } from '../combatManager.js';
import { LayerManager } from './LayerManager.js';
import { BackgroundManager } from './BackgroundManager.js';
import { InputManager } from './InputManager.js';

export class SimulationManager {
    constructor(managers, uiControls) {
        this.combatManager = new CombatManager(managers, uiControls);
        this.canvas = document.getElementById('gameCanvas');

        // --- 엔진: 핵심 매니저들을 소유하고 연결 ---
        this.managers = managers;
        this.managers.layerManager = new LayerManager(this.canvas.width, this.canvas.height);
        this.managers.inputManager = new InputManager(this.canvas);
        this.backgroundManager = new BackgroundManager(this.managers.imageManager, this.managers.layerManager, this.canvas.width, this.canvas.height);
        // ------------------------------------------

        // 자잘한 설정
        this.backgroundCtx = this.managers.layerManager.addLayer('background');
        this.unitCtx = this.managers.layerManager.addLayer('units');
        this.backgroundCtx.imageSmoothingEnabled = false;
        this.unitCtx.imageSmoothingEnabled = false;
    }

    // [수정됨] init 함수는 이제 렌더링이 아닌 '데이터 준비'만 담당합니다.
    async init() {
        await this.backgroundManager.load('assets/images/battle-stage-forest.png');
        this.preRenderGrid();
        this.combatManager.init();
        await this.prepareUnits();

        // 초기 렌더링은 이제 RendererManager와 RenderLoopManager가 담당
    }

    async prepareUnits() {
        const units = this.combatManager.allUnits;
        const promises = units.map(u =>
            this.managers.imageManager.load(u.image).then(img => { u.sprite = img; })
        );
        await Promise.all(promises);

        await this.combatManager.managers.decorationManager.applyDefaultDecorations(units);
    }

    preRenderGrid() {
        this.backgroundCtx.strokeStyle = '#7f8c8d';
        this.backgroundCtx.lineWidth = 1;
        for (let i = 0; i <= 15; i++) { // GRID_COLS
            this.backgroundCtx.beginPath();
            this.backgroundCtx.moveTo(i * 192, 0); // CELL_SIZE
            this.backgroundCtx.lineTo(i * 192, 10 * 192); // GRID_ROWS * CELL_SIZE
            this.backgroundCtx.stroke();
        }
        for (let i = 0; i <= 10; i++) { // GRID_ROWS
            this.backgroundCtx.beginPath();
            this.backgroundCtx.moveTo(0, i * 192);
            this.backgroundCtx.lineTo(15 * 192, i * 192); // GRID_COLS * CELL_SIZE
            this.backgroundCtx.stroke();
        }
    }
}
