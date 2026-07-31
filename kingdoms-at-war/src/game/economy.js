import { BUILDING_TYPES } from '../config/buildings.js';
import { UNIT_TYPES, unitCount } from '../config/units.js';
import { TERRAIN_TYPES } from '../config/terrain.js';
import { RESOURCE_FLOOR } from '../config/balance.js';
import { clamp, round } from '../core/math.js';
import { kingdomBuildings, kingdomArmies, controlledRegions, regionPopulationCap, regionalSupport, compositionBonus, domainBonus } from './selectors.js';
import { logEvent, timelineEvent } from './events.js';

const addDelta = (target, source, multiplier = 1) => {
  for (const key of ['gold', 'provisions', 'materials']) target[key] += (source[key] ?? 0) * multiplier;
};

const formationUpkeep = (units, multiplier = 1) => Object.entries(units).reduce((cost, [unitId, count]) => {
  cost.gold += UNIT_TYPES[unitId].upkeep.gold * count * multiplier;
  cost.provisions += UNIT_TYPES[unitId].upkeep.provisions * count * multiplier;
  return cost;
}, { gold: 0, provisions: 0, materials: 0 });

export const calculateTurnEconomy = (state, ownerId) => {
  const delta = { gold: 0, provisions: 0, materials: 0 };
  let fervor = 0;
  for (const { region, building } of kingdomBuildings(state, ownerId)) {
    const type = BUILDING_TYPES[building.type];
    const terrain = TERRAIN_TYPES[region.terrain];
    const support = regionalSupport(state, region, ownerId);
    const multiplier = 1 + support.income;
    const income = { ...type.income };
    if (income.provisions > 0) income.provisions *= terrain.provisions ?? 1;
    if (income.materials > 0) income.materials *= terrain.materials ?? 1;
    addDelta(delta, income, multiplier);
    fervor += type.fervorIncome ?? 0;
  }
  for (const army of kingdomArmies(state, ownerId)) addDelta(delta, formationUpkeep(army.units), -1);
  for (const { region, building } of kingdomBuildings(state, ownerId)) {
    const support = regionalSupport(state, region, ownerId);
    addDelta(delta, formationUpkeep(building.garrison, 1.25 * (1 + support.upkeep)), -1);
  }
  const domain = domainBonus(state, ownerId);
  delta.materials *= 1 + (domain.materials ?? 0);
  fervor += domain.fervor ?? 0;
  return { delta: Object.fromEntries(Object.entries(delta).map(([key, value]) => [key, Math.round(value)])), fervor: round(fervor, 1) };
};

const applyDesertion = (state, ownerId, timeline) => {
  const kingdom = state.kingdoms[ownerId];
  const crisis = kingdom.debtTurns * 5 + kingdom.famineTurns * 8;
  for (const army of kingdomArmies(state, ownerId)) {
    const region = state.map.regions.find((candidate) => candidate.slots.some((slot) => slot.id === army.slotId));
    const support = region ? regionalSupport(state, region, ownerId) : {};
    const pressureGain = Math.max(0, crisis + Math.max(0, 45 - army.supply) * 0.15 - kingdom.fervor * 0.04 + (support.desertion ?? 0) * 10);
    army.desertion = clamp(army.desertion + pressureGain, 0, 100);
    if (army.desertion >= 75 && unitCount(army.units) > 0) {
      const candidate = Object.entries(army.units).filter(([, count]) => count > 0 && count !== army.units.ships).sort((a, b) => b[1] - a[1])[0];
      if (candidate) {
        army.units[candidate[0]] -= 1;
        army.desertion = Math.max(52, army.desertion - 18);
        timeline.push(timelineEvent('desertion', { armyId: army.id, unitType: candidate[0], message: `${army.name} lost a ${UNIT_TYPES[candidate[0]].name} formation to desertion.` }, 'slow'));
        logEvent(state, 'warning', `${army.name}: desertion claimed one ${UNIT_TYPES[candidate[0]].name} formation.`, ownerId);
      }
    }
  }
};

export const processTurnStart = (state, ownerId) => {
  const timeline = [];
  const kingdom = state.kingdoms[ownerId];
  if (!kingdom || kingdom.eliminated) return timeline;
  const economy = calculateTurnEconomy(state, ownerId);
  for (const key of ['gold', 'provisions', 'materials']) kingdom.resources[key] = Math.max(RESOURCE_FLOOR, kingdom.resources[key] + economy.delta[key]);
  kingdom.fervor = clamp(kingdom.fervor + economy.fervor, 0, 100);
  kingdom.debtTurns = kingdom.resources.gold < 0 ? kingdom.debtTurns + 1 : 0;
  kingdom.famineTurns = kingdom.resources.provisions < 0 ? kingdom.famineTurns + 1 : 0;

  for (const region of controlledRegions(state, ownerId)) {
    const terrain = TERRAIN_TYPES[region.terrain];
    const support = regionalSupport(state, region, ownerId);
    const buildingGrowth = region.slots.reduce((sum, slot) => sum + (slot.building?.ownerId === ownerId ? BUILDING_TYPES[slot.building.type].populationGrowth : 0), 0);
    const growth = Math.max(0, Math.round(buildingGrowth * terrain.growth * (1 + support.growth) * (kingdom.famineTurns ? 0.25 : 1)));
    region.population = clamp(region.population + growth, 0, regionPopulationCap(region));
  }

  for (const army of kingdomArmies(state, ownerId)) {
    const unitMoves = Object.entries(army.units).filter(([, count]) => count > 0).map(([id]) => UNIT_TYPES[id].movement);
    army.maxMovement = unitMoves.length ? Math.min(...unitMoves) : 0;
    army.movement = army.maxMovement;
    const slot = state.map.regions.flatMap((region) => region.slots).find((candidate) => candidate.id === army.slotId);
    const friendlyBuilding = slot?.building?.ownerId === ownerId ? slot.building : null;
    const localRegion = state.map.regions.find((region) => region.id === slot?.regionId);
    const support = localRegion ? regionalSupport(state, localRegion, ownerId) : {};
    if (friendlyBuilding) army.supply = clamp(army.supply + 22 + (support.supply ?? 0) * 30, 0, 100);
    else army.supply = clamp(army.supply - 5, 0, 100);
    army.morale = clamp(army.morale + (friendlyBuilding ? 4 : 1) + kingdom.fervor * 0.015 + (support.morale ?? 0) * 8 - kingdom.famineTurns * 2, 0, 100);
  }
  for (const { region, building } of kingdomBuildings(state, ownerId)) {
    const support = regionalSupport(state, region, ownerId);
    building.supply = clamp(building.supply + 20 + (support.supply ?? 0) * 30, 0, BUILDING_TYPES[building.type].supplyStorage);
    building.morale = clamp(building.morale + 3 + kingdom.fervor * 0.012 + (support.morale ?? 0) * 8, 0, 100);
  }
  applyDesertion(state, ownerId, timeline);
  timeline.unshift(timelineEvent('income', { ownerId, delta: economy.delta, fervor: economy.fervor }, 'normal'));
  logEvent(state, 'income', `${kingdom.name} collected ${economy.delta.gold} gold, ${economy.delta.provisions} provisions, and ${economy.delta.materials} materials.`, ownerId);
  return timeline;
};
