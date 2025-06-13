<div align="center">

# BITGUN

[![Live Demo](https://img.shields.io/badge/LIVE-1a1a1a?style=for-the-badge&logoColor=44c183)](https://bxavaby.github.io/bitgun)
[![MIT](https://img.shields.io/badge/MIT-ff0077?style=for-the-badge)](LICENSE)
[![Web Audio](https://img.shields.io/badge/Web_Audio-44c183?style=for-the-badge&logoColor=1a1a1a)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

**Procedural 8-bit gunshot sound generator**

<img src="assets/8bgss.png" alt="BITGUN Interface" width="700">

────

**Infinite variation** • **No samples** • **Seed-based generation**

────

![Classic Gunshots](https://img.shields.io/badge/Classic_Gunshots-1a1a1a?style=flat-square&logoColor=44c183)
![Laser Weapons](https://img.shields.io/badge/Laser_Weapons-1a1a1a?style=flat-square&logoColor=44c183)
![Plasma Cannons](https://img.shields.io/badge/Plasma_Cannons-1a1a1a?style=flat-square&logoColor=44c183)
![Digital Glitch](https://img.shields.io/badge/Digital_Glitch-1a1a1a?style=flat-square&logoColor=44c183)
![Burst Fire](https://img.shields.io/badge/Burst_Fire-1a1a1a?style=flat-square&logoColor=44c183)
![Auto Fire](https://img.shields.io/badge/Auto_Fire-1a1a1a?style=flat-square&logoColor=44c183)
![Wave Export](https://img.shields.io/badge/Wave_Export-1a1a1a?style=flat-square&logoColor=44c183)

────

![Chrome 66+](https://img.shields.io/badge/Chrome_66+-ff0077?style=flat-square)
![Firefox 76+](https://img.shields.io/badge/Firefox_76+-ff0077?style=flat-square)
![Safari 14.1+](https://img.shields.io/badge/Safari_14.1+-ff0077?style=flat-square)
![Edge 79+](https://img.shields.io/badge/Edge_79+-ff0077?style=flat-square)

![WAV](https://img.shields.io/badge/WAV-44c183?style=flat-square&logoColor=1a1a1a)

────

*Generate infinite 8-bit gun sound effects*

</div>

## About

BITGUN is a procedural 8-bit gunshot sound generator that creates an infinite variety of game-ready weapon sound effects without using any samples. It uses mathematical algorithms to synthesize sounds in real-time with the Web Audio API.

## Features

- **Procedural Generation**: Create unlimited unique gunshot sounds
- **Seed-Based System**: Share and recreate specific sounds using hex seeds
- **Multiple Weapon Types**: Classic gunshots, lasers, plasma, and glitch weapons
- **Spray Fire**: Test sounds with burst or automatic fire modes
- **WAV Export**: Download sounds for use in your games or projects
- **Mobile Friendly**: Works on desktop and mobile devices
- **Zero Latency**: Instant sound generation and playback

## How It Works

BITGUN uses the Web Audio API to generate sounds through algorithmic synthesis rather than playing back recorded samples. Each sound is created using:

1. **Oscillators**: Sine, square, sawtooth and triangle waves
2. **Envelope Shaping**: Attack, sustain and decay phases
3. **Frequency Modulation**: Dynamic pitch changes
4. **Noise Generation**: White noise with filtering
5. **Bitcrushing**: Lo-fi digital distortion effects
6. **Seedable Randomness**: Reproducible generation

## Usage

### Basic Controls

- **GENERATE**: Create a new random gunshot sound
- **FIRE**: Play the current sound
- **EXPORT**: Download the sound as a WAV file
- **INSERT COIN**: Generate a new sound with arcade flair
- **RANDOMIZER**: Hold for auto-fire, tap for burst fire

### Keyboard Shortcuts

- **F key**: Fire the current sound
- **Spacebar**: Focus the seed input field

### Seed System

Every sound has a unique 8-character hexadecimal seed. You can:

- Share seeds to recreate specific sounds
- Input custom seeds in the terminal
- Export sounds with their seed in the filename

## Technical Details

BITGUN is built with vanilla JavaScript, HTML and CSS, with no external dependencies except for anime.js for animations. The sound generation uses the following techniques:

- Oscillator stacking and blending
- Dynamic envelope generation
- Bit depth and sample rate reduction
- Frequency domain effects
- Procedural parameter mapping

## Browser Compatibility

Works in all modern browsers that support Web Audio API:
- Chrome 66+
- Firefox 76+
- Safari 14.1+
- Edge 79+
- Mobile browsers with Web Audio support

## Development

To run locally:
1. Clone the repository: `git clone https://github.com/bxavaby/bitgun.git`
2. Open `index.html` in your browser (no build step required)

## License

MIT License © 2025 bxavaby
