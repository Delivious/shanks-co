import express from "express";
import path from "path";
import bcrypt from "bcrypt";
import crypto from "crypto";
import collection from "./config.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const app = express();

// __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..")));

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.redirect("/MainWeb/LoginPages/logIn.html");
});

app.get("/signup", (req, res) => {
  res.redirect("/MainWeb/LoginPages/signUp.html");
});

// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;

  // Validate email format
  if (!isValidEmail(email)) {
    return res.json({
      success: false,
      message: "Invalid email format"
    });
  }

  // Check username
  const existingUser = await collection.findOne({ name: username });
  if (existingUser) {
    return res.json({
      success: false,
      message: "Username already exists"
    });
  }

  // Check email
  const existingEmail = await collection.findOne({ email });
  if (existingEmail) {
    return res.json({
      success: false,
      message: "Email already in use"
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate verification token
  const token = crypto.randomBytes(32).toString("hex");

  // Expiration (15 minutes)
  const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Save user
  await collection.insertOne({
    name: username,
    email,
    password: hashedPassword,
    verificationToken: token,
    tokenExpiresAt,
    verified: false,
    createdAt: new Date()
  });

  // ✅ RETURN CLEAN RESPONSE
  return res.json({
    success: true,
    email,
    token
  });
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { username, password, email } = req.body;

  const user = await collection.findOne({ name: username });

  if (!user) return res.send("User not found");

  // 🚫 BLOCK UNVERIFIED USERS
  if (!user.verified) {
    return res.send("Please verify your email before logging in.");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("Wrong password");

  if (user.email !== email) return res.send("Wrong email");

  res.redirect("/index.html");
});

// ================= VERIFY EMAIL (backend check) =================
app.post("/verify-email", async (req, res) => {
  const { username, email } = req.body;

  const user = await collection.findOne({ name: username });

  if (!user) {
    return res.json({ valid: false, message: "User not found" });
  }

  if (user.verified) {
    return res.json({ valid: true, message: "Already verified" });
  }

  // ⏰ EXPIRED TOKEN CHECK
  if (user.tokenExpiresAt && new Date() > new Date(user.tokenExpiresAt)) {
    return res.json({
      valid: false,
      message: "Verification expired. Please sign up again."
    });
  }

  if (user.email !== email) {
    return res.json({ valid: false, message: "Email mismatch" });
  }

  return res.json({ valid: true, message: "Email verified" });
});

// ================= ACTUAL TOKEN VERIFICATION =================
app.get("/verify", async (req, res) => {
  const { token } = req.query;

  const user = await collection.findOne({ verificationToken: token });

  if (!user) {
    return res.send("Invalid token");
  }

  // ⏰ EXPIRED CHECK
  if (user.tokenExpiresAt && new Date() > new Date(user.tokenExpiresAt)) {
    return res.send("This verification link has expired. Please register again.");
  }

  await collection.updateOne(
    { _id: user._id },
    {
      $set: { verified: true },
      $unset: {
        verificationToken: "",
        tokenExpiresAt: ""
      }
    }
  );

  res.send("Email verified successfully! You can now log in.");
});
// ================= SERVER =================
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
app.post("/check-verified", async (req, res) => {
  const { username } = req.body;

  const user = await collection.findOne({ name: username });

  if (!user) {
    return res.json({ verified: false });
  }

  return res.json({ verified: user.verified });
});