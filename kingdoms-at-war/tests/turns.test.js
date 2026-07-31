import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/create-game.js';
import { executeAction } from '../src/game/engine.js';
import { chooseAIAction } from '../src/game/ai.js';
import { PLAYER_ID } from '../src/config/balance.js';

const profile = { name: 'Test Crown', ruler: 'Test Ruler', faith: 'Test Faith', deity: 'Test Deity', domain: 'War', color: '#315f9e', emblem: 'lion' };

test('ending a turn activates the next kingdom and processes its economy', () => {
  const state = createGame(profile, 21);
  const result = executeAction(state, { type: 'END_TURN', ownerId: PLAYER_ID });
  assert.equal(result.state.activeKingdomId, 'kingdom-ai-1');
  assert.equal(result.state.phase, 'ai');
  assert.ok(result.timeline.some((event) => event.type === 'income'));
});

test('AI returns a legal strategic action or deliberately passes', () => {
  let state = createGame(profile, 22);
  state = executeAction(state, { type: 'END_TURN', ownerId: PLAYER_ID }).state;
  const action = chooseAIAction(state, 'kingdom-ai-1', 0);
  if (action) assert.doesNotThrow(() => executeAction(state, action));
});
