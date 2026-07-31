import { GameApp } from './ui/app.js';

const root = document.querySelector('#app');
const app = new GameApp(root);
app.start();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
