const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class CameraController {
  constructor(root, camera, callbacks) {
    this.root = root;
    this.camera = camera;
    this.callbacks = callbacks;
    this.pointers = new Map();
    this.panOrigin = null;
    this.pinchOrigin = null;
    this.moved = false;
    this.bind();
  }

  bind() {
    this.root.addEventListener('pointerdown', (event) => this.pointerDown(event));
    this.root.addEventListener('pointermove', (event) => this.pointerMove(event));
    this.root.addEventListener('pointerup', (event) => this.pointerUp(event));
    this.root.addEventListener('pointercancel', (event) => this.pointerUp(event));
    this.root.addEventListener('wheel', (event) => {
      event.preventDefault();
      const rect = this.root.getBoundingClientRect();
      this.zoomAt(event.clientX - rect.left, event.clientY - rect.top, event.deltaY > 0 ? 0.88 : 1.14);
    }, { passive: false });
  }

  pointerDown(event) {
    this.root.setPointerCapture?.(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
    this.moved = false;
    if (this.pointers.size === 1) {
      this.panOrigin = { pointerX: event.clientX, pointerY: event.clientY, x: this.camera.x, y: this.camera.y };
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchOrigin = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: this.camera.scale,
        centerX: (a.x + b.x) / 2,
        centerY: (a.y + b.y) / 2,
      };
    }
  }

  pointerMove(event) {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) > 7) this.moved = true;

    if (this.pointers.size === 2 && this.pinchOrigin) {
      const [a, b] = [...this.pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = this.root.getBoundingClientRect();
      const centerX = (a.x + b.x) / 2 - rect.left;
      const centerY = (a.y + b.y) / 2 - rect.top;
      const targetScale = clamp(this.pinchOrigin.scale * distance / Math.max(1, this.pinchOrigin.distance), this.camera.minScale, this.camera.maxScale);
      this.setScaleAt(centerX, centerY, targetScale);
    } else if (this.pointers.size === 1 && this.panOrigin) {
      this.camera.x = this.panOrigin.x + event.clientX - this.panOrigin.pointerX;
      this.camera.y = this.panOrigin.y + event.clientY - this.panOrigin.pointerY;
      this.callbacks.onChange();
    }
  }

  pointerUp(event) {
    const pointer = this.pointers.get(event.pointerId);
    this.pointers.delete(event.pointerId);
    if (!this.moved && pointer && this.pointers.size === 0) {
      const rect = this.root.getBoundingClientRect();
      this.callbacks.onTap(event.clientX - rect.left, event.clientY - rect.top);
    }
    if (this.pointers.size < 2) this.pinchOrigin = null;
    if (this.pointers.size === 1) {
      const remaining = [...this.pointers.values()][0];
      this.panOrigin = { pointerX: remaining.x, pointerY: remaining.y, x: this.camera.x, y: this.camera.y };
    } else if (!this.pointers.size) this.panOrigin = null;
  }

  zoomAt(screenX, screenY, factor) {
    this.setScaleAt(screenX, screenY, clamp(this.camera.scale * factor, this.camera.minScale, this.camera.maxScale));
  }

  setScaleAt(screenX, screenY, scale) {
    const worldX = (screenX - this.camera.x) / this.camera.scale;
    const worldY = (screenY - this.camera.y) / this.camera.scale;
    this.camera.scale = scale;
    this.camera.x = screenX - worldX * scale;
    this.camera.y = screenY - worldY * scale;
    this.callbacks.onChange();
  }
}
