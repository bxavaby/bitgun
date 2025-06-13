export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.currentBuffer = null;
    this.sampleRate = 44100;
    this.duration = 0.6;
    this.isInitialized = false;
    this.bufferCache = new Map();
  }

  async initialize() {
    if (this.isInitialized) return;

    const AudioContext =
      window.AudioContext ||
      window.AudioContext ||
      window.AudioContext ||
      window.AudioContext ||
      window.AudioContext;

    if (!AudioContext) {
      throw new Error("Web Audio API not supported in this browser");
    }

    try {
      this.audioContext = new AudioContext();

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      window.AudioContext = this.audioContext;
      this.isInitialized = true;

      console.log("Audio context initialized:", this.audioContext.state);
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      throw error;
    }
  }

  generateGunshot(params) {
    if (!this.audioContext) {
      throw new Error("Audio context not initialized");
    }

    const cacheKey = this.createCacheKey(params);

    if (this.bufferCache.has(cacheKey)) {
      this.currentBuffer = this.bufferCache.get(cacheKey);
      return this.currentBuffer;
    }

    // weapon type from seed (first 2 bits of first byte)
    const firstByte = Math.floor(params.frequency * 255);
    const weaponType = (firstByte & 0xc0) >> 6; // top 2 bits (0-3)

    const envelopeType = (firstByte & 0x30) >> 4; // next 2 bits (0-3)

    const oscillatorType = (firstByte & 0x0c) >> 2; // next 2 bits (0-3)

    const modulationType = firstByte & 0x03; // last 2 bits (0-3)

    const secondByte = Math.floor(params.decay * 255);
    const effectType = (secondByte & 0xc0) >> 6; // top 2 bits (0-3)

    const pitchBendType = (secondByte & 0x30) >> 4; // next 2 bits (0-3)

    const repeatType = (secondByte & 0x0c) >> 2; // next 2 bits (0-3)

    const harmonicsType = secondByte & 0x03; // last 2 bits (0-3)

    let buffer;
    switch (weaponType) {
      case 0:
        buffer = this.generateClassicGunshot(
          params,
          envelopeType,
          oscillatorType,
          modulationType,
          effectType,
        );
        break;
      case 1:
        buffer = this.generateLaserSound(
          params,
          envelopeType,
          oscillatorType,
          modulationType,
          effectType,
        );
        break;
      case 2:
        buffer = this.generatePlasmaSound(
          params,
          envelopeType,
          oscillatorType,
          modulationType,
          effectType,
        );
        break;
      case 3:
        buffer = this.generateGlitchSound(
          params,
          envelopeType,
          oscillatorType,
          modulationType,
          effectType,
        );
        break;
      default:
        buffer = this.generateClassicGunshot(
          params,
          envelopeType,
          oscillatorType,
          modulationType,
          effectType,
        );
    }

    this.applyPitchBend(buffer, pitchBendType, params);

    if (repeatType > 0) {
      buffer = this.applyRepeatEffect(buffer, repeatType, params);
    }

    this.applyHarmonics(buffer, harmonicsType, params);

    this.applyPostProcessing(buffer, params);

    if (this.bufferCache.size < 50) {
      this.bufferCache.set(cacheKey, buffer);
    }

    this.currentBuffer = buffer;
    return buffer;
  }

  generateClassicGunshot(
    params,
    envelopeType,
    oscillatorType,
    modulationType,
    effectType,
  ) {
    const bufferLength = this.sampleRate * this.duration;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferLength,
      this.sampleRate,
    );
    const data = buffer.getChannelData(0);

    // base frequency range (60-200 Hz)
    const baseFreq = 60 + params.frequency * 140;

    // decay rate range based on envelope type (3-15)
    let decayRate;
    switch (envelopeType) {
      case 0: // fast decay
        decayRate = 9 + params.decay * 6;
        break;
      case 1: // medium decay
        decayRate = 5 + params.decay * 6;
        break;
      case 2: // slow decay
        decayRate = 3 + params.decay * 4;
        break;
      case 3: // very slow decay
        decayRate = 2 + params.decay * 3;
        break;
    }

    // noise amount (0.2-1.0)
    const noiseAmount = 0.2 + params.noise * 0.8;

    // bit crush factor (2-14)
    const bitCrushFactor = 2 + params.crush * 12;
    const bitDepth = Math.pow(2, Math.floor(bitCrushFactor));

    const attackTime = 0.002; // 2ms attack

    for (let i = 0; i < bufferLength; i++) {
      const t = i / this.sampleRate;

      let envelope;
      if (t < attackTime) {
        envelope = t / attackTime; // linear attack
      } else {
        switch (envelopeType) {
          case 0: // exponential decay
            envelope = Math.exp(-decayRate * (t - attackTime));
            break;
          case 1: // linear decay
            envelope = Math.max(0, 1 - (t - attackTime) * decayRate * 0.5);
            break;
          case 2: // curved decay
            envelope = 1 / (1 + decayRate * (t - attackTime));
            break;
          case 3: // power decay
            envelope = Math.pow(1 - (t - attackTime), decayRate * 0.2);
            break;
        }
      }

      // Frequency sweep
      const freqMod = 1 + (1 - Math.min(1, t * 8)) * 2;
      const freq = baseFreq * freqMod;

      let osc = 0;
      switch (oscillatorType) {
        case 0: // square wave
          osc = Math.sign(Math.sin(2 * Math.PI * freq * t));
          break;
        case 1: // sawtooth wave
          osc = 2 * ((freq * t) % 1) - 1;
          break;
        case 2: // triangle wave
          osc = Math.abs(4 * ((freq * t) % 1) - 2) - 1;
          break;
        case 3: // square + saw blend
          const square = Math.sign(Math.sin(2 * Math.PI * freq * t));
          const saw = 2 * ((freq * t) % 1) - 1;
          osc = square * 0.6 + saw * 0.4;
          break;
      }

      switch (modulationType) {
        case 0: // no modulation
          break;
        case 1: // amplitude modulation
          osc *= 1 + 0.3 * Math.sin(2 * Math.PI * 60 * t);
          break;
        case 2: // frequency modulation
          osc += 0.3 * Math.sin(2 * Math.PI * (freq * 1.5) * t);
          break;
        case 3: // random modulation
          osc *= 1 + 0.3 * (Math.random() - 0.5);
          break;
      }

      const noise = (Math.random() * 2 - 1) * noiseAmount;
      let sample = (osc * (1 - noiseAmount * 0.7) + noise) * envelope;

      switch (effectType) {
        case 0: // standard bit-crushing
          sample = Math.round(sample * bitDepth) / bitDepth;
          break;
        case 1: // distortion
          sample = Math.tanh(sample * 3);
          break;
        case 2: // waveshaping
          sample =
            sample < 0
              ? -Math.pow(Math.abs(sample), 0.8)
              : Math.pow(sample, 0.8);
          break;
        case 3: // bit-reduction + waveshaping
          sample = Math.round(sample * bitDepth) / bitDepth;
          sample = Math.tanh(sample * 2.5);
          break;
      }

      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  generateLaserSound(
    params,
    envelopeType,
    oscillatorType,
    modulationType,
    effectType,
  ) {
    const bufferLength = this.sampleRate * this.duration;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferLength,
      this.sampleRate,
    );
    const data = buffer.getChannelData(0);

    const baseFreq = 300 + params.frequency * 600; // higher frequency range for lasers
    const freqRange = 800 + params.decay * 1200;
    const sweepRate = 2 + params.noise * 8;

    const attackTime = 0.01 + params.crush * 0.05; // 10-60ms attack

    for (let i = 0; i < bufferLength; i++) {
      const t = i / this.sampleRate;

      let envelope;
      if (t < attackTime) {
        // rising attack phase
        envelope = t / attackTime;
      } else {
        switch (envelopeType) {
          case 0: // fast drop-off
            envelope = Math.exp(-(t - attackTime) * 15);
            break;
          case 1: // medium decay
            envelope = Math.exp(-(t - attackTime) * 10);
            break;
          case 2: // slow decay
            envelope = Math.exp(-(t - attackTime) * 5);
            break;
          case 3: // very slow decay (sustained laser)
            envelope = Math.exp(-(t - attackTime) * 3);
            break;
        }
      }

      // frequency sweep - going up instead of down (unlike gunshot)
      const freqSweep = baseFreq + (1 - Math.exp(-t * sweepRate)) * freqRange;

      let osc = 0;
      switch (oscillatorType) {
        case 0: // sine wave (smoother laser)
          osc = Math.sin(2 * Math.PI * freqSweep * t);
          break;
        case 1: // triangle (sharper laser)
          osc = Math.abs(4 * ((freqSweep * t) % 1) - 2) - 1;
          break;
        case 2: // sawtooth (harsh laser)
          osc = 2 * ((freqSweep * t) % 1) - 1;
          break;
        case 3: // square + sine blend (pulsed laser)
          const square = Math.sign(
            Math.sin(2 * Math.PI * (freqSweep * 0.5) * t),
          );
          const sine = Math.sin(2 * Math.PI * freqSweep * t);
          osc = square * 0.3 + sine * 0.7;
          break;
      }

      switch (modulationType) {
        case 0: // clean laser
          break;
        case 1: // pulsed laser
          osc *= 1 + 0.6 * Math.sign(Math.sin(2 * Math.PI * 120 * t));
          break;
        case 2: // wobbly laser
          osc *= 1 + 0.3 * Math.sin(2 * Math.PI * 80 * t);
          break;
        case 3: // unstable laser
          if (Math.random() < 0.05) {
            osc *= 0.5 + Math.random();
          }
          break;
      }

      // minimal noise for texture
      const noise = (Math.random() * 2 - 1) * 0.1 * params.noise;
      let sample = (osc * 0.9 + noise * 0.1) * envelope;

      switch (effectType) {
        case 0: // clean
          break;
        case 1: // sci-fi resonance
          sample =
            sample * (1 + 0.2 * Math.sin(2 * Math.PI * (freqSweep * 0.1) * t));
          break;
        case 2: // digital artifacts
          sample = Math.round(sample * 8) / 8 + sample * 0.3;
          break;
        case 3: // harmonic enhancer
          sample +=
            0.2 * Math.sin(2 * Math.PI * (freqSweep * 2) * t) * envelope;
          break;
      }

      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  generatePlasmaSound(
    params,
    envelopeType,
    oscillatorType,
    modulationType,
    effectType,
  ) {
    const bufferLength = this.sampleRate * this.duration;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferLength,
      this.sampleRate,
    );
    const data = buffer.getChannelData(0);

    const baseFreq = 100 + params.frequency * 200; // mid-range base
    const noiseFactor = 0.3 + params.noise * 0.6; // more noise for plasma
    const resonanceFactor = 0.4 + params.crush * 0.4; // resonance for that plasma feel

    const actualDuration = this.duration * (0.7 + params.decay * 0.6); // variable duration
    const attackTime = 0.005 + params.crush * 0.02; // 5-25ms attack

    for (let i = 0; i < bufferLength; i++) {
      const t = i / this.sampleRate;

      if (t > actualDuration) {
        data[i] = 0;
        continue;
      }

      let envelope;
      if (t < attackTime) {
        // fast attack
        envelope = t / attackTime;
      } else {
        const normalizedTime = (t - attackTime) / (actualDuration - attackTime);
        switch (envelopeType) {
          case 0: // standard decay
            envelope = Math.exp(-normalizedTime * 5);
            break;
          case 1: // pulsating decay
            envelope =
              Math.exp(-normalizedTime * 3) *
              (0.7 + 0.3 * Math.sin(2 * Math.PI * 30 * t));
            break;
          case 2: // sustained with falloff
            envelope = Math.max(0, 1 - normalizedTime * 1.2);
            break;
          case 3: // bubbling decay
            envelope =
              Math.exp(-normalizedTime * 4) * (0.8 + 0.2 * Math.random());
            break;
        }
      }

      const timeRatio = Math.min(1, t / actualDuration);
      const freqModulator = 1 + Math.sin(2 * Math.PI * 5 * timeRatio) * 0.2;
      const freq = baseFreq * freqModulator;

      let osc = 0;
      switch (oscillatorType) {
        case 0: // layered sines
          osc =
            Math.sin(2 * Math.PI * freq * t) +
            0.5 * Math.sin(2 * Math.PI * (freq * 1.5) * t) +
            0.25 * Math.sin(2 * Math.PI * (freq * 2.7) * t);
          osc /= 1.75; // normalize
          break;
        case 1: // FM synthesis
          const modFreq = 80 + params.frequency * 120;
          const carrier = Math.sin(
            2 * Math.PI * freq * t + 3 * Math.sin(2 * Math.PI * modFreq * t),
          );
          osc = carrier;
          break;
        case 2: // square with resonance
          osc =
            Math.sign(Math.sin(2 * Math.PI * freq * t)) +
            resonanceFactor * Math.sin(2 * Math.PI * (freq * 3) * t);
          osc /= 1 + resonanceFactor;
          break;
        case 3: // noise-driven oscillator
          const noise = Math.random() * 2 - 1;
          const sineComp = Math.sin(2 * Math.PI * (freq + noise * 50) * t);
          osc = 0.6 * sineComp + 0.4 * noise;
          break;
      }

      switch (modulationType) {
        case 0: // clean plasma
          break;
        case 1: // pulsating plasma
          osc *= 1 + 0.3 * Math.sin(2 * Math.PI * 60 * t);
          break;
        case 2: // unstable plasma
          if (Math.random() < 0.1) {
            osc *= 0.7 + Math.random() * 0.6;
          }
          break;
        case 3: // arcing plasma
          if (Math.random() < 0.03) {
            osc *= 1.8; // Occasional arcs
          }
          break;
      }

      const plasmaNoiseBase = Math.random() * 2 - 1;
      const plasmaNoiseFiltered =
        plasmaNoiseBase * (0.7 + 0.3 * Math.sin(2 * Math.PI * 2000 * t));
      const plasmaNoiseEnveloped = plasmaNoiseFiltered * envelope * noiseFactor;

      let sample =
        (osc * (1 - noiseFactor * 0.5) + plasmaNoiseEnveloped) * envelope;

      switch (effectType) {
        case 0: // clean plasma
          break;
        case 1: // resonant plasma
          sample = sample * (1 + 0.3 * Math.sin(2 * Math.PI * (freq * 2) * t));
          break;
        case 2: // distorted plasma
          sample = Math.tanh(sample * (1.5 + noiseFactor));
          break;
        case 3: // bit-reduced plasma
          const bitDepth = 4 + Math.floor(params.crush * 8);
          sample = Math.round(sample * bitDepth) / bitDepth;
          break;
      }

      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  generateGlitchSound(
    params,
    envelopeType,
    oscillatorType,
    modulationType,
    effectType,
  ) {
    const bufferLength = this.sampleRate * this.duration;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferLength,
      this.sampleRate,
    );
    const data = buffer.getChannelData(0);

    const baseFreq = 80 + params.frequency * 300; // wide frequency range
    const glitchDensity = 0.1 + params.noise * 0.5; // how often glitches occur
    const glitchSeverity = 0.4 + params.crush * 0.6; // how extreme glitches are

    const bitDepth = 2 + Math.floor(params.crush * 6); // 2-8 bits

    for (let i = 0; i < bufferLength; i++) {
      const t = i / this.sampleRate;

      const isGlitch = Math.random() < glitchDensity;

      let envelope;
      if (t < 0.01) {
        // fast attack
        envelope = t / 0.01;
      } else {
        switch (envelopeType) {
          case 0: // standard decay
            envelope = Math.exp(-t * 10);
            break;
          case 1: // glitchy decay with steps
            const step = Math.floor(t * 20) / 20;
            envelope = Math.exp(-step * 8);
            break;
          case 2: // erratic decay
            envelope =
              Math.exp(-t * 8) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 50 * t));
            break;
          case 3: // stuttering decay
            envelope = Math.exp(-t * 6) * (Math.random() < 0.2 ? 0.2 : 1.0);
            break;
        }
      }

      let freq = baseFreq;
      if (isGlitch) {
        freq *= 0.5 + Math.random() * 1.5;
      }

      let osc = 0;
      switch (oscillatorType) {
        case 0: // digital square
          osc = Math.sign(Math.sin(2 * Math.PI * freq * t));
          break;
        case 1: // glitched sawtooth
          osc = 2 * ((freq * t) % 1) - 1;
          if (isGlitch) osc = -osc; // inverted sometimes
          break;
        case 2: // noise bursts
          const noiseBase = Math.random() * 2 - 1;
          osc = isGlitch
            ? noiseBase
            : noiseBase * 0.3 +
              Math.sign(Math.sin(2 * Math.PI * freq * t)) * 0.7;
          break;
        case 3: // digital pulse train
          const pulseWidth = 0.1 + params.noise * 0.4;
          const pulsePhase = (freq * t) % 1;
          osc = pulsePhase < pulseWidth ? 1 : -1;
          if (isGlitch) osc *= -0.7; // occasional phase flip
          break;
      }

      switch (modulationType) {
        case 0:
          if (Math.random() < glitchDensity * 0.5) {
            this.sampleHoldValue = osc;
          }
          if (isGlitch) {
            osc = this.sampleHoldValue || osc;
          }
          break;
        case 1: // stutter
          const stutterRate = 40 + Math.floor(params.frequency * 100);
          if (Math.floor(t * stutterRate) % 2 === 0 && isGlitch) {
            osc = 0; // create rhythmic gaps
          }
          break;
        case 2: // pitch shifting
          if (isGlitch) {
            osc = Math.sin(2 * Math.PI * (freq * (1 + glitchSeverity)) * t);
          }
          break;
        case 3: // digital aliasing
          if (isGlitch) {
            osc = Math.sin(
              2 * Math.PI * (freq * Math.floor(1 + glitchSeverity * 3)) * t,
            );
          }
          break;
      }

      let sample = osc * envelope;

      switch (effectType) {
        case 0: // harsh bit reduction
          sample = Math.round(sample * bitDepth) / bitDepth;
          break;
        case 1: // asymmetric clipping
          if (sample > 0.3) sample = 0.3 + (sample - 0.3) * 0.6;
          break;
        case 2: // decimation
          const decimation = 1 + Math.floor(params.crush * 8);
          if (i % decimation !== 0) {
            sample = data[Math.floor(i / decimation) * decimation] || 0;
          }
          break;
        case 3: // zero-crossing distortion
          if (sample > 0 && sample < 0.4) sample *= 0.5;
          else if (sample < 0 && sample > -0.4) sample *= 0.5;
          sample = Math.round(sample * bitDepth) / bitDepth;
          break;
      }

      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  applyPitchBend(buffer, bendType, params) {
    if (bendType === 0) return; // no bend

    const data = buffer.getChannelData(0);
    const bufferLength = data.length;

    const tempBuffer = new Float32Array(bufferLength);

    const bendDepth = 0.3 + params.frequency * 0.7; // depth
    const bendRate = 2 + params.decay * 8; // speed

    for (let i = 0; i < bufferLength; i++) {
      const t = i / this.sampleRate;
      let bendFactor = 0;

      switch (bendType) {
        case 1: // down pitch bend (classic gun falloff)
          bendFactor = Math.exp(-t * bendRate) * bendDepth;
          break;
        case 2: // up pitch bend (laser-like)
          bendFactor = (1 - Math.exp(-t * bendRate)) * bendDepth;
          break;
        case 3: // wobble pitch bend
          bendFactor = Math.sin(2 * Math.PI * bendRate * t) * bendDepth;
          break;
      }

      const sourcePos = i - Math.floor(bendFactor * 1000);

      if (sourcePos >= 0 && sourcePos < bufferLength) {
        tempBuffer[i] = data[sourcePos];
      } else {
        tempBuffer[i] = 0;
      }
    }

    for (let i = 0; i < bufferLength; i++) {
      data[i] = tempBuffer[i];
    }
  }

  applyRepeatEffect(buffer, repeatType, params) {
    const data = buffer.getChannelData(0);
    const bufferLength = data.length;

    const repeatCount = 1 + Math.floor(params.decay * 10); // 1-11 repeats
    const repeatGap = 0.05 + params.frequency * 0.15; // 50-200ms between repeats
    const repeatDecay = 0.2 + params.noise * 0.6;

    let newDuration;
    switch (repeatType) {
      case 1:
        newDuration = this.duration + repeatCount * repeatGap;
        break;
      case 2:
        newDuration =
          this.duration + Math.ceil(repeatCount / 3) * repeatGap * 3;
        break;
      case 3:
        newDuration = this.duration + repeatCount * repeatGap * 1.5;
        break;
      default:
        return buffer;
    }

    const newBufferLength = Math.ceil(newDuration * this.sampleRate);
    const newBuffer = this.audioContext.createBuffer(
      1,
      newBufferLength,
      this.sampleRate,
    );
    const newData = newBuffer.getChannelData(0);

    for (let i = 0; i < bufferLength; i++) {
      newData[i] = data[i];
    }

    // repeats based on type
    switch (repeatType) {
      case 1:
        for (let r = 1; r <= repeatCount; r++) {
          const startSample = Math.floor(this.sampleRate * r * repeatGap);
          const volumeFactor = Math.pow(1 - repeatDecay, r);

          for (
            let i = 0;
            i < bufferLength && startSample + i < newBufferLength;
            i++
          ) {
            newData[startSample + i] += data[i] * volumeFactor;
          }
        }
        break;
      case 2:
        for (let r = 1; r <= repeatCount; r++) {
          const burstIndex = Math.floor((r - 1) / 3);
          const burstPosition = (r - 1) % 3;

          const startSample = Math.floor(
            this.sampleRate *
              (burstIndex * repeatGap * 3 + burstPosition * 0.03),
          );

          const volumeFactor =
            Math.pow(1 - repeatDecay, burstIndex) * (1 - burstPosition * 0.2);

          for (
            let i = 0;
            i < bufferLength && startSample + i < newBufferLength;
            i++
          ) {
            newData[startSample + i] += data[i] * volumeFactor;
          }
        }
        break;
      case 3:
        let lastStartTime = 0;
        for (let r = 1; r <= repeatCount; r++) {
          const randomGap = repeatGap * (0.7 + Math.random() * 0.6);
          lastStartTime += randomGap;

          const startSample = Math.floor(this.sampleRate * lastStartTime);
          const volumeFactor =
            Math.pow(1 - repeatDecay, r) * (0.7 + Math.random() * 0.3);

          for (
            let i = 0;
            i < bufferLength && startSample + i < newBufferLength;
            i++
          ) {
            newData[startSample + i] += data[i] * volumeFactor;
          }
        }
        break;
    }

    for (let i = 0; i < newBufferLength; i++) {
      newData[i] = Math.max(-1, Math.min(1, newData[i]));
    }

    return newBuffer;
  }

  applyHarmonics(buffer, harmonicsType, params) {
    if (harmonicsType === 0) return; // No harmonics

    const data = buffer.getChannelData(0);
    const bufferLength = data.length;

    const tempBuffer = new Float32Array(bufferLength);
    for (let i = 0; i < bufferLength; i++) {
      tempBuffer[i] = data[i];
    }

    const harmonicStrength = 0.2 + params.noise * 0.4;

    switch (harmonicsType) {
      case 1: // octave up
        for (let i = 0; i < bufferLength - 1; i++) {
          // "double frequency" approximation
          const harmonicIndex = Math.floor(i / 2);
          if (harmonicIndex < bufferLength) {
            data[i] =
              data[i] * (1 - harmonicStrength) +
              tempBuffer[harmonicIndex] * harmonicStrength;
          }
        }
        break;
      case 2: // fifth up
        for (let i = 0; i < bufferLength - 1; i++) {
          // 2/3 of the period
          const harmonicIndex = Math.floor((i * 2) / 3);
          if (harmonicIndex < bufferLength) {
            data[i] =
              data[i] * (1 - harmonicStrength) +
              tempBuffer[harmonicIndex] * harmonicStrength;
          }
        }
        break;
      case 3: // rich harmonics (multiple partials)
        for (let i = 0; i < bufferLength; i++) {
          let harmonicSum = 0;

          const octaveUp = Math.floor(i / 2);
          if (octaveUp < bufferLength) {
            harmonicSum += tempBuffer[octaveUp] * 0.3;
          }

          const octaveUp2 = Math.floor(i / 4);
          if (octaveUp2 < bufferLength) {
            harmonicSum += tempBuffer[octaveUp2] * 0.15;
          }

          const fifth = Math.floor((i * 2) / 3);
          if (fifth < bufferLength) {
            harmonicSum += tempBuffer[fifth] * 0.2;
          }

          data[i] =
            data[i] * (1 - harmonicStrength) + harmonicSum * harmonicStrength;
        }
        break;
    }
  }

  applyPostProcessing(buffer, params) {
    const data = buffer.getChannelData(0);
    const bufferLength = data.length;

    // lowpass filter sweep
    let prevSample = 0;
    const filterStrength = 0.3 + params.crush * 0.5;

    for (let i = 0; i < bufferLength; i++) {
      const t = i / bufferLength;
      const cutoff = 0.1 + (1 - t) * 0.6; // sweeps down

      const filtered = data[i] - prevSample * cutoff;
      data[i] = data[i] * (1 - filterStrength) + filtered * filterStrength;
      prevSample = data[i];
    }

    // final limiting/soft clipping
    for (let i = 0; i < bufferLength; i++) {
      // soft clipper to catch any peaks
      data[i] = Math.tanh(data[i] * 1.2) * 0.85;
    }
  }

  createCacheKey(params) {
    return `${Math.round(params.frequency * 1000)}_${Math.round(params.decay * 1000)}_${Math.round(params.noise * 1000)}_${Math.round(params.crush * 1000)}`;
  }

  async playBuffer(buffer = null) {
    if (!this.audioContext || !this.isInitialized) {
      console.warn("Audio context not ready");
      return;
    }

    if (!buffer && !this.currentBuffer) {
      console.warn("No buffer to play");
      return;
    }

    try {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer || this.currentBuffer;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.8, this.audioContext.currentTime);

      source.connect(gain);
      gain.connect(this.audioContext.destination);

      const startTime = this.audioContext.currentTime;
      source.start(startTime);

      source.onended = () => {
        try {
          source.disconnect();
          gain.disconnect();
        } catch (e) {}
      };

      const duration = buffer ? buffer.duration : this.duration;
      setTimeout(
        () => {
          try {
            source.disconnect();
            gain.disconnect();
          } catch (e) {}
        },
        (duration + 0.1) * 1000,
      );
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }

  exportAsWav(buffer = null) {
    const targetBuffer = buffer || this.currentBuffer;
    if (!targetBuffer) {
      console.warn("No buffer to export");
      return null;
    }

    try {
      const length = targetBuffer.length;
      const arrayBuffer = new ArrayBuffer(44 + length * 2);
      const view = new DataView(arrayBuffer);
      const data = targetBuffer.getChannelData(0);

      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, "RIFF");
      view.setUint32(4, 36 + length * 2, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, this.sampleRate, true);
      view.setUint32(28, this.sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, "data");
      view.setUint32(40, length * 2, true);

      let offset = 44;
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, data[i]));
        view.setInt16(offset, sample * 0x7fff, true);
        offset += 2;
      }

      return new Blob([arrayBuffer], { type: "audio/wav" });
    } catch (error) {
      console.error("Error exporting WAV:", error);
      return null;
    }
  }

  getWaveformData(buffer = null, samples = 800) {
    const targetBuffer = buffer || this.currentBuffer;
    if (!targetBuffer) return [];

    try {
      const data = targetBuffer.getChannelData(0);
      const blockSize = Math.floor(data.length / samples);
      const waveformData = new Array(samples);

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        const start = i * blockSize;
        const end = Math.min(start + blockSize, data.length);

        for (let j = start; j < end; j++) {
          sum += Math.abs(data[j] || 0);
        }

        waveformData[i] = sum / (end - start);
      }

      return waveformData;
    } catch (error) {
      console.error("Error generating waveform data:", error);
      return [];
    }
  }

  clearCache() {
    this.bufferCache.clear();
  }

  isSupported() {
    return !!(
      window.AudioContext ||
      window.AudioContext ||
      window.AudioContext ||
      window.AudioContext ||
      window.AudioContext
    );
  }

  getContextState() {
    return this.audioContext ? this.audioContext.state : "uninitialized";
  }

  async resumeContext() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
        console.log("Audio context resumed");
      } catch (error) {
        console.error("Failed to resume audio context:", error);
      }
    }
  }
}
