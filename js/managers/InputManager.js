export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.style.touchAction = 'none';
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.minScale = 0.5;
        this.maxScale = 2.5;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this._initEvents();
        this.initialized = true;
    }

    _initEvents() {
        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const zoomFactor = 1 + (e.deltaY < 0 ? 0.1 : -0.1);
            const newScale = this.scale * zoomFactor;
            this.scale = Math.min(this.maxScale, Math.max(this.minScale, newScale));
        }, { passive: false });

        const startDrag = e => {
            this.isDragging = true;
            this.lastX = e.clientX - this.offsetX;
            this.lastY = e.clientY - this.offsetY;
        };
        const duringDrag = e => {
            if (!this.isDragging) return;
            this.offsetX = e.clientX - this.lastX;
            this.offsetY = e.clientY - this.lastY;
        };
        const endDrag = () => { this.isDragging = false; };

        this.canvas.addEventListener('pointerdown', startDrag);
        window.addEventListener('pointermove', duringDrag);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointerleave', endDrag);
    }
}
