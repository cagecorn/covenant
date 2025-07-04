export class StatusEffectManager {
    constructor(logManager) {
        this.activeEffects = [];
        this.logManager = logManager;
    }

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
        target.statusEffects[effect.name] = effect;
        this.logManager.add(`${target.name}(이)가 [${effect.name}] 효과를 얻었습니다! (${effect.duration}턴 지속)`);
    }

    remove(target, statusName) {
        if (target.hasStatus(statusName)) {
            this.activeEffects = this.activeEffects.filter(e => !(e.target === target && e.name === statusName));
            delete target.statusEffects[statusName];
            this.logManager.add(`${target.name}의 [${statusName}] 효과가 사라졌습니다.`);
        }
    }

    updateTurn() {
        this.activeEffects.forEach(effect => {
            if (effect.name === 'poison' && !effect.target.isDead) {
                this.logManager.add(`☠️ ${effect.target.name}(이)가 독 데미지로 ${effect.details.damage} 피해!`, 'attack');
                effect.target.takeDamage(effect.details.damage);
            }
        });
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.duration--;
            if (effect.duration <= 0) {
                delete effect.target.statusEffects[effect.name];
                return false;
            }
            return true;
        });
    }
}
