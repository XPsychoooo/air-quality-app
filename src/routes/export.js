const express = require("express");
const { authRequired, roleRequired } = require("../middleware/authMiddleware");
const { activityLogger } = require("../middleware/logMiddleware");
const { getRecentMeasurements } = require("../services/measurementService");

const router = express.Router();

// Export monitoring data as CSV
router.get(
    "/export/monitoring",
    authRequired,
    roleRequired(["SUPER_ADMIN", "ADMIN_TAMBANG"]),
    activityLogger("EXPORT"),
    async (req, res) => {
        const deviceId = req.query.deviceId || "tanjung-selor-device-1";
        const limit = parseInt(req.query.limit) || 500;

        try {
            const data = await getRecentMeasurements({ deviceId, limit });

            // Build CSV
            const headers = ["Timestamp", "Tanggal", "Waktu", "Lokasi", "PM2.5 (μg/m³)", "PM10 (μg/m³)", "Status"];
            const rows = data.map(d => {
                const date = new Date(d.timestamp);
                return [
                    d.timestamp,
                    date.toLocaleDateString("id-ID"),
                    date.toLocaleTimeString("id-ID"),
                    `"${d.location || 'Tanjung Selor'}"`,
                    d.pm25 != null ? d.pm25 : "",
                    d.pm10 != null ? d.pm10 : "",
                    d.status || ""
                ].join(",");
            });

            const csv = [headers.join(","), ...rows].join("\n");

            const filename = `monitoring_${deviceId}_${new Date().toISOString().slice(0, 10)}.csv`;
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.send("\uFEFF" + csv); // BOM for Excel UTF-8 support
        } catch (err) {
            console.error("Error export:", err);
            res.status(500).send("Gagal mengekspor data");
        }
    }
);

// Export users as CSV
router.get(
    "/export/users",
    authRequired,
    roleRequired(["SUPER_ADMIN"]),
    activityLogger("EXPORT"),
    async (req, res) => {
        const { listUsers } = require("../services/userService");
        try {
            const users = await listUsers();

            const headers = ["ID", "Nama Lengkap", "Email", "Username", "Phone", "Organisasi", "Role", "Status", "Email Verified", "Dibuat"];
            const rows = users.map(u => [
                u.id,
                `"${u.full_name || ''}"`,
                u.email,
                u.username,
                u.phone_number || "",
                `"${u.organization || ''}"`,
                u.role,
                u.is_active ? "Aktif" : "Nonaktif",
                u.email_verified ? "Verified" : "Belum",
                u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : ""
            ].join(","));

            const csv = [headers.join(","), ...rows].join("\n");

            const filename = `users_${new Date().toISOString().slice(0, 10)}.csv`;
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.send("\uFEFF" + csv);
        } catch (err) {
            console.error("Error export users:", err);
            res.status(500).send("Gagal mengekspor data pengguna");
        }
    }
);

module.exports = router;
