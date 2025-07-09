export class RenderLoopManager {
    constructor(simulationManager) {
        this.simulationManager = simulationManager;
        this.isRunning = false;
        this.animationFrameId = null;

        // --- 렌더링 엔진: FPS 추적 및 제어 ---
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        // ------------------------------------
    }

    _loop(timestamp) {
        if (!this.isRunning) return;

        // FPS 계산
        this.frameCount++;
        if (timestamp - this.lastFpsUpdate > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
            // console.log(`FPS: ${this.fps}`); // FPS 확인용
        }

        this.simulationManager.render(this.simulationManager.combatManager.allUnits);
        this.animationFrameId = requestAnimationFrame(this._loop.bind(this));
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFpsUpdate = performance.now();
        this.animationFrameId = requestAnimationFrame(this._loop.bind(this));
        console.log("🎨 렌더링 루프 시작");
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        console.log("🎨 렌더링 루프 정지");
    }
}
