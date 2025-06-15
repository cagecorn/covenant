// [데이터] 이 파일은 게임의 모든 데이터를 관리합니다.

// 다른 파일에서 이 변수들을 사용할 수 있도록 'export' 키워드를 붙입니다.
export const AI_STRATEGIES = {
    aggressive: (unit, enemies) => { const target = unit.findBestTarget(enemies); if (target) { unit.moveTowards(target); if(unit.isInRange(target)) unit.attemptSkillOrAttack(target); }},
    kiting: (unit, enemies) => { const target = unit.findBestTarget(enemies); if (target) { const distance = unit.getDistance(target); const safeDistance = unit.range - 1; if (distance < safeDistance) unit.moveAwayFrom(target); else if (distance > unit.range) unit.moveTowards(target, true); if(unit.isInRange(target)) unit.attemptSkillOrAttack(target); }},
    assassin: (unit, enemies) => { const priorityClasses = ['Archer', 'Mage', 'Healer']; let priorityTargets = enemies.filter(e => priorityClasses.includes(e.classType)); let target = unit.findBestTarget(priorityTargets); if (!target) target = unit.findBestTarget(enemies); if (target) { unit.moveTowards(target); if(unit.isInRange(target)) unit.attemptSkillOrAttack(target); }},
    support: (unit, enemies, allies) => { const healTarget = allies.concat(unit).filter(a => !a.isDead && a.hp < a.maxHp).sort((a,b) => (a.hp/a.maxHp) - (b.hp/b.maxHp))[0]; if (healTarget) { unit.moveTowards(healTarget, true); if (unit.isInRange(healTarget)) { const healSkill = unit.skills.map(s => SKILLS[s]).find(s => s.name === '치유'); if(healSkill && Math.random() < healSkill.probability) { healSkill.effect(unit, healTarget); return; } } } AI_STRATEGIES.kiting(unit, enemies); }
};

export const UNIT_TEMPLATES = {
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

export const SKILLS = {
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
export const CLASS_STATS = { Warrior: { range: 1, moveSpeed: 3, icon: '⚔️' }, Cavalry: { range: 2, moveSpeed: 5, icon: '🐎' }, Archer: { range: 4, moveSpeed: 3, icon: '🏹' }, Mage: { range: 3, moveSpeed: 2, icon: '🔮' }, Healer: { range: 3, moveSpeed: 3, icon: '💖' }};
