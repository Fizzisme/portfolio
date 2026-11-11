/**
 * Fizz FM: lo-fi generated live with the Web Audio API.
 * No audio files, so nothing to license. Starts only after a user gesture.
 */
import { stage } from "./stage";

type Station = { name: string; bpm: number; chords: number[][]; bass: number[] };

export const STATIONS: Station[] = [
  {
    name: "Midnight desk",
    bpm: 72,
    chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],
    bass: [41, 40, 38, 36],
  },
  {
    name: "Rain on the window",
    bpm: 66,
    chords: [[57, 60, 64, 67], [50, 53, 57, 60, 64], [55, 59, 62, 65], [48, 52, 55, 59]],
    bass: [45, 38, 43, 36],
  },
  {
    name: "First light",
    bpm: 80,
    chords: [[49, 53, 56, 60], [48, 51, 55, 58], [46, 49, 53, 56], [44, 48, 51, 55]],
    bass: [37, 36, 34, 32],
  },
];

const PENTA = [0, 2, 4, 7, 9];
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class Lofi {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private drums!: GainNode;
  private keysFilter!: BiquadFilterNode;
  private wobble!: GainNode;
  private noise!: AudioBuffer;
  private rainGain!: GainNode;
  private crackleGain!: GainNode;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private bar = 0;
  playing = false;
  volume = 0.7;
  rain = 0.35;
  crackle = true;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((f) => f());
  }

  private init() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    const tape = ctx.createBiquadFilter();
    tape.type = "lowpass";
    tape.frequency.value = 4200;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.6;
    this.master.connect(tape).connect(comp).connect(this.analyser).connect(ctx.destination);

    this.music = ctx.createGain();
    this.music.gain.value = 0;
    this.music.connect(this.master);
    this.keysFilter = ctx.createBiquadFilter();
    this.keysFilter.type = "lowpass";
    this.keysFilter.frequency.value = 1900;
    this.keysFilter.connect(this.music);
    this.drums = ctx.createGain();
    this.drums.gain.value = 0.55;
    this.drums.connect(this.music);

    // tape wow: one slow LFO on every keys oscillator's detune
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.45;
    this.wobble = ctx.createGain();
    this.wobble.gain.value = 7;
    lfo.connect(this.wobble);
    lfo.start();

    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // rain: brown-ish noise, filtered
    const brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const bd = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      bd[i] = last * 3.2 + (Math.random() * 2 - 1) * 0.04;
    }
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = brown;
    rainSrc.loop = true;
    const rainHp = ctx.createBiquadFilter();
    rainHp.type = "highpass";
    rainHp.frequency.value = 180;
    const rainLp = ctx.createBiquadFilter();
    rainLp.type = "lowpass";
    rainLp.frequency.value = 1400;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    rainSrc.connect(rainHp).connect(rainLp).connect(this.rainGain).connect(this.master);
    rainSrc.start();

    // vinyl crackle: sparse clicks over a quiet hiss
    const cr = ctx.createBuffer(1, len, ctx.sampleRate);
    const cd = cr.getChannelData(0);
    for (let i = 0; i < len; i++) {
      cd[i] = (Math.random() * 2 - 1) * 0.012;
      if (Math.random() < 0.0004) cd[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const crSrc = ctx.createBufferSource();
    crSrc.buffer = cr;
    crSrc.loop = true;
    const crLp = ctx.createBiquadFilter();
    crLp.type = "lowpass";
    crLp.frequency.value = 5000;
    this.crackleGain = ctx.createGain();
    this.crackleGain.gain.value = 0;
    crSrc.connect(crLp).connect(this.crackleGain).connect(this.master);
    crSrc.start();
  }

  async play(ambientOnly = false) {
    this.init();
    const ctx = this.ctx!;
    if (ctx.state === "suspended") await ctx.resume();
    const now = ctx.currentTime;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.setTargetAtTime(ambientOnly ? 0 : 1, now, 0.4);
    this.rainGain.gain.setTargetAtTime(this.rain * 0.9, now, 0.6);
    this.crackleGain.gain.setTargetAtTime(this.crackle ? 0.5 : 0, now, 0.4);
    this.nextTime = now + 0.08;
    this.step = 0;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = ambientOnly ? null : window.setInterval(() => this.schedule(), 25);
    this.playing = true;
    this.emit();
  }

  pause() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(0, now, 0.25);
    this.rainGain.gain.setTargetAtTime(0, now, 0.4);
    this.crackleGain.gain.setTargetAtTime(0, now, 0.25);
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.playing = false;
    stage.audioLevel = 0;
    this.emit();
  }

  toggle() {
    return this.playing ? this.pause() : this.play();
  }

  nextStation(direction = 1) {
    stage.station = (stage.station + direction + STATIONS.length) % STATIONS.length;
    this.bar = 0;
    this.emit();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    this.emit();
  }

  setRain(v: number) {
    this.rain = v;
    if (this.ctx && this.playing) this.rainGain.gain.setTargetAtTime(v * 0.9, this.ctx.currentTime, 0.2);
    this.emit();
  }

  setCrackle(on: boolean) {
    this.crackle = on;
    if (this.ctx && this.playing) this.crackleGain.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.2);
    this.emit();
  }

  /** Two soft notes for the focus timer. Works even while the music is paused. */
  chime() {
    this.init();
    const ctx = this.ctx!;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime + 0.05;
    [76, 81].forEach((n, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = hz(n);
      g.gain.setValueAtTime(0, t + i * 0.28);
      g.gain.linearRampToValueAtTime(0.25, t + i * 0.28 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.28 + 1.6);
      o.connect(g).connect(this.master);
      o.start(t + i * 0.28);
      o.stop(t + i * 0.28 + 1.7);
    });
  }

  private schedule() {
    const ctx = this.ctx!;
    const st = STATIONS[stage.station];
    const sixteenth = 60 / st.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.12) {
      const swing = this.step % 2 === 1 ? sixteenth * 0.22 : 0;
      this.playStep(this.nextTime + swing, st, sixteenth);
      this.nextTime += sixteenth;
      this.step = (this.step + 1) % 16;
      if (this.step === 0) this.bar++;
    }
  }

  private playStep(t: number, st: Station, sx: number) {
    const s = this.step;
    const ci = this.bar % st.chords.length;
    const chord = st.chords[ci];
    if (s === 0) chord.forEach((n, i) => this.keys(n, t + i * 0.018, sx * 14, 0.55));
    if (s === 10 && Math.random() < 0.5) chord.slice(1).forEach((n, i) => this.keys(n + 12, t + i * 0.012, sx * 4, 0.22));
    if (s === 0 || s === 8) this.bass(st.bass[ci], t, sx * 6);
    if (s === 14 && Math.random() < 0.6) this.bass(st.bass[ci] + 7, t, sx * 1.5);
    if (s === 0 || s === 7 || s === 10) this.kick(t, s === 7 ? 0.55 : 1);
    if (s === 4 || s === 12) this.snare(t);
    if (s % 2 === 0) this.hat(t, 0.55 + Math.random() * 0.45);
    else if (Math.random() < 0.25) this.hat(t, 0.3);
    if (s % 2 === 0 && s !== 0 && Math.random() < 0.16) {
      const root = chord[0] + 12;
      const n = root + PENTA[Math.floor(Math.random() * PENTA.length)] + (Math.random() < 0.3 ? 12 : 0);
      this.keys(n, t, sx * 3, 0.3, true);
    }
  }

  private keys(note: number, t: number, dur: number, vel: number, bell = false) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const peak = vel * 0.16;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.9);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.35);
    g.connect(this.keysFilter);
    const types: OscillatorType[] = bell ? ["sine", "sine"] : ["triangle", "sine"];
    types.forEach((type, i) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = hz(note) * (i === 1 ? 2 : 1);
      this.wobble.connect(o.detune);
      o.onended = () => this.wobble.disconnect(o.detune);
      const og = ctx.createGain();
      og.gain.value = i === 1 ? (bell ? 0.3 : 0.12) : 1;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur + 2);
    });
  }

  private bass(note: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = hz(note);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.32, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.12, t + dur * 0.6);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.08);
    o.connect(g).connect(this.music);
    o.start(t);
    o.stop(t + dur + 0.6);
  }

  private kick(t: number, vel: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.85 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g).connect(this.drums);
    o.start(t);
    o.stop(t + 0.4);
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, gain: number, decay: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    src.connect(f).connect(g).connect(this.drums);
    src.start(t, Math.random() * 1.5);
    src.stop(t + decay + 0.02);
  }

  private snare(t: number) {
    this.noiseHit(t, "bandpass", 1700, 0.42, 0.2);
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 190;
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g).connect(this.drums);
    o.start(t);
    o.stop(t + 0.1);
  }

  private hat(t: number, vel: number) {
    this.noiseHit(t, "highpass", 7200, 0.09 * vel, 0.045);
  }
}

export const lofi = new Lofi();
