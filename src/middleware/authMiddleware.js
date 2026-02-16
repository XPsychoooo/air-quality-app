const jwt = require("jsonwebtoken");

// Middleware untuk memeriksa JWT pada cookie / header
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

