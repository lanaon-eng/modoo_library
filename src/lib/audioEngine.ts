export type TrackId = 'rain' | 'lofi' | 'cafe';

export type Track = {
  id: TrackId;
  title: string;
  subtitle: string;
  emoji: string;
};

export const TRACKS: Track[] = [
  { id: 'rain', title: 'Rainy Day', subtitle: '빗소리와 잔잔한 피아노', emoji: '🌧️' },
  { id: 'lofi', title: 'Lo-Fi Study', subtitle: '힙한 로파이 비트', emoji: '🎧' },
  { id: 'cafe', title: 'Cafe Ambience', subtitle: '따뜻한 카페 백색소음', emoji: '☕' },
];

type ActiveSound = {
  nodes: AudioNode[];
  cleanup: () => void;
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private active: ActiveSound | null = null;
  private currentTrack: TrackId | null = null;
  private volume = 0.5;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  getVolume() {
    return this.volume;
  }

  isPlaying() {
    return this.active !== null;
  }

  getCurrentTrack() {
    return this.currentTrack;
  }

  play(track: TrackId) {
    const ctx = this.ensureContext();
    this.stopInternal();

    const sound = this.createTrack(ctx, track);
    this.active = sound;
    this.currentTrack = track;
  }

  stop() {
    this.stopInternal();
    this.currentTrack = null;
  }

  private stopInternal() {
    if (this.active) {
      this.active.cleanup();
      this.active = null;
    }
  }

  private createTrack(ctx: AudioContext, track: TrackId): ActiveSound {
    switch (track) {
      case 'rain':
        return this.createRain(ctx);
      case 'lofi':
        return this.createLofi(ctx);
      case 'cafe':
        return this.createCafe(ctx);
    }
  }

  // --- Rainy Day: white noise filtered to rain + soft piano pad ---
  private createRain(ctx: AudioContext): ActiveSound {
    const nodes: AudioNode[] = [];
    const stoppers: (() => void)[] = [];

    // Rain: filtered noise
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1800;
    noiseFilter.Q.value = 0.5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.35;

    noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain!);
    noise.start();
    nodes.push(noise, noiseFilter, noiseGain);

    // Soft piano pad: slow chord progression
    const chordSets = [
      [261.63, 329.63, 392.0], // C major
      [220.0, 277.18, 329.63], // A minor
      [196.0, 246.94, 293.66], // G major
      [174.61, 220.0, 261.63], // F major
    ];
    let chordIdx = 0;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.12;
    padGain.connect(this.masterGain!);
    nodes.push(padGain);

    const playChord = () => {
      if (!this.active) return;
      const chord = chordSets[chordIdx % chordSets.length];
      chordIdx++;
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 2);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 6);
        osc.connect(g).connect(padGain);
        osc.start();
        osc.stop(ctx.currentTime + 6.5);
        nodes.push(osc, g);
      });
    };
    playChord();
    const interval = window.setInterval(playChord, 6000);
    stoppers.push(() => window.clearInterval(interval));

    return {
      nodes,
      cleanup: () => {
        stoppers.forEach((s) => s());
        nodes.forEach((n) => {
          try {
            if ('stop' in n) (n as AudioBufferSourceNode).stop();
          } catch {
            // already stopped
          }
          try {
            n.disconnect();
          } catch {
            // already disconnected
          }
        });
      },
    };
  }

  // --- Lo-Fi Study: slow drum-ish beat + bass + melody ---
  private createLofi(ctx: AudioContext): ActiveSound {
    const nodes: AudioNode[] = [];
    const stoppers: (() => void)[] = [];

    const bpm = 75;
    const beatDur = 60 / bpm;

    // Master compression-ish gain
    const musicGain = ctx.createGain();
    musicGain.gain.value = 0.5;
    musicGain.connect(this.masterGain!);
    nodes.push(musicGain);

    // Kick drum
    const playKick = (time: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
      g.gain.setValueAtTime(0.7, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(g).connect(musicGain);
      osc.start(time);
      osc.stop(time + 0.2);
      nodes.push(osc, g);
    };

    // Hi-hat (filtered noise burst)
    const bufferSize = ctx.sampleRate * 0.1;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const playHat = (time: number) => {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.15, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      noise.connect(filter).connect(g).connect(musicGain);
      noise.start(time);
      noise.stop(time + 0.06);
      nodes.push(noise, filter, g);
    };

    // Bass
    const bassNotes = [55.0, 55.0, 73.42, 65.41]; // A1, A1, D2, C2
    const playBass = (time: number, freq: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(0.25, time + 0.02);
      g.gain.linearRampToValueAtTime(0, time + beatDur * 0.8);
      osc.connect(g).connect(musicGain);
      osc.start(time);
      osc.stop(time + beatDur);
      nodes.push(osc, g);
    };

    // Melody (lo-fi-ish sine)
    const melodyNotes = [440.0, 0, 523.25, 0, 392.0, 440.0, 0, 329.63];
    const playMelody = (time: number, freq: number) => {
      if (freq === 0) return;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(0.18, time + 0.05);
      g.gain.linearRampToValueAtTime(0, time + beatDur * 0.9);
      osc.connect(g).connect(musicGain);
      osc.start(time);
      osc.stop(time + beatDur);
      nodes.push(osc, g);
    };

    let step = 0;
    const scheduleStep = () => {
      if (!this.active) return;
      const time = ctx.currentTime + 0.05;
      const s = step % 8;

      // Kick on 1 and 5
      if (s === 0 || s === 4) playKick(time);
      // Hat on offbeats
      if (s % 2 === 1) playHat(time);
      // Bass each beat
      playBass(time, bassNotes[s % bassNotes.length]);
      // Melody
      playMelody(time, melodyNotes[s]);

      step++;
    };
    scheduleStep();
    const interval = window.setInterval(scheduleStep, beatDur * 1000);
    stoppers.push(() => window.clearInterval(interval));

    return {
      nodes,
      cleanup: () => {
        stoppers.forEach((s) => s());
        nodes.forEach((n) => {
          try {
            if ('stop' in n) (n as AudioBufferSourceNode).stop();
          } catch {
            // already stopped
          }
          try {
            n.disconnect();
          } catch {
            // already disconnected
          }
        });
      },
    };
  }

  // --- Cafe Ambience: brown noise + occasional cup clinks ---
  private createCafe(ctx: AudioContext): ActiveSound {
    const nodes: AudioNode[] = [];
    const stoppers: (() => void)[] = [];

    // Brown noise for ambient cafe murmur
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 500;
    noiseFilter.Q.value = 0.3;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.3;

    noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain!);
    noise.start();
    nodes.push(noise, noiseFilter, noiseGain);

    // Occasional cup clink
    const playClink = () => {
      if (!this.active) return;
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 + Math.random() * 1000, time);
      osc.frequency.exponentialRampToValueAtTime(800, time + 0.15);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.08, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      osc.connect(g).connect(this.masterGain!);
      osc.start(time);
      osc.stop(time + 0.25);
      nodes.push(osc, g);
    };
    const interval = window.setInterval(playClink, 4000 + Math.random() * 3000);
    stoppers.push(() => window.clearInterval(interval));

    return {
      nodes,
      cleanup: () => {
        stoppers.forEach((s) => s());
        nodes.forEach((n) => {
          try {
            if ('stop' in n) (n as AudioBufferSourceNode).stop();
          } catch {
            // already stopped
          }
          try {
            n.disconnect();
          } catch {
            // already disconnected
          }
        });
      },
    };
  }

  dispose() {
    this.stopInternal();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }
}
