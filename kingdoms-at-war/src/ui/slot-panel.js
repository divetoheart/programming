import { BUILDING_TYPES } from '../config/buildings.js';
import { unitCount } from '../config/units.js';
import { TERRAIN_TYPES } from '../config/terrain.js';
import {
  getArmy, getSlot, getRegionBySlot, regionStatus, regionController, armiesAt
} from '../game/selectors.js';
import { edgeBetween } from '../core/graph.js';
import { formatNumber, formatPercent, titleCase, escapeHtml } from './format.js';
import { meter, ownerName, formationRows, summaryShell, regionEffects } from './panel-utils.js';

export const slotPanel = (state, selection, selectedArmyId) => {
  const slot = getSlot(state, selection.id);
  const region = getRegionBySlot(state, slot.id);
  const building = slot.building;
  const config = building ? BUILDING_TYPES[building.type] : null;
  const controllerId = regionController(state, region);
  const selectedArmy = getArmy(state, selectedArmyId);
  const adjacent = selectedArmy && edgeBetween(state.map, selectedArmy.slotId, slot.id);
  const status = regionStatus(state, region);
  const title = building ? config.name : 'Open Slot';
  const subtitle = `${region.name} · Slot ${slot.index + 1} · ${TERRAIN_TYPES[region.terrain].name}`;
  let content = `<div class="panel-section"><div class="stat-grid">
    <div class="stat-card"><small>Region</small><b>${titleCase(status)}</b></div>
    <div class="stat-card"><small>Controller</small><b>${escapeHtml(ownerName(state, controllerId))}</b></div>
    <div class="stat-card"><small>Population</small><b>${formatNumber(region.population)}</b></div>
  </div></div>`;

  if (building) {
    content += `<div class="panel-section"><div class="panel-title">${escapeHtml(ownerName(state, building.ownerId))}</div><div class="stat-grid">
      <div class="stat-card"><small>Fortification</small><b>${Math.round(building.fortification)} / ${config.fortification}</b>${meter(building.fortification / Math.max(1, config.fortification) * 100)}</div>
      <div class="stat-card"><small>Supply</small><b>${formatNumber(building.supply)}</b>${meter(building.supply / Math.max(1, config.supplyStorage) * 100)}</div>
      <div class="stat-card"><small>Morale</small><b>${formatPercent(building.morale)}</b>${meter(building.morale)}</div>
    </div></div><div class="panel-section"><div class="panel-title">Garrison · ${unitCount(building.garrison)} / ${config.garrisonCap}</div><div class="unit-list">${formationRows(building.garrison)}</div></div>`;
  } else {
    content += '<div class="support-item">Empty land cannot be captured. It becomes strategically useful through occupation, movement blocking, supply disruption, or construction.</div>';
  }

  const actions = [];
  if (building?.ownerId === 'kingdom-player') {
    if (['village', 'fortress'].includes(building.type)) actions.push(`<button class="action-button primary" data-command="upgrade" data-region-id="${region.id}" data-slot-id="${slot.id}"><strong>Upgrade</strong><small>${building.type === 'village' ? 'Village → City' : 'Fortress → Castle'}</small></button>`);
    if ((building.damaged ?? 0) > 0 || building.fortification < config.fortification) actions.push('<button class="action-button" data-command="repair"><strong>Repair</strong><small>Restore walls and infrastructure</small></button>');
    if (['fortress', 'castle'].includes(building.type)) actions.push('<button class="action-button" data-command="open-recruit"><strong>Recruit</strong><small>Purchase into this garrison</small></button>');
    if (unitCount(building.garrison) > 0) actions.push('<button class="action-button" data-command="open-mobilize"><strong>Mobilize</strong><small>Create a field army</small></button>');
    if (selectedArmy?.slotId === slot.id && selectedArmy.ownerId === 'kingdom-player' && unitCount(selectedArmy.units) > 0) actions.push('<button class="action-button" data-command="open-garrison"><strong>Garrison troops</strong><small>Transfer formations into this building</small></button>');
  }
  if (!building && controllerId === 'kingdom-player') actions.push('<button class="action-button primary" data-command="open-build"><strong>Construct</strong><small>Requires a clear, secure region</small></button>');
  if (selectedArmy?.ownerId === 'kingdom-player' && adjacent && slot.id !== selectedArmy.slotId) {
    const hostile = Boolean(building && building.ownerId !== 'kingdom-player') || armiesAt(state, slot.id).some((army) => army.ownerId !== 'kingdom-player');
    actions.push(`<button class="action-button ${hostile ? 'danger' : 'primary'}" data-command="move-selected"><strong>${hostile ? 'Advance / Assault' : 'Move here'}</strong><small>One connected slot · no outcome estimate</small></button>`);
    if (building && building.ownerId !== 'kingdom-player' && ['fortress', 'castle', 'city'].includes(building.type)) actions.push('<button class="action-button" data-command="begin-siege"><strong>Begin siege</strong><small>Reduce walls, supply, and morale visibly</small></button>');
  }
  if (actions.length) content += `<div class="panel-section"><div class="panel-title">Orders</div><div class="action-grid">${actions.join('')}</div></div>`;
  content += regionEffects(state, region, building?.ownerId ?? controllerId ?? 'kingdom-player');
  return { summary: summaryShell(title, subtitle, '<button class="header-button" data-command="center-slot">◎</button>'), content };
};
