const express = require("express");
const { authRequired } = require("../middleware/authMiddleware");
const { activityLogger } = require("../middleware/logMiddleware");
const {
  getAggregatedMeasurements,
} = require("../services/measurementService");

const router = express.Router();

router.get(
  ["/", "/dashboard"],
  authRequired,
  activityLogger("DASHBOARD"),
  async (req, res) => {
    const deviceId = req.query.deviceId || "tanjung-selor-device-1";

    try {
      const data = await getAggregatedMeasurements({
        deviceId,
        intervalMinutes: 10,
        points: 24,
      });

      const latest = data[0] || null;

      res.render("dashboard/index", {
        title: "Dashboard",
        user: req.user,
        deviceId,
        latest,
        measurements: data.slice(0, 50),
      });
    } catch (err) {
      console.error("Error dashboard:", err);
      res.status(500).render("dashboard/index", {
        title: "Dashboard",
        user: req.user,
        deviceId,
        latest: null,
        measurements: [],
        error: "Gagal memuat data",
      });
    }
  }
);

router.get(
  "/monitoring",
  authRequired,
  activityLogger("SENSOR"),
  async (req, res) => {
    const deviceId = req.query.deviceId || "tanjung-selor-device-1";

    try {
      const data = await getAggregatedMeasurements({
        deviceId,
        intervalMinutes: 10,
        points: 144,
      });

      res.render("dashboard/monitoring", {
        title: "Monitoring Data",
        user: req.user,
        deviceId,
        measurements: data,
      });
    } catch (err) {
      console.error("Error monitoring:", err);
      res.status(500).render("dashboard/monitoring", {
        title: "Monitoring Data",
        user: req.user,
        deviceId,
        measurements: [],
        error: "Gagal memuat data",
      });
    }
  }
);

module.exports = router;

