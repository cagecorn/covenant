// [전투 총괄 매니저 파일]
// 이 파일은 게임의 모든 전투 흐름을 관리하는 CombatManager 클래스를 정의합니다.

import { Unit } from './unit.js';
import { UNIT_TEMPLATES } from './data.js';

export class CombatManager {
    constructor(managers, uiManager) {
        this.managers = managers; // log, vfx, event, statusEffect 매니저 포함
        this.ui = uiManager; // UIManager 인스턴스
        this.playerUnits = [];
        this.enemyUnits = [];
        this.allUnits = [];

        this.battleContext = {
            weather: '맑음',
            terrain: '숲',
        };
    }

    // 게임 초기화
    init() {
        this.managers.logManager.clear();
        if (this.managers.bindingManager) {
            this.managers.bindingManager.clear();
        }

        const playerTemplates = [
            'p_knight', 'p_knight', 'p_warrior', 'p_warrior', 'p_warrior', 'p_cavalry',
            'p_cavalry', 'p_archer', 'p_archer', 'p_mage', 'p_mage', 'p_healer'
        ];
        const enemyTemplates = [
            'e_troll', 'e_troll', 'e_warrior', 'e_warrior', 'e_warrior', 'e_cavalry',
            'e_cavalry', 'e_archer', 'e_archer', 'e_mage', 'e_mage', 'e_shaman'
        ];

        this.playerUnits = playerTemplates.map((key, i) => {
            const x = Math.floor(i / 5);
            const y = (i % 5) * 2;
            return new Unit(UNIT_TEMPLATES[key], 'player', x, y, this.managers);
        });
        this.enemyUnits = enemyTemplates.map((key, i) => {
            const x = (15 - 1) - Math.floor(i / 5);
            const y = (i % 5) * 2;
            return new Unit(UNIT_TEMPLATES[key], 'enemy', x, y, this.managers);
        });

        this.allUnits = [...this.playerUnits, ...this.enemyUnits];

        this.managers.battleMaster.prepareBattle(this.allUnits, this.battleContext, this.managers.logManager);
        this.allUnits.forEach(unit => unit.registerTriggers());

        this.managers.logManager.add('--- 전투 시작! 패시브 스킬 발동 ---');
        this.allUnits.forEach(t => t.applyPassiveSkills());
        this.managers.logManager.flush();

        this.managers.logManager.clear();
        this.managers.logManager.add('전투 준비 완료. 시뮬레이션 시작 버튼을 누르세요.');
        this.managers.logManager.flush();
    }

    // 게임 종료 조건 확인
    checkGameOver() {
        if (this.playerUnits.every(u => u.isDead)) {
            this.managers.logManager.add('패배!', 'death');
            this.managers.logManager.flush();
            return true;
        }
        if (this.enemyUnits.every(u => u.isDead)) {
            this.managers.logManager.add('승리!', 'death');
            this.managers.logManager.flush();
            return true;
        }
        return false;
    }
}
