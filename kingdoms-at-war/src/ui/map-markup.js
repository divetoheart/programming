import { TERRAIN_TYPES } from '../config/terrain.js';
import { unitCount } from '../config/units.js';
import { regionStatus, regionController, getSlot, armiesAt } from '../game/selectors.js';
import { emblemGlyph } from './setup-view.js';
import { escapeHtml } from './format.js';

const TERRAIN_COLORS = {
  plains: '#53634b', farmland: '#6b7046', forest: '#35513b', hills: '#5a5844',
  mountains: '#555754', wetlands: '#405f58', arid: '#76634a'
};
const BUILDING_GLYPHS = { village: 'V', city: 'C', fortress: 'F', castle: 'K', temple: 'T' };

const regionOwnerColor = (state, region) => state.kingdoms[regionController(state, region)]?.color ?? '#807866';
const polygonPoints = (region) => {
  const { x, y } = region;
  return `${x - 100},${y - 90} ${x},${y - 122} ${x + 100},${y - 90} ${x + 114},${y + 52} ${x},${y + 112} ${x - 114},${y + 52}`;
};

const slotMarkup = (state, slot, selection, reachable, selectedArmyId) => {
  const building = slot.building;
  const selected = selection?.kind === 'slot' && selection.id === slot.id;
  const selectedOwner = state.armies[selectedArmyId]?.ownerId;
  const hostile = reachable.has(slot.id) && ((building && building.ownerId !== selectedOwner) || armiesAt(state, slot.id).some((army) => army.ownerId !== selectedOwner));
  const classes = ['slot-node', building ? 'built' : 'empty', selected ? 'selected' : '', reachable.has(slot.id) ? (hostile ? 'hostile-target' : 'reachable') : ''].filter(Boolean).join(' ');
  const ownerColor = building ? state.kingdoms[building.ownerId]?.color ?? '#888' : '#8f8873';
  const garrison = building ? unitCount(building.garrison) : 0;
  return `<g class="${classes}" data-slot-id="${slot.id}" transform="translate(${slot.x} ${slot.y})"><circle class="slot-base" r="39" stroke="${ownerColor}" />${building ? `<text class="building-glyph" y="-2">${BUILDING_GLYPHS[building.type]}</text><text class="building-label" y="54">${escapeHtml(BUILDING_GLYPHS[building.type] === 'K' ? 'Castle' : building.type)}</text>` : '<text class="building-glyph" y="-2">·</text><text class="building-label" y="54">Open</text>'}<circle class="slot-index-bg" cx="-31" cy="-31" r="12"/><text class="slot-index" x="-31" y="-31">${slot.index + 1}</text>${building ? `<rect class="garrison-badge" x="16" y="-45" width="36" height="22" rx="9"/><text class="garrison-text" x="34" y="-34">${garrison}</text>` : ''}</g>`;
};

const armyMarkup = (state, army, slot, index, selectedArmyId) => {
  const color = state.kingdoms[army.ownerId]?.color ?? '#777';
  const offsetX = 42 + (index % 2) * 22;
  const offsetY = -40 + Math.floor(index / 2) * 30;
  return `<g class="army-token ${army.id === selectedArmyId ? 'army-selected' : ''}" data-army-id="${army.id}" transform="translate(${slot.x + offsetX} ${slot.y + offsetY})"><circle class="army-disc" r="23" fill="${color}"/><text class="building-glyph" font-size="19" y="-2">${emblemGlyph(state.kingdoms[army.ownerId]?.emblem)}</text><rect class="army-banner" x="-21" y="20" width="42" height="20" rx="8"/><text class="army-count" y="30">${unitCount(army.units)}</text></g>`;
};

export const mapMarkup = (state, selection, reachableSlotIds, camera, width, height) => {
  const selectedArmyId = selection?.kind === 'army' ? selection.id : selection?.armyId;
  const edges = state.map.edges.map((edge) => {
    const a = getSlot(state, edge.a);
    const b = getSlot(state, edge.b);
    return `<line class="map-edge ${edge.kind}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
  }).join('');
  const regions = state.map.regions.map((region) => {
    const status = regionStatus(state, region);
    const regionSelected = selection?.kind === 'region' && selection.id === region.id;
    const slots = region.slots.map((slot) => slotMarkup(state, slot, selection, reachableSlotIds, selectedArmyId)).join('');
    const armies = region.slots.flatMap((slot) => armiesAt(state, slot.id).map((army, index) => armyMarkup(state, army, slot, index, selectedArmyId))).join('');
    return `<g class="region-group" data-region-id="${region.id}"><polygon class="region-boundary ${status} ${regionSelected ? 'selected' : ''}" points="${polygonPoints(region)}" fill="${TERRAIN_COLORS[region.terrain]}" stroke="${regionOwnerColor(state, region)}" data-region-hit="${region.id}" /><text class="region-label" x="${region.x}" y="${region.y - 101}">${escapeHtml(region.name)}</text><text class="region-subtitle" x="${region.x}" y="${region.y - 80}">${escapeHtml(TERRAIN_TYPES[region.terrain].name)} · ${status}</text>${slots}${armies}</g>`;
  }).join('');
  return `<svg class="world-svg" data-world-svg viewBox="0 0 ${width} ${height}" role="application" aria-label="Campaign map"><defs><radialGradient id="vignette"><stop offset="55%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(0,0,0,.42)"/></radialGradient></defs><rect class="map-backdrop" width="100%" height="100%" /><g data-camera transform="translate(${camera.x} ${camera.y}) scale(${camera.scale})"><g data-map-edges>${edges}</g><g data-map-regions>${regions}</g><g data-animation-layer></g></g><rect class="map-vignette" width="100%" height="100%" fill="url(#vignette)" /></svg>`;
};
