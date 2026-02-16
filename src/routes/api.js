const express = require("express");
const { saveMeasurement } = require("../services/measurementService");

const router = express.Router();

// Endpoint untuk menerima data dari sensor / publisher
router.post("/measurements", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  // TODO: validasi apiKey terhadap node api_keys di Firebase

  if (!apiKey) {
    return res.status(401).json({ error: "API key diperlukan" });
  }

  const { deviceId, pm25, pm10, location, timestamp } = req.body;

  if (!deviceId || pm25 == null || pm10 == null) {
    return res
      .status(400)
      .json({ error: "deviceId, pm25, dan pm10 wajib diisi" });
  }

  try {
    const saved = await saveMeasurement(deviceId, {
      pm25,
      pm10,
      location,
      timestamp,
    });
    res.json({ success: true, data: saved });
  } catch (err) {
    console.error("Error save measurement:", err);
    res.status(500).json({ error: "Gagal menyimpan data" });
  }
});

module.exports = router;

