import { BUILDING_TYPES } from '../config/buildings.js';
import { TERRAIN_TYPES } from '../config/terrain.js';
import { unitCount } from '../config/units.js';
import { armiesAt, getSlot, regionController, regionStatus } from '../game/selectors.js';
import { emblemGlyph } from './setup-view.js';
import { escapeHtml } from './format.js';
import {
  buildingIllustration,
  buildingLabel,
  emptySlotIllustration,
  mapDefs,
  regionPath,
  terrainDecoration
} from './map-art.js';

const ownerColor = (state, ownerId, fallback = '#8a8068') => state.kingdoms[ownerId]?.color ?? fallback;
const regionOwnerColor = (state, region) => ownerColor(state, regionController(state, region), '#817865');

const neighboringRegions = (state, focusedRegionId) => {
  if (!focusedRegionId) return new Set();
  const slotRegion = new Map();
  state.map.regions.forEach((region) => region.slots.forEach((slot) => slotRegion.set(slot.id, region.id)));
  const result = new Set();
  state.map.edges.forEach((edge) => {
    const a = slotRegion.get(edge.a);
    const b = slotRegion.get(edge.b);
    if (a === focusedRegionId && b && b !== a) result.add(b);
    if (b === focusedRegionId && a && a !== b) result.add(a);
  });
  return result;
};

const edgeMarkup = (state, edge, focusedRegionId, neighbors) => {
  const a = getSlot(state, edge.a);
  const b = getSlot(state, edge.b);
  if (!a || !b) return '';
  const aFocus = a.regionId === focusedRegionId;
  const bFocus = b.regionId === focusedRegionId;
  const prominent = aFocus || bFocus;
  const context = neighbors.has(a.regionId) || neighbors.has(b.regionId);
  return `<line class="map-edge ${edge.kind} ${prominent ? 'focus-edge' : context ? 'context-edge' : 'distant-edge'}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
};

const compactSlotMarkup = (state, slot) => {
  const building = slot.building;
  const color = building ? ownerColor(state, building.ownerId) : '#8e8877';
  return `<g class="compact-slot ${building ? 'built' : 'empty'}" transform="translate(${slot.x} ${slot.y})">
    <circle r="8" fill="${building ? color : 'rgba(235,226,198,.22)'}" />
    ${building ? '<circle r="3" class="compact-slot-core" />' : ''}
  </g>`;
};

const focusedSlotMarkup = (state, slot, selection, reachable, selectedArmyId) => {
  const building = slot.building;
  const selected = selection?.kind === 'slot' && selection.id === slot.id;
  const selectedOwner = state.armies[selectedArmyId]?.ownerId;
  const hostile = reachable.has(slot.id) && ((building && building.ownerId !== selectedOwner) || armiesAt(state, slot.id).some((army) => army.ownerId !== selectedOwner));
  const classes = ['slot-node', building ? 'built' : 'empty', selected ? 'selected' : '', reachable.has(slot.id) ? (hostile ? 'hostile-target' : 'reachable') : ''].filter(Boolean).join(' ');
  const color = building ? ownerColor(state, building.ownerId) : '#c7b985';
  const garrison = building ? unitCount(building.garrison) : 0;
  const supplyMax = building ? BUILDING_TYPES[building.type].supplyStorage : 0;
  const supplyPercent = building && supplyMax ? Math.max(0, Math.min(100, Math.round(building.supply / supplyMax * 100))) : 0;
  const art = building ? buildingIllustration(building.type, color) : emptySlotIllustration(slot.terrain);
  return `<g class="${classes}" data-slot-id="${slot.id}" transform="translate(${slot.x} ${slot.y})">
    <circle class="slot-reach-ring" r="48" />
    <path class="slot-card" d="M-34 -34 Q-34 -42 -26 -42 H26 Q34 -42 34 -34 V31 Q34 39 26 39 H-26 Q-34 39 -34 31 Z" stroke="${color}" />
    <circle class="slot-number-disc" cx="-30" cy="-36" r="10"/><text class="slot-index" x="-30" y="-36">${slot.index + 1}</text>
    ${art}
    <rect class="slot-caption" x="-37" y="31" width="74" height="23" rx="10"/>
    <text class="building-label" y="43">${escapeHtml(buildingLabel(building?.type))}</text>
    ${building ? `<g class="garrison-chip" transform="translate(26 -30)"><circle r="12"/><path d="M-4 -1 a4 4 0 1 1 8 0 a4 4 0 1 1 -8 0 M-7 8 q7 -7 14 0"/><text x="16" y="2">${garrison}</text></g>
      <g class="slot-supply" transform="translate(-25 59)"><rect width="50" height="5" rx="3"/><rect width="${50 * supplyPercent / 100}" height="5" rx="3"/></g>` : ''}
  </g>`;
};

const armyMarkup = (state, army, slot, index, selectedArmyId, focused) => {
  const color = ownerColor(state, army.ownerId, '#777');
  const count = unitCount(army.units);
  if (!focused) {
    return `<g class="army-token compact ${army.id === selectedArmyId ? 'army-selected' : ''}" data-army-id="${army.id}" transform="translate(${slot.x + 19 + index * 11} ${slot.y - 18})">
      <path class="army-shield" d="M0 -15 L13 -9 L11 7 Q0 17 -11 7 L-13 -9 Z" fill="${color}"/><path class="army-spears" d="M-6 8 L7 -12 M2 10 L-8 -11"/><text class="army-count" y="23">${count}</text>
    </g>`;
  }
  const side = slot.index === 1 ? -1 : 1;
  const offsetX = side * (48 + (index % 2) * 18);
  const offsetY = (slot.index === 0 ? 24 : 0) + Math.floor(index / 2) * 29;
  return `<g class="army-token ${army.id === selectedArmyId ? 'army-selected' : ''}" data-army-id="${army.id}" transform="translate(${slot.x + offsetX} ${slot.y + offsetY})">
    <path class="army-shield" d="M0 -19 L15 -12 L13 8 Q0 21 -13 8 L-15 -12 Z" fill="${color}"/>
    <path class="army-spears" d="M-8 10 L9 -18 M3 13 L-9 -16"/>
    <text class="army-emblem" y="-4">${emblemGlyph(state.kingdoms[army.ownerId]?.emblem)}</text>
    <rect class="army-banner" x="-18" y="15" width="36" height="18" rx="8"/><text class="army-count" y="24">${count}</text>
  </g>`;
};

const regionSummaryMarkup = (state, region, relation) => {
  const controller = regionController(state, region);
  const kingdom = state.kingdoms[controller];
  const built = region.slots.filter((slot) => slot.building).length;
  const status = regionStatus(state, region);
  return `<g class="region-summary ${relation} ${status}" transform="translate(${region.x} ${region.y})">
    <path class="summary-shield" d="M0 -24 L20 -15 L17 9 Q0 25 -17 9 L-20 -15 Z" fill="${kingdom?.color ?? '#766f60'}"/>
    <text class="summary-emblem" y="-3">${emblemGlyph(kingdom?.emblem)}</text>
    <g class="summary-pips" transform="translate(-16 31)">${[0,1,2].map((index) => `<circle cx="${index * 16}" r="4" class="${index < built ? 'filled' : ''}"/>`).join('')}</g>
  </g>`;
};

const regionMarkup = (state, region, selection, reachable, selectedArmyId, focusedRegionId, neighbors) => {
  const status = regionStatus(state, region);
  const selected = selection?.kind === 'region' && selection.id === region.id;
  const relation = region.id === focusedRegionId ? 'focus-region' : neighbors.has(region.id) ? 'context-region' : 'distant-region';
  const focus = relation === 'focus-region';
  const owner = regionOwnerColor(state, region);
  const slots = focus
    ? region.slots.map((slot) => focusedSlotMarkup(state, slot, selection, reachable, selectedArmyId)).join('')
    : region.slots.map((slot) => compactSlotMarkup(state, slot)).join('');
  const armies = region.slots.flatMap((slot) => armiesAt(state, slot.id).map((army, index) => armyMarkup(state, army, slot, index, selectedArmyId, focus))).join('');
  return `<g class="region-group ${relation}" data-region-id="${region.id}">
    <path class="region-shadow" d="${regionPath(region)}"/>
    <path class="region-boundary ${status} ${selected ? 'selected' : ''}" d="${regionPath(region)}" fill="url(#region-${region.terrain})" stroke="${owner}" data-region-hit="${region.id}"/>
    <path class="region-grain" d="${regionPath(region)}" fill="url(#paper-grain)"/>
    ${terrainDecoration(region)}
    ${regionSummaryMarkup(state, region, relation)}
    <g class="region-title" transform="translate(${region.x} ${region.y - 137})">
      <rect x="-72" y="-16" width="144" height="32" rx="15"/>
      <text y="-1">${escapeHtml(region.name)}</text>
      <text class="region-meta" y="13">${escapeHtml(TERRAIN_TYPES[region.terrain].name)} · ${status}</text>
    </g>
    ${slots}${armies}
  </g>`;
};

export const mapMarkup = (state, selection, reachableSlotIds, camera, width, height, focusedRegionId) => {
  const selectedArmyId = selection?.kind === 'army' ? selection.id : selection?.armyId;
  const neighbors = neighboringRegions(state, focusedRegionId);
  const overview = camera.scale < 0.72;
  const edges = state.map.edges.map((edge) => edgeMarkup(state, edge, focusedRegionId, neighbors)).join('');
  const regions = state.map.regions.map((region) => regionMarkup(state, region, selection, reachableSlotIds, selectedArmyId, focusedRegionId, neighbors)).join('');
  return `<svg class="world-svg ${overview ? 'world-overview' : 'world-focus'}" data-world-svg viewBox="0 0 ${width} ${height}" role="application" aria-label="Campaign map">
    ${mapDefs()}
    <rect class="map-backdrop" width="100%" height="100%"/>
    <rect class="map-light" width="100%" height="100%"/>
    <g data-camera transform="translate(${camera.x} ${camera.y}) scale(${camera.scale})">
      <g data-map-edges>${edges}</g><g data-map-regions>${regions}</g><g data-animation-layer></g>
    </g>
    <rect class="map-vignette" width="100%" height="100%"/>
  </svg>`;
};
