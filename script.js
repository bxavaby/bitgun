import { AudioEngine } from "./audio/audioEngine.js";
import { SeedUtils } from "./utils/seedUtils.js";

class BitgunApp {
  constructor() {
    this.audioEngine = new AudioEngine();
    this.waveSurfer = null;
    this.currentSeed = "";
    this.isPlaying = false;
    this.canvas = null;
    this.ctx = null;
    this.init();
  }

  async init() {
    this.setupCanvas();
    this.setupAudioContext();
    this.setupWaveform();
    this.setupEventListeners();
    this.generateNewSound();
    this.updateStatus("READY");
  }

  setupCanvas() {
    this.canvas = document.getElementById("waveform-canvas");
    this.ctx = this.canvas.getContext("2d");

    const resizeCanvas = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.canvas.style.width = rect.width + "px";
      this.canvas.style.height = rect.height + "px";
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  }

  async setupAudioContext() {
    const startAudio = async () => {
      try {
        await this.audioEngine.initialize();
        this.updateStatus("AUDIO", "ONLINE");
        document.removeEventListener("touchstart", startAudio);
        document.removeEventListener("click", startAudio);
      } catch (error) {
        console.warn("Audio context initialization failed:", error);
        this.updateStatus("AUDIO", "ERROR");
      }
    };

    document.addEventListener("touchstart", startAudio, { once: true });
    document.addEventListener("click", startAudio, { once: true });
  }

  setupWaveform() {
    this.drawWaveform([]);
  }

  drawWaveform(waveformData) {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    this.ctx.clearRect(0, 0, width, height);

    if (waveformData.length === 0) {
      this.ctx.strokeStyle = "#409f42";
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(0, height / 2);
      this.ctx.lineTo(width, height / 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      return;
    }

    this.ctx.strokeStyle = "#8fd345";
    this.ctx.fillStyle = "rgba(189, 255, 140, 0.3)";
    this.ctx.lineWidth = 2;

    const stepX = width / (waveformData.length - 1);
    const centerY = height / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);

    for (let i = 0; i < waveformData.length; i++) {
      const x = i * stepX;
      const y = centerY - waveformData[i] * centerY * 0.8;
      if (i === 0) {
        this.ctx.lineTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.lineTo(width, centerY);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    for (let i = 0; i < waveformData.length; i++) {
      const x = i * stepX;
      const y = centerY - waveformData[i] * centerY * 0.8;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    this.ctx.strokeStyle = "#bdff8c";
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.6;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  setupEventListeners() {
    const generateBtn = document.getElementById("generate-btn");
    const playBtn = document.getElementById("play-btn");
    const exportBtn = document.getElementById("export-btn");
    const seedInput = document.getElementById("seed-input");
    const loadSeedBtn = document.getElementById("load-seed-btn");
    const joystick = document.getElementById("joystick");

    this.addButtonListeners(generateBtn, () => this.generateNewSound());
    this.addButtonListeners(playBtn, () => this.playCurrentSound());
    this.addButtonListeners(exportBtn, () => this.exportCurrentSound());
    this.addButtonListeners(loadSeedBtn, () =>
      this.loadFromSeed(seedInput.value),
    );

    this.setupSprayFireJoystick(joystick);

    seedInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.loadFromSeed(seedInput.value);
      }
    });

    seedInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, "");
    });

    const app = this;
    document.addEventListener("keydown", function (e) {
      if (!e || !e.key) {
        return;
      }

      // F key for fire
      if (
        e.key.toLowerCase() === "f" &&
        document.activeElement.tagName !== "INPUT"
      ) {
        e.preventDefault();

        if (app.audioEngine.isInitialized && app.audioEngine.currentBuffer) {
          app.playCurrentSound();
          const playBtn = document.getElementById("play-btn");
          if (playBtn) {
            playBtn.classList.add("btn-pressed");
            setTimeout(() => playBtn.classList.remove("btn-pressed"), 200);
          }
        }
      }

      // spacebar to focus seed input
      if (e.key === " " && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        const seedInput = document.getElementById("seed-input");
        if (seedInput) {
          seedInput.focus();
        }
      }
    });

    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      (e) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      },
      false,
    );
  }

  addTemporaryClass(element, className, duration) {
    if (element) {
      element.classList.add(className);
      setTimeout(() => element.classList.remove(className), duration);
    }
  }

  addButtonListeners(button, callback) {
    button.addEventListener("click", callback);

    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
    });

    button.addEventListener("touchend", (e) => {
      e.preventDefault();
      callback();
    });
  }

  generateNewSound() {
    this.updateStatus("STATUS", "GENERATING");
    this.currentSeed = SeedUtils.generateSeed();

    setTimeout(() => {
      this.generateSoundFromSeed(this.currentSeed);
      this.updateUI();
      this.triggerGenerateAnimation();
      this.updateStatus("STATUS", "READY");
    }, 100);
  }

  setupSprayFireJoystick(joystick) {
    if (!joystick) return;

    let holdTimeout;
    let isHolding = false;
    let isMouseDown = false;
    let hasStartedAction = false;

    const resetState = () => {
      isMouseDown = false;
      isHolding = false;
      hasStartedAction = false;
      clearTimeout(holdTimeout);
    };

    const startSpray = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (
        !this.audioEngine.isInitialized ||
        !this.audioEngine.currentBuffer ||
        this.isPlaying
      ) {
        return;
      }

      isMouseDown = true;
      hasStartedAction = false;

      this.stopSpray();

      // hold vs tap
      holdTimeout = setTimeout(() => {
        if (isMouseDown && !hasStartedAction) {
          isHolding = true;
          hasStartedAction = true;
          this.startAutoFire();
        }
      }, 250); // 250ms detect hold
    };

    const endSpray = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      clearTimeout(holdTimeout);

      if (isHolding) {
        this.stopSpray();
        resetState();
        return;
      }

      if (isMouseDown && !hasStartedAction && !this.isPlaying) {
        hasStartedAction = true;
        this.startBurstFire();
      }

      resetState();
    };

    const cancelSpray = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      this.stopSpray();
      resetState();
    };

    joystick.addEventListener("mousedown", startSpray);
    joystick.addEventListener("mouseup", endSpray);
    joystick.addEventListener("mouseleave", cancelSpray);

    joystick.addEventListener("touchstart", startSpray);
    joystick.addEventListener("touchend", endSpray);
    joystick.addEventListener("touchcancel", cancelSpray);

    window.addEventListener("mouseup", () => {
      if (isMouseDown) {
        endSpray();
      }
    });

    window.addEventListener("touchend", () => {
      if (isMouseDown) {
        endSpray();
      }
    });
  }

  startAutoFire() {
    if (this.isPlaying || !this.audioEngine.isInitialized) return;

    this.isPlaying = true;

    const joystickLabel = document.querySelector(".joystick-label");
    if (joystickLabel) joystickLabel.textContent = "AUTO FIRE";

    this.updateStatus("STATUS", "AUTO FIRE");

    let lastTiltDir = 1;
    let shotCount = 0;

    const fireShot = () => {
      shotCount++;
      this.audioEngine.playBuffer();

      this.triggerSprayVisuals(lastTiltDir);
      lastTiltDir *= -1;

      this.addScreenShake();

      console.log(`Auto fire shot: ${shotCount}`);
    };

    fireShot();

    this.initialShotTimeout = setTimeout(() => {
      fireShot();

      // interval for continuous fire (slightly randomized timing)
      const minDelay = 120;
      const maxDelay = 180;
      this.sprayInterval = setInterval(
        () => {
          fireShot();
        },
        Math.random() * (maxDelay - minDelay) + minDelay,
      );
    }, 120); // short delay for second shot
  }

  startBurstFire() {
    if (this.isPlaying || !this.audioEngine.isInitialized) return;

    this.isPlaying = true;

    const joystickLabel = document.querySelector(".joystick-label");
    if (joystickLabel) joystickLabel.textContent = "BURST FIRE";

    this.updateStatus("STATUS", "BURST FIRE");

    const burstSize = Math.floor(Math.random() * 3) + 3; // 3-5 shots
    let shotCount = 0;
    let lastTiltDir = 1;
    this.burstTimeouts = [];

    const fireBurstShot = () => {
      shotCount++;
      this.audioEngine.playBuffer();

      this.triggerSprayVisuals(lastTiltDir);
      lastTiltDir *= -1;

      this.addScreenShake();

      console.log(`Burst fire shot: ${shotCount}/${burstSize}`);

      if (shotCount < burstSize) {
        const timeout = setTimeout(fireBurstShot, 120 + Math.random() * 40);
        this.burstTimeouts.push(timeout);
      } else {
        setTimeout(() => this.stopSpray(), 100);
      }
    };

    fireBurstShot();
  }

  stopSpray() {
    if (this.sprayInterval) {
      clearInterval(this.sprayInterval);
      this.sprayInterval = null;
    }

    if (this.initialShotTimeout) {
      clearTimeout(this.initialShotTimeout);
      this.initialShotTimeout = null;
    }

    if (this.burstTimeouts && this.burstTimeouts.length) {
      this.burstTimeouts.forEach((timeout) => clearTimeout(timeout));
      this.burstTimeouts = [];
    }

    const joystick = document.getElementById("joystick");
    if (joystick) {
      joystick.style.transform = "";
    }

    const joystickLabel = document.querySelector(".joystick-label");
    if (joystickLabel) joystickLabel.textContent = "SPRAY";

    setTimeout(() => {
      this.isPlaying = false;
      this.updateStatus("STATUS", "READY");
    }, 300);
  }

  triggerSprayVisuals(tiltDirection = 1) {
    const joystick = document.getElementById("joystick");
    if (joystick) {
      const tiltAmount = Math.random() * 5 + 5; // 5-10 degrees
      joystick.style.transform = `rotate(${tiltAmount * tiltDirection}deg)`;
    }

    this.animateWaveform();

    const visualizer = document.querySelector(".visualizer-border");
    if (visualizer) {
      visualizer.classList.add("fire-pulse");
      setTimeout(() => visualizer.classList.remove("fire-pulse"), 100);
    }
  }

  addScreenShake() {
    const screenBorder = document.querySelector(".screen-border");
    if (!screenBorder) return;

    const intensity = 2;
    const x = (Math.random() - 0.5) * intensity;
    const y = (Math.random() - 0.5) * intensity;

    screenBorder.style.transform = `translate(${x}px, ${y}px)`;
    setTimeout(() => {
      screenBorder.style.transform = "";
    }, 50);
  }

  loadFromSeed(inputSeed) {
    if (!inputSeed || inputSeed.trim() === "") {
      this.triggerErrorAnimation();
      return;
    }

    if (SeedUtils.validateSeed(inputSeed)) {
      this.updateStatus("STATUS", "LOADING");
      this.currentSeed = SeedUtils.normalizeSeed(inputSeed);

      setTimeout(() => {
        this.generateSoundFromSeed(this.currentSeed);
        this.updateUI();
        this.triggerLoadAnimation();
        this.updateStatus("STATUS", "READY");
      }, 100);
    } else {
      this.triggerErrorAnimation();
      this.updateStatus("STATUS", "ERROR");
      setTimeout(() => this.updateStatus("STATUS", "READY"), 2000);
    }
  }

  generateSoundFromSeed(seed) {
    try {
      if (!this.audioEngine.isInitialized) {
        console.log("Audio not initialized yet, storing seed for later");
        this.currentSeed = seed;
        this.updateUI();
        return;
      }

      const params = SeedUtils.seedToNumbers(seed);
      const buffer = this.audioEngine.generateGunshot(params);

      const waveformData = this.audioEngine.getWaveformData(buffer);
      this.drawWaveform(waveformData);
    } catch (error) {
      console.error("Error generating sound:", error);
      this.updateStatus("STATUS", "ERROR");
    }
  }

  async playCurrentSound() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.updateStatus("STATUS", "FIRING");

    try {
      await this.audioEngine.playBuffer();
      this.triggerPlayAnimation();
      this.animateWaveform();
    } catch (error) {
      console.error("Error playing sound:", error);
      this.updateStatus("STATUS", "ERROR");
    }

    setTimeout(() => {
      this.isPlaying = false;
      this.updateStatus("STATUS", "READY");
    }, 1000);
  }

  exportCurrentSound() {
    this.updateStatus("STATUS", "EXPORTING");

    try {
      const wavBlob = this.audioEngine.exportAsWav();
      if (wavBlob) {
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bitgun_${this.currentSeed}.wav`;

        if ("download" in a) {
          a.click();
        } else {
          window.open(url, "_blank");
        }

        URL.revokeObjectURL(url);
        this.triggerExportAnimation();
        this.updateStatus("STATUS", "EXPORTED");
        setTimeout(() => this.updateStatus("STATUS", "READY"), 2000);
      }
    } catch (error) {
      console.error("Error exporting sound:", error);
      this.updateStatus("STATUS", "ERROR");
      setTimeout(() => this.updateStatus("STATUS", "READY"), 2000);
    }
  }

  updateUI() {
    document.getElementById("current-seed").textContent = this.currentSeed;
    document.getElementById("seed-input").value = "";
  }

  updateStatus(type, value) {
    if (type === "STATUS") {
      const statusEl = document.getElementById("system-status");
      statusEl.textContent = value;
      statusEl.className = `status-value ${value.toLowerCase()}`;
    } else if (type === "AUDIO") {
      document.getElementById("audio-status").textContent = value;
    }
  }

  animateWaveform() {
    if (!this.canvas) return;

    this.canvas.classList.add("waveform-active");
    setTimeout(() => {
      this.canvas.classList.remove("waveform-active");
    }, 600);
  }

  triggerGenerateAnimation() {
    const btn = document.getElementById("generate-btn");
    const title = document.getElementById("bitgun-title");
    const joystick = document.getElementById("joystick");

    btn.classList.add("btn-pressed");
    setTimeout(() => btn.classList.remove("btn-pressed"), 200);

    title.classList.add("glitch-intense");
    setTimeout(() => title.classList.remove("glitch-intense"), 500);

    joystick.classList.add("joystick-active");
    setTimeout(() => joystick.classList.remove("joystick-active"), 2000);

    this.animateLights();

    anime({
      targets: ".char",
      scale: [1, 1.2, 1],
      duration: 300,
      delay: anime.stagger(50),
      easing: "easeOutQuad",
    });

    anime({
      targets: ".status-panel",
      scale: [1, 1.02, 1],
      duration: 400,
      easing: "easeOutBounce",
    });
  }

  triggerPlayAnimation() {
    const playBtn = document.getElementById("play-btn");

    playBtn.classList.add("btn-pressed");
    setTimeout(() => playBtn.classList.remove("btn-pressed"), 300);

    const screenBorder = document.querySelector(".screen-border");
    screenBorder.classList.add("screen-flash");
    setTimeout(() => screenBorder.classList.remove("screen-flash"), 300);

    anime({
      targets: ".char",
      scale: [1, 1.5, 1],
      rotateZ: [0, 10, -10, 0],
      duration: 500,
      delay: anime.stagger(80),
      easing: "easeOutElastic(1, .8)",
    });

    anime({
      targets: ".visualizer-container",
      scale: [1, 1.05, 1],
      duration: 600,
      easing: "easeOutQuad",
    });
  }

  triggerLoadAnimation() {
    const terminal = document.querySelector(".seed-terminal");
    const loadBtn = document.getElementById("load-seed-btn");

    terminal.classList.add("terminal-hack");
    setTimeout(() => terminal.classList.remove("terminal-hack"), 1000);

    loadBtn.classList.add("btn-pressed");
    setTimeout(() => loadBtn.classList.remove("btn-pressed"), 200);

    anime({
      targets: ".terminal-prompt",
      scale: [1, 0.98, 1],
      duration: 400,
      easing: "easeOutQuad",
    });

    anime({
      targets: ".status-value",
      color: ["#bdff8c", "#76a8de", "#bdff8c"],
      duration: 800,
      easing: "easeInOutQuad",
    });
  }

  triggerExportAnimation() {
    const btn = document.getElementById("export-btn");

    btn.classList.add("btn-pressed");
    setTimeout(() => btn.classList.remove("btn-pressed"), 200);

    anime({
      targets: btn,
      scale: [1, 1.1, 1],
      rotateZ: [0, 5, -5, 0],
      duration: 600,
      easing: "easeOutBounce",
    });

    this.animateLights("success");
  }

  triggerErrorAnimation() {
    const terminal = document.querySelector(".seed-terminal");
    const input = document.querySelector(".terminal-input");

    terminal.classList.add("error-shake");
    setTimeout(() => terminal.classList.remove("error-shake"), 600);

    anime({
      targets: input,
      borderBottomColor: ["#409f42", "#ff4444", "#409f42"],
      duration: 600,
      easing: "easeInOutQuad",
    });

    this.animateLights("error");
  }

  animateLights(type = "normal") {
    const lights = document.querySelectorAll(".light");

    lights.forEach((light) => light.classList.remove("active"));

    if (type === "success") {
      setTimeout(
        () => document.querySelector(".light.green").classList.add("active"),
        100,
      );
      setTimeout(
        () => document.querySelector(".light.green").classList.remove("active"),
        1000,
      );
    } else if (type === "error") {
      setTimeout(
        () => document.querySelector(".light.red").classList.add("active"),
        100,
      );
      setTimeout(
        () => document.querySelector(".light.red").classList.remove("active"),
        1000,
      );
    } else {
      const sequence = [
        ".light.red",
        ".light.yellow",
        ".light.blue",
        ".light.green",
      ];
      sequence.forEach((selector, index) => {
        setTimeout(() => {
          document.querySelector(selector).classList.add("active");
          setTimeout(
            () => document.querySelector(selector).classList.remove("active"),
            200,
          );
        }, index * 150);
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new BitgunApp();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    if (window.AudioContext && window.AudioContext.state === "suspended") {
      window.AudioContext.resume();
    }
  }
});

const style = document.createElement("style");
style.textContent = `
.waveform-active {
  animation: waveform-pulse 0.6s ease-out;
}

@keyframes waveform-pulse {
  0% { filter: brightness(1) hue-rotate(0deg); }
  50% { filter: brightness(1.5) hue-rotate(120deg); }
  100% { filter: brightness(1) hue-rotate(0deg); }
}

.screen-flash {
  animation: screen-flash 0.3s ease-out;
}

@keyframes screen-flash {
  0% { background: radial-gradient(ellipse at center, #000000 30%, #0a0a0a 100%); }
  50% { background: radial-gradient(ellipse at center, #8fd345 30%, #409f42 100%); }
  100% { background: radial-gradient(ellipse at center, #000000 30%, #0a0a0a 100%); }
}

.fire-pulse {
  animation: fire-pulse 0.1s ease-out;
}

@keyframes fire-pulse {
  0% { box-shadow: 0 0 5px rgba(143, 211, 69, 0.5); }
  50% { box-shadow: 0 0 15px rgba(255, 235, 59, 0.8); }
  100% { box-shadow: 0 0 5px rgba(143, 211, 69, 0.5); }
}

.btn-pressed {
  animation: btn-press-effect 0.3s ease-out;
}

@keyframes btn-press-effect {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.joystick-active {
  animation: joystick-activate 2s ease-out;
}

@keyframes joystick-activate {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.05); }
  50% { transform: rotate(180deg) scale(1.1); }
  75% { transform: rotate(270deg) scale(1.05); }
  100% { transform: rotate(360deg) scale(1); }
}

.terminal-hack {
  animation: terminal-hack-effect 1s ease-out;
}

@keyframes terminal-hack-effect {
  0% { border-color: #409f42; background: #000000; }
  25% { border-color: #ff4444; background: rgba(255, 68, 68, 0.1); }
  50% { border-color: #76a8de; background: rgba(118, 168, 222, 0.1); }
  75% { border-color: #8fd345; background: rgba(143, 211, 69, 0.1); }
  100% { border-color: #409f42; background: #000000; }
}
`;
document.head.appendChild(style);
