require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const userRoutes = require("./routes/users");
const logRoutes = require("./routes/logs");
const settingsRoutes = require("./routes/settings");
const rolesRoutes = require("./routes/roles");
const exportRoutes = require("./routes/export");
const apiRoutes = require("./routes/api");
const { authRequired } = require("./middleware/authMiddleware");

// Pastikan Firebase terinisialisasi di awal
require("./config/firebase").initFirebase();

// Seed default roles
const { seedDefaultRoles } = require("./services/roleService");
seedDefaultRoles().catch(err => console.error("Error seeding roles:", err));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware dasar
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});
app.use(express.json());
app.use(cookieParser());

// Static files
app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));

// View engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Routes public
app.use(authRoutes);

// Proteksi untuk root: redirect ke dashboard jika sudah login
app.get("/", authRequired, (req, res) => {
  res.redirect("/dashboard");
});

// Routes terproteksi
app.use(dashboardRoutes);
app.use(userRoutes);
app.use(logRoutes);
app.use(settingsRoutes);
app.use(rolesRoutes);
app.use(exportRoutes);

// API routes
app.use("/api", apiRoutes);

// Fallback 404
app.use((req, res) => {
  if (req.accepts("html")) {
    return res.status(404).send("Halaman tidak ditemukan");
  }
  res.status(404).json({ error: "Not found" });
});

// Export app untuk serverless function
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

