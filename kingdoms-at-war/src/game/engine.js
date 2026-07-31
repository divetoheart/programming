import { assertGameState } from './invariants.js';
import { build, upgrade, repair } from './construction.js';
import { recruit, mobilize, garrison } from './recruitment.js';
import { moveArmy } from './movement.js';
import { beginSiege, advanceSiege, abandonSiege } from './siege.js';
import { splitArmy, mergeArmies } from './army-management.js';
import { endTurn, updateEliminationsAndVictory } from './turns.js';
import { getSlot } from './selectors.js';

const MUTATING_ACTIONS = new Set(['BUILD', 'UPGRADE', 'REPAIR', 'RECRUIT', 'MOBILIZE', 'GARRISON', 'MOVE', 'BEGIN_SIEGE', 'ADVANCE_SIEGE', 'ABANDON_SIEGE', 'SPLIT_ARMY', 'MERGE_ARMIES', 'END_TURN']);

export const executeAction = (currentState, action) => {
  if (!currentState || !action?.type) throw new Error('An action type is required.');
  if (currentState.winnerId) throw new Error('The campaign is complete.');
  const state = structuredClone(currentState);
  state.sieges = state.sieges.filter((siege) => {
    const army = state.armies[siege.armyId];
    const target = getSlot(state, siege.targetSlotId);
    return army && target?.building && target.building.ownerId !== siege.ownerId;
  });
  const ownerId = action.ownerId ?? state.activeKingdomId;
  if (MUTATING_ACTIONS.has(action.type) && state.activeKingdomId !== ownerId) throw new Error('This kingdom is not active.');
  let timeline;
  switch (action.type) {
    case 'BUILD': timeline = build(state, { ...action, ownerId }); break;
    case 'UPGRADE': timeline = upgrade(state, { ...action, ownerId }); break;
    case 'REPAIR': timeline = repair(state, { ...action, ownerId }); break;
    case 'RECRUIT': timeline = recruit(state, { ...action, ownerId }); break;
    case 'MOBILIZE': timeline = mobilize(state, { ...action, ownerId }); break;
    case 'GARRISON': timeline = garrison(state, { ...action, ownerId }); break;
    case 'MOVE': timeline = moveArmy(state, { ...action, ownerId }); break;
    case 'BEGIN_SIEGE': timeline = beginSiege(state, { ...action, ownerId }); break;
    case 'ADVANCE_SIEGE': timeline = advanceSiege(state, { ...action, ownerId }); break;
    case 'ABANDON_SIEGE': timeline = abandonSiege(state, { ...action, ownerId }); break;
    case 'SPLIT_ARMY': timeline = splitArmy(state, { ...action, ownerId }); break;
    case 'MERGE_ARMIES': timeline = mergeArmies(state, { ...action, ownerId }); break;
    case 'END_TURN': timeline = endTurn(state, ownerId); break;
    default: throw new Error(`Unknown action: ${action.type}`);
  }
  timeline.push(...updateEliminationsAndVictory(state));
  state.meta.updatedAt = new Date().toISOString();
  assertGameState(state);
  return { state, timeline };
};
