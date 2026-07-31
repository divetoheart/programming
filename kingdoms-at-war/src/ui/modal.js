export class Modal {
  constructor(root) { this.root = root; }
  open({ title, body, onBind }) {
    this.root.innerHTML = `<div class="modal-layer" data-modal-layer><section class="modal-card" role="dialog" aria-modal="true" aria-label="${title}"><header class="modal-header"><h2>${title}</h2><button class="close-button" data-close-modal aria-label="Close">×</button></header>${body}</section></div>`;
    this.root.querySelector('[data-close-modal]').addEventListener('click', () => this.close());
    this.root.querySelector('[data-modal-layer]').addEventListener('pointerdown', (event) => { if (event.target === event.currentTarget) this.close(); });
    onBind?.(this.root.querySelector('.modal-card'));
  }
  close() { this.root.innerHTML = ''; }
}
