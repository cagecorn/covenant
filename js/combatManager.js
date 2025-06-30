// [전투 총괄 매니저 파일]
// 이 파일은 게임의 모든 전투 흐름을 관리하는 CombatManager 클래스를 정의합니다.

import { Unit }s from './unit.js';
import { UNIT_TEMPLATES } from './data.js';

export class CombatManager {
    constructor(managers) {
        this.managers = managers; // log, vfx, event, statusEffect 매니저 포함
        this.playerUnits = [];
        this.enemyUnits = [];
        this.allUnits = [];
        this.isSimulationRunning = false;
        this.animationFrameId = null;

        // main.js의 battleContext를 가져오거나 기본값을 설정할 수 있습니다.
        this.battleContext = {
            weather: '맑음',
            terrain: '숲',
        };
    }

    // 게임 초기화
    init() {
        this.managers.logManager.clear();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // 12v12 유닛 생성
        const playerTemplates = [
            'p_knight', 'p_knight', 'p_warrior', 'p_warrior', 'p_warrior', 'p_cavalry',
            'p_cavalry', 'p_archer', 'p_archer', 'p_mage', 'p_mage', 'p_healer'
        ];
        const enemyTemplates = [
            'e_troll', 'e_troll', 'e_warrior', 'e_warrior', 'e_warrior', 'e_cavalry',
            'e_cavalry', 'e_archer', 'e_archer', 'e_mage', 'e_mage', 'e_shaman'
        ];

        // 유닛 배치
        this.playerUnits = playerTemplates.map((key, i) => {
            const x = Math.floor(i / 5);
            const y = (i % 5) * 2;
            return new Unit(UNIT_TEMPLATES[key], "player", x, y, this.managers);
        });
        this.enemyUnits = enemyTemplates.map((key, i) => {
            const x = (15 - 1) - Math.floor(i / 5);
            const y = (i % 5) * 2;
            return new Unit(UNIT_TEMPLATES[key], "enemy", x, y, this.managers);
        });

        this.allUnits = [...this.playerUnits, ...this.enemyUnits];

        // BattleMaster를 통한 전투 준비
        this.managers.battleMaster.prepareBattle(this.allUnits, this.battleContext, this.managers.logManager);
        this.allUnits.forEach(unit => unit.registerTriggers());

        this.managers.logManager.add("--- 전투 시작! 패시브 스킬 발동 ---");
        this.allUnits.forEach(t => t.applyPassiveSkills());
        this.managers.logManager.flush();

        this.managers.logManager.clear();
        this.managers.logManager.add("전투 준비 완료. 시뮬레이션 시작 버튼을 누르세요.");
        this.managers.logManager.flush();
    }

    // 시뮬레이션 시작
    startSimulation(gameLoopCallback) {
        if (this.isSimulationRunning) return;
        this.isSimulationRunning = true;

        this.init();
        this.runTurn();

        // main.js의 렌더링 루프와 연결
        const loop = () => {
            gameLoopCallback(this.allUnits);
            if (this.isSimulationRunning) {
                this.animationFrameId = requestAnimationFrame(loop);
            }
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    // 시뮬레이션 중지
    stopSimulation() {
        this.isSimulationRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    // 턴 실행
    async runTurn() {
        this.managers.logManager.add("--- 새로운 턴 시작 ---");
        const turnOrder = this.allUnits.filter(u => !u.isDead).sort((a, b) => a.weight - b.weight);

        for (const unit of turnOrder) {
            if (unit.isDead) continue;
            const enemies = unit.team === 'player' ? this.enemyUnits.filter(u => !u.isDead) : this.playerUnits.filter(u => !u.isDead);
            const allies = unit.team === 'player' ? this.playerUnits.filter(u => !u.isDead) : this.enemyUnits.filter(u => !u.isDead);
            unit.takeTurn(enemies, allies);
            await this.sleep(200);
        }

        this.managers.logManager.add("--- 모든 유닛 행동 종료 ---");
        this.managers.statusEffectManager.updateTurn();
        this.managers.logManager.flush();

        // 승리/패배 조건 확인
        if (this.playerUnits.every(u => u.isDead)) {
            this.managers.logManager.add("패배!", 'death');
            this.stopSimulation();
            // main.js에 패배 이벤트를 알릴 수 있습니다.
            this.managers.eventManager.publish('gameOver', { result: 'defeat' });
            return;
        }
        if (this.enemyUnits.every(u => u.isDead)) {
            this.managers.logManager.add("승리!", 'death');
            this.stopSimulation();
            // main.js에 승리 이벤트를 알릴 수 있습니다.
            this.managers.eventManager.publish('gameOver', { result: 'victory' });
            return;
        }

        if (this.isSimulationRunning) {
            setTimeout(() => this.runTurn(), 500);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
