const express = require("express");
const { authRequired, roleRequired } = require("../middleware/authMiddleware");
const { activityLogger } = require("../middleware/logMiddleware");
const {
    listSessions,
    invalidateSession,
    deleteSession,
    cleanExpiredSessions,
    getSessionById,
} = require("../services/sessionService");
const { listUsers } = require("../services/userService");

const router = express.Router();

// List all sessions
router.get(
    "/sessions",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    activityLogger("SESSION"),
    async (req, res) => {
        try {
            const sessions = await listSessions();
            const users = await listUsers();

            // Map user_id to full_name for display
            const userMap = {};
            users.forEach(u => { userMap[u.id] = u.full_name || u.username; });

            const enrichedSessions = sessions
                .sort((a, b) => (b.last_activity || 0) - (a.last_activity || 0))
                .map(s => ({
                    ...s,
                    user_name: userMap[s.user_id] || s.user_id?.substring(0, 8) + "...",
                }));

            res.render("sessions/index", {
                title: "Manajemen Sesi",
                user: req.user,
                sessions: enrichedSessions,
            });
        } catch (err) {
            console.error("Error list sessions:", err);
            res.status(500).render("sessions/index", {
                title: "Manajemen Sesi",
                user: req.user,
                sessions: [],
                error: "Gagal memuat data sesi",
            });
        }
    }
);

// Force logout / invalidate a session
router.post(
    "/sessions/:id/invalidate",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    activityLogger("SESSION"),
    async (req, res) => {
        try {
            const session = await getSessionById(req.params.id);
            if (session && session.token) {
                await invalidateSession(session.token);
            }
            res.redirect("/sessions");
        } catch (err) {
            console.error("Error invalidate session:", err);
            res.status(500).send("Gagal menginvalidasi sesi");
        }
    }
);

// Delete a session permanently
router.post(
    "/sessions/:id/delete",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    activityLogger("SESSION"),
    async (req, res) => {
        try {
            await deleteSession(req.params.id);
            res.redirect("/sessions");
        } catch (err) {
            console.error("Error delete session:", err);
            res.status(500).send("Gagal menghapus sesi");
        }
    }
);

// Clean all expired sessions
router.post(
    "/sessions/clean-expired",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    activityLogger("SESSION"),
    async (req, res) => {
        try {
            const cleaned = await cleanExpiredSessions();
            console.log(`Cleaned ${cleaned} expired sessions`);
            res.redirect("/sessions");
        } catch (err) {
            console.error("Error cleaning sessions:", err);
            res.status(500).send("Gagal membersihkan sesi expired");
        }
    }
);

module.exports = router;
