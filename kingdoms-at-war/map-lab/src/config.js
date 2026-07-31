export const MAP = Object.freeze({
  width: 1800,
  height: 1260,
  regionCount: 20,
  tilesPerRegion: 3,
  tileCount: 60,
  terrainWidth: 600,
  terrainHeight: 420,
  hydrologyWidth: 180,
  hydrologyHeight: 126,
});

export const TERRAIN = Object.freeze({
  deepWater: [26, 48, 58],
  shallowWater: [48, 78, 82],
  coast: [166, 157, 116],
  arid: [139, 125, 82],
  plains: [103, 126, 73],
  farmland: [126, 137, 76],
  forest: [54, 91, 60],
  wetland: [63, 100, 84],
  hills: [104, 103, 73],
  mountain: [101, 98, 90],
  snow: [184, 183, 171],
});

export const REGION_PALETTE = Object.freeze([
  0x6f845d, 0x8b7158, 0x5f7b86, 0x8b8057, 0x795e78,
  0x607f6b, 0x8c674f, 0x5f6f8e, 0x8b7b69, 0x6d8055,
]);

export const REGION_NAMES = Object.freeze([
  'Goldmere', 'Westpass', 'Blackcross', 'Brightmere', 'Sunfen',
  'Ashmere', 'Ironwatch', 'Winddale', 'Southhold', 'Cedarfen',
  'Eastmere', 'Stonepass', 'Highmarsh', 'Ravenport', 'Northreach',
  'Greenvale', 'Redwater', 'Oakmarch', 'Greyhaven', 'Kingsfall',
  'Thornfield', 'Whitebarrow', 'Dunmere', 'Silverbrook', 'Crowrest',
]);

export const TILE_SUFFIXES = Object.freeze([
  'Keep', 'Vale', 'Crossing', 'Fields', 'Grove', 'Moor', 'Downs', 'Ford',
  'Heath', 'Wood', 'Reach', 'Hollow', 'Ridge', 'Fen', 'Brook', 'March',
]);

export const HOLDING_TYPES = Object.freeze(['fortress', 'village', 'temple', 'city', 'castle']);
