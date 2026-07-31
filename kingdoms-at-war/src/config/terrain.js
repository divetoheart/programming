export const TERRAIN_TYPES = Object.freeze({
  plains: { id: 'plains', name: 'Plains', movement: 1, populationCap: 7000, growth: 1.08, defense: 0, unit: { cavalry: 1.12 } },
  farmland: { id: 'farmland', name: 'Farmland', movement: 1, populationCap: 9000, growth: 1.22, defense: 0, provisions: 1.3, unit: { cavalry: 1.08 } },
  forest: { id: 'forest', name: 'Forest', movement: 1.35, populationCap: 900, growth: 0.95, defense: 0.12, materials: 1.25, unit: { archers: 1.12, cavalry: 0.78 } },
  hills: { id: 'hills', name: 'Hills', movement: 1.4, populationCap: 700, growth: 0.9, defense: 0.16, materials: 1.12, unit: { archers: 1.08, cavalry: 0.86 } },
  mountains: { id: 'mountains', name: 'Mountains', movement: 1.8, populationCap: 400, growth: 0.7, defense: 0.28, materials: 1.45, unit: { cavalry: 0.58, footmen: 1.08 } },
  wetlands: { id: 'wetlands', name: 'Wetlands', movement: 1.65, populationCap: 900, growth: 0.92, defense: 0.18, provisions: 1.08, unit: { cavalry: 0.5, archers: 0.92 } },
  arid: { id: 'arid', name: 'Arid', movement: 1.25, populationCap: 350, growth: 0.68, defense: 0.05, provisions: 0.65, unit: { cavalry: 1.05 } }
});

export const TERRAIN_IDS = Object.keys(TERRAIN_TYPES);
