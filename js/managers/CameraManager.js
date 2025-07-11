export class CameraManager {
    constructor() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.minScale = 1;
        this.maxScale = 2.5;
    }

    zoom(factor) {
        const newScale = this.scale * factor;
        this.scale = Math.min(this.maxScale, Math.max(this.minScale, newScale));
    }

    setOffset(x, y) {
        this.offsetX = x;
        this.offsetY = y;
    }

    reset() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    clampOffset(canvasW, canvasH, worldW, worldH) {
        const scaledW = worldW * this.scale;
        const scaledH = worldH * this.scale;
        const minX = canvasW - scaledW;
        const minY = canvasH - scaledH;
        this.offsetX = Math.min(0, Math.max(minX, this.offsetX));
        this.offsetY = Math.min(0, Math.max(minY, this.offsetY));
    }
}
