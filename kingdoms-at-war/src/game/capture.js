import { BUILDING_TYPES } from '../config/buildings.js';
import { clamp } from '../core/math.js';
import { logEvent, timelineEvent } from './events.js';
import { getRegionBySlot, getSlot } from './selectors.js';

export const captureBuilding = (state, { army, slotId }) => {
  const slot = getSlot(state, slotId);
  const building = slot?.building;
  if (!building || building.ownerId === army.ownerId) return [];
  const region = getRegionBySlot(state, slotId);
  const previousOwnerId = building.ownerId;
  const wasCapital = Boolean(building.capital);
  const attacker = state.kingdoms[army.ownerId];
  const defender = state.kingdoms[previousOwnerId];
  const type = BUILDING_TYPES[building.type];
  const timeline = [];
  const recentlyCaptured = Number.isFinite(building.lastCapturedRound) && state.round - building.lastCapturedRound < 3;
  const lootMultiplier = recentlyCaptured ? 0.2 : 1;
  const loot = { gold: 0, provisions: 0, materials: 0 };

  if (building.type === 'temple') {
    loot.gold = 80 + Math.round(building.supply * 0.25);
    loot.provisions = 35 + Math.round(building.supply * 0.18);
    attacker.fervor = clamp(attacker.fervor + 4, 0, 100);
    army.morale = clamp(army.morale + 9, 0, 100);
    army.desertion = clamp(army.desertion - 12, 0, 100);
    if (defender) defender.fervor = clamp(defender.fervor - 7, 0, 100);
  } else if (building.type === 'city') {
    loot.gold = 135 + Math.round(building.supply * 0.2);
    loot.provisions = 70;
    loot.materials = 35;
  } else if (building.type === 'village') {
    loot.gold = 35;
    loot.provisions = 95 + Math.round(building.supply * 0.2);
  } else {
    loot.gold = 45;
    loot.materials = Math.round(type.fortification * 0.35);
  }

  for (const resource of Object.keys(loot)) loot[resource] = Math.round(loot[resource] * lootMultiplier);
  for (const [resource, amount] of Object.entries(loot)) attacker.resources[resource] += amount;
  building.ownerId = army.ownerId;
  building.capital = false;
  building.fortification = Math.max(0, Math.round(building.fortification * 0.58));
  building.supply = Math.round(building.supply * 0.35);
  building.morale = Math.max(42, army.morale - 8);
  building.damaged = clamp(building.damaged + 28, 0, 100);
  building.lastCapturedRound = state.round;

  if (wasCapital && defender && previousOwnerId !== 'neutral') defender.fervor = clamp(defender.fervor - 12, 0, 100);

  const message = `${attacker.name} captured the ${type.name} of ${region.name}.`;
  logEvent(state, 'capture', message, army.ownerId);
  timeline.push(timelineEvent('buildingCaptured', {
    armyId: army.id, slotId, regionId: region.id, buildingType: building.type,
    previousOwnerId, ownerId: army.ownerId, loot, moraleGain: building.type === 'temple' ? 9 : 0,
    desertionReduction: building.type === 'temple' ? 12 : 0, message
  }, 'slow'));
  return timeline;
};
