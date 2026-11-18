export const SHOP_ITEMS = [
  { id: 1, name: 'Hull Plating', cost: 3, desc: '+25 max hull' },
  { id: 2, name: 'Rapid Loader', cost: 4, desc: 'fire gap -0.02s' },
  { id: 3, name: 'Heavy Bolts', cost: 5, desc: '+1 bolt damage' },
  { id: 4, name: 'Dash Capacitor', cost: 3, desc: 'dash cooldown -0.3s' },
  { id: 5, name: 'Tractor Magnet', cost: 4, desc: '+40 radius' }
];

const MAX_LEVELS = {
  1: 10,
  2: 4,
  3: 10,
  4: 4,
  5: 10
};

export function createUpgrades() {
  return {
    levels: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    maxHull: 100,
    bulletDamage: 1,
    fireGap: 0.16,
    dashCooldownMax: 2.2,
    tractorBonus: 0
  };
}

export function canBuy(world, upgrades, id) {
  const max = MAX_LEVELS[id] || 10;
  const currentLevel = upgrades.levels[id] || 0;
  if (currentLevel >= max) return false;

  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item) return false;

  return world.spendableCores >= item.cost;
}

export function buy(world, upgrades, id) {
  if (!canBuy(world, upgrades, id)) return false;

  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item) return false;

  world.spendableCores -= item.cost;
  upgrades.levels[id] = (upgrades.levels[id] || 0) + 1;

  if (id === 1) {
    upgrades.maxHull += 25;
    if (world.ship) {
      world.ship.maxHull = upgrades.maxHull;
      world.ship.hull = Math.min(world.ship.maxHull, world.ship.hull + 25);
    }
  } else if (id === 2) {
    upgrades.fireGap = Math.max(0.07, upgrades.fireGap - 0.02);
    if (world.ship) {
      world.ship.fireGap = upgrades.fireGap;
    }
  } else if (id === 3) {
    upgrades.bulletDamage += 1;
    if (world.ship) {
      world.ship.bulletDamage = upgrades.bulletDamage;
    }
  } else if (id === 4) {
    upgrades.dashCooldownMax = Math.max(1.0, upgrades.dashCooldownMax - 0.3);
    if (world.ship) {
      world.ship.dashCooldownMax = upgrades.dashCooldownMax;
    }
  } else if (id === 5) {
    upgrades.tractorBonus += 40;
    if (world.ship) {
      world.ship.tractorBonus = upgrades.tractorBonus;
    }
  }

  return true;
}

export function getItems() {
  return SHOP_ITEMS;
}

export function describe(upgrades, id) {
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item) return '';
  const lvl = upgrades.levels[id] || 0;
  const max = MAX_LEVELS[id] || 10;
  return `${item.desc} (Lvl ${lvl}/${max})`;
}
