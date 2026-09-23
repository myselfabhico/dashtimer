// Dashtimer Web Audio Synthesizer Engine
// 100% self-contained, zero external audio assets required.

class DashtimerAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private activeAmbientNodes: { stop: () => void }[] = [];
  private currentAmbientTrack: string = 'none';
  private isMuted: boolean = false;
  private sfxEnabled: boolean = true;
  private tickEnabled: boolean = false;
  private ambientVolume: number = 0.5;
  private sfxVolume: number = 0.7;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setMasterVolume(vol: number) {
    this.setAmbientVolume(vol);
    this.setSfxVolume(vol);
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setTickEnabled(enabled: boolean) {
    this.tickEnabled = enabled;
  }

  public getAmbientVolume() { return this.ambientVolume; }
  public getSfxVolume() { return this.sfxVolume; }
  public isSfxEnabled() { return this.sfxEnabled; }
  public isTickEnabled() { return this.tickEnabled; }
  public getCurrentAmbientTrack() { return this.currentAmbientTrack; }

  // --- TACTILE SFX ---

  // Soft organic woodblock / warm switch click
  public playClick(pitchMultiplier: number = 1.0) {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400 * pitchMultiplier, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380 * pitchMultiplier, t);
      osc.frequency.exponentialRampToValueAtTime(120 * pitchMultiplier, t + 0.045);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.055);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  }

  // Soft subtle ticking sound
  public playTick() {
    if (!this.sfxEnabled || !this.tickEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.012);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.02);
    } catch {
      // quiet fail
    }
  }

  // Deep singing bowl / meditative brass chime for timer complete
  public playChime() {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const duration = 4.0;

      // Base frequencies for serene singing bowl: 432Hz root, 864Hz octave, 1296Hz 3rd harmonic
      const harmonics = [
        { freq: 432, gain: 0.45 },
        { freq: 864, gain: 0.25 },
        { freq: 1296, gain: 0.12 },
        { freq: 1728, gain: 0.05 },
      ];

      harmonics.forEach(({ freq, gain: hGain }) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        // Slight micro-pitch drift for organic warmth
        osc.frequency.linearRampToValueAtTime(freq * 0.998, t + duration);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(hGain, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + duration);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Delicate crystal lap chime for stopwatch
  public playLap() {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      [1174.66, 1760].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);

        gain.gain.setValueAtTime(0.0001, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.18, t + idx * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.04 + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.65);
      });
    } catch {
      // quiet fail
    }
  }

  // --- PROCEDURAL AMBIENT SOUNDSCAPES ---

  public stopAmbient() {
    this.activeAmbientNodes.forEach(item => {
      try { item.stop(); } catch { /* ignore */ }
    });
    this.activeAmbientNodes = [];
    this.currentAmbientTrack = 'none';
  }

  public playAmbient(trackId: 'lofi' | 'rain' | 'forest' | 'coffee' | 'whitenoise') {
    this.stopAmbient();
    this.initContext();
    if (!this.ctx || !this.ambientGain) return;

    this.currentAmbientTrack = trackId;

    switch (trackId) {
      case 'rain':
        this.startRainAmbience();
        break;
      case 'lofi':
        this.startLofiAmbience();
        break;
      case 'forest':
        this.startForestAmbience();
        break;
      case 'coffee':
      case 'whitenoise':
        this.startWhiteNoiseAmbience();
        break;
    }
  }

  // Track 1: Rain & Soft Thunder
  private startRainAmbience() {
    if (!this.ctx || !this.ambientGain) return;

    // Pink / Brown Noise Buffer (5 seconds looped)
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to sound like natural steady rainfall
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1050, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.42, this.ctx.currentTime);

    whiteNoise.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.ambientGain);
    whiteNoise.start();

    // Occasional gentle water droplets
    let dropInterval: ReturnType<typeof setInterval> | null = setInterval(() => {
      if (!this.ctx || !this.ambientGain) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();
        const freq = 1200 + Math.random() * 1800;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.04);

        dropGain.gain.setValueAtTime(0.02 + Math.random() * 0.02, t);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

        osc.connect(dropGain);
        dropGain.connect(this.ambientGain);
        osc.start(t);
        osc.stop(t + 0.05);
      } catch {
        // quiet
      }
    }, 380);

    this.activeAmbientNodes.push({
      stop: () => {
        try { whiteNoise.stop(); } catch { /* ignore */ }
        if (dropInterval) { clearInterval(dropInterval); dropInterval = null; }
      }
    });
  }

  // Track 2: Pure Clean Lo-Fi Chillhop (Zero vinyl/fire crackle, warm mellow Rhodes keys & silky sub-bass)
  private startLofiAmbience() {
    if (!this.ctx || !this.ambientGain) return;

    // Heartwarming, peaceful Lo-Fi jazz progression:
    // Fmaj9 -> Em7 -> Dm9 -> Cmaj7
    const chordProgression = [
      {
        bass: 87.31, // F2
        keys: [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9 (F3, A3, C4, E4, G4)
      },
      {
        bass: 82.41, // E2
        keys: [164.81, 196.00, 246.94, 293.66, 329.63], // Em7 (E3, G3, B3, D4, E4)
      },
      {
        bass: 73.42, // D2
        keys: [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9 (D3, F3, A3, C4, E4)
      },
      {
        bass: 65.41, // C2
        keys: [130.81, 164.81, 196.00, 246.94, 329.63], // Cmaj7 (C3, E3, G3, B3, E4)
      },
    ];

    let chordStep = 0;
    const playChord = () => {
      if (!this.ctx || !this.ambientGain) return;
      const step = chordProgression[chordStep % chordProgression.length];
      chordStep++;
      const now = this.ctx.currentTime;
      const duration = 4.2;

      // 1. Warm sub-bass note (gentle, warm low-end foundation)
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(step.bass, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(140, now);

      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.linearRampToValueAtTime(0.18, now + 0.1);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + duration - 0.2);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ambientGain);

      bassOsc.start(now);
      bassOsc.stop(now + duration);

      // 2. Mellow electric piano keys (triangle/sine blend, soft attack, zero crackle/noise)
      step.keys.forEach((noteFreq, idx) => {
        if (!this.ctx || !this.ambientGain) return;
        const noteStart = now + idx * 0.04; // organic gentle strum

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(noteFreq, noteStart);

        // Warm buttery low-pass envelope
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(620, noteStart);
        filter.frequency.exponentialRampToValueAtTime(240, noteStart + duration);

        const vol = idx === 0 ? 0.12 : 0.07;
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.linearRampToValueAtTime(vol, noteStart + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration - 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(noteStart);
        osc.stop(noteStart + duration);
      });
    };

    playChord();
    const chordTimer = setInterval(playChord, 4200);

    this.activeAmbientNodes.push({
      stop: () => {
        clearInterval(chordTimer);
      }
    });
  }

  // Track 3: Forest Birds & Canopy Wind
  private startForestAmbience() {
    if (!this.ctx || !this.ambientGain) return;

    // Canopy Wind
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.04;
    }
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(420, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.24, this.ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambientGain);
    windSource.start();

    // Procedural Birdsong
    const playBirdCall = () => {
      if (!this.ctx || !this.ambientGain) return;
      try {
        const now = this.ctx.currentTime;
        const baseFreq = 2200 + Math.random() * 800;
        const notesCount = 2 + Math.floor(Math.random() * 3);

        for (let i = 0; i < notesCount; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const noteTime = now + i * 0.12;

          osc.type = 'sine';
          const targetFreq = baseFreq + (Math.random() * 400 - 200);
          osc.frequency.setValueAtTime(targetFreq, noteTime);
          osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.25, noteTime + 0.08);

          gain.gain.setValueAtTime(0.0001, noteTime);
          gain.gain.linearRampToValueAtTime(0.06, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.1);

          osc.connect(gain);
          gain.connect(this.ambientGain);

          osc.start(noteTime);
          osc.stop(noteTime + 0.11);
        }
      } catch {
        // quiet
      }
    };

    playBirdCall();
    const birdTimer = setInterval(playBirdCall, 2400);

    this.activeAmbientNodes.push({
      stop: () => {
        try { windSource.stop(); } catch { /* ignore */ }
        clearInterval(birdTimer);
      }
    });
  }

  // Track 4: Pure Soothing White Noise (Deep Focus Acoustic Masking)
  private startWhiteNoiseAmbience() {
    if (!this.ctx || !this.ambientGain) return;

    // High-precision white noise buffer (5-second seamless loop)
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.16;
    }

    const whiteSource = this.ctx.createBufferSource();
    whiteSource.buffer = noiseBuffer;
    whiteSource.loop = true;

    // Gentle low-pass comfort filter to eliminate harsh high-frequency sizzle
    // while providing uniform, restful acoustic masking for deep concentration
    const comfortFilter = this.ctx.createBiquadFilter();
    comfortFilter.type = 'lowpass';
    comfortFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
    comfortFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const whiteGain = this.ctx.createGain();
    whiteGain.gain.setValueAtTime(0.36, this.ctx.currentTime);

    whiteSource.connect(comfortFilter);
    comfortFilter.connect(whiteGain);
    whiteGain.connect(this.ambientGain);
    whiteSource.start();

    this.activeAmbientNodes.push({
      stop: () => {
        try { whiteSource.stop(); } catch { /* ignore */ }
      }
    });
  }
}

// Global Singleton
export const audioEngine = typeof window !== 'undefined' ? new DashtimerAudioEngine() : (null as unknown as DashtimerAudioEngine);
