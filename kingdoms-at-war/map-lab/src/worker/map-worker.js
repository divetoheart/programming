import { generateMap } from '../model/generator.js';

self.addEventListener('message', (event) => {
  try {
    const map = generateMap(event.data?.seed ?? Date.now());
    self.postMessage({ ok: true, map }, [map.terrain.pixels.buffer, map.terrain.mask.buffer]);
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
