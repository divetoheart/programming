import { BUILDING_TYPES } from '../config/buildings.js';
import { UNIT_TYPES, createEmptyUnits, unitCount } from '../config/units.js';
import { TERRAIN_TYPES } from '../config/terrain.js';
import { Random } from '../core/random.js';
import { clamp, weightedAverage } from '../core/math.js';
import { neighborsOf } from '../core/graph.js';
import { getRegionBySlot, getSlot, enemyArmiesAt, regionalSupport, domainBonus, armiesAt } from './selectors.js';
import { captureBuilding } from './capture.js';
import { logEvent, timelineEvent } from './events.js';

const cloneUnits = (units) => Object.fromEntries(Object.entries(units).map(([id, count]) => [id, count]));
const combinedUnits = (sources) => {
  const units = createEmptyUnits();
  for (const source of sources) for (const [id, count] of Object.entries(source.units)) units[id] += count;
  return units;
};
const forceStat = (sources, key, fallback = 50) => weightedAverage(sources.map((source) => ({ value: source[key] ?? fallback, weight: Math.max(1, unitCount(source.units)) })));

const counterMultiplier = (unitId, enemyUnits) => {
  const total = unitCount(enemyUnits);
  if (!total) return 1;
  return Object.entries(enemyUnits).reduce((sum, [enemyId, count]) => sum + (UNIT_TYPES[unitId].counters[enemyId] ?? 1) * count, 0) / total;
};

const forceStrength = ({ units, morale, supply, fervor, terrainId, defending, fortification = 0, support = {}, domain = {} }, enemyUnits, rng) => {
  const terrain = TERRAIN_TYPES[terrainId];
  let base = 0;
  for (const [unitId, count] of Object.entries(units)) {
    if (!count) continue;
    const unit = UNIT_TYPES[unitId];
    const terrainMultiplier = terrain.unit?.[unitId] ?? 1;
    base += count * unit.baseStrength * counterMultiplier(unitId, enemyUnits) * terrainMultiplier;
  }
  const moraleFactor = 0.58 + morale / 205;
  const supplyFactor = 0.57 + supply / 230;
  const fervorFactor = 0.9 + fervor / 520;
  const doctrineFactor = 1 + (domain.troopStrength ?? 0);
  const defenseFactor = defending ? 1 + terrain.defense + (support.defense ?? 0) + Math.min(0.72, fortification / 185) : 1;
  return base * moraleFactor * supplyFactor * fervorFactor * doctrineFactor * defenseFactor * rng.float(0.95, 1.05);
};

const chooseCasualty = (units, rng, defender = false) => {
  const candidates = Object.entries(units).filter(([, count]) => count > 0);
  if (!candidates.length) return null;
  const weights = candidates.map(([id, count]) => {
    const exposure = id === 'siege' ? 1.45 : id === 'cavalry' ? 0.82 : id === 'ships' ? 0.45 : 1;
    const defense = defender && id === 'archers' ? 0.85 : 1;
    return { id, weight: count * exposure * defense };
  });
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng.float(0, total);
  for (const entry of weights) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return weights.at(-1).id;
};

const removeCasualties = (units, count, rng, defender = false) => {
  const losses = createEmptyUnits();
  for (let index = 0; index < count; index += 1) {
    const type = chooseCasualty(units, rng, defender);
    if (!type) break;
    units[type] -= 1;
    losses[type] += 1;
  }
  return losses;
};

const distributeRemaining = (sources, originalSources, remaining) => {
  for (const source of sources) for (const id of Object.keys(source.units)) source.units[id] = 0;
  for (const [unitId, remainingCount] of Object.entries(remaining)) {
    let left = remainingCount;
    const originalTotal = originalSources.reduce((sum, source) => sum + source.units[unitId], 0);
    sources.forEach((source, index) => {
      if (!left) return;
      const share = index === sources.length - 1 ? left : Math.min(left, Math.round(remainingCount * ((originalSources[index].units[unitId] || 0) / Math.max(1, originalTotal))));
      source.units[unitId] += share;
      left -= share;
    });
    if (left > 0 && sources[0]) sources[0].units[unitId] += left;
  }
};

const retreatArmy = (state, army, fromSlotId, blockedSlotId) => {
  const candidates = neighborsOf(state.map, fromSlotId).filter((slotId) => {
    if (slotId === blockedSlotId) return false;
    const slot = getSlot(state, slotId);
    if (armiesAt(state, slotId).some((other) => other.ownerId !== army.ownerId)) return false;
    return !slot.building || slot.building.ownerId === army.ownerId;
  });
  if (!candidates.length) return false;
  army.slotId = candidates[0];
  army.movement = 0;
  army.morale = Math.max(18, army.morale - 8);
  return true;
};

export const resolveCombat = (state, { attackerId, targetSlotId, originSlotId }) => {
  const attacker = state.armies[attackerId];
  const targetSlot = getSlot(state, targetSlotId);
  const region = getRegionBySlot(state, targetSlotId);
  const targetBuilding = targetSlot.building?.ownerId !== attacker.ownerId ? targetSlot.building : null;
  const defendingArmies = enemyArmiesAt(state, targetSlotId, attacker.ownerId);
  const defenderOwnerId = defendingArmies[0]?.ownerId ?? targetBuilding?.ownerId;
  const defenderKingdom = state.kingdoms[defenderOwnerId];
  const attackerKingdom = state.kingdoms[attacker.ownerId];
  const defenderSources = defendingArmies.map((army) => ({ kind: 'army', ref: army, units: army.units, morale: army.morale, supply: army.supply }));
  if (targetBuilding && unitCount(targetBuilding.garrison)) defenderSources.push({ kind: 'garrison', ref: targetBuilding, units: targetBuilding.garrison, morale: targetBuilding.morale, supply: Math.min(100, targetBuilding.supply / 4) });
  if (!defenderSources.length) {
    attacker.slotId = targetSlotId;
    return captureBuilding(state, { army: attacker, slotId: targetSlotId });
  }

  const rng = new Random(state.rngSeed);
  const attackerUnits = cloneUnits(attacker.units);
  const defenderUnits = combinedUnits(defenderSources);
  const originalDefenderSources = defenderSources.map((source) => ({ ...source, units: cloneUnits(source.units) }));
  const startAttackerCount = unitCount(attackerUnits);
  const startDefenderCount = unitCount(defenderUnits);
  let attackerMorale = attacker.morale;
  let defenderMorale = forceStat(defenderSources, 'morale');
  let attackerSupply = attacker.supply;
  let defenderSupply = forceStat(defenderSources, 'supply');
  const support = targetBuilding ? regionalSupport(state, region, defenderOwnerId) : {};
  const fortification = targetBuilding ? targetBuilding.fortification * (1 - (targetBuilding.damaged ?? 0) / 160) : 0;
  const timeline = [timelineEvent('combatStarted', { attackerId, targetSlotId, originSlotId, defenderOwnerId, buildingType: targetBuilding?.type ?? null }, 'slow')];

  let tick = 0;
  while (tick < 12 && unitCount(attackerUnits) > 0 && unitCount(defenderUnits) > 0 && attackerMorale > 12 && defenderMorale > 12) {
    tick += 1;
    const attackStrength = forceStrength({
      units: attackerUnits, morale: attackerMorale, supply: attackerSupply, fervor: attackerKingdom.fervor,
      terrainId: region.terrain, defending: false, domain: domainBonus(state, attacker.ownerId)
    }, defenderUnits, rng);
    const defenseStrength = forceStrength({
      units: defenderUnits, morale: defenderMorale, supply: defenderSupply, fervor: defenderKingdom?.fervor ?? 42,
      terrainId: region.terrain, defending: true, fortification, support, domain: domainBonus(state, defenderOwnerId)
    }, attackerUnits, rng);
    const totalStrength = Math.max(1, attackStrength + defenseStrength);
    const attackerExposure = defenseStrength / totalStrength;
    const defenderExposure = attackStrength / totalStrength;
    const attackerLossesCount = Math.min(unitCount(attackerUnits), rng.chance(0.32 + attackerExposure * 0.58) ? (attackerExposure > 0.66 && rng.chance(0.35) ? 2 : 1) : 0);
    const defenderLossesCount = Math.min(unitCount(defenderUnits), rng.chance(0.32 + defenderExposure * 0.58) ? (defenderExposure > 0.66 && rng.chance(0.35) ? 2 : 1) : 0);
    const attackerLosses = removeCasualties(attackerUnits, attackerLossesCount, rng, false);
    const defenderLosses = removeCasualties(defenderUnits, defenderLossesCount, rng, true);
    attackerMorale = clamp(attackerMorale - attackerLossesCount * 5.5 - Math.max(0, defenseStrength / Math.max(1, attackStrength) - 1) * 3.5 + rng.float(-1, 1), 0, 100);
    defenderMorale = clamp(defenderMorale - defenderLossesCount * 6 - Math.max(0, attackStrength / Math.max(1, defenseStrength) - 1) * 3.5 + rng.float(-1, 1), 0, 100);
    attackerSupply = clamp(attackerSupply - 4 - unitCount(attackerUnits) * 0.12, 0, 100);
    defenderSupply = clamp(defenderSupply - 3 - unitCount(defenderUnits) * 0.1, 0, 100);
    timeline.push(timelineEvent('combatTick', {
      tick, attackerId, targetSlotId,
      attackerUnits: cloneUnits(attackerUnits), defenderUnits: cloneUnits(defenderUnits),
      attackerLosses, defenderLosses,
      attackerMorale: Math.round(attackerMorale), defenderMorale: Math.round(defenderMorale),
      attackerSupply: Math.round(attackerSupply), defenderSupply: Math.round(defenderSupply),
      terrain: region.terrain, fortification: Math.round(fortification)
    }, 'slow'));
  }
  state.rngSeed = rng.snapshot();
  attacker.units = attackerUnits;
  attacker.morale = Math.round(attackerMorale);
  attacker.supply = Math.round(attackerSupply);
  attacker.movement = 0;
  distributeRemaining(defenderSources, originalDefenderSources, defenderUnits);
  for (const source of defenderSources) {
    source.ref.morale = Math.round(defenderMorale);
    if (source.kind === 'army') source.ref.supply = Math.round(defenderSupply);
    else source.ref.supply = Math.round(defenderSupply * 4);
  }

  const attackerRouted = unitCount(attackerUnits) === 0 || attackerMorale <= 12;
  const defenderRouted = unitCount(defenderUnits) === 0 || defenderMorale <= 12;
  let outcome = 'stalemate';
  if (defenderRouted && !attackerRouted) outcome = 'attacker';
  else if (attackerRouted && !defenderRouted) outcome = 'defender';
  else if (attackerRouted && defenderRouted) outcome = unitCount(attackerUnits) >= unitCount(defenderUnits) ? 'attacker' : 'defender';
  else outcome = attackerMorale > defenderMorale ? 'attacker' : 'defender';

  // Fervor preserves a fraction of formations as scattered survivors after a rout.
  if (outcome === 'defender' && unitCount(attacker.units) === 0 && startAttackerCount > 0 && attackerKingdom.fervor >= 55) {
    attacker.units.footmen = 1;
    attacker.morale = 16;
  }
  if (outcome === 'attacker') {
    for (const source of defenderSources) {
      if (source.kind === 'army') {
        if (unitCount(source.ref.units) === 0 || !retreatArmy(state, source.ref, targetSlotId, originSlotId)) delete state.armies[source.ref.id];
      }
    }
    if (targetBuilding) for (const id of Object.keys(targetBuilding.garrison)) targetBuilding.garrison[id] = 0;
    attacker.slotId = targetSlotId;
    timeline.push(timelineEvent('combatEnded', { outcome, attackerId, targetSlotId, attackerRemaining: unitCount(attacker.units), defenderRemaining: unitCount(defenderUnits) }, 'slow'));
    timeline.push(...captureBuilding(state, { army: attacker, slotId: targetSlotId }));
    logEvent(state, 'battle', `${attackerKingdom.name} won the battle of ${region.name}.`, attacker.ownerId);
  } else {
    attacker.slotId = originSlotId;
    if (unitCount(attacker.units) === 0) delete state.armies[attacker.id];
    timeline.push(timelineEvent('combatEnded', { outcome, attackerId, targetSlotId, attackerRemaining: unitCount(attackerUnits), defenderRemaining: unitCount(defenderUnits) }, 'slow'));
    logEvent(state, 'battle', `${defenderKingdom?.name ?? 'The defenders'} held at ${region.name}.`, defenderOwnerId);
  }
  return timeline;
};
