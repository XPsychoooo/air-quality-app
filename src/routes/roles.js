const express = require("express");
const { authRequired, roleRequired } = require("../middleware/authMiddleware");
const { activityLogger } = require("../middleware/logMiddleware");
const { listRoles, createRole, getRoleById, updateRole, deleteRole } = require("../services/roleService");

const router = express.Router();

// List roles
router.get(
    "/roles",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    activityLogger("ROLE"),
    async (req, res) => {
        try {
            const roles = await listRoles();
            res.render("roles/index", {
                title: "Manajemen Role",
                user: req.user,
                roles,
            });
        } catch (err) {
            console.error("Error list roles:", err);
            res.status(500).render("roles/index", {
                title: "Manajemen Role",
                user: req.user,
                roles: [],
                error: "Gagal memuat data role",
            });
        }
    }
);

// Create role
router.post(
    "/roles",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    activityLogger("ROLE"),
    async (req, res) => {
        const { role_name, description, permissions } = req.body;
        try {
            await createRole({ role_name, description, permissions });
            res.redirect("/roles");
        } catch (err) {
            console.error("Error create role:", err);
            res.status(500).send("Gagal membuat role");
        }
    }
);

// Edit role form
router.get(
    "/roles/:id/edit",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    async (req, res) => {
        try {
            const editRole = await getRoleById(req.params.id);
            if (!editRole) return res.status(404).send("Role tidak ditemukan");
            res.render("roles/edit", {
                title: "Edit Role",
                user: req.user,
                editRole,
            });
        } catch (err) {
            console.error("Error get role:", err);
            res.status(500).send("Gagal memuat role");
        }
    }
);

// Update role
router.post(
    "/roles/:id/update",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    activityLogger("ROLE"),
    async (req, res) => {
        const { role_name, description, permissions } = req.body;
        try {
            await updateRole(req.params.id, { role_name, description, permissions });
            res.redirect("/roles");
        } catch (err) {
            console.error("Error update role:", err);
            res.status(500).send("Gagal memperbarui role");
        }
    }
);

// Delete role
router.post(
    "/roles/:id/delete",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    activityLogger("ROLE"),
    async (req, res) => {
        try {
            await deleteRole(req.params.id);
            res.redirect("/roles");
        } catch (err) {
            console.error("Error delete role:", err);
            res.status(500).send("Gagal menghapus role");
        }
    }
);

module.exports = router;
