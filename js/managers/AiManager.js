export class AiManager {
    constructor(metaManager = null) {
        this.metaManager = metaManager;
        this.strategies = {
            aggressive: (unit, enemies, allies) => {
                if (unit.hasStatus('flee')) {
                    return this.strategies.flee(unit, enemies, allies);
                }
                const target = unit.findBestTarget(enemies);
                if (target) {
                    unit.moveTowards(target, true);
                    if (unit.isInRange(target)) {
                        unit.attemptSkillOrAttack(target);
                    }
                }
            },
            kiting: (unit, enemies, allies) => {
                if (unit.hasStatus('flee')) {
                    return this.strategies.flee(unit, enemies, allies);
                }
                const target = unit.findBestTarget(enemies);
                if (target) {
                    const distance = unit.getDistance(target);
                    const safeDistance = unit.range > 1 ? unit.range - 1 : 1;
                    if (distance < safeDistance) {
                        unit.moveAwayFrom(target);
                    } else if (distance > unit.range) {
                        unit.moveTowards(target, true);
                    }
                    if (unit.isInRange(target)) {
                        unit.attemptSkillOrAttack(target);
                    }
                }
            },
            assassin: (unit, enemies, allies) => {
                if (unit.hasStatus('flee')) {
                    return this.strategies.flee(unit, enemies, allies);
                }
                const priorityClasses = ['Archer', 'Mage', 'Healer'];
                let priorityTargets = enemies.filter(e => priorityClasses.includes(e.classType));
                let target = unit.findBestTarget(priorityTargets);
                if (!target) target = unit.findBestTarget(enemies);
                if (target) {
                    unit.moveTowards(target, true);
                    if (unit.isInRange(target)) {
                        unit.attemptSkillOrAttack(target);
                    }
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
                const healTarget = allAllies.filter(a => !a.isDead && a.hp < a.maxHp)
                    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
                if (healTarget && unit.hasSkill('heal')) {
                    unit.moveTowards(healTarget, true);
                    if (unit.isInRange(healTarget)) {
                        unit.useSkill('heal', healTarget);
                        return;
                    }
                }
                this.strategies.kiting(unit, enemies, allies);
            },
            flee: (unit, enemies, allies) => {
                const target = unit.findClosestEnemy(enemies);
                if (target) {
                    unit.managers.logManager.add(`🏃 ${unit.name}(이)가 공포에 질려 도망칩니다!`);
                    unit.moveAwayFrom(target);
                }
            }
        };
        if (this.metaManager && this.metaManager.addManager) {
            this.metaManager.addManager('ai', this);
        }
    }

    getStrategy(name) {
        return this.strategies[name];
    }
}
