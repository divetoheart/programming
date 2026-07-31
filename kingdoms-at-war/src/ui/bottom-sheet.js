export class BottomSheet {
  constructor(element) {
    this.element = element;
    this.state = 'peek';
    this.drag = null;
  }
  setContent(summary, content) {
    this.element.innerHTML = `<div class="sheet-grabber" data-sheet-grabber aria-label="Resize details panel"></div><div class="sheet-summary">${summary}</div><div class="sheet-content">${content}</div>`;
    this.applyState();
    this.bindGestures();
  }
  setState(state) { this.state = state; this.applyState(); }
  toggle() { this.setState(this.state === 'expanded' ? 'peek' : this.state === 'peek' ? 'half' : 'expanded'); }
  applyState() { this.element.classList.remove('peek', 'half', 'expanded'); this.element.classList.add(this.state); }
  bindGestures() {
    const grabber = this.element.querySelector('[data-sheet-grabber]');
    grabber.addEventListener('click', () => this.toggle());
    grabber.addEventListener('pointerdown', (event) => {
      grabber.setPointerCapture(event.pointerId);
      this.drag = { id: event.pointerId, startY: event.clientY };
    });
    grabber.addEventListener('pointerup', (event) => {
      if (!this.drag || this.drag.id !== event.pointerId) return;
      const delta = event.clientY - this.drag.startY;
      this.drag = null;
      if (delta < -28) this.setState(this.state === 'peek' ? 'half' : 'expanded');
      else if (delta > 28) this.setState(this.state === 'expanded' ? 'half' : 'peek');
      else this.toggle();
    });
    grabber.addEventListener('pointercancel', () => { this.drag = null; });
  }
}
