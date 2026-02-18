const express = require("express");
const { authRequired, roleRequired } = require("../middleware/authMiddleware");
const { activityLogger } = require("../middleware/logMiddleware");
const { listUsers, createUser } = require("../services/userService");

const router = express.Router();

router.get(
  "/users",
  authRequired,
  roleRequired(["SUPER_ADMIN", "ADMIN_TAMBANG"]),
  activityLogger("USER"),
  async (req, res) => {
    try {
      const users = await listUsers();
      res.render("users/index", {
        title: "Manajemen Pengguna",
        user: req.user,
        users,
      });
    } catch (err) {
      console.error("Error list users:", err);
      res.status(500).render("users/index", {
        title: "Manajemen Pengguna",
        user: req.user,
        users: [],
        error: "Gagal memuat pengguna",
      });
    }
  }
);

router.post(
  "/users",
  authRequired,
  roleRequired(["SUPER_ADMIN", "ADMIN_TAMBANG"]),
  activityLogger("USER"),
  async (req, res) => {
    const { email, username, full_name, password, role, phone_number, organization } = req.body;

    try {
      await createUser({ email, username, full_name, password, role, phone_number, organization });
      res.redirect("/users");
    } catch (err) {
      console.error("Error create user:", err);
      res.status(500).send("Gagal membuat pengguna");
    }
  }
);

module.exports = router;

