import { BUILDING_TYPES, BUILDING_LIMITS } from '../config/buildings.js';
import { createEmptyUnits } from '../config/units.js';
import { makeId } from '../core/ids.js';
import { getRegion, regionArmies, buildingsInRegion, regionController } from './selectors.js';
import { logEvent, timelineEvent } from './events.js';

const TERRAIN_RULES = Object.freeze({
  city: { blocked: ['mountains', 'wetlands', 'arid'] },
  castle: { blocked: ['wetlands'] },
  fortress: { blocked: [] }, village: { blocked: [] }, temple: { blocked: [] }
});
const canAfford = (resources, cost) => Object.entries(cost).every(([key, value]) => resources[key] >= value);
const spend = (resources, cost) => { for (const [key, value] of Object.entries(cost)) resources[key] -= value; };

const validateRegionAccess = (state, ownerId, region) => {
  const buildings = buildingsInRegion(region);
  if (!buildings.length) return 'A region needs an established building before further construction.';
  if (buildings.some((building) => building.ownerId !== ownerId)) return 'You must control every existing building in the region.';
  if (regionArmies(state, region.id).length > 0) return 'Construction requires every mobile army to leave the region.';
  if (state.sieges.some((siege) => siege.regionId === region.id)) return 'Construction is blocked during a siege.';
  if (regionController(state, region) !== ownerId) return 'The region is not securely controlled.';
  return null;
};

export const validateBuild = (state, { ownerId, regionId, slotId, buildingType }) => {
  const kingdom = state.kingdoms[ownerId];
  const region = getRegion(state, regionId);
  const type = BUILDING_TYPES[buildingType];
  if (!kingdom || !region || !type) return 'Invalid construction order.';
  const accessError = validateRegionAccess(state, ownerId, region);
  if (accessError) return accessError;
  const slot = region.slots.find((candidate) => candidate.id === slotId);
  if (!slot || slot.building) return 'Select an empty building slot.';
  if (TERRAIN_RULES[buildingType]?.blocked.includes(region.terrain)) return `${type.name} cannot be built in ${region.terrain}.`;
  const categoryCount = buildingsInRegion(region).filter((building) => BUILDING_TYPES[building.type].category === type.category).length;
  if (categoryCount >= BUILDING_LIMITS[type.category]) return `This region has reached its ${type.category} building limit.`;
  if (region.population < type.minPopulation) return `${type.name} requires ${type.minPopulation} local population.`;
  if ((buildingType === 'city' || buildingType === 'castle') && buildingsInRegion(region).length < 2) return `A direct ${type.name} requires two established buildings in the region.`;
  if (!canAfford(kingdom.resources, type.cost)) return 'Insufficient resources.';
  return null;
};

export const build = (state, action) => {
  const error = validateBuild(state, action);
  if (error) throw new Error(error);
  const { ownerId, regionId, slotId, buildingType } = action;
  const kingdom = state.kingdoms[ownerId];
  const region = getRegion(state, regionId);
  const slot = region.slots.find((candidate) => candidate.id === slotId);
  const type = BUILDING_TYPES[buildingType];
  spend(kingdom.resources, type.cost);
  slot.building = {
    id: makeId(buildingType), type: buildingType, ownerId, garrison: createEmptyUnits(),
    morale: 64, supply: Math.round(type.supplyStorage * 0.5), fortification: type.fortification,
    damaged: 0, capital: false
  };
  logEvent(state, 'build', `${kingdom.name} founded a ${type.name} in ${region.name}.`, ownerId);
  return [timelineEvent('buildingBuilt', { ownerId, regionId, slotId, buildingType, message: `${type.name} completed instantly.` }, 'slow')];
};

export const validateUpgrade = (state, { ownerId, regionId, slotId }) => {
  const region = getRegion(state, regionId);
  const accessError = region ? validateRegionAccess(state, ownerId, region) : 'Invalid region.';
  if (accessError) return accessError;
  const slot = region.slots.find((candidate) => candidate.id === slotId);
  if (!slot?.building || slot.building.ownerId !== ownerId) return 'Select one of your buildings.';
  const nextType = slot.building.type === 'village' ? 'city' : slot.building.type === 'fortress' ? 'castle' : null;
  if (!nextType) return 'This building has no upgrade path.';
  const type = BUILDING_TYPES[nextType];
  if (TERRAIN_RULES[nextType]?.blocked.includes(region.terrain)) return `${type.name} cannot be built in ${region.terrain}.`;
  if (region.population < type.minPopulation) return `${type.name} requires ${type.minPopulation} local population.`;
  if (!canAfford(state.kingdoms[ownerId].resources, type.upgradeCost)) return 'Insufficient resources.';
  return null;
};

export const upgrade = (state, action) => {
  const error = validateUpgrade(state, action);
  if (error) throw new Error(error);
  const region = getRegion(state, action.regionId);
  const slot = region.slots.find((candidate) => candidate.id === action.slotId);
  const previousType = slot.building.type;
  const nextType = previousType === 'village' ? 'city' : 'castle';
  const config = BUILDING_TYPES[nextType];
  spend(state.kingdoms[action.ownerId].resources, config.upgradeCost);
  slot.building.type = nextType;
  slot.building.fortification = config.fortification;
  slot.building.supply = Math.min(config.supplyStorage, slot.building.supply + 120);
  logEvent(state, 'build', `${region.name}: ${BUILDING_TYPES[previousType].name} upgraded to ${config.name}.`, action.ownerId);
  return [timelineEvent('buildingUpgraded', { ownerId: action.ownerId, regionId: region.id, slotId: slot.id, previousType, buildingType: nextType }, 'slow')];
};

export const repairCost = (building) => {
  const config = BUILDING_TYPES[building.type];
  const missingFortification = Math.max(0, config.fortification - building.fortification);
  return {
    gold: Math.ceil(missingFortification * 2.4 + (building.damaged ?? 0) * 1.8),
    provisions: 0,
    materials: Math.ceil(missingFortification * 3.2 + (building.damaged ?? 0) * 2.2)
  };
};

export const validateRepair = (state, { ownerId, regionId, slotId }) => {
  const region = getRegion(state, regionId);
  const slot = region?.slots.find((candidate) => candidate.id === slotId);
  const building = slot?.building;
  if (!building || building.ownerId !== ownerId) return 'Select one of your damaged buildings.';
  const config = BUILDING_TYPES[building.type];
  if ((building.damaged ?? 0) <= 0 && building.fortification >= config.fortification) return 'This building is already fully repaired.';
  if (regionArmies(state, region.id).some((army) => army.ownerId !== ownerId)) return 'Repairs are blocked by hostile occupants.';
  if (state.sieges.some((siege) => siege.targetSlotId === slotId)) return 'Repairs are impossible during a siege.';
  if (!canAfford(state.kingdoms[ownerId].resources, repairCost(building))) return 'Insufficient resources for repairs.';
  return null;
};

export const repair = (state, action) => {
  const error = validateRepair(state, action);
  if (error) throw new Error(error);
  const region = getRegion(state, action.regionId);
  const slot = region.slots.find((candidate) => candidate.id === action.slotId);
  const cost = repairCost(slot.building);
  spend(state.kingdoms[action.ownerId].resources, cost);
  slot.building.fortification = BUILDING_TYPES[slot.building.type].fortification;
  slot.building.damaged = 0;
  logEvent(state, 'repair', `${region.name}: ${BUILDING_TYPES[slot.building.type].name} fully repaired.`, action.ownerId);
  return [timelineEvent('buildingRepaired', { ownerId: action.ownerId, regionId: region.id, slotId: slot.id, buildingType: slot.building.type }, 'slow')];
};
