
"use strict";

// =====================================================
// AGENT PROTOCOL — GAME ENGINE
// HTML Canvas, JavaScript, tanpa library eksternal
// =====================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const $ = (id) => document.getElementById(id);

// Soundtrack dan efek suara dari aset proyek.
const soundtrack = {
  gameOver: new Audio("game over.mp3"),
  success: new Audio("success answer.mp3"),
  button: new Audio("button sound.mp3"),
  background: new Audio("./sound%20game.mp3")
};
soundtrack.background.preload = "auto";
soundtrack.background.loop = true;
soundtrack.background.volume = 0.65;
soundtrack.gameOver.volume = 0.8;
soundtrack.success.volume = 0.8;
soundtrack.button.volume = 0.65;

function playAudioAsset(audio) {
  audio.currentTime = 0;
  const playback = audio.play();
  if (playback && typeof playback.catch === "function") playback.catch(() => {});
}

function startGameSoundtrack() {
  const background = soundtrack.background;
  background.loop = true;
  background.volume = 0.65;

  // Reset playback when a new mission starts, then play from the start.
  if (!background.paused) background.pause();
  background.currentTime = 0;

  const playback = background.play();
  if (playback && typeof playback.catch === "function") {
    playback.catch(error => {
      // Keep a useful diagnostic instead of silently hiding a playback failure.
      console.warn("Soundtrack tidak dapat diputar:", error);
    });
  }
}

function stopGameSoundtrack() {
  soundtrack.background.pause();
  soundtrack.background.currentTime = 0;
}

const ui = {
  start: $("start-screen"),
  briefing: $("briefing-screen"),
  pause: $("pause-screen"),
  game: $("game"),
  modal: $("question-modal"),
  end: $("end-screen"),
  banner: $("message-banner"),
  level: $("hud-level"),
  levelName: $("hud-level-name"),
  time: $("hud-time"),
  lives: $("hud-lives"),
  score: $("hud-score"),
  objective: $("objective"),
  keyStatus: $("key-status"),
  description: $("mission-description"),
  terminalIndex: $("terminal-index"),
  questionTitle: $("question-title"),
  question: $("question-text"),
  hint: $("question-hint"),
  input: $("answer-input"),
  form: $("answer-form"),
  feedback: $("answer-feedback"),
  endIcon: $("end-icon"),
  endEyebrow: $("end-eyebrow"),
  endTitle: $("end-title"),
  endDescription: $("end-description"),
  endScore: $("end-score"),
  endRank: $("end-rank")
};

const TILE = 40;
const COLS = 24;
const ROWS = 15;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// =====================================================
// 1. KONFIGURASI LEVEL
// Koordinat memakai indeks petak: x, y
// =====================================================

const levelConfigs = [
  {
    name: "Training Room",
    topic: "Nilai Fungsi",
    duration: 90,
    description:
      "Cari terminal biru, kumpulkan kartu akses kuning, dan hindari penjaga.",
    story:
      "Ruang latihan terkunci. Selesaikan tiga terminal nilai fungsi untuk membuka jalur keluar.",
    terminals: [[5, 3], [12, 10], [19, 3]],
    key: [3, 12],
    door: [22, 12],
    guards: [
      { x: 9, y: 5, min: 7, max: 15, axis: "x", speed: 1.1 },
      { x: 17, y: 9, min: 15, max: 20, axis: "x", speed: 0.9 }
    ],
    walls: [
      [4, 1, 1, 4], [4, 7, 1, 5],
      [8, 3, 1, 3], [8, 9, 1, 4],
      [11, 1, 1, 4], [11, 7, 1, 4],
      [15, 3, 1, 4], [15, 10, 1, 3],
      [19, 6, 1, 4],
      [6, 5, 2, 1], [12, 5, 2, 1],
      [17, 7, 2, 1], [2, 9, 2, 1]
    ],
    lasers: [[6, 7], [13, 8], [20, 5]]
  },
  {
    name: "Encrypted Files",
    topic: "Fungsi Komposisi",
    duration: 120,
    description:
      "Masuki ruang server, pecahkan fungsi komposisi, dan temukan data rahasia.",
    story:
      "Server pusat terkunci. Selesaikan tiga terminal fungsi komposisi untuk memulihkan akses.",
    terminals: [[3, 4], [12, 3], [19, 10]],
    key: [21, 2],
    door: [22, 12],
    guards: [
      { x: 7, y: 8, min: 5, max: 10, axis: "x", speed: 1.3 },
      { x: 16, y: 5, min: 14, max: 20, axis: "x", speed: 1.2 },
      { x: 12, y: 12, min: 9, max: 15, axis: "x", speed: 0.8 }
    ],
    walls: [
      [5, 1, 1, 4], [5, 7, 1, 6],
      [9, 2, 1, 4], [9, 8, 1, 5],
      [13, 5, 1, 4], [13, 11, 1, 2],
      [17, 1, 1, 3], [17, 6, 1, 3],
      [20, 7, 1, 3],
      [2, 7, 2, 1], [7, 5, 2, 1],
      [10, 7, 2, 1], [15, 10, 2, 1],
      [19, 4, 2, 1]
    ],
    lasers: [[7, 3], [11, 9], [16, 8], [20, 11]]
  },
  {
    name: "Final Operation",
    topic: "Komposisi dan Invers Fungsi",
    duration: 180,
    description:
      "Masuk ke pusat keamanan, hindari jebakan, dan pulihkan sistem utama.",
    story:
      "Ini operasi terakhir. Pecahkan terminal komposisi dan invers untuk mematikan sistem keamanan.",
    terminals: [[3, 3], [12, 11], [19, 3]],
    key: [3, 12],
    door: [22, 12],
    guards: [
      { x: 7, y: 6, min: 5, max: 10, axis: "x", speed: 1.4 },
      { x: 16, y: 8, min: 14, max: 20, axis: "x", speed: 1.5 },
      { x: 12, y: 4, min: 10, max: 15, axis: "x", speed: 1.1 },
      { x: 19, y: 11, min: 17, max: 20, axis: "x", speed: 1.2 }
    ],
    walls: [
      [5, 1, 1, 4], [5, 7, 1, 6],
      [9, 2, 1, 4], [9, 8, 1, 5],
      [13, 1, 1, 4], [13, 7, 1, 6],
      [17, 3, 1, 4], [17, 10, 1, 3],
      [7, 5, 2, 1], [10, 6, 2, 1],
      [15, 5, 1, 2], [19, 7, 2, 1],
      [2, 9, 2, 1], [19, 1, 2, 1]
    ],
    lasers: [[7, 8], [11, 3], [15, 9], [20, 5], [10, 12]]
  }
];

// =====================================================
// 2. STATE PERMAINAN
// =====================================================

let levelIndex = 0;
let score = 0;
let lives = 3;
let timeLeft = 90;
let timerAccumulator = 0;

let playing = false;
let pausedForTerminal = false;
let gameEnded = false;
let animationId = 0;
let lastFrame = 0;
let bannerTimer = 0;

let map = [];
let walls = [];
let terminals = [];
let guards = [];
let lasers = [];

let keyCard = null;
let door = null;
let currentQuestion = null;
let questionCount = 0;
let solvedCount = 0;
let currentTerminal = null;

const player = {
  x: 80,
  y: 80,
  w: 24,
  h: 28,
  speed: 175,
  face: "down",
  walkTime: 0,
  invulnerable: 0
};

const keys = new Set();

const touchDirections = {
  up: false,
  down: false,
  left: false,
  right: false
};


// =====================================================
// AUDIO: musik latar dan efek suara sintetis
// Tidak memerlukan file audio eksternal.
// =====================================================
const audioSystem = {
  context: null,
  master: null,
  musicGain: null,
  musicNodes: [],
  musicTimer: null,
  stepCooldown: 0,
  enabled: true
};

function initAudio() {
  if (!audioSystem.enabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioSystem.context) {
    audioSystem.context = new AudioContextClass();
    audioSystem.master = audioSystem.context.createGain();
    audioSystem.master.gain.value = 0.22;
    audioSystem.master.connect(audioSystem.context.destination);
  }

  if (audioSystem.context.state === "suspended") {
    audioSystem.context.resume();
  }
  // Musik latar berbasis file dimulai ketika misi dimulai.
}

function playTone(frequency, duration = 0.12, type = "square", volume = 0.18, slideTo = null) {
  if (!audioSystem.enabled || !audioSystem.context || !audioSystem.master) return;
  const ac = audioSystem.context;
  const oscillator = ac.createOscillator();
  const gain = ac.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(30, frequency), ac.currentTime);
  if (slideTo !== null) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), ac.currentTime + duration);
  }

  gain.gain.setValueAtTime(0.0001, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), ac.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(audioSystem.master);
  oscillator.start();
  oscillator.stop(ac.currentTime + duration + 0.025);
}

function playSound(name) {
  if (!audioSystem.context) return;
  switch (name) {
    case "step":
      playTone(115, 0.045, "triangle", 0.045, 78);
      break;
    case "jump":
      playTone(260, 0.12, "square", 0.08, 420);
      break;
    case "interact":
      playAudioAsset(soundtrack.button);
      break;
    case "correct":
      playAudioAsset(soundtrack.success);
      break;
    case "wrong":
      playTone(240, 0.18, "sawtooth", 0.12, 115);
      break;
    case "caught":
      playTone(180, 0.24, "sawtooth", 0.17, 65);
      setTimeout(() => playTone(95, 0.2, "square", 0.12, 55), 130);
      break;
    case "life":
      playTone(300, 0.12, "square", 0.12, 180);
      break;
    case "key":
      playTone(650, 0.1, "triangle", 0.12, 950);
      break;
    case "level":
      playTone(330, 0.12, "triangle", 0.1, 440);
      setTimeout(() => playTone(440, 0.15, "triangle", 0.1, 660), 110);
      break;
    case "win":
      playTone(440, 0.16, "triangle", 0.13, 660);
      setTimeout(() => playTone(660, 0.16, "triangle", 0.13, 880), 140);
      setTimeout(() => playTone(880, 0.28, "triangle", 0.13, 1100), 280);
      break;
    case "lose":
      playTone(250, 0.22, "sawtooth", 0.14, 130);
      setTimeout(() => playTone(130, 0.32, "sawtooth", 0.12, 60), 180);
      break;
    case "door":
      playTone(360, 0.12, "square", 0.09, 520);
      break;
  }
}

function startBackgroundMusic() {
  if (!audioSystem.context || audioSystem.musicNodes.length) return;
  const ac = audioSystem.context;
  const musicBus = ac.createGain();
  musicBus.gain.value = 0.035;
  musicBus.connect(audioSystem.master);
  audioSystem.musicGain = musicBus;

  // Nada elektronik sederhana dengan modulasi, seperti musik misi rahasia.
  const notes = [110, 146.83, 164.81, 130.81];
  notes.forEach((frequency, index) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();

    osc.type = index % 2 === 0 ? "triangle" : "sine";
    osc.frequency.value = frequency;
    gain.gain.value = index === 0 ? 0.55 : 0.22;
    lfo.type = "sine";
    lfo.frequency.value = 0.18 + index * 0.07;
    lfoGain.gain.value = 0.09;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(musicBus);
    osc.start();
    lfo.start();
    audioSystem.musicNodes.push(osc, lfo);
  });

  // Melodi pendek berulang supaya musik terasa seperti soundtrack game.
  const melody = [220, 329.63, 261.63, 392, 329.63, 440, 261.63, 329.63];
  let melodyIndex = 0;
  audioSystem.musicTimer = window.setInterval(() => {
    if (!audioSystem.context || audioSystem.context.state !== "running") return;
    playTone(melody[melodyIndex], 0.16, "triangle", 0.045);
    melodyIndex = (melodyIndex + 1) % melody.length;
  }, 360);
}

function stopBackgroundMusic() {
  if (audioSystem.musicTimer) {
    clearInterval(audioSystem.musicTimer);
    audioSystem.musicTimer = null;
  }
  if (audioSystem.musicNodes.length) {
    audioSystem.musicNodes.forEach(node => {
      try { node.stop(); } catch (_) {}
      try { node.disconnect(); } catch (_) {}
    });
    audioSystem.musicNodes = [];
  }
  if (audioSystem.musicGain) {
    try { audioSystem.musicGain.disconnect(); } catch (_) {}
    audioSystem.musicGain = null;
  }
}

// =====================================================
// 3. UTILITAS
// =====================================================

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  const arr = [...items];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function tileCenter(point) {
  return {
    x: point[0] * TILE + TILE / 2,
    y: point[1] * TILE + TILE / 2
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function showBanner(text, duration = 2) {
  ui.banner.textContent = text;
  ui.banner.classList.remove("hidden");
  bannerTimer = duration;
}

function hideBanner() {
  ui.banner.classList.add("hidden");
}

function setObjective(text) {
  ui.objective.textContent = `OBJEKTIF: ${text}`;
}

function updateHUD() {
  const config = levelConfigs[levelIndex];

  ui.level.textContent =
    `${String(levelIndex + 1).padStart(2, "0")} / 03`;

  ui.levelName.textContent = config.name.toUpperCase();
  ui.time.textContent = formatTime(timeLeft);
  ui.lives.textContent =
    `${"♥ ".repeat(lives)}${"♡ ".repeat(3 - lives)}`.trim();
  ui.score.textContent = String(score).padStart(4, "0");

  ui.time.style.color = timeLeft <= 10 ? "#ff6375" : "";
  ui.keyStatus.textContent = keyCard.collected
    ? "KARTU AKSES: DIDAPAT"
    : "KARTU AKSES: BELUM DIDAPAT";
}

// =====================================================
// 4. MEMBUAT PETA LEVEL
// =====================================================

function buildMap(config) {
  map = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(0)
  );

  walls = [];

  // Tembok luar.
  for (let x = 0; x < COLS; x++) {
    map[0][x] = 1;
    map[ROWS - 1][x] = 1;
  }

  for (let y = 0; y < ROWS; y++) {
    map[y][0] = 1;
    map[y][COLS - 1] = 1;
  }

  // Tambahkan dinding berdasarkan konfigurasi.
  for (const [x, y, w, h] of config.walls) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const tx = x + dx;
        const ty = y + dy;

        if (
          tx > 0 && tx < COLS - 1 &&
          ty > 0 && ty < ROWS - 1
        ) {
          map[ty][tx] = 1;
        }
      }
    }
  }

  // Pastikan area penting dapat dijangkau.
  const clearTile = (point) => {
    map[point[1]][point[0]] = 0;
  };

  clearTile([2, 2]);
  clearTile(config.key);
  clearTile(config.door);

  config.terminals.forEach(clearTile);

  config.guards.forEach(g => {
    clearTile([Math.round(g.x), Math.round(g.y)]);
  });

  config.lasers.forEach(clearTile);

  // Buat daftar kotak dinding untuk pemeriksaan tabrakan.
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === 1) {
        walls.push({
          x: x * TILE,
          y: y * TILE,
          w: TILE,
          h: TILE
        });
      }
    }
  }

  terminals = config.terminals.map((point, index) => {
    const pos = tileCenter(point);

    return {
      x: pos.x,
      y: pos.y,
      radius: 15,
      index,
      solved: false,
      pulse: Math.random() * 5
    };
  });

  keyCard = {
    ...tileCenter(config.key),
    collected: false
  };

  door = {
    ...tileCenter(config.door),
    w: 30,
    h: 34
  };

  lasers = config.lasers.map(point => {
    const pos = tileCenter(point);

    return {
      ...pos,
      w: 24,
      h: 24,
      phase: Math.random() * Math.PI * 2
    };
  });

  const openPatrolTiles = [];
  for (let ty = 1; ty < ROWS - 1; ty++) {
    for (let tx = 1; tx < COLS - 1; tx++) {
      if (map[ty][tx] === 0) openPatrolTiles.push([tx, ty]);
    }
  }

  guards = config.guards.map(g => {
    const startX = Math.round(g.x);
    const startY = Math.round(g.y);
    return {
      x: startX * TILE + TILE / 2,
      y: startY * TILE + TILE / 2,
      speed: g.speed * 55,
      baseSpeed: g.speed * 55,
      w: 25,
      h: 27,
      mode: "patrol",
      path: [],
      pathIndex: 0,
      repathTimer: Math.random() * 0.3,
      targetTile: null,
      openPatrolTiles
    };
  });
  guards.forEach(guard => chooseGuardPatrolTarget(guard));
}

// =====================================================
// 5. SOAL MATEMATIKA ACAK
// =====================================================

function makeNumericQuestion(text, answer, explanation) {
  const correct = Number(answer);

  return {
    text,
    answer: String(correct),
    explanation,
    check(value) {
      const normalized = value.trim().replace(",", ".");
      if (!normalized) return false;

      const parsed = Number(normalized);

      return Number.isFinite(parsed) &&
        Math.abs(parsed - correct) < 0.000001;
    }
  };
}

function generateFunctionQuestion() {
  const type = rand(1, 3);

  if (type === 1) {
    const a = rand(2, 8);
    const b = rand(1, 12);
    const x = rand(2, 10);
    const answer = a * x + b;

    return makeNumericQuestion(
      `Diketahui f(x) = ${a}x + ${b}. Hitung nilai f(${x}).`,
      answer,
      `f(${x}) = ${a} × ${x} + ${b} = ${answer}.`
    );
  }

  if (type === 2) {
    const a = rand(2, 8);
    const b = rand(1, 12);
    const x = rand(2, 10);
    const answer = a * x - b;

    return makeNumericQuestion(
      `Jika f(x) = ${a}x - ${b}, tentukan f(${x}).`,
      answer,
      `f(${x}) = ${a} × ${x} - ${b} = ${answer}.`
    );
  }

  const b = rand(1, 10);
  const x = rand(2, 8);
  const answer = x * x + b;

  return makeNumericQuestion(
    `Diketahui f(x) = x² + ${b}. Tentukan f(${x}).`,
    answer,
    `f(${x}) = ${x}² + ${b} = ${answer}.`
  );
}

function generateCompositionQuestion() {
  const type = rand(1, 3);

  if (type === 1) {
    const a = rand(2, 5);
    const b = rand(1, 8);
    const c = rand(1, 6);
    const x = rand(1, 8);
    const inner = x + c;
    const answer = a * inner + b;

    return makeNumericQuestion(
      `f(x) = ${a}x + ${b} dan g(x) = x + ${c}. Hitung (f ∘ g)(${x}).`,
      answer,
      `g(${x}) = ${inner}. Kemudian f(${inner}) = ${a} × ${inner} + ${b} = ${answer}.`
    );
  }

  if (type === 2) {
    const b = rand(1, 7);
    const c = rand(1, 4);
    const x = rand(1, 6);
    const inner = x + c;
    const answer = inner * inner + b;

    return makeNumericQuestion(
      `f(x) = x² + ${b} dan g(x) = x + ${c}. Hitung (f ∘ g)(${x}).`,
      answer,
      `g(${x}) = ${inner}. Maka f(${inner}) = ${inner}² + ${b} = ${answer}.`
    );
  }

  const a = rand(2, 5);
  const b = rand(1, 8);
  const c = rand(2, 5);
  const d = rand(1, 6);
  const x = rand(1, 5);
  const inner = c * x + d;
  const answer = a * inner + b;

  return makeNumericQuestion(
    `f(x) = ${a}x + ${b} dan g(x) = ${c}x + ${d}. Hitung (f ∘ g)(${x}).`,
    answer,
    `g(${x}) = ${inner}, sehingga f(${inner}) = ${a} × ${inner} + ${b} = ${answer}.`
  );
}

function generateInverseQuestion() {
  const a = rand(2, 8);
  const b = rand(1, 12);
  const x = rand(2, 10);
  const y = a * x + b;

  return makeNumericQuestion(
    `Diketahui f(x) = ${a}x + ${b}. Tentukan nilai f⁻¹(${y}).`,
    x,
    `f⁻¹(x) = (x - ${b})/${a}. Jadi f⁻¹(${y}) = (${y} - ${b})/${a} = ${x}.`
  );
}

function generateQuestion() {
  if (levelIndex === 0) {
    return generateFunctionQuestion();
  }

  if (levelIndex === 1) {
    return generateCompositionQuestion();
  }

  // Level 3 menggabungkan komposisi dan invers.
  return Math.random() < 0.5
    ? generateCompositionQuestion()
    : generateInverseQuestion();
}

// =====================================================
// 6. MEMULAI DAN MENGULANG PERMAINAN
// =====================================================

let briefingIndex = 0;
let isGamePaused = false;

function updateMissionBriefing(index) {
  briefingIndex = Math.max(0, Math.min(levelConfigs.length - 1, index));
  const config = levelConfigs[briefingIndex];
  $("brief-number").textContent = `OPERATION 0${briefingIndex + 1}`;
  $("brief-duration").textContent = `${config.duration} SECONDS`;
  $("brief-title").textContent = config.name.toUpperCase();
  $("brief-topic").textContent = config.topic.toUpperCase();
  $("brief-story").textContent = config.story;
  $("brief-objectives").replaceChildren();
  ["Selesaikan 3 terminal data.", "Temukan dan ambil kartu akses.", "Capai pintu keluar untuk menyelesaikan operasi."].forEach(item => {
    const li = document.createElement("li"); li.textContent = item; $("brief-objectives").appendChild(li);
  });
  document.querySelectorAll(".mission-tab").forEach((tab, i) => {
    tab.classList.toggle("active", i === briefingIndex);
    tab.setAttribute("aria-pressed", String(i === briefingIndex));
  });
  $("brief-prev").disabled = briefingIndex === 0;
  $("brief-next").disabled = briefingIndex === levelConfigs.length - 1;
}

function returnHome() {
  cancelAnimationFrame(animationId);
  playing = false; pausedForTerminal = false; gameEnded = false;
  isGamePaused = false;
  $("pause-btn").disabled = true;
  ui.pause.classList.add("hidden");
  stopBackgroundMusic();
  stopGameSoundtrack();
  ui.modal.classList.add("hidden"); ui.end.classList.add("hidden");
  ui.briefing.classList.add("hidden"); ui.start.classList.remove("hidden");
  hideBanner(); drawTitleBackground(); updateHUD();
}

function startMission() {
  cancelAnimationFrame(animationId);
  stopGameSoundtrack();
  startGameSoundtrack();

  levelIndex = 0;
  score = 0;
  lives = 3;
  timeLeft = levelConfigs[0].duration;
  timerAccumulator = 0;

  playing = true;
  isGamePaused = false;
  $("pause-btn").disabled = false;
  ui.pause.classList.add("hidden");
  pausedForTerminal = false;
  gameEnded = false;
  questionCount = 0;
  solvedCount = 0;
  currentQuestion = null;
  currentTerminal = null;

  ui.start.classList.add("hidden");
  ui.briefing.classList.add("hidden");
  ui.end.classList.add("hidden");
  ui.modal.classList.add("hidden");
  hideBanner();

  startLevel();
}

function startLevel() {
  const config = levelConfigs[levelIndex];

  timeLeft = config.duration;
  timerAccumulator = 0;

  questionCount = 0;
  solvedCount = 0;
  currentQuestion = null;
  currentTerminal = null;
  pausedForTerminal = false;

  player.x = 2 * TILE + TILE / 2;
  player.y = 2 * TILE + TILE / 2;
  player.face = "down";
  player.walkTime = 0;
  player.invulnerable = 1.5;

  buildMap(config);

  ui.description.textContent = config.description;
  setObjective("SELESAIKAN 3 TERMINAL DATA");

  updateHUD();
  showBanner(`MISI ${levelIndex + 1}: ${config.name}`, 2.5);
  playSound("level");
}

function restartFromLevelOne(message) {
  playAudioAsset(soundtrack.gameOver);
  stopGameSoundtrack();
  stopBackgroundMusic();
  playing = false;
  pausedForTerminal = false;
  gameEnded = true;

  ui.modal.classList.add("hidden");
  hideBanner();

  showEndScreen(
    false,
    "MISI GAGAL",
    message,
    "AGENT IN TRAINING"
  );
}

// =====================================================
// 7. TIMER
// =====================================================

function updateTimer(dt) {
  if (!playing || gameEnded) return;

  timeLeft -= dt;

  if (timeLeft <= 0) {
    timeLeft = 0;
    updateHUD();
    loseLife("Waktu habis!", true);
    if (!gameEnded) {
      if (pausedForTerminal) closeTerminal();
      timeLeft = levelConfigs[levelIndex].duration;
      timerAccumulator = 0;
      player.x = 2 * TILE + TILE / 2;
      player.y = 2 * TILE + TILE / 2;
      player.invulnerable = 1.5;
      updateHUD();
      showBanner(`WAKTU DIULANG: ${formatTime(timeLeft)}`, 1.8);
    }
    return;
  }

  updateHUD();
}

// =====================================================
// 8. TABRAKAN DAN GERAKAN
// =====================================================

function intersects(a, b) {
  return (
    a.x - a.w / 2 < b.x + b.w / 2 &&
    a.x + a.w / 2 > b.x - b.w / 2 &&
    a.y - a.h / 2 < b.y + b.h / 2 &&
    a.y + a.h / 2 > b.y - b.h / 2
  );
}

function isBlocked(x, y) {
  const box = {
    x,
    y,
    w: player.w,
    h: player.h
  };

  return walls.some(wall => {
    return intersects(box, {
      x: wall.x + wall.w / 2,
      y: wall.y + wall.h / 2,
      w: wall.w,
      h: wall.h
    });
  });
}

function getMovement() {
  let dx = 0;
  let dy = 0;

  if (keys.has("ArrowLeft") || keys.has("a") ||
      touchDirections.left) dx--;

  if (keys.has("ArrowRight") || keys.has("d") ||
      touchDirections.right) dx++;

  if (keys.has("ArrowUp") || keys.has("w") ||
      touchDirections.up) dy--;

  if (keys.has("ArrowDown") || keys.has("s") ||
      touchDirections.down) dy++;

  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  return { dx, dy };
}

function movePlayer(dt) {
  if (!playing || pausedForTerminal || gameEnded) return;

  const { dx, dy } = getMovement();

  if (dx !== 0 || dy !== 0) {
    player.walkTime += dt * 10;

    if (Math.abs(dx) > Math.abs(dy)) {
      player.face = dx > 0 ? "right" : "left";
    } else {
      player.face = dy > 0 ? "down" : "up";
    }
  }

  const nextX = player.x + dx * player.speed * dt;
  const nextY = player.y + dy * player.speed * dt;

  if (!isBlocked(nextX, player.y)) {
    player.x = nextX;
  }

  if (!isBlocked(player.x, nextY)) {
    player.y = nextY;
  }

  player.x = Math.max(
    player.w / 2 + 2,
    Math.min(WIDTH - player.w / 2 - 2, player.x)
  );

  player.y = Math.max(
    player.h / 2 + 2,
    Math.min(HEIGHT - player.h / 2 - 2, player.y)
  );

  player.invulnerable = Math.max(0, player.invulnerable - dt);
}

// =====================================================
// 9. PENJAGA DAN JEBakan
// =====================================================

function guardIsBlocked(x, y, guard) {
  const box = { x, y, w: guard.w, h: guard.h };
  return walls.some(wall => intersects(box, {
    x: wall.x + wall.w / 2,
    y: wall.y + wall.h / 2,
    w: wall.w,
    h: wall.h
  }));
}

function tileIsOpen(tx, ty) {
  return tx > 0 && tx < COLS - 1 &&
    ty > 0 && ty < ROWS - 1 &&
    map[ty] && map[ty][tx] === 0;
}

function findGuardPath(startX, startY, goalX, goalY) {
  const sx = Math.max(1, Math.min(COLS - 2, Math.floor(startX / TILE)));
  const sy = Math.max(1, Math.min(ROWS - 2, Math.floor(startY / TILE)));
  const gx = Math.max(1, Math.min(COLS - 2, goalX));
  const gy = Math.max(1, Math.min(ROWS - 2, goalY));
  if (!tileIsOpen(gx, gy)) return [];

  const startKey = `${sx},${sy}`;
  const goalKey = `${gx},${gy}`;
  const queue = [[sx, sy]];
  const previous = new Map([[startKey, null]]);
  const directions = [[1,0],[-1,0],[0,1],[0,-1]];

  while (queue.length) {
    const [x, y] = queue.shift();
    const key = `${x},${y}`;
    if (key === goalKey) break;
    // Acak urutan tetangga agar pilihan jalur tidak selalu sama.
    for (const [dx, dy] of shuffle(directions)) {
      const nx = x + dx, ny = y + dy;
      const nextKey = `${nx},${ny}`;
      if (tileIsOpen(nx, ny) && !previous.has(nextKey)) {
        previous.set(nextKey, key);
        queue.push([nx, ny]);
      }
    }
  }

  if (!previous.has(goalKey)) return [];
  const path = [];
  let key = goalKey;
  while (key && key !== startKey) {
    const [x, y] = key.split(",").map(Number);
    path.unshift({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
    key = previous.get(key);
  }
  return path;
}

function chooseGuardPatrolTarget(guard) {
  const currentX = Math.floor(guard.x / TILE);
  const currentY = Math.floor(guard.y / TILE);
  const candidates = guard.openPatrolTiles.filter(([x, y]) =>
    Math.abs(x - currentX) + Math.abs(y - currentY) >= 3
  );
  if (!candidates.length) return;
  const [tx, ty] = candidates[rand(0, candidates.length - 1)];
  guard.targetTile = [tx, ty];
  guard.path = findGuardPath(guard.x, guard.y, tx, ty);
  guard.pathIndex = 0;
  guard.mode = "patrol";
  guard.speed = guard.baseSpeed;
}

function canGuardSeePlayer(guard) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const range = levelIndex === 2 ? 260 : 225;
  if (Math.hypot(dx, dy) > range) return false;

  // Periksa garis pandang terhadap dinding menggunakan langkah kecil.
  const steps = Math.ceil(Math.hypot(dx, dy) / 10);
  for (let i = 1; i < steps; i++) {
    const x = guard.x + dx * i / steps;
    const y = guard.y + dy * i / steps;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (map[ty] && map[ty][tx] === 1) return false;
  }
  return true;
}

function moveGuardToward(guard, target, dt) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return true;

  const step = Math.min(dist, guard.speed * dt);
  const nx = guard.x + dx / dist * step;
  const ny = guard.y + dy / dist * step;

  // Sumbu X dan Y dicek terpisah agar penjaga tidak menembus tembok.
  if (!guardIsBlocked(nx, guard.y, guard)) guard.x = nx;
  if (!guardIsBlocked(guard.x, ny, guard)) guard.y = ny;

  return Math.hypot(target.x - guard.x, target.y - guard.y) < 4;
}

function updateGuards(dt) {
  if (!playing || gameEnded) return;

  for (const guard of guards) {
    guard.repathTimer -= dt;
    const seesPlayer = canGuardSeePlayer(guard);

    if (seesPlayer) {
      guard.mode = "chase";
      guard.speed = guard.baseSpeed * 1.28;
      if (guard.repathTimer <= 0) {
        const tx = Math.floor(player.x / TILE);
        const ty = Math.floor(player.y / TILE);
        guard.path = findGuardPath(guard.x, guard.y, tx, ty);
        guard.pathIndex = 0;
        guard.repathTimer = 0.28;
      }
    } else if (guard.mode === "chase") {
      guard.repathTimer = 0;
      chooseGuardPatrolTarget(guard);
    } else if (guard.repathTimer <= 0 ||
               guard.pathIndex >= guard.path.length) {
      chooseGuardPatrolTarget(guard);
      guard.repathTimer = 0.45 + Math.random() * 0.7;
    }

    if (guard.path && guard.pathIndex < guard.path.length) {
      const target = guard.path[guard.pathIndex];
      if (moveGuardToward(guard, target, dt)) {
        guard.pathIndex++;
        if (guard.pathIndex >= guard.path.length && guard.mode === "patrol") {
          guard.repathTimer = 0;
        }
      }
    } else if (guard.mode === "chase") {
      // Jika agen berada di petak yang sama, bergerak mendekat tanpa melewati tembok.
      moveGuardToward(guard, player, dt);
    }

    if (player.invulnerable <= 0 && intersects(player, guard)) {
      loseLife("Tertangkap penjaga!", true);
      if (gameEnded) return;
    }
  }

  for (const laser of lasers) {
    laser.phase += dt * 3;
    const active = Math.sin(laser.phase) > -0.15;
    if (active && player.invulnerable <= 0 && intersects(player, laser)) {
      loseLife("Terkena jebakan laser!", true);
      if (gameEnded) return;
    }
  }
}

function loseLife(message, force = false) {
  if ((!force && player.invulnerable > 0) || gameEnded) return;

  lives = Math.max(0, lives - 1);
  player.invulnerable = 1.5;
  playSound(message.toLowerCase().includes("penjaga") ? "caught" : "life");

  updateHUD();
  showBanner(`${message} Nyawa tersisa: ${lives}`, 1.5);

  if (lives <= 0) {
    playSound("lose");
    restartFromLevelOne(
      "Semua nyawa habis. Operasi harus diulang dari Level 1."
    );
  }
}

// =====================================================
// 10. KARTU AKSES, TERMINAL, DAN PINTU
// =====================================================

function updateObjectives() {
  if (!playing || pausedForTerminal || gameEnded) return;

  // Ambil kartu akses.
  if (
    !keyCard.collected &&
    distance(player, keyCard) < 25
  ) {
    keyCard.collected = true;
    score += 50;
    playSound("key");

    updateHUD();
    showBanner("KARTU AKSES DIDAPAT! +50 POIN", 2);
  }

  const nearbyTerminal = terminals.find(terminal =>
    distance(player, terminal) < 35
  );

  if (nearbyTerminal && !nearbyTerminal.solved) {
    setObjective(`TEKAN E UNTUK TERMINAL ${nearbyTerminal.index + 1}`);
  } else if (!keyCard.collected) {
    setObjective("CARI KARTU AKSES KUNING");
  } else if (solvedCount < terminals.length) {
    setObjective(`SELESAIKAN TERMINAL ${solvedCount}/3`);
  } else {
    setObjective("MENUJU PINTU KELUAR");
  }

  // Pintu hanya dapat digunakan jika semua syarat selesai.
  if (distance(player, door) < 30) {
    if (!keyCard.collected) {
      showBanner("PINTU TERKUNCI: CARI KARTU AKSES", 1);
    } else if (solvedCount < terminals.length) {
      showBanner("AKSES DITOLAK: SELESAIKAN SEMUA TERMINAL", 1);
    } else {
      completeLevel();
    }
  }
}

function interact() {
  if (!playing || gameEnded) return;

  if (pausedForTerminal) return;

  const terminal = terminals.find(item =>
    !item.solved && distance(player, item) < 35
  );

  if (terminal) {
    playSound("interact");
    openTerminal(terminal);
    return;
  }

  if (distance(player, door) < 35) {
    playSound("door");
    if (!keyCard.collected) {
      showBanner("KARTU AKSES MASIH DIPERLUKAN", 1.5);
    } else if (solvedCount < terminals.length) {
      showBanner("MASIH ADA TERMINAL YANG BELUM SELESAI", 1.5);
    } else {
      completeLevel();
    }
  }
}

function completeLevel() {
  if (!playing || gameEnded) return;

  if (levelIndex < levelConfigs.length - 1) {
    levelIndex++;
    startLevel();
    return;
  }

  playing = false;
  gameEnded = true;

  stopGameSoundtrack();
  stopBackgroundMusic();
  showEndScreen(
    true,
    "MISI BERHASIL",
    "Sistem keamanan telah dipulihkan. Seluruh operasi berhasil diselesaikan!",
    getRank(score)
  );
}

function getRank(totalScore) {
  if (totalScore >= 1000) return "ELITE AGENT";
  if (totalScore >= 700) return "SENIOR AGENT";
  if (totalScore >= 400) return "FIELD AGENT";
  return "JUNIOR AGENT";
}

// =====================================================
// 11. TERMINAL MATEMATIKA
// =====================================================

function openTerminal(terminal) {
  if (!playing || terminal.solved || pausedForTerminal) return;

  pausedForTerminal = true;
  currentTerminal = terminal;
  currentQuestion = generateQuestion();

  questionCount++;

  ui.terminalIndex.textContent =
    `DATA ${String(terminal.index + 1).padStart(2, "0")}`;

  ui.questionTitle.textContent =
    levelConfigs[levelIndex].topic.toUpperCase();

  ui.question.textContent = currentQuestion.text;
  ui.hint.textContent =
    "Masukkan hasil perhitungan. Jawaban salah mengurangi satu nyawa.";

  ui.feedback.textContent = "";
  ui.feedback.className = "answer-feedback";
  ui.input.value = "";

  ui.modal.classList.remove("hidden");

  // Fokus input setelah panel ditampilkan.
  requestAnimationFrame(() => ui.input.focus());
}

function closeTerminal() {
  ui.modal.classList.add("hidden");

  pausedForTerminal = false;
  currentQuestion = null;
  currentTerminal = null;
}

function submitAnswer(event) {
  event.preventDefault();

  if (
    !pausedForTerminal ||
    !currentQuestion ||
    !currentTerminal ||
    gameEnded
  ) return;

  const value = ui.input.value.trim();

  if (!value) {
    ui.feedback.textContent = "Masukkan jawaban terlebih dahulu.";
    ui.feedback.className = "answer-feedback error";
    return;
  }

  if (currentQuestion.check(value)) {
    playSound("correct");
    currentTerminal.solved = true;
    solvedCount++;
    score += 100;

    ui.feedback.textContent =
      `KODE DITERIMA! +100 poin. ${currentQuestion.explanation}`;

    ui.feedback.className = "answer-feedback success";

    updateHUD();

    const terminalToClose = currentTerminal;

    // Beri waktu membaca umpan balik sebelum melanjutkan.
    setTimeout(() => {
      if (gameEnded || !pausedForTerminal) return;

      if (terminalToClose.solved) {
        closeTerminal();

        if (solvedCount >= terminals.length) {
          setObjective("SEMUA TERMINAL AKTIF — MENUJU PINTU");
          showBanner(
            "SEMUA DATA BERHASIL DIPECAHKAN! CARI PINTU KELUAR.",
            3
          );
        } else {
          showBanner("TERMINAL BERHASIL DIBUKA! +100 POIN", 2);
        }
      }
    }, 900);
  } else {
    playSound("wrong");
    loseLife("Jawaban salah!", true);

    ui.feedback.textContent =
      `KODE SALAH! Nyawa tersisa: ${lives}. Periksa hitunganmu dan coba lagi.`;
    ui.feedback.className = "answer-feedback error";

    if (lives <= 0) {
      setTimeout(() => {
        if (!gameEnded) {
          restartFromLevelOne(
            "Semua nyawa habis saat memecahkan kode. Ulangi dari Level 1."
          );
        }
      }, 250);
    } else {
      ui.input.select();
    }
  }
}

// =====================================================
// 12. GAMBAR PIXEL ART
// =====================================================

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawFloor() {
  const variant = levelIndex;

  const baseColors = ["#1c302d", "#1b2935", "#28252f"];
  const tileColors = ["#223b35", "#223544", "#34313b"];

  rect(0, 0, WIDTH, HEIGHT, baseColors[variant]);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = x * TILE;
      const py = y * TILE;

      rect(px, py, TILE, TILE, baseColors[variant]);

      if ((x + y) % 2 === 0) {
        rect(px + 2, py + 2, TILE - 4, TILE - 4,
          tileColors[variant]);
      }

      // Detail ubin kecil.
      rect(px + 5, py + 5, 2, 2, "#ffffff0b");
      rect(px + TILE - 7, py + TILE - 7, 2, 2, "#00000020");

      // Jalur lantai.
      if (x % 4 === 0 && y % 3 === 0) {
        rect(px + 16, py + 18, 8, 2, "#a6d5ce12");
      }
    }
  }
}

function drawWalls() {
  for (const wall of walls) {
    const x = wall.x;
    const y = wall.y;

    rect(x, y, TILE, TILE, "#344753");
    rect(x + 2, y + 2, TILE - 4, TILE - 4, "#263744");

    rect(x + 3, y + 3, TILE - 6, 4, "#536a77");
    rect(x + 3, y + TILE - 7, TILE - 6, 4, "#17252f");

    rect(x + 8, y + 12, 5, 3, "#3d5260");
    rect(x + 25, y + 23, 6, 3, "#17252f");
  }
}

function drawTerminal(terminal) {
  const x = Math.round(terminal.x);
  const y = Math.round(terminal.y);

  terminal.pulse += 0.03;

  const glow = Math.sin(terminal.pulse) * 0.15 + 0.35;

  if (terminal.solved) {
    rect(x - 12, y - 13, 24, 26, "#174e45");
    rect(x - 8, y - 9, 16, 14, "#57f5d0");
    rect(x - 4, y - 5, 8, 3, "#0b302c");
    rect(x - 3, y + 3, 6, 4, "#57f5d0");
  } else {
    ctx.save();
    ctx.globalAlpha = glow;
    rect(x - 18, y - 18, 36, 36, "#43dff4");
    ctx.restore();

    rect(x - 13, y - 14, 26, 28, "#284e62");
    rect(x - 10, y - 11, 20, 15, "#52dff4");
    rect(x - 7, y - 8, 14, 3, "#143447");
    rect(x - 7, y - 2, 9, 3, "#143447");
    rect(x - 5, y + 5, 10, 4, "#6fa9bd");
  }

  // Petunjuk interaksi.
  if (distance(player, terminal) < 35 && !terminal.solved) {
    rect(x - 12, y - 34, 24, 13, "#09141b");
    ctx.fillStyle = "#57f5d0";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("E", x, y - 25);
  }
}

function drawKeyCard() {
  if (keyCard.collected) return;

  const x = Math.round(keyCard.x);
  const y = Math.round(keyCard.y);

  rect(x - 12, y - 8, 24, 16, "#8c6924");
  rect(x - 10, y - 7, 20, 12, "#f6d365");
  rect(x - 6, y - 3, 5, 5, "#79571d");
  rect(x + 3, y - 3, 5, 2, "#79571d");
  rect(x + 3, y + 1, 5, 2, "#79571d");
}

function drawDoor() {
  const unlocked = keyCard.collected &&
    solvedCount >= terminals.length;

  const x = Math.round(door.x);
  const y = Math.round(door.y);

  rect(x - 17, y - 20, 34, 40, "#121c24");
  rect(x - 14, y - 18, 28, 36,
    unlocked ? "#276d58" : "#594239");

  rect(x - 10, y - 14, 20, 28,
    unlocked ? "#49d7a4" : "#9b6c4c");

  rect(x - 6, y - 9, 12, 18,
    unlocked ? "#153f37" : "#3d302b");

  rect(x + 5, y - 1, 3, 4, "#f6d365");

  if (unlocked && distance(player, door) < 50) {
    ctx.fillStyle = "#57f5d0";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", x, y - 27);
  }
}

function drawLasers() {
  for (const laser of lasers) {
    const active = Math.sin(laser.phase) > -0.15;

    rect(laser.x - 13, laser.y - 13, 26, 26, "#202d36");
    rect(laser.x - 9, laser.y - 9, 18, 18, "#354a56");

    if (active) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      rect(laser.x - 11, laser.y - 3, 22, 6, "#ff526c");
      ctx.restore();
    } else {
      rect(laser.x - 11, laser.y - 3, 22, 6, "#a23c51");
    }
  }
}

function drawGuard(guard) {
  const x = Math.round(guard.x);
  const y = Math.round(guard.y);

  // Bayangan.
  rect(x - 12, y + 11, 24, 5, "#00000045");

  // Kaki.
  rect(x - 9, y + 5, 7, 8, "#252b39");
  rect(x + 2, y + 5, 7, 8, "#252b39");

  // Tubuh.
  rect(x - 12, y - 7, 24, 15, "#a83248");
  rect(x - 9, y - 4, 18, 9, "#d94a5d");

  // Kepala.
  rect(x - 9, y - 18, 18, 13, "#d3a27e");
  rect(x - 11, y - 20, 22, 6, "#303542");

  // Kacamata pengaman.
  rect(x - 8, y - 13, 16, 5, "#192c3c");
  rect(x - 6, y - 12, 4, 3, "#ff6375");
  rect(x + 2, y - 12, 4, 3, "#ff6375");

  rect(x - 5, y + 1, 10, 3, "#ff9aa7");
}

function drawAgent() {
  const x = Math.round(player.x);
  const y = Math.round(player.y);

  if (
    player.invulnerable > 0 &&
    Math.floor(performance.now() / 100) % 2 === 0
  ) {
    return;
  }

  // Bayangan.
  rect(x - 12, y + 11, 24, 5, "#00000050");

  const step = Math.sin(player.walkTime) > 0 ? 2 : -2;
  const moving = getMovement().dx !== 0 || getMovement().dy !== 0;

  // Sepatu dan kaki.
  rect(x - 9, y + 5, 7, 8 + (moving ? step : 0), "#26374a");
  rect(x + 2, y + 5, 7, 8 - (moving ? step : 0), "#26374a");

  rect(x - 10, y + 10 + (moving ? step : 0), 8, 4, "#f0f2eb");
  rect(x + 2, y + 10 - (moving ? step : 0), 8, 4, "#f0f2eb");

  // Tubuh agen.
  rect(x - 12, y - 7, 24, 15, "#216a62");
  rect(x - 9, y - 5, 18, 11, "#37b9a1");
  rect(x - 4, y - 5, 8, 10, "#1c5551");

  // Sabuk.
  rect(x - 11, y + 4, 22, 3, "#c7b66c");
  rect(x - 2, y + 3, 4, 4, "#f6d365");

  // Lengan.
  rect(x - 16, y - 5, 5, 12, "#d5a47c");
  rect(x + 11, y - 5, 5, 12, "#d5a47c");

  // Kepala.
  rect(x - 9, y - 18, 18, 13, "#e2b68f");

  // Rambut.
  rect(x - 10, y - 20, 20, 6, "#292c35");
  rect(x - 9, y - 17, 4, 5, "#292c35");

  // Arah pandangan.
  if (player.face === "down") {
    rect(x - 7, y - 11, 4, 3, "#182b3b");
    rect(x + 3, y - 11, 4, 3, "#182b3b");
  } else if (player.face === "up") {
    rect(x - 8, y - 17, 16, 7, "#292c35");
  } else if (player.face === "left") {
    rect(x - 9, y - 12, 4, 4, "#182b3b");
  } else {
    rect(x + 5, y - 12, 4, 4, "#182b3b");
  }

  // Lencana agen.
  rect(x + 3, y - 1, 5, 5, "#f6d365");
}

function drawWorld() {
  drawFloor();
  drawWalls();
  drawLasers();

  // Urutan gambar agar objek berada di lapisan yang tepat.
  drawKeyCard();
  drawDoor();

  terminals.forEach(drawTerminal);
  guards.forEach(drawGuard);
  drawAgent();
}

// =====================================================
// 13. GAME LOOP
// =====================================================

function gameLoop(timestamp) {
  if (gameEnded || !playing || isGamePaused) return;

  if (!lastFrame) lastFrame = timestamp;

  // Batasi dt agar gerakan tidak melompat setelah tab tidak aktif.
  const dt = Math.min((timestamp - lastFrame) / 1000, 0.05);
  lastFrame = timestamp;

  if (bannerTimer > 0) {
    bannerTimer -= dt;

    if (bannerTimer <= 0) {
      hideBanner();
    }
  }

  updateTimer(dt);

  if (!gameEnded && !pausedForTerminal) {
    movePlayer(dt);
    updateGuards(dt);
    updateObjectives();

    const movement = getMovement();
    if (movement.dx !== 0 || movement.dy !== 0) {
      audioSystem.stepCooldown -= dt;
      if (audioSystem.stepCooldown <= 0) {
        playSound("step");
        audioSystem.stepCooldown = 0.28;
      }
    } else {
      audioSystem.stepCooldown = 0;
    }
  }

  drawWorld();

  if (!gameEnded) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

// =====================================================
// 14. LAYAR HASIL
// =====================================================

function showEndScreen(success, title, description, rank) {
  if (!success && soundtrack.gameOver.paused) playAudioAsset(soundtrack.gameOver);
  if (success) stopGameSoundtrack();
  playing = false;
  isGamePaused = false;
  $("pause-btn").disabled = true;
  ui.pause.classList.add("hidden");
  pausedForTerminal = false;
  gameEnded = true;

  cancelAnimationFrame(animationId);

  ui.modal.classList.add("hidden");

  ui.endIcon.textContent = success ? "✓" : "!";
  ui.endEyebrow.textContent =
    success ? "MISSION COMPLETE" : "MISSION FAILED";

  ui.endTitle.textContent = title;
  ui.endDescription.textContent = description;
  ui.endScore.textContent = String(score).padStart(4, "0");
  ui.endRank.textContent = rank;

  ui.end.classList.remove("hidden");
  updateHUD();
}

function pauseGame() {
  if (!playing || gameEnded || isGamePaused || pausedForTerminal || !ui.modal.classList.contains("hidden")) return;
  isGamePaused = true;
  keys.clear();
  Object.keys(touchDirections).forEach(dir => { touchDirections[dir] = false; });
  cancelAnimationFrame(animationId);
  soundtrack.background.pause();
  ui.pause.classList.remove("hidden");
  $("pause-btn").textContent = "▶ RESUME";
  playAudioAsset(soundtrack.button);
}

function resumeGame() {
  if (!playing || gameEnded || !isGamePaused) return;
  isGamePaused = false;
  ui.pause.classList.add("hidden");
  $("pause-btn").textContent = "Ⅱ PAUSE";
  const playback = soundtrack.background.play();
  if (playback && typeof playback.catch === "function") playback.catch(() => {});
  lastFrame = 0;
  playAudioAsset(soundtrack.button);
  animationId = requestAnimationFrame(gameLoop);
}

// =====================================================
// 15. KEYBOARD
// =====================================================

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright"]
      .includes(key)
  ) {
    event.preventDefault();
  }

  if (key === "p" && !event.repeat) {
    if (isGamePaused) resumeGame(); else pauseGame();
    return;
  }

  if (key === "e" && !event.repeat) {
    interact();
    return;
  }

  if (key === "escape" && pausedForTerminal) {
    closeTerminal();
    return;
  }

  if (["arrowup", "arrowdown", "arrowleft", "arrowright",
       "w", "a", "s", "d"].includes(key)) {
    keys.add(key);
  }
});

window.addEventListener("keyup", event => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => {
  keys.clear();

  Object.keys(touchDirections).forEach(dir => {
    touchDirections[dir] = false;
  });
});

// =====================================================
// 16. KONTROL SENTUH
// =====================================================

document.querySelectorAll(".direction-btn").forEach(button => {
  const direction = button.dataset.dir;

  const press = event => {
    event.preventDefault();
    touchDirections[direction] = true;

    try {
      button.setPointerCapture(event.pointerId);
    } catch (_) {
      // Pointer capture tidak wajib untuk menjalankan game.
    }
  };

  const release = event => {
    event.preventDefault();
    touchDirections[direction] = false;
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

$("interact-btn").addEventListener("pointerdown", event => {
  event.preventDefault();
  interact();
});

ui.form.addEventListener("submit", event => {
  playAudioAsset(soundtrack.button);
  submitAnswer(event);
});

$("close-terminal").addEventListener("click", () => {
  playAudioAsset(soundtrack.button);
  closeTerminal();
});

$("briefing-btn").addEventListener("click", () => {
  updateMissionBriefing(0); ui.start.classList.add("hidden"); ui.briefing.classList.remove("hidden");
});
document.querySelectorAll(".mission-tab").forEach(tab => tab.addEventListener("click", () => updateMissionBriefing(Number(tab.dataset.mission))));
$("brief-prev").addEventListener("click", () => updateMissionBriefing(briefingIndex - 1));
$("brief-next").addEventListener("click", () => updateMissionBriefing(briefingIndex + 1));
$("brief-back").addEventListener("click", () => { ui.briefing.classList.add("hidden"); ui.start.classList.remove("hidden"); });
$("brief-start").addEventListener("click", () => {
  playAudioAsset(soundtrack.button); initAudio(); startMission(); lastFrame = 0; animationId = requestAnimationFrame(gameLoop);
});
$("pause-btn").addEventListener("click", () => { if (isGamePaused) resumeGame(); else pauseGame(); });
$("resume-btn").addEventListener("click", resumeGame);
$("pause-home-btn").addEventListener("click", () => { playAudioAsset(soundtrack.button); returnHome(); });
$("home-btn").addEventListener("click", () => { playAudioAsset(soundtrack.button); returnHome(); });
$("end-home-btn").addEventListener("click", () => { playAudioAsset(soundtrack.button); returnHome(); });

$("start-btn").addEventListener("click", () => {
  playAudioAsset(soundtrack.button);
  initAudio();
  startMission();
  lastFrame = 0;
  animationId = requestAnimationFrame(gameLoop);
});

$("restart-btn").addEventListener("click", () => {
  playAudioAsset(soundtrack.button);
  initAudio();
  ui.end.classList.add("hidden");
  startMission();
  lastFrame = 0;
  animationId = requestAnimationFrame(gameLoop);
});

// =====================================================
// 17. TAMPILAN AWAL
// =====================================================

function drawTitleBackground() {
  levelIndex = 0;
  buildMap(levelConfigs[0]);
  drawWorld();
}

drawTitleBackground();
updateHUD();