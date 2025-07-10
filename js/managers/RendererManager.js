export class RendererManager {
    constructor(canvas, managers) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.combatManager = managers.combatManager; // CombatManager에 직접 접근
        this.layerManager = managers.layerManager;
        this.cameraManager = managers.cameraManager;

        // --- 렌더링 엔진: 캔버스와 관련된 모든 요소를 소유 ---
        this.CELL_SIZE = 192;
        this.GRID_COLS = 15;
        this.GRID_ROWS = 10;
        this.unitCtx = this.layerManager.getLayer('units');
        // ----------------------------------------------------
    }

    drawUnit(unit, ctx) {
        if (unit.isDead) return;

        const drawX = (unit.renderX ?? unit.x) * this.CELL_SIZE + this.CELL_SIZE / 2;
        const drawY = (unit.renderY ?? unit.y) * this.CELL_SIZE + this.CELL_SIZE - 24;
        const spriteHeight = this.CELL_SIZE * 2;
        const topLeftX = drawX - this.CELL_SIZE;
        const topLeftY = drawY - spriteHeight;

        const bindings = this.combatManager.managers.bindingManager.getBindings(unit) || [];
        bindings.filter(b => b.behind).forEach(b => {
            const w = b.width || b.img.width;
            const h = b.height || b.img.height;
            ctx.drawImage(b.img, topLeftX + b.offsetX, topLeftY + b.offsetY, w, h);
        });

        if (unit.sprite) {
            if (unit.team === 'enemy') {
                ctx.save();
                ctx.translate(drawX, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(unit.sprite, -this.CELL_SIZE, -spriteHeight, this.CELL_SIZE * 2, spriteHeight);
                ctx.restore();
            } else {
                ctx.drawImage(unit.sprite, drawX - this.CELL_SIZE, drawY - spriteHeight, this.CELL_SIZE * 2, spriteHeight);
            }
        } else {
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(unit.icon, drawX, drawY);
        }

        bindings.filter(b => !b.behind).forEach(b => {
            const w = b.width || b.img.width;
            const h = b.height || b.img.height;
            ctx.drawImage(b.img, topLeftX + b.offsetX, topLeftY + b.offsetY, w, h);
        });

        ctx.fillStyle = unit.team === 'player' ? '#3498db' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(drawX, drawY + 15, 5, 0, 2 * Math.PI);
        ctx.fill();

        const barWidth = this.CELL_SIZE * 0.8;
        const barYOffset = drawY - spriteHeight + 10;
        const hpRatio = unit.hp / unit.maxHp;

        ctx.fillStyle = '#555';
        ctx.fillRect(drawX - barWidth / 2, barYOffset, barWidth, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(drawX - barWidth / 2, barYOffset, barWidth * hpRatio, 5);

        if (unit.maxShield > 0) {
            const shieldRatio = unit.shield / unit.maxShield;
            ctx.fillStyle = '#555';
            ctx.fillRect(drawX - barWidth / 2, barYOffset - 6, barWidth, 5);
            ctx.fillStyle = 'cyan';
            ctx.fillRect(drawX - barWidth / 2, barYOffset - 6, barWidth * shieldRatio, 5);
        }

        this.combatManager.managers.vfxManager.drawStatusIcons(ctx, unit);
    }

    render() {
        const units = this.combatManager.allUnits;
        this.unitCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (units) {
            const sorted = units.slice().sort((a, b) => {
                const yA = a.renderY ?? a.y;
                const yB = b.renderY ?? b.y;
                return yA - yB;
            });
            sorted.forEach(unit => {
                this.drawUnit(unit, this.unitCtx);
            });
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        if (this.cameraManager) {
            this.ctx.scale(this.cameraManager.scale, this.cameraManager.scale);
            this.ctx.translate(this.cameraManager.offsetX, this.cameraManager.offsetY);
        }
        this.layerManager.draw(this.ctx);
        this.combatManager.managers.vfxManager.draw(this.ctx);
        this.ctx.restore();
    }

    autoFit() {
        if (!this.cameraManager) return;

        // window.innerHeight 대신 body의 클라이언트 높이를 사용해 더 정확한 계산
        const maxWidth = document.body.clientWidth;
        const maxHeight = document.body.clientHeight;

        const scaleX = maxWidth / (this.CELL_SIZE * this.GRID_COLS);
        const scaleY = maxHeight / (this.CELL_SIZE * this.GRID_ROWS);

        // 0.95를 곱해 약간의 여백을 줍니다.
        const scale = Math.min(scaleX, scaleY, 1) * 0.95;

        // 카메라의 줌 레벨을 설정합니다.
        this.cameraManager.scale = scale;

        // 카메라 위치를 초기화합니다.
        this.cameraManager.setOffset(0, 0);

        // 캔버스의 화면상 크기를 조절합니다.
        this.canvas.style.width = `${this.canvas.width * scale}px`;
        this.canvas.style.height = `${this.canvas.height * scale}px`;
    }
}
