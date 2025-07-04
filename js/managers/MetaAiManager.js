export class MetaAiManager {
    constructor() {
        this.managers = {};
    }

    addManager(name, manager) {
        this.managers[name] = manager;
    }
}
