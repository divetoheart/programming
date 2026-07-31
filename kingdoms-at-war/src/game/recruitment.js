import { BUILDING_TYPES } from '../config/buildings.js';
import { UNIT_TYPES, unitCount, createEmptyUnits } from '../config/units.js';
import { makeId } from '../core/ids.js';
import { getRegion, getSlot, kingdomTroopCap, kingdomTroopPopulation } from './selectors.js';
import { logEvent, timelineEvent } from './events.js';

const canAfford = (resources, cost, quantity) => Object.entries(cost).every(([key, value]) => resources[key] >= value * quantity);
const spend = (resources, cost, quantity) => { for (const [key, value] of Object.entries(cost)) resources[key] -= value * quantity; };

export const validateRecruit = (state, { ownerId, slotId, unitType, quantity = 1 }) => {
  const slot = getSlot(state, slotId);
  const region = slot ? getRegion(state, slot.regionId) : null;
  const building = slot?.building;
  const unit = UNIT_TYPES[unitType];
  if (!building || building.ownerId !== ownerId) return 'Recruitment requires one of your buildings.';
  if (!['fortress', 'castle'].includes(building.type)) return 'Units must be recruited at a Fortress or Castle.';
  if (!unit || quantity < 1 || !Number.isInteger(quantity)) return 'Invalid unit order.';
  if (unitType === 'ships' && !region.coastal) return 'Warships require a coastal military building.';
  if (unitType === 'siege' && building.type !== 'castle') return 'Siege trains require a Castle workshop.';
  if (unitCount(building.garrison) + quantity > BUILDING_TYPES[building.type].garrisonCap) return 'The building garrison is at capacity.';
  if (region.population < unit.population * quantity) return 'The region lacks available population.';
  if (kingdomTroopPopulation(state, ownerId) + unit.population * quantity > kingdomTroopCap(state, ownerId)) return 'Troop Cap exceeded.';
  if (!canAfford(state.kingdoms[ownerId].resources, unit.cost, quantity)) return 'Insufficient resources.';
  return null;
};

export const recruit = (state, action) => {
  const error = validateRecruit(state, action);
  if (error) throw new Error(error);
  const quantity = action.quantity ?? 1;
  const slot = getSlot(state, action.slotId);
  const region = getRegion(state, slot.regionId);
  const unit = UNIT_TYPES[action.unitType];
  spend(state.kingdoms[action.ownerId].resources, unit.cost, quantity);
  region.population -= unit.population * quantity;
  slot.building.garrison[action.unitType] += quantity;
  logEvent(state, 'recruit', `${state.kingdoms[action.ownerId].name} recruited ${quantity} ${unit.name} at ${region.name}.`, action.ownerId);
  return [timelineEvent('recruited', { ownerId: action.ownerId, slotId: action.slotId, unitType: action.unitType, quantity }, 'normal')];
};

export const validateMobilize = (state, { ownerId, slotId, units }) => {
  const slot = getSlot(state, slotId);
  if (!slot?.building || slot.building.ownerId !== ownerId) return 'Select one of your garrisons.';
  if (!Object.entries(units).some(([, count]) => count > 0)) return 'Choose units to mobilize.';
  for (const [unitId, count] of Object.entries(units)) if (count < 0 || count > slot.building.garrison[unitId]) return 'The garrison does not contain those units.';
  return null;
};

export const mobilize = (state, action) => {
  const error = validateMobilize(state, action);
  if (error) throw new Error(error);
  const armyId = makeId('army');
  const slot = getSlot(state, action.slotId);
  const units = createEmptyUnits();
  for (const [unitId, count] of Object.entries(action.units)) {
    units[unitId] = count;
    slot.building.garrison[unitId] -= count;
  }
  state.armies[armyId] = {
    id: armyId, ownerId: action.ownerId, name: action.name || `Army of ${getRegion(state, slot.regionId).name}`,
    slotId: action.slotId, units, morale: slot.building.morale, supply: Math.min(100, Math.round(slot.building.supply / 4)),
    desertion: 3, movement: 2, maxMovement: 2, entrenched: false
  };
  return [timelineEvent('armyFormed', { ownerId: action.ownerId, armyId, slotId: action.slotId }, 'normal')];
};

export const validateGarrison = (state, { ownerId, armyId, units }) => {
  const army = state.armies[armyId];
  const slot = army ? getSlot(state, army.slotId) : null;
  if (!army || army.ownerId !== ownerId || !slot?.building || slot.building.ownerId !== ownerId) return 'Army must stand on one of your buildings.';
  const quantity = Object.values(units).reduce((sum, count) => sum + count, 0);
  if (unitCount(slot.building.garrison) + quantity > BUILDING_TYPES[slot.building.type].garrisonCap) return 'The garrison cannot hold that many formations.';
  for (const [unitId, count] of Object.entries(units)) if (count < 0 || count > army.units[unitId]) return 'The army does not contain those units.';
  return null;
};

export const garrison = (state, action) => {
  const error = validateGarrison(state, action);
  if (error) throw new Error(error);
  const army = state.armies[action.armyId];
  const building = getSlot(state, army.slotId).building;
  for (const [unitId, count] of Object.entries(action.units)) { army.units[unitId] -= count; building.garrison[unitId] += count; }
  if (unitCount(army.units) === 0) delete state.armies[army.id];
  return [timelineEvent('garrisoned', { ownerId: action.ownerId, armyId: action.armyId, slotId: army.slotId }, 'normal')];
};
