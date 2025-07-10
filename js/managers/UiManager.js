export class UiManager {
    constructor(options = {}) {
        this.logElement = options.logElement || document.getElementById('log');
        this.wrapper = options.wrapper || document.getElementById('game-wrapper');
        this.worldMapUrl = options.worldMapUrl || 'world_mab_sample.html';
        this.worldMap = null;
    }

    initWorldMap() {
        if (this.worldMap) return;
        const container = document.createElement('div');
        container.id = 'worldMap';
        const iframe = document.createElement('iframe');
        iframe.src = this.worldMapUrl;
        container.appendChild(iframe);
        if (this.logElement) {
            this.logElement.insertAdjacentElement('afterend', container);
        } else {
            this.wrapper.appendChild(container);
        }
        this.worldMap = container;
    }
}
