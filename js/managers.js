// [매니저 파일]
// 이 파일은 게임의 모든 매니저 시스템을 정의합니다.

export class BattleLogManager {
    constructor(logElement) {
        this.logElement = logElement;
        this.logBuffer = [];
    }
    add(message, type = 'info') {
        this.logBuffer.push({ message, type });
    }
    flush() {
        if (this.logBuffer.length > 0) {
            const newLogs = this.logBuffer.map(log => `<div class="log-${log.type}">${log.message}</div>`).join('');
            this.logElement.innerHTML += newLogs;
            this.logElement.scrollTop = this.logElement.scrollHeight;
            this.logBuffer = [];
        }
    }
    clear() {
        this.logElement.innerHTML = "";
        this.logBuffer = [];
    }
}

export class VisualEffectManager {
    constructor() {
        this.effects = [];
    }
    addPopup(text, target, color = 'white') {
        this.effects.push({
            id: (Math.random() + 1).toString(36).substring(7),
            text, color,
            x: target.x * 50 + 25,
            y: target.y * 50,
            duration: 60,
        });
    }
    draw(ctx) {
        this.effects = this.effects.filter(effect => {
            ctx.fillStyle = effect.color;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(effect.text, effect.x, effect.y);
            effect.y -= 0.5;
            effect.duration--;
            return effect.duration > 0;
        });
    }
    drawStatusIcons(ctx, unit) {
        const statuses = Object.keys(unit.statusEffects);
        if (statuses.length === 0) return;
        const startX = unit.x * 50 + (50 - statuses.length * 12) / 2;
        statuses.forEach((statusName, i) => {
            const icon = this.getStatusIcon(statusName);
            ctx.font = '12px sans-serif';
            ctx.fillText(icon, startX + i * 12, unit.y * 50 - 10);
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

export class EventManager {
    constructor() {
        this.listeners = {};
    }
    subscribe(eventName, callback) {
        if (!this.listeners[eventName]) this.listeners[eventName] = [];
        this.listeners[eventName].push(callback);
    }
    publish(eventName, payload) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName].forEach(callback => callback(payload));
    }
}

export class StatusEffectManager {
    constructor(logManager) {
        this.activeEffects = [];
        this.logManager = logManager;
    }
    register(caster, target, skill) {
        const effect = {
            id: (Math.random() + 1).toString(36).substring(7),
            caster, target,
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

export const battleMaster = {
    prepareBattle: (units, context, logManager) => {
        logManager.add(`--- [${context.terrain}] 지형, [${context.weather}] 날씨에서 전투 시작! ---`);
        units.forEach(unit => {
            if (context.terrain === '숲' && unit.classType === 'Archer') {
                unit.contextualBonus.attack += 5;
                logManager.add(`🏹 숲 지형 효과로 ${unit.name}의 공격력이 5 증가합니다.`);
            }
            if (context.weather === '비' && unit.elementalType === 'fire') {
                unit.contextualBonus.attack -= 5;
                logManager.add(`💧 비 날씨 효과로 화염 속성 ${unit.name}의 공격력이 5 감소합니다.`);
            }
        });
    }
};
