import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/create-game.js';
import { executeAction } from '../src/game/engine.js';
import { compositionBonus, getSlot } from '../src/game/selectors.js';
import { PLAYER_ID } from '../src/config/balance.js';

const profile = { name: 'Test Crown', ruler: 'Test Ruler', faith: 'Test Faith', deity: 'Test Deity', domain: 'War', color: '#315f9e', emblem: 'lion' };

const clearStartingRegion = (state) => {
  const region = state.map.regions[0];
  for (const army of Object.values(state.armies)) if (region.slots.some((slot) => slot.id === army.slotId)) army.slotId = state.map.regions[1].slots[0].id;
  return region;
};

test('construction is immediate but blocked while a mobile army occupies the region', () => {
  const state = createGame(profile, 7);
  const region = state.map.regions[0];
  const open = region.slots.find((slot) => !slot.building);
  assert.throws(() => executeAction(state, { type: 'BUILD', ownerId: PLAYER_ID, regionId: region.id, slotId: open.id, buildingType: 'temple' }), /mobile army/i);
  const cleared = structuredClone(state);
  clearStartingRegion(cleared);
  const result = executeAction(cleared, { type: 'BUILD', ownerId: PLAYER_ID, regionId: region.id, slotId: open.id, buildingType: 'temple' });
  assert.equal(getSlot(result.state, open.id).building.type, 'temple');
  assert.ok(result.timeline.some((event) => event.type === 'buildingBuilt'));
  assert.equal(compositionBonus(result.state, result.state.map.regions[0], PLAYER_ID)?.name, 'Pilgrim March');
});

test('empty slots remain unowned after entry', () => {
  const state = createGame(profile, 8);
  const army = Object.values(state.armies).find((candidate) => candidate.ownerId === PLAYER_ID);
  const open = state.map.regions[0].slots.find((slot) => !slot.building);
  const edge = state.map.edges.find((candidate) => candidate.a === open.id || candidate.b === open.id);
  army.slotId = edge.a === open.id ? edge.b : edge.a;
  const target = open.id;
  assert.equal(getSlot(state, target).building, null);
  const result = executeAction(state, { type: 'MOVE', ownerId: PLAYER_ID, armyId: army.id, targetSlotId: target });
  assert.equal(result.state.armies[army.id].slotId, target);
  assert.equal(getSlot(result.state, target).building, null);
});

test('capturing an undefended temple grants loot, morale, and desertion relief', () => {
  const state = createGame(profile, 12);
  const army = Object.values(state.armies).find((candidate) => candidate.ownerId === PLAYER_ID);
  const edge = state.map.edges.find((candidate) => candidate.a === army.slotId || candidate.b === army.slotId);
  const targetId = edge.a === army.slotId ? edge.b : edge.a;
  const target = getSlot(state, targetId);
  target.building = { id: 'test-temple', type: 'temple', ownerId: 'neutral', garrison: { footmen: 0, archers: 0, cavalry: 0, siege: 0, ships: 0 }, morale: 50, supply: 80, fortification: 3, damaged: 0, capital: false };
  const before = { gold: state.kingdoms[PLAYER_ID].resources.gold, morale: army.morale, desertion: army.desertion };
  const result = executeAction(state, { type: 'MOVE', ownerId: PLAYER_ID, armyId: army.id, targetSlotId: targetId });
  const moved = result.state.armies[army.id];
  assert.equal(getSlot(result.state, targetId).building.ownerId, PLAYER_ID);
  assert.ok(result.state.kingdoms[PLAYER_ID].resources.gold > before.gold);
  assert.ok(moved.morale > before.morale);
  assert.ok(moved.desertion <= before.desertion);
  assert.ok(result.timeline.some((event) => event.type === 'buildingCaptured'));
});
