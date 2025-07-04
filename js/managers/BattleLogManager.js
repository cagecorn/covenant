export class BattleLogManager {
    constructor(logElement) {
        this.logElement = logElement;
        this.logBuffer = [];
    }

    add(message, type = 'info') {
        this.logBuffer.push({ message, type });
    }

    flush() {
        if (this.logBuffer.length > 0) {
            const newLogs = this.logBuffer
                .map(log => `<div class="log-${log.type}">${log.message}</div>`)
                .join('');
            this.logElement.innerHTML += newLogs;
            this.logElement.scrollTop = this.logElement.scrollHeight;
            this.logBuffer = [];
        }
    }

    clear() {
        this.logElement.innerHTML = "";
        this.logBuffer = [];
    }
}
