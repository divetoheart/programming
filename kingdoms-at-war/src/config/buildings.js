export const BUILDING_TYPES = Object.freeze({
  village: {
    id: 'village', name: 'Village', category: 'civil', icon: 'V',
    cost: { gold: 220, provisions: 0, materials: 160 }, minPopulation: 180,
    income: { gold: 35, provisions: 125, materials: 10 }, populationCap: 900, populationGrowth: 18,
    troopCap: 0, fortification: 8, garrisonCap: 3, supplyStorage: 160,
    regional: { supply: 0.12 }
  },
  city: {
    id: 'city', name: 'City', category: 'civil', icon: 'C',
    cost: { gold: 980, provisions: 120, materials: 720 }, minPopulation: 850,
    upgradeFrom: 'village', upgradeCost: { gold: 650, provisions: 90, materials: 470 },
    income: { gold: 230, provisions: 85, materials: 55 }, populationCap: 2600, populationGrowth: 34,
    troopCap: 0, fortification: 22, garrisonCap: 5, supplyStorage: 410,
    regional: { supply: 0.28, upkeep: -0.08 }
  },
  fortress: {
    id: 'fortress', name: 'Fortress', category: 'military', icon: 'F',
    cost: { gold: 340, provisions: 80, materials: 440 }, minPopulation: 160,
    income: { gold: 10, provisions: -28, materials: -8 }, populationCap: 250, populationGrowth: 2,
    troopCap: 1700, fortification: 58, garrisonCap: 6, supplyStorage: 300,
    regional: { defense: 0.13, garrison: 0.1 }
  },
  castle: {
    id: 'castle', name: 'Castle', category: 'military', icon: 'K',
    cost: { gold: 1180, provisions: 180, materials: 940 }, minPopulation: 700,
    upgradeFrom: 'fortress', upgradeCost: { gold: 780, provisions: 130, materials: 610 },
    income: { gold: 25, provisions: -55, materials: -15 }, populationCap: 500, populationGrowth: 3,
    troopCap: 4000, fortification: 105, garrisonCap: 11, supplyStorage: 620,
    regional: { defense: 0.27, garrison: 0.2, supply: 0.08 }
  },
  temple: {
    id: 'temple', name: 'Temple', category: 'temple', icon: 'T',
    cost: { gold: 560, provisions: 80, materials: 390 }, minPopulation: 300,
    income: { gold: 90, provisions: 10, materials: 0 }, populationCap: 0, populationGrowth: 14,
    troopCap: 0, fortification: 3, garrisonCap: 2, supplyStorage: 100,
    fervorIncome: 4, regional: { morale: 0.12, desertion: -0.18 }
  }
});

export const BUILDING_LIMITS = Object.freeze({ civil: 2, military: 2, temple: 1 });

export const COMPOSITION_BONUSES = Object.freeze({
  'castle|city|temple': { name: 'Royal Province', income: 0.12, defense: 0.12, morale: 0.08 },
  'castle|fortress|temple': { name: 'Sacred Bastion', defense: 0.28, morale: 0.16, desertion: -0.15 },
  'city|city|temple': { name: 'Holy Metropolis', income: 0.24, growth: 0.22, fervor: 2 },
  'fortress|village|village': { name: 'Marchland', troopCap: 700, provisions: 0.22, upkeep: -0.12 },
  'city|temple|village': { name: 'Prosperous Heartland', income: 0.16, growth: 0.2, morale: 0.06 },
  'castle|fortress|village': { name: 'Military Frontier', defense: 0.2, troopCap: 1000, supply: 0.2 },
  'city|fortress|temple': { name: 'Sacred Arsenal', materials: 0.18, troopCap: 600, morale: 0.1 },
  'city|fortress|village': { name: 'Crownland', income: 0.1, provisions: 0.14, defense: 0.08 },
  'fortress|temple|village': { name: 'Pilgrim March', supply: 0.16, morale: 0.12, desertion: -0.1 }
});

export const getCompositionKey = (types) => [...types].sort().join('|');
