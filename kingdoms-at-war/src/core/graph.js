export const edgeKey = (a, b) => [a, b].sort().join('::');
export const neighborsOf = (map, slotId) => map.edges
  .filter((edge) => edge.a === slotId || edge.b === slotId)
  .map((edge) => edge.a === slotId ? edge.b : edge.a);
export const edgeBetween = (map, a, b) => map.edges.find((edge) => (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a));
export const isConnected = (map) => {
  const slots = map.regions.flatMap((region) => region.slots.map((slot) => slot.id));
  if (!slots.length) return true;
  const seen = new Set([slots[0]]);
  const queue = [slots[0]];
  while (queue.length) {
    const current = queue.shift();
    for (const neighbor of neighborsOf(map, current)) {
      if (!seen.has(neighbor)) { seen.add(neighbor); queue.push(neighbor); }
    }
  }
  return seen.size === slots.length;
};
