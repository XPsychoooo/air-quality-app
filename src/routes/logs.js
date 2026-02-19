const express = require("express");
const { authRequired, roleRequired } = require("../middleware/authMiddleware");
const { activityLogger } = require("../middleware/logMiddleware");
const { listLogs } = require("../services/logService");
const { listUsers } = require("../services/userService");

const router = express.Router();

router.get(
  "/logs",
  authRequired,
  roleRequired(["SUPER_ADMIN", "ADMIN_TAMBANG"]),
  activityLogger("LOGS"),
  async (req, res) => {
    try {
      const logs = await listLogs(200);
      const users = await listUsers();

      // Create a map of user_id -> full_name/username
      const userMap = {};
      users.forEach(u => {
        userMap[u.id] = u.full_name || u.username;
      });

      // Enrich logs with user_name
      const enrichedLogs = logs.map(log => ({
        ...log,
        user_name: log.user_id ? (userMap[log.user_id] || log.user_id) : 'System/Guest'
      }));

      res.render("logs/index", {
        title: "Activity Logs",
        user: req.user,
        logs: enrichedLogs,
      });
    } catch (err) {
      console.error("Error list logs:", err);
      res.status(500).render("logs/index", {
        title: "Activity Logs",
        user: req.user,
        logs: [],
        error: "Gagal memuat logs",
      });
    }
  }
);

module.exports = router;
