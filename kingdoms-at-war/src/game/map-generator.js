import { REGION_COUNT, MAP_WIDTH, MAP_HEIGHT, NEUTRAL_ID, PLAYER_COUNT } from '../config/balance.js';
import { TERRAIN_IDS, TERRAIN_TYPES } from '../config/terrain.js';
import { REGION_PREFIXES, REGION_SUFFIXES } from '../config/names.js';
import { BUILDING_TYPES } from '../config/buildings.js';
import { createEmptyUnits } from '../config/units.js';
import { edgeKey, isConnected } from '../core/graph.js';
import { distance } from '../core/math.js';

const SLOT_LAYOUTS = [
  [[0, -62], [-64, 48], [64, 48]],
  [[-68, 0], [0, 0], [68, 0]],
  [[0, -58], [0, 10], [0, 74]],
  [[-62, -42], [62, -42], [0, 62]]
];
const INTERNAL_EDGE_PATTERNS = [[0, 1, 1, 2, 2, 0], [0, 1, 1, 2], [0, 2, 2, 1]];

const makeBuilding = (type, ownerId, options = {}) => ({
  id: options.id,
  type,
  ownerId,
  garrison: options.garrison ?? createEmptyUnits(),
  morale: options.morale ?? 62,
  supply: options.supply ?? Math.round(BUILDING_TYPES[type].supplyStorage * 0.72),
  fortification: options.fortification ?? BUILDING_TYPES[type].fortification,
  damaged: 0,
  capital: Boolean(options.capital)
});

const closestSlotPair = (regionA, regionB) => {
  let best = null;
  for (const slotA of regionA.slots) for (const slotB of regionB.slots) {
    const d = distance(slotA, slotB);
    if (!best || d < best.distance) best = { a: slotA.id, b: slotB.id, distance: d };
  }
  return best;
};

const addEdge = (edges, seen, a, b, kind = 'land', cost = 1) => {
  const key = edgeKey(a, b);
  if (seen.has(key)) return;
  seen.add(key);
  edges.push({ id: `edge-${edges.length}`, a, b, kind, cost });
};

export const generateMap = (rng, kingdomIds) => {
  const cols = 5;
  const rows = Math.ceil(REGION_COUNT / cols);
  const cellW = MAP_WIDTH / cols;
  const cellH = MAP_HEIGHT / rows;
  const names = new Set();
  const regions = [];
  const usedTerrains = [...TERRAIN_IDS];
  for (let index = 0; index < REGION_COUNT; index += 1) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    let name;
    do name = `${rng.pick(REGION_PREFIXES)}${rng.pick(REGION_SUFFIXES)}`; while (names.has(name));
    names.add(name);
    const x = Math.round((col + 0.5) * cellW + rng.float(-38, 38));
    const y = Math.round((row + 0.5) * cellH + rng.float(-34, 34));
    const terrain = index < usedTerrains.length ? usedTerrains[index] : rng.pick(TERRAIN_IDS);
    const coastal = col === 0 || col === cols - 1 || (row === 0 && rng.chance(0.45)) || (row === rows - 1 && rng.chance(0.45));
    const layout = rng.pick(SLOT_LAYOUTS);
    const slots = layout.map(([dx, dy], slotIndex) => ({
      id: `region-${index}-slot-${slotIndex}`,
      regionId: `region-${index}`,
      index: slotIndex,
      x: x + dx,
      y: y + dy,
      terrain,
      building: null
    }));
    regions.push({
      id: `region-${index}`, index, name, terrain, coastal, x, y,
      population: Math.round(480 + TERRAIN_TYPES[terrain].populationCap * 0.55 + rng.int(-90, 120)),
      slots
    });
  }

  const edges = [];
  const seen = new Set();
  for (const region of regions) {
    const pattern = rng.pick(INTERNAL_EDGE_PATTERNS);
    for (let i = 0; i < pattern.length; i += 2) addEdge(edges, seen, region.slots[pattern[i]].id, region.slots[pattern[i + 1]].id, 'internal', TERRAIN_TYPES[region.terrain].movement);
  }
  for (let row = 0; row < rows; row += 1) for (let col = 0; col < cols; col += 1) {
    const index = row * cols + col;
    if (!regions[index]) continue;
    for (const [dc, dr] of [[1, 0], [0, 1]]) {
      const otherIndex = (row + dr) * cols + (col + dc);
      if ((col + dc) >= cols || !regions[otherIndex]) continue;
      const pair = closestSlotPair(regions[index], regions[otherIndex]);
      addEdge(edges, seen, pair.a, pair.b, 'land', (TERRAIN_TYPES[regions[index].terrain].movement + TERRAIN_TYPES[regions[otherIndex].terrain].movement) / 2);
    }
  }
  // Sparse sea lanes between coastal regions create optional naval shortcuts.
  const coastal = regions.filter((region) => region.coastal);
  for (let i = 0; i < coastal.length - 1; i += 2) {
    const a = coastal[i]; const b = coastal[i + 1];
    if (distance(a, b) < 520) {
      const pair = closestSlotPair(a, b);
      addEdge(edges, seen, pair.a, pair.b, 'sea', 1);
    }
  }

  const startIndexes = [0, cols - 1, REGION_COUNT - cols, REGION_COUNT - 1];
  startIndexes.slice(0, PLAYER_COUNT).forEach((regionIndex, playerIndex) => {
    const ownerId = kingdomIds[playerIndex];
    const region = regions[regionIndex];
    region.population = 1500;
    region.slots[0].building = makeBuilding('fortress', ownerId, { id: `${region.id}-fortress`, capital: true, morale: 76 });
    region.slots[1].building = makeBuilding('village', ownerId, { id: `${region.id}-village`, morale: 70 });
  });

  const startSet = new Set(startIndexes);
  for (const region of regions) {
    if (startSet.has(region.index)) continue;
    const buildingCount = rng.chance(0.28) ? 2 : 1;
    const possible = region.coastal ? ['village', 'fortress', 'temple', 'city'] : ['village', 'fortress', 'temple', 'village', 'village'];
    const chosen = new Set();
    for (let i = 0; i < buildingCount; i += 1) {
      let slotIndex;
      do slotIndex = rng.int(0, 2); while (chosen.has(slotIndex));
      chosen.add(slotIndex);
      const type = rng.pick(possible);
      const base = BUILDING_TYPES[type];
      const garrison = createEmptyUnits();
      garrison.footmen = type === 'temple' ? rng.int(0, 1) : rng.int(1, 2);
      garrison.archers = type === 'fortress' ? rng.int(0, 1) : 0;
      region.slots[slotIndex].building = makeBuilding(type, NEUTRAL_ID, {
        id: `${region.id}-${type}-${slotIndex}`, garrison, morale: rng.int(44, 61), supply: Math.round(base.supplyStorage * rng.float(0.35, 0.7))
      });
    }
  }

  for (const region of regions) {
    const cap = TERRAIN_TYPES[region.terrain].populationCap + region.slots.reduce((sum, slot) => sum + (slot.building ? BUILDING_TYPES[slot.building.type].populationCap : 0), 0);
    region.population = Math.min(region.population, cap);
  }

  const map = { width: MAP_WIDTH, height: MAP_HEIGHT, regions, edges };
  if (!isConnected(map)) throw new Error('Generated map is disconnected.');
  return map;
};
