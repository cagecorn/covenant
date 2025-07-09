import { CombatManager } from '../combatManager.js';
import { LayerManager } from './LayerManager.js';
import { BackgroundManager } from './BackgroundManager.js';
import { InputManager } from './InputManager.js';

export class SimulationManager {
    constructor(managers, uiControls, inputManager = null) {
        this.combatManager = new CombatManager(managers, uiControls);
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        // startBtn 대신 uiControls 전체를 보존
        this.ui = uiControls;
        
        this.CELL_SIZE = 192;
        this.GRID_COLS = 15;
        this.GRID_ROWS = 10;

        this.imageManager = managers.imageManager;
        this.bindingManager = managers.bindingManager;

        this.layerManager = new LayerManager(this.canvas.width, this.canvas.height);
        this.backgroundManager = new BackgroundManager(this.imageManager, this.layerManager, this.canvas.width, this.canvas.height);
        this.backgroundCtx = this.layerManager.getLayer('background');
        this.unitCtx = this.layerManager.addLayer('units');
        this.backgroundCtx.imageSmoothingEnabled = false;
        this.unitCtx.imageSmoothingEnabled = false;

        this.inputManager = inputManager || new InputManager(this.canvas);
    }

    setInputManager(manager) {
        this.inputManager = manager;
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

    drawUnit(unit, ctx) {
        if (unit.isDead) return;

        const drawX = (unit.renderX ?? unit.x) * this.CELL_SIZE + this.CELL_SIZE / 2;
        const drawY = (unit.renderY ?? unit.y) * this.CELL_SIZE + this.CELL_SIZE - 24;
        const spriteHeight = this.CELL_SIZE * 2;
        const topLeftX = drawX - this.CELL_SIZE;
        const topLeftY = drawY - spriteHeight;

        const bindings = this.bindingManager ? this.bindingManager.getBindings(unit) : [];
        bindings.filter(b => b.behind).forEach(b => {
            const w = b.width || b.img.width;
            const h = b.height || b.img.height;
            ctx.drawImage(b.img, topLeftX + b.offsetX, topLeftY + b.offsetY, w, h);
        });

        if (unit.sprite) {
            // --- 그림자 그리기 시작 ---
            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.transform(1, 0, -0.5, 0.5, 0, 0);
            if (unit.team === 'enemy') {
                ctx.scale(-1, 1);
            }
            ctx.globalAlpha = 0.6;
            ctx.drawImage(unit.sprite, -this.CELL_SIZE, -spriteHeight, this.CELL_SIZE * 2, spriteHeight);
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = 'black';
            ctx.fillRect(-this.CELL_SIZE, -spriteHeight, this.CELL_SIZE * 2, spriteHeight);
            ctx.restore();
            // --- 그림자 그리기 종료 ---

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

    // 렌더링 함수 (Y 좌표 기준 정렬)
    render(units) {
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
        if (this.inputManager) {
            this.ctx.translate(this.inputManager.offsetX, this.inputManager.offsetY);
            this.ctx.scale(this.inputManager.scale, this.inputManager.scale);
        }
        this.layerManager.draw(this.ctx);
        this.combatManager.managers.vfxManager.draw(this.ctx);
        this.ctx.restore();
    }

    loadUnitSprites() {
        const units = this.combatManager.allUnits;
        const promises = units.map(u => this.imageManager.load(u.image).then(img => { u.sprite = img; }));
        return Promise.all(promises);
    }

    autoFit() {
        if (!this.inputManager) return;
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        const scaleX = maxWidth / (this.CELL_SIZE * this.GRID_COLS);
        const scaleY = maxHeight / (this.CELL_SIZE * this.GRID_ROWS);
        const scale = Math.min(scaleX, scaleY, 1);
        this.inputManager.scale = scale;
        this.inputManager.offsetX = (maxWidth - this.canvas.width * scale) / 2;
        this.inputManager.offsetY = (maxHeight - this.canvas.height * scale) / 2;
    }

    // 초기 세팅만 수행하고 루프는 외부에서 제어
    async init() {
        await this.backgroundManager.load('assets/images/battle-stage-forest.png');
        this.preRenderGrid();
        this.combatManager.init();
        await this.loadUnitSprites();
        await this.combatManager.managers.decorationManager.applyDefaultDecorations(this.combatManager.allUnits);
        this.autoFit();

        if (this.inputManager) {
            this.inputManager.init();
        }

        // 초기 렌더링
        this.render(this.combatManager.allUnits);
    }
}
