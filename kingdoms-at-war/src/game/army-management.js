import { createEmptyUnits, unitCount } from '../config/units.js';
import { makeId } from '../core/ids.js';
import { timelineEvent } from './events.js';

export const validateSplitArmy = (state, { ownerId, armyId, units }) => {
  const army = state.armies[armyId];
  if (!army || army.ownerId !== ownerId) return 'Select one of your armies.';
  const splitCount = Object.values(units).reduce((sum, count) => sum + count, 0);
  if (!splitCount || splitCount >= unitCount(army.units)) return 'A split must leave formations in both armies.';
  for (const [unitId, count] of Object.entries(units)) if (count < 0 || count > army.units[unitId]) return 'The army does not contain those formations.';
  return null;
};

export const splitArmy = (state, action) => {
  const error = validateSplitArmy(state, action);
  if (error) throw new Error(error);
  const source = state.armies[action.armyId];
  const units = createEmptyUnits();
  for (const [unitId, count] of Object.entries(action.units)) {
    units[unitId] = count;
    source.units[unitId] -= count;
  }
  const id = makeId('army');
  state.armies[id] = {
    ...source,
    id,
    name: action.name || `${source.name} Detachment`,
    units,
    movement: 0,
    maxMovement: source.maxMovement
  };
  source.movement = 0;
  return [timelineEvent('armySplit', { sourceArmyId: source.id, newArmyId: id, slotId: source.slotId }, 'normal')];
};

export const validateMergeArmies = (state, { ownerId, armyIds }) => {
  const armies = armyIds.map((id) => state.armies[id]).filter(Boolean);
  if (armies.length < 2 || armies.some((army) => army.ownerId !== ownerId)) return 'Select at least two of your armies.';
  if (new Set(armies.map((army) => army.slotId)).size !== 1) return 'Armies must occupy the same slot to merge.';
  return null;
};

export const mergeArmies = (state, action) => {
  const error = validateMergeArmies(state, action);
  if (error) throw new Error(error);
  const [primary, ...others] = action.armyIds.map((id) => state.armies[id]);
  let weight = unitCount(primary.units);
  for (const army of others) {
    const count = unitCount(army.units);
    const total = Math.max(1, weight + count);
    primary.morale = Math.round((primary.morale * weight + army.morale * count) / total);
    primary.supply = Math.round((primary.supply * weight + army.supply * count) / total);
    primary.desertion = Math.round((primary.desertion * weight + army.desertion * count) / total);
    for (const [unitId, quantity] of Object.entries(army.units)) primary.units[unitId] += quantity;
    weight = total;
    delete state.armies[army.id];
  }
  primary.movement = 0;
  return [timelineEvent('armiesMerged', { armyId: primary.id, mergedArmyIds: action.armyIds.slice(1), slotId: primary.slotId }, 'normal')];
};
