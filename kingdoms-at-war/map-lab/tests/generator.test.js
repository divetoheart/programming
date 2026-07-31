import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMap } from '../src/model/generator.js';

test('map creates 60 tiles grouped into 20 connected three-tile regions', () => {
  for (const seed of [1, 42, 9137]) {
    const map = generateMap(seed);
    assert.equal(map.tiles.length, 60);
    assert.equal(map.regions.length, 20);
    for (const region of map.regions) {
      assert.equal(region.tileIds.length, 3);
      const allowed = new Set(region.tileIds);
      const seen = new Set([region.tileIds[0]]);
      const stack = [region.tileIds[0]];
      while (stack.length) {
        const id = stack.pop();
        for (const neighbor of map.adjacency[id]) {
          if (allowed.has(neighbor) && !seen.has(neighbor)) { seen.add(neighbor); stack.push(neighbor); }
        }
      }
      assert.equal(seen.size, 3);
    }
    assert.ok(map.rivers.length >= 2);
    assert.ok(map.regionBoundaries.length > 50);
  }
});
