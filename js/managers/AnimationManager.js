export class AnimationManager {
    constructor(delayManager, cellSize = 50) {
        this.delayManager = delayManager;
        this.cellSize = cellSize;
        this.moveQueue = [];
    }

    queueMovement(unit, fromX, fromY, toX, toY) {
        this.moveQueue.push({ unit, fromX, fromY, toX, toY });
    }

    async playQueuedMovements() {
        while (this.moveQueue.length > 0) {
            const step = this.moveQueue.shift();
            await this.delayManager.waitFor(this.animateStep(step));
            await this.delayManager.flush();
        }
    }

    animateStep({ unit, fromX, fromY, toX, toY }) {
        const steps = 8;
        let current = 0;
        return new Promise(resolve => {
            const animate = () => {
                current++;
                const t = current / steps;
                unit.renderX = fromX + (toX - fromX) * t;
                unit.renderY = fromY + (toY - fromY) * t;
                if (current < steps) {
                    requestAnimationFrame(animate);
                } else {
                    unit.renderX = null;
                    unit.renderY = null;
                    resolve();
                }
            };
            animate();
        });
    }
}
