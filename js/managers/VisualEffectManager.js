export class VisualEffectManager {
    constructor(cellSize = 50) {
        this.effects = [];
        this.cellSize = cellSize;
    }

    setCellSize(cellSize) {
        this.cellSize = cellSize;
    }

    addPopup(text, target, color = 'white') {
        this.effects.push({
            id: (Math.random() + 1).toString(36).substring(7),
            text,
            color,
            x: target.x * this.cellSize + this.cellSize / 2,
            y: (target.y + 0.5) * this.cellSize,
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

    drawStatusIcons(ctx, unit, baseX = null, centerY = null) {
        const statuses = Object.keys(unit.statusEffects);
        if (statuses.length === 0) return;
        const startX = (baseX ?? (unit.x * this.cellSize + this.cellSize / 2)) - (statuses.length * 12) / 2;
        const drawY = (centerY ?? ((unit.y + 0.5) * this.cellSize)) - this.cellSize / 2 - 10;
        statuses.forEach((statusName, i) => {
            const icon = this.getStatusIcon(statusName);
            ctx.font = '12px sans-serif';
            ctx.fillText(icon, startX + i * 12, drawY);
        });
    }

    getStatusIcon(statusName) {
        switch (statusName) {
            case 'paralysis': return '⚡';
            case 'confusion': return '😵';
            case 'poison': return '☠️';
            default: return '❓';
        }
    }
}
