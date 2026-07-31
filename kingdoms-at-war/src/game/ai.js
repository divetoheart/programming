import { BUILDING_TYPES } from '../config/buildings.js';
import { UNIT_TYPES, unitCount } from '../config/units.js';
import { MAX_AI_ACTIONS } from '../config/balance.js';
import { neighborsOf, edgeBetween } from '../core/graph.js';
import { Random } from '../core/random.js';
import {
  getSlot, getRegionBySlot, kingdomArmies, kingdomBuildings, enemyArmiesAt,
  friendlyArmiesAt, regionStatus, buildingsInRegion
} from './selectors.js';
import { validateMove } from './movement.js';
import { validateBeginSiege, validateAdvanceSiege } from './siege.js';
import { validateRecruit, validateMobilize } from './recruitment.js';
import { validateBuild, validateUpgrade } from './construction.js';

const buildingValue = (type) => ({ castle: 115, city: 108, temple: 92, fortress: 78, village: 58 }[type] ?? 0);
const personalityWeight = (personality, kind) => {
  const weights = {
    conqueror: { military: 1.35, civil: 0.75, temple: 0.8, aggression: 1.35 },
    steward: { military: 0.9, civil: 1.35, temple: 1, aggression: 0.82 },
    zealot: { military: 1, civil: 0.95, temple: 1.55, aggression: 1.02 },
    balanced: { military: 1, civil: 1, temple: 1, aggression: 1 }
  };
  return weights[personality]?.[kind] ?? 1;
};

const moveCandidates = (state, ownerId, rng) => {
  const kingdom = state.kingdoms[ownerId];
  const candidates = [];
  for (const army of kingdomArmies(state, ownerId)) {
    if (army.movement <= 0 || unitCount(army.units) === 0) continue;
    for (const targetSlotId of neighborsOf(state.map, army.slotId)) {
      const error = validateMove(state, { ownerId, armyId: army.id, targetSlotId });
      if (error) continue;
      const slot = getSlot(state, targetSlotId);
      const region = getRegionBySlot(state, targetSlotId);
      const hostileBuilding = slot.building && slot.building.ownerId !== ownerId;
      const hostileArmies = enemyArmiesAt(state, targetSlotId, ownerId);
      const edge = edgeBetween(state.map, army.slotId, targetSlotId);
      let score = rng.float(0, 8) - edge.cost * 4;
      if (hostileBuilding) score += buildingValue(slot.building.type) * personalityWeight(kingdom.personality, 'aggression');
      if (hostileArmies.length) score += 64 * personalityWeight(kingdom.personality, 'aggression');
      if (hostileBuilding?.ownerId === 'neutral') score += 28;
      if (!hostileBuilding && !hostileArmies.length) {
        const nearbyTargets = neighborsOf(state.map, targetSlotId).map((id) => getSlot(state, id)).filter((candidate) => candidate?.building && candidate.building.ownerId !== ownerId);
        score += nearbyTargets.length * 24;
      }
      if (region.terrain === 'mountains' && army.units.cavalry > 0) score -= 18;
      if (region.terrain === 'wetlands' && army.units.cavalry > 0) score -= 25;
      candidates.push({ action: { type: 'MOVE', ownerId, armyId: army.id, targetSlotId }, score });
    }
  }
  return candidates;
};

const siegeCandidates = (state, ownerId) => {
  const candidates = [];
  for (const army of kingdomArmies(state, ownerId)) {
    for (const targetSlotId of neighborsOf(state.map, army.slotId)) {
      const slot = getSlot(state, targetSlotId);
      if (!slot?.building || slot.building.ownerId === ownerId) continue;
      const error = validateBeginSiege(state, { ownerId, armyId: army.id, targetSlotId });
      if (error) continue;
      const fort = slot.building.fortification;
      const siegeUnits = army.units.siege ?? 0;
      const score = fort > 35 ? 125 + siegeUnits * 25 + buildingValue(slot.building.type) : 35;
      candidates.push({ action: { type: 'BEGIN_SIEGE', ownerId, armyId: army.id, targetSlotId }, score });
    }
  }
  return candidates;
};

const economyCandidates = (state, ownerId, rng) => {
  const kingdom = state.kingdoms[ownerId];
  const candidates = [];
  for (const { region, slot, building } of kingdomBuildings(state, ownerId)) {
    if (['village', 'fortress'].includes(building.type)) {
      const error = validateUpgrade(state, { ownerId, regionId: region.id, slotId: slot.id });
      if (!error) {
        const target = building.type === 'village' ? 'city' : 'castle';
        const category = BUILDING_TYPES[target].category;
        candidates.push({ action: { type: 'UPGRADE', ownerId, regionId: region.id, slotId: slot.id }, score: 82 * personalityWeight(kingdom.personality, category) + rng.float(0, 12) });
      }
    }
    if (['fortress', 'castle'].includes(building.type)) {
      const unitPriority = kingdom.personality === 'conqueror' ? ['footmen', 'archers', 'cavalry', 'siege'] : kingdom.personality === 'steward' ? ['archers', 'footmen', 'cavalry'] : ['footmen', 'archers', 'siege'];
      for (const unitType of unitPriority) {
        if (!validateRecruit(state, { ownerId, slotId: slot.id, unitType, quantity: 1 })) {
          const unitScore = unitType === 'siege' ? 58 : 45 + UNIT_TYPES[unitType].baseStrength / 10;
          candidates.push({ action: { type: 'RECRUIT', ownerId, slotId: slot.id, unitType, quantity: 1 }, score: unitScore * personalityWeight(kingdom.personality, 'military') });
          break;
        }
      }
      const mobileUnits = Object.fromEntries(Object.entries(building.garrison).map(([id, count]) => [id, Math.max(0, count - (id === 'footmen' ? 1 : 0))]));
      if (unitCount(mobileUnits) >= 2 && friendlyArmiesAt(state, slot.id, ownerId).length === 0 && !validateMobilize(state, { ownerId, slotId: slot.id, units: mobileUnits })) {
        candidates.push({ action: { type: 'MOBILIZE', ownerId, slotId: slot.id, units: mobileUnits }, score: 76 * personalityWeight(kingdom.personality, 'aggression') });
      }
    }
  }
  for (const region of state.map.regions) {
    if (regionStatus(state, region) !== 'secure' || buildingsInRegion(region).some((building) => building.ownerId !== ownerId)) continue;
    for (const slot of region.slots.filter((candidate) => !candidate.building)) {
      const preferences = kingdom.personality === 'conqueror' ? ['fortress', 'temple', 'village'] : kingdom.personality === 'steward' ? ['village', 'temple', 'fortress'] : ['temple', 'village', 'fortress'];
      for (const buildingType of preferences) {
        if (!validateBuild(state, { ownerId, regionId: region.id, slotId: slot.id, buildingType })) {
          const category = BUILDING_TYPES[buildingType].category;
          candidates.push({ action: { type: 'BUILD', ownerId, regionId: region.id, slotId: slot.id, buildingType }, score: 68 * personalityWeight(kingdom.personality, category) + rng.float(0, 10) });
          break;
        }
      }
    }
  }
  return candidates;
};

export const chooseAIAction = (state, ownerId, actionIndex = 0) => {
  const ownSiege = state.sieges.find((siege) => siege.ownerId === ownerId);
  if (ownSiege) {
    const action = { type: 'ADVANCE_SIEGE', ownerId, siegeId: ownSiege.id };
    return validateAdvanceSiege(state, action) ? null : action;
  }
  const rng = new Random(state.rngSeed + actionIndex * 997 + state.round * 37);
  const candidates = [
    ...siegeCandidates(state, ownerId),
    ...moveCandidates(state, ownerId, rng),
    ...economyCandidates(state, ownerId, rng)
  ].sort((a, b) => b.score - a.score);
  return candidates[0]?.action ?? null;
};

export const planAITurn = (state, ownerId) => {
  const actions = [];
  const shadow = structuredClone(state);
  for (let index = 0; index < MAX_AI_ACTIONS; index += 1) {
    const action = chooseAIAction(shadow, ownerId, index);
    if (!action) break;
    actions.push(action);
    // Planning is intentionally shallow; the live engine re-evaluates after every action.
    if (action.type === 'MOVE') shadow.armies[action.armyId].movement = 0;
    if (action.type === 'BEGIN_SIEGE') break;
  }
  return actions;
};
