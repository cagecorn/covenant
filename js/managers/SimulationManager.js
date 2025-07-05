import { CombatManager } from '../combatManager.js';
import { LayerManager } from './LayerManager.js';
import { BackgroundManager } from './BackgroundManager.js';

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
        this.bindingManager = managers.bindingManager;

        this.layerManager = new LayerManager(this.canvas.width, this.canvas.height);
        this.backgroundManager = new BackgroundManager(this.imageManager, this.layerManager, this.canvas.width, this.canvas.height);
        this.backgroundCtx = this.layerManager.getLayer('background');
        this.unitCtx = this.layerManager.addLayer('units');
    }

    preRenderGrid() {
        this.backgroundManager.draw();
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
        const ctx = this.unitCtx;
        const sorted = units
            .filter(u => !u.isDead)
            .sort((a, b) => a.y - b.y);

        sorted.forEach(unit => {
            const drawX = (unit.renderX ?? unit.x) * this.CELL_SIZE + this.CELL_SIZE / 2;
            const drawY = (unit.renderY ?? unit.y) * this.CELL_SIZE + this.CELL_SIZE - 24;
            const spriteHeight = this.CELL_SIZE;
            const topLeftX = drawX - this.CELL_SIZE / 2;
            const topLeftY = drawY - spriteHeight;

            const bindings = this.bindingManager ? this.bindingManager.getBindings(unit) : [];
            bindings.filter(b => b.behind).forEach(b => {
                ctx.drawImage(b.img, topLeftX + b.offsetX, topLeftY + b.offsetY);
            });

            if (unit.sprite) {
                if (unit.team === 'enemy') {
                    ctx.save();
                    ctx.translate(drawX, drawY);
                    ctx.scale(-1, 1);
                    ctx.drawImage(unit.sprite, -this.CELL_SIZE / 2, -spriteHeight, this.CELL_SIZE, spriteHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(unit.sprite, drawX - this.CELL_SIZE / 2, drawY - spriteHeight, this.CELL_SIZE, spriteHeight);
                }
            } else {
                ctx.font = '24px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(unit.icon, drawX, drawY);
            }

            bindings.filter(b => !b.behind).forEach(b => {
                ctx.drawImage(b.img, topLeftX + b.offsetX, topLeftY + b.offsetY);
            });

            ctx.fillStyle = unit.team === 'player' ? '#3498db' : '#e74c3c';
            ctx.beginPath();
            ctx.arc(drawX, drawY + 15, 5, 0, 2 * Math.PI);
            ctx.fill();

            const barWidth = this.CELL_SIZE * 0.8;
            const barYOffset = drawY - this.CELL_SIZE + 10;
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
        });
    }

    render(units) {
        this.unitCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (units) {
            this.drawUnits(units);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.layerManager.draw(this.ctx);
        this.combatManager.managers.vfxManager.draw(this.ctx);
    }

    loadUnitSprites() {
        const units = this.combatManager.allUnits;
        const promises = units.map(u => this.imageManager.load(u.image).then(img => { u.sprite = img; }));
        return Promise.all(promises);
    }

    async init() {
        await this.backgroundManager.load('assets/images/battle-stage-forest.png');
        this.preRenderGrid();
        this.combatManager.init();
        await this.loadUnitSprites();
        this.render(this.combatManager.allUnits);
        this.startBtn.addEventListener('click', async () => {
            await this.combatManager.startSimulation(units => this.render(units));
        });
    }
}
