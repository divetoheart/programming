import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/create-game.js';
import { assertGameState } from '../src/game/invariants.js';
import { isConnected } from '../src/core/graph.js';
import { buildingsInRegion } from '../src/game/selectors.js';

const profile = { name: 'Test Crown', ruler: 'Test Ruler', faith: 'Test Faith', deity: 'Test Deity', domain: 'War', color: '#315f9e', emblem: 'lion' };

test('procedural map always creates twenty connected three-slot regions', () => {
  for (const seed of [1, 2, 9, 42, 9999]) {
    const state = createGame(profile, seed);
    assert.equal(state.map.regions.length, 20);
    assert.ok(state.map.regions.every((region) => region.slots.length === 3));
    assert.ok(isConnected(state.map));
    assertGameState(state);
  }
});

test('four starting kingdoms receive a fortress, village, and open slot', () => {
  const state = createGame(profile, 101);
  for (const index of [0, 4, 15, 19]) {
    const region = state.map.regions[index];
    assert.deepEqual(buildingsInRegion(region).map((building) => building.type).sort(), ['fortress', 'village']);
    assert.equal(region.slots.filter((slot) => !slot.building).length, 1);
  }
});
