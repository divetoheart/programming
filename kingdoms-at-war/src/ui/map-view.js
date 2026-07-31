import { getSlot } from '../game/selectors.js';
import { mapMarkup } from './map-markup.js';

export class MapView {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.camera = { x: 0, y: 0, scale: 0.78 };
    this.pointers = new Map();
    this.panStart = null;
    this.pinchStart = null;
    this.dragArmy = null;
    this.state = null;
  }

  render(state, selection, reachableSlotIds = new Set()) {
    this.state = state;
    const width = this.root.clientWidth || window.innerWidth;
    const height = this.root.clientHeight || window.innerHeight;
    this.root.innerHTML = mapMarkup(state, selection, reachableSlotIds, this.camera, width, height);
    this.bind();
  }

  bind() {
    const svg = this.root.querySelector('[data-world-svg]');
    svg.querySelectorAll('[data-slot-id]').forEach((node) => this.bindSlot(node));
    svg.querySelectorAll('[data-region-hit]').forEach((node) => node.addEventListener('dblclick', () => this.callbacks.onSelectRegion(node.dataset.regionHit)));
    svg.querySelectorAll('[data-army-id]').forEach((node) => this.bindArmy(node));
    svg.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    svg.addEventListener('pointermove', (event) => this.onPointerMove(event));
    svg.addEventListener('pointerup', (event) => this.onPointerUp(event));
    svg.addEventListener('pointercancel', (event) => this.onPointerUp(event));
    svg.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.zoomAt(event.clientX, event.clientY, event.deltaY > 0 ? 0.9 : 1.1);
    }, { passive: false });
  }

  bindSlot(node) {
    let timer;
    node.addEventListener('pointerdown', (event) => {
      timer = setTimeout(() => this.callbacks.onLongPressSlot?.(node.dataset.slotId), 520);
      event.stopPropagation();
    });
    node.addEventListener('pointerup', (event) => {
      clearTimeout(timer);
      this.callbacks.onSelectSlot(node.dataset.slotId);
      event.stopPropagation();
    });
    node.addEventListener('pointercancel', () => clearTimeout(timer));
    node.addEventListener('pointermove', () => clearTimeout(timer));
  }

  bindArmy(node) {
    node.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      node.setPointerCapture(event.pointerId);
      this.dragArmy = { id: node.dataset.armyId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, node };
    });
    node.addEventListener('pointermove', (event) => {
      if (!this.dragArmy || this.dragArmy.pointerId !== event.pointerId) return;
      if (Math.hypot(event.clientX - this.dragArmy.startX, event.clientY - this.dragArmy.startY) > 9) this.dragArmy.moved = true;
    });
    node.addEventListener('pointerup', (event) => {
      if (!this.dragArmy || this.dragArmy.pointerId !== event.pointerId) return;
      const drag = this.dragArmy;
      this.dragArmy = null;
      if (!drag.moved) this.callbacks.onSelectArmy(drag.id);
      else {
        drag.node.style.pointerEvents = 'none';
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-slot-id]');
        drag.node.style.pointerEvents = '';
        if (target) this.callbacks.onDragArmy(drag.id, target.dataset.slotId);
      }
      event.stopPropagation();
    });
  }

  onPointerDown(event) {
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (this.pointers.size === 1) this.panStart = { x: event.clientX, y: event.clientY, cameraX: this.camera.x, cameraY: this.camera.y };
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: this.camera.scale };
    }
  }

  onPointerMove(event) {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 2 && this.pinchStart) {
      const [a, b] = [...this.pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      this.camera.scale = Math.min(1.65, Math.max(0.46, this.pinchStart.scale * distance / this.pinchStart.distance));
      this.applyCamera();
    } else if (this.pointers.size === 1 && this.panStart) {
      this.camera.x = this.panStart.cameraX + event.clientX - this.panStart.x;
      this.camera.y = this.panStart.cameraY + event.clientY - this.panStart.y;
      this.applyCamera();
    }
  }

  onPointerUp(event) {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinchStart = null;
    if (!this.pointers.size) this.panStart = null;
  }

  zoomAt(clientX, clientY, factor) {
    const next = Math.min(1.65, Math.max(0.46, this.camera.scale * factor));
    const rect = this.root.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const worldX = (x - this.camera.x) / this.camera.scale;
    const worldY = (y - this.camera.y) / this.camera.scale;
    this.camera.scale = next;
    this.camera.x = x - worldX * next;
    this.camera.y = y - worldY * next;
    this.applyCamera();
  }

  applyCamera() {
    this.root.querySelector('[data-camera]')?.setAttribute('transform', `translate(${this.camera.x} ${this.camera.y}) scale(${this.camera.scale})`);
  }

  centerOn(slotId, scale = null) {
    const slot = getSlot(this.state, slotId);
    if (!slot) return;
    const width = this.root.clientWidth;
    const height = this.root.clientHeight;
    if (scale) this.camera.scale = scale;
    this.camera.x = width / 2 - slot.x * this.camera.scale;
    this.camera.y = height / 2 - slot.y * this.camera.scale;
    this.applyCamera();
  }

  resetView(ownerId) {
    const army = Object.values(this.state.armies).find((candidate) => candidate.ownerId === ownerId);
    if (army) this.centerOn(army.slotId, 0.82);
  }

  animateMovement(event) {
    const from = getSlot(this.state, event.fromSlotId);
    const to = getSlot(this.state, event.toSlotId);
    const layer = this.root.querySelector('[data-animation-layer]');
    if (!from || !to || !layer) return;
    const x = from.x + (to.x - from.x) * event.progress;
    const y = from.y + (to.y - from.y) * event.progress;
    layer.innerHTML = `<g transform="translate(${x} ${y})"><circle r="28" fill="#ead080" opacity=".24"/><circle r="13" fill="#f5dd98"/></g>`;
    if (event.tick === event.totalTicks) setTimeout(() => { if (layer) layer.innerHTML = ''; }, 140);
  }

  pulseSlot(slotId) {
    const node = this.root.querySelector(`[data-slot-id="${CSS.escape(slotId)}"] .slot-base`);
    node?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 700, easing: 'ease-out' });
  }
}
