export const CONFIG = {
  arenaRadius: 38,
  player: { maxHp: 100, speed: 6.4, sprint: 9.2, dodge: 13, stamina: 100 },
  match: { bots: 8, duration: 150, ringDelay: 45, ringMin: 10 },
  quality: { maxDpr: 1.65, maxParticles: 180, shadowSize: 1024 },
};

export const WEAPONS = [
  { id: 'knuckles', name: 'BARE KNUCKLES', icon: '✊', cost: 0, damage: 24, range: 2.35, cooldown: .42, knockback: 5, note: 'FAST · LIGHT' },
  { id: 'marrowmaul', name: 'MARROW MAUL', icon: '🦴', cost: 34, damage: 39, range: 3, cooldown: .62, knockback: 10, note: 'HEAVY · WIDE', parts: ['BONE'] },
  { id: 'jawjack', name: 'JAW JACK', icon: '⚙', cost: 72, damage: 31, range: 3.4, cooldown: .32, knockback: 7, note: 'RAPID · BRUTAL', parts: ['JAW', 'ARM'] },
  { id: 'buzzard', name: 'BUZZARD', icon: '⛓', cost: 120, damage: 19, range: 2.7, cooldown: .16, knockback: 3, note: 'SHREDS · CLOSE', parts: ['ARM', 'BONE'] },
  { id: 'rivetstorm', name: 'RIVETSTORM', icon: '⌁', cost: 165, damage: 29, range: 19, cooldown: .28, knockback: 5, note: 'RANGED · PRECISE', parts: ['SKULL', 'LEG'] },
];

export const BOT_NAMES = ['RAT KING', 'BOLTS', 'MEATBAG', 'CRANK', 'MUTT', 'SHIV', 'TETANUS', 'GUTTER'];
export const PALETTE = { rust: 0xb3442e, bone: 0xe7d9b7, ink: 0x111515, acid: 0xd8ff45, blood: 0x921e27, steel: 0x515b5b, sand: 0x75624c };
