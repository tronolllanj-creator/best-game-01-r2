export function autopilotInput(world, strength) {
  let target = null;
  if (world.bossActive && world.boss) {
    target = world.boss;
  } else {
    let bestDist = Infinity;
    const candidates = [...world.rocks, ...world.drones];
    for (const c of candidates) {
      const dx = c.x - world.ship.x;
      const dy = c.y - world.ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        target = c;
      }
    }
  }

  if (!target) {
    return { x: 0, y: 0, fire: false, dash: false };
  }

  const dx = target.x - world.ship.x;
  const dy = target.y - world.ship.y;
  const dist = Math.hypot(dx, dy);

  let nx = 0;
  let ny = 0;
  if (dist > 0.001) {
    nx = (dx / dist) * strength;
    ny = (dy / dist) * strength;
  }

  const fire = true;
  const dash = dist < 120 && strength > 0.8 && world.ship.dashCooldown <= 0;

  return { x: nx, y: ny, fire, dash };
}

export function stageShot(world, shot, rng) {
  if (shot === 'start') {
    world.state = 'title';
    world.time = 0;
  } else if (shot === 'play') {
    world.state = 'play';
    world.time = 5;
    world.ship.x = 640;
    world.ship.y = 360;
    if (!world.rocks) world.rocks = [];
    let hasLarge = world.rocks.some(r => r.radius > 40);
    if (!hasLarge) {
      world.rocks.push({
        x: rng.next() * 1280,
        y: rng.next() * 720,
        vx: (rng.next() - 0.5) * 50,
        vy: (rng.next() - 0.5) * 50,
        radius: 60,
        hp: 3,
        maxHp: 3,
        type: 'large',
        rot: rng.next() * Math.PI * 2,
        vrot: (rng.next() - 0.5) * 2
      });
    }
  } else if (shot === 'boss') {
    world.wave = 12;
    world.state = 'play';
    world.time = 2;
    world.ship.x = 640;
    world.ship.y = 550;
    world.bossActive = true;
    world.bossName = 'DERELICT HULK';
    world.bossMaxHp = 40;
    world.bossHp = 40;
    world.boss = {
      type: 'hulk',
      x: 640,
      y: 220,
      vx: 10,
      vy: 5,
      radius: 95,
      hp: 40,
      maxHp: 40,
      score: 3000,
      shootTimer: 0,
      burstTimer: 0,
      rot: 0,
      ang: 0
    };
    world.rocks = [];
    world.drones = [];
  } else if (shot === 'end') {
    world.state = 'over';
    world.time = 12;
    world.score = 18400;
    world.stats = {
      wave: 8,
      cores: 22,
      kills: 48,
      accuracy: 0.68,
      score: 18400
    };
  }
}
