import { PLAYER_ID, NEUTRAL_ID, STARTING_RESOURCES, STARTING_FERVOR, STARTING_ARMY, STARTING_GARRISON, GAME_VERSION } from '../config/balance.js';
import { AI_KINGDOMS } from '../config/names.js';
import { Random } from '../core/random.js';
import { makeId } from '../core/ids.js';
import { generateMap } from './map-generator.js';

const makeKingdom = (id, profile, isHuman = false) => ({
  id,
  name: profile.name,
  ruler: profile.ruler,
  color: profile.color,
  emblem: profile.emblem,
  faith: { name: profile.faith, deity: profile.deity, domain: profile.domain },
  personality: profile.personality ?? 'balanced',
  isHuman,
  eliminated: false,
  resources: { ...STARTING_RESOURCES },
  fervor: STARTING_FERVOR,
  debtTurns: 0,
  famineTurns: 0
});

export const createGame = (profile, seed = Date.now()) => {
  const rng = new Random(seed);
  const kingdomIds = [PLAYER_ID, 'kingdom-ai-1', 'kingdom-ai-2', 'kingdom-ai-3'];
  const kingdoms = {
    [NEUTRAL_ID]: { id: NEUTRAL_ID, name: 'Independent Realms', ruler: '', color: '#8a8171', emblem: 'circle', faith: { name: 'Old Ways', deity: 'Many', domain: 'Mystery' }, personality: 'neutral', isHuman: false, eliminated: false, resources: { gold: 0, provisions: 0, materials: 0 }, fervor: 40, debtTurns: 0, famineTurns: 0 },
    [PLAYER_ID]: makeKingdom(PLAYER_ID, profile, true)
  };
  AI_KINGDOMS.forEach((profileData, index) => { kingdoms[kingdomIds[index + 1]] = makeKingdom(kingdomIds[index + 1], profileData); });
  const map = generateMap(rng, kingdomIds);
  const armies = {};
  kingdomIds.forEach((ownerId, index) => {
    const region = map.regions[[0, 4, 15, 19][index]];
    region.slots[0].building.garrison = { ...STARTING_GARRISON };
    const armyId = makeId('army');
    armies[armyId] = {
      id: armyId, ownerId, name: index === 0 ? '1st Royal Army' : `${kingdoms[ownerId].name} Host`,
      slotId: region.slots[1].id, units: { ...STARTING_ARMY }, morale: 72, supply: 82,
      desertion: 4, movement: 3, maxMovement: 3, entrenched: false
    };
  });
  return {
    version: GAME_VERSION,
    seed: Number(seed), rngSeed: rng.snapshot(), round: 1,
    activeKingdomId: PLAYER_ID, phase: 'player', winnerId: null,
    kingdoms, map, armies, sieges: [],
    eventLog: [{ id: makeId('event'), round: 1, type: 'system', message: 'The crowns rise. Your campaign begins.' }],
    settings: { speed: 'normal', tutorialSeen: false },
    meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  };
};
