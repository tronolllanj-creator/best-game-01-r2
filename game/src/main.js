import { CONFIG } from './config.js';
import { createRng } from './random.js';
import { createWorld, step } from './world.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { autopilotInput, stageShot } from './shots.js';
import { createUpgrades, canBuy, buy, getItems } from './upgrades.js';

const BEST_SCORE_KEY = 'nova-salvage-deep-belt-best';

window.onerror = function (msg, src, line, col, err) {
  window.__shotError = err ? (err.stack || err.message) : msg;
};

const canvas = document.getElementById('gameCanvas');
const statusEl = document.getElementById('status');
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();

const urlParams = new URLSearchParams(window.location.search);
const seedParam = urlParams.get('seed');
const seed = seedParam !== null ? parseInt(seedParam, 10) : 7;
const rng = createRng(seed);

const world = createWorld(rng, 'Standard');
const upgrades = createUpgrades();

function loadBest() {
  try {
    const val = localStorage.getItem(BEST_SCORE_KEY);
    if (val !== null) {
      world.bestScore = parseInt(val, 10) || 0;
    }
  } catch (e) {
    // ignore storage errors
  }
}

function saveBest() {
  try {
    if (world.score > world.bestScore) {
      world.bestScore = world.score;
    }
    localStorage.setItem(BEST_SCORE_KEY, world.bestScore.toString());
  } catch (e) {
    // ignore storage errors
  }
}

loadBest();
world.best = world.bestScore;

const prevDigit = { 1: false, 2: false, 3: false, 4: false, 5: false };

function syncRenderState() {
  world.screen = world.state === 'pause' ? 'paused' : world.state;
  world.best = world.bestScore;
  world.spendable = world.spendableCores;
  if (world.boss) { world.boss.hp = world.bossHp; world.boss.maxHp = world.bossMaxHp; }
  world.upgrades = { getItems };
  world.bannerText = world.waveBannerText;
  world.bannerTimer = world.waveBannerTimer;
  world.shake = world.screenShake;
  world.mines = world.drones.filter(d => d.type === 'mine');
  world.stats = {
    wave: world.wave,
    cores: world.coresCollected,
    kills: world.kills,
    accuracy: world.shotsFired ? Math.round((world.shotsHit / world.shotsFired) * 1000) / 10 : 0,
    score: world.score
  };
}

function handleAudioTriggers(triggers) {
  if (!triggers || triggers.length === 0) return;
  for (const name of triggers) {
    if (name === 'shoot') audio.shoot();
    else if (name === 'explode') audio.explode('medium');
    else if (name === 'pickup') audio.pickup();
    else if (name === 'hurt') audio.hurt();
    else if (name === 'wave') audio.wave();
    else if (name === 'dash') audio.dash();
    else if (name === 'win') audio.win();
    else if (name === 'lose') audio.lose();
    else if (name === 'coin') audio.coin();
    else if (name === 'bossAlarm') audio.bossAlarm();
  }
  triggers.length = 0;
}

window.addEventListener('keydown', (e) => {
  audio.unlock();
  if (e.code === 'KeyM') {
    audio.setMuted(!audio.getMuted());
  }
});

canvas.addEventListener('pointerdown', () => {
  audio.unlock();
});

const shotParam = urlParams.get('shot');

function runShot(shot) {
  stageShot(world, shot, rng);
  const simDuration = shot === 'start' ? 6 : shot === 'play' ? 28 : shot === 'boss' ? 6 : 600;
  const dt = 1 / 60;
  let timeElapsed = 0;

  while (timeElapsed < simDuration) {
    const strength = shot === 'start' ? 0.5 : 1.0;
    const ap = autopilotInput(world, strength);
    input.autoPilot = true;
    input.mouseX = world.ship.x + ap.x * 300;
    input.mouseY = world.ship.y + ap.y * 300;
    input.mouseDown = ap.fire;
    input.dash = ap.dash;

    step(world, input, dt, upgrades);
    handleAudioTriggers(world.soundTriggers);
    saveBest();

    if (shot === 'end' && (world.state === 'over' || world.state === 'win')) {
      break;
    }
    timeElapsed += dt;
  }

  syncRenderState();
  renderer.draw(world);
  renderer.draw(world);

  window.__shotReady = true;
  if (statusEl) statusEl.textContent = 'READY';
}

if (shotParam) {
  try {
    runShot(shotParam);
  } catch (err) {
    window.__shotError = err ? (err.stack || err.message) : String(err);
  }
} else {
  let lastTime = performance.now();
  let accumulator = 0;
  const fixedDt = 1 / 60;

  function gameLoop(currentTime) {
    let frameDt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    if (frameDt > 0.25) frameDt = 0.25;
    accumulator += frameDt;

    while (accumulator >= fixedDt) {
      if (world.state === 'shop') {
        for (let i = 1; i <= 5; i++) {
          const key = 'Digit' + i;
          const isPressed = !!input.keys[key];
          const risingEdge = isPressed && !prevDigit[i];
          prevDigit[i] = isPressed;

          if (risingEdge) {
            if (canBuy(world, upgrades, i)) {
              buy(world, upgrades, i);
              audio.coin();
            }
          }
        }
      } else {
        for (let i = 1; i <= 5; i++) {
          prevDigit[i] = !!input.keys['Digit' + i];
        }
      }

      step(world, input, fixedDt, upgrades);
      handleAudioTriggers(world.soundTriggers);
      saveBest();
      accumulator -= fixedDt;
    }

    syncRenderState();
    renderer.draw(world);
    input.clearFrameState();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}
