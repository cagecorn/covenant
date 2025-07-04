export class EventManager {
    constructor() {
        this.listeners = {};
    }

    subscribe(eventName, callback) {
        if (!this.listeners[eventName]) this.listeners[eventName] = [];
        this.listeners[eventName].push(callback);
    }

    publish(eventName, payload) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName].forEach(callback => callback(payload));
    }
}
