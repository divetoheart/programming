import { BUILDING_TYPES, COMPOSITION_BONUSES, getCompositionKey } from '../config/buildings.js';
import { UNIT_TYPES, unitPopulation, unitCount } from '../config/units.js';
import { TERRAIN_TYPES } from '../config/terrain.js';
import { DOMAIN_BONUSES } from '../config/names.js';

export const getKingdom = (state, kingdomId) => state.kingdoms[kingdomId] ?? null;
export const getRegion = (state, regionId) => state.map.regions.find((region) => region.id === regionId) ?? null;
export const getSlot = (state, slotId) => {
  for (const region of state.map.regions) {
    const slot = region.slots.find((candidate) => candidate.id === slotId);
    if (slot) return slot;
  }
  return null;
};
export const getRegionBySlot = (state, slotId) => state.map.regions.find((region) => region.slots.some((slot) => slot.id === slotId)) ?? null;
export const getArmy = (state, armyId) => state.armies[armyId] ?? null;
export const armiesAt = (state, slotId) => Object.values(state.armies).filter((army) => army.slotId === slotId && unitCount(army.units) > 0);
export const friendlyArmiesAt = (state, slotId, ownerId) => armiesAt(state, slotId).filter((army) => army.ownerId === ownerId);
export const enemyArmiesAt = (state, slotId, ownerId) => armiesAt(state, slotId).filter((army) => army.ownerId !== ownerId);
export const regionArmies = (state, regionId) => {
  const region = getRegion(state, regionId);
  const slotIds = new Set(region?.slots.map((slot) => slot.id) ?? []);
  return Object.values(state.armies).filter((army) => slotIds.has(army.slotId));
};
export const buildingsInRegion = (region) => region.slots.map((slot) => slot.building).filter(Boolean);
export const ownedBuildingsInRegion = (region, ownerId) => buildingsInRegion(region).filter((building) => building.ownerId === ownerId);
export const buildingOwners = (region) => [...new Set(buildingsInRegion(region).map((building) => building.ownerId))];
export const regionController = (state, region) => {
  const counts = {};
  for (const building of buildingsInRegion(region)) counts[building.ownerId] = (counts[building.ownerId] ?? 0) + 1;
  const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!ordered.length || (ordered[1] && ordered[0][1] === ordered[1][1])) return null;
  return ordered[0][0];
};
export const regionStatus = (state, region, perspectiveId = null) => {
  const owners = buildingOwners(region);
  const armies = regionArmies(state, region.id);
  if (!owners.length) return 'unsettled';
  if (owners.length > 1) return 'contested';
  const owner = owners[0];
  if (armies.some((army) => army.ownerId !== owner)) return 'occupied';
  if (perspectiveId && owner !== perspectiveId) return 'hostile';
  return 'secure';
};
export const compositionBonus = (state, region, ownerId) => {
  if (region.slots.some((slot) => !slot.building || slot.building.ownerId !== ownerId)) return null;
  if (regionArmies(state, region.id).some((army) => army.ownerId !== ownerId)) return null;
  const key = getCompositionKey(region.slots.map((slot) => slot.building.type));
  return COMPOSITION_BONUSES[key] ? { key, ...COMPOSITION_BONUSES[key] } : { key, name: 'Developed Region', income: 0.08, growth: 0.08 };
};
export const regionalSupport = (state, region, ownerId) => {
  const support = { defense: 0, supply: 0, morale: 0, desertion: 0, garrison: 0, upkeep: 0, income: 0, growth: 0, troopCap: 0, provisions: 0, materials: 0, fervor: 0 };
  for (const building of ownedBuildingsInRegion(region, ownerId)) {
    for (const [key, value] of Object.entries(BUILDING_TYPES[building.type].regional ?? {})) support[key] = (support[key] ?? 0) + value;
  }
  const composition = compositionBonus(state, region, ownerId);
  if (composition) for (const [key, value] of Object.entries(composition)) if (typeof value === 'number') support[key] = (support[key] ?? 0) + value;
  return support;
};
export const controlledRegions = (state, ownerId) => state.map.regions.filter((region) => regionController(state, region) === ownerId);
export const kingdomBuildings = (state, ownerId) => state.map.regions.flatMap((region) => region.slots.map((slot) => ({ region, slot, building: slot.building })).filter((entry) => entry.building?.ownerId === ownerId));
export const kingdomArmies = (state, ownerId) => Object.values(state.armies).filter((army) => army.ownerId === ownerId);
export const kingdomTroopPopulation = (state, ownerId) => {
  const armyPop = kingdomArmies(state, ownerId).reduce((sum, army) => sum + unitPopulation(army.units), 0);
  const garrisonPop = kingdomBuildings(state, ownerId).reduce((sum, entry) => sum + unitPopulation(entry.building.garrison), 0);
  return armyPop + garrisonPop;
};
export const kingdomTroopCap = (state, ownerId) => {
  let cap = kingdomBuildings(state, ownerId).reduce((sum, entry) => sum + BUILDING_TYPES[entry.building.type].troopCap, 0);
  for (const region of state.map.regions) cap += compositionBonus(state, region, ownerId)?.troopCap ?? 0;
  return cap;
};
export const regionPopulationCap = (region) => {
  const terrain = TERRAIN_TYPES[region.terrain];
  return terrain.populationCap + buildingsInRegion(region).reduce((sum, building) => sum + BUILDING_TYPES[building.type].populationCap, 0);
};
export const kingdomPopulation = (state, ownerId) => controlledRegions(state, ownerId).reduce((sum, region) => sum + region.population, 0);
export const kingdomPopulationCap = (state, ownerId) => controlledRegions(state, ownerId).reduce((sum, region) => sum + regionPopulationCap(region), 0);
export const domainBonus = (state, ownerId) => DOMAIN_BONUSES[getKingdom(state, ownerId)?.faith.domain] ?? {};
export const transportCapacity = (army) => (army.units.ships ?? 0) * UNIT_TYPES.ships.transportCapacity;
export const transportedPopulation = (army) => Object.entries(army.units).filter(([id]) => id !== 'ships').reduce((sum, [id, count]) => sum + UNIT_TYPES[id].population * count, 0);
export const canUseSeaEdge = (army) => (army.units.ships ?? 0) > 0 && transportCapacity(army) >= transportedPopulation(army);
export const totalBuildingCount = (state) => state.map.regions.reduce((sum, region) => sum + buildingsInRegion(region).length, 0);
export const buildingShare = (state, ownerId) => {
  const total = totalBuildingCount(state);
  return total ? kingdomBuildings(state, ownerId).length / total : 0;
};
