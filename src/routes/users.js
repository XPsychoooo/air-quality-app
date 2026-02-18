const express = require("express");
const { authRequired, roleRequired } = require("../middleware/authMiddleware");
const { activityLogger } = require("../middleware/logMiddleware");
const { listUsers, createUser, getUserById, updateUser, deleteUser } = require("../services/userService");
const { listRoles } = require("../services/roleService");

const router = express.Router();

// List users
router.get(
  "/users",
  authRequired,
  roleRequired(["SUPER_ADMIN", "ADMIN_TAMBANG"]),
  activityLogger("USER"),
  async (req, res) => {
    try {
      const users = await listUsers();
      const roles = await listRoles();
      res.render("users/index", {
        title: "Manajemen Pengguna",
        user: req.user,
        users,
        roles,
      });
    } catch (err) {
      console.error("Error list users:", err);
      res.status(500).render("users/index", {
        title: "Manajemen Pengguna",
        user: req.user,
        users: [],
        roles: [],
        error: "Gagal memuat pengguna",
      });
    }
  }
);

// Create user
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

// Edit user form
router.get(
  "/users/:id/edit",
  authRequired,
  roleRequired(["SUPER_ADMIN", "ADMIN_TAMBANG"]),
  async (req, res) => {
    try {
      const editUser = await getUserById(req.params.id);
      const roles = await listRoles();
      if (!editUser) return res.status(404).send("Pengguna tidak ditemukan");
      res.render("users/edit", {
        title: "Edit Pengguna",
        user: req.user,
        editUser,
        roles,
      });
    } catch (err) {
      console.error("Error get user:", err);
      res.status(500).send("Gagal memuat pengguna");
    }
  }
);

// Update user
router.post(
  "/users/:id/update",
  authRequired,
  roleRequired(["SUPER_ADMIN", "ADMIN_TAMBANG"]),
  activityLogger("USER"),
  async (req, res) => {
    const { full_name, email, username, phone_number, organization, role, is_active, email_verified, password } = req.body;
    try {
      await updateUser(req.params.id, {
        full_name,
        email,
        username,
        phone_number,
        organization,
        role,
        is_active: is_active === "true",
        email_verified: email_verified === "true",
        password,
      });
      res.redirect("/users");
    } catch (err) {
      console.error("Error update user:", err);
      res.status(500).send("Gagal memperbarui pengguna");
    }
  }
);

// Delete user
router.post(
  "/users/:id/delete",
  authRequired,
  roleRequired(["SUPER_ADMIN"]),
  activityLogger("USER"),
  async (req, res) => {
    try {
      await deleteUser(req.params.id);
      res.redirect("/users");
    } catch (err) {
      console.error("Error delete user:", err);
      res.status(500).send("Gagal menghapus pengguna");
    }
  }
);

module.exports = router;
