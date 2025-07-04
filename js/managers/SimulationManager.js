import { CombatManager } from '../combatManager.js';

export class SimulationManager {
    constructor(managers, uiControls) {
        this.combatManager = new CombatManager(managers, uiControls);
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = uiControls.startBtn;
        this.CELL_SIZE = 50;
        this.GRID_COLS = 15;
        this.GRID_ROWS = 10;

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
            const x = unit.x * this.CELL_SIZE + this.CELL_SIZE / 2;
            const y = unit.y * this.CELL_SIZE + this.CELL_SIZE / 2;
            this.ctx.font = '24px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(unit.icon, x, y);
            this.ctx.fillStyle = unit.team === 'player' ? '#3498db' : '#e74c3c';
            this.ctx.beginPath();
            this.ctx.arc(x, y + 15, 5, 0, 2 * Math.PI);
            this.ctx.fill();
            const barWidth = this.CELL_SIZE * 0.8;
            const hpRatio = unit.hp / unit.maxHp;
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(x - barWidth / 2, y - 20, barWidth, 5);
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(x - barWidth / 2, y - 20, barWidth * hpRatio, 5);
            if (unit.maxShield > 0) {
                const shieldRatio = unit.shield / unit.maxShield;
                this.ctx.fillStyle = '#555';
                this.ctx.fillRect(x - barWidth / 2, y - 26, barWidth, 5);
                this.ctx.fillStyle = 'cyan';
                this.ctx.fillRect(x - barWidth / 2, y - 26, barWidth * shieldRatio, 5);
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

    init() {
        this.preRenderGrid();
        this.combatManager.init();
        this.render(this.combatManager.allUnits);
        this.startBtn.addEventListener('click', () => {
            this.combatManager.startSimulation(units => this.render(units));
        });
    }
}
