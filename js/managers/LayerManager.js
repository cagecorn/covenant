export class LayerManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.layers = [];
    }

    addLayer(name) {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        this.layers.push({ name, canvas, ctx, visible: true });
        return ctx;
    }

    getLayer(name) {
        const layer = this.layers.find(l => l.name === name);
        return layer ? layer.ctx : null;
    }

    clearLayer(name) {
        const layer = this.layers.find(l => l.name === name);
        if (layer) {
            layer.ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    clearAll() {
        this.layers.forEach(l => l.ctx.clearRect(0, 0, this.width, this.height));
    }

    draw(targetCtx) {
        this.layers.forEach(l => {
            if (l.visible) targetCtx.drawImage(l.canvas, 0, 0);
        });
    }

    setVisibility(name, visible) {
        const layer = this.layers.find(l => l.name === name);
        if (layer) layer.visible = visible;
    }

    moveLayer(name, newIndex) {
        const index = this.layers.findIndex(l => l.name === name);
        if (index === -1 || newIndex < 0 || newIndex >= this.layers.length) return;
        const [layer] = this.layers.splice(index, 1);
        this.layers.splice(newIndex, 0, layer);
    }
}
