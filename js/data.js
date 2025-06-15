// [데이터 파일]
// 이 파일은 게임의 모든 정적 데이터(템플릿, 설정값 등)를 보관합니다.

export const AI_STRATEGIES = {
    aggressive: (unit, enemies, allies) => {
        if (unit.hasStatus('flee')) { AI_STRATEGIES.flee(unit, enemies); return; }
        const target = unit.findBestTarget(enemies);
        if (target) {
            unit.moveTowards(target);
            if(unit.isInRange(target)) unit.attemptSkillOrAttack(target);
        }
    },
    kiting: (unit, enemies, allies) => {
        if (unit.hasStatus('flee')) { AI_STRATEGIES.flee(unit, enemies); return; }
        const target = unit.findBestTarget(enemies);
        if (target) {
            const distance = unit.getDistance(target);
            const safeDistance = unit.range - 1;
            if (distance < safeDistance) unit.moveAwayFrom(target);
            else if (distance > unit.range) unit.moveTowards(target, true);
            if(unit.isInRange(target)) unit.attemptSkillOrAttack(target);
        }
    },
    assassin: (unit, enemies, allies) => {
        if (unit.hasStatus('flee')) { AI_STRATEGIES.flee(unit, enemies); return; }
        const priorityClasses = ['Archer', 'Mage', 'Healer'];
        let priorityTargets = enemies.filter(e => priorityClasses.includes(e.classType));
        let target = unit.findBestTarget(priorityTargets);
        if (!target) target = unit.findBestTarget(enemies);
        if (target) {
            unit.moveTowards(target);
            if(unit.isInRange(target)) unit.attemptSkillOrAttack(target);
        }
    },
    support: (unit, enemies, allies) => {
        const allAllies = allies.concat(unit);
        const criticalDebuffTarget = allAllies.find(a => a.hasStatus('paralysis') || a.hasStatus('confusion'));
        if (criticalDebuffTarget && unit.hasSkill('cleanse')) {
            unit.moveTowards(criticalDebuffTarget, true);
            if (unit.isInRange(criticalDebuffTarget)) {
                unit.useSkill('cleanse', criticalDebuffTarget);
                return;
            }
        }
        const healTarget = allAllies.filter(a => !a.isDead && a.hp < a.maxHp).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
        if (healTarget && unit.hasSkill('heal')) {
            unit.moveTowards(healTarget, true);
            if (unit.isInRange(healTarget)) {
                unit.useSkill('heal', healTarget);
                return;
            }
        }
        AI_STRATEGIES.kiting(unit, enemies, allies);
    },
    flee: (unit, enemies, allies) => {
        const target = unit.findClosestEnemy(enemies);
        if (target) {
            unit.moveAwayFrom(target);
        }
    }
};

export const UNIT_TEMPLATES = {
    p_warrior: { name: '전사', classType: 'Warrior', ai: 'aggressive', hp: 120, attackPower: 20, valor: 20, weight: 50, skills: ['powerStrike', 'stoneSkin'] },
    p_knight:  { name: '기사', classType: 'Warrior', ai: 'aggressive', hp: 150, attackPower: 18, valor: 30, weight: 65, skills: ['stoneSkin'] },
    p_cavalry: { name: '기마병', classType: 'Cavalry', ai: 'assassin', hp: 100, attackPower: 22, valor: 15, weight: 40, skills:['powerStrike', 'vampiricTouch'] },
    p_archer:  { name: '궁수', classType: 'Archer',  ai: 'kiting', hp: 70, attackPower: 25, valor: 5, weight: 30, skills: ['paralyzingShot'] },
    p_healer:  { name: '사제', classType: 'Healer',  ai: 'support', hp: 80, attackPower: 10, valor: 10, weight: 25, skills: ['heal', 'cleanse'] },
    p_mage:    { name: '마법사', classType: 'Mage', ai: 'kiting', hp: 60, attackPower: 30, valor: 10, weight: 35, skills: ['poisonSting'] },
    
    e_warrior: { name: '오크 전사', classType: 'Warrior', ai: 'aggressive', hp: 120, attackPower: 20, valor: 20, weight: 55, skills: ['powerStrike'] },
    e_troll:   { name: '트롤', classType: 'Warrior', ai: 'aggressive', hp: 160, attackPower: 18, valor: 10, weight: 80, skills: ['stoneSkin'] },
    e_cavalry: { name: '와르그', classType: 'Cavalry', ai: 'assassin', hp: 100, attackPower: 22, valor: 15, weight: 45, skills: ['vampiricTouch'] },
    e_archer:  { name: '고블린 궁수', classType: 'Archer', ai: 'kiting', hp: 70, attackPower: 25, valor: 5, weight: 32, skills: ['paralyzingShot'] },
    e_shaman:  { name: '오크 주술사', classType: 'Healer', ai: 'support', hp: 80, attackPower: 10, valor: 10, weight: 28, skills: ['heal', 'cleanse'] },
    e_mage:    { name: '고블린 마법사', classType: 'Mage', ai: 'kiting', hp: 60, attackPower: 30, valor: 10, weight: 38, skills: ['confuseRay', 'poisonSting'] },
};

export const SKILLS = {
    powerStrike: {
        name: '파워 스트라이크',
        type: 'active',
        probability: 0.4,
        effect: (caster, target, { logManager, eventManager }) => {
            const damage = Math.floor(caster.getAttackPower() * 1.5);
            logManager.add(`💥 ${caster.name}의 [파워 스트라이크]! ${target.name}에게 ${damage} 피해!`, 'skill');
            target.takeDamage(damage);
            eventManager.publish('skillUsed', { caster, target, skill: SKILLS.powerStrike });
        }
    },
    heal: {
        name: '치유',
        type: 'active',
        probability: 0.7,
        effect: (caster, target, { logManager, vfxManager }) => {
            const healAmount = Math.floor(caster.getAttackPower() * 2.5);
            target.hp = Math.min(target.maxHp, target.hp + healAmount);
            logManager.add(`💖 ${caster.name}의 [치유]! ${target.name}의 체력 ${healAmount} 회복!`, 'heal');
            vfxManager.addPopup(`+${healAmount}`, target, '#2ed573');
        }
    },
    cleanse: {
        name: '정화',
        type: 'active',
        probability: 1.0,
        effect: (caster, target, { logManager, statusEffectManager }) => {
            logManager.add(`✨ ${caster.name}(이)가 ${target.name}에게 [정화] 시전!`, 'skill');
            if (target.hasStatus('paralysis')) statusEffectManager.remove(target, 'paralysis');
            if (target.hasStatus('confusion')) statusEffectManager.remove(target, 'confusion');
        }
    },
    paralyzingShot: {
        name: '마비 화살',
        type: 'active',
        probability: 0.3,
        debuff: 'paralysis',
        duration: 2,
        effect: (caster, target, { logManager, statusEffectManager }) => {
            logManager.add(`⚡ ${caster.name}(이)가 [마비 화살] 발사!`, 'skill');
            statusEffectManager.register(caster, target, SKILLS.paralyzingShot);
        }
    },
    confuseRay: {
        name: '혼란 광선',
        type: 'active',
        probability: 0.2,
        debuff: 'confusion',
        duration: 1,
        effect: (caster, target, { logManager, statusEffectManager }) => {
            logManager.add(`😵 ${caster.name}(이)가 [혼란 광선] 발사!`, 'skill');
            statusEffectManager.register(caster, target, SKILLS.confuseRay);
        }
    },
    poisonSting: {
        name: '독침',
        type: 'active',
        probability: 0.5,
        debuff: 'poison',
        duration: 3,
        details: { damage: 15 },
        effect: (caster, target, { logManager, statusEffectManager }) => {
            logManager.add(`☠️ ${caster.name}(이)가 [독침] 공격!`, 'skill');
            statusEffectManager.register(caster, target, SKILLS.poisonSting);
        }
    },

    stoneSkin: {
        name: '스톤 스킨',
        type: 'passive',
        effect: (caster, _target, { logManager }) => {
            caster.shield += 20;
            caster.maxShield += 20;
            logManager.add(`🛡️ ${caster.name} [스톤 스킨] 발동! 보호막 20 증가!`);
        }
    },
    deathRattle: {
        name: '죽음의 메아리',
        type: 'triggered',
        eventName: 'unitDeath',
        effect: (payload, owner, { logManager }) => {
            if (payload.unit === owner) logManager.add(`🔥 ${owner.name}의 [죽음의 메아리] 발동!`);
        }
    },
    vampiricTouch: {
        name: '흡혈의 손길',
        type: 'triggered',
        eventName: 'unitAttack',
        effect: (payload, owner, { logManager, vfxManager }) => {
            if (payload.caster === owner) {
                const healAmount = Math.floor(payload.damage * 0.2);
                owner.hp = Math.min(owner.maxHp, owner.hp + healAmount);
                logManager.add(`🩸 ${owner.name}이 [흡혈의 손길]로 체력을 ${healAmount} 회복!`, 'heal');
                vfxManager.addPopup(`+${healAmount}`, owner, '#2ed573');
            }
        }
    }
};

export const CLASS_STATS = {
    Warrior:  { range: 1, moveSpeed: 3, icon: '⚔️' },
    Cavalry:  { range: 2, moveSpeed: 5, icon: '🐎' },
    Archer:   { range: 4, moveSpeed: 3, icon: '🏹' },
    Mage:     { range: 3, moveSpeed: 2, icon: '🔮' },
    Healer:   { range: 3, moveSpeed: 3, icon: '💖' }
};
