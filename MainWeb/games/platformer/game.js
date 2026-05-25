const username = localStorage.getItem("username") || `Guest-${Math.random().toString(36).slice(2, 6)}`;
const socket = typeof io === "function" && window.location.protocol !== "file:" ? io() : {
  on: () => {},
  emit: () => {},
  connected: false
};

const canvas = document.getElementById("platformerCanvas");
const ctx = canvas.getContext("2d");
const roomList = document.getElementById("roomList");
const roomStatus = document.getElementById("roomStatus");
const roomTitle = document.getElementById("roomTitle");
const hostName = document.getElementById("hostName");
const targetScoreLabel = document.getElementById("targetScore");
const gameStatus = document.getElementById("gameStatus");
const playerCount = document.getElementById("playerCount");
const scoreBoard = document.getElementById("scoreboard");
const createRoomBtn = document.getElementById("createRoomBtn");
const startGameBtn = document.getElementById("startGameBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const roomNameInput = document.getElementById("roomNameInput");
const targetScoreInput = document.getElementById("targetScoreInput");
const gamePanel = document.getElementById("gamePanel");

// vertical world: climb up toward `finishY` (smaller y values)
const worldWidth = 800;
const worldHeight = 3000;
const finishY = 80; // y coordinate near the top that ends the round
const laneColors = ["#4f46e5", "#10b981", "#f97316", "#ec4899"];
const playerColors = ["#60a5fa", "#34d399", "#fb7185", "#facc15"];
let platforms = [];
let bullets = [];
let lastBulletSpawn = 0;
const bulletSpawnInterval = 1.6;
let powerups = [];
let gunShots = [];
const gunShotSpeed = 720;
const gunRotationRadius = 32;
const powerupTypes = {
  bomb: { name: 'bomb', label: '💣 Bomb', color: '#ef4444', duration: 0, icon: '💣', effect: 'clearBullets' },
  doubleFire: { name: 'doubleFire', label: '🔥 Double Fire', color: '#f59e0b', duration: 8, icon: '🔥', effect: 'doubleBullets' },
  invincibility: { name: 'invincibility', label: '🛡️ Invincibility', color: '#8b5cf6', duration: 6, icon: '🛡️', effect: 'invincible' },
  jumpBoost: { name: 'jumpBoost', label: '⬆️ Jump Boost', color: '#06b6d4', duration: 5, icon: '⬆️', effect: 'higherJump' }
};

let currentRoom = null;
let players = {};
let myState = createPlayerState();
let controls = { left: false, right: false, jump: false };
let lastPositionSend = 0;
let finishedRound = false;
let showNotification = "";
let isHost = false;
let DPR = Math.max(1, window.devicePixelRatio || 1);
let resizePending = false;

function createPlayerState() {
  return {
    x: worldWidth / 2,
    y: worldHeight - 60,
    vx: 0,
    vy: 0,
    width: 36,
    height: 46,
    onGround: true,
    color: playerColors[0],
    activePowerups: {},
    bulletMultiplier: 1,
    activeAbility: null
  };
}

function updateActionButtons() {
  if (!currentRoom) {
    startGameBtn.disabled = true;
    return;
  }

  const playerCountValue = 1 + currentRoom.guests.length;
  const canStart = isHost && playerCountValue >= 2 && currentRoom.status !== "playing";

  startGameBtn.disabled = !canStart;
  startGameBtn.textContent = currentRoom.status === "playing" ? "Race in progress" : "Start race";
}

function setRoomStatus(message, isError = false) {
  roomStatus.textContent = message;
  roomStatus.classList.toggle("hidden", !message);
  roomStatus.style.borderColor = isError ? "rgba(248, 113, 113, 0.35)" : "rgba(16, 185, 129, 0.18)";
  roomStatus.style.background = isError ? "rgba(248, 113, 113, 0.12)" : "";
}

function showProtocolWarning() {
  if (window.location.protocol === "file:") {
    setRoomStatus("Platformer Race must be loaded from the local webserver, not directly from the file system.", true);
  } else if (!window.io) {
    setRoomStatus("Socket.IO failed to load. Make sure your server is running.", true);
  }
}

function updateRoomList(rooms) {
  if (!rooms.length) {
    roomList.innerHTML = '<div class="room-card">No open rooms available. Create one to start.</div>';
    return;
  }

  roomList.innerHTML = rooms
    .filter((room) => room.status !== "playing")
    .map((room) => {
      const players = [room.host, ...room.guests].join(" • ");
      return `
        <div class="room-card">
          <div class="room-title">${room.roomName}</div>
          <div class="room-meta">Host: ${room.host}</div>
          <div class="room-meta">Players: ${players}</div>
          <div class="room-meta">Target: ${room.targetScore}</div>
          <button type="button" data-room="${room.roomId}">Join room</button>
        </div>`;
    })
    .join("");

  roomList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      joinRoom(button.dataset.room);
    });
  });
}

function resetLocalState() {
  myState = createPlayerState();
  finishedRound = false;
  showNotification = "";
  players = {};
  ensurePlayerStates();
}

function generatePlatforms() {
  platforms = [];
  powerups = [];
  // ground platform at bottom
  platforms.push({ x: 0, y: worldHeight - 20, width: worldWidth, height: 20 });

  // generate ascending platforms up to finishY
  let y = worldHeight - 140;
  const gapMin = 100;
  const gapMax = 130;
  let prevX = worldWidth / 2 - 90;
  let prevWidth = 180;
  while (y > finishY + 40) {
    const pw = 140 + Math.floor(Math.random() * 110);
    const maxShift = 180;
    let px = prevX + Math.floor((Math.random() * 2 - 1) * maxShift);
    px = Math.max(20, Math.min(worldWidth - pw - 20, px));

    // keep jump distances fair by limiting horizontal separation
    const prevCenter = prevX + prevWidth / 2;
    const center = px + pw / 2;
    const maxCenterDelta = Math.max((prevWidth + pw) / 2 - 30, 0);
    if (Math.abs(center - prevCenter) > maxCenterDelta) {
      const direction = center > prevCenter ? 1 : -1;
      px = Math.round(prevCenter + direction * maxCenterDelta - pw / 2);
      px = Math.max(20, Math.min(worldWidth - pw - 20, px));
    }

    platforms.push({ x: px, y: y, width: pw, height: 12 });

    // randomly spawn powerups on platforms (30% chance)
    if (Math.random() < 0.3) {
      const powerupTypes_array = Object.values(powerupTypes);
      const chosen = powerupTypes_array[Math.floor(Math.random() * powerupTypes_array.length)];
      const powerupX = px + Math.random() * (pw - 16);
      powerups.push({
        x: powerupX,
        y: y - 20,
        width: 16,
        height: 16,
        type: chosen.name,
        collected: false
      });
    }

    prevX = px;
    prevWidth = pw;
    y -= gapMin + Math.floor(Math.random() * (Math.max(0, gapMax - gapMin) - 70));
  }

  // top finishing platform
  platforms.push({ x: worldWidth / 2 - 120, y: finishY, width: 240, height: 14 });
}

function resizeCanvas() {
  // Set canvas size to match CSS size, but use devicePixelRatio for crispness
  const cssW = canvas.clientWidth || 1200;
  const cssH = canvas.clientHeight || 420;
  DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(cssW * DPR);
  canvas.height = Math.floor(cssH * DPR);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function scheduleResize() {
  if (resizePending) return;
  resizePending = true;
  requestAnimationFrame(() => {
    resizePending = false;
    resizeCanvas();
  });
}

function ensurePlayerStates() {
  if (!currentRoom) return;
  const orderedPlayers = [currentRoom.host, ...currentRoom.guests].slice(0, 4);
  orderedPlayers.forEach((playerName, index) => {
    if (!players[playerName]) {
      players[playerName] = {
        x: worldWidth / 2 + (index - 1) * 80,
        interpX: worldWidth / 2 + (index - 1) * 80,
        y: worldHeight - 60,
        interpY: worldHeight - 60,
        color: playerColors[index] || playerColors[0],
        lane: index,
        name: playerName,
        width: 36,
        height: 46,
        activeAbility: null
      };
    }
    players[playerName].lane = index;
    players[playerName].color = playerColors[index] || playerColors[0];
    // ensure local baseline for host
    if (playerName === username) {
      myState.y = worldHeight - 60;
      myState.x = players[playerName].x;
    }
  });
}

function openRoom(room) {
  currentRoom = room;
  isHost = room.host === username;
  gamePanel.classList.remove("hidden");
  roomTitle.textContent = room.roomName;
  hostName.textContent = room.host;
  targetScoreLabel.textContent = room.targetScore;
  setRoomStatus("You are in room: " + room.roomName);
  resetLocalState();
  ensurePlayerStates();
  updateRoomSummary();
  updateActionButtons();
  // initialize canvas size for this session
  scheduleResize();
}

function updateRoomSummary() {
  const playerCountValue = 1 + currentRoom.guests.length;
  playerCount.textContent = `${playerCountValue}/4 players connected`;
  updateScoreboard();
}

function updateScoreboard() {
  if (!currentRoom) {
    scoreBoard.innerHTML = "";
    return;
  }

  const orderedPlayers = [currentRoom.host, ...currentRoom.guests].slice(0, 4);
  scoreBoard.innerHTML = orderedPlayers
    .map((playerName) => {
      const score = currentRoom.scores?.[playerName] ?? 0;
      const label = playerName === username ? `${playerName} (you)` : playerName;
      return `<div class="score-row"><span>${label}</span><strong>${score}</strong></div>`;
    })
    .join("");
}

function joinRoom(roomId) {
  socket.emit("platformer:join-room", { roomId, username });
}

function createRoom() {
  const roomName = roomNameInput.value.trim();
  const targetScore = targetScoreInput.value;
  socket.emit("platformer:create-room", { roomName, username, targetScore });
  roomNameInput.value = "";
}

function startGame() {
  if (!currentRoom) return;
  socket.emit("platformer:start-game", { roomId: currentRoom.roomId, username });
}

function leaveRoom() {
  if (!currentRoom) return;
  socket.emit("platformer:leave-room", { roomId: currentRoom.roomId, username });
  currentRoom = null;
  gamePanel.classList.add("hidden");
  setRoomStatus("Left the room.");
  players = {};
  updateActionButtons();
}

function setGameStatus(message) {
  gameStatus.textContent = message;
}

function updateLocalControls(delta) {
  const speed = 230;
  const jumpBoostMultiplier = myState.activePowerups.jumpBoost ? 1.35 : 1;
  const jumpSpeed = -640 * jumpBoostMultiplier;
  const gravity = 1500;

  if (controls.left) {
    myState.vx = -speed;
  } else if (controls.right) {
    myState.vx = speed;
  } else {
    myState.vx = 0;
  }

  if (controls.jump && myState.onGround) {
    myState.vy = jumpSpeed;
    myState.onGround = false;
  }
  // apply physics
  myState.vy += gravity * delta;
  const prevY = myState.y;
  myState.x += myState.vx * delta;
  myState.y += myState.vy * delta;

  // clamp horizontally
  myState.x = Math.max(0, Math.min(worldWidth - myState.width, myState.x));

  // collision with platforms (only when falling)
  let landedOnPlatform = false;
  if (myState.vy > 0) {
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const didCrossTop = prevY <= p.y && myState.y >= p.y;
      const hasHorizontalOverlap = (myState.x + myState.width) > p.x && myState.x < (p.x + p.width);
      if (didCrossTop && hasHorizontalOverlap) {
        myState.y = p.y;
        myState.vy = 0;
        landedOnPlatform = true;
        break;
      }
    }
  }

  // ground floor fallback
  if (myState.y > worldHeight - 20) {
    myState.y = worldHeight - 20;
    myState.vy = 0;
    landedOnPlatform = true;
  }

  myState.onGround = landedOnPlatform;

  // finish detection: reaching or passing the finishY (top)
  if (myState.y <= finishY && !finishedRound && currentRoom?.status === "playing") {
    finishedRound = true;
    socket.emit("platformer:finish-line", { roomId: currentRoom.roomId, username });
  }
}

function updateProjectiles(delta) {
  lastBulletSpawn += delta;
  if (lastBulletSpawn >= bulletSpawnInterval) {
    lastBulletSpawn = 0;
    const cssH = canvas.clientHeight;
    const cameraY = Math.min(Math.max(myState.y - cssH * 0.45, finishY), worldHeight - cssH);
    const spawnY = Math.min(Math.max(cameraY + 80 + Math.random() * (cssH - 160), finishY + 20), worldHeight - 60);
    const fromLeft = Math.random() < 0.5;
    const speed = 260 + Math.random() * 80;
    const gunX = fromLeft ? -24 : worldWidth + 22;
    
    // double fire if doubleFire powerup is active
    const bulletCount = myState.activePowerups.doubleFire ? 2 : 1;
    for (let i = 0; i < bulletCount; i++) {
      const offset = bulletCount === 2 ? (i === 0 ? -20 : 20) : 0;
      bullets.push({
        x: fromLeft ? -20 : worldWidth + 20,
        y: spawnY + offset,
        vx: fromLeft ? speed : -speed,
        radius: 10,
        gunX,
        side: fromLeft ? 'left' : 'right'
      });
    }
  }

  bullets.forEach((bullet) => {
    bullet.x += bullet.vx * delta;
  });

  bullets = bullets.filter((bullet) => bullet.x >= -60 && bullet.x <= worldWidth + 60);

  const playerCenterX = myState.x + myState.width / 2;
  const playerCenterY = myState.y - myState.height / 2;
  bullets.forEach((bullet) => {
    const dx = bullet.x - playerCenterX;
    const dy = bullet.y - playerCenterY;
    if (Math.hypot(dx, dy) < bullet.radius + Math.max(myState.width, myState.height) * 0.45) {
      // if invincible, don't reset
      if (!myState.activePowerups.invincibility) {
        myState.x = worldWidth / 2;
        myState.y = worldHeight - 60;
        myState.vy = 0;
        myState.vx = 0;
        finishedRound = false;
        showNotification = "A projectile hit you! Back to the bottom.";
      }
    }
  });

  // powerup collision detection
  const playerRect = { x: myState.x, y: myState.y, width: myState.width, height: myState.height };
  powerups.forEach((powerup) => {
    if (powerup.collected) return;
    if (checkRectCollision(playerRect, { x: powerup.x, y: powerup.y, width: powerup.width, height: powerup.height })) {
      powerup.collected = true;
      const type = powerupTypes[powerup.type];
      if (type.effect === 'clearBullets') {
        bullets = [];
        showNotification = "💣 Bomb! Cleared all bullets!";
      } else if (type.effect === 'doubleFire') {
        myState.activePowerups.doubleFire = true;
        setTimeout(() => { delete myState.activePowerups.doubleFire; }, type.duration * 1000);
        showNotification = "🔥 Double Fire active!";
      } else if (type.effect === 'invincible') {
        myState.activePowerups.invincibility = true;
        setTimeout(() => { delete myState.activePowerups.invincibility; }, type.duration * 1000);
        showNotification = "🛡️ Invincible shield up!";
      } else if (type.effect === 'higherJump') {
        myState.activePowerups.jumpBoost = true;
        setTimeout(() => { delete myState.activePowerups.jumpBoost; }, type.duration * 1000);
        showNotification = "⬆️ Jump boost active!";
      }
    }
  });
  
  // remove collected powerups
  powerups = powerups.filter(p => !p.collected);
}

function updateGunShots(delta) {
  gunShots.forEach((shot) => {
    shot.x += shot.vx * delta;
    shot.y += shot.vy * delta;
  });

  gunShots = gunShots.filter((shot) => shot.x >= -50 && shot.x <= worldWidth + 50 && shot.y >= -50 && shot.y <= worldHeight + 50);

  const playerCenter = { x: myState.x + myState.width / 2, y: myState.y - myState.height / 2 };
  gunShots.forEach((shot) => {
    if (shot.owner === username) return;
    const dx = shot.x - playerCenter.x;
    const dy = shot.y - playerCenter.y;
    const distance = Math.hypot(dx, dy);
    if (distance < shot.radius + Math.max(myState.width, myState.height) * 0.45) {
      myState.x = worldWidth / 2;
      myState.y = worldHeight - 60;
      myState.vy = 0;
      myState.vx = 0;
      finishedRound = false;
      showNotification = "Hit by a gun shot! Back to the bottom.";
      gunShots = gunShots.filter((s) => s !== shot);
    }
  });
}

function checkRectCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

function sendPositionUpdate(now) {
  if (!currentRoom || currentRoom.status !== "playing") return;
  if (now - lastPositionSend < 80) return;
  lastPositionSend = now;

  socket.emit("platformer:update-position", {
    roomId: currentRoom.roomId,
    username,
    position: {
      x: myState.x,
      y: myState.y
    }
  });
}

function drawWorld() {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  ctx.clearRect(0, 0, cssW, cssH);
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, cssH);
  grad.addColorStop(0, '#07101c');
  grad.addColorStop(1, '#05070c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cssW, cssH);

  // Camera follows local player vertically
  const cameraY = Math.min(Math.max(myState.y - cssH * 0.45, finishY), worldHeight - cssH);

  // Draw platforms in green
  platforms.forEach((p) => {
    const sx = p.x;
    const sy = p.y - cameraY;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(sx, sy, p.width, p.height);
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, p.width, p.height);
  });

  // draw powerups
  powerups.forEach((powerup) => {
    if (powerup.collected) return;
    const sx = powerup.x;
    const sy = powerup.y - cameraY;
    const type = powerupTypes[powerup.type];
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.arc(sx + powerup.width / 2, sy + powerup.height / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type.icon, sx + powerup.width / 2, sy + powerup.height / 2);
  });

  // draw projectile hazards
  bullets.forEach((bullet) => {
    const sx = bullet.x;
    const sy = bullet.y - cameraY;
    ctx.fillStyle = bullet.vx > 0 ? '#facc15' : '#f97316';
    ctx.beginPath();
    ctx.arc(sx, sy, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(sx - 2, sy - 8, 4, 16);
  });

  // draw gun shots
  gunShots.forEach((shot) => {
    const sx = shot.x;
    const sy = shot.y - cameraY;
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(sx, sy, shot.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw finish banner
  const finishScreenY = finishY - cameraY;
  ctx.fillStyle = '#e879f9';
  ctx.fillRect(0, finishScreenY - 6, cssW, 6);
  ctx.fillStyle = 'rgba(232,121,249,0.06)';
  ctx.fillRect(0, finishScreenY - 60, cssW, 60);

  // Draw players (with interpolation on X and Y)
  Object.values(players).forEach((player) => {
    const displayX = (player.interpX !== undefined) ? player.interpX : player.x;
    const displayY = (player.interpY !== undefined) ? player.interpY : player.y;
    const x = displayX;
    const y = displayY - cameraY;
    const w = player.width || 36;
    const h = player.height || 46;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, x + 4, y - h + 6, w, h, 6, true, false);

    // body
    ctx.fillStyle = player.color || '#60a5fa';
    roundRect(ctx, x, y - h, w, h, 6, true, false);

    // gun ability visual
    if (player.activeAbility?.type === 'gun') {
      const centerX = x + w / 2;
      const centerY = y - h / 2;
      const angle = player.activeAbility.angle || 0;
      const gunX = centerX + Math.cos(angle) * gunRotationRadius;
      const gunY = centerY + Math.sin(angle) * gunRotationRadius;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(gunX, gunY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(gunX, gunY);
      ctx.stroke();
    }

    // invincibility shield
    if (player.name === username && myState.activePowerups.invincibility) {
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + w / 2, y - h / 2, w / 2 + 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // name
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(player.name === username ? `${player.name} (you)` : player.name, x - 6, y - h - 8);
  });
}

// helper: rounded rect
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function render() {
  const now = performance.now();
  const delta = Math.min((now - (window.lastTime || now)) / 1000, 0.032);
  window.lastTime = now;

  if (currentRoom?.status === "playing") {
    updateLocalControls(delta);
    updateProjectiles(delta);
    updateGunShots(delta);
    sendPositionUpdate(now);
    players[username] = {
      ...players[username],
      x: myState.x,
      y: myState.y,
      interpX: myState.x,
      interpY: myState.y,
      width: 36,
      height: 46,
      color: players[username]?.color || playerColors[0],
      lane: players[username]?.lane ?? 0,
      name: username,
      activeAbility: myState.activeAbility
    };
  }

  // rotate gun ability icons
  Object.values(players).forEach((player) => {
    if (player.activeAbility?.type === 'gun') {
      player.activeAbility.angle = ((player.activeAbility.angle || 0) + delta * 2.4) % (Math.PI * 2);
      if (player.name === username) {
        myState.activeAbility = player.activeAbility;
      }
    }
  });

  // interpolate remote players toward their target positions
  const interpSpeed = 8; // higher = snappier
  Object.values(players).forEach((p) => {
    if (p.name === username) return;
    if (p.interpX === undefined) p.interpX = p.x;
    // simple lerp for X and Y
    p.interpX += (p.x - p.interpX) * Math.min(1, interpSpeed * delta);
    if (p.interpY === undefined) p.interpY = p.y;
    p.interpY += (p.y - p.interpY) * Math.min(1, interpSpeed * delta);
  });

  drawWorld();

  if (!currentRoom) {
    setGameStatus("Join or create a room to start playing.");
  } else if (currentRoom.status === "waiting") {
    setGameStatus("Waiting for another player to join.");
  } else if (currentRoom.status === "ready") {
    setGameStatus(isHost ? "Ready to start the race." : "Waiting for the host to start." );
  } else if (currentRoom.status === "playing") {
    setGameStatus(showNotification || "Race in progress! Reach the finish line.");
  }

  requestAnimationFrame(render);
}

socket.on("connect", () => {
  socket.emit("platformer:get-rooms");
});

socket.on("platformer-room-list", updateRoomList);

socket.on("platformer-room-created", openRoom);

socket.on("platformer-room-joined", openRoom);

socket.on("platformer-room-updated", (room) => {
  if (currentRoom?.roomId === room.roomId) {
    currentRoom = room;
    isHost = currentRoom.host === username;
    ensurePlayerStates();
    updateRoomSummary();
    updateActionButtons();
  }
});

socket.on("platformer-game-started", (room) => {
  if (currentRoom?.roomId !== room.roomId) return;
  currentRoom = room;
  isHost = currentRoom.host === username;
  resetLocalState();
  ensurePlayerStates();
  bullets = [];
  gunShots = [];
  lastBulletSpawn = 0;
  if (room.platforms && Array.isArray(room.platforms)) {
    platforms = room.platforms;
    powerups = Array.isArray(room.powerups) ? room.powerups : [];
  } else {
    generatePlatforms();
  }
  if (room.abilityOwner) {
    const abilityType = room.abilityType || 'gun';
    Object.values(players).forEach((player) => {
      player.activeAbility = null;
    });
    if (room.abilityOwner === username) {
      myState.activeAbility = { type: abilityType, angle: 0 };
    }
    if (players[room.abilityOwner]) {
      players[room.abilityOwner].activeAbility = { type: abilityType, angle: 0 };
    }
  } else {
    myState.activeAbility = null;
    Object.values(players).forEach((player) => {
      player.activeAbility = null;
    });
  }
  updateRoomSummary();
  updateActionButtons();
  showNotification = "Go!";
});

socket.on("platformer-gun-fired", ({ roomId, owner, x, y, angle }) => {
  if (!currentRoom || currentRoom.roomId !== roomId) return;
  if (players[owner]) {
    players[owner].activeAbility = null;
  }
  const rad = angle || 0;
  gunShots.push({
    x,
    y,
    vx: Math.cos(rad) * gunShotSpeed,
    vy: Math.sin(rad) * gunShotSpeed,
    radius: 8,
    owner
  });
});

socket.on("platformer-position-update", ({ roomId, positions }) => {
  if (!currentRoom || currentRoom.roomId !== roomId) return;
  const now = performance.now();
  Object.entries(positions).forEach(([name, position]) => {
    if (name === username) return;
    if (!players[name]) {
      players[name] = {
        x: position.x,
        interpX: position.x,
        y: position.y,
        interpY: position.y,
        lane: Object.keys(players).length,
        color: playerColors[Object.keys(players).length % playerColors.length],
        name,
        lastUpdate: now
      };
    } else {
      // smooth interpolate
      players[name].lastX = players[name].x;
      players[name].x = position.x;
      players[name].y = position.y;
      players[name].lastUpdate = now;
    }
  });
});

socket.on("platformer-round-ended", (payload) => {
  if (!currentRoom || currentRoom.roomId !== payload.roomId) return;
  if (!currentRoom.scores) currentRoom.scores = {};
  currentRoom.scores = payload.scores;
  currentRoom.status = "ready";
  finishedRound = true;
  showNotification = `${payload.winner} reached the finish line!`;
  updateScoreboard();
  updateRoomSummary();
  updateActionButtons();
});

socket.on("platformer-game-over", (payload) => {
  if (!currentRoom || currentRoom.roomId !== payload.roomId) return;
  currentRoom = null;
  gamePanel.classList.add("hidden");
  setRoomStatus(`${payload.winner} won the match with ${payload.scores[payload.winner]} points!`);
});

socket.on("platformer-room-closed", ({ reason }) => {
  if (!currentRoom) return;
  currentRoom = null;
  gamePanel.classList.add("hidden");
  setRoomStatus(reason || "Room closed.");
});

socket.on("platformer-room-error", (message) => {
  setRoomStatus(message, true);
});

createRoomBtn.addEventListener("click", createRoom);
startGameBtn.addEventListener("click", startGame);
leaveRoomBtn.addEventListener("click", leaveRoom);

function isTypingTarget(e) {
  const t = e.target;
  if (!t) return false;
  if (t.isContentEditable) return true;
  const tag = (t.tagName || "").toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

window.addEventListener("keydown", (event) => {
  if (isTypingTarget(event)) return; // allow typing in form fields
  if (event.repeat) return;
  const key = event.key;
  if (["a", "ArrowLeft"].includes(key)) {
    event.preventDefault();
    controls.left = true;
  }
  if (["d", "ArrowRight"].includes(key)) {
    event.preventDefault();
    controls.right = true;
  }
  if (["w", "ArrowUp", " ", "Space", "Spacebar"].includes(key)) {
    event.preventDefault();
    controls.jump = true;
  }
  if (key.toLowerCase() === 'f' && currentRoom?.status === 'playing') {
    event.preventDefault();
    if (myState.activeAbility?.type === 'gun') {
      const angle = myState.activeAbility.angle || 0;
      socket.emit('platformer:fire-gun', {
        roomId: currentRoom.roomId,
        username,
        position: { x: myState.x + myState.width / 2, y: myState.y - myState.height / 2 },
        angle
      });
      myState.activeAbility = null;
      showNotification = 'Gun fired!';
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (isTypingTarget(event)) return;
  const key = event.key;
  if (["a", "ArrowLeft"].includes(key)) {
    event.preventDefault();
    controls.left = false;
  }
  if (["d", "ArrowRight"].includes(key)) {
    event.preventDefault();
    controls.right = false;
  }
  if (["w", "ArrowUp", " ", "Space", "Spacebar"].includes(key)) {
    event.preventDefault();
    controls.jump = false;
  }
});

window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', scheduleResize);

showProtocolWarning();
scheduleResize();
render();
