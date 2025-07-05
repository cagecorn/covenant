export class BindingManager {
    constructor() {
        this.bindings = new Map(); // unit -> array of attachments
    }

    bind(unit, path, offsetX = 0, offsetY = 0, behind = false) {
        if (!this.bindings.has(unit)) {
            this.bindings.set(unit, []);
        }
        this.bindings.get(unit).push({ path, img: null, offsetX, offsetY, behind });
    }

    get(unit) {
        return this.bindings.get(unit) || [];
    }

    clear() {
        this.bindings.clear();
    }
}
