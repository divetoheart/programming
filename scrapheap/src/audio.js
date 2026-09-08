export class AudioDirector {
  constructor() { this.ctx = null; this.master = null; }
  unlock() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain(); this.master.gain.value = .22; this.master.connect(this.ctx.destination);
  }
  tone(freq, duration, type = 'sawtooth', gain = .08, slide = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, osc = this.ctx.createOscillator(), amp = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + duration);
    amp.gain.setValueAtTime(gain, t); amp.gain.exponentialRampToValueAtTime(.001, t + duration);
    osc.connect(amp); amp.connect(this.master); osc.start(t); osc.stop(t + duration);
  }
  noise(duration = .12, gain = .12) {
    if (!this.ctx) return;
    const size = Math.floor(this.ctx.sampleRate * duration), buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    const src = this.ctx.createBufferSource(), amp = this.ctx.createGain(); amp.gain.value = gain; src.buffer = buffer; src.connect(amp); amp.connect(this.master); src.start();
  }
  swing() { this.tone(105, .12, 'sawtooth', .09, -60); }
  hit(heavy = false) { this.noise(heavy ? .2 : .11, heavy ? .2 : .12); this.tone(heavy ? 55 : 85, .14, 'square', .11, -25); }
  pickup() { this.tone(420, .06, 'square', .06, 250); }
  craft() { [110, 180, 260].forEach((f, i) => setTimeout(() => this.tone(f, .1, 'square', .05, 80), i * 65)); }
  warning() { this.tone(92, .3, 'sawtooth', .06, -10); }
  death() { this.tone(78, .8, 'sawtooth', .1, -48); }
}
