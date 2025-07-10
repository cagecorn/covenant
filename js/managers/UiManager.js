export class UiManager {
    constructor(container) {
        this.container = container;
        this.frame = container ? container.querySelector('iframe') : null;
    }

    init() {
        // 기능은 추후 구현 예정
        if (this.frame) {
            this.frame.addEventListener('load', () => {
                // 향후 초기화 로직 자리
            });
        }
    }

    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
}
