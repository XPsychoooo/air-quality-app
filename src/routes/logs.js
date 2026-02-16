const express = require("express");
const { authRequired, roleRequired } = require("../middleware/authMiddleware");
const { activityLogger } = require("../middleware/logMiddleware");
const { listLogs } = require("../services/logService");

const router = express.Router();

router.get(
  "/logs",
  authRequired,
  roleRequired(["SUPER_ADMIN", "ADMIN_TAMBANG"]),
  activityLogger("LOGS"),
  async (req, res) => {
    try {
      const logs = await listLogs(200);
      res.render("logs/index", {
        title: "Activity Logs",
        user: req.user,
        logs,
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

