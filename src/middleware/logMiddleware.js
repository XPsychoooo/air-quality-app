const { logActivity } = require("../services/logService");

// Middleware sederhana untuk mencatat aktivitas penting
function activityLogger(moduleName) {
  return async (req, res, next) => {
    res.on("finish", async () => {
      try {
        const userId = req.user?.id || null;
        const status = res.statusCode >= 200 && res.statusCode < 400 ? "SUCCESS" : "FAILED";
        const actionType = req.method;

        await logActivity({
          user_id: userId,
          action_type: actionType,
          module: moduleName,
          description: `${req.method} ${req.originalUrl}`,
          status,
          ip_address: req.ip,
          metadata: {
            statusCode: res.statusCode,
          },
        });
      } catch (err) {
        console.error("Gagal mencatat activity log:", err.message);
      }
    });

    next();
  };
}

module.exports = {
  activityLogger,
};

