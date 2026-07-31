import { CanvasStack } from './canvas-stack.js';
import { TerrainLayer } from './terrain-layer.js';
import { FeatureLayer } from './feature-layer.js';
import { PoliticalLayer } from './political-layer.js';
import { LabelLayer } from './label-layer.js';
import { pointInPolygon } from '../model/geometry.js';

export class MapRenderer {
  constructor(root) {
    this.root = root;
    this.stack = new CanvasStack(root, ['terrain', 'features', 'politics', 'labels']);
    this.terrainLayer = new TerrainLayer(this.stack);
    this.featureLayer = new FeatureLayer(this.stack);
    this.politicalLayer = new PoliticalLayer(this.stack, this.terrainLayer);
    this.labelLayer = new LabelLayer(this.stack);
    this.camera = { x: 0, y: 0, scale: 0.65, minScale: 0.28, maxScale: 1.8 };
    this.selection = { regionId: 10, tileId: 30 };
    this.mode = 'terrain';
    this.frame = null;
  }

  setMap(map) {
    this.map = map;
    this.selection.regionId = map.initialRegionId;
    this.selection.tileId = map.regions[map.initialRegionId].tileIds[0];
    this.terrainLayer.setMap(map);
    this.featureLayer.setMap(map);
    this.politicalLayer.setMap(map);
    this.labelLayer.setMap(map);
    this.focusRegion(map.initialRegionId, false);
    this.schedule();
  }

  resize() { this.stack.resize(); this.schedule(); }
  setMode(mode) { this.mode = mode; this.schedule(); }

  schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = null; this.draw(); });
  }

  draw() {
    if (!this.map) return;
    this.terrainLayer.draw(this.camera);
    this.featureLayer.draw(this.camera, this.selection);
    this.politicalLayer.draw(this.camera, this.selection, this.mode);
    this.labelLayer.draw(this.camera, this.selection);
  }

  screenToWorld(screenX, screenY) {
    return { x: (screenX - this.camera.x) / this.camera.scale, y: (screenY - this.camera.y) / this.camera.scale };
  }

  hitTest(screenX, screenY) {
    const world = this.screenToWorld(screenX, screenY);
    if (!this.terrainLayer.isLand(world.x, world.y)) return null;
    for (const tile of this.map.tiles) if (pointInPolygon(world, tile.polygon)) return tile;
    return null;
  }

  selectTile(tileId, focus = true) {
    const tile = this.map.tiles[tileId];
    if (!tile) return;
    this.selection = { regionId: tile.regionId, tileId };
    if (focus) this.focusRegion(tile.regionId, true);
    this.schedule();
  }

  focusRegion(regionId, animate = true) {
    const region = this.map.regions[regionId];
    if (!region) return;
    const targetScale = Math.min(1.12, Math.max(0.72, this.stack.width / 780));
    const target = {
      scale: targetScale,
      x: this.stack.width / 2 - region.center.x * targetScale,
      y: this.stack.height * 0.47 - region.center.y * targetScale,
    };
    if (!animate) Object.assign(this.camera, target);
    else {
      const start = { ...this.camera };
      const started = performance.now();
      const duration = 420;
      const step = (now) => {
        const t = Math.min(1, (now - started) / duration);
        const eased = 1 - (1 - t) ** 3;
        this.camera.scale = start.scale + (target.scale - start.scale) * eased;
        this.camera.x = start.x + (target.x - start.x) * eased;
        this.camera.y = start.y + (target.y - start.y) * eased;
        this.schedule();
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  worldView() {
    const scale = Math.min(this.stack.width / this.map.width, this.stack.height / this.map.height) * 0.93;
    this.camera.scale = scale;
    this.camera.x = (this.stack.width - this.map.width * scale) / 2;
    this.camera.y = (this.stack.height - this.map.height * scale) / 2;
    this.schedule();
  }
}
