// [유닛 파일]
// 이 파일은 Unit 클래스만을 정의합니다.

// [수정] main.js로부터의 잘못된 import를 모두 제거합니다.
import { AI_STRATEGIES, CLASS_STATS, SKILLS } from './data.js';

export class Unit {
    constructor(template, team, x, y, managers) {
        Object.assign(this, template);
        this.id = (Math.random() + 1).toString(36).substring(7);
        this.team = team; this.x = x; this.y = y;
        this.maxHp = this.hp;
        this.skills = template.skills || [];
        Object.assign(this, CLASS_STATS[this.classType]);
        this.isDead = false; this.hasActed = false;
        this.shield = this.valor * 2; this.maxShield = this.shield;
        this.bonusAttack = 0;
        this.elementalType = template.elementalType || 'none';
        this.contextualBonus = { attack: 0, defense: 0, hp: 0 };
        this.ai = AI_STRATEGIES[template.ai];
        this.statusEffects = {};
        
        // [핵심] 생성 시 주입받은 매니저들을 자신의 속성으로 저장합니다.
        this.managers = managers;
    }

    takeTurn(enemies, allies) {
        if (this.isDead || this.hasActed) return;

        // [수정] 전역 logManager 대신, 내장된 this.managers.logManager를 사용합니다.
        if (this.hasStatus('paralysis') || this.hasStatus('sleep')) {
            this.managers.logManager.add(`... ${this.name}(이)가 행동 불능 상태입니다!`);
            this.hasActed = true;
            return;
        }

        if (this.hasStatus('confusion')) {
            this.managers.logManager.add(`😵 ${this.name}(이)가 혼란에 빠져 아군을 공격합니다!`);
            this.ai(this, allies, enemies);
        } else {
            this.ai(this, enemies, allies);
        }
        this.hasActed = true;
    }

    registerTriggers() {
        this.skills.forEach(key => {
            const skill = SKILLS[key];
            if (skill && skill.type === 'triggered') {
                // [수정] 전역 eventManager 대신, 내장된 this.managers.eventManager를 사용합니다.
                this.managers.eventManager.subscribe(skill.eventName, (payload) => {
                    if (!this.isDead) skill.effect(payload, this, this.managers);
                });
            }
        });
    }

    calculateThreat(target) {
        if (target.isStealthed) return -1;
        if (target.isTaunting) return Infinity;
        let threat = 100 - this.getDistance(target);
        this.skills.forEach(key => {
            const skill = SKILLS[key];
            if (skill && skill.debuff && target.hasStatus(skill.debuff)) {
                threat *= 0.1;
            }
        });
        return threat;
    }
    
    findBestTarget(enemies) {
        if (!enemies || enemies.length === 0) return null;
        let bestTarget = null;
        let maxThreat = -Infinity;
        enemies.forEach(enemy => {
            const threat = this.calculateThreat(enemy);
            if (threat > maxThreat) {
                maxThreat = threat;
                bestTarget = enemy;
            }
        });
        return maxThreat < 0 ? null : bestTarget;
    }

    findClosestEnemy(enemies) {
        if (!enemies || enemies.length === 0) return null;
        return enemies.reduce((closest, current) => (this.getDistance(current) < this.getDistance(closest) ? current : closest));
    }
    
    applyPassiveSkills() { 
        this.skills.forEach(key => {
            const skill = SKILLS[key];
            if (skill?.type === 'passive') {
                // [수정] 스킬 효과에 매니저들을 전달합니다.
                skill.effect(this, null, this.managers);
            }
        });
    }
    
    getAttackPower() {
        const base = this.attackPower + this.bonusAttack + this.contextualBonus.attack;
        const valorBonus = 1 + (this.shield / this.maxShield) * 0.5;
        return Math.floor(base * valorBonus);
    }
    
    takeDamage(damage) {
        const finalDamage = Math.floor(damage);
        if (isNaN(finalDamage)) return;

        const shieldDmg = Math.min(this.shield, finalDamage);
        this.shield -= shieldDmg;
        this.hp -= (finalDamage - shieldDmg);
        
        // [수정] 전역 vfxManager 대신, 내장된 this.managers.vfxManager를 사용합니다.
        this.managers.vfxManager.addPopup(`-${finalDamage}`, this, '#ff4757');

        if (this.hp <= 0 && !this.isDead) {
            this.hp = 0;
            this.isDead = true;
            this.managers.logManager.add(`💀 ${this.name} 쓰러짐!`, 'death');
            this.managers.eventManager.publish('unitDeath', { unit: this });
        }
    }
    
    getDistance(target) { return Math.abs(this.x - target.x) + Math.abs(this.y - target.y); }
    isInRange(target) { return this.getDistance(target) <= this.range; }
    hasStatus(name) { return !!this.statusEffects[name]; }
    hasSkill(name) { return this.skills.some(key => SKILLS[key]?.name === name); }
    
    useSkill(skillName, target) {
        const skillKey = this.skills.find(key => SKILLS[key]?.name === skillName);
        const skill = SKILLS[skillKey];
        if (skill) {
            // [수정] 스킬 효과 함수에 내장된 this.managers를 전달합니다.
            skill.effect(this, target, this.managers);
        }
    }
    
    attemptSkillOrAttack(target) {
        let didUseSkill = false;
        for (const skillKey of this.skills) {
            const skill = SKILLS[skillKey];
            if (skill?.type === 'active' && skill.name !== '치유' && Math.random() < skill.probability) {
                this.useSkill(skill.name, target);
                didUseSkill = true;
                break;
            }
        }
        if (!didUseSkill) this.basicAttack(target);
    }

    basicAttack(target) {
        const damage = this.getAttackPower();
        this.managers.logManager.add(`⚔️ ${this.name} → ${target.name} 일반 공격! (${damage} 피해)`, 'attack');
        target.takeDamage(damage);
        this.managers.eventManager.publish('unitAttack', { caster: this, target: target, damage: damage });
    }

    moveTowards(target, untilInRange = false) {
        let moved = 0;
        while (moved < this.moveSpeed) {
            const currentDist = this.getDistance(target);
            if (currentDist === 0) break;
            if (untilInRange && currentDist <= this.range) break;
            if (!untilInRange && this.range === 1 && currentDist <= 1) break;

            let bestNextX = this.x;
            let bestNextY = this.y;
            let bestDist = currentDist;
            
            const M_HORIZONTAL = [1, -1, 0, 0];
            const M_VERTICAL = [0, 0, 1, -1];

            for (let i = 0; i < 4; i++) {
                const nextX = this.x + M_HORIZONTAL[i];
                const nextY = this.y + M_VERTICAL[i];
                if (nextX < 0 || nextX >= 15 || nextY < 0 || nextY >= 10) continue;
                const dist = Math.abs(nextX - target.x) + Math.abs(nextY - target.y);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestNextX = nextX;
                    bestNextY = nextY;
                }
            }

            if (bestNextX === this.x && bestNextY === this.y) break;
            
            this.x = bestNextX;
            this.y = bestNextY;
            moved++;
        }
    }

    moveAwayFrom(target) {
        let moved = 0;
        while(moved < this.moveSpeed){
            if (this.getDistance(target) >= this.range) break;
            let moveX = -Math.sign(target.x - this.x);
            let moveY = -Math.sign(target.y - this.y);
            if (this.x + moveX < 0 || this.x + moveX >= 15) moveX = 0;
            if (this.y + moveY < 0 || this.y + moveY >= 10) moveY = 0;
            if (moveX === 0 && moveY === 0) break;
            this.x += moveX;
            this.y += moveY;
            moved++;
        }
    }
}
