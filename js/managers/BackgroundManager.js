export class BackgroundManager {
    constructor(imageManager, layerManager, width, height) {
        this.imageManager = imageManager;
        this.layerManager = layerManager;
        this.width = width;
        this.height = height;
        this.ctx = this.layerManager.addLayer('background');
        this.backgroundImg = null;
    }

    load(path) {
        return this.imageManager.load(path).then(img => {
            this.backgroundImg = img;
            this.draw();
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.backgroundImg) {
            this.ctx.drawImage(this.backgroundImg, 0, 0, this.width, this.height);
        }
    }
}
