
import { GameTheme } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayGain: GainNode | null = null;
  private bgmNodes: AudioNode[] = [];
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Setup Signal Chain: Nodes -> Delay Bus -> Master Gain -> Destination
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;

      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.4;
      
      this.delayGain = this.ctx.createGain();
      this.delayGain.gain.value = 0.4;

      // Feedback loop for delay (Pseudo-reverb)
      this.delayNode.connect(this.delayGain);
      this.delayGain.connect(this.delayNode);
      
      this.delayNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.3, this.ctx!.currentTime, 0.1);
    }
  }

  public stopAll() {
    this.bgmNodes.forEach(node => {
      try { (node as any).stop?.(); } catch(e) {}
      node.disconnect();
    });
    this.bgmNodes = [];
  }

  public playThemeMusic(theme: GameTheme) {
    this.init();
    this.stopAll();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    switch (theme) {
      case GameTheme.COSMIC:
        this.playCosmicMusic();
        break;
      case GameTheme.NEON_CITY:
        this.playNeonMusic();
        break;
      case GameTheme.RETRO:
        this.playRetroMusic();
        break;
      case GameTheme.NATURE:
        this.playNatureMusic();
        break;
      case GameTheme.URBAN_RAIN:
        this.playRainMusic();
        break;
      case GameTheme.MIND_LAB:
        this.playMindLabMusic();
        break;
    }
  }

  private playCosmicMusic() {
    if (!this.ctx || !this.masterGain) return;
    this.createFMDrone(110, 220, 10, 'sine', 0.08);
    this.createMelodyPattern([880, 1046, 1318, 1567], 2.0, 'sine', 0.02, true);
  }

  private playNeonMusic() {
    if (!this.ctx || !this.masterGain) return;
    this.createFMDrone(55, 110, 5, 'sawtooth', 0.1, 800);
    this.createMelodyPattern([110, 164, 196, 220], 0.15, 'sawtooth', 0.05, false);
  }

  private playNatureMusic() {
    this.createNoise('white', 0.03, 500, 'lowpass');
    this.createMelodyPattern([2000, 2500, 3000], 4.0, 'sine', 0.01, true, 0.1);
  }

  private playRainMusic() {
    this.createNoise('brown', 0.12, 400, 'lowpass');
    this.createMelodyPattern([440, 554, 659], 3.0, 'sine', 0.03, true);
  }

  private playRetroMusic() {
    this.createMelodyPattern([261.63, 329.63, 392.00, 523.25], 0.125, 'square', 0.06, false);
  }

  private playMindLabMusic() {
    this.createFMDrone(150, 300, 50, 'triangle', 0.05);
    this.createMelodyPattern([2000, 4000, 6000], 0.1, 'sine', 0.01, false);
  }

  // --- Utility Synthesis Methods ---

  private createFMDrone(carrierFreq: number, modFreq: number, index: number, type: OscillatorType, vol: number, filterFreq: number = 1000) {
    if (!this.ctx || !this.masterGain) return;
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    carrier.type = type;
    carrier.frequency.value = carrierFreq;
    modulator.frequency.value = modFreq;
    modGain.gain.value = index;
    filter.frequency.value = filterFreq;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2);

    carrier.start();
    modulator.start();
    this.bgmNodes.push(carrier, modulator, gain);
  }

  private createMelodyPattern(notes: number[], step: number, type: OscillatorType, vol: number, useDelay: boolean, randomFactor: number = 0) {
    if (!this.ctx || !this.masterGain || !this.delayNode) return;
    
    const playTick = (time: number, noteIndex: number) => {
      if (!this.ctx || !this.masterGain || !this.delayNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      const freq = notes[noteIndex % notes.length];
      osc.frequency.setValueAtTime(freq + (Math.random() * randomFactor * freq), time);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.exponentialRampToValueAtTime(vol, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + step * 0.9);

      osc.connect(gain);
      if (useDelay) {
        gain.connect(this.delayNode);
      } else {
        gain.connect(this.masterGain);
      }
      
      osc.start(time);
      osc.stop(time + step);
    };

    const now = this.ctx.currentTime;
    for (let i = 0; i < 300; i++) {
        playTick(now + (i * step), i);
    }
  }

  private createNoise(type: 'white' | 'brown', vol: number, filterFreq: number, filterType: BiquadFilterType) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      if (type === 'white') {
        output[i] = Math.random() * 2 - 1;
      } else {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; 
      }
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 1);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
    this.bgmNodes.push(source, gain);
  }

  public playCollect(theme: GameTheme) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    switch(theme) {
        case GameTheme.COSMIC:
            // Shimmering Crystal Ping
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(2400, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            break;
        case GameTheme.NEON_CITY:
            // High-tech Data Blip
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(1600, now + 0.05);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000;
            osc.disconnect();
            osc.connect(filter);
            filter.connect(gain);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            break;
        case GameTheme.NATURE:
            // Organic Wood Block
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            break;
        case GameTheme.URBAN_RAIN:
            // Resonant Water Drop
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1500, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            break;
        case GameTheme.MIND_LAB:
            // Harmonic Neural Ping
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.value = 1800;
            osc.type = 'sine';
            osc.frequency.value = 900;
            osc2.connect(gain2);
            gain2.connect(this.masterGain);
            gain.gain.setValueAtTime(0.1, now);
            gain2.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc2.start(now);
            osc2.stop(now + 0.3);
            break;
        case GameTheme.RETRO:
            // Classic 8-bit Arp
            osc.type = 'square';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.05); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.1); // G5
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.14);
            gain.gain.linearRampToValueAtTime(0, now + 0.15);
            break;
    }

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playHazard(theme: GameTheme) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    switch(theme) {
        case GameTheme.COSMIC:
            // Deep Void Growl
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);
            break;
        case GameTheme.NEON_CITY:
            // Digital Static Glitch
            const noise = this.ctx.createBufferSource();
            const bufferSize = this.ctx.sampleRate * 0.2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            const glitchFilter = this.ctx.createBiquadFilter();
            glitchFilter.type = 'bandpass';
            glitchFilter.frequency.value = 1000;
            noise.connect(glitchFilter);
            glitchFilter.connect(gain);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            noise.start(now);
            return; // Exit as we use noise source
        case GameTheme.NATURE:
            // Animal Growl / Low Thud
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.3);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            break;
        case GameTheme.URBAN_RAIN:
            // Distant Thunder
            osc.type = 'sine';
            osc.frequency.setValueAtTime(50, now);
            const thunderNoise = this.ctx.createBufferSource();
            const tBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.8, this.ctx.sampleRate);
            const tData = tBuf.getChannelData(0);
            for(let i=0; i<tBuf.length; i++) tData[i] = Math.random() * 2 - 1;
            thunderNoise.buffer = tBuf;
            const tFilter = this.ctx.createBiquadFilter();
            tFilter.type = 'lowpass';
            tFilter.frequency.value = 100;
            thunderNoise.connect(tFilter);
            tFilter.connect(gain);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.8);
            thunderNoise.start(now);
            osc.frequency.setValueAtTime(40, now);
            return;
        case GameTheme.MIND_LAB:
            // Neural Static Dissonance
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            const mod = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            mod.frequency.value = 50;
            modGain.gain.value = 100;
            mod.connect(modGain);
            modGain.connect(osc.frequency);
            mod.start(now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            mod.stop(now + 0.4);
            break;
        case GameTheme.RETRO:
            // Classic Falling Buzz
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(50, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            break;
    }

    osc.start(now);
    osc.stop(now + 1.0);
  }
}

export const audioEngine = new AudioEngine();
