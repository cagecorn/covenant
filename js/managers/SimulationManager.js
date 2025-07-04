import { CombatManager } from '../combatManager.js';

export class SimulationManager {
    constructor(managers, uiControls) {
        this.combatManager = new CombatManager(managers, uiControls);
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = uiControls.startBtn;
        this.CELL_SIZE = 192;
        this.GRID_COLS = 15;
        this.GRID_ROWS = 10;

        this.imageManager = managers.imageManager;

        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.width = this.canvas.width;
        this.backgroundCanvas.height = this.canvas.height;
        this.backgroundCtx = this.backgroundCanvas.getContext('2d');
    }

    preRenderGrid() {
        this.backgroundCtx.strokeStyle = '#7f8c8d';
        this.backgroundCtx.lineWidth = 1;
        for (let i = 0; i <= this.GRID_COLS; i++) {
            this.backgroundCtx.beginPath();
            this.backgroundCtx.moveTo(i * this.CELL_SIZE, 0);
            this.backgroundCtx.lineTo(i * this.CELL_SIZE, this.GRID_ROWS * this.CELL_SIZE);
            this.backgroundCtx.stroke();
        }
        for (let i = 0; i <= this.GRID_ROWS; i++) {
            this.backgroundCtx.beginPath();
            this.backgroundCtx.moveTo(0, i * this.CELL_SIZE);
            this.backgroundCtx.lineTo(this.GRID_COLS * this.CELL_SIZE, i * this.CELL_SIZE);
            this.backgroundCtx.stroke();
        }
    }

    drawUnits(units) {
        units.forEach(unit => {
            if (unit.isDead) return;
            const drawX = (unit.renderX ?? unit.x) * this.CELL_SIZE + this.CELL_SIZE / 2;
            const drawY = (unit.renderY ?? unit.y) * this.CELL_SIZE + this.CELL_SIZE / 2;
            if (unit.sprite) {
                if (unit.team === 'enemy') {
                    this.ctx.save();
                    this.ctx.translate(drawX, drawY);
                    this.ctx.scale(-1, 1);
                    this.ctx.drawImage(unit.sprite, -this.CELL_SIZE / 2, -this.CELL_SIZE / 2, this.CELL_SIZE, this.CELL_SIZE);
                    this.ctx.restore();
                } else {
                    this.ctx.drawImage(unit.sprite, drawX - this.CELL_SIZE / 2, drawY - this.CELL_SIZE / 2, this.CELL_SIZE, this.CELL_SIZE);
                }
            } else {
                this.ctx.font = '24px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(unit.icon, drawX, drawY);
            }
            this.ctx.fillStyle = unit.team === 'player' ? '#3498db' : '#e74c3c';
            this.ctx.beginPath();
            this.ctx.arc(drawX, drawY + 15, 5, 0, 2 * Math.PI);
            this.ctx.fill();
            const barWidth = this.CELL_SIZE * 0.8;
            const hpRatio = unit.hp / unit.maxHp;
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(drawX - barWidth / 2, drawY - 20, barWidth, 5);
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(drawX - barWidth / 2, drawY - 20, barWidth * hpRatio, 5);
            if (unit.maxShield > 0) {
                const shieldRatio = unit.shield / unit.maxShield;
                this.ctx.fillStyle = '#555';
                this.ctx.fillRect(drawX - barWidth / 2, drawY - 26, barWidth, 5);
                this.ctx.fillStyle = 'cyan';
                this.ctx.fillRect(drawX - barWidth / 2, drawY - 26, barWidth * shieldRatio, 5);
            }
            this.combatManager.managers.vfxManager.drawStatusIcons(this.ctx, unit);
        });
    }

    render(units) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.backgroundCanvas, 0, 0);
        if (units) {
            this.drawUnits(units);
        }
        this.combatManager.managers.vfxManager.draw(this.ctx);
    }

    loadUnitSprites() {
        const units = this.combatManager.allUnits;
        const promises = units.map(u => this.imageManager.load(u.image).then(img => { u.sprite = img; }));
        return Promise.all(promises);
    }

    async init() {
        this.preRenderGrid();
        this.combatManager.init();
        await this.loadUnitSprites();
        this.render(this.combatManager.allUnits);
        this.startBtn.addEventListener('click', async () => {
            await this.combatManager.startSimulation(units => this.render(units));
        });
    }
}
