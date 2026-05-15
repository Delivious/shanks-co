import express from "express";
import path from "path";
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

// ================= RESEND SETUP =================
const resend = new Resend(process.env.RESEND_API_KEY);

// ================= EMAIL VALIDATION =================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;

  if (!isValidEmail(email)) {
    return res.redirect("/MainWeb/LoginPages/invalidEmail.html");
  }

  const existingUser = await collection.findOne({ name: username });
  if (existingUser) {
    return res.redirect("/MainWeb/LoginPages/existingUsername.html");
  }

  const existingEmail = await collection.findOne({ email });
  if (existingEmail) {
    return res.redirect("/MainWeb/LoginPages/existingEmail.html");
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

  try {
    const result = await resend.emails.send({
      from: "Shank's Co <onboarding@resend.dev>",
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Verify Your Account</h2>
        <p>Click below to verify:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    console.log("Email sent:", result);

  } catch (err) {
    console.error("EMAIL FAILED:", err);

    return res.json({
      success: false,
      message: "Email failed to send"
    });
  }

  return res.json({
    success: true,
    email,
    token
  });
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
