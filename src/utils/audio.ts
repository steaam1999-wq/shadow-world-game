import type { SoundId } from '../types';

/**
 * Tiny procedural sound engine on top of the Web Audio API.
 * No external assets — everything is synthesized.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicNodes: { stop: () => void } | null = null;
  soundOn = true;

  private ensure() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol = 0.5, delay = 0, slideTo?: number) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.4, filterFreq = 1200, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + delay;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  }

  play(id: SoundId) {
    if (!this.soundOn) return;
    switch (id) {
      case 'hit':
        this.noise(0.12, 0.5, 900);
        this.tone(140, 0.12, 'square', 0.25, 0, 60);
        break;
      case 'crit':
        this.noise(0.2, 0.7, 2500);
        this.tone(220, 0.25, 'sawtooth', 0.35, 0, 55);
        this.tone(880, 0.12, 'square', 0.15, 0.02, 440);
        break;
      case 'block':
        this.tone(1200, 0.15, 'triangle', 0.3);
        this.tone(1800, 0.2, 'sine', 0.2, 0.01);
        break;
      case 'miss':
        this.noise(0.18, 0.15, 3000);
        break;
      case 'heal':
        this.tone(520, 0.2, 'sine', 0.25);
        this.tone(780, 0.3, 'sine', 0.2, 0.08);
        break;
      case 'magic':
        this.tone(300, 0.35, 'sawtooth', 0.15, 0, 900);
        this.tone(600, 0.3, 'sine', 0.15, 0.05, 1200);
        break;
      case 'victory':
        [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.35, i * 0.12));
        this.tone(1046, 0.8, 'triangle', 0.3, 0.5);
        break;
      case 'defeat':
        [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.45, 'sawtooth', 0.2, i * 0.2));
        break;
      case 'loot':
        [880, 1175, 1568].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.25, i * 0.07));
        break;
      case 'levelup':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.3, i * 0.09));
        break;
      case 'achievement':
        [659, 880, 1318].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.3, i * 0.12));
        break;
      case 'coin':
        this.tone(1318, 0.08, 'square', 0.15);
        this.tone(1760, 0.15, 'square', 0.15, 0.06);
        break;
      case 'click':
        this.tone(600, 0.05, 'triangle', 0.12);
        break;
      case 'error':
        this.tone(160, 0.2, 'square', 0.2);
        break;
    }
  }

  setMusic(on: boolean) {
    if (!on) {
      this.musicNodes?.stop();
      this.musicNodes = null;
      return;
    }
    if (this.musicNodes) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    // Dark ambient drone: two detuned low oscillators through a slow filter + LFO.
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(filter.frequency);
    const oscs = [55, 55.4, 82.4, 110.2].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      o.connect(filter);
      o.start();
      return o;
    });
    filter.connect(g).connect(this.master);
    lfo.start();
    this.musicNodes = {
      stop: () => {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0, t + 1);
        setTimeout(() => {
          oscs.forEach((o) => o.stop());
          lfo.stop();
        }, 1100);
      },
    };
  }
}

export const audio = new AudioEngine();
