// Синтезатор треков на Web Audio: у каждого жанра свой ритм, бас и гармония.
// Внешние аудиофайлы на странице недоступны, поэтому музыка генерируется в браузере.

export type Genre = 'indie' | 'electro' | 'jazz' | 'hiphop' | 'lofi' | 'synthwave' | 'house' | 'ambient' | 'bossa' | 'dnb' | 'funk'

export interface Track {
  id: string
  title: string
  artist: string
  genre: Genre | 'file'
  hue: number
  bpm: number
  root: number // MIDI-нота тоники
  bars: number
  url?: string // для загруженного файла или онлайн-трека
  source?: 'audius' | 'itunes' | 'radio' // онлайн-трек: играет напрямую, без Web Audio
  cover?: string
  seconds?: number // длительность загруженного файла, если известна
}

const STEPS_PER_BAR = 16

// Прогрессии аккордов в ступенях (полутоны от тоники), по 4 такта.
const PROGRESSIONS: Record<Genre, number[][]> = {
  indie: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], // I V vi IV
  electro: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]], // i VI III VII
  jazz: [[2, 5, 9, 12], [7, 11, 14, 17], [0, 4, 7, 11], [9, 12, 16, 19]], // ii7 V7 Imaj7 vi7
  hiphop: [[0, 3, 7, 10], [5, 8, 12, 15], [8, 12, 15, 19], [7, 10, 14, 17]],
  lofi: [[5, 9, 12, 16], [4, 7, 11, 14], [2, 5, 9, 12], [0, 4, 7, 11]], // IVmaj7 iii7 ii7 Imaj7
  synthwave: [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 11, 14]], // i VI iv V
  house: [[0, 3, 7, 10], [5, 8, 12, 15], [0, 3, 7, 10], [7, 10, 14, 17]],
  ambient: [[0, 7, 12, 16], [5, 12, 16, 21], [9, 12, 16, 21], [7, 11, 14, 19]],
  bossa: [[2, 5, 9, 12], [7, 11, 14, 17], [0, 4, 7, 11], [0, 4, 7, 11]],
  dnb: [[0, 3, 7], [8, 12, 15], [10, 14, 17], [5, 8, 12]],
  funk: [[0, 4, 7, 10], [0, 4, 7, 10], [5, 9, 12, 15], [7, 11, 14, 17]], // I7 I7 IV7 V7
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

export function trackDuration(t: Track) {
  return (t.bars * 4 * 60) / t.bpm
}

export class Engine {
  ctx: AudioContext | null = null
  master!: GainNode
  analyser!: AnalyserNode
  private noise!: AudioBuffer
  private timer: number | null = null
  private track: Track | null = null
  private startedAt = 0 // ctx.currentTime, соответствующий позиции 0
  private nextStep = 0
  private nextTime = 0
  private audio: HTMLAudioElement | null = null
  private mediaNodes = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>()
  private pausedAt = 0
  playing = false
  private vol = 0.8
  private direct = false
  onEnded: (() => void) | null = null

  private ensure() {
    if (this.ctx) return this.ctx
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0.8
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 128
    this.analyser.smoothingTimeConstant = 0.8
    this.master.connect(this.analyser)
    this.analyser.connect(ctx.destination)
    const len = ctx.sampleRate
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    return ctx
  }

  setVolume(v: number) {
    this.vol = v
    if (this.audio && this.direct) this.audio.volume = v
    this.ensure()
    this.master.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.02)
  }

  get position() {
    if (!this.track) return 0
    if (this.audio) return this.audio.currentTime
    if (!this.playing) return this.pausedAt
    return Math.max(0, this.ctx!.currentTime - this.startedAt)
  }

  duration(t = this.track) {
    if (!t) return 0
    if (t.genre === 'file') return this.audio && isFinite(this.audio.duration) ? this.audio.duration : 0
    return trackDuration(t)
  }

  load(t: Track) {
    this.stop()
    this.track = t
    this.pausedAt = 0
    this.direct = !!t.source
    if (t.genre === 'file' && t.url && t.source) {
      // Чужой сервер может не отдавать CORS-заголовки, а тогда Web Audio играет тишину.
      const el = new Audio(t.url)
      el.volume = this.vol
      el.onended = () => { this.playing = false; this.onEnded?.() }
      this.audio = el
    } else if (t.genre === 'file' && t.url) {
      const ctx = this.ensure()
      const el = new Audio(t.url)
      el.onended = () => { this.playing = false; this.onEnded?.() }
      let node = this.mediaNodes.get(el)
      if (!node) { node = ctx.createMediaElementSource(el); this.mediaNodes.set(el, node) }
      node.connect(this.master)
      this.audio = el
    }
  }

  async play(from = this.pausedAt) {
    if (!this.track) return
    const ctx = this.ensure()
    if (ctx.state === 'suspended') await ctx.resume()
    this.playing = true
    if (this.audio) {
      this.audio.currentTime = from
      await this.audio.play().catch(() => { this.playing = false })
      return
    }
    const stepDur = 60 / this.track.bpm / 4
    this.startedAt = ctx.currentTime + 0.05 - from
    this.nextStep = Math.ceil(from / stepDur)
    this.nextTime = this.startedAt + this.nextStep * stepDur
    this.tick()
    this.timer = window.setInterval(() => this.tick(), 25)
  }

  pause() {
    this.pausedAt = this.position
    this.playing = false
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null }
    this.audio?.pause()
  }

  seek(sec: number) {
    const was = this.playing
    this.pause()
    this.pausedAt = Math.max(0, Math.min(sec, this.duration() - 0.1))
    if (this.audio) this.audio.currentTime = this.pausedAt
    if (was) this.play(this.pausedAt)
  }

  stop() {
    this.pause()
    if (this.audio) { this.audio.pause(); this.audio.src = ''; this.audio = null }
    this.pausedAt = 0
  }

  // Планировщик с запасом 120 мс: ставит в очередь все шаги, попадающие в окно.
  private tick() {
    const t = this.track
    const ctx = this.ctx
    if (!t || !ctx || !this.playing) return
    const stepDur = 60 / t.bpm / 4
    const total = t.bars * STEPS_PER_BAR
    while (this.nextTime < ctx.currentTime + 0.12) {
      if (this.nextStep >= total) {
        this.pause()
        this.pausedAt = 0
        this.onEnded?.()
        return
      }
      this.step(t, this.nextStep, this.nextTime, stepDur)
      this.nextStep++
      this.nextTime += stepDur
    }
  }

  private step(t: Track, n: number, time: number, sd: number) {
    const s = n % STEPS_PER_BAR
    const bar = Math.floor(n / STEPS_PER_BAR)
    const chord = PROGRESSIONS[t.genre as Genre][bar % 4].map((x) => x + t.root)
    const intro = bar < 2
    const outro = bar >= t.bars - 1
    // Свинг для джаза и хип-хопа: слабые шестнадцатые чуть позже.
    const swing = ['jazz', 'hiphop', 'lofi'].includes(t.genre) && s % 2 === 1 ? sd * 0.28 : 0
    const at = time + swing

    switch (t.genre) {
      case 'indie':
        if (!intro && (s === 0 || s === 8 || s === 10)) this.kick(at, 0.9)
        if (!intro && (s === 4 || s === 12)) this.snare(at, 0.5)
        if (s % 2 === 0) this.hat(at, 0.12, 0.04)
        if (s % 2 === 0) this.note(at, chord[0] - 24, sd * 1.8, 'triangle', 0.32, 700)
        if (s === 0 || s === 6 || s === 10) chord.forEach((m) => this.note(at, m, sd * 3, 'sawtooth', 0.05, 1800))
        if (!outro && bar % 2 === 1 && (s === 2 || s === 5 || s === 8 || s === 12)) this.note(at, chord[((s / 3) | 0) % chord.length] + 12, sd * 2, 'square', 0.04, 2400)
        break
      case 'electro':
        if (s % 4 === 0 && !(intro && bar === 0)) this.kick(at, 1)
        if (s === 4 || s === 12) this.clap(at, 0.35)
        if (s % 4 === 2) this.hat(at, 0.2, 0.12)
        if (s % 4 === 2) this.note(at, chord[0] - 24, sd * 1.5, 'sawtooth', 0.22, 500)
        if (!intro) this.note(at, chord[s % chord.length] + 12 + (s >= 8 ? 12 : 0), sd * 0.9, 'square', 0.035, 3200)
        if (s === 0) chord.forEach((m) => this.note(at, m, sd * 16, 'sawtooth', 0.03, 900))
        break
      case 'jazz':
        if (s % 4 === 0 || s % 4 === 3) this.ride(at, s % 4 === 0 ? 0.1 : 0.06)
        if (s === 4 || s === 12) this.hat(at, 0.08, 0.05)
        if (s % 4 === 0) this.note(at, chord[(s / 4) % chord.length] - 24, sd * 3.6, 'triangle', 0.35, 900)
        if (s === 0 || s === 7 || s === 10) chord.forEach((m) => this.note(at, m, sd * (s === 0 ? 5 : 2.5), 'sine', 0.09, 3000))
        if (!intro && bar % 2 === 0 && [2, 3, 6, 11, 14].includes(s)) this.note(at, chord[(s * 3) % chord.length] + 12, sd * 1.5, 'sine', 0.05, 4000)
        break
      case 'hiphop':
        if (!intro && (s === 0 || s === 7 || s === 10)) this.kick(at, 1)
        if (!intro && (s === 4 || s === 12)) this.snare(at, 0.45)
        this.hat(at, s % 2 === 0 ? 0.1 : 0.05, 0.03)
        if (s === 0 || s === 10) this.note(at, chord[0] - 24, sd * 5, 'sine', 0.5, 300)
        if (s === 0) chord.forEach((m) => this.note(at, m, sd * 15, 'triangle', 0.05, 1200))
        if (!outro && [3, 6, 9, 14].includes(s)) this.note(at, chord[s % chord.length] + 12, sd * 2, 'sine', 0.06, 2600)
        break
      case 'lofi':
        if (!intro && (s === 0 || s === 10)) this.kick(at, 0.6)
        if (!intro && (s === 4 || s === 12)) this.snare(at, 0.22)
        if (s % 2 === 0) this.hat(at, 0.05, 0.03)
        this.noiseHit(at, 0.012 + Math.random() * 0.01, 0.05, 'bandpass', 3000) // треск винила
        if (s === 0) chord.forEach((m) => this.note(at, m, sd * 15, 'sine', 0.07, 1400, 0.08))
        if (s === 0 || s === 8) this.note(at, chord[0] - 24, sd * 6, 'sine', 0.35, 250)
        if (!outro && bar % 2 === 1 && [2, 6, 9].includes(s)) this.note(at, chord[s % chord.length] + 12, sd * 3, 'triangle', 0.04, 1800)
        break
      case 'synthwave':
        if (!intro && (s === 0 || s === 8)) this.kick(at, 0.9)
        if (!intro && (s === 4 || s === 12)) { this.snare(at, 0.5); this.clap(at, 0.2) }
        if (s % 2 === 0) this.hat(at, 0.08, 0.05)
        if (s % 2 === 0) this.note(at, chord[0] - 24 + (s % 4 === 2 ? 12 : 0), sd * 1.6, 'sawtooth', 0.18, 700)
        if (s === 0) chord.forEach((m) => this.note(at, m, sd * 16, 'sawtooth', 0.035, 1600, 0.3))
        if (!intro) this.note(at, chord[s % chord.length] + 24, sd * 0.8, 'square', 0.025, 2800)
        break
      case 'house':
        if (s % 4 === 0) this.kick(at, 1)
        if (s === 4 || s === 12) this.clap(at, 0.3)
        if (s % 4 === 2) this.hat(at, 0.18, 0.15)
        if (s % 2 === 1) this.hat(at, 0.05, 0.02)
        if (s % 4 === 2) this.note(at, chord[0] - 24, sd * 1.4, 'sawtooth', 0.2, 450)
        if (!intro && [3, 6, 10].includes(s)) chord.forEach((m) => this.note(at, m + 12, sd * 1.2, 'triangle', 0.06, 3200))
        break
      case 'ambient':
        if (s === 0) chord.forEach((m, i) => this.note(at + i * 0.08, m, sd * 18, 'sine', 0.07, 1800, 1.2))
        if (s === 0) this.note(at, chord[0] - 12, sd * 18, 'triangle', 0.08, 500, 1.5)
        if ([6, 11].includes(s) && bar % 2 === 0) this.note(at, chord[(s + bar) % chord.length] + 24, sd * 8, 'sine', 0.035, 5000)
        break
      case 'bossa':
        if ([0, 3, 6, 10, 13].includes(s)) this.noiseHit(at, 0.12, 0.03, 'bandpass', 2500) // римшот
        if (s % 2 === 0) this.hat(at, 0.04, 0.03)
        if (s === 0 || s === 8) this.note(at, chord[0] - 24, sd * 3, 'triangle', 0.35, 800)
        if (s === 6 || s === 14) this.note(at, chord[0] - 17, sd * 2, 'triangle', 0.3, 800)
        if ([2, 5, 8, 11, 14].includes(s)) chord.forEach((m) => this.note(at, m, sd * 1.6, 'triangle', 0.045, 2600))
        break
      case 'dnb':
        if (s === 0 || s === 10) this.kick(at, 1)
        if (s === 4 || s === 12) this.snare(at, 0.55)
        if (s === 7 || s === 14) this.snare(at, 0.15)
        this.hat(at, s % 2 === 0 ? 0.1 : 0.05, 0.03)
        if (s === 0) this.note(at, chord[0] - 24, sd * 14, 'sine', 0.45, 200)
        if (s === 0) chord.forEach((m) => this.note(at, m + 12, sd * 16, 'sawtooth', 0.025, 1200, 0.4))
        break
      case 'funk':
        if (!intro && (s === 0 || s === 3 || s === 10)) this.kick(at, 0.95)
        if (!intro && (s === 4 || s === 12)) this.snare(at, 0.5)
        this.hat(at, s % 4 === 2 ? 0.12 : 0.05, 0.03)
        if ([0, 3, 6, 7, 10, 13].includes(s)) this.note(at, chord[0] - 24 + (s === 7 || s === 13 ? 12 : 0), sd * 0.9, 'sawtooth', 0.26, 900)
        if ([2, 6, 14].includes(s)) chord.forEach((m) => this.note(at, m + 12, sd * 0.6, 'square', 0.03, 2600))
        break
    }
  }

  private env(g: GainNode, at: number, peak: number, dur: number) {
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(peak, at + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  }

  private note(at: number, midi: number, dur: number, type: OscillatorType, vol: number, cutoff: number, attack = 0) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const f = ctx.createBiquadFilter()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = mtof(midi)
    f.type = 'lowpass'
    f.frequency.value = cutoff
    if (attack > 0) {
      g.gain.setValueAtTime(0.0001, at)
      g.gain.linearRampToValueAtTime(vol, at + attack)
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    } else this.env(g, at, vol, dur)
    o.connect(f).connect(g).connect(this.master)
    o.start(at)
    o.stop(at + dur + 0.05)
  }

  private kick(at: number, vol: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.setValueAtTime(140, at)
    o.frequency.exponentialRampToValueAtTime(40, at + 0.14)
    this.env(g, at, vol, 0.3)
    o.connect(g).connect(this.master)
    o.start(at)
    o.stop(at + 0.35)
  }

  private noiseHit(at: number, vol: number, dur: number, type: BiquadFilterType, freq: number) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    const g = ctx.createGain()
    this.env(g, at, vol, dur)
    src.connect(f).connect(g).connect(this.master)
    src.start(at, Math.random() * 0.5)
    src.stop(at + dur + 0.05)
  }

  private snare(at: number, vol: number) {
    this.noiseHit(at, vol, 0.18, 'highpass', 1500)
    this.note(at, 50, 0.08, 'triangle', vol * 0.4, 2000)
  }
  private clap(at: number, vol: number) {
    ;[0, 0.012, 0.024].forEach((d) => this.noiseHit(at + d, vol, 0.12, 'bandpass', 1600))
  }
  private hat(at: number, vol: number, dur: number) {
    this.noiseHit(at, vol, dur, 'highpass', 7500)
  }
  private ride(at: number, vol: number) {
    this.noiseHit(at, vol, 0.35, 'bandpass', 6000)
  }
}

export const engine = new Engine()
