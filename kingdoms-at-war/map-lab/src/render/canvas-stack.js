export class CanvasStack {
  constructor(root, names) {
    this.root = root;
    this.layers = new Map();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const name of names) {
      const canvas = document.createElement('canvas');
      canvas.className = `map-layer map-layer-${name}`;
      canvas.dataset.layer = name;
      canvas.setAttribute('aria-hidden', 'true');
      root.appendChild(canvas);
      this.layers.set(name, { canvas, context: canvas.getContext('2d', { alpha: true, desynchronized: true }) });
    }
    this.resize();
  }

  resize() {
    const rect = this.root.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    for (const { canvas, context } of this.layers.values()) {
      canvas.width = Math.round(this.width * this.dpr);
      canvas.height = Math.round(this.height * this.dpr);
      canvas.style.width = `${this.width}px`;
      canvas.style.height = `${this.height}px`;
      context.imageSmoothingEnabled = true;
    }
  }

  get(name) { return this.layers.get(name); }
  clear(name) {
    const layer = this.get(name);
    layer.context.setTransform(1, 0, 0, 1, 0, 0);
    layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
  }
}
