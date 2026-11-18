import { CONFIG } from './config.js';

export function createWorld(rng, difficultyParam) {
  const diffConfigs = {
    Chill: { hull: 150, maxHull: 150, enemySpeed: 0.85, enemyHpMul: 1 },
    Standard: { hull: 100, maxHull: 100, enemySpeed: 1.0, enemyHpMul: 1 },
    Hard: { hull: 75, maxHull: 75, enemySpeed: 1.2, enemyHpMul: 1 }
  };
  const diff = diffConfigs[difficultyParam] ? difficultyParam : 'Standard';
  const cfg = diffConfigs[diff];

  return {
    state: 'title', // title, play, shop, pause, over, win
    difficulty: diff,
    time: 0,
    score: 0,
    bestScore: 0,
    bestWave: 1,
    wave: 1,
    waveTimer: 0,
    waveBannerTimer: 3.0,
    waveBannerText: 'WAVE 1',
    coresCollected: 0,
    spendableCores: 0,
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
    accuracy: 0,
    combo: 1,
    comboTimer: 0,
    screenShake: 0,
    shakeDuration: 0,

    ship: {
      x: CONFIG.width / 2,
      y: CONFIG.height / 2,
      vx: 0,
      vy: 0,
      radius: 14,
      angle: 0,
      hull: cfg.hull,
      maxHull: cfg.maxHull,
      dashCooldown: 0,
      dashTimer: 0,
      fireCooldown: 0,
      invulnerable: 0,
      shieldTimer: 0,
      overchargeTimer: 0,
      magnetTimer: 0,
      tractorBonus: 0,
      // Upgraded attributes via shop
      fireGap: 0.16,
      bulletDamage: 1,
      dashCooldownMax: 2.2,
      tractorRadiusBase: 120
    },

    rocks: [],
    drones: [],
    bullets: [],
    enemyBullets: [],
    cores: [],
    pickups: [],
    particles: [],
    popups: [],
    events: [],

    boss: null,
    bossActive: false,
    bossMaxHp: 0,
    bossHp: 0,
    bossName: '',

    rng: rng,
    soundTriggers: [],
    autoPilotTimer: 0
  };
}

export function pushEvent(world, type, data = {}) {
  world.events.push({ type, ...data });
}

export function triggerSound(world, name) {
  world.soundTriggers.push(name);
}

export function spawnParticle(world, x, y, vx, vy, color, life, size) {
  world.particles.push({ x, y, vx, vy, color, life, maxLife: life, size });
}

export function spawnPopup(world, text, x, y, color = CONFIG.colors.text) {
  world.popups.push({ text, x, y, vy: -20, life: 1.0, color });
}

export function addScore(world, pts, x, y) {
  const actual = pts * world.combo;
  world.score += actual;
  if (x !== undefined && y !== undefined) {
    spawnPopup(world, `+${actual}`, x, y, CONFIG.colors.gold);
  }
}

export function recordHit(world, killed = false, x, y) {
  world.shotsHit++;
  if (killed) {
    world.combo = Math.min(10, world.combo + 1);
    world.comboTimer = 2.5;
  }
}

export function step(world, input, dt, upgradesState = null) {
  world.soundTriggers = [];
  world.events = [];

  // Update timers
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) {
      world.combo = 1;
    }
  }

  if (world.screenShake > 0) {
    world.shakeDuration -= dt;
    if (world.shakeDuration <= 0) {
      world.screenShake = 0;
    }
  }

  // Handle screen states
  if (world.state === 'title') {
    if (input.start || input.keys.Enter) {
      world.state = 'play';
      startWave(world, 1);
      triggerSound(world, 'wave');
    }
    if (input.keys.Digit1) world.difficulty = 'Chill';
    if (input.keys.Digit2) world.difficulty = 'Standard';
    if (input.keys.Digit3) world.difficulty = 'Hard';
    applyDifficulty(world);
    updateAttractMode(world, dt, input);
    return;
  }

  if (world.state === 'over' || world.state === 'win') {
    if (input.start || input.keys.Enter || input.keys.KeyR) {
      resetGame(world);
    }
    return;
  }

  if (world.state === 'pause') {
    if (input.pause || input.keys.KeyP || input.keys.Escape) {
      world.state = 'play';
    }
    return;
  }

  if (input.pause || input.keys.KeyP || input.keys.Escape) {
    world.state = 'pause';
    return;
  }

  if (world.state === 'shop') {
    // Handled externally or via upgrades integration, but we check continue
    if (input.keys.Enter) {
      world.state = 'play';
      startWave(world, world.wave + 1);
      triggerSound(world, 'wave');
    }
    return;
  }

  if (world.state === 'play') {
    updatePlay(world, input, dt, upgradesState);
  }
}

function applyDifficulty(world) {
  const cfg = {
    Chill: { hull: 150 },
    Standard: { hull: 100 },
    Hard: { hull: 75 }
  }[world.difficulty];
  if (world.ship.maxHull !== cfg.hull && world.wave === 1) {
    world.ship.maxHull = cfg.hull;
    world.ship.hull = cfg.hull;
  }
}

function resetGame(world) {
  const rng = world.rng;
  const diff = world.difficulty;
  const best = world.bestScore;
  const bwave = world.bestWave;
  Object.assign(world, createWorld(rng, diff));
  world.bestScore = best;
  world.bestWave = bwave;
  world.state = 'play';
  startWave(world, 1);
  triggerSound(world, 'wave');
}

function updateAttractMode(world, dt, input) {
  // Gentle drift of rocks and particles in title background
  world.time += dt;
  if (world.rocks.length < 8 && world.rng.next() < 0.05) {
    spawnRock(world, 3, world.rng.next() * CONFIG.width, world.rng.next() * CONFIG.height);
  }
  updateRocks(world, dt);
  updateParticles(world, dt);
}

function startWave(world, waveNum) {
  world.wave = waveNum;
  if (waveNum > world.bestWave) world.bestWave = waveNum;
  world.waveTimer = 0;
  world.waveBannerTimer = 2.0;
  world.waveBannerText = waveNum === 6 ? 'BOSS: SCRAP MAW' : (waveNum === 12 ? 'BOSS: DERELICT HULK' : `WAVE ${waveNum}`);
  pushEvent(world, 'EVENT_WAVE', { wave: waveNum });

  // Clear entities
  world.rocks = [];
  world.drones = [];
  world.enemyBullets = [];

  if (waveNum === 6) {
    spawnBoss(world, 'maw');
    return;
  }
  if (waveNum === 12) {
    spawnBoss(world, 'hulk');
    return;
  }

  // Rocks count: 4 + 2 * n
  const rockCount = 4 + 2 * waveNum;
  for (let i = 0; i < rockCount; i++) {
    const size = world.rng.next() < 0.6 ? 3 : (world.rng.next() < 0.8 ? 2 : 1);
    const x = world.rng.next() * CONFIG.width;
    const y = world.rng.next() * CONFIG.height;
    // Keep away from ship initially
    if (Math.hypot(x - world.ship.x, y - world.ship.y) > 200) {
      spawnRock(world, size, x, y);
    } else {
      i--;
    }
  }

  // Drones & Mines based on wave
  if (waveNum >= 2) {
    const chaserCount = Math.min(8, waveNum - 1);
    for (let i = 0; i < chaserCount; i++) {
      spawnDrone(world, 'chaser');
    }
  }
  if (waveNum >= 3) {
    const mineCount = Math.min(6, waveNum - 2);
    for (let i = 0; i < mineCount; i++) {
      spawnDrone(world, 'mine');
    }
  }
  if (waveNum >= 4) {
    const shooterCount = Math.min(5, waveNum - 3);
    for (let i = 0; i < shooterCount; i++) {
      spawnDrone(world, 'shooter');
    }
  }
}

function updatePlay(world, input, dt, upgradesState) {
  world.time += dt;

  // Apply shop upgrades if present
  if (upgradesState) {
    world.ship.maxHull = upgradesState.maxHull;
    world.ship.bulletDamage = upgradesState.bulletDamage;
    world.ship.fireGap = upgradesState.fireGap;
    world.ship.dashCooldownMax = upgradesState.dashCooldownMax;
    world.ship.tractorBonus = upgradesState.tractorBonus;
  }

  if (world.waveBannerTimer > 0) {
    world.waveBannerTimer -= dt;
  }

  // Drift cores in periodically if core count is low
  if (world.cores.length < 5 && world.rng.next() < 0.02) {
    spawnCore(world, world.rng.next() * CONFIG.width, world.rng.next() < 0.5 ? 0 : CONFIG.height);
  }

  updateShip(world, input, dt);
  updateBullets(world, dt);
  updateRocks(world, dt);
  updateDrones(world, dt);
  updateBoss(world, dt);
  updateCoresAndPickups(world, dt);
  updateParticles(world, dt);
  updatePopups(world, dt);

  checkCollisions(world);

  // Check wave clear condition
  const noEnemies = world.rocks.length === 0 && world.drones.length === 0 && !world.bossActive;
  if (noEnemies && world.waveBannerTimer <= 0) {
    const waveBonus = 500 * world.wave;
    addScore(world, waveBonus);
    pushEvent(world, 'EVENT_WAVE_CLEAR', { wave: world.wave });

    if (world.wave === 12) {
      world.state = 'win';
      const victoryBonus = 2000 + Math.floor(world.ship.hull) * 10;
      world.score += victoryBonus;
      pushEvent(world, 'EVENT_WIN');
    } else {
      // Transition to Shop
      world.state = 'shop';
      pushEvent(world, 'EVENT_SHOP');
    }
  }

  if (world.score > world.bestScore) {
    world.bestScore = world.score;
  }
}

// SHIP LOGIC
function updateShip(world, input, dt) {
  const ship = world.ship;

  // Timers
  if (ship.dashCooldown > 0) ship.dashCooldown -= dt;
  if (ship.dashTimer > 0) ship.dashTimer -= dt;
  if (ship.fireCooldown > 0) ship.fireCooldown -= dt;
  if (ship.invulnerable > 0) ship.invulnerable -= dt;
  if (ship.shieldTimer > 0) ship.shieldTimer -= dt;
  if (ship.overchargeTimer > 0) ship.overchargeTimer -= dt;
  if (ship.magnetTimer > 0) ship.magnetTimer -= dt;

  // Aiming (Mouse or Autopilot / keys)
  let targetAngle = ship.angle;
  if (input.mouseX !== undefined && input.mouseY !== undefined) {
    targetAngle = Math.atan2(input.mouseY - ship.y, input.mouseX - ship.x);
  }
  ship.angle = targetAngle;

  // Movement input
  let ax = 0;
  let ay = 0;
  if (input.keys.KeyW || input.keys.ArrowUp) ay -= 1;
  if (input.keys.KeyS || input.keys.ArrowDown) ay += 1;
  if (input.keys.KeyA || input.keys.ArrowLeft) ax -= 1;
  if (input.keys.KeyD || input.keys.ArrowRight) ax += 1;

  // Autopilot override if specified (for shots/testing)
  if (input.autoPilot) {
    // Simple steering behavior
    ax = Math.cos(ship.angle);
    ay = Math.sin(ship.angle);
  }

  const accel = 620;
  const isDashing = ship.dashTimer > 0;
  const speedMul = isDashing ? 3.2 : 1.0;

  if (ax !== 0 || ay !== 0) {
    const len = Math.hypot(ax, ay);
    ship.vx += (ax / len) * accel * speedMul * dt;
    ship.vy += (ay / len) * accel * speedMul * dt;

    // Particle trail
    if (world.rng.next() < 0.6) {
      spawnParticle(
        world,
        ship.x - Math.cos(ship.angle) * 12,
        ship.y - Math.sin(ship.angle) * 12,
        -ship.vx * 0.3 + (world.rng.next() - 0.5) * 30,
        -ship.vy * 0.3 + (world.rng.next() - 0.5) * 30,
        CONFIG.colors.shipDark,
        0.4,
        2
      );
    }
  }

  // Drag
  const drag = isDashing ? 0.98 : 0.92;
  ship.vx *= Math.pow(drag, dt * 60);
  ship.vy *= Math.pow(drag, dt * 60);

  const maxSpeed = isDashing ? 800 : 340;
  const curSpeed = Math.hypot(ship.vx, ship.vy);
  if (curSpeed > maxSpeed) {
    ship.vx = (ship.vx / curSpeed) * maxSpeed;
    ship.vy = (ship.vy / curSpeed) * maxSpeed;
  }

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  // Screen wrap
  if (ship.x < 0) ship.x = CONFIG.width;
  if (ship.x > CONFIG.width) ship.x = 0;
  if (ship.y < 0) ship.y = CONFIG.height;
  if (ship.y > CONFIG.height) ship.y = 0;

  // Dash action
  if ((input.dash || input.keys.Space || input.keys.ShiftLeft) && ship.dashCooldown <= 0) {
    ship.dashTimer = 0.16;
    ship.dashCooldown = ship.dashCooldownMax;
    ship.invulnerable = Math.max(ship.invulnerable, 0.25);
    triggerSound(world, 'dash');
  }

  // Fire action
  const effectiveFireGap = ship.overchargeTimer > 0 ? ship.fireGap * 0.5 : ship.fireGap;
  if ((input.mouseDown || input.keys.KeyF || input.autoPilot) && ship.fireCooldown <= 0) {
    ship.fireCooldown = effectiveFireGap;
    fireBullet(world, ship);
  }
}

function fireBullet(world, ship) {
  const speed = 620;
  const bx = ship.x + Math.cos(ship.angle) * 18;
  const by = ship.y + Math.sin(ship.angle) * 18;
  const bvx = Math.cos(ship.angle) * speed + ship.vx * 0.5;
  const bvy = Math.sin(ship.angle) * speed + ship.vy * 0.5;

  world.bullets.push({
    x: bx,
    y: by,
    vx: bvx,
    vy: bvy,
    life: 0.9,
    damage: ship.bulletDamage,
    radius: 3
  });

  world.shotsFired++;
  triggerSound(world, 'shoot');
}

function updateBullets(world, dt) {
  for (let i = world.bullets.length - 1; i >= 0; i--) {
    const b = world.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    if (b.x < 0 || b.x > CONFIG.width || b.y < 0 || b.y > CONFIG.height || b.life <= 0) {
      world.bullets.splice(i, 1);
    }
  }

  for (let i = world.enemyBullets.length - 1; i >= 0; i--) {
    const b = world.enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    if (b.x < 0 || b.x > CONFIG.width || b.y < 0 || b.y > CONFIG.height || b.life <= 0) {
      world.enemyBullets.splice(i, 1);
    }
  }
}

// ROCKS
function spawnRock(world, size, x, y, customVx, customVy) {
  const radii = { 3: 46, 2: 28, 1: 16 };
  const hps = { 3: 3, 2: 2, 1: 1 };
  const scores = { 3: 50, 2: 100, 1: 200 };
  const speeds = { 3: 40, 2: 70, 1: 110 };

  const angle = world.rng.next() * Math.PI * 2;
  const speed = speeds[size] * (0.8 + world.rng.next() * 0.4);

  world.rocks.push({
    size,
    x,
    y,
    vx: customVx !== undefined ? customVx : Math.cos(angle) * speed,
    vy: customVy !== undefined ? customVy : Math.sin(angle) * speed,
    radius: radii[size],
    hp: hps[size],
    maxHp: hps[size],
    scoreValue: scores[size],
    rot: world.rng.next() * Math.PI * 2,
    rotSpeed: (world.rng.next() - 0.5) * 2
  });
}

function updateRocks(world, dt) {
  for (let i = 0; i < world.rocks.length; i++) {
    const r = world.rocks[i];
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    r.rot += r.rotSpeed * dt;

    if (r.x < -r.radius) r.x = CONFIG.width + r.radius;
    if (r.x > CONFIG.width + r.radius) r.x = -r.radius;
    if (r.y < -r.radius) r.y = CONFIG.height + r.radius;
    if (r.y > CONFIG.height + r.radius) r.y = -r.radius;
  }
}

function destroyRock(world, index) {
  const r = world.rocks[index];
  world.rocks.splice(index, 1);
  world.kills++;

  addScore(world, r.scoreValue, r.x, r.y);
  recordHit(world, true, r.x, r.y);
  triggerSound(world, r.size === 3 ? 'explosionLarge' : 'explosion');

  // Spawn explosion particles
  for (let p = 0; p < r.radius; p++) {
    const angle = world.rng.next() * Math.PI * 2;
    const spd = 20 + world.rng.next() * 80;
    spawnParticle(world, r.x, r.y, Math.cos(angle) * spd, Math.sin(angle) * spd, CONFIG.colors.rock, 0.6, r.size === 3 ? 3 : 2);
  }

  // Drop loot chance
  const roll = world.rng.next();
  if (roll < 0.45) spawnCore(world, r.x, r.y);
  else if (roll < 0.45 + 0.12) spawnPickup(world, 'repair', r.x, r.y);
  else if (roll < 0.57 + 0.06) spawnPickup(world, 'overcharge', r.x, r.y);
  else if (roll < 0.63 + 0.05) spawnPickup(world, 'shield', r.x, r.y);
  else if (roll < 0.68 + 0.05) spawnPickup(world, 'magnet', r.x, r.y);

  // Split into smaller rocks
  if (r.size > 1) {
    const nextSize = r.size - 1;
    const splitAngle = world.rng.next() * Math.PI;
    const spd = r.size === 3 ? 60 : 90;
    spawnRock(world, nextSize, r.x, r.y, Math.cos(splitAngle) * spd, Math.sin(splitAngle) * spd);
    spawnRock(world, nextSize, r.x, r.y, Math.cos(splitAngle + Math.PI) * spd, Math.sin(splitAngle + Math.PI) * spd);
  }
}

// DRONES & MINES
function spawnDrone(world, type, x, y) {
  const diffCfg = { Chill: 0.85, Standard: 1.0, Hard: 1.2 }[world.difficulty];
  const hpMul = { Chill: 1, Standard: 1, Hard: world.wave >= 4 ? 2 : 1 }[world.difficulty];

  const specs = {
    chaser: { radius: 14, hp: 2 * hpMul, score: 150, speed: 120 * diffCfg },
    shooter: { radius: 16, hp: 2 * hpMul, score: 250, speed: 80 * diffCfg, fireTimer: 2.2 },
    mine: { radius: 12, hp: 1, score: 100, speed: 30 * diffCfg }
  };

  const spec = specs[type];
  const sx = x !== undefined ? x : world.rng.next() * CONFIG.width;
  const sy = y !== undefined ? y : world.rng.next() * CONFIG.height;

  world.drones.push({
    type,
    x: sx,
    y: sy,
    vx: (world.rng.next() - 0.5) * 40,
    vy: (world.rng.next() - 0.5) * 40,
    radius: spec.radius,
    hp: spec.hp,
    maxHp: spec.hp,
    scoreValue: spec.score,
    speed: spec.speed,
    fireTimer: spec.fireTimer || 0
  });
}

function updateDrones(world, dt) {
  const ship = world.ship;

  for (let i = world.drones.length - 1; i >= 0; i--) {
    const d = world.drones[i];

    if (d.type === 'chaser') {
      // Steer toward ship, bounce off edges
      const angle = Math.atan2(ship.y - d.y, ship.x - d.x);
      d.vx += Math.cos(angle) * d.speed * 3 * dt;
      d.vy += Math.sin(angle) * d.speed * 3 * dt;
      const curSpd = Math.hypot(d.vx, d.vy);
      if (curSpd > d.speed) {
        d.vx = (d.vx / curSpd) * d.speed;
        d.vy = (d.vy / curSpd) * d.speed;
      }

      d.x += d.vx * dt;
      d.y += d.vy * dt;

      // Bounce off screen boundaries
      if (d.x < d.radius || d.x > CONFIG.width - d.radius) {
        d.vx *= -1;
        d.x = Math.max(d.radius, Math.min(CONFIG.width - d.radius, d.x));
      }
      if (d.y < d.radius || d.y > CONFIG.height - d.radius) {
        d.vy *= -1;
        d.y = Math.max(d.radius, Math.min(CONFIG.height - d.radius, d.y));
      }
    } else if (d.type === 'shooter') {
      // Keep 260 distance from ship
      const dist = Math.hypot(ship.x - d.x, ship.y - d.y);
      const angle = Math.atan2(ship.y - d.y, ship.x - d.x);

      let targetVx = 0;
      let targetVy = 0;
      if (dist < 220) {
        targetVx = -Math.cos(angle) * d.speed;
        targetVy = -Math.sin(angle) * d.speed;
      } else if (dist > 300) {
        targetVx = Math.cos(angle) * d.speed;
        targetVy = Math.sin(angle) * d.speed;
      }

      d.vx += (targetVx - d.vx) * 5 * dt;
      d.vy += (targetVy - d.vy) * 5 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;

      // Wrap edges
      if (d.x < 0) d.x = CONFIG.width;
      if (d.x > CONFIG.width) d.x = 0;
      if (d.y < 0) d.y = CONFIG.height;
      if (d.y > CONFIG.height) d.y = 0;

      // Fire enemy bolts
      d.fireTimer -= dt;
      if (d.fireTimer <= 0) {
        d.fireTimer = 2.2;
        const boltSpeed = 220;
        world.enemyBullets.push({
          x: d.x,
          y: d.y,
          vx: Math.cos(angle) * boltSpeed,
          vy: Math.sin(angle) * boltSpeed,
          radius: 4,
          damage: 10,
          life: 4.0
        });
        triggerSound(world, 'shootEnemy');
      }
    } else if (d.type === 'mine') {
      // Drift slowly, explode when ship within 70
      d.x += d.vx * dt;
      d.y += d.vy * dt;

      if (d.x < 0) d.x = CONFIG.width;
      if (d.x > CONFIG.width) d.x = 0;
      if (d.y < 0) d.y = CONFIG.height;
      if (d.y > CONFIG.height) d.y = 0;

      const dist = Math.hypot(ship.x - d.x, ship.y - d.y);
      if (dist < 70) {
        explodeMine(world, i);
        continue;
      }
    }

    if (d.hp <= 0) {
      destroyDrone(world, i);
    }
  }
}

function destroyDrone(world, index) {
  const d = world.drones[index];
  world.drones.splice(index, 1);
  world.kills++;

  addScore(world, d.scoreValue, d.x, d.y);
  recordHit(world, true, d.x, d.y);
  triggerSound(world, 'explosion');

  for (let p = 0; p < 12; p++) {
    const angle = world.rng.next() * Math.PI * 2;
    spawnParticle(world, d.x, d.y, Math.cos(angle) * 50, Math.sin(angle) * 50, CONFIG.colors.danger, 0.5, 2);
  }

  if (world.rng.next() < 0.6) spawnCore(world, d.x, d.y);
}

function explodeMine(world, index) {
  const m = world.drones[index];
  world.drones.splice(index, 1);
  triggerSound(world, 'explosionLarge');
  world.screenShake = 0.3;
  world.shakeDuration = 0.3;

  for (let p = 0; p < 24; p++) {
    const angle = world.rng.next() * Math.PI * 2;
    spawnParticle(world, m.x, m.y, Math.cos(angle) * 90, Math.sin(angle) * 90, CONFIG.colors.danger, 0.7, 3);
  }

  // Blast damages ship if in range
  const dist = Math.hypot(world.ship.x - m.x, world.ship.y - m.y);
  if (dist < 70 && world.ship.invulnerable <= 0) {
    damageShip(world, 20);
  }

  // Blast damages nearby rocks & drones
  for (let i = world.rocks.length - 1; i >= 0; i--) {
    if (Math.hypot(world.rocks[i].x - m.x, world.rocks[i].y - m.y) < 70 + world.rocks[i].radius) {
      destroyRock(world, i);
    }
  }
}

// BOSSES: SCRAP MAW (Wave 6) & DERELICT HULK (Wave 12)
function spawnBoss(world, type) {
  world.bossActive = true;
  if (type === 'maw') {
    world.bossName = 'SCRAP MAW';
    world.bossMaxHp = 24;
    world.bossHp = 24;
    world.boss = {
      type: 'maw',
      x: CONFIG.width / 2,
      y: 120,
      vx: 30,
      vy: 0,
      radius: 75,
      fireTimer: 3.0
    };
  } else if (type === 'hulk') {
    world.bossName = 'DERELICT HULK';
    world.bossMaxHp = 40;
    world.bossHp = 40;
    world.boss = {
      type: 'hulk',
      x: CONFIG.width / 2,
      y: 140,
      vx: 20,
      vy: 10,
      radius: 95,
      fireTimer1: 1.8,
      fireTimer2: 6.0
    };
  }
  pushEvent(world, 'EVENT_BOSS', { name: world.bossName });
  triggerSound(world, 'bossAlarm');
}

function updateBoss(world, dt) {
  if (!world.bossActive || !world.boss) return;
  const b = world.boss;
  const ship = world.ship;

  if (b.type === 'maw') {
    b.x += b.vx * dt;
    if (b.x < b.radius || b.x > CONFIG.width - b.radius) b.vx *= -1;

    b.fireTimer -= dt;
    if (b.fireTimer <= 0) {
      b.fireTimer = 3.0;
      // Fire 3-bolt spread
      const baseAngle = Math.atan2(ship.y - b.y, ship.x - b.x);
      for (let offset of [-0.3, 0, 0.3]) {
        const angle = baseAngle + offset;
        world.enemyBullets.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(angle) * 240,
          vy: Math.sin(angle) * 240,
          radius: 4,
          damage: 12,
          life: 4.0
        });
      }
      triggerSound(world, 'shootEnemy');
    }
  } else if (b.type === 'hulk') {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < b.radius || b.x > CONFIG.width - b.radius) b.vx *= -1;
    if (b.y < 80 || b.y > CONFIG.height / 2) b.vy *= -1;

    // Aimed bolts
    b.fireTimer1 -= dt;
    if (b.fireTimer1 <= 0) {
      b.fireTimer1 = 1.8;
      const angle = Math.atan2(ship.y - b.y, ship.x - b.x);
      world.enemyBullets.push({
        x: b.x,
        y: b.y,
        vx: Math.cos(angle) * 260,
        vy: Math.sin(angle) * 260,
        radius: 5,
        damage: 15,
        life: 4.0
      });
      triggerSound(world, 'shootEnemy');
    }

    // Radial burst
    b.fireTimer2 -= dt;
    if (b.fireTimer2 <= 0) {
      b.fireTimer2 = 6.0;
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        world.enemyBullets.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(angle) * 180,
          vy: Math.sin(angle) * 180,
          radius: 4,
          damage: 10,
          life: 4.0
        });
      }
      triggerSound(world, 'bossAlarm');
    }
  }

  if (world.bossHp <= 0) {
    destroyBoss(world);
  }
}

function destroyBoss(world) {
  const b = world.boss;
  world.bossActive = false;
  world.boss = null;
  world.kills++;
  addScore(world, b.type === 'maw' ? 1500 : 3000, CONFIG.width / 2, CONFIG.height / 2);
  triggerSound(world, 'explosionLarge');
  world.screenShake = 0.8;
  world.shakeDuration = 0.8;

  for (let p = 0; p < 50; p++) {
    const angle = world.rng.next() * Math.PI * 2;
    spawnParticle(world, b.x, b.y, Math.cos(angle) * 120, Math.sin(angle) * 120, CONFIG.colors.danger, 1.0, 4);
  }

  // Boss loot drops
  for (let i = 0; i < 5; i++) spawnCore(world, b.x + (world.rng.next() - 0.5) * 60, b.y + (world.rng.next() - 0.5) * 60);

  if (b.type === 'maw') {
    // Splits into 4 medium rocks
    for (let i = 0; i < 4; i++) {
      spawnRock(world, 2, b.x, b.y);
    }
  } else if (b.type === 'hulk') {
    // Splits into 4 medium rocks + 2 chasers
    for (let i = 0; i < 4; i++) spawnRock(world, 2, b.x, b.y);
    spawnDrone(world, 'chaser', b.x, b.y);
    spawnDrone(world, 'chaser', b.x, b.y);
  }
}

// CORES & PICKUPS
function spawnCore(world, x, y) {
  world.cores.push({
    x,
    y,
    vx: (world.rng.next() - 0.5) * 20,
    vy: (world.rng.next() - 0.5) * 20,
    radius: 10
  });
}

function spawnPickup(world, type, x, y) {
  world.pickups.push({
    type,
    x,
    y,
    vx: (world.rng.next() - 0.5) * 15,
    vy: (world.rng.next() - 0.5) * 15,
    radius: 12,
    life: 15.0
  });
}

function updateCoresAndPickups(world, dt) {
  const ship = world.ship;
  const magnetActive = ship.magnetTimer > 0;
  const tractorRange = (120 + ship.tractorBonus) * (magnetActive ? 2.5 : 1.0);

  // Cores
  for (let i = world.cores.length - 1; i >= 0; i--) {
    const c = world.cores[i];
    const dist = Math.hypot(ship.x - c.x, ship.y - c.y);

    if (dist < tractorRange) {
      const angle = Math.atan2(ship.y - c.y, ship.x - c.x);
      const pullSpeed = 350;
      c.vx += Math.cos(angle) * pullSpeed * 4 * dt;
      c.vy += Math.sin(angle) * pullSpeed * 4 * dt;
    }

    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vx *= 0.95;
    c.vy *= 0.95;

    if (dist < ship.radius + c.radius) {
      world.cores.splice(i, 1);
      world.coresCollected++;
      world.spendableCores++;
      addScore(world, 100, c.x, c.y);
      recordHit(world, true, c.x, c.y);
      triggerSound(world, 'pickup');
      pushEvent(world, 'EVENT_CORE', { total: world.coresCollected });

      if (world.coresCollected === 30) {
        addScore(world, 5000, ship.x, ship.y);
        pushEvent(world, 'EVENT_FULL_SALVAGE');
      }
    }
  }

  // Pickups
  for (let i = world.pickups.length - 1; i >= 0; i--) {
    const pk = world.pickups[i];
    pk.life -= dt;
    const dist = Math.hypot(ship.x - pk.x, ship.y - pk.y);

    if (dist < tractorRange) {
      const angle = Math.atan2(ship.y - pk.y, ship.x - pk.x);
      pk.vx += Math.cos(angle) * 280 * 4 * dt;
      pk.vy += Math.sin(angle) * 280 * 4 * dt;
    }

    pk.x += pk.vx * dt;
    pk.y += pk.vy * dt;
    pk.vx *= 0.95;
    pk.vy *= 0.95;

    if (pk.life <= 0) {
      world.pickups.splice(i, 1);
      continue;
    }

    if (dist < ship.radius + pk.radius) {
      world.pickups.splice(i, 1);
      triggerSound(world, 'pickup');

      if (pk.type === 'repair') {
        ship.hull = Math.min(ship.maxHull, ship.hull + 25);
        spawnPopup(world, 'REPAIR +25', ship.x, ship.y, CONFIG.colors.hull);
      } else if (pk.type === 'overcharge') {
        ship.overchargeTimer = 8.0;
        spawnPopup(world, 'OVERCHARGE 2X', ship.x, ship.y, CONFIG.colors.gold);
      } else if (pk.type === 'shield') {
        ship.shieldTimer = 10.0;
        spawnPopup(world, 'SHIELD ACTIVE', ship.x, ship.y, CONFIG.colors.core);
      } else if (pk.type === 'magnet') {
        ship.magnetTimer = 8.0;
        spawnPopup(world, 'TRACTOR BOOST', ship.x, ship.y, CONFIG.colors.coreGlow);
      }
    }
  }
}

// PARTICLES & POPUPS
function updateParticles(world, dt) {
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const pt = world.particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
    if (pt.life <= 0) {
      world.particles.splice(i, 1);
    }
  }
}

function updatePopups(world, dt) {
  for (let i = world.popups.length - 1; i >= 0; i--) {
    const pp = world.popups[i];
    pp.y += pp.vy * dt;
    pp.life -= dt;
    if (pp.life <= 0) {
      world.popups.splice(i, 1);
    }
  }
}

// COLLISIONS
function checkCollisions(world) {
  const ship = world.ship;

  // Bullets vs Rocks
  for (let bi = world.bullets.length - 1; bi >= 0; bi--) {
    const b = world.bullets[bi];
    let bulletRemoved = false;

    for (let ri = world.rocks.length - 1; ri >= 0; ri--) {
      const r = world.rocks[ri];
      if (Math.hypot(b.x - r.x, b.y - r.y) < b.radius + r.radius) {
        bulletRemoved = true;
        r.hp -= b.damage;
        world.bullets.splice(bi, 1);
        if (r.hp <= 0) {
          destroyRock(world, ri);
        }
        break;
      }
    }

    if (bulletRemoved) continue;

    // Bullets vs Drones
    for (let di = world.drones.length - 1; di >= 0; di--) {
      const d = world.drones[di];
      if (Math.hypot(b.x - d.x, b.y - d.y) < b.radius + d.radius) {
        bulletRemoved = true;
        d.hp -= b.damage;
        world.bullets.splice(bi, 1);
        if (d.hp <= 0) {
          destroyDrone(world, di);
        }
        break;
      }
    }

    if (bulletRemoved) continue;

    // Bullets vs Boss
    if (world.bossActive && world.boss) {
      const bo = world.boss;
      if (Math.hypot(b.x - bo.x, b.y - bo.y) < b.radius + bo.radius) {
        world.bossHp -= b.damage;
        world.bullets.splice(bi, 1);
        recordHit(world, false);
      }
    }
  }

  // Enemy Bullets vs Ship
  for (let i = world.enemyBullets.length - 1; i >= 0; i--) {
    const eb = world.enemyBullets[i];
    if (Math.hypot(ship.x - eb.x, ship.y - eb.y) < ship.radius + eb.radius) {
      world.enemyBullets.splice(i, 1);
      damageShip(world, eb.damage);
    }
  }

  // Ship vs Rocks
  for (let i = world.rocks.length - 1; i >= 0; i--) {
    const r = world.rocks[i];
    if (Math.hypot(ship.x - r.x, ship.y - r.y) < ship.radius + r.radius) {
      damageShip(world, 15);
      destroyRock(world, i);
    }
  }

  // Ship vs Drones
  for (let i = world.drones.length - 1; i >= 0; i--) {
    const d = world.drones[i];
    if (Math.hypot(ship.x - d.x, ship.y - d.y) < ship.radius + d.radius) {
      damageShip(world, 20);
      destroyDrone(world, i);
    }
  }

  // Ship vs Boss: ramming the boss hurts, and the ship is pushed out
  if (world.bossActive && world.boss) {
    const bo = world.boss;
    const dx = ship.x - bo.x;
    const dy = ship.y - bo.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < ship.radius + bo.radius) {
      damageShip(world, 25);
      ship.x = bo.x + (dx / dist) * (bo.radius + ship.radius + 2);
      ship.y = bo.y + (dy / dist) * (bo.radius + ship.radius + 2);
    }
  }
}

function damageShip(world, amount) {
  const ship = world.ship;
  if (ship.invulnerable > 0 || ship.dashTimer > 0) return;

  if (ship.shieldTimer > 0) {
    ship.shieldTimer = 0; // Shield absorbs hit
    ship.invulnerable = 1.0;
    triggerSound(world, 'shieldBreak');
    spawnPopup(world, 'SHIELD BREAK', ship.x, ship.y, CONFIG.colors.core);
    return;
  }

  ship.hull -= amount;
  ship.invulnerable = 1.5;
  world.combo = 1;
  world.screenShake = 0.4;
  world.shakeDuration = 0.4;
  triggerSound(world, 'hurt');
  pushEvent(world, 'EVENT_HIT');

  if (ship.hull <= 0) {
    ship.hull = 0;
    world.state = 'over';
    pushEvent(world, 'EVENT_OVER');
    triggerSound(world, 'gameOver');
  }
}
