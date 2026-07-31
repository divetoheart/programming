const fade = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

const hash = (x, y, seed) => {
  let h = Math.imul(x ^ seed, 374761393) + Math.imul(y + seed, 668265263);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

export const valueNoise2D = (x, y, seed) => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty) * 2 - 1;
};

export const fbm = (x, y, seed, octaves = 5) => {
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  let normalizer = 0;
  for (let i = 0; i < octaves; i += 1) {
    total += valueNoise2D(x * frequency, y * frequency, seed + i * 1013) * amplitude;
    normalizer += amplitude;
    amplitude *= 0.5;
    frequency *= 2.04;
  }
  return total / normalizer;
};

export const ridgeNoise = (x, y, seed) => 1 - Math.abs(fbm(x, y, seed, 5));
