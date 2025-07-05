export class BindingManager {
  constructor(imageManager) {
    this.imageManager = imageManager;
    this.bindings = new Map(); // unitId -> [binding]
  }

  async bindImage(unit, path, offsetX = 0, offsetY = 0, behind = true, width = null, height = null) {
    const img = await this.imageManager.load(path);
    const arr = this.bindings.get(unit.id) || [];
    arr.push({ img, offsetX, offsetY, behind, width, height });
    this.bindings.set(unit.id, arr);
  }

  getBindings(unit) {
    return this.bindings.get(unit.id) || [];
  }

  clear() {
    this.bindings.clear();
  }
}
