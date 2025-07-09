import { CameraManager } from './CameraManager.js';

export class InputManager {
    constructor(canvas, cameraManager = new CameraManager()) {
        this.canvas = canvas;
        this.camera = cameraManager;
        this.canvas.style.touchAction = 'none';
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
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
            this.camera.zoom(zoomFactor);
        }, { passive: false });

        const startDrag = e => {
            this.isDragging = true;
            this.lastX = e.clientX - this.camera.offsetX;
            this.lastY = e.clientY - this.camera.offsetY;
        };
        const duringDrag = e => {
            if (!this.isDragging) return;
            this.camera.setOffset(e.clientX - this.lastX, e.clientY - this.lastY);
        };
        const endDrag = () => { this.isDragging = false; };

        this.canvas.addEventListener('pointerdown', startDrag);
        window.addEventListener('pointermove', duringDrag);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointerleave', endDrag);
    }
}
