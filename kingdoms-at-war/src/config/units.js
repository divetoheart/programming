export const UNIT_TYPES = Object.freeze({
  footmen: {
    id: 'footmen', name: 'Footmen', icon: '⚔', soldiers: 100, population: 100,
    cost: { gold: 110, provisions: 45, materials: 15 }, upkeep: { gold: 10, provisions: 22 },
    baseStrength: 100, movement: 3, siegePower: 1,
    counters: { archers: 1.12, cavalry: 0.86, footmen: 1, siege: 1.3, ships: 0.2 }
  },
  archers: {
    id: 'archers', name: 'Archers', icon: '➶', soldiers: 80, population: 80,
    cost: { gold: 145, provisions: 38, materials: 35 }, upkeep: { gold: 13, provisions: 18 },
    baseStrength: 92, movement: 3, siegePower: 1,
    counters: { footmen: 1.22, archers: 1, cavalry: 0.68, siege: 1.2, ships: 0.25 }
  },
  cavalry: {
    id: 'cavalry', name: 'Cavalry', icon: '♞', soldiers: 60, population: 60,
    cost: { gold: 235, provisions: 70, materials: 40 }, upkeep: { gold: 23, provisions: 32 },
    baseStrength: 132, movement: 4, siegePower: 0.5,
    counters: { footmen: 1.08, archers: 1.42, cavalry: 1, siege: 1.15, ships: 0.1 }
  },
  siege: {
    id: 'siege', name: 'Siege Train', icon: '◆', soldiers: 8, population: 45,
    cost: { gold: 310, provisions: 65, materials: 190 }, upkeep: { gold: 28, provisions: 28 },
    baseStrength: 24, movement: 2, siegePower: 38,
    counters: { footmen: 0.35, archers: 0.35, cavalry: 0.28, siege: 1, ships: 0.1 }
  },
  ships: {
    id: 'ships', name: 'Warships', icon: '⛵', soldiers: 5, population: 90,
    cost: { gold: 380, provisions: 110, materials: 260 }, upkeep: { gold: 32, provisions: 35 },
    baseStrength: 165, movement: 4, siegePower: 5, transportCapacity: 520,
    counters: { footmen: 0.2, archers: 0.3, cavalry: 0.1, siege: 0.2, ships: 1 }
  }
});

export const EMPTY_UNITS = Object.freeze({ footmen: 0, archers: 0, cavalry: 0, siege: 0, ships: 0 });
export const createEmptyUnits = () => ({ ...EMPTY_UNITS });
export const unitPopulation = (units) => Object.entries(units).reduce((sum, [id, count]) => sum + UNIT_TYPES[id].population * count, 0);
export const unitCount = (units) => Object.values(units).reduce((sum, count) => sum + count, 0);
export const hasUnits = (units) => unitCount(units) > 0;
