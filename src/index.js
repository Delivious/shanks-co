import express from "express";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
import { Resend } from "resend";
import collection from "./config.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..")));

const server = http.createServer(app);
const io = new Server(server);
const rooms = {};
const platformerRooms = {};
const PLATFORMER_WORLD_WIDTH = 800;
const PLATFORMER_WORLD_HEIGHT = 3000;
const PLATFORMER_FINISH_Y = 80;

function sanitizeRoom(room) {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    host: room.host,
    guest: room.guest,
    status: room.status
  };
}

function sanitizePlatformerRoom(room) {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    host: room.host,
    guests: room.guests,
    status: room.status,
    targetScore: room.targetScore,
    scores: room.scores,
    roundWinner: room.roundWinner || null
  };
}

function getRoomList() {
  return Object.values(rooms).map(sanitizeRoom);
}

function getPlatformerRoomList() {
  return Object.values(platformerRooms).map(sanitizePlatformerRoom);
}

function broadcastRoomList() {
  io.emit("room-list", getRoomList());
}

function broadcastPlatformerRoomList() {
  io.emit("platformer-room-list", getPlatformerRoomList());
}

function createSeededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return function () {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    return hash / 0x100000000;
  };
}

function generatePlatformerLayout(seed) {
  const random = createSeededRandom(seed);
  const platforms = [];
  const powerups = [];
  // ground
  platforms.push({ x: 0, y: PLATFORMER_WORLD_HEIGHT - 20, width: PLATFORMER_WORLD_WIDTH, height: 20 });

  let y = PLATFORMER_WORLD_HEIGHT - 140;
  const gapMin = 90;
  const gapMax = 120;
  // start roughly centered
  let prevPw = 190;
  let prevPx = Math.floor(PLATFORMER_WORLD_WIDTH / 2 - prevPw / 2);

  while (y > PLATFORMER_FINISH_Y + 70) {
    const pw = 150 + Math.floor(random() * 110);
    const maxShift = 180; // limit how far next platform can be horizontally
    const shift = Math.floor((random() * 2 - 1) * maxShift);
    let px = prevPx + shift;
    px = Math.max(20, Math.min(PLATFORMER_WORLD_WIDTH - pw - 20, px));

    // ensure reasonable horizontal overlap so jumps are reachable
    const prevCenter = prevPx + prevPw / 2;
    const newCenter = px + pw / 2;
    const maxCenterDist = Math.max((prevPw + pw) / 2 - 30, 0);
    if (Math.abs(newCenter - prevCenter) > maxCenterDist) {
      const dir = newCenter > prevCenter ? 1 : -1;
      px = Math.round(prevCenter + dir * maxCenterDist - pw / 2);
      px = Math.max(20, Math.min(PLATFORMER_WORLD_WIDTH - pw - 20, px));
    }

    platforms.push({ x: px, y, width: pw, height: 14 });

    if (random() < 0.3) {
      const powerupTypes = ['bomb', 'doubleFire', 'invincibility', 'jumpBoost'];
      const chosen = powerupTypes[Math.floor(random() * powerupTypes.length)];
      const powerupX = px + random() * Math.max(0, pw - 16);
      powerups.push({
        x: Math.max(0, Math.min(powerupX, PLATFORMER_WORLD_WIDTH - 16)),
        y: y - 30,
        width: 16,
        height: 16,
        type: chosen,
        collected: false
      });
    }

    prevPx = px;
    prevPw = pw;

    y -= gapMin + Math.floor(random() * (gapMax - gapMin));
  }

  const lastY = platforms[platforms.length - 1]?.y || PLATFORMER_WORLD_HEIGHT - 140;
  if (lastY - PLATFORMER_FINISH_Y > 110) {
    platforms.push({ x: PLATFORMER_WORLD_WIDTH / 2 - 120, y: PLATFORMER_FINISH_Y + 70, width: 180, height: 14 });
  }

  platforms.push({ x: PLATFORMER_WORLD_WIDTH / 2 - 140, y: PLATFORMER_FINISH_Y, width: 280, height: 16 });
  return { platforms, powerups };
}

function computeResult(hostMove, guestMove) {
  if (hostMove === guestMove) return "tie";
  if (
    (hostMove === "rock" && guestMove === "scissors") ||
    (hostMove === "paper" && guestMove === "rock") ||
    (hostMove === "scissors" && guestMove === "paper")
  ) {
    return "host";
  }
  return "guest";
}

function leaveRoom(roomId, username, socket) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.host === username) {
    if (room.guestId) {
      io.to(room.guestId).emit("room-closed", { reason: "Host left" });
    }
    delete rooms[roomId];
    broadcastRoomList();
    return;
  }

  if (room.guest === username) {
    room.guest = null;
    room.guestId = null;
    room.status = "waiting";
    io.to(room.hostId).emit("room-updated", sanitizeRoom(room));
    broadcastRoomList();
  }
}

function resetPlatformerRound(room) {
  room.roundWinner = null;
  room.positions = {};
}

function closePlatformerRoom(roomId, reason) {
  const room = platformerRooms[roomId];
  if (!room) return;
  Object.values(room.playerIds).forEach((id) => {
    io.to(id).emit("platformer-room-closed", { reason });
  });
  delete platformerRooms[roomId];
  broadcastPlatformerRoomList();
}

function leavePlatformerRoom(roomId, username) {
  const room = platformerRooms[roomId];
  if (!room) return;

  if (room.host === username) {
    closePlatformerRoom(roomId, "Host left the room.");
    return;
  }

  const guestIndex = room.guests.indexOf(username);
  if (guestIndex !== -1) {
    room.guests.splice(guestIndex, 1);
    delete room.playerIds[username];
    room.status = room.guests.length >= 1 ? "ready" : "waiting";
    Object.values(room.playerIds).forEach((id) => {
      io.to(id).emit("platformer-room-updated", sanitizePlatformerRoom(room));
    });
    broadcastPlatformerRoomList();
  }
}

io.on("connection", (socket) => {
  socket.emit("room-list", getRoomList());

  socket.on("get-rooms", () => {
    socket.emit("room-list", getRoomList());
  });

  socket.on("create-room", ({ roomName, username }) => {
    if (!username) {
      socket.emit("room-error", "Login required to create a room.");
      return;
    }

    const roomId = crypto.randomBytes(6).toString("hex");
    rooms[roomId] = {
      roomId,
      roomName: roomName || `${username}'s room`,
      host: username,
      guest: null,
      status: "waiting",
      hostId: socket.id,
      guestId: null,
      hostMove: null,
      guestMove: null
    };

    socket.emit("room-created", sanitizeRoom(rooms[roomId]));
    broadcastRoomList();
  });

  socket.on("join-room", ({ roomId, username }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("room-error", "Room does not exist.");
      return;
    }
    if (room.guest) {
      socket.emit("room-error", "Room is already full.");
      return;
    }
    if (room.host === username) {
      socket.emit("room-error", "You are already the host of this room.");
      return;
    }

    room.guest = username;
    room.guestId = socket.id;
    room.status = "ready";

    socket.emit("room-joined", sanitizeRoom(room));
    io.to(room.hostId).emit("room-updated", sanitizeRoom(room));
    broadcastRoomList();
  });

  socket.on("start-game", ({ roomId, username }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("room-error", "Room not found.");
      return;
    }
    if (room.host !== username) {
      socket.emit("room-error", "Only the host can start the game.");
      return;
    }
    if (!room.guest) {
      socket.emit("room-error", "Wait for another player to join first.");
      return;
    }

    room.status = "playing";
    room.hostMove = null;
    room.guestMove = null;

    io.to(room.hostId).emit("game-started", sanitizeRoom(room));
    io.to(room.guestId).emit("game-started", sanitizeRoom(room));
    broadcastRoomList();
  });

  socket.on("platformer:get-rooms", () => {
    socket.emit("platformer-room-list", getPlatformerRoomList());
  });

  socket.on("platformer:create-room", ({ roomName, username, targetScore }) => {
    if (!username) {
      socket.emit("platformer-room-error", "Login required to create a room.");
      return;
    }

    const roomId = crypto.randomBytes(6).toString("hex");
    const normalizedScore = Number(targetScore) || 7;
    const scoreGoal = Math.min(15, Math.max(5, normalizedScore));

    platformerRooms[roomId] = {
      roomId,
      roomName: roomName || `${username}'s race`,
      host: username,
      guests: [],
      status: "waiting",
      targetScore: scoreGoal,
      scores: { [username]: 0 },
      roundWinner: null,
      playerIds: { [username]: socket.id },
      positions: {}
    };

    socket.emit("platformer-room-created", sanitizePlatformerRoom(platformerRooms[roomId]));
    broadcastPlatformerRoomList();
  });

  socket.on("platformer:join-room", ({ roomId, username }) => {
    const room = platformerRooms[roomId];
    if (!room) {
      socket.emit("platformer-room-error", "Room does not exist.");
      return;
    }
    if (room.guests.length >= 3) {
      socket.emit("platformer-room-error", "Room is already full.");
      return;
    }
    if (room.host === username || room.guests.includes(username)) {
      socket.emit("platformer-room-error", "You are already in this room.");
      return;
    }

    room.guests.push(username);
    room.playerIds[username] = socket.id;
    room.scores[username] = room.scores[username] || 0;
    room.status = "ready";

    socket.emit("platformer-room-joined", sanitizePlatformerRoom(room));
    Object.values(room.playerIds).forEach((id) => {
      io.to(id).emit("platformer-room-updated", sanitizePlatformerRoom(room));
    });
    broadcastPlatformerRoomList();
  });

  socket.on("platformer:start-game", ({ roomId, username }) => {
    const room = platformerRooms[roomId];
    if (!room) {
      socket.emit("platformer-room-error", "Room not found.");
      return;
    }
    if (room.host !== username) {
      socket.emit("platformer-room-error", "Only the host can start the race.");
      return;
    }
    if (room.guests.length < 1) {
      socket.emit("platformer-room-error", "At least one other player must join.");
      return;
    }

    room.status = "playing";
    resetPlatformerRound(room);
    room.platformSeed = crypto.randomBytes(4).toString("hex");
    const level = generatePlatformerLayout(room.platformSeed);
    room.platforms = level.platforms;
    room.powerups = level.powerups;

    const playerNames = [room.host, ...room.guests];
    const scores = playerNames.map((name) => ({ name, score: room.scores?.[name] || 0 }));
    const minScore = Math.min(...scores.map((entry) => entry.score));
    const maxScore = Math.max(...scores.map((entry) => entry.score));
    if (minScore !== maxScore) {
      const losers = scores.filter((entry) => entry.score === minScore).map((entry) => entry.name);
      room.abilityOwner = losers.length === 1 ? losers[0] : null;
    } else {
      room.abilityOwner = null;
    }
    room.abilityType = room.abilityOwner ? 'gun' : null;

    Object.values(room.playerIds).forEach((id) => {
      io.to(id).emit("platformer-game-started", {
        ...sanitizePlatformerRoom(room),
        platforms: room.platforms,
        powerups: room.powerups,
        abilityOwner: room.abilityOwner,
        abilityType: room.abilityType,
        platformSeed: room.platformSeed
      });
    });
    broadcastPlatformerRoomList();
  });

  socket.on("platformer:update-position", ({ roomId, username, position }) => {
    const room = platformerRooms[roomId];
    if (!room || room.status !== "playing") {
      return;
    }
    if (!room.playerIds[username]) {
      return;
    }

    room.positions[username] = position;
    Object.values(room.playerIds).forEach((id) => {
      io.to(id).emit("platformer-position-update", {
        roomId: room.roomId,
        positions: room.positions
      });
    });
  });

  socket.on("platformer:finish-line", ({ roomId, username }) => {
    const room = platformerRooms[roomId];
    if (!room || room.status !== "playing" || room.roundWinner) {
      return;
    }
    if (!room.playerIds[username]) {
      return;
    }

    room.roundWinner = username;
    room.scores[username] = (room.scores[username] || 0) + 1;

    const payload = {
      roomId: room.roomId,
      winner: username,
      scores: room.scores,
      targetScore: room.targetScore
    };

    Object.values(room.playerIds).forEach((id) => {
      io.to(id).emit("platformer-round-ended", payload);
    });

    const hasMatchWinner = room.scores[username] >= room.targetScore;
    if (hasMatchWinner) {
      Object.values(room.playerIds).forEach((id) => {
        io.to(id).emit("platformer-game-over", {
          roomId: room.roomId,
          winner: username,
          scores: room.scores,
          targetScore: room.targetScore
        });
      });
      closePlatformerRoom(roomId, `${username} won the match!`);
      return;
    }

    room.status = "ready";
    Object.values(room.playerIds).forEach((id) => {
      io.to(id).emit("platformer-room-updated", sanitizePlatformerRoom(room));
    });
    broadcastPlatformerRoomList();
  });

  socket.on("platformer:fire-gun", ({ roomId, username, position, angle }) => {
    const room = platformerRooms[roomId];
    if (!room || room.status !== "playing") return;
    if (!room.playerIds[username]) return;
    if (room.abilityOwner !== username) return;

    room.abilityOwner = null;
    room.abilityType = null;

    Object.values(room.playerIds).forEach((id) => {
      io.to(id).emit("platformer-gun-fired", {
        roomId: room.roomId,
        owner: username,
        x: position.x,
        y: position.y,
        angle: typeof angle === 'number' ? angle : 0
      });
    });
  });

  socket.on("platformer:leave-room", ({ roomId, username }) => {
    leavePlatformerRoom(roomId, username);
  });

  socket.on("player-move", ({ roomId, username, choice }) => {
    const room = rooms[roomId];
    if (!room || room.status !== "playing") {
      socket.emit("room-error", "Game is not active.");
      return;
    }
    if (username === room.host) {
      room.hostMove = choice;
    } else if (username === room.guest) {
      room.guestMove = choice;
    } else {
      socket.emit("room-error", "You are not part of this room.");
      return;
    }

    if (room.hostMove && room.guestMove) {
      const result = computeResult(room.hostMove, room.guestMove);
      const winner = result === "tie" ? null : result === "host" ? room.host : room.guest;
      const payload = {
        roomId: room.roomId,
        hostMove: room.hostMove,
        guestMove: room.guestMove,
        winner,
        host: room.host,
        guest: room.guest,
        result
      };

      io.to(room.hostId).emit("round-result", payload);
      io.to(room.guestId).emit("round-result", payload);

      room.hostMove = null;
      room.guestMove = null;
    }
  });

  socket.on("leave-room", ({ roomId, username }) => {
    leaveRoom(roomId, username, socket);
  });

  socket.on("disconnect", () => {
    Object.values(rooms).forEach((room) => {
      if (room.hostId === socket.id) {
        if (room.guestId) {
          io.to(room.guestId).emit("room-closed", { reason: "Host left the room." });
        }
        delete rooms[room.roomId];
        broadcastRoomList();
      } else if (room.guestId === socket.id) {
        room.guest = null;
        room.guestId = null;
        room.status = "waiting";
        io.to(room.hostId).emit("room-updated", sanitizeRoom(room));
        broadcastRoomList();
      }
    });

    Object.values(platformerRooms).forEach((room) => {
      const disconnectedPlayer = Object.entries(room.playerIds).find(([, id]) => id === socket.id);
      if (!disconnectedPlayer) return;

      const [username] = disconnectedPlayer;
      if (room.host === username) {
        closePlatformerRoom(room.roomId, "Host left the room.");
      } else {
        const guestIndex = room.guests.indexOf(username);
        if (guestIndex !== -1) {
          room.guests.splice(guestIndex, 1);
          delete room.playerIds[username];
          room.status = room.guests.length >= 1 ? "ready" : "waiting";
          Object.values(room.playerIds).forEach((id) => {
            io.to(id).emit("platformer-room-updated", sanitizePlatformerRoom(room));
          });
          broadcastPlatformerRoomList();
        }
      }
    });
  });
});

// ================= RESEND SETUP =================
const resend = new Resend(process.env.RESEND_API_KEY);

// ================= EMAIL VALIDATION =================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ================= SIGNUP =================
// ================= SIGNUP =================
app.post("/signup", async (req, res) => {

  try {

    const { username, password, email } = req.body;

    if (!isValidEmail(email)) {
      return res.json({
        success: false,
        message: "Invalid email"
      });
    }

    const existingUser = await collection.findOne({ name: username });

    if (existingUser) {
      return res.json({
        success: false,
        message: "Username already exists"
      });
    }

    const existingEmail = await collection.findOne({ email });

    if (existingEmail) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = crypto.randomBytes(32).toString("hex");

    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await collection.insertOne({
      name: username,
      email,
      password: hashedPassword,
      verificationToken: token,
      tokenExpiresAt,
      verified: false
    });

    const link = `https://shanksco.org/verify?token=${token}`;

    console.log("Attempting to send email...");

    const result = await resend.emails.send({
      from: "Shank's Co <noreply@shanksco.org>",
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Verify Your Account</h2>
        <p>Click below to verify:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    console.log("EMAIL RESULT:");
    console.log(result);

    return res.json({
      success: true,
      message: "Account created successfully"
    });

  } catch (err) {

    console.error("SIGNUP ERROR:");
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

// ================= LOGIN =================
// ================= LOGIN =================
app.post("/login", async (req, res) => {

  try {

    const { username, password, email } = req.body;

    const user = await collection.findOne({ name: username });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.verified) {
      return res.json({
        success: false,
        message: "Verify your email first"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({
        success: false,
        message: "Incorrect password"
      });
    }

    if (user.email !== email) {
      return res.json({
        success: false,
        message: "Incorrect email"
      });
    }

    return res.json({
      success: true
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }

});

// ================= SILK-SONG CLICKER SAVE/LOAD =================
app.post("/api/silksong/save", async (req, res) => {
  try {
    const { username, data } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "Missing username" });
    await collection.updateOne({ name: username }, { $set: { silksong: data } });
    return res.json({ success: true });
  } catch (err) {
    console.error("SAVE SILKSONG ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/silksong/load", async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) return res.status(400).json({ success: false, message: "Missing username" });
    const user = await collection.findOne({ name: username });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.silksong || null });
  } catch (err) {
    console.error("LOAD SILKSONG ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});



app.post("/resend-verification", async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ success: false, message: "Username and email are required." });
    }

    const user = await collection.findOne({ name: username });
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    if (user.email !== email) {
      return res.json({ success: false, message: "Email does not match our records." });
    }

    if (user.verified) {
      return res.json({ success: false, message: "Your email is already verified." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await collection.updateOne(
      { _id: user._id },
      {
        $set: { verificationToken: token, tokenExpiresAt, verified: false }
      }
    );

    const link = `https://shanksco.org/verify?token=${token}`;
    await resend.emails.send({
      from: "Shank's Co <noreply@shanksco.org>",
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Verify Your Account</h2>
        <p>Click below to verify:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    return res.json({ success: true, message: "Verification email resent." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Unable to resend verification email." });
  }
});

// ================= VERIFY LINK =================
app.get("/verify", async (req, res) => {
  const { token } = req.query;

  const user = await collection.findOne({ verificationToken: token });

  if (!user) return res.send("Invalid token");

  if (new Date() > new Date(user.tokenExpiresAt)) {
    return res.send("Token expired. Please sign up again.");
  }

  await collection.updateOne(
    { _id: user._id },
    {
      $set: { verified: true },
      $unset: { verificationToken: "", tokenExpiresAt: "" }
    }
  );
  
  res.send("Email verified successfully. You can now log in.");
});

// ================= CHECK VERIFIED =================
// ================= CHECK VERIFIED =================
app.post("/check-verified", async (req, res) => {
  try {
    
    const { username } = req.body;

    const user = await collection.findOne({ name: username });

    if (!user) {
      return res.json({
        success: false,
        verified: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      verified: user.verified
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      verified: false,
      message: "Server error"
    });
  
  }
});
const port = process.env.PORT || 5000;

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
