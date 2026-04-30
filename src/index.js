import express from "express";
import path from "path";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import collection from "./config.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";

const app = express();
app.use(cors({
  origin: "https://shanksco.org",
  methods: ["GET", "POST"],
  credentials: true
}));
// __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..")));

// email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  family: 4
});
transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP ERROR:", err);
  } else {
    console.log("SMTP READY");
  }
});
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;

  if (!isValidEmail(email)) {
    return res.json({ success: false, message: "Invalid email" });
  }

  const existingUser = await collection.findOne({ name: username });
  if (existingUser) {
    return res.json({ success: false, message: "Username exists" });
  }

  const existingEmail = await collection.findOne({ email });
  if (existingEmail) {
    return res.json({ success: false, message: "Email exists" });
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

  // SEND EMAIL
  const link = `https://shanksco.org/verify?token=${token}`;

  try {
  await transporter.sendMail({
    from: `"Shank's Co" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Verify your account</h2>
      <a href="${link}">Verify Email</a>
    `
  });
  

  console.log("Email sent successfully");
}catch (err) {
  console.error("❌ EMAIL ERROR FULL:", err);
  console.error("CODE:", err.code);
  console.error("RESPONSE:", err.response);
  console.error("COMMAND:", err.command);

  return res.json({
    success: false,
    message: `Email failed to send: ${err.message}`
  });
}

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

  if (!user) return res.json({ success: false, message: "User not found" });
  if (!user.verified) {
    return res.json({
      success: false,
      message: "Email not verified"
    });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ success: false, message: "Wrong password" });

  if (user.email !== email) {
    return res.json({ success: false, message: "Wrong email" });
  }

  return res.json({ success: true });
});

// ================= VERIFY PAGE LINK =================
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

  res.send("Email verified successfully! You can now log in.");
});

// ================= CHECK VERIFIED =================
app.post("/check-verified", async (req, res) => {
  const { username } = req.body;

  const user = await collection.findOne({ name: username });

  if (!user) return res.json({ verified: false });

  return res.json({ verified: user.verified });
});

// ================= SERVER =================
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});