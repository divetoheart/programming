export class Toasts {
  constructor(root) { this.root = root; }
  show(message, type = 'info', duration = 2600) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.root.prepend(toast);
    setTimeout(() => toast.remove(), duration);
  }
}
