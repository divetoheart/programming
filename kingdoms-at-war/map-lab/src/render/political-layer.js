const REGION_COLORS = ['#9a894e', '#8e4f47', '#527b97', '#6f8453', '#796289', '#9a7051', '#547c70', '#7d6e4e', '#53678b', '#7f7950'];

const polygonPath = (ctx, polygon) => {
  ctx.beginPath();
  polygon.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.closePath();
};

const pointKey = (point) => `${Math.round(point.x * 10)},${Math.round(point.y * 10)}`;
const canonicalEdge = (a, b) => pointKey(a) < pointKey(b) ? { a, b } : { a: b, b: a };
const edgeKey = (a, b) => {
  const edge = canonicalEdge(a, b);
  return `${pointKey(edge.a)}|${pointKey(edge.b)}`;
};
const stringSeed = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
};
const random01 = (seed, index) => {
  let value = Math.imul(seed ^ Math.imul(index + 1, 0x9e3779b1), 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
};

const strokeNoisyEdge = (ctx, from, to, amplitude) => {
  const { a, b } = canonicalEdge(from, to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const steps = Math.max(2, Math.ceil(length / 28));
  const seed = stringSeed(edgeKey(a, b));
  const phase = random01(seed, 97) * Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  for (let index = 1; index < steps; index += 1) {
    const t = index / steps;
    const envelope = Math.sin(Math.PI * t);
    const broad = Math.sin(t * Math.PI * 2 + phase) * 0.46;
    const fine = (random01(seed, index) * 2 - 1) * 0.54;
    const offset = (broad + fine) * amplitude * envelope;
    ctx.lineTo(a.x + dx * t + nx * offset, a.y + dy * t + ny * offset);
  }
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
};

const collectTileEdges = (tiles) => {
  const edges = new Map();
  for (const tile of tiles) {
    for (let index = 0; index < tile.polygon.length; index += 1) {
      const a = tile.polygon[index];
      const b = tile.polygon[(index + 1) % tile.polygon.length];
      const key = edgeKey(a, b);
      const entry = edges.get(key) ?? { ...canonicalEdge(a, b), tileIds: new Set(), regionIds: new Set() };
      entry.tileIds.add(tile.id);
      entry.regionIds.add(tile.regionId);
      edges.set(key, entry);
    }
  }
  return [...edges.values()];
};

const collectRegionEdges = (segments) => {
  const edges = new Map();
  for (const segment of segments) {
    const key = edgeKey(segment.a, segment.b);
    const entry = edges.get(key) ?? { ...canonicalEdge(segment.a, segment.b), regionIds: new Set() };
    entry.regionIds.add(segment.regionId);
    edges.set(key, entry);
  }
  return [...edges.values()];
};

export class PoliticalLayer {
  constructor(stack, terrainLayer) {
    this.stack = stack;
    this.terrainLayer = terrainLayer;
  }

  setMap(map) {
    this.map = map;
    this.tileEdges = collectTileEdges(map.tiles);
    this.regionEdges = collectRegionEdges(map.regionBoundaries);
  }

  draw(camera, selection, mode) {
    const { context, canvas } = this.stack.get('politics');
    const dpr = this.stack.dpr;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.x * dpr, camera.y * dpr);
    context.lineJoin = 'round';
    context.lineCap = 'round';
    const showTiles = camera.scale >= 0.43;

    for (const tile of this.map.tiles) {
      const selectedRegion = tile.regionId === selection.regionId;
      const selectedTile = tile.id === selection.tileId;
      polygonPath(context, tile.polygon);
      const base = REGION_COLORS[tile.regionId % REGION_COLORS.length];
      context.fillStyle = selectedTile ? 'rgba(240,202,105,.26)' : selectedRegion ? 'rgba(230,190,94,.12)' : mode === 'political' ? `${base}38` : `${base}13`;
      context.fill();
    }

    if (showTiles) {
      for (const edge of this.tileEdges) {
        const selectedTile = edge.tileIds.has(selection.tileId);
        const selectedRegion = edge.regionIds.has(selection.regionId);
        context.strokeStyle = selectedTile ? 'rgba(255,226,143,.94)' : selectedRegion ? 'rgba(226,196,112,.65)' : 'rgba(235,225,197,.30)';
        context.lineWidth = (selectedTile ? 3.2 : selectedRegion ? 2 : 1.05) / camera.scale;
        strokeNoisyEdge(context, edge.a, edge.b, selectedTile ? 4.5 : 3.2);
      }
    }

    for (const edge of this.regionEdges) {
      const selected = edge.regionIds.has(selection.regionId);
      context.strokeStyle = selected ? 'rgba(255,218,118,.98)' : 'rgba(32,27,19,.88)';
      context.lineWidth = (selected ? 6.8 : 4.4) / camera.scale;
      context.shadowColor = selected ? 'rgba(255,205,80,.68)' : 'transparent';
      context.shadowBlur = selected ? 10 / camera.scale : 0;
      strokeNoisyEdge(context, edge.a, edge.b, selected ? 8.5 : 6.2);
      if (!selected) {
        context.shadowBlur = 0;
        context.strokeStyle = 'rgba(224,211,175,.44)';
        context.lineWidth = 1.15 / camera.scale;
        strokeNoisyEdge(context, edge.a, edge.b, 6.2);
      }
    }
    context.shadowBlur = 0;
    this.terrainLayer.applyLandMask(context, camera);
  }
}
