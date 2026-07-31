import { edgeBetween } from '../core/graph.js';
import { getArmy, getSlot, enemyArmiesAt, canUseSeaEdge } from './selectors.js';
import { captureBuilding } from './capture.js';
import { resolveCombat } from './combat.js';
import { timelineEvent } from './events.js';

export const validateMove = (state, { ownerId, armyId, targetSlotId }) => {
  const army = getArmy(state, armyId);
  const target = getSlot(state, targetSlotId);
  if (!army || army.ownerId !== ownerId) return 'Select one of your armies.';
  if (!target) return 'Invalid destination.';
  const edge = edgeBetween(state.map, army.slotId, targetSlotId);
  if (!edge) return 'Armies move one connected slot at a time.';
  const cost = Math.max(1, Math.ceil(edge.cost));
  if (army.movement < cost) return 'This army has insufficient movement remaining.';
  if (edge.kind === 'sea' && !canUseSeaEdge(army)) return 'A sea crossing requires enough warship transport capacity.';
  if (state.sieges.some((siege) => siege.armyId === armyId)) return 'The army must abandon its siege before moving.';
  return null;
};

export const moveArmy = (state, action) => {
  const error = validateMove(state, action);
  if (error) throw new Error(error);
  const army = getArmy(state, action.armyId);
  const originSlotId = army.slotId;
  const targetSlot = getSlot(state, action.targetSlotId);
  const edge = edgeBetween(state.map, originSlotId, action.targetSlotId);
  army.movement -= Math.max(1, Math.ceil(edge.cost));
  army.supply = Math.max(0, army.supply - Math.round(3 + edge.cost * 3));
  const timeline = [];
  for (let tick = 1; tick <= 5; tick += 1) timeline.push(timelineEvent('movementTick', {
    armyId: army.id, fromSlotId: originSlotId, toSlotId: action.targetSlotId, tick, totalTicks: 5, progress: tick / 5, edgeKind: edge.kind
  }, tick === 5 ? 'normal' : 'slow'));

  const hostileArmy = enemyArmiesAt(state, action.targetSlotId, action.ownerId).length > 0;
  const hostileBuilding = targetSlot.building && targetSlot.building.ownerId !== action.ownerId;
  const hostileGarrison = hostileBuilding && Object.values(targetSlot.building.garrison).some((count) => count > 0);
  if (hostileArmy || hostileGarrison) timeline.push(...resolveCombat(state, { attackerId: army.id, targetSlotId: action.targetSlotId, originSlotId }));
  else {
    army.slotId = action.targetSlotId;
    timeline.push(timelineEvent('movementComplete', { armyId: army.id, fromSlotId: originSlotId, toSlotId: action.targetSlotId }, 'normal'));
    if (hostileBuilding) timeline.push(...captureBuilding(state, { army, slotId: action.targetSlotId }));
  }
  return timeline;
};
