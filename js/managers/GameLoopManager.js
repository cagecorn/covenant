// --- 게임 상태 엔진: 게임의 흐름을 정의 ---
const GameState = {
    STOPPED: 'STOPPED',      // 정지
    RUNNING: 'RUNNING',      // 턴 진행 중
    TURN_ENDED: 'TURN_ENDED',// 턴 종료
    GAME_OVER: 'GAME_OVER'   // 게임 종료
};
// ------------------------------------------

export class GameLoopManager {
    constructor(combatManager, delayManager) {
        this.combatManager = combatManager;
        this.delayManager = delayManager;
        this.state = GameState.STOPPED;
    }

    async _loop() {
        if (this.state !== GameState.RUNNING) return;

        // 1. 새로운 턴 시작
        this.combatManager.managers.logManager.add("--- 새로운 턴 시작 ---");
        const turnOrder = this.combatManager.allUnits.filter(u => !u.isDead).sort((a, b) => a.weight - b.weight);
        turnOrder.forEach(u => (u.hasActed = false));

        // 2. 유닛 행동 실행
        for (const unit of turnOrder) {
            if (unit.isDead || this.state !== GameState.RUNNING) continue;
            
            const enemies = unit.team === 'player' ? this.combatManager.enemyUnits.filter(u => !u.isDead) : this.combatManager.playerUnits.filter(u => !u.isDead);
            const allies = unit.team === 'player' ? this.combatManager.playerUnits.filter(u => !u.isDead) : this.combatManager.enemyUnits.filter(u => !u.isDead);
            
            unit.takeTurn(enemies, allies);
            this.combatManager.managers.logManager.flush();

            if (this.combatManager.managers.animationManager) {
                await this.combatManager.managers.animationManager.playQueuedMovements();
            }
            await this.delayManager.wait(100);
        }

        if (this.state !== GameState.RUNNING) return;

        // 3. 턴 종료 처리
        this.state = GameState.TURN_ENDED;
        this.combatManager.managers.logManager.add("--- 모든 유닛 행동 종료 ---");
        this.combatManager.managers.statusEffectManager.updateTurn();
        this.combatManager.managers.logManager.flush();
        
        // 4. 게임 종료 확인
        if (this.combatManager.checkGameOver()) {
            this.state = GameState.GAME_OVER;
            this.stop();
        } else {
            // 5. 다음 턴 준비
            this.state = GameState.RUNNING;
            setTimeout(() => this._loop(), 500);
        }
    }

    start() {
        if (this.state !== GameState.STOPPED) return;
        this.state = GameState.RUNNING;
        console.log("⚔️ 게임 로직 루프 시작");
        this._loop();
    }

    stop() {
        console.log(`⚔️ 게임 로직 루프 정지 (상태: ${this.state})`);
        this.state = GameState.STOPPED;
        this.combatManager.ui.startBtn.disabled = false;
    }
}
