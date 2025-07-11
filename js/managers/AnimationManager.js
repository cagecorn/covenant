export class AnimationManager {
    constructor(delayManager, cellSize = 576) {
        this.delayManager = delayManager;
        this.cellSize = cellSize;
        this.moveQueue = [];
    }

    setCellSize(cellSize) {
        this.cellSize = cellSize;
    }

    // Attack lunge animation depending on team direction
    queueAttackLunge(unit) {
        const lungeDistance = 0.4;
        const direction = unit.team === 'player' ? 1 : -1;

        const originalX = unit.x;
        const originalY = unit.y;
        const lungeX = originalX + lungeDistance * direction;

        // forward lunge
        this.queueMovement(unit, originalX, originalY, lungeX, originalY);
        // return to original position
        this.queueMovement(unit, lungeX, originalY, originalX, originalY);
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
