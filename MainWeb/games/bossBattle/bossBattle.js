const canvas = document.getElementById('bossCanvas');
const ctx = canvas.getContext('2d');

let width = 1000;
let height = 600;
let lastTime = 0;
let gameActive = false;
let gameOver = false;
let win = false;
let mousePos = { x: width / 2, y: height / 2 };
let shootPressed = false;
let canShoot = true;
let reloadTimer = 0;
let bullets = [];
let enemyBullets = [];
let particles = [];
let powerups = [];
let gunSprite = new Image();
let gunLoaded = false;

gunSprite.src = '../../../Assets/imgs/gun.png';
gunSprite.onload = () => { gunLoaded = true; };

const player = {
  x: width / 2,
  y: height - 120,
  radius: 24,
  speed: 320,
  health: 5,
  shield: 0,
  rapid: 0,
  dash: 0,
  dashCooldown: 0
};

const boss = {
  x: width / 2,
  y: 140,
  width: 170,
  height: 130,
  health: 500,
  maxHealth: 500,
  phase: 1,
  patternTimer: 0,
  patternDelay: 1.4,
  moveDirection: 1,
  attackIndex: 0,
  invulnerable: 0
};

const state = {
  message: 'Use A/D or arrow keys to move in any direction. Aim with mouse. Left click to shoot.',
  messageTimer: 0,
  lastPowerup: 0
};

const keys = { left: false, right: false, up: false, down: false };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function rectCircleColliding(cx, cy, r, rx, ry, rw, rh) {
  const dx = Math.abs(cx - (rx + rw / 2));
  const dy = Math.abs(cy - (ry + rh / 2));
  if (dx > rw / 2 + r || dy > rh / 2 + r) return false;
  if (dx <= rw / 2 || dy <= rh / 2) return true;
  const cornerDistSq = (dx - rw / 2) ** 2 + (dy - rh / 2) ** 2;
  return cornerDistSq <= r * r;
}

function circleDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function spawnParticle(x, y, color, size, speed, life) {
  particles.push({ x, y, vx: randomRange(-1, 1) * speed, vy: randomRange(-1, 1) * speed, color, size, life });
}

function setMessage(text, duration = 2400) {
  state.message = text;
  state.messageTimer = duration;
}

function resetFight() {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  player.x = width / 2;
  player.y = height - 120;
  player.health = 5;
  player.shield = 0;
  player.rapid = 0;
  player.dash = 0;
  player.dashCooldown = 0;
  boss.x = width / 2;
  boss.y = 140;
  boss.health = boss.maxHealth;
  boss.phase = 1;
  boss.patternTimer = 0;
  boss.patternDelay = 1.4;
  boss.moveDirection = 1;
  boss.attackIndex = 0;
  boss.invulnerable = 0;
  bullets = [];
  enemyBullets = [];
  particles = [];
  powerups = [];
  shootPressed = false;
  canShoot = true;
  reloadTimer = 0;
  state.lastPowerup = 0;
  state.message = 'Boss battle active!';
}

function resizeCanvas() {
  const container = document.getElementById('gameScreen');
  const rect = container.getBoundingClientRect();
  width = Math.max(680, Math.min(1100, rect.width - 20));
  height = Math.max(520, Math.min(680, rect.height - 20));
  canvas.width = width;
  canvas.height = height;
}

function fireBullet() {
  if (!canShoot || !gameActive) return;
  const dx = mousePos.x - player.x;
  const dy = mousePos.y - player.y;
  const distance = Math.max(0.1, Math.hypot(dx, dy));
  bullets.push({
    x: player.x + Math.cos(Math.atan2(dy, dx)) * 30,
    y: player.y + Math.sin(Math.atan2(dy, dx)) * 30,
    vx: (dx / distance) * 820,
    vy: (dy / distance) * 820,
    radius: 8,
    color: '#fffb7d'
  });
  canShoot = false;
  reloadTimer = player.rapid ? 130 : 240;
  setMessage('Bang! Keep the pressure on.', 1400);
}

function spawnPowerup(type) {
  const px = randomRange(120, width - 120);
  const py = randomRange(220, height - 160);
  powerups.push({ x: px, y: py, type, radius: 18, life: 12000 });
}

function bossAttack(delta) {
  boss.patternTimer -= delta;
  if (boss.patternTimer > 0) return;
  boss.attackIndex = (boss.attackIndex + 1) % 4;
  boss.patternTimer = boss.patternDelay;

  const angleToPlayer = Math.atan2(player.y - boss.y, player.x - boss.x);
  boss.patternDelay = Math.max(0.55, 1.3 - boss.phase * 0.16) + Math.random() * 0.2;

  if (boss.attackIndex === 0) {
    const count = 9 + boss.phase * 2;
    const spread = 1.8;
    for (let i = 0; i < count; i += 1) {
      const angle = angleToPlayer - spread / 2 + (spread / (count - 1)) * i + randomRange(-0.08, 0.08);
      enemyBullets.push({ x: boss.x, y: boss.y + 42, vx: Math.cos(angle) * (380 + boss.phase * 20), vy: Math.sin(angle) * (380 + boss.phase * 20), radius: 12, color: '#f97316' });
    }
    setMessage('Boss spray! Dodge the orange fan.', 2000);
  } else if (boss.attackIndex === 1) {
    const count = 6 + Math.floor(boss.phase / 2);
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * 0.17;
      const angle = angleToPlayer + offset;
      enemyBullets.push({ x: boss.x, y: boss.y + 42, vx: Math.cos(angle) * (500 + boss.phase * 25), vy: Math.sin(angle) * (500 + boss.phase * 25), radius: 10, color: '#facc15' });
    }
    setMessage('Shotgun volley! Stay sharp.', 2000);
  } else if (boss.attackIndex === 2) {
    for (let i = 0; i < 20; i += 1) {
      const angle = ((Math.PI * 2) * i) / 20 + randomRange(-0.05, 0.05);
      enemyBullets.push({ x: boss.x, y: boss.y + 42, vx: Math.cos(angle) * (300 + boss.phase * 15), vy: Math.sin(angle) * (300 + boss.phase * 15), radius: 11, color: '#ec4899' });
    }
    setMessage('Radial burst! Find the gaps.', 2000);
  } else {
    const count = 4 + boss.phase;
    for (let i = 0; i < count; i += 1) {
      const targetX = player.x + randomRange(-110, 110);
      const targetY = player.y + randomRange(-70, 70);
      const angle = Math.atan2(targetY - boss.y, targetX - boss.x);
      enemyBullets.push({ x: boss.x, y: boss.y + 42, vx: Math.cos(angle) * (540 + boss.phase * 20), vy: Math.sin(angle) * (540 + boss.phase * 20), radius: 10, color: '#38bdf8' });
    }
    setMessage('Precision missiles locked on.', 2000);
  }
}

function updateGame(delta) {
  const moveSpeed = player.speed * (player.dash > 0 ? 3.2 : 1);
  if (keys.left) player.x -= moveSpeed * delta;
  if (keys.right) player.x += moveSpeed * delta;
  if (keys.up) player.y -= moveSpeed * delta;
  if (keys.down) player.y += moveSpeed * delta;
  player.x = clamp(player.x, player.radius + 24, width - player.radius - 24);
  player.y = clamp(player.y, player.radius + 24, height - player.radius - 24);

  if (player.dash > 0) player.dash -= delta;
  if (player.dashCooldown > 0) player.dashCooldown -= delta;

  if (!canShoot) {
    reloadTimer -= delta * 1000;
    if (reloadTimer <= 0) {
      canShoot = true;
      reloadTimer = 0;
    }
  }

  if (shootPressed && canShoot) {
    fireBullet();
  }

  bullets = bullets.filter((bullet) => {
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    if (bullet.x < -40 || bullet.x > width + 40 || bullet.y < -40 || bullet.y > height + 40) return false;
    if (rectCircleColliding(bullet.x, bullet.y, bullet.radius, boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height)) {
      if (boss.invulnerable <= 0) {
        boss.health -= 6 + (player.rapid ? 2 : 0);
        boss.invulnerable = 0.12;
        for (let i = 0; i < 6; i += 1) spawnParticle(bullet.x, bullet.y, '#fffb7d', 3, 120, 0.38);
        if (boss.health <= 0) {
          boss.health = 0;
          win = true;
          gameActive = false;
          gameOver = true;
          setMessage('Victory! Boss defeated.', 4000);
        } else if (boss.health < boss.maxHealth * 0.6) {
          boss.phase = 3;
        } else if (boss.health < boss.maxHealth * 0.85) {
          boss.phase = 2;
        }
        if (Math.random() < 0.18) spawnPowerup(['shield', 'heal', 'rapid'][Math.floor(Math.random() * 3)]);
      }
      return false;
    }
    return true;
  });

  if (boss.invulnerable > 0) boss.invulnerable -= delta;
  bossAttack(delta);

  boss.x += boss.moveDirection * 80 * delta;
  if (boss.x < boss.width / 2 + 80 || boss.x > width - boss.width / 2 - 80) boss.moveDirection *= -1;

  enemyBullets = enemyBullets.filter((bullet) => {
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    if (bullet.x < -40 || bullet.x > width + 40 || bullet.y < -40 || bullet.y > height + 40) return false;
    if (circleDistance(bullet, player) < bullet.radius + player.radius - 6) {
      if (player.shield > 0) {
        player.shield -= 1;
        setMessage('Shield absorbed the hit!', 1600);
      } else {
        player.health -= 1;
        setMessage('You took damage! Dodge the next volley.', 1800);
      }
      for (let i = 0; i < 6; i += 1) spawnParticle(player.x, player.y, '#38bdf8', 3, 90, 0.32);
      if (player.health <= 0) {
        gameActive = false;
        win = false;
        gameOver = true;
        setMessage('Defeated. Restart to try again.', 4000);
      }
      return false;
    }
    return true;
  });

  powerups = powerups.filter((powerup) => {
    powerup.life -= delta * 1000;
    if (powerup.life <= 0) return false;
    if (circleDistance(powerup, player) < powerup.radius + player.radius + 10) {
      if (powerup.type === 'shield') {
        player.shield = 3;
        setMessage('Shield ready for 3 hits.', 2200);
      } else if (powerup.type === 'heal') {
        player.health = Math.min(5, player.health + 1);
        setMessage('Health restored.', 1800);
      } else if (powerup.type === 'rapid') {
        player.rapid = 5;
        setMessage('Rapid fire active.', 2200);
      }
      return false;
    }
    return true;
  });

  particles = particles.filter((particle) => {
    particle.life -= delta;
    if (particle.life <= 0) return false;
    particle.x += particle.vx * delta * 60;
    particle.y += particle.vy * delta * 60;
    return true;
  });

  if (state.lastPowerup > 9000) {
    spawnPowerup(['shield', 'heal', 'rapid'][Math.floor(Math.random() * 3)]);
    state.lastPowerup = 0;
  }
  state.lastPowerup += delta * 1000;
  if (state.messageTimer > 0) {
    state.messageTimer -= delta * 1000;
    if (state.messageTimer <= 0) state.message = '';
  }
}

function drawRoundedRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#020617');
  gradient.addColorStop(1, '#121b2f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.fillStyle = 'rgba(248, 113, 255, 0.12)';
  ctx.beginPath();
  ctx.ellipse(boss.x, boss.y + 35, 240, 120, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = boss.phase === 1 ? '#f97316' : boss.phase === 2 ? '#fb7185' : '#ec4899';
  ctx.strokeStyle = boss.invulnerable > 0 ? '#ffffff' : '#ffffff22';
  ctx.lineWidth = 4;
  drawRoundedRect(boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height, 26, true, true);
  ctx.fillStyle = '#111827';
  ctx.fillRect(boss.x - 44, boss.y - 30, 88, 60);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(boss.x - 52, boss.y - 28, 18, 10);
  ctx.fillRect(boss.x + 34, boss.y - 28, 18, 10);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(boss.x - 48, boss.y - 24, 10, 6);
  ctx.fillRect(boss.x + 38, boss.y - 24, 10, 6);

  ctx.fillStyle = '#111827';
  drawRoundedRect(40, 34, 420, 24, 12, true, false);
  ctx.fillStyle = '#f59e0b';
  drawRoundedRect(44, 38, (boss.health / boss.maxHealth) * 412, 16, 10, true, false);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText(`Boss Health: ${Math.ceil(boss.health)} / ${boss.maxHealth}`, 44, 28);

  ctx.save();
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
  const gunX = player.x + Math.cos(angle) * 30;
  const gunY = player.y + Math.sin(angle) * 30;
  if (gunLoaded) {
    ctx.save();
    ctx.translate(gunX, gunY);
    ctx.rotate(angle);
    ctx.scale(-1, 1);
    ctx.drawImage(gunSprite, -24, -14, 48, 28);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(gunX, gunY);
    ctx.rotate(angle);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-18, -6, 36, 12);
    ctx.restore();
  }

  bullets.forEach((bullet) => {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  enemyBullets.forEach((bullet) => {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  powerups.forEach((powerup) => {
    ctx.save();
    ctx.translate(powerup.x, powerup.y);
    ctx.fillStyle = powerup.type === 'shield' ? '#22c55e' : powerup.type === 'heal' ? '#38bdf8' : '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, powerup.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.font = '18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(powerup.type === 'shield' ? 'S' : powerup.type === 'heal' ? '+' : 'R', 0, 0);
    ctx.restore();
  });

  particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = '#f8fafc';
  ctx.font = '16px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.message, 40, 72);
  ctx.fillText(`Phase ${boss.phase} · ${canShoot ? 'Ready' : reloadTimer.toFixed(0) + 'ms reload'}`, 40, 96);

  ctx.fillStyle = '#111827';
  drawRoundedRect(40, height - 76, 260, 24, 12, true, false);
  ctx.fillStyle = '#22c55e';
  drawRoundedRect(44, height - 72, (player.health / 5) * 252, 16, 8, true, false);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('Health', 44, height - 86);

  ctx.fillStyle = '#111827';
  drawRoundedRect(340, height - 76, 220, 24, 12, true, false);
  ctx.fillStyle = '#38bdf8';
  drawRoundedRect(344, height - 72, (player.shield / 3) * 212, 16, 8, true, false);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('Shield', 344, height - 86);

  ctx.fillStyle = '#111827';
  drawRoundedRect(590, height - 76, 220, 24, 12, true, false);
  ctx.fillStyle = '#f97316';
  drawRoundedRect(594, height - 72, (player.rapid / 5) * 212, 16, 8, true, false);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('Rapid', 594, height - 86);

  if (!gameActive) {
    ctx.fillStyle = 'rgba(7, 10, 25, 0.75)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '44px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(gameOver ? (win ? 'Victory!' : 'Defeat') : 'Boss Battle', width / 2, height / 2 - 20);
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText(gameOver ? (win ? 'Press Restart to fight again.' : 'Press Restart to try again.') : 'Press Start Battle to begin.', width / 2, height / 2 + 24);
  }
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = Math.min((timestamp - lastTime) / 1000, 0.032);
  lastTime = timestamp;
  if (gameActive) updateGame(delta);
  draw();
  requestAnimationFrame(loop);
}

function initialize() {
  const startBtn = document.getElementById('startButton');
  const restartBtn = document.getElementById('restartButton');
  const screen = document.getElementById('gameScreen');

  resizeCanvas();

  screen.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = event.clientX - rect.left;
    mousePos.y = event.clientY - rect.top;
  });

  screen.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    shootPressed = true;
    if (!gameActive && gameOver) startBattle();
  });
  screen.addEventListener('mouseup', (event) => {
    if (event.button !== 0) return;
    shootPressed = false;
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'a' || event.key === 'ArrowLeft') keys.left = true;
    if (event.key === 'd' || event.key === 'ArrowRight') keys.right = true;
    if (event.key === 'w' || event.key === 'ArrowUp') keys.up = true;
    if (event.key === 's' || event.key === 'ArrowDown') keys.down = true;
    if (event.key === 'Shift' && player.dashCooldown <= 0 && gameActive) {
      player.dash = 0.25;
      player.dashCooldown = 1.8;
      setMessage('Dash engaged! Avoid fire.', 1800);
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.key === 'a' || event.key === 'ArrowLeft') keys.left = false;
    if (event.key === 'd' || event.key === 'ArrowRight') keys.right = false;
    if (event.key === 'w' || event.key === 'ArrowUp') keys.up = false;
    if (event.key === 's' || event.key === 'ArrowDown') keys.down = false;
  });

  window.addEventListener('resize', resizeCanvas);
  startBtn.addEventListener('click', startBattle);
  restartBtn.addEventListener('click', startBattle);
  requestAnimationFrame(loop);
}

function startBattle() {
  resetFight();
  gameActive = true;
  gameOver = false;
  win = false;
}

window.addEventListener('load', initialize);
