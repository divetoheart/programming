export class Ambience {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.windGain = null;
    this.cityGain = null;
    this.hallGain = null;
    this.stepIndex = 0;
  }

  start() {
    if (this.ctx) {
      this.ctx.resume?.();
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.34;
    this.master.connect(this.ctx.destination);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.055;
    this.cityGain = this.ctx.createGain();
    this.cityGain.gain.value = 0;
    this.hallGain = this.ctx.createGain();
    this.hallGain.gain.value = 0;

    const wind = this.noiseSource(4);
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 620;
    wind.connect(windFilter).connect(this.windGain).connect(this.master);
    wind.start();

    const city = this.noiseSource(3.2);
    const cityFilter = this.ctx.createBiquadFilter();
    cityFilter.type = "bandpass";
    cityFilter.frequency.value = 540;
    cityFilter.Q.value = .35;
    city.connect(cityFilter).connect(this.cityGain).connect(this.master);
    city.start();

    const hall = this.noiseSource(2.4);
    const hallFilter = this.ctx.createBiquadFilter();
    hallFilter.type = "lowpass";
    hallFilter.frequency.value = 180;
    hall.connect(hallFilter).connect(this.hallGain).connect(this.master);
    hall.start();
  }

  noiseSource(seconds = 2) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * .965 + white * .035;
      data[i] = last;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  ramp(gain, value, seconds = .8) {
    if (!this.ctx || !gain) return;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(value, t + seconds);
  }

  update(zoneId) {
    if (!this.ctx) return;
    const inCity = ["south-gate", "crown-street", "castle-ascent", "castle-court"].includes(zoneId);
    const inHall = zoneId === "great-hall";
    this.ramp(this.windGain, inHall ? .012 : .05, 1.5);
    this.ramp(this.cityGain, inCity ? .038 : 0, 1.4);
    this.ramp(this.hallGain, inHall ? .028 : 0, 1.2);
  }

  tone({ frequency = 440, frequency2, duration = .8, gain = .08, type = "sine", attack = .01 } = {}) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (frequency2) osc.frequency.exponentialRampToValueAtTime(frequency2, now + duration);
    amp.gain.setValueAtTime(.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + attack);
    amp.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(amp).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + .04);
  }

  bell() {
    if (!this.ctx) return;
    [196, 294, 392].forEach((f, i) => {
      this.tone({ frequency: f, duration: 2.8 + i * .15, gain: .035 / (i + .8), type: "sine", attack: .008 });
    });
  }

  chime() {
    if (!this.ctx) return;
    this.tone({ frequency: 523, duration: .9, gain: .035, type: "sine" });
    setTimeout(() => this.tone({ frequency: 659, duration: 1.1, gain: .025, type: "sine" }), 110);
  }

  step(sprinting = false, stone = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const length = Math.floor(this.ctx.sampleRate * .08);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const env = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = stone ? 760 : 460;
    const amp = this.ctx.createGain();
    amp.gain.value = sprinting ? .042 : .028;
    src.connect(filter).connect(amp).connect(this.master);
    src.start(now);

    this.stepIndex++;
    this.tone({
      frequency: stone ? 110 + (this.stepIndex % 2) * 12 : 78 + (this.stepIndex % 2) * 8,
      duration: .065,
      gain: .014,
      type: "triangle",
      attack: .004
    });
  }

  gateGrind() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const length = Math.floor(this.ctx.sampleRate * 2.4);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = last * .7 + (Math.random() * 2 - 1) * .3;
      const env = Math.sin(Math.PI * i / length);
      data[i] = last * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.linearRampToValueAtTime(420, now + 2.2);
    filter.Q.value = .7;
    const amp = this.ctx.createGain();
    amp.gain.value = .095;
    src.connect(filter).connect(amp).connect(this.master);
    src.start(now);
  }

  firePop() {
    if (!this.ctx || Math.random() > .22) return;
    this.tone({ frequency: 620 + Math.random() * 340, frequency2: 160, duration: .08, gain: .009, type: "square", attack: .002 });
  }
}
