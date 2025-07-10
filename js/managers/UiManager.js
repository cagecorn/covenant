export class UiManager {
    constructor(startBtn, wrapper, offset = 70) {
        this.startBtn = startBtn;
        this.wrapper = wrapper;
        this.offset = offset;
    }

    init() {
        if (this.wrapper) {
            this.wrapper.style.setProperty('--ui-offset', `${this.offset}px`);
        }
    }

    disableStart() {
        if (this.startBtn) this.startBtn.disabled = true;
    }

    enableStart() {
        if (this.startBtn) this.startBtn.disabled = false;
    }

    getOffset() {
        return this.offset;
    }
}

