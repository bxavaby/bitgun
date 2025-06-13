export class SeedUtils {
  static generateSeed() {
    const cryptoObj = window.crypto || window.Crypto;
    const bytes = new Uint8Array(4);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase(); // 8-char hex string
  }

  static normalizeSeed(seed) {
    if (typeof seed !== "string") {
      return "00000000";
    }
    return seed.toUpperCase().padEnd(8, "0").substr(0, 8);
  }

  static validateSeed(seed) {
    return /^[0-9A-F]{1,8}$/i.test(seed);
  }

  /**
   * @param {string} seed
   * @param {number} starting bit position (0-31)
   * @param {number} number of bits to extract
   * @returns {number} extracted bits as a decimal number
   */
  static getBitsFromSeed(seed, startBit, numBits) {
    const normalizedSeed = this.normalizeSeed(seed);

    // hex to binary representation
    const binary = Array.from(normalizedSeed)
      .map((char) => parseInt(char, 16).toString(2).padStart(4, "0"))
      .join("");

    // extract bits
    const extractedBits = binary.substring(startBit, startBit + numBits);

    // back to decimal
    return parseInt(extractedBits || "0", 2);
  }

  /**
   * @param {string} seed
   * @param {number} starting hex character position (0-7)
   * @param {number} number of hex characters to use (1-8)
   * @returns {number} normalized value between 0 and 1
   */
  static getValueFromSeedRange(seed, startHexChar, length = 2) {
    const normalizedSeed = this.normalizeSeed(seed);
    const hexPortion = normalizedSeed.substr(startHexChar, length);
    const maxValue = parseInt("F".repeat(length), 16);
    return parseInt(hexPortion, 16) / maxValue;
  }

  static clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  /**
   * @param {number} input value between 0 and 1
   * @param {string} curve type: "linear", "exp", "log", "sin", "cos", "smooth", "smoother", "binary", "steps"
   * @param {number} curve strength multiplier
   * @returns {number} transformed value between 0 and 1
   */
  static applyCurve(value, curve = "linear", strength = 1) {
    const clampedValue = this.clamp01(value);

    switch (curve) {
      case "exp":
        return Math.pow(clampedValue, 1 + strength); // exponential rise
      case "log":
        return Math.pow(clampedValue, 1 / (1 + strength)); // logarithmic rise
      case "sin":
        // sinusoidal curve (good for smooth transitions)
        return Math.sin((clampedValue * Math.PI) / 2);
      case "cos":
        // cosine curve (starts flat, then rises quickly)
        return 1 - Math.cos((clampedValue * Math.PI) / 2);
      case "smooth":
        // smooth step function (S-curve)
        return clampedValue * clampedValue * (3 - 2 * clampedValue);
      case "smoother":
        // smoother step (game-friendly)
        return (
          clampedValue *
          clampedValue *
          clampedValue *
          (clampedValue * (clampedValue * 6 - 15) + 10)
        );
      case "binary":
        // binary threshold (on/off)
        return clampedValue >= 0.5 ? 1 : 0;
      case "steps":
        // stepped values (quantized)
        const steps = Math.max(2, Math.floor(strength * 10));
        return Math.floor(clampedValue * steps) / (steps - 1);
      default:
        return clampedValue; // linear (no change)
    }
  }

  /**
   * @param {number} base value between 0 and 1
   * @param {number} oscillation frequency
   * @param {number} oscillation amplitude
   * @returns {number} oscillating value (may exceed 0-1 range)
   */
  static createOscillation(value, frequency = 4, amplitude = 0.5) {
    const base = this.clamp01(value);
    return this.clamp01(
      base + Math.sin(base * Math.PI * 2 * frequency) * amplitude * 0.5,
    );
  }

  /**
   * @param {string} hex seed string
   * @param {Object} configuration options for the conversion
   * @returns {Object} parameter object with frequency, decay, noise, and crush values
   */
  static seedToNumbers(seed, options = {}) {
    const hex = this.normalizeSeed(seed);
    const defaultOptions = {
      curve: "linear",
      strength: 1,
      frequencyBias: 0,
      decayBias: 0,
      noiseBias: 0,
      crushBias: 0,
    };

    const config = { ...defaultOptions, ...options };

    return {
      frequency: this.clamp01(
        this.applyCurve(
          parseInt(hex.substr(0, 2), 16) / 255,
          config.curve,
          config.strength,
        ) + config.frequencyBias,
      ),
      decay: this.clamp01(
        this.applyCurve(
          parseInt(hex.substr(2, 2), 16) / 255,
          config.curve,
          config.strength,
        ) + config.decayBias,
      ),
      noise: this.clamp01(
        this.applyCurve(
          parseInt(hex.substr(4, 2), 16) / 255,
          config.curve,
          config.strength,
        ) + config.noiseBias,
      ),
      crush: this.clamp01(
        this.applyCurve(
          parseInt(hex.substr(6, 2), 16) / 255,
          config.curve,
          config.strength,
        ) + config.crushBias,
      ),
    };
  }

  /**
   * @param {Object} parameter object with frequency, decay, noise, and crush values
   * @returns {string} hex seed string
   */
  static parametersToSeed(params) {
    const toHex = (val) =>
      Math.round(this.clamp01(val) * 255)
        .toString(16)
        .padStart(2, "0");
    return (
      toHex(params.frequency) +
      toHex(params.decay) +
      toHex(params.noise) +
      toHex(params.crush)
    ).toUpperCase();
  }

  /**
   * @param {string} original seed
   * @param {number} amount of variation (0-1)
   * @returns {string} new seed
   */
  static createRelatedSeed(seed, changeAmount = 0.1) {
    const params = this.seedToNumbers(seed);
    const variation = this.getRandomVariation(params, changeAmount);
    return this.parametersToSeed(variation);
  }

  /**
   * @param {Object} base parameter object
   * @param {number} variation range (0-1)
   * @param {Object} configuration options
   * @returns {Object} new parameter object w variations
   */
  static getRandomVariation(baseParams, range = 0.1, options = {}) {
    const variation = { ...baseParams };
    const defaultOptions = {
      frequencyRange: range,
      decayRange: range,
      noiseRange: range,
      crushRange: range,
      distribution: "uniform", // 'uniform', 'normal', or 'biased'
    };

    const config = { ...defaultOptions, ...options };

    const getRandomDelta = (range, distribution) => {
      switch (distribution) {
        case "normal":
          // normal distribution (Box-Muller transform)
          let u = 0,
            v = 0;
          while (u === 0) u = Math.random();
          while (v === 0) v = Math.random();
          const standardNormal =
            Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
          return standardNormal * 0.3 * range;

        case "biased":
          // toward positive values
          return (
            (Math.random() * 0.7 + 0.3) * range * (Math.random() < 0.7 ? 1 : -1)
          );

        default: // "uniform"
          return (Math.random() - 0.5) * range * 2;
      }
    };

    variation.frequency = this.clamp01(
      variation.frequency +
        getRandomDelta(config.frequencyRange, config.distribution),
    );
    variation.decay = this.clamp01(
      variation.decay + getRandomDelta(config.decayRange, config.distribution),
    );
    variation.noise = this.clamp01(
      variation.noise + getRandomDelta(config.noiseRange, config.distribution),
    );
    variation.crush = this.clamp01(
      variation.crush + getRandomDelta(config.crushRange, config.distribution),
    );

    return variation;
  }

  /**
   * @param {string} initial seed
   * @param {number} number of steps in the sequence
   * @param {number} amount of variation between steps
   * @returns {Array} seed strings
   */
  static generateSeedSequence(startSeed, steps = 10, stepSize = 0.05) {
    const sequence = [startSeed];
    let currentSeed = startSeed;

    for (let i = 1; i < steps; i++) {
      currentSeed = this.createRelatedSeed(currentSeed, stepSize);
      sequence.push(currentSeed);
    }

    return sequence;
  }

  /**
   * @param {string} seed
   * @returns {Object} extracted features
   */
  static extractFeatures(seed) {
    const normalized = this.normalizeSeed(seed);

    const firstByte = parseInt(normalized.substr(0, 2), 16);
    const weaponType = (firstByte & 0xc0) >> 6; // 0-3

    return {
      weaponType,
      envelopeType: (firstByte & 0x30) >> 4, // 0-3
      oscillatorType: (firstByte & 0x0c) >> 2, // 0-3
      modulationType: firstByte & 0x03, // 0-3

      effectType: (parseInt(normalized.substr(2, 2), 16) & 0xc0) >> 6, // 0-3
      pitchBendType: (parseInt(normalized.substr(2, 2), 16) & 0x30) >> 4, // 0-3
      repeatType: (parseInt(normalized.substr(2, 2), 16) & 0x0c) >> 2, // 0-3
      harmonicsType: parseInt(normalized.substr(2, 2), 16) & 0x03, // 0-3

      params: this.seedToNumbers(seed),
    };
  }

  /**
   * @param {Object} features
   * @returns {string} seed
   */
  static createSeedWithFeatures(features = {}) {
    const defaultFeatures = {
      weaponType: Math.floor(Math.random() * 4),
      envelopeType: Math.floor(Math.random() * 4),
      oscillatorType: Math.floor(Math.random() * 4),
      modulationType: Math.floor(Math.random() * 4),
      effectType: Math.floor(Math.random() * 4),
      pitchBendType: Math.floor(Math.random() * 4),
      repeatType: Math.floor(Math.random() * 4),
      harmonicsType: Math.floor(Math.random() * 4),
    };

    const config = { ...defaultFeatures, ...features };

    const firstByte =
      ((config.weaponType & 0x03) << 6) |
      ((config.envelopeType & 0x03) << 4) |
      ((config.oscillatorType & 0x03) << 2) |
      (config.modulationType & 0x03);

    const secondByte =
      ((config.effectType & 0x03) << 6) |
      ((config.pitchBendType & 0x03) << 4) |
      ((config.repeatType & 0x03) << 2) |
      (config.harmonicsType & 0x03);

    const randomBytes = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ];

    return (
      firstByte.toString(16).padStart(2, "0") +
      secondByte.toString(16).padStart(2, "0") +
      randomBytes[0].toString(16).padStart(2, "0") +
      randomBytes[1].toString(16).padStart(2, "0")
    ).toUpperCase();
  }

  /**
   * calculate how similar two seeds are
   * @param {string} seedA - 1st seed
   * @param {string} seedB - 2nd seed
   * @returns {number} similarity score (0-1, 1 is identical)
   */
  static calculateSeedSimilarity(seedA, seedB) {
    const paramsA = this.seedToNumbers(seedA);
    const paramsB = this.seedToNumbers(seedB);

    // calculate Euclidean distance in 4D parameter space
    const distance = Math.sqrt(
      Math.pow(paramsA.frequency - paramsB.frequency, 2) +
        Math.pow(paramsA.decay - paramsB.decay, 2) +
        Math.pow(paramsA.noise - paramsB.noise, 2) +
        Math.pow(paramsA.crush - paramsB.crush, 2),
    );

    return Math.max(0, 1 - distance);
  }
}
