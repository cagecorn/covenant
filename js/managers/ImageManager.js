export class ImageManager {
    constructor() {
        this.cache = new Map();
    }

    load(path) {
        if (this.cache.has(path)) {
            return Promise.resolve(this.cache.get(path));
        }
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                this.cache.set(path, img);
                resolve(img);
            };
            img.onerror = reject;
        });
    }

    get(path) {
        return this.cache.get(path);
    }
}
