// =====================================================================
//  ARCANE SURVIVORS — звук: процедурная музыка и синтезированные эффекты
//  Всё генерируется Web Audio API, без внешних файлов.
// =====================================================================
/* global Save */

const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};
// тональность и характер каждой сцены
const MOODS = {
  menu:   { root: 45, scale: 'minor',    bpm: 58, bright: 0.6 },
  ruins:  { root: 50, scale: 'minor',    bpm: 84, bright: 0.8 },
  forest: { root: 52, scale: 'dorian',   bpm: 80, bright: 1.0 },
  crypt:  { root: 49, scale: 'minor',    bpm: 76, bright: 0.6 },
  abyss:  { root: 47, scale: 'phrygian', bpm: 88, bright: 0.7 },
};
const PROG = [0, 5, 3, 4];           // i – VI – iv – v
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// минимальный интервал между одинаковыми звуками (сек) — чтобы толпа не превращалась в шум
const GAP = {
  bolt: 0.07, shard: 0.12, orb: 0.15, zap: 0.08, nova: 0.2, freeze: 0.5, blade: 0.09, boom: 0.06, hit: 0.035,
  death: 0.04, gem: 0.03, level: 0.4, hurt: 0.25, heart: 0.5, roar: 1, phase: 1, warn: 0.25, crack: 0.08,
  chime: 0.3, heal: 0.3, power: 0.3, ui: 0.05, event: 0.8, victory: 2, defeat: 2, eshot: 0.09,
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.last = {};
    this.mood = 'menu';
    this.intensity = 0;
    this.boss = false;
    this.paused = false;
    this.step = 0;
    this.chordIdx = 0;
    this.melodyPos = 3;
    this.gemCombo = 0; this.gemT = 0;
    const a = (Save.data && Save.data.audio) || {};
    this.musicOn = a.music !== false;
    this.sfxOn = a.sfx !== false;
  }

  // ---------------------------------------------------------------
  //  Запуск (iOS разрешает звук только после касания)
  // ---------------------------------------------------------------
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { return; }
      this.build();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  build() {
    const c = this.ctx;
    const st = (Save.data && Save.data.audio) || {};
    this.musicOn = st.music !== false; this.sfxOn = st.sfx !== false;
    this.master = c.createGain(); this.master.gain.value = 0.9;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(c.destination);
    this.music = c.createGain(); this.music.gain.value = this.musicOn ? 0.55 : 0; this.music.connect(this.master);
    this.sfx = c.createGain(); this.sfx.gain.value = this.sfxOn ? 0.8 : 0; this.sfx.connect(this.master);
    // реверберация: синтезированный импульс тёмного зала
    this.verb = c.createConvolver();
    const len = c.sampleRate * 3.2, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.verb.buffer = ir;
    this.verbOut = c.createGain(); this.verbOut.gain.value = 0.55;
    this.verb.connect(this.verbOut); this.verbOut.connect(this.master);
    // белый шум
    this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // слои музыки
    this.padBus = c.createGain(); this.padBus.gain.value = 0.9; this.padBus.connect(this.music); this.padBus.connect(this.verb);
    this.drumBus = c.createGain(); this.drumBus.gain.value = 0; this.drumBus.connect(this.music);
    this.bellBus = c.createGain(); this.bellBus.gain.value = 0.5; this.bellBus.connect(this.music); this.bellBus.connect(this.verb);
    this.padFilter = c.createBiquadFilter(); this.padFilter.type = 'lowpass'; this.padFilter.frequency.value = 700; this.padFilter.Q.value = 2;
    this.padFilter.connect(this.padBus);
    const lfo = c.createOscillator(), lfoG = c.createGain();
    lfo.frequency.value = 0.06; lfoG.gain.value = 350; lfo.connect(lfoG); lfoG.connect(this.padFilter.frequency); lfo.start();
    this.padVoices = [];
    this.droneOsc = null;
    this.nextTime = c.currentTime + 0.1;
    this.setChord(0, true);
    setInterval(() => this.schedule(), 30);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
    });
  }

  saveSettings() {
    Save.data.audio = { music: this.musicOn, sfx: this.sfxOn };
    Save.write();
  }
  setMusic(on) { this.musicOn = on; if (this.music) this.music.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.2); this.saveSettings(); }
  setSfx(on) { this.sfxOn = on; if (this.sfx) this.sfx.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.05); this.saveSettings(); }

  // ---------------------------------------------------------------
  //  Музыка
  // ---------------------------------------------------------------
  scaleNote(deg, octave = 0) {
    const m = MOODS[this.mood], sc = SCALES[m.scale];
    const n = ((deg % 7) + 7) % 7, o = Math.floor(deg / 7);
    return m.root + sc[n] + 12 * (o + octave);
  }

  setChord(idx, instant) {
    const c = this.ctx, t = c.currentTime;
    const deg = PROG[idx % PROG.length];
    const notes = [this.scaleNote(deg, -1), this.scaleNote(deg + 4, -1), this.scaleNote(deg + 2, 0), this.scaleNote(deg + 7, -1)];
    // мягко гасим старые голоса
    for (const v of this.padVoices) { v.g.gain.setTargetAtTime(0, t, 1.2); v.o.stop(t + 6); }
    this.padVoices = [];
    notes.forEach((n, i) => {
      for (const det of [-7, 7]) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = i === 3 ? 'triangle' : 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = det;
        g.gain.value = 0; g.gain.setTargetAtTime(i === 3 ? 0.05 : 0.028, t, instant ? 0.5 : 1.6);
        o.connect(g); g.connect(this.padFilter); o.start(t);
        this.padVoices.push({ o, g });
      }
    });
    // басовый гул
    if (this.droneOsc) { this.droneG.gain.setTargetAtTime(0, t, 1); this.droneOsc.stop(t + 5); }
    this.droneOsc = c.createOscillator(); this.droneG = c.createGain();
    this.droneOsc.type = 'sine'; this.droneOsc.frequency.value = mtof(this.scaleNote(deg, -2));
    this.droneG.gain.value = 0; this.droneG.gain.setTargetAtTime(0.12, t, 1.5);
    this.droneOsc.connect(this.droneG); this.droneG.connect(this.music); this.droneOsc.start(t);
  }

  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, m = MOODS[this.mood];
    const bpm = m.bpm * (this.boss ? 1.22 : 1) * (this.mood === 'menu' ? 1 : 1);
    const stepDur = 60 / bpm / 4;
    // слой барабанов зависит от накала боя
    const drumTarget = this.paused ? 0 : this.mood === 'menu' ? 0 : Math.min(1, 0.25 + this.intensity * 0.75 + (this.boss ? 0.4 : 0));
    this.drumBus.gain.setTargetAtTime(drumTarget * 0.9, c.currentTime, 0.8);
    this.music.gain.setTargetAtTime(this.musicOn ? (this.paused ? 0.25 : 0.55) : 0, c.currentTime, 0.3);
    while (this.nextTime < c.currentTime + 0.15) {
      const t = this.nextTime, s = this.step % 16, bar = Math.floor(this.step / 16);
      if (s === 0 && bar % 4 === 0 && this.step > 0) { this.chordIdx++; this.setChord(this.chordIdx); }
      // колокола/арпеджио
      const p = this.mood === 'menu' ? 0.18 : 0.3 + this.intensity * 0.2;
      if (s % 2 === 0 && Math.random() < p) {
        this.melodyPos += [-2, -1, -1, 0, 1, 1, 2][(Math.random() * 7) | 0];
        this.melodyPos = Math.max(0, Math.min(9, this.melodyPos));
        const deg = PROG[this.chordIdx % 4] + this.melodyPos;
        this.bell(t, mtof(this.scaleNote(deg, 1)), 0.05 * m.bright);
      }
      // ударные
      if (this.mood !== 'menu') {
        const boss = this.boss;
        if (s === 0 || s === 8 || (boss && (s === 6 || s === 14))) this.kick(t);
        if (s === 4 || s === 12) this.tom(t, s === 12 ? 82 : 98);
        if (boss && s % 4 === 2) this.tom(t, 130, 0.5);
        if (s % 2 === 1 && this.intensity > 0.35) this.hat(t, s % 4 === 3 ? 0.05 : 0.025);
      }
      this.nextTime += stepDur;
      this.step++;
    }
  }

  bell(t, f, vol) {
    const c = this.ctx;
    for (const [mul, v, dec] of [[1, 1, 2.2], [2.01, 0.35, 1.2], [3.98, 0.12, 0.6]]) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = mul === 1 ? 'triangle' : 'sine'; o.frequency.value = f * mul;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      o.connect(g); g.connect(this.bellBus); o.start(t); o.stop(t + dec + 0.05);
    }
  }
  kick(t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.3);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(g); g.connect(this.drumBus); o.start(t); o.stop(t + 0.5);
  }
  tom(t, f, vol = 0.32) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.35);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g); g.connect(this.drumBus); g.connect(this.verb); o.start(t); o.stop(t + 0.55);
  }
  hat(t, vol) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    s.connect(f); f.connect(g); g.connect(this.drumBus); s.start(t, Math.random() * 0.5, 0.08);
  }

  // ---------------------------------------------------------------
  //  Состояние игры (вызывается каждый кадр)
  // ---------------------------------------------------------------
  update(run, menuKind) {
    if (!this.ctx) return;
    const mood = run ? run.ch.decor : 'menu';
    if (mood !== this.mood) { this.mood = mood; this.melodyPos = 3; this.setChord(this.chordIdx); }
    this.paused = !!(run && run.paused);
    this.boss = !!(run && run.boss);
    if (run) {
      const k = Math.min(1, run.enemies.length / 220);
      this.intensity += (k - this.intensity) * 0.02;
    } else this.intensity *= 0.98;
    if (this.gemT > 0) this.gemT -= 1 / 60; else this.gemCombo = 0;
  }

  // ---------------------------------------------------------------
  //  Эффекты
  // ---------------------------------------------------------------
  ok(name) {
    if (!this.ctx || !this.sfxOn || this.ctx.state !== 'running') return false;
    const t = this.ctx.currentTime, g = GAP[name] || 0.05;
    if (this.last[name] && t - this.last[name] < g) return false;
    this.last[name] = t;
    return true;
  }
  env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  tone(type, f0, f1, dur, vol, { a = 0.005, verb = 0, filter = 0, at = 0, detune = 0 } = {}) {
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    o.detune.value = detune;
    this.env(g, t, a, vol, dur);
    let n = o;
    if (filter) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); n = f; }
    n.connect(g); g.connect(this.sfx); if (verb) { const s = c.createGain(); s.gain.value = verb; g.connect(s); s.connect(this.verb); }
    o.start(t); o.stop(t + a + dur + 0.05);
  }
  burst(dur, vol, { type = 'bandpass', f0 = 1000, f1 = 1000, q = 1, a = 0.005, verb = 0, at = 0 } = {}) {
    const c = this.ctx, t = c.currentTime + at, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.env(g, t, a, vol, dur);
    s.connect(f); f.connect(g); g.connect(this.sfx); if (verb) { const v = this.ctx.createGain(); v.gain.value = verb; g.connect(v); v.connect(this.verb); }
    s.start(t, Math.random() * 0.4, a + dur + 0.05);
  }

  play(name, val = 0) {
    if (!this.ok(name)) return;
    const R = (a, b) => a + Math.random() * (b - a);
    switch (name) {
      case 'bolt': this.tone('triangle', R(900, 1100), 420, 0.12, 0.06, { verb: 0.3 }); this.tone('sine', 1800, 900, 0.08, 0.025); break;
      case 'shard': for (let i = 0; i < 3; i++) this.tone('sine', R(2200, 3400), R(1800, 2600), 0.18, 0.025, { at: i * 0.025, verb: 0.5 }); break;
      case 'orb': this.tone('sine', 180, 90, 0.4, 0.09, { a: 0.03, verb: 0.4 }); this.burst(0.35, 0.04, { type: 'lowpass', f0: 400, f1: 1200, a: 0.05 }); break;
      case 'zap':
        this.burst(0.12, 0.14, { type: 'bandpass', f0: 3200, f1: 1400, q: 2 });
        this.tone('sawtooth', R(200, 260), 80, 0.12, 0.05, { filter: 2400 });
        this.burst(0.25, 0.05, { type: 'highpass', f0: 4000, f1: 6000, at: 0.03, verb: 0.4 });
        break;
      case 'nova': this.burst(0.6, 0.16, { type: 'lowpass', f0: 300, f1: 2200, a: 0.04, verb: 0.4 }); this.tone('sine', 90, 50, 0.5, 0.12); break;
      case 'freeze': this.burst(0.8, 0.1, { type: 'highpass', f0: 2500, f1: 7000, a: 0.02, verb: 0.6 }); for (let i = 0; i < 6; i++) this.tone('sine', R(2500, 4200), R(2000, 3000), 0.4, 0.03, { at: i * 0.04, verb: 0.6 }); break;
      case 'blade': this.burst(0.09, 0.07, { type: 'bandpass', f0: 2600, f1: 900, q: 3 }); break;
      case 'boom': this.tone('sine', 140, 38, 0.55, 0.22); this.burst(0.5, 0.14, { type: 'lowpass', f0: 1800, f1: 200, verb: 0.35 }); break;
      case 'hit': this.burst(0.05, 0.05, { type: 'bandpass', f0: R(500, 900), q: 1.5 }); break;
      case 'death': this.tone('triangle', R(260, 340), 70, 0.16, 0.05); this.burst(0.12, 0.04, { type: 'lowpass', f0: 1200, f1: 300 }); break;
      case 'gem': {
        this.gemCombo = Math.min(14, this.gemCombo + 1); this.gemT = 0.6;
        const deg = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24][this.gemCombo];
        this.tone('sine', mtof(84 + deg), mtof(84 + deg), 0.09, 0.035, { verb: 0.25 });
        break;
      }
      case 'level': [0, 3, 7, 12, 15].forEach((s, i) => this.tone('triangle', mtof(64 + s), mtof(64 + s), 0.9, 0.07, { at: i * 0.07, verb: 0.7 })); this.burst(1.0, 0.04, { type: 'highpass', f0: 5000, f1: 9000, a: 0.2, verb: 0.6 }); break;
      case 'hurt': this.tone('sawtooth', 160, 60, 0.25, 0.12, { filter: 900 }); this.burst(0.15, 0.1, { type: 'lowpass', f0: 900, f1: 200 }); break;
      case 'heart':
        this.tone('sine', 70, 30, 1.4, 0.35);
        this.burst(1.4, 0.25, { type: 'lowpass', f0: 200, f1: 4000, a: 0.08, verb: 0.8 });
        [0, 7, 12, 15, 19].forEach((s, i) => this.tone('sawtooth', mtof(45 + s), mtof(45 + s), 1.8, 0.035, { at: 0.05 + i * 0.02, verb: 0.9, filter: 1600 }));
        break;
      case 'roar':
        for (const d of [-14, 0, 9]) this.tone('sawtooth', 70, 42, 1.8, 0.12, { a: 0.25, filter: 500, detune: d * 10, verb: 0.6 });
        this.burst(1.8, 0.12, { type: 'lowpass', f0: 500, f1: 150, a: 0.3, verb: 0.6 });
        break;
      case 'phase': this.tone('sine', 98, 96, 3, 0.25, { verb: 1 }); this.tone('sine', 196.5, 195, 2.5, 0.1, { verb: 1 }); this.tone('sine', 294, 290, 2, 0.06, { verb: 1 }); this.burst(0.4, 0.1, { type: 'lowpass', f0: 800, f1: 200 }); break;
      case 'warn': this.tone('square', 440, 660, 0.18, 0.025, { filter: 1500 }); break;
      case 'crack': this.burst(0.18, 0.12, { type: 'bandpass', f0: 1800, f1: 600, q: 0.8 }); this.tone('triangle', 300, 120, 0.12, 0.05); for (let i = 0; i < 3; i++) this.burst(0.05, 0.05, { type: 'highpass', f0: 3000, at: 0.04 + i * 0.03 }); break;
      case 'chime': [0, 4, 7, 11, 14].forEach((s, i) => this.tone('sine', mtof(76 + s), mtof(76 + s), 1.6, 0.05, { at: i * 0.09, verb: 0.9 })); break;
      case 'heal': this.tone('sine', 520, 780, 0.35, 0.06, { verb: 0.5 }); this.tone('sine', 780, 1040, 0.35, 0.04, { at: 0.08, verb: 0.5 }); break;
      case 'power': this.tone('sawtooth', 220, 880, 0.6, 0.06, { filter: 2000, verb: 0.6 }); this.burst(0.6, 0.06, { type: 'bandpass', f0: 600, f1: 4000, verb: 0.5 }); break;
      case 'ui': this.tone('sine', 1200, 900, 0.05, 0.03); break;
      case 'event': this.tone('sawtooth', 110, 110, 1.2, 0.08, { a: 0.2, filter: 700, verb: 0.8 }); this.tone('sawtooth', 165, 165, 1.0, 0.05, { a: 0.25, filter: 700, verb: 0.8 }); break;
      case 'eshot': this.tone('sine', R(500, 700), 250, 0.12, 0.025); break;
      case 'victory': [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone('triangle', mtof(57 + s), mtof(57 + s), 2.4, 0.07, { at: i * 0.12, verb: 0.9 })); break;
      case 'defeat': [12, 8, 5, 0].forEach((s, i) => this.tone('sawtooth', mtof(45 + s), mtof(45 + s), 1.6, 0.05, { at: i * 0.35, filter: 900, verb: 0.9 })); break;
    }
  }
}

export const Sound = new SoundEngine();
