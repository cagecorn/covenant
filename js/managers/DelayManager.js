export class DelayManager {
    constructor() {
        this._chain = Promise.resolve();
    }

    wait(ms) {
        return this.waitFor(new Promise(res => setTimeout(res, ms)));
    }

    waitFor(promise) {
        this._chain = this._chain.then(() => promise);
        return this._chain;
    }

    flush() {
        return this._chain;
    }
}
