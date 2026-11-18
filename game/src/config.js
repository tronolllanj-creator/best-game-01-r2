export const CONFIG = {
  // Logical field dimensions
  fieldWidth: 1280,
  fieldHeight: 720,
  width: 1280,
  height: 720,

  // Palette hexes (shared exact reference with render.js)
  colors: {
    backdrop: '#070b16',
    sky: '#0b1226',
    nebula1: '#1b2a52',
    nebula2: '#3d2a5e',
    ship: '#f2a541',
    shipDark: '#b97a1e',
    core: '#37c8d9',
    coreGlow: '#9be8f2',
    rock: '#8fa3b0',
    rockDark: '#5d6f7d',
    rust: '#b0724f',
    danger: '#e05a4e',
    gold: '#f0c040',
    text: '#e8e4d8',
    muted: '#8fa3b0',
    panel: '#121a2e',
    hull: '#59d867',
    hullLow: '#e05a4e'
  },

  // Ship tuning
  ship: {
    accel: 620,
    maxSpeed: 340,
    drag: 0.92,
    fireGap: 0.15,
    bulletSpeed: 620,
    bulletLife: 0.9,
    bulletDamage: 1,
    dashSpeed: 720,
    dashDuration: 0.16,
    dashCooldown: 2.2,
    maxHull: 100,
    invulnerableTime: 1.5,
    radius: 14
  },

  // Difficulty profiles
  difficulties: {
    chill: {
      id: 'chill',
      name: 'Chill',
      hull: 150,
      enemySpeedMult: 0.85,
      enemyHpBonus: 0
    },
    standard: {
      id: 'standard',
      name: 'Standard',
      hull: 100,
      enemySpeedMult: 1.0,
      enemyHpBonus: 0
    },
    hard: {
      id: 'hard',
      name: 'Hard',
      hull: 75,
      enemySpeedMult: 1.2,
      enemyHpBonus: 1
    }
  },

  // Rocks configuration
  rocks: {
    large: { radius: 46, hp: 3, score: 50, speed: 40 },
    medium: { radius: 28, hp: 2, score: 100, speed: 70 },
    small: { radius: 16, hp: 1, score: 200, speed: 110 },
    dropChances: {
      core: 0.45,
      repair: 0.12,
      overcharge: 0.06,
      shield: 0.05,
      magnet: 0.05
    }
  },

  // Enemies configuration
  enemies: {
    chaser: {
      radius: 14,
      hp: 2,
      score: 150,
      speed: 120
    },
    shooter: {
      radius: 16,
      hp: 2,
      score: 250,
      speed: 90,
      preferredDist: 260,
      fireInterval: 2.2,
      bulletSpeed: 220,
      bulletDamage: 10
    },
    mine: {
      radius: 12,
      hp: 1,
      score: 100,
      speed: 40,
      triggerDist: 70,
      blastRadius: 70,
      blastDamage: 20
    }
  },

  // Bosses configuration
  bosses: {
    scrapMaw: {
      radius: 75,
      hp: 24,
      speed: 26,
      score: 1500,
      fireInterval: 3.0
    },
    derelictHulk: {
      radius: 95,
      hp: 40,
      speed: 18,
      score: 3000,
      aimedFireInterval: 1.8,
      radialBurstInterval: 6.0
    }
  },

  // Cores & Full Salvage goal
  cores: {
    radius: 10,
    scoreValue: 100,
    targetCount: 30,
    fullSalvageBonus: 5000
  },

  // Combo settings
  combo: {
    window: 2.5,
    maxMultiplier: 10
  },

  // Pickups durations and effects
  pickups: {
    repair: { heal: 25 },
    overcharge: { duration: 8.0 },
    shield: { duration: 10.0 },
    magnet: { duration: 8.0, baseRadius: 90 }
  },

  // Shop items costs and limits
  shop: {
    items: [
      { id: 'hull', name: 'Hull Plating', cost: 3, maxLevel: 10, effect: '+25 max hull' },
      { id: 'loader', name: 'Rapid Loader', cost: 4, maxLevel: 5, effect: 'fire gap -0.02s (min 0.07s)' },
      { id: 'bolts', name: 'Heavy Bolts', cost: 5, maxLevel: 5, effect: '+1 bolt damage' },
      { id: 'dash', name: 'Dash Capacitor', cost: 3, maxLevel: 4, effect: 'dash cooldown -0.3s (min 1.0s)' },
      { id: 'magnet', name: 'Tractor Magnet', cost: 4, maxLevel: 5, effect: '+40 pickup radius' }
    ]
  },

  // Waves configuration
  totalWaves: 12,
  waveClearBonusMultiplier: 500,
  victoryBonus: 2000,
  hullScoreMultiplier: 10
};
