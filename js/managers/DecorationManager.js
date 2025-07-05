export class DecorationManager {
  constructor(bindingManager, cellSize = 192) {
    this.bindingManager = bindingManager;
    this.cellSize = cellSize;
  }

  async applyFlag(unit) {
    const flagPath =
      unit.team === 'player'
        ? 'assets/images/blue-flag.png'
        : 'assets/images/red-flag.png';
    const offsetX = -this.cellSize * 0.45;
    const offsetY = -this.cellSize * 0.25;
    const size = this.cellSize / 1.5; // shrink flag to roughly quarter original
    await this.bindingManager.bindImage(unit, flagPath, offsetX, offsetY, true, size, size);
  }

  async applyDefaultDecorations(units) {
    const promises = units.map((u) => this.applyFlag(u));
    await Promise.all(promises);
  }
}
