import { getArmy, getRegion, getRegionBySlot, getSlot } from '../game/selectors.js';
import { mapMarkup } from './map-markup.js';

const FOCUS_SCALE = 1.48;

export class MapView {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.camera = { x: 0, y: 0, scale: FOCUS_SCALE };
    this.pointers = new Map();
    this.panStart = null;
    this.pinchStart = null;
    this.panMoved = false;
    this.dragArmy = null;
    this.state = null;
    this.focusedRegionId = null;
  }

  render(state, selection, reachableSlotIds = new Set()) {
    this.state = state;
    const width = this.root.clientWidth || window.innerWidth;
    const height = this.root.clientHeight || window.innerHeight;
    const resolvedFocus = this.resolveFocusRegion(state, selection);
    if (resolvedFocus && resolvedFocus !== this.focusedRegionId) {
      this.focusedRegionId = resolvedFocus;
      this.positionCameraForRegion(resolvedFocus, FOCUS_SCALE, width, height);
    }
    this.root.innerHTML = mapMarkup(state, selection, reachableSlotIds, this.camera, width, height, this.focusedRegionId);
    this.bind();
  }

  resolveFocusRegion(state, selection) {
    if (selection?.kind === 'region') return selection.id;
    if (selection?.kind === 'slot') return getRegionBySlot(state, selection.id)?.id ?? this.focusedRegionId;
    if (selection?.kind === 'army') {
      const army = getArmy(state, selection.id);
      return army ? getRegionBySlot(state, army.slotId)?.id : this.focusedRegionId;
    }
    if (selection?.armyId) {
      const army = getArmy(state, selection.armyId);
      return army ? getRegionBySlot(state, army.slotId)?.id : this.focusedRegionId;
    }
    return this.focusedRegionId;
  }

  bind() {
    const svg = this.root.querySelector('[data-world-svg]');
    if (!svg) return;
    svg.querySelectorAll('[data-slot-id]').forEach((node) => this.bindSlot(node));
    svg.querySelectorAll('[data-army-id]').forEach((node) => this.bindArmy(node));
    svg.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    svg.addEventListener('pointermove', (event) => this.onPointerMove(event));
    svg.addEventListener('pointerup', (event) => this.onPointerUp(event));
    svg.addEventListener('pointercancel', (event) => this.onPointerUp(event));
    svg.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.zoomAt(event.clientX, event.clientY, event.deltaY > 0 ? 0.88 : 1.12);
    }, { passive: false });
  }

  bindSlot(node) {
    let timer;
    let longPressed = false;
    node.addEventListener('pointerdown', (event) => {
      longPressed = false;
      timer = setTimeout(() => {
        longPressed = true;
        this.callbacks.onLongPressSlot?.(node.dataset.slotId);
      }, 520);
      event.stopPropagation();
    });
    node.addEventListener('pointerup', (event) => {
      clearTimeout(timer);
      if (!longPressed) this.callbacks.onSelectSlot(node.dataset.slotId);
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
    if (this.pointers.size === 1) {
      this.panMoved = false;
      this.panStart = { x: event.clientX, y: event.clientY, cameraX: this.camera.x, cameraY: this.camera.y };
    }
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
      this.camera.scale = Math.min(2.15, Math.max(0.38, this.pinchStart.scale * distance / this.pinchStart.distance));
      this.panMoved = true;
      this.applyCamera();
      this.updateLodClass();
    } else if (this.pointers.size === 1 && this.panStart) {
      const dx = event.clientX - this.panStart.x;
      const dy = event.clientY - this.panStart.y;
      if (Math.hypot(dx, dy) > 6) this.panMoved = true;
      this.camera.x = this.panStart.cameraX + dx;
      this.camera.y = this.panStart.cameraY + dy;
      this.applyCamera();
    }
  }

  onPointerUp(event) {
    const regionNode = !this.panMoved ? event.target.closest?.('[data-region-hit]') : null;
    this.pointers.delete(event.pointerId);
    if (regionNode && this.pointers.size === 0) {
      const regionId = regionNode.dataset.regionHit;
      this.focusRegion(regionId);
      this.callbacks.onSelectRegion?.(regionId);
    }
    if (this.pointers.size < 2) this.pinchStart = null;
    if (!this.pointers.size) this.panStart = null;
  }

  zoomAt(clientX, clientY, factor) {
    const next = Math.min(2.15, Math.max(0.38, this.camera.scale * factor));
    const rect = this.root.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const worldX = (x - this.camera.x) / this.camera.scale;
    const worldY = (y - this.camera.y) / this.camera.scale;
    this.camera.scale = next;
    this.camera.x = x - worldX * next;
    this.camera.y = y - worldY * next;
    this.applyCamera();
    this.updateLodClass();
  }

  updateLodClass() {
    const svg = this.root.querySelector('[data-world-svg]');
    if (!svg) return;
    const overview = this.camera.scale < 0.72;
    svg.classList.toggle('world-overview', overview);
    svg.classList.toggle('world-focus', !overview);
  }

  applyCamera() {
    this.root.querySelector('[data-camera]')?.setAttribute('transform', `translate(${this.camera.x} ${this.camera.y}) scale(${this.camera.scale})`);
  }

  positionCameraForRegion(regionId, scale = FOCUS_SCALE, width = this.root.clientWidth, height = this.root.clientHeight) {
    const region = getRegion(this.state, regionId);
    if (!region) return;
    this.camera.scale = scale;
    this.camera.x = width / 2 - region.x * scale;
    this.camera.y = height * 0.47 - region.y * scale;
  }

  focusRegion(regionId, scale = FOCUS_SCALE) {
    if (!this.state || !getRegion(this.state, regionId)) return;
    this.focusedRegionId = regionId;
    this.positionCameraForRegion(regionId, scale);
    this.applyCamera();
    this.updateLodClass();
  }

  centerOn(slotId, scale = null) {
    const slot = getSlot(this.state, slotId);
    if (!slot) return;
    const region = getRegionBySlot(this.state, slotId);
    if (region) this.focusedRegionId = region.id;
    const width = this.root.clientWidth;
    const height = this.root.clientHeight;
    if (scale) this.camera.scale = scale;
    this.camera.x = width / 2 - slot.x * this.camera.scale;
    this.camera.y = height * 0.47 - slot.y * this.camera.scale;
    this.applyCamera();
    this.updateLodClass();
  }

  resetView(ownerId) {
    const army = Object.values(this.state.armies).find((candidate) => candidate.ownerId === ownerId);
    const region = army ? getRegionBySlot(this.state, army.slotId) : null;
    if (region) this.focusRegion(region.id, FOCUS_SCALE);
  }

  animateMovement(event) {
    const from = getSlot(this.state, event.fromSlotId);
    const to = getSlot(this.state, event.toSlotId);
    const layer = this.root.querySelector('[data-animation-layer]');
    if (!from || !to || !layer) return;
    const x = from.x + (to.x - from.x) * event.progress;
    const y = from.y + (to.y - from.y) * event.progress;
    layer.innerHTML = `<g class="movement-marker" transform="translate(${x} ${y})"><circle r="28"/><path d="M-9 8 L10 -12 M4 12 L-10 -9"/></g>`;
    if (event.tick === event.totalTicks) setTimeout(() => { if (layer) layer.innerHTML = ''; }, 180);
  }

  pulseSlot(slotId) {
    const node = this.root.querySelector(`[data-slot-id="${CSS.escape(slotId)}"] .slot-card`);
    node?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 720, easing: 'ease-out' });
  }
}
