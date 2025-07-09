export class CameraManager {
    constructor() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.minScale = 0.5;
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
}
