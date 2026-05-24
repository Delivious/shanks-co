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

function sanitizeRoom(room) {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    host: room.host,
    guest: room.guest,
    status: room.status
  };
}

function getRoomList() {
  return Object.values(rooms).map(sanitizeRoom);
}

function broadcastRoomList() {
  io.emit("room-list", getRoomList());
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

    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });

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
