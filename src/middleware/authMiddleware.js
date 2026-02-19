const jwt = require("jsonwebtoken");
const { getSessionByToken, updateLastActivity } = require("../services/sessionService");

// Middleware untuk memeriksa JWT pada cookie / header + validate session
function authRequired(req, res, next) {
  const token =
    req.cookies?.token ||
    req.headers["authorization"]?.replace("Bearer ", "") ||
    null;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = payload;
    res.locals.user = payload;

    // Validate session in database and update last_activity (async, non-blocking)
    getSessionByToken(token)
      .then(session => {
        if (session) {
          // Check if session is expired
          if (session.expires_at && session.expires_at < Date.now()) {
            return; // expired, will be cleaned up by cleanExpiredSessions
          }
          updateLastActivity(session.session_id).catch(() => { });
        }
      })
      .catch(() => { });

    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.redirect("/login");
  }
}

// Middleware untuk membatasi akses berdasarkan role
function roleRequired(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect("/login");
    }
    if (allowedRoles.length === 0) {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).send("Akses ditolak");
    }
    next();
  };
}

module.exports = {
  authRequired,
  roleRequired,
};
