import { BUILDING_TYPES } from '../config/buildings.js';
import { unitCount } from '../config/units.js';
import { TERRAIN_TYPES } from '../config/terrain.js';
import {
  getArmy, getSlot, getRegionBySlot, regionStatus, regionController,
  kingdomArmies
} from '../game/selectors.js';
import { neighborsOf } from '../core/graph.js';
import { formatNumber, formatPercent, titleCase } from './format.js';
import { meter, ownerName, formationRows, summaryShell, regionEffects } from './panel-utils.js';

export const armyPanel = (state, selection) => {
  const army = getArmy(state, selection.id);
  if (!army) return { summary: summaryShell('Army unavailable', 'The formation no longer exists.'), content: '' };
  const slot = getSlot(state, army.slotId);
  const region = getRegionBySlot(state, army.slotId);
  const colocated = kingdomArmies(state, army.ownerId).filter((candidate) => candidate.slotId === army.slotId && candidate.id !== army.id);
  const siege = state.sieges.find((candidate) => candidate.armyId === army.id);
  const adjacent = neighborsOf(state.map, army.slotId).length;
  const content = `<div class="panel-section"><div class="stat-grid">
    <div class="stat-card"><small>Morale</small><b>${formatPercent(army.morale)}</b>${meter(army.morale)}</div>
    <div class="stat-card"><small>Supply</small><b>${formatPercent(army.supply)}</b>${meter(army.supply)}</div>
    <div class="stat-card"><small>Fervor</small><b>${formatPercent(state.kingdoms[army.ownerId].fervor)}</b>${meter(state.kingdoms[army.ownerId].fervor)}</div>
    <div class="stat-card"><small>Desertion</small><b>${formatPercent(army.desertion)}</b>${meter(100 - army.desertion)}</div>
    <div class="stat-card"><small>Movement</small><b>${army.movement} / ${army.maxMovement}</b></div>
    <div class="stat-card"><small>Adjacent slots</small><b>${adjacent}</b></div>
  </div></div>
  <div class="panel-section"><div class="panel-title">Formations</div><div class="unit-list">${formationRows(army.units)}</div></div>
  <div class="panel-section"><div class="panel-title">Orders</div><div class="action-grid">
    <button class="action-button primary" data-command="show-moves"><strong>Show movement</strong><small>Tap or drag to one adjacent slot</small></button>
    ${unitCount(army.units) > 1 ? '<button class="action-button" data-command="open-split"><strong>Split army</strong><small>Create a detachment here</small></button>' : ''}
    ${slot.building?.ownerId === army.ownerId ? '<button class="action-button" data-command="open-garrison"><strong>Garrison</strong><small>Station formations in this building</small></button>' : ''}
    ${colocated.length ? `<button class="action-button" data-command="merge-armies" data-army-ids="${[army.id, ...colocated.map((item) => item.id)].join(',')}"><strong>Merge armies</strong><small>Combine all friendly armies here</small></button>` : ''}
    ${siege ? `<button class="action-button primary" data-command="advance-siege" data-siege-id="${siege.id}"><strong>Press siege</strong><small>Resolve six visible siege ticks</small></button><button class="action-button danger" data-command="abandon-siege" data-siege-id="${siege.id}"><strong>Abandon siege</strong><small>Free this army to move next turn</small></button>` : ''}
  </div></div>`;
  return { summary: summaryShell(army.name, `${region.name} · Slot ${slot.index + 1} · ${unitCount(army.units)} formations`, '<button class="header-button" data-command="center-army">◎</button>'), content };
};

export const regionPanel = (state, selection) => {
  const region = state.map.regions.find((candidate) => candidate.id === selection.id);
  const controllerId = regionController(state, region);
  const slotCards = region.slots.map((slot) => `<button class="action-button" data-command="select-slot" data-slot-id="${slot.id}"><strong>Slot ${slot.index + 1}: ${slot.building ? BUILDING_TYPES[slot.building.type].name : 'Open'}</strong><small>${slot.building ? ownerName(state, slot.building.ownerId) : 'Cannot be captured'}</small></button>`).join('');
  const content = `<div class="panel-section"><div class="stat-grid"><div class="stat-card"><small>Terrain</small><b>${TERRAIN_TYPES[region.terrain].name}</b></div><div class="stat-card"><small>Status</small><b>${titleCase(regionStatus(state, region))}</b></div><div class="stat-card"><small>Population</small><b>${formatNumber(region.population)}</b></div></div></div><div class="panel-section"><div class="panel-title">Three physical slots</div><div class="action-grid">${slotCards}</div></div>${regionEffects(state, region, controllerId ?? 'kingdom-player')}`;
  return { summary: summaryShell(region.name, `${TERRAIN_TYPES[region.terrain].name} · ${titleCase(regionStatus(state, region))}`), content };
};
