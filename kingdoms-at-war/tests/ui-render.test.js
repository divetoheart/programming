import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/create-game.js';
import { getRegionBySlot } from '../src/game/selectors.js';
import { mapMarkup } from '../src/ui/map-markup.js';

const profile = { name: 'Test Crown', ruler: 'Test Ruler', faith: 'Test Faith', deity: 'Test Deity', domain: 'War', color: '#315f9e', emblem: 'lion' };

const occurrences = (value, fragment) => value.split(fragment).length - 1;

test('focused map renders one detailed region and strategic context', () => {
  const state = createGame(profile, 2026);
  const army = Object.values(state.armies).find((candidate) => candidate.ownerId === state.activeKingdomId);
  const region = getRegionBySlot(state, army.slotId);
  const html = mapMarkup(state, { kind: 'army', id: army.id }, new Set(), { x: 0, y: 0, scale: 1.48 }, 390, 844, region.id);

  assert.match(html, /world-focus/);
  assert.equal(occurrences(html, 'class="region-group'), 20);
  assert.equal(occurrences(html, 'class="slot-node'), 3);
  assert.equal(occurrences(html, 'class="compact-slot'), 57);
  assert.match(html, /class="building-art"/);
  assert.match(html, /class="region-summary/);
});

test('zoomed-out map switches to overview level of detail', () => {
  const state = createGame(profile, 2027);
  const region = state.map.regions[0];
  const html = mapMarkup(state, { kind: 'region', id: region.id }, new Set(), { x: 0, y: 0, scale: 0.5 }, 390, 844, region.id);
  assert.match(html, /world-overview/);
});
