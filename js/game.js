// =======================================================================
// 1. 기본 설정 및 데이터 정의 (v0.6과 거의 동일)
// =======================================================================
const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn'), logElement = document.getElementById('log');
const GRID_COLS = 15, GRID_ROWS = 10, CELL_SIZE = 50;
const backgroundCanvas = document.createElement('canvas');
backgroundCanvas.width = canvas.width;
backgroundCanvas.height = canvas.height;
const backgroundCtx = backgroundCanvas.getContext('2d');


// [로그개선] 전투 로그를 체계적으로 관리하는 매니저
class BattleLogManager {
    constructor(logElement) {
        this.logElement = logElement;
        this.logBuffer = [];
    }

    // 로그 메시지를 버퍼에 추가
    add(message, type = 'info') {
        this.logBuffer.push({ message, type });
    }

    // 버퍼의 모든 로그를 화면에 출력
    flush() {
        if (this.logBuffer.length > 0) {
            const newLogs = this.logBuffer
                .map(log => `<div class="log-${log.type}">${log.message}</div>`)
                .join('');
            this.logElement.innerHTML += newLogs;
            this.logElement.scrollTop = this.logElement.scrollHeight;
            this.logBuffer = [];
        }
    }

    // 로그창 초기화
    clear() {
        this.logElement.innerHTML = "";
        this.logBuffer = [];
    }
}

// [시각효과] 데미지 숫자, 상태이상 아이콘 등 시각 효과를 관리하는 매니저
class VisualEffectManager {
    constructor() {
        this.effects = []; // 화면에 표시될 모든 시각 효과 목록
    }

    // 데미지/힐 숫자 팝업 효과 추가
    addPopup(text, target, color = 'white') {
        const effect = {
            id: (Math.random() + 1).toString(36).substring(7),
            text,
            color,
            x: target.x * CELL_SIZE + CELL_SIZE / 2,
            y: target.y * CELL_SIZE,
            duration: 60, // 60프레임 (약 1초) 동안 표시
        };
        this.effects.push(effect);
    }

    // 모든 시각 효과를 화면에 그림
    draw(ctx) {
        this.effects = this.effects.filter(effect => {
            // 효과 그리기
            ctx.fillStyle = effect.color;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(effect.text, effect.x, effect.y);

            // 효과 상태 업데이트
            effect.y -= 0.5; // 위로 떠오르는 효과
            effect.duration--;

            return effect.duration > 0; // 지속시간이 끝나면 목록에서 제거
        });
    }

    // 유닛 머리 위에 상태이상 아이콘 그리기
    drawStatusIcons(ctx, unit) {
        const statuses = Object.keys(unit.statusEffects);
        if (statuses.length === 0) return;

        const startX = unit.x * CELL_SIZE + (CELL_SIZE - statuses.length * 12) / 2;
        statuses.forEach((statusName, i) => {
            const icon = this.getStatusIcon(statusName);
            ctx.font = '12px sans-serif';
            ctx.fillText(icon, startX + i * 12, unit.y * CELL_SIZE - 10);
        });
    }

    getStatusIcon(statusName) {
        switch(statusName) {
            case 'paralysis': return '⚡';
            case 'confusion': return '😵';
            case 'poison': return '☠️';
            default: return '❓';
        }
    }
}

const logManager = new BattleLogManager(document.getElementById('log'));
// [시각효과] 전역에서 사용될 비주얼 이펙트 매니저 인스턴스
const vfxManager = new VisualEffectManager();

// [총괄 매니저] 전투 외부 요인을 반영하는 총괄 매니저
const battleMaster = {
    prepareBattle: (units, context) => {
        logManager.add(`--- [${context.terrain}] 지형, [${context.weather}] 날씨에서 전투 시작! ---`);
        units.forEach(unit => {
            // 지형 효과 적용
            if (context.terrain === '숲' && unit.classType === 'Archer') {
                unit.contextualBonus.attack += 5;
                logManager.add(`🏹 숲 지형 효과로 ${unit.name}의 공격력이 5 증가합니다.`);
            }
            // 날씨 효과 적용
            if (context.weather === '비' && unit.elementalType === 'fire') {
                unit.contextualBonus.attack -= 5;
                logManager.add(`💧 비 날씨 효과로 화염 속성 ${unit.name}의 공격력이 5 감소합니다.`);
            }
            // 그 외 영지 버프, 음식 버프 등 모든 외부 요인을 이곳에서 처리
        });
    }
};

// [총괄 매니저] 이번 전투에 적용될 외부 요인 (임시 데이터)
const battleContext = {
    weather: '맑음',
    terrain: '숲',
    playerBuffs: [{ type: 'food', effect: 'hp_up', value: 20 }],
    enemyBuffs: [{ type: 'stage_effect', effect: 'all_stats_up', value: 5 }]
};

// [트리거 시스템] 게임 내 모든 이벤트를 관장하는 방송국
class EventManager {
    constructor() {
        this.listeners = {}; // { 'unitDeath': [callback1, callback2], 'turnStart': [cb1] }
    }

    // 특정 이벤트 구독 (리스너 등록)
    subscribe(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    // 이벤트 발생 방송 (모든 구독자에게 알림)
    publish(eventName, payload) {
        if (!this.listeners[eventName]) {
            return;
        }
        this.listeners[eventName].forEach(callback => {
            callback(payload); // 이벤트 관련 데이터(payload)를 전달
        });
    }
}

// [구조개선] 상태이상을 통합 관리하는 중앙 관리자
class StatusEffectManager {
    constructor() {
        // 전투 전체의 모든 활성 상태이상을 여기에서 관리합니다.
        this.activeEffects = [];
    }

    // 새로운 상태이상을 관리자에 등록
    register(caster, target, skill) {
        const effect = {
            id: (Math.random() + 1).toString(36).substring(7),
            caster,
            target,
            name: skill.debuff,
            duration: skill.duration || 1,
            details: skill.details || {},
            skill,
        };
        this.activeEffects.push(effect);
        target.statusEffects[effect.name] = effect; // 유닛은 빠른 조회를 위해 참조만 가짐
        logManager.add(`${target.name}(이)가 [${effect.name}] 효과를 얻었습니다! (${effect.duration}턴 지속)`);
    }

    // 상태이상 제거
    remove(target, statusName) {
        if (target.hasStatus && target.hasStatus(statusName)) {
            this.activeEffects = this.activeEffects.filter(e => !(e.target === target && e.name === statusName));
            delete target.statusEffects[statusName];
            logManager.add(`${target.name}의 [${statusName}] 효과가 사라졌습니다.`);
        }
    }
    
    // 턴 종료 시, 모든 효과를 한번에 처리
    updateTurn() {
        logManager.add("--- 상태이상 효과 정리 시작 ---");
        // 도트 데미지 및 힐 적용
        this.activeEffects.forEach(effect => {
            if (effect.name === 'poison' && !effect.target.isDead) {
                logManager.add(`☠️ ${effect.target.name}(이)가 독 데미지로 ${effect.details.damage} 피해!`);
                effect.target.takeDamage(effect.details.damage);
            }
        });

        // 지속시간 감소 및 만료된 효과 제거
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.duration--;
            if (effect.duration <= 0) {
                delete effect.target.statusEffects[effect.name];
                return false; // 배열에서 제거
            }
            return true; // 유지
        });
    }
}
const statusEffectManager = new StatusEffectManager();
const eventManager = new EventManager();

const AI_STRATEGIES = {
    aggressive: (unit, enemies) => { const target = unit.findBestTarget(enemies); if (target) { unit.moveTowards(target); if(unit.isInRange(target)) unit.attemptSkillOrAttack(target); }},
    kiting: (unit, enemies) => { const target = unit.findBestTarget(enemies); if (target) { const distance = unit.getDistance(target); const safeDistance = unit.range - 1; if (distance < safeDistance) unit.moveAwayFrom(target); else if (distance > unit.range) unit.moveTowards(target, true); if(unit.isInRange(target)) unit.attemptSkillOrAttack(target); }},
    assassin: (unit, enemies) => { const priorityClasses = ['Archer', 'Mage', 'Healer']; let priorityTargets = enemies.filter(e => priorityClasses.includes(e.classType)); let target = unit.findBestTarget(priorityTargets); if (!target) target = unit.findBestTarget(enemies); if (target) { unit.moveTowards(target); if(unit.isInRange(target)) unit.attemptSkillOrAttack(target); }},
    support: (unit, enemies, allies) => {
        const healTarget = allies.concat(unit).filter(a => !a.isDead && a.hp < a.maxHp).sort((a,b) => (a.hp/a.maxHp) - (b.hp/b.maxHp))[0];
        if (healTarget) {
            unit.moveTowards(healTarget, true);
            if (unit.isInRange(healTarget)) {
                const healSkill = unit.skills.map(s => SKILLS[s]).find(s => s.name === '치유');
                if (healSkill && Math.random() < healSkill.probability) {
                    healSkill.effect(unit, healTarget, { logManager, eventManager, vfxManager, statusEffectManager });
                    return;
                }
            }
        }
        AI_STRATEGIES.kiting(unit, enemies);
    }
};

const UNIT_TEMPLATES = {
    // 플레이어 유닛 템플릿
    p_warrior: { name: '전사', classType: 'Warrior', ai: 'aggressive', hp: 120, attackPower: 20, valor: 20, weight: 50, skills: ['powerStrike'] },
    p_knight:  { name: '기사', classType: 'Warrior', ai: 'aggressive', hp: 150, attackPower: 18, valor: 30, weight: 65, skills: ['stoneSkin'] },
    p_cavalry: { name: '기마병', classType: 'Cavalry', ai: 'assassin', hp: 100, attackPower: 22, valor: 15, weight: 40, skills:['powerStrike'] },
    p_archer:  { name: '궁수', classType: 'Archer',  ai: 'kiting', hp: 70, attackPower: 25, valor: 5, weight: 30 },
    p_healer:  { name: '사제', classType: 'Healer',  ai: 'support', hp: 80, attackPower: 10, valor: 10, weight: 25, skills: ['heal'] },
    p_mage:    { name: '마법사', classType: 'Mage', ai: 'kiting', hp: 60, attackPower: 30, valor: 10, weight: 35 },
    // 적 유닛 템플릿
    e_warrior: { name: '오크 전사', classType: 'Warrior', ai: 'aggressive', hp: 120, attackPower: 20, valor: 20, weight: 55, skills: ['powerStrike'] },
    e_troll:   { name: '트롤', classType: 'Warrior', ai: 'aggressive', hp: 160, attackPower: 18, valor: 10, weight: 80, skills: ['stoneSkin'] },
    e_cavalry: { name: '와르그', classType: 'Cavalry', ai: 'assassin', hp: 100, attackPower: 22, valor: 15, weight: 45 },
    e_archer:  { name: '고블린 궁수', classType: 'Archer', ai: 'kiting', hp: 70, attackPower: 25, valor: 5, weight: 32 },
    e_shaman:  { name: '오크 주술사', classType: 'Healer', ai: 'support', hp: 80, attackPower: 10, valor: 10, weight: 28, skills: ['heal'] },
    e_mage:    { name: '고블린 마법사', classType: 'Mage', ai: 'kiting', hp: 60, attackPower: 30, valor: 10, weight: 38 },
};
const SKILLS = {
    powerStrike: {
        name: '파워 스트라이크',
        type: 'active',
        probability: 0.4,
        effect: (caster, target) => {
            const damage = Math.floor(caster.getAttackPower() * 1.5);
            logManager.add(`💥 ${caster.name}의 [${SKILLS.powerStrike.name}]! ${target.name}에게 ${damage} 피해!`);
            target.takeDamage(damage);
            eventManager.publish('skillUsed', { caster: caster, target: target, skill: SKILLS.powerStrike });
        }
    },
    heal: {
        name: '치유',
        type: 'active',
        probability: 0.6,
        effect: (caster, target) => {
            const healAmount = Math.floor(caster.attackPower * 2.5);
            target.hp = Math.min(target.maxHp, target.hp + healAmount);
            logManager.add(`💖 ${caster.name}의 [${SKILLS.heal.name}]! ${target.name}의 체력 ${healAmount} 회복!`);
            // [시각효과] 치유량 팝업 표시
            vfxManager.addPopup(`+${healAmount}`, target, '#2ed573');
        }
    },
    stoneSkin: { name: '스톤 스킨', type: 'passive', effect: (caster) => { caster.shield += 20; caster.maxShield += 20; logManager.add(`🛡️ ${caster.name} [${SKILLS.stoneSkin.name}] 발동! 보호막 20 증가!`); }},
    deathRattle: {
        name: '죽음의 메아리',
        type: 'triggered',
        eventName: 'unitDeath',
        effect: (payload, owner) => {
            if (payload.unit === owner) {
                logManager.add(`🔥 ${owner.name}의 [죽음의 메아리] 발동!`);
            }
        }
    },
    vampiricTouch: {
        name: '흡혈의 손길',
        type: 'triggered',
        eventName: 'unitAttack',
        effect: (payload, owner) => {
            if (payload.caster === owner) {
                const healAmount = Math.floor(payload.damage * 0.2);
                owner.hp = Math.min(owner.maxHp, owner.hp + healAmount);
                logManager.add(`🩸 ${owner.name}이 [흡혈의 손길]로 체력을 ${healAmount} 회복!`);
            }
        }
    }
};
const CLASS_STATS = { Warrior: { range: 1, moveSpeed: 3, icon: '⚔️' }, Cavalry: { range: 2, moveSpeed: 5, icon: '🐎' }, Archer: { range: 4, moveSpeed: 3, icon: '🏹' }, Mage: { range: 3, moveSpeed: 2, icon: '🔮' }, Healer: { range: 3, moveSpeed: 3, icon: '💖' }};

// Unit 클래스 및 다른 함수들은 v0.6과 동일하게 유지됩니다.
class Unit {
    constructor(template, team, x, y) {
        Object.assign(this, template); this.id = (Math.random() + 1).toString(36).substring(7);
        this.team = team; this.x = x; this.y = y; this.maxHp = this.hp; this.skills = template.skills || [];
        Object.assign(this, CLASS_STATS[this.classType]);
        this.isDead = false; this.hasActed = false; this.shield = this.valor * 2; this.maxShield = this.shield;
        this.bonusAttack = 0;
        this.elementalType = template.elementalType || 'none';
        this.contextualBonus = { attack: 0, defense: 0, hp: 0 };
        this.ai = AI_STRATEGIES[template.ai];
        this.isTaunting = false; this.isStealthed = false;
        this.statusEffects = {};
    }
    hasStatus(name) { return !!this.statusEffects[name]; }
    addStatus(skill) {
        statusEffectManager.register(this, this, skill);
    }
    removeStatus(statusName) {
        statusEffectManager.remove(this, statusName);
    }
    registerTriggers() {
        this.skills.forEach(key => {
            const skill = SKILLS[key];
            if (skill && skill.type === 'triggered') {
                eventManager.subscribe(skill.eventName, payload =>
                    skill.effect(payload, this, { logManager, eventManager, vfxManager, statusEffectManager })
                );
            }
        });
    }
    takeTurn(enemies, allies) {
        if(this.isDead || this.hasActed) return;

        // 턴 낭비형 상태이상 체크 (이 부분은 유지)
        if (this.hasStatus('paralysis') || this.hasStatus('sleep')) {
            logManager.add(`... ${this.name}(이)가 행동 불능 상태입니다!`);
            this.hasActed = true;
            return;
        }
        this.ai(this, enemies, allies); this.hasActed = true; }
    calculateThreat(target) { if (target.isStealthed) return -1; if (target.isTaunting) return Infinity; const distance = this.getDistance(target); return 100 - distance; }
    findBestTarget(enemies) { if (!enemies || enemies.length === 0) return null; let bestTarget = null; let maxThreat = -Infinity; enemies.forEach(enemy => { const threat = this.calculateThreat(enemy); if (threat > maxThreat) { maxThreat = threat; bestTarget = enemy; } }); return maxThreat < 0 ? null : bestTarget; }
    applyPassiveSkills() {
        this.skills.forEach(key => {
            if (SKILLS[key]?.type === 'passive') {
                SKILLS[key].effect(this, null, { logManager, eventManager, vfxManager, statusEffectManager });
            }
        });
    }
    getAttackPower() {
        const base = this.attackPower + this.bonusAttack + this.contextualBonus.attack;
        const valorBonus = 1 + (this.shield / this.maxShield) * 0.5;
        return Math.floor(base * valorBonus);
    }
    takeDamage(damage) {
        const shieldDmg = Math.min(this.shield, damage);
        this.shield -= shieldDmg;
        this.hp -= (damage - shieldDmg);
        // [시각효과] 데미지를 받은 경우 팝업 표시
        vfxManager.addPopup(`-${damage}`, this, '#ff4757');
        if (this.hp <= 0 && !this.isDead) {
            this.hp = 0;
            this.isDead = true;
            logManager.add(`💀 ${this.name} 쓰러짐!`);
            eventManager.publish('unitDeath', { unit: this });
        }
    }
    getDistance(target) { return Math.abs(this.x - target.x) + Math.abs(this.y - target.y); }
    isInRange(target) { return this.getDistance(target) <= this.range; }
    attemptSkillOrAttack(target){
        let didUseSkill = false;
        for (const skillKey of this.skills) {
            const skill = SKILLS[skillKey];
            if (skill?.type === 'active' && skill.name !== '치유' && Math.random() < skill.probability) {
                skill.effect(this, target, { logManager, eventManager, vfxManager, statusEffectManager });
                didUseSkill = true;
                break;
            }
        }
        if (!didUseSkill) this.basicAttack(target);
    }
    basicAttack(target) {
        const damage = this.getAttackPower();
        logManager.add(`⚔️ ${this.name} → ${target.name} 일반 공격! (${damage} 피해)`);
        target.takeDamage(damage);
        eventManager.publish('unitAttack', { caster: this, target: target, damage: damage });
    }
    moveTowards(target, untilInRange = false) { let moved = 0; while(moved < this.moveSpeed){ const distance = this.getDistance(target); if (distance === 0 || (untilInRange && distance <= this.range)) break; let moveX = 0, moveY = 0; if (Math.abs(target.x - this.x) > Math.abs(target.y - this.y)) { moveX = Math.sign(target.x - this.x); } else { moveY = Math.sign(target.y - this.y); } this.x += moveX; this.y += moveY; moved++; } }
    moveAwayFrom(target) { let moved = 0; while(moved < this.moveSpeed){ if (this.getDistance(target) >= this.range) break; let moveX = -Math.sign(target.x - this.x); let moveY = -Math.sign(target.y - this.y); if (this.x + moveX < 0 || this.x + moveX >= GRID_COLS) moveX = 0; if (this.y + moveY < 0 || this.y + moveY >= GRID_ROWS) moveY = 0; if (moveX === 0 && moveY === 0) break; this.x += moveX; this.y += moveY; moved++; } }
}

// =======================================================================
// 3. 렌더링 및 4, 5. 시뮬레이션 실행
// =======================================================================
let playerUnits=[],enemyUnits=[],allUnits=[],isSimulationRunning=!1;

// [12v12] 유닛 생성 및 배치 로직 변경
function init() {
    // [12v12] 유닛 생성 및 배치 로직
    const playerTemplates = [
        'p_knight', 'p_knight', 'p_warrior', 'p_warrior', 'p_warrior', 'p_cavalry', 
        'p_cavalry', 'p_archer', 'p_archer', 'p_mage', 'p_mage', 'p_healer'
    ];
    playerUnits = playerTemplates.map((key, i) => {
        const x = Math.floor(i / 5);
        const y = (i % 5) * 2;
        return new Unit(UNIT_TEMPLATES[key], "player", x, y, { logManager, eventManager, vfxManager, statusEffectManager });
    });

    const enemyTemplates = [
        'e_troll', 'e_troll', 'e_warrior', 'e_warrior', 'e_warrior', 'e_cavalry', 
        'e_cavalry', 'e_archer', 'e_archer', 'e_mage', 'e_mage', 'e_shaman'
    ];
    enemyUnits = enemyTemplates.map((key, i) => {
        const x = (GRID_COLS - 1) - Math.floor(i / 5);
        const y = (i % 5) * 2;
        return new Unit(UNIT_TEMPLATES[key], "enemy", x, y, { logManager, eventManager, vfxManager, statusEffectManager });
    });
    
    allUnits=[...playerUnits,...enemyUnits];

    // [총괄 매니저] 전투 시작 전, 외부 요인 적용 (핵심 수정 사항)
    battleMaster.prepareBattle(allUnits, battleContext);

    // [트리거 시스템] 각 유닛의 트리거 스킬 등록
    allUnits.forEach(unit => unit.registerTriggers());
    
    // [상태이상] 패시브 스킬 발동
    logManager.add("--- 전투 시작! 패시브 스킬 발동 ---");
    allUnits.forEach(t=>t.applyPassiveSkills());
    logManager.flush();

    // 초기화 메시지 및 렌더링 루프 시작
    logManager.clear();
    logManager.add("전투 준비 완료. 시뮬레이션 시작 버튼을 누르세요.");
    logManager.flush();
    let t=function(){render(allUnits),isSimulationRunning&&requestAnimationFrame(t)};
    requestAnimationFrame(t);
}

// 나머지 실행 로직은 v0.6과 동일합니다.
async function runTurn() {
    logManager.add("--- 새로운 턴 시작 ---");
    const turnOrder = allUnits
        .filter(u => !u.isDead)
        .sort((a, b) => a.weight - b.weight);
    turnOrder.forEach(u => (u.hasActed = false));

    for (const unit of turnOrder) {
        if (unit.isDead) continue;
        const enemies =
            unit.team === "player"
                ? enemyUnits.filter(u => !u.isDead)
                : playerUnits.filter(u => !u.isDead);
        const allies =
            unit.team === "player"
                ? playerUnits.filter(u => !u.isDead)
                : enemyUnits.filter(u => !u.isDead);
        unit.takeTurn(enemies, allies);
        await sleep(100);
    }

    logManager.add("--- 모든 유닛 행동 종료 ---");
    statusEffectManager.updateTurn();
    logManager.flush();

    if (playerUnits.filter(u => !u.isDead).length === 0) {
        logManager.add("패배!");
        isSimulationRunning = false;
        startBtn.disabled = false;
        return logManager.flush();
    }

    if (enemyUnits.filter(u => !u.isDead).length === 0) {
        logManager.add("승리!");
        isSimulationRunning = false;
        startBtn.disabled = false;
        return logManager.flush();
    }

    if (isSimulationRunning) {
        setTimeout(runTurn, 500);
    }
}
function preRenderGrid(){backgroundCtx.strokeStyle="#7f8c8d",backgroundCtx.lineWidth=1;for(let t=0;t<=GRID_COLS;t++)backgroundCtx.beginPath(),backgroundCtx.moveTo(t*CELL_SIZE,0),backgroundCtx.lineTo(t*CELL_SIZE,GRID_ROWS*CELL_SIZE),backgroundCtx.stroke();for(let t=0;t<=GRID_ROWS;t++)backgroundCtx.beginPath(),backgroundCtx.moveTo(0,t*CELL_SIZE),backgroundCtx.lineTo(GRID_COLS*CELL_SIZE,t*CELL_SIZE),backgroundCtx.stroke()}
function drawUnits(units){
    units.forEach(unit=>{
        if(unit.isDead) return;
        const centerX = unit.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = unit.y * CELL_SIZE + CELL_SIZE / 2;
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(unit.icon, centerX, centerY);
        ctx.fillStyle = unit.team === "player" ? "#3498db" : "#e74c3c";
        ctx.beginPath();
        ctx.arc(centerX, centerY + 15, 5, 0, 2 * Math.PI);
        ctx.fill();

        const barWidth = 0.8 * CELL_SIZE;
        const hpRatio = unit.hp / unit.maxHp;
        ctx.fillStyle = "#555";
        ctx.fillRect(centerX - barWidth / 2, centerY - 20, barWidth, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(centerX - barWidth / 2, centerY - 20, barWidth * hpRatio, 5);
        if(unit.maxShield>0){
            const shieldRatio = unit.shield / unit.maxShield;
            ctx.fillStyle = "#555";
            ctx.fillRect(centerX - barWidth / 2, centerY - 26, barWidth, 5);
            ctx.fillStyle = "cyan";
            ctx.fillRect(centerX - barWidth / 2, centerY - 26, barWidth * shieldRatio, 5);
        }

        // [시각효과] 상태이상 아이콘 그리기 추가
        vfxManager.drawStatusIcons(ctx, unit);
    });
}

function render(units){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(backgroundCanvas,0,0);
    drawUnits(units);
    // [시각효과] 모든 시각효과 그리기 추가
    vfxManager.draw(ctx);
}
function sleep(t){return new Promise(e=>setTimeout(e,t))}
startBtn.addEventListener("click",()=>{isSimulationRunning||(isSimulationRunning=!0,startBtn.disabled=!0,init(),runTurn())});
window.onload=()=>{preRenderGrid(),init(),render(allUnits)};
