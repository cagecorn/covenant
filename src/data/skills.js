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
