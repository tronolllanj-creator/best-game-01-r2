const P = {
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
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let vw = 1280;
  let vh = 720;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const sw = ww / vw;
    const sh = wh / vh;
    scale = sw < sh ? sw : sh;
    canvas.width = Math.floor(vw * scale);
    canvas.height = Math.floor(vh * scale);
    offsetX = Math.floor((ww - canvas.width) / 2);
    offsetY = Math.floor((wh - canvas.height) / 2);
    canvas.style.position = 'absolute';
    canvas.style.left = offsetX + 'px';
    canvas.style.top = offsetY + 'px';
  }

  window.addEventListener('resize', resize);
  resize();

  function view(state) {
    let camX = vw / 2;
    let camY = vh / 2;
    if (state.ship) {
      camX = state.ship.x;
      camY = state.ship.y;
    }
    const shake = state.shake || 0;
    if (shake > 0) {
      camX += (Math.sin(state.time * 50) * shake);
      camY += (Math.cos(state.time * 40) * shake);
    }
    return {
      scale,
      x: vw / 2 - camX,
      y: vh / 2 - camY
    };
  }

  function draw(state) {
    ctx.fillStyle = P.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const v = view(state);
    ctx.scale(v.scale, v.scale);
    ctx.translate(v.x, v.y);

    drawStarfield(state);
    drawNebulae(state);
    drawParticles(state, 'trail');
    drawParticles(state, 'back');
    drawCores(state);
    drawPickups(state);
    drawRocks(state);
    drawDrones(state);
    drawMines(state);
    drawBoss(state);
    drawShip(state);
    drawBullets(state);
    drawParticles(state, 'front');

    ctx.restore();

    drawHUD(state);
    drawScreens(state);
  }

  function drawStarfield(state) {
    const camX = state.ship ? state.ship.x : vw / 2;
    const camY = state.ship ? state.ship.y : vh / 2;

    for (let layer = 1; layer <= 3; layer++) {
      const factor = layer * 0.25;
      const size = layer * 1.2;
      ctx.fillStyle = layer === 3 ? P.coreGlow : (layer === 2 ? P.muted : P.rockDark);
      
      const startX = Math.floor((camX * factor - vw) / vw) * vw;
      const endX = startX + vw * 3;
      const startY = Math.floor((camY * factor - vh) / vh) * vh;
      const endY = startY + vh * 3;

      for (let x = startX; x < endX; x += 120) {
        for (let y = startY; y < endY; y += 120) {
          const px = (x + (layer * 47)) % (vw * 3) - vw;
          const py = (y + (layer * 89)) % (vh * 3) - vh;
          const rx = px - camX * factor;
          const ry = py - camY * factor;
          ctx.fillRect(camX + rx, camY + ry, size, size);
        }
      }
    }
  }

  function drawNebulae(state) {
    const camX = state.ship ? state.ship.x : vw / 2;
    const camY = state.ship ? state.ship.y : vh / 2;

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = P.nebula1;
    ctx.beginPath();
    ctx.arc(camX - 200, camY - 100, 400, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = P.nebula2;
    ctx.beginPath();
    ctx.arc(camX + 300, camY + 200, 500, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles(state, layer) {
    for (let i = 0; i < state.particles.length; i++) {
      const p = state.particles[i];
      if (p.layer !== layer) continue;
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color || P.gold;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  function drawCores(state) {
    for (let i = 0; i < state.cores.length; i++) {
      const c = state.cores[i];
      ctx.save();
      ctx.translate(c.x, c.y);
      const pulse = 1 + Math.sin(state.time * 8 + c.seed) * 0.2;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = P.coreGlow;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = P.core;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPickups(state) {
    for (let i = 0; i < state.pickups.length; i++) {
      const pk = state.pickups[i];
      ctx.save();
      ctx.translate(pk.x, pk.y);
      ctx.fillStyle = pk.type === 'repair' ? P.hull : (pk.type === 'shield' ? P.core : (pk.type === 'magnet' ? P.gold : P.danger));
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = P.backdrop;
      ctx.fillRect(-6, -2, 12, 4);
      if (pk.type !== 'overcharge') {
        ctx.fillRect(-2, -6, 4, 12);
      }
      ctx.restore();
    }
  }

  function drawRocks(state) {
    for (let i = 0; i < state.rocks.length; i++) {
      const r = state.rocks[i];
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.fillStyle = P.rockDark;
      ctx.beginPath();
      const pts = r.pts || 6;
      for (let j = 0; j < pts; j++) {
        const ang = (j / pts) * Math.PI * 2;
        const rad = r.radius * (0.8 + ((j % 2) * 0.3));
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = P.rust;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDrones(state) {
    for (let i = 0; i < state.drones.length; i++) {
      const d = state.drones[i];
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.ang);
      ctx.fillStyle = P.danger;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, -10);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = P.gold;
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    }
  }

  function drawMines(state) {
    for (let i = 0; i < state.mines.length; i++) {
      const m = state.mines[i];
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(state.time * 2);
      ctx.fillStyle = P.rust;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = P.danger;
      ctx.lineWidth = 2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
        ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawBoss(state) {
    const b = state.boss;
    if (!b) return;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.ang || 0);
    ctx.fillStyle = P.rockDark;
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.danger;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = P.rust;
    ctx.fillRect(-15, -15, 30, 30);
    ctx.fillStyle = P.core;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawShip(state) {
    const s = state.ship;
    if (!s) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.ang + (s.vx * 0.0005));

    if (s.invulnerable > 0 && Math.floor(state.time * 20) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = P.shipDark;
    ctx.beginPath();
    ctx.moveTo(-16, -12);
    ctx.lineTo(18, 0);
    ctx.lineTo(-16, 12);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.ship;
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(14, 0);
    ctx.lineTo(-10, 16);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.core;
    ctx.fillRect(-4, -4, 8, 8);

    if (s.shield > 0) {
      ctx.strokeStyle = P.coreGlow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawBullets(state) {
    for (let i = 0; i < state.bullets.length; i++) {
      const b = state.bullets[i];
      ctx.save();
      ctx.fillStyle = b.enemy ? P.danger : P.gold;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.enemy ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawHUD(state) {
    if (state.screen !== 'play' && state.screen !== 'paused') return;

    ctx.save();
    ctx.fillStyle = P.text;
    ctx.font = '16px monospace';

    ctx.fillText(`SCORE: ${state.score}`, 20, 30);
    ctx.fillText(`BEST: ${state.best}`, 20, 55);

    const waveText = state.boss ? `BOSS WAVE ${state.wave}` : `WAVE ${state.wave}/12`;
    ctx.textAlign = 'center';
    ctx.fillText(waveText, vw / 2, 30);
    ctx.fillText(`CORES: ${state.coresCollected}/30 | CREDITS: ${state.spendable}`, vw / 2, 55);

    ctx.textAlign = 'right';
    ctx.fillText(`HULL: ${Math.max(0, Math.ceil(state.ship ? state.ship.hull : 0))}`, vw - 20, 30);

    const barW = 150;
    const maxHull = state.ship ? state.ship.maxHull : 100;
    const curHull = state.ship ? state.ship.hull : 0;
    const hullFrac = Math.max(0, Math.min(1, curHull / maxHull));
    ctx.fillStyle = P.panel;
    ctx.fillRect(vw - 20 - barW, 40, barW, 14);
    ctx.fillStyle = hullFrac < 0.3 ? P.hullLow : P.hull;
    ctx.fillRect(vw - 20 - barW, 40, barW * hullFrac, 14);

    ctx.textAlign = 'left';
    ctx.fillStyle = state.ship && state.ship.dashCooldown <= 0 ? P.core : P.muted;
    ctx.fillText('DASH [SPC]', vw - 220, 75);

    if (state.ship && state.ship.shield > 0) {
      ctx.fillStyle = P.coreGlow;
      ctx.fillText('SHIELD', vw - 300, 75);
    }

    if (state.combo > 1) {
      ctx.textAlign = 'center';
      ctx.fillStyle = P.gold;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`COMBO x${state.combo}`, vw / 2, 90);
    }

    if (state.boss) {
      const bBarW = 400;
      const bFrac = Math.max(0, state.boss.hp / state.boss.maxHp);
      ctx.fillStyle = P.panel;
      ctx.fillRect(vw / 2 - bBarW / 2, 100, bBarW, 16);
      ctx.fillStyle = P.danger;
      ctx.fillRect(vw / 2 - bBarW / 2, 100, bBarW * bFrac, 16);
      ctx.textAlign = 'center';
      ctx.fillStyle = P.text;
      ctx.font = '12px monospace';
      ctx.fillText(state.bossName || 'BOSS', vw / 2, 113);
    }

    if (state.bannerTimer > 0 && state.bannerText) {
      ctx.textAlign = 'center';
      ctx.fillStyle = P.gold;
      ctx.font = 'bold 32px monospace';
      ctx.fillText(state.bannerText, vw / 2, vh / 2 - 100);
    }

    ctx.restore();
  }

  function drawScreens(state) {
    if (state.screen === 'play') return;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 11, 22, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = P.text;

    if (state.screen === 'title') {
      ctx.font = 'bold 48px monospace';
      ctx.fillStyle = P.ship;
      ctx.fillText('NOVA SALVAGE: DEEP BELT', vw / 2, vh / 2 - 120);

      ctx.font = '18px monospace';
      ctx.fillStyle = P.text;
      ctx.fillText('Collect 30 Cores. Upgrade your Rig. Clear 12 Waves.', vw / 2, vh / 2 - 60);

      ctx.fillStyle = P.gold;
      ctx.fillText(`Select Difficulty: [1] Chill  [2] Standard  [3] Hard`, vw / 2, vh / 2 + 10);
      ctx.fillText(`Current: ${state.difficulty.toUpperCase()}`, vw / 2, vh / 2 + 50);

      ctx.fillStyle = P.core;
      ctx.fillText('Press [ENTER] or Click to Launch', vw / 2, vh / 2 + 120);
    } else if (state.screen === 'shop') {
      ctx.font = 'bold 36px monospace';
      ctx.fillStyle = P.gold;
      ctx.fillText('SALVAGE DEPOT (SHOP)', vw / 2, vh / 2 - 200);

      ctx.font = '18px monospace';
      ctx.fillStyle = P.text;
      ctx.fillText(`Available Cores / Credits: ${state.spendable}`, vw / 2, vh / 2 - 150);

      const items = state.upgrades.getItems();
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const y = vh / 2 - 90 + (i * 45);
        ctx.fillStyle = P.panel;
        ctx.fillRect(vw / 2 - 300, y - 22, 600, 36);
        ctx.fillStyle = P.text;
        ctx.textAlign = 'left';
        ctx.fillText(`[${i + 1}] ${it.name}: ${it.desc}`, vw / 2 - 280, y);
        ctx.textAlign = 'right';
        ctx.fillStyle = P.core;
        ctx.fillText(`Cost: ${it.cost}`, vw / 2 + 280, y);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = P.gold;
      ctx.fillText('Press [1-5] to Buy Upgrade | Press [ENTER] to Continue Next Wave', vw / 2, vh / 2 + 160);
    } else if (state.screen === 'paused') {
      ctx.font = 'bold 40px monospace';
      ctx.fillStyle = P.text;
      ctx.fillText('PAUSED', vw / 2, vh / 2 - 40);
      ctx.font = '18px monospace';
      ctx.fillStyle = P.muted;
      ctx.fillText('Press [P] or [ESC] to Resume', vw / 2, vh / 2 + 20);
    } else if (state.screen === 'over') {
      ctx.font = 'bold 40px monospace';
      ctx.fillStyle = P.danger;
      ctx.fillText('HULL BREACH - GAME OVER', vw / 2, vh / 2 - 120);

      ctx.font = '18px monospace';
      ctx.fillStyle = P.text;
      ctx.fillText(`Final Score: ${state.score} (Best: ${state.best})`, vw / 2, vh / 2 - 60);
      ctx.fillText(`Wave Reached: ${state.wave} | Cores: ${state.coresCollected}/30`, vw / 2, vh / 2 - 20);
      ctx.fillText(`Enemies Destroyed: ${state.stats.kills} | Accuracy: ${state.stats.accuracy}%`, vw / 2, vh / 2 + 20);

      ctx.fillStyle = P.gold;
      ctx.fillText('Press [R] or [ENTER] to Restart', vw / 2, vh / 2 + 90);
    } else if (state.screen === 'win') {
      ctx.font = 'bold 40px monospace';
      ctx.fillStyle = P.hull;
      ctx.fillText('FULL SALVAGE - DEEP BELT CLEARED!', vw / 2, vh / 2 - 140);

      ctx.font = '18px monospace';
      ctx.fillStyle = P.text;
      ctx.fillText(`Final Score: ${state.score} (Best: ${state.best})`, vw / 2, vh / 2 - 80);
      ctx.fillText(`Cores Collected: ${state.coresCollected}/30${state.coresCollected >= 30 ? ' (+5000 Bonus)' : ''}`, vw / 2, vh / 2 - 40);
      ctx.fillText(`Hull Bonus: +${Math.ceil(state.ship ? state.ship.hull : 0) * 10}`, vw / 2, vh / 2);
      ctx.fillText(`Accuracy: ${state.stats.accuracy}%`, vw / 2, vh / 2 + 40);

      ctx.fillStyle = P.gold;
      ctx.fillText('Press [R] or [ENTER] to Play Again', vw / 2, vh / 2 + 110);
    }

    ctx.restore();
  }

  return {
    draw,
    view
  };
}
