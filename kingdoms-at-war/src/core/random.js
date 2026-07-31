export class Random {
  constructor(seed = Date.now()) {
    this.seed = (Number(seed) >>> 0) || 1;
  }
  next() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  int(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
  float(min, max) { return min + this.next() * (max - min); }
  chance(probability) { return this.next() < probability; }
  pick(items) { return items[this.int(0, items.length - 1)]; }
  shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  snapshot() { return this.seed >>> 0; }
}
