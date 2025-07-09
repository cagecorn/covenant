export class ImageManager {
    constructor() {
        this.cache = new Map();
        this.pending = new Map();
    }

    load(path) {
        if (this.cache.has(path)) {
            return Promise.resolve(this.cache.get(path));
        }
        if (this.pending.has(path)) {
            return this.pending.get(path);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.cache.set(path, img);
                this.pending.delete(path);
                resolve(img);
            };
            img.onerror = (e) => {
                this.pending.delete(path);
                reject(e);
            };
            img.src = path;
        });

        this.pending.set(path, promise);
        return promise;
    }

    get(path) {
        return this.cache.get(path);
    }
}
