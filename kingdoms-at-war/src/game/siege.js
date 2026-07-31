import { BUILDING_TYPES } from '../config/buildings.js';
import { UNIT_TYPES, unitCount } from '../config/units.js';
import { edgeBetween } from '../core/graph.js';
import { Random } from '../core/random.js';
import { clamp } from '../core/math.js';
import { makeId } from '../core/ids.js';
import { getArmy, getSlot, getRegionBySlot, regionalSupport } from './selectors.js';
import { captureBuilding } from './capture.js';
import { logEvent, timelineEvent } from './events.js';

export const validateBeginSiege = (state, { ownerId, armyId, targetSlotId }) => {
  const army = getArmy(state, armyId);
  const target = getSlot(state, targetSlotId);
  if (!army || army.ownerId !== ownerId) return 'Select one of your armies.';
  if (!target?.building || target.building.ownerId === ownerId) return 'Select a hostile building.';
  if (!['fortress', 'castle', 'city'].includes(target.building.type)) return 'This location is better taken by direct assault.';
  if (!edgeBetween(state.map, army.slotId, targetSlotId)) return 'A siege army must occupy an adjacent slot.';
  if (state.sieges.some((siege) => siege.armyId === armyId || siege.targetSlotId === targetSlotId)) return 'This army or target is already engaged in a siege.';
  if (army.movement < 1) return 'The army has no movement remaining.';
  return null;
};

export const beginSiege = (state, action) => {
  const error = validateBeginSiege(state, action);
  if (error) throw new Error(error);
  const army = getArmy(state, action.armyId);
  const target = getSlot(state, action.targetSlotId);
  const region = getRegionBySlot(state, action.targetSlotId);
  const siege = {
    id: makeId('siege'), armyId: army.id, ownerId: army.ownerId,
    targetSlotId: action.targetSlotId, regionId: region.id,
    defenderOwnerId: target.building.ownerId, turns: 0
  };
  state.sieges.push(siege);
  army.movement = 0;
  logEvent(state, 'siege', `${state.kingdoms[army.ownerId].name} began a siege in ${region.name}.`, army.ownerId);
  return [timelineEvent('siegeStarted', { ...siege, buildingType: target.building.type }, 'slow')];
};

export const validateAdvanceSiege = (state, { ownerId, siegeId }) => {
  const siege = state.sieges.find((candidate) => candidate.id === siegeId);
  if (!siege || siege.ownerId !== ownerId) return 'Invalid siege.';
  const army = getArmy(state, siege.armyId);
  if (!army || unitCount(army.units) === 0) return 'The siege army no longer exists.';
  const target = getSlot(state, siege.targetSlotId);
  if (!target?.building || target.building.ownerId === ownerId) return 'The siege target is no longer hostile.';
  if (army.movement < 1) return 'The army cannot press the siege this turn.';
  return null;
};

export const advanceSiege = (state, action) => {
  const error = validateAdvanceSiege(state, action);
  if (error) throw new Error(error);
  const siege = state.sieges.find((candidate) => candidate.id === action.siegeId);
  const army = getArmy(state, siege.armyId);
  const slot = getSlot(state, siege.targetSlotId);
  const building = slot.building;
  const region = getRegionBySlot(state, siege.targetSlotId);
  const support = regionalSupport(state, region, building.ownerId);
  const rng = new Random(state.rngSeed);
  const timeline = [];
  const siegePower = Object.entries(army.units).reduce((sum, [unitId, count]) => sum + UNIT_TYPES[unitId].siegePower * count, 0);
  army.movement = 0;
  siege.turns += 1;
  for (let tick = 1; tick <= 6; tick += 1) {
    const wallDamage = Math.max(1, Math.round((siegePower / 13) * rng.float(0.75, 1.15)));
    const citySupplySupport = (support.supply ?? 0) * 8;
    const supplyLoss = Math.max(3, Math.round(9 + unitCount(building.garrison) * 1.5 - citySupplySupport));
    building.fortification = Math.max(0, building.fortification - wallDamage);
    building.supply = Math.max(0, building.supply - supplyLoss);
    building.morale = clamp(building.morale - 3 - (building.supply === 0 ? 3 : 0) + (support.morale ?? 0) * 2, 0, 100);
    army.supply = clamp(army.supply - 2, 0, 100);
    timeline.push(timelineEvent('siegeTick', {
      siegeId: siege.id, tick, totalTicks: 6, targetSlotId: siege.targetSlotId,
      fortification: building.fortification, supply: building.supply, morale: Math.round(building.morale),
      wallDamage, supplyLoss, siegePower: Math.round(siegePower)
    }, 'slow'));
  }
  state.rngSeed = rng.snapshot();
  if (building.morale <= 9 || (building.supply <= 0 && building.fortification <= 0)) {
    for (const key of Object.keys(building.garrison)) building.garrison[key] = 0;
    army.slotId = siege.targetSlotId;
    timeline.push(timelineEvent('siegeSurrender', { siegeId: siege.id, targetSlotId: siege.targetSlotId }, 'slow'));
    timeline.push(...captureBuilding(state, { army, slotId: siege.targetSlotId }));
    state.sieges = state.sieges.filter((candidate) => candidate.id !== siege.id);
  } else {
    logEvent(state, 'siege', `${region.name} siege: ${building.fortification} fortification and ${building.supply} supply remain.`, army.ownerId);
  }
  return timeline;
};

export const abandonSiege = (state, { ownerId, siegeId }) => {
  const siege = state.sieges.find((candidate) => candidate.id === siegeId);
  if (!siege || siege.ownerId !== ownerId) throw new Error('Invalid siege.');
  state.sieges = state.sieges.filter((candidate) => candidate.id !== siegeId);
  return [timelineEvent('siegeAbandoned', { siegeId }, 'normal')];
};
