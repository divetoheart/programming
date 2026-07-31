export const REGION_PREFIXES = ['Ash', 'Black', 'Bright', 'Cedar', 'Dawn', 'East', 'Elder', 'Frost', 'Gold', 'Green', 'Grey', 'High', 'Iron', 'Long', 'Moon', 'North', 'Oak', 'Raven', 'Red', 'Silver', 'South', 'Stone', 'Sun', 'West', 'Wind'];
export const REGION_SUFFIXES = ['brook', 'cliff', 'cross', 'dale', 'fen', 'ford', 'haven', 'hold', 'march', 'mead', 'mere', 'moor', 'pass', 'reach', 'rest', 'ridge', 'vale', 'watch', 'wood'];
export const AI_KINGDOMS = [
  { name: 'The Iron Concord', ruler: 'Marshal Veyra', faith: 'The Red Oath', deity: 'Korun', domain: 'War', color: '#b64a3a', emblem: 'swords', personality: 'conqueror' },
  { name: 'Verdant Crown', ruler: 'Queen Elowen', faith: 'The Living Cycle', deity: 'Aelith', domain: 'Harvest', color: '#4e8b5b', emblem: 'oak', personality: 'steward' },
  { name: 'Violet Synod', ruler: 'Hierophant Orr', faith: 'The Veiled Flame', deity: 'Nyra', domain: 'Mystery', color: '#7653a6', emblem: 'star', personality: 'zealot' }
];
export const DOMAIN_BONUSES = Object.freeze({
  War: { troopStrength: 0.04 }, Harvest: { growth: 0.08 }, Rivers: { supply: 0.1 },
  Sky: { movement: 0.1 }, Death: { retreat: 0.12 }, Hearth: { famineLoss: -0.2 },
  Justice: { desertion: -0.08 }, Knowledge: { materials: 0.08 }, Mystery: { fervor: 1 }
});
