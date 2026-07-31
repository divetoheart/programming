import { PLAYER_ID, NEUTRAL_ID } from '../config/balance.js';
import { processTurnStart } from './economy.js';
import { kingdomBuildings, kingdomArmies, buildingShare } from './selectors.js';
import { timelineEvent, logEvent } from './events.js';

export const turnOrder = (state) => [PLAYER_ID, 'kingdom-ai-1', 'kingdom-ai-2', 'kingdom-ai-3'].filter((id) => state.kingdoms[id] && !state.kingdoms[id].eliminated);

export const updateEliminationsAndVictory = (state) => {
  const timeline = [];
  const contenders = Object.values(state.kingdoms).filter((kingdom) => kingdom.id !== NEUTRAL_ID);
  for (const kingdom of contenders) {
    if (!kingdom.eliminated && kingdomBuildings(state, kingdom.id).length === 0 && kingdomArmies(state, kingdom.id).length === 0) {
      kingdom.eliminated = true;
      timeline.push(timelineEvent('kingdomEliminated', { ownerId: kingdom.id, message: `${kingdom.name} has fallen.` }, 'slow'));
      logEvent(state, 'elimination', `${kingdom.name} has fallen.`, kingdom.id);
    }
  }
  const alive = contenders.filter((kingdom) => !kingdom.eliminated);
  let winner = alive.length === 1 ? alive[0] : alive.find((kingdom) => kingdomBuildings(state, kingdom.id).length >= 10 && buildingShare(state, kingdom.id) >= 0.7);
  if (winner && !state.winnerId) {
    state.winnerId = winner.id;
    state.phase = 'complete';
    timeline.push(timelineEvent('victory', { ownerId: winner.id, message: `${winner.name} rules the realm.` }, 'slow'));
    logEvent(state, 'victory', `${winner.name} rules the realm.`, winner.id);
  }
  return timeline;
};

export const endTurn = (state, ownerId) => {
  if (state.activeKingdomId !== ownerId) throw new Error('It is not this kingdom’s turn.');
  const order = turnOrder(state);
  const currentIndex = order.indexOf(ownerId);
  let nextIndex = (currentIndex + 1) % order.length;
  let nextOwnerId = order[nextIndex];
  if (nextIndex === 0) state.round += 1;
  state.activeKingdomId = nextOwnerId;
  state.phase = nextOwnerId === PLAYER_ID ? 'player' : 'ai';
  const timeline = [timelineEvent('turnEnded', { ownerId, nextOwnerId, round: state.round }, 'normal')];
  timeline.push(...processTurnStart(state, nextOwnerId));
  return timeline;
};
