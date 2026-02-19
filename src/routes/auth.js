const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { findUserByEmailOrUsername } = require("../services/userService");
const { logActivity } = require("../services/logService");
const { createSession, invalidateSession } = require("../services/sessionService");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("auth/login", { title: "Login", error: null, layout: false });
});

router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await findUserByEmailOrUsername(identifier);
    if (!user || !user.is_active) {
      await logActivity({
        user_id: null,
        action_type: "LOGIN",
        module: "AUTH",
        description: `Login gagal untuk ${identifier}`,
        status: "FAILED",
        ip_address: req.ip,
      });
      return res.status(401).render("auth/login", {
        title: "Login",
        error: "Email/username atau password salah",
        layout: false,
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await logActivity({
        user_id: user.id,
        action_type: "LOGIN",
        module: "AUTH",
        description: "Password salah",
        status: "FAILED",
        ip_address: req.ip,
      });
      return res.status(401).render("auth/login", {
        title: "Login",
        error: "Email/username atau password salah",
        layout: false,
      });
    }

    const expiresInMs = 8 * 60 * 60 * 1000; // 8 hours
    const expires_at = Date.now() + expiresInMs;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "8h" }
    );

    // Save session to database (proposal table: sessions)
    await createSession({
      user_id: user.id,
      token,
      ip_address: req.ip || req.connection?.remoteAddress || "unknown",
      user_agent: req.headers["user-agent"] || null,
      expires_at,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: expiresInMs,
    });

    // Update last_login on user
    const { getDatabase } = require("../config/firebase");
    const db = getDatabase();
    await db.ref(`users/${user.id}`).update({ last_login: Date.now() });

    await logActivity({
      user_id: user.id,
      action_type: "LOGIN",
      module: "AUTH",
      description: "Login berhasil",
      status: "SUCCESS",
      ip_address: req.ip,
    });

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).render("auth/login", {
      title: "Login",
      error: "Terjadi kesalahan server",
      layout: false,
    });
  }
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.token;
  const user = req.user;

  // Invalidate session in database
  if (token) {
    await invalidateSession(token).catch(err => console.error("Error invalidating session:", err));
  }

  res.clearCookie("token");

  if (user) {
    await logActivity({
      user_id: user.id,
      action_type: "LOGOUT",
      module: "AUTH",
      description: "Logout",
      status: "SUCCESS",
      ip_address: req.ip,
    });
  }

  res.redirect("/login");
});

module.exports = router;
