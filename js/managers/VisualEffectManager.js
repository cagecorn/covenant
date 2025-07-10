export class VisualEffectManager {
    constructor(delayManager, imageManager, cellSize = 50) {
        this.effects = [];
        this.shakeEffects = []; // 피격 흔들림 효과 배열
        this.cellSize = cellSize;
        this.delayManager = delayManager;
        this.imageManager = imageManager;
    }

    setCellSize(cellSize) {
        this.cellSize = cellSize;
    }

    // 타격 이펙트 애니메이션 추가
    addStrikeEffect(target) {
        const animationPromise = new Promise(async (resolve) => {
            const effectImages = [
                'assets/images/strike-effect-1.png',
                'assets/images/strike-effect-2.png'
            ];
            const imagePath = effectImages[Math.floor(Math.random() * effectImages.length)];
            const image = await this.imageManager.load(imagePath);

            const effect = {
                id: (Math.random() + 1).toString(36).substring(7),
                type: 'strike',
                target,
                image,
                duration: 30,
                maxDuration: 30,
                scale: 0.5,
                opacity: 1.0,
            };
            this.effects.push(effect);

            setTimeout(resolve, effect.duration * (1000 / 60));
        });

        this.delayManager.waitFor(animationPromise);
    }

    addPopup(text, target, color = 'white') {
        this.effects.push({
            id: (Math.random() + 1).toString(36).substring(7),
            type: 'popup',
            text,
            color,
            x: target.x * this.cellSize + this.cellSize / 2,
            y: target.y * this.cellSize,
            duration: 60,
        });
    }

    // 피격 시 흔들림 효과 추가
    addHitShakeEffect(target) {
        const existing = this.shakeEffects.find(s => s.target.id === target.id);
        if (existing) {
            existing.duration = 10;
            return;
        }

        this.shakeEffects.push({
            target,
            duration: 10,
            amplitude: 2
        });
    }

    draw(ctx) {
        // strike & popup 효과 처리
        this.effects = this.effects.filter(effect => {
            if (effect.type === 'strike') {
                const { target, image, duration, maxDuration } = effect;
                const progress = 1 - (duration / maxDuration);

                effect.scale = 0.5 + progress * 1.5;
                if (progress > 0.5) {
                    effect.opacity = 1.0 - ((progress - 0.5) * 2);
                }

                const centerX = (target.renderX ?? target.x) * this.cellSize + this.cellSize / 2;
                const centerY = (target.renderY ?? target.y) * this.cellSize + this.cellSize / 2;
                const size = this.cellSize * effect.scale;

                ctx.save();
                ctx.globalAlpha = Math.max(0, effect.opacity);
                ctx.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
                ctx.restore();

            } else if (effect.type === 'popup') {
                ctx.fillStyle = effect.color;
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(effect.text, effect.x, effect.y);
                effect.y -= 0.5;
            }

            effect.duration--;
            return effect.duration > 0;
        });

        // 피격 흔들림 효과 처리
        this.shakeEffects = this.shakeEffects.filter(shake => {
            const { target, duration, amplitude } = shake;
            const renderX = target.renderX ?? target.x;
            const renderY = target.renderY ?? target.y;
            const actualX = renderX * this.cellSize;
            const actualY = renderY * this.cellSize;
            const offsetX = Math.sin(Date.now() * 20) * amplitude;

            ctx.drawImage(target.image, actualX + offsetX, actualY, this.cellSize, this.cellSize);

            shake.duration--;
            return shake.duration > 0;
        });
    }

    drawStatusIcons(ctx, unit) {
        const statuses = Object.keys(unit.statusEffects);
        if (statuses.length === 0) return;
        const startX = unit.x * this.cellSize + (this.cellSize - statuses.length * 12) / 2;
        statuses.forEach((statusName, i) => {
            const icon = this.getStatusIcon(statusName);
            ctx.font = '12px sans-serif';
            ctx.fillText(icon, startX + i * 12, unit.y * this.cellSize - 10);
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
