export class Controls {
  constructor(canvas, handlers = {}) {
    this.canvas = canvas; this.handlers = handlers; this.keys = {}; this.yawDelta = 0; this.pitchDelta = 0; this.move = { x: 0, y: 0 }; this.locked = false; this.touchLook = null; this.touchMove = null;
    addEventListener('keydown', e => { this.keys[e.code] = true; if (!e.repeat) this.action(e.code); });
    addEventListener('keyup', e => this.keys[e.code] = false);
    canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { if (!this.locked) canvas.requestPointerLock?.(); else handlers.attack?.(); } });
    document.addEventListener('pointerlockchange', () => this.locked = document.pointerLockElement === canvas);
    document.addEventListener('mousemove', e => { if (this.locked) { this.yawDelta -= e.movementX * .0023; this.pitchDelta -= e.movementY * .0018; } });
    this.bindTouch();
  }
  action(code) { if (code === 'Space') this.handlers.dodge?.(); if (code === 'KeyE') this.handlers.grab?.(); if (code === 'KeyB') this.handlers.bench?.(); if (code === 'Escape') this.handlers.escape?.(); }
  bindTouch() {
    const movePad = document.querySelector('#move-pad'), knob = movePad?.querySelector('i'), look = document.querySelector('#look-pad');
    const touchButton = (id, cb) => document.querySelector(id)?.addEventListener('pointerdown', e => { e.preventDefault(); cb?.(); });
    touchButton('#touch-hit', this.handlers.attack); touchButton('#touch-dodge', this.handlers.dodge); touchButton('#touch-grab', this.handlers.grab); touchButton('#touch-bench', this.handlers.bench);
    movePad?.addEventListener('pointerdown', e => { this.touchMove = e.pointerId; movePad.setPointerCapture(e.pointerId); this.setStick(e, movePad, knob); });
    movePad?.addEventListener('pointermove', e => { if (e.pointerId === this.touchMove) this.setStick(e, movePad, knob); });
    const endMove = e => { if (e.pointerId === this.touchMove) { this.touchMove = null; this.move.x = this.move.y = 0; knob.style.transform = ''; } };
    movePad?.addEventListener('pointerup', endMove); movePad?.addEventListener('pointercancel', endMove);
    look?.addEventListener('pointerdown', e => { this.touchLook = { id: e.pointerId, x: e.clientX, y: e.clientY }; look.setPointerCapture(e.pointerId); });
    look?.addEventListener('pointermove', e => { if (this.touchLook?.id === e.pointerId) { this.yawDelta -= (e.clientX - this.touchLook.x) * .006; this.pitchDelta -= (e.clientY - this.touchLook.y) * .004; this.touchLook.x = e.clientX; this.touchLook.y = e.clientY; } });
    const endLook = e => { if (this.touchLook?.id === e.pointerId) this.touchLook = null; }; look?.addEventListener('pointerup', endLook); look?.addEventListener('pointercancel', endLook);
  }
  setStick(e, pad, knob) { const r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, len = Math.hypot(dx, dy), max = r.width * .34, k = Math.min(1, max / Math.max(1, len)); this.move.x = dx / max * k; this.move.y = -dy / max * k; knob.style.transform = `translate(${dx * k}px,${dy * k}px)`; }
  sample() { const x = (this.keys.KeyD ? 1 : 0) - (this.keys.KeyA ? 1 : 0) + this.move.x, y = (this.keys.KeyW ? 1 : 0) - (this.keys.KeyS ? 1 : 0) + this.move.y, len = Math.hypot(x, y); const result = { x: len > 1 ? x / len : x, y: len > 1 ? y / len : y, sprint: !!(this.keys.ShiftLeft || this.keys.ShiftRight), yaw: this.yawDelta, pitch: this.pitchDelta }; this.yawDelta = this.pitchDelta = 0; return result; }
}
