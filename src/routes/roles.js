const express = require("express");
const { authRequired, roleRequired } = require("../middleware/authMiddleware");
const { activityLogger } = require("../middleware/logMiddleware");
const { listRoles, createRole } = require("../services/roleService");

const router = express.Router();

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

module.exports = router;
