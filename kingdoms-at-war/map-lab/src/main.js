import { MapRenderer } from './render/map-renderer.js';
import { CameraController } from './input/camera-controller.js';
import { MapLabUI } from './ui/map-lab-ui.js';

const appRoot = document.querySelector('[data-app]');
const mapRoot = document.querySelector('[data-map-root]');
const renderer = new MapRenderer(mapRoot);
let activeWorker = null;

const ui = new MapLabUI(appRoot, {
  onGenerate: (seed) => generate(seed),
  onWorld: () => renderer.worldView(),
  onFocus: () => renderer.focusRegion(renderer.selection.regionId),
  onMode: (mode) => renderer.setMode(mode),
  onTile: (tileId) => {
    renderer.selectTile(tileId);
    ui.renderSelection(renderer.map, renderer.selection);
  },
});

new CameraController(mapRoot, renderer.camera, {
  onChange: () => renderer.schedule(),
  onTap: (screenX, screenY) => {
    const tile = renderer.hitTest(screenX, screenY);
    if (!tile) return;
    renderer.selectTile(tile.id, tile.regionId !== renderer.selection.regionId);
    ui.renderSelection(renderer.map, renderer.selection);
  },
});

const generate = (seed) => {
  activeWorker?.terminate();
  ui.setLoading(true);
  document.querySelector('[data-error]').classList.add('hidden');
  const worker = new Worker('./src/worker/map-worker.js', { type: 'module' });
  activeWorker = worker;
  worker.addEventListener('message', (event) => {
    if (worker !== activeWorker) return;
    worker.terminate();
    activeWorker = null;
    if (!event.data.ok) {
      ui.showError(event.data.error);
      return;
    }
    renderer.setMap(event.data.map);
    ui.renderSelection(renderer.map, renderer.selection);
    ui.renderStats(renderer.map);
    ui.setLoading(false);
    const url = new URL(location.href);
    url.searchParams.set('seed', String(event.data.map.seed));
    history.replaceState(null, '', url);
  });
  worker.addEventListener('error', (event) => {
    ui.showError(event.message || 'Map generation failed.');
  });
  worker.postMessage({ seed });
};

const resizeObserver = new ResizeObserver(() => renderer.resize());
resizeObserver.observe(mapRoot);

const initialSeed = Number(new URLSearchParams(location.search).get('seed')) || 481516;
document.querySelector('[data-seed]').value = String(initialSeed);
generate(initialSeed);
