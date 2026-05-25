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
    color: playerColors[0]
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
  // ground platform at bottom
  platforms.push({ x: 0, y: worldHeight - 20, width: worldWidth, height: 20 });

  // generate ascending platforms up to finishY
  let y = worldHeight - 140;
  const gapMin = 80;
  const gapMax = 140;
  while (y > finishY + 40) {
    const pw = 160 + Math.floor(Math.random() * 120);
    const px = 20 + Math.floor(Math.random() * Math.max(1, worldWidth - pw - 40));
    platforms.push({ x: px, y: y, width: pw, height: 12 });
    y -= gapMin + Math.floor(Math.random() * (gapMax - gapMin));
  }

  // top finishing platform
  platforms.push({ x: worldWidth/2 - 120, y: finishY, width: 240, height: 14 });
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
        height: 46
      };
    } else {
      // ensure color and lane are set for this index
      players[playerName].lane = index;
      players[playerName].color = playerColors[index] || playerColors[0];
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
  const speed = 240;
  const jumpSpeed = -600;
  const gravity = 1400;

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
  myState.x = Math.max(0, Math.min(worldWidth, myState.x));

  // collision with platforms (only when falling)
  if (myState.vy > 0) {
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      // player bottom (myState.y) crosses platform top?
      if (prevY < p.y && myState.y >= p.y) {
        // check horizontal overlap
        if ((myState.x + myState.width) > p.x && myState.x < (p.x + p.width)) {
          myState.y = p.y;
          myState.vy = 0;
          myState.onGround = true;
          break;
        }
      }
    }
  }

  // ground floor fallback
  if (myState.y > worldHeight - 20) {
    myState.y = worldHeight - 20;
    myState.vy = 0;
    myState.onGround = true;
  }

  // finish detection: reaching or passing the finishY (top)
  if (myState.y <= finishY && !finishedRound && currentRoom?.status === "playing") {
    finishedRound = true;
    socket.emit("platformer:finish-line", { roomId: currentRoom.roomId, username });
  }
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

  // Draw platforms
  platforms.forEach((p) => {
    const sx = p.x;
    const sy = p.y - cameraY;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(sx, sy, p.width, p.height);
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
    sendPositionUpdate(now);
    // ensure local player is in the players map with all rendering props
    if (!players[username]) {
      players[username] = {
        x: myState.x,
        y: myState.y,
        interpX: myState.x,
        interpY: myState.y,
        width: 36,
        height: 46,
        color: playerColors[0],
        lane: 0,
        name: username
      };
    }
    // always update position
    players[username].x = myState.x;
    players[username].y = myState.y;
  }

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
  generatePlatforms();
  updateRoomSummary();
  updateActionButtons();
  showNotification = "Go!";
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

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (event.key === "a" || event.key === "ArrowLeft") controls.left = true;
  if (event.key === "d" || event.key === "ArrowRight") controls.right = true;
  if (event.key === "w" || event.key === "ArrowUp") controls.jump = true;
});

window.addEventListener("keyup", (event) => {
  if (event.key === "a" || event.key === "ArrowLeft") controls.left = false;
  if (event.key === "d" || event.key === "ArrowRight") controls.right = false;
  if (event.key === "w" || event.key === "ArrowUp") controls.jump = false;
});

window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', scheduleResize);

showProtocolWarning();
scheduleResize();
render();
