import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/create-game.js';
import { executeAction } from '../src/game/engine.js';
import { chooseAIAction } from '../src/game/ai.js';
import { MAX_AI_ACTIONS } from '../src/config/balance.js';

const profile = { name: 'Simulation Crown', ruler: 'Simulation Ruler', faith: 'Simulation Faith', deity: 'Simulation Deity', domain: 'War', color: '#315f9e', emblem: 'lion' };

test('deterministic eighty-turn campaign simulation preserves legal state', () => {
  let state = createGame(profile, 44081);
  let actions = 0;
  for (let turn = 0; turn < 80 && !state.winnerId; turn += 1) {
    const ownerId = state.activeKingdomId;
    for (let index = 0; index < MAX_AI_ACTIONS && state.activeKingdomId === ownerId && !state.winnerId; index += 1) {
      const action = chooseAIAction(state, ownerId, index);
      if (!action) break;
      const result = executeAction(state, action);
      state = result.state;
      actions += 1;
    }
    if (!state.winnerId && state.activeKingdomId === ownerId) {
      state = executeAction(state, { type: 'END_TURN', ownerId }).state;
      actions += 1;
    }
  }
  assert.ok(actions > 80, `expected a meaningful campaign, received ${actions} actions`);
  assert.equal(state.map.regions.length, 20);
  assert.ok(state.map.regions.every((region) => region.slots.length === 3));
});
