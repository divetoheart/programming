import { MAP, REGION_NAMES, TILE_SUFFIXES, HOLDING_TYPES } from '../config.js';
import { Rng } from './prng.js';
import { fbm, ridgeNoise } from './noise.js';
import { buildVoronoi, deriveAdjacency, distance, polygonCentroid, smoothPolyline } from './geometry.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

const continentSignal = (x, y, seed) => {
  const nx = (x / MAP.width - 0.5) * 2;
  const ny = (y / MAP.height - 0.5) * 2;
  const radial = 1 - Math.sqrt((nx / 0.91) ** 2 + (ny / 0.87) ** 2);
  const broad = fbm(nx * 1.15 + 4.2, ny * 1.15 - 2.7, seed + 11, 4) * 0.39;
  const detail = fbm(nx * 3.4 - 1.1, ny * 3.4 + 7.3, seed + 97, 5) * 0.14;
  const westBay = Math.exp(-1 * ((((nx + 0.82) / 0.27) ** 2) + (((ny + 0.02) / 0.42) ** 2))) * -0.22;
  const eastPeninsula = Math.exp(-1 * ((((nx - 0.74) / 0.36) ** 2) + (((ny - 0.35) / 0.28) ** 2))) * 0.18;
  const northBite = Math.exp(-1 * ((((nx - 0.08) / 0.42) ** 2) + (((ny + 0.92) / 0.18) ** 2))) * -0.18;
  return radial + broad + detail + westBay + eastPeninsula + northBite - 0.03;
};

const elevationAt = (x, y, seed) => {
  const land = continentSignal(x, y, seed);
  if (land <= 0) return land * 0.15;
  const nx = x / MAP.width;
  const ny = y / MAP.height;
  const diagonalRidge = Math.exp(-1 * (((ny - (0.16 + nx * 0.64)) / 0.095) ** 2));
  const northernRidge = Math.exp(-1 * (((ny - (0.86 - nx * 0.42)) / 0.11) ** 2));
  const westernRidge = Math.exp(-1 * ((((nx - 0.16) / 0.11) ** 2) + (((ny - 0.63) / 0.34) ** 2)));
  const rough = 0.42 + ridgeNoise(nx * 3.6, ny * 3.6, seed + 241) * 0.58;
  const detail = fbm(nx * 8.5, ny * 8.5, seed + 401, 4) * 0.1;
  return clamp(land * 0.38 + diagonalRidge * rough * 0.68 + northernRidge * rough * 0.38 + westernRidge * 0.48 + detail, 0, 1.25);
};

const moistureAt = (x, y, seed) => {
  const nx = x / MAP.width;
  const ny = y / MAP.height;
  const westWet = 0.18 * (1 - nx);
  return clamp(0.40 + fbm(nx * 2.2 + 7.2, ny * 2.2 - 3.9, seed + 733, 5) * 0.43 + westWet * 0.72, 0, 1);
};

const temperatureAt = (x, y, seed) => {
  const latitude = 1 - Math.abs(y / MAP.height - 0.53) * 1.15;
  const noise = fbm(x / MAP.width * 2.1, y / MAP.height * 2.1, seed + 877, 3) * 0.1;
  return clamp(latitude + noise, 0, 1);
};

const isLand = (x, y, seed, threshold = 0) => continentSignal(x, y, seed) > threshold;

const sampleLandPoint = (rng, seed, margin = 70, threshold = 0.09) => {
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const point = { x: rng.float(margin, MAP.width - margin), y: rng.float(margin, MAP.height - margin) };
    if (isLand(point.x, point.y, seed, threshold)) return point;
  }
  throw new Error('Unable to sample a land point.');
};

const generateAnchors = (rng, seed) => {
  const anchors = [];
  let minDistance = 205;
  while (anchors.length < MAP.regionCount) {
    let placed = false;
    for (let attempt = 0; attempt < 2200; attempt += 1) {
      const point = sampleLandPoint(rng, seed, 110, 0.1);
      if (anchors.every((anchor) => distance(anchor, point) >= minDistance)) {
        anchors.push(point);
        placed = true;
        break;
      }
    }
    if (!placed) minDistance *= 0.91;
  }
  return anchors;
};

const generateSites = (rng, seed, anchors, clusterRadius) => {
  const sites = [];
  anchors.forEach((anchor, regionIndex) => {
    const baseAngle = rng.float(0, Math.PI * 2);
    for (let tileIndex = 0; tileIndex < MAP.tilesPerRegion; tileIndex += 1) {
      let point = null;
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const angle = baseAngle + tileIndex * (Math.PI * 2 / 3) + rng.float(-0.35, 0.35);
        const radius = clusterRadius * rng.float(0.58, 1.02);
        const candidate = {
          x: anchor.x + Math.cos(angle) * radius,
          y: anchor.y + Math.sin(angle) * radius * 0.84,
        };
        if (!isLand(candidate.x, candidate.y, seed, 0.035)) continue;
        if (sites.every((site) => distance(site, candidate) > 34)) {
          point = candidate;
          break;
        }
      }
      if (!point) point = { x: anchor.x + rng.float(-35, 35), y: anchor.y + rng.float(-35, 35) };
      sites.push({ ...point, id: sites.length, regionId: regionIndex, localIndex: tileIndex });
    }
  });
  return sites;
};

const eachTriadConnected = (sites, adjacency) => {
  for (let regionId = 0; regionId < MAP.regionCount; regionId += 1) {
    const ids = sites.filter((site) => site.regionId === regionId).map((site) => site.id);
    const allowed = new Set(ids);
    const visited = new Set([ids[0]]);
    const stack = [ids[0]];
    while (stack.length) {
      const current = stack.pop();
      for (const neighbor of adjacency[current]) {
        if (allowed.has(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
    if (visited.size !== 3) return false;
  }
  return true;
};

const edgeNeighbor = (tileIndex, a, b, polygons, adjacency) => {
  const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  for (const neighborIndex of adjacency[tileIndex]) {
    const polygon = polygons[neighborIndex];
    for (let i = 0; i < polygon.length; i += 1) {
      const c = polygon[i];
      const d = polygon[(i + 1) % polygon.length];
      const vx = d.x - c.x;
      const vy = d.y - c.y;
      const length = Math.hypot(vx, vy) || 1;
      const crossDistance = Math.abs(vx * (midpoint.y - c.y) - vy * (midpoint.x - c.x)) / length;
      const dot = (midpoint.x - c.x) * vx + (midpoint.y - c.y) * vy;
      if (crossDistance < 0.75 && dot >= -1 && dot <= length * length + 1) return neighborIndex;
    }
  }
  return null;
};

const makeBoundarySegments = (sites, polygons, adjacency) => {
  const segments = [];
  polygons.forEach((polygon, tileIndex) => {
    for (let edgeIndex = 0; edgeIndex < polygon.length; edgeIndex += 1) {
      const a = polygon[edgeIndex];
      const b = polygon[(edgeIndex + 1) % polygon.length];
      const neighborIndex = edgeNeighbor(tileIndex, a, b, polygons, adjacency);
      if (neighborIndex === null || sites[neighborIndex].regionId !== sites[tileIndex].regionId) {
        segments.push({ a, b, regionId: sites[tileIndex].regionId });
      }
    }
  });
  return segments;
};

const terrainColor = (land, elevation, moisture, temperature) => {
  if (land <= -0.08) return [24, 48, 58];
  if (land <= 0) return [47, 75, 79];
  if (land < 0.025) return [160, 151, 112];
  if (elevation > 0.92) return temperature < 0.43 ? [184, 182, 169] : [105, 101, 91];
  if (elevation > 0.68) return [103, 102, 77];
  if (moisture > 0.76 && elevation < 0.25) return [59, 96, 81];
  if (moisture > 0.64) return [53, 89, 58];
  if (moisture < 0.28) return [139, 123, 79];
  if (elevation < 0.2 && moisture > 0.48) return [122, 132, 73];
  return [101, 122, 70];
};

const makeTerrainPixels = (seed) => {
  const width = MAP.terrainWidth;
  const height = MAP.terrainHeight;
  const pixels = new Uint8ClampedArray(width * height * 4);
  const mask = new Uint8ClampedArray(width * height * 4);
  const scaleX = MAP.width / width;
  const scaleY = MAP.height / height;
  const heights = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      heights[y * width + x] = elevationAt((x + 0.5) * scaleX, (y + 0.5) * scaleY, seed);
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const mapX = (x + 0.5) * scaleX;
      const mapY = (y + 0.5) * scaleY;
      const land = continentSignal(mapX, mapY, seed);
      const elevation = heights[y * width + x];
      const moisture = moistureAt(mapX, mapY, seed);
      const temperature = temperatureAt(mapX, mapY, seed);
      const base = terrainColor(land, elevation, moisture, temperature);
      const left = heights[y * width + Math.max(0, x - 1)];
      const right = heights[y * width + Math.min(width - 1, x + 1)];
      const up = heights[Math.max(0, y - 1) * width + x];
      const down = heights[Math.min(height - 1, y + 1) * width + x];
      const shade = clamp(0.93 + (left - right) * 1.45 + (up - down) * 0.78, 0.62, 1.24);
      const grain = fbm(mapX / 84, mapY / 84, seed + 1201, 3) * 5;
      const index = (y * width + x) * 4;
      pixels[index] = clamp(base[0] * shade + grain, 0, 255);
      pixels[index + 1] = clamp(base[1] * shade + grain, 0, 255);
      pixels[index + 2] = clamp(base[2] * shade + grain, 0, 255);
      pixels[index + 3] = 255;
      const landAlpha = land > 0 ? 255 : 0;
      mask[index] = 255; mask[index + 1] = 255; mask[index + 2] = 255; mask[index + 3] = landAlpha;
    }
  }
  return { pixels, mask };
};

const gridHydrology = (seed) => {
  const width = MAP.hydrologyWidth;
  const height = MAP.hydrologyHeight;
  const count = width * height;
  const elevation = new Float32Array(count);
  const accumulation = new Float32Array(count);
  const downstream = new Int32Array(count).fill(-1);
  const land = new Uint8Array(count);
  const mapX = (x) => (x + 0.5) * MAP.width / width;
  const mapY = (y) => (y + 0.5) * MAP.height / height;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const index = y * width + x;
    const signal = continentSignal(mapX(x), mapY(y), seed);
    land[index] = signal > 0 ? 1 : 0;
    elevation[index] = elevationAt(mapX(x), mapY(y), seed);
    accumulation[index] = land[index] ? 0.72 + moistureAt(mapX(x), mapY(y), seed) : 0;
  }
  const neighbors = [-1, 0, 1];
  for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) {
    const index = y * width + x;
    if (!land[index]) continue;
    let best = -1;
    let bestHeight = elevation[index];
    for (const dy of neighbors) for (const dx of neighbors) {
      if (!dx && !dy) continue;
      const next = (y + dy) * width + x + dx;
      const candidateHeight = land[next] ? elevation[next] : -0.04;
      if (candidateHeight < bestHeight) {
        bestHeight = candidateHeight;
        best = next;
      }
    }
    downstream[index] = best;
  }
  const order = [...Array(count).keys()].filter((index) => land[index]).sort((a, b) => elevation[b] - elevation[a]);
  for (const index of order) {
    const next = downstream[index];
    if (next >= 0) accumulation[next] += accumulation[index];
  }
  const candidates = order.filter((index) => accumulation[index] > 46 && elevation[index] > 0.18)
    .sort((a, b) => accumulation[b] - accumulation[a]);
  const rivers = [];
  const used = new Set();
  for (const source of candidates) {
    if (rivers.length >= 9 || used.has(source)) continue;
    const path = [];
    let current = source;
    let guard = 0;
    while (current >= 0 && guard++ < 500) {
      const x = current % width;
      const y = Math.floor(current / width);
      path.push({ x: mapX(x), y: mapY(y), width: clamp(Math.sqrt(accumulation[current]) * 0.48, 2.2, 13) });
      used.add(current);
      const next = downstream[current];
      if (next < 0 || !land[next]) {
        if (next >= 0) {
          const nx = next % width;
          const ny = Math.floor(next / width);
          path.push({ x: mapX(nx), y: mapY(ny), width: path[path.length - 1].width + 2 });
        }
        break;
      }
      current = next;
    }
    if (path.length > 7) rivers.push(smoothPolyline(path, 2).map((point, index) => ({ ...point, width: path[Math.min(path.length - 1, Math.floor(index * path.length / Math.max(1, smoothPolyline(path, 2).length)))].width })));
  }
  return rivers;
};

const makeFeatures = (rng, seed) => {
  const forests = [];
  const mountains = [];
  const farms = [];
  for (let attempt = 0; attempt < 6500 && forests.length < 820; attempt += 1) {
    const point = sampleLandPoint(rng, seed, 20, 0.01);
    const elevation = elevationAt(point.x, point.y, seed);
    const moisture = moistureAt(point.x, point.y, seed);
    const cluster = fbm(point.x / 260, point.y / 260, seed + 1901, 4);
    if (moisture > 0.57 && cluster > -0.02 && elevation > 0.06 && elevation < 0.62 && rng.chance(0.58)) {
      forests.push({ ...point, scale: rng.float(0.55, 1.25), tone: rng.int(0, 2) });
    }
  }
  for (let attempt = 0; attempt < 5200 && mountains.length < 165; attempt += 1) {
    const point = sampleLandPoint(rng, seed, 25, 0.015);
    const elevation = elevationAt(point.x, point.y, seed);
    if (elevation > 0.47 && rng.chance(clamp((elevation - 0.40) * 1.9, 0, 0.94))) {
      mountains.push({ ...point, scale: rng.float(0.65, 1.35), elevation });
    }
  }
  for (let attempt = 0; attempt < 2600 && farms.length < 120; attempt += 1) {
    const point = sampleLandPoint(rng, seed, 30, 0.02);
    const elevation = elevationAt(point.x, point.y, seed);
    const moisture = moistureAt(point.x, point.y, seed);
    if (elevation < 0.32 && moisture > 0.36 && moisture < 0.68 && rng.chance(0.18)) {
      farms.push({ ...point, rotation: rng.float(-0.5, 0.5), scale: rng.float(0.7, 1.45) });
    }
  }
  return { forests, mountains, farms };
};

const makeHoldings = (rng, sites) => {
  const holdings = [];
  sites.forEach((site) => {
    let type = null;
    if (site.regionId === 10) type = site.localIndex === 0 ? 'fortress' : site.localIndex === 1 ? 'village' : null;
    else if (site.localIndex === 0) type = rng.pick(HOLDING_TYPES);
    else if (rng.chance(0.16)) type = rng.pick(['village', 'temple', 'fortress']);
    if (type) holdings.push({ tileId: site.id, type, level: rng.int(1, 2), ownerId: site.regionId % 4 });
  });
  return holdings;
};

const makeRoads = (rng, sites, adjacency, holdings) => {
  const holdingTiles = new Set(holdings.map((holding) => holding.tileId));
  const roads = [];
  const seen = new Set();
  sites.forEach((site) => {
    adjacency[site.id].forEach((neighborId) => {
      const key = site.id < neighborId ? `${site.id}-${neighborId}` : `${neighborId}-${site.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      const neighbor = sites[neighborId];
      const sameRegion = site.regionId === neighbor.regionId;
      if (!sameRegion && !holdingTiles.has(site.id) && !holdingTiles.has(neighborId) && !rng.chance(0.12)) return;
      if (!sameRegion && !rng.chance(0.28)) return;
      const mid = {
        x: (site.x + neighbor.x) / 2 + rng.float(-28, 28),
        y: (site.y + neighbor.y) / 2 + rng.float(-28, 28),
      };
      roads.push({ from: { x: site.x, y: site.y }, via: mid, to: { x: neighbor.x, y: neighbor.y }, major: holdingTiles.has(site.id) && holdingTiles.has(neighborId) });
    });
  });
  return roads;
};

const makeRegions = (rng, sites, polygons) => {
  return [...Array(MAP.regionCount).keys()].map((regionId) => {
    const tileIds = sites.filter((site) => site.regionId === regionId).map((site) => site.id);
    const centroids = tileIds.map((tileId) => polygonCentroid(polygons[tileId]));
    const center = centroids.reduce((sum, point) => ({ x: sum.x + point.x / 3, y: sum.y + point.y / 3 }), { x: 0, y: 0 });
    return {
      id: regionId,
      name: REGION_NAMES[regionId] ?? `Region ${regionId + 1}`,
      tileIds,
      center,
      ownerId: regionId % 4,
      colorIndex: regionId % 10,
    };
  });
};

const makeTileRecords = (sites, polygons, seed, rng) => sites.map((site) => {
  const center = polygonCentroid(polygons[site.id]);
  const elevation = elevationAt(site.x, site.y, seed);
  const moisture = moistureAt(site.x, site.y, seed);
  const terrain = elevation > 0.68 ? 'mountains' : elevation > 0.43 ? 'hills' : moisture > 0.76 ? 'wetlands' : moisture > 0.62 ? 'forest' : moisture < 0.29 ? 'arid' : elevation < 0.23 && moisture > 0.45 ? 'farmland' : 'plains';
  return {
    id: site.id,
    regionId: site.regionId,
    localIndex: site.localIndex,
    name: `${REGION_NAMES[site.regionId]} ${rng.pick(TILE_SUFFIXES)}`,
    site: { x: site.x, y: site.y },
    center,
    polygon: polygons[site.id],
    terrain,
    elevation,
    moisture,
  };
});

const generatePoliticalGeometry = (rng, seed) => {
  const anchors = generateAnchors(rng, seed);
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const sites = generateSites(rng, seed, anchors, lerp(74, 45, attempt / 17));
    const polygons = buildVoronoi(sites, MAP.width, MAP.height);
    const { adjacency } = deriveAdjacency(polygons);
    if (adjacency.every((neighbors) => neighbors.length >= 2) && eachTriadConnected(sites, adjacency)) {
      return { sites, polygons, adjacency };
    }
  }
  throw new Error('Could not create connected three-tile regions.');
};

export const generateMap = (seedInput = 1) => {
  const seed = Number(seedInput) >>> 0 || 1;
  const rng = new Rng(seed);
  const { sites, polygons, adjacency } = generatePoliticalGeometry(rng, seed);
  const tiles = makeTileRecords(sites, polygons, seed, rng);
  const regions = makeRegions(rng, sites, polygons);
  const holdings = makeHoldings(rng, sites);
  const roads = makeRoads(rng, sites, adjacency, holdings);
  const rivers = gridHydrology(seed);
  const features = makeFeatures(rng, seed);
  const regionBoundaries = makeBoundarySegments(sites, polygons, adjacency);
  const terrainRaster = makeTerrainPixels(seed);
  const adjacencyById = Object.fromEntries(adjacency.map((neighbors, index) => [index, neighbors]));
  return {
    seed,
    width: MAP.width,
    height: MAP.height,
    terrain: { width: MAP.terrainWidth, height: MAP.terrainHeight, pixels: terrainRaster.pixels, mask: terrainRaster.mask },
    tiles,
    regions,
    adjacency: adjacencyById,
    regionBoundaries,
    rivers,
    roads,
    holdings,
    features,
    initialRegionId: 10,
  };
};
