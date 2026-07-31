export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
export const sum = (values) => values.reduce((total, value) => total + value, 0);
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const weightedAverage = (entries) => {
  const weight = sum(entries.map((entry) => entry.weight));
  return weight ? sum(entries.map((entry) => entry.value * entry.weight)) / weight : 0;
};
