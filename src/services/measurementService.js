const { getDatabase } = require("../config/firebase");

// Node root untuk data pengukuran
const MEASUREMENTS_ROOT = "measurements";

async function saveMeasurement(deviceId, payload) {
  const db = getDatabase();
  const timestamp = payload.timestamp || Date.now();
  const ref = db.ref(`${MEASUREMENTS_ROOT}/${deviceId}/${timestamp}`);

  const data = {
    pm25: payload.pm25,
    pm10: payload.pm10,
    location: payload.location || "Tanjung Selor",
    status: payload.status || computeStatusFromPm25(payload.pm25),
    created_at: timestamp,
  };

  await ref.set(data);
  return { deviceId, timestamp, ...data };
}

function computeStatusFromPm25(pm25) {
  if (pm25 == null) return "UNKNOWN";
  if (pm25 <= 55) return "BAIK";
  if (pm25 <= 150) return "SEDANG";
  return "TIDAK SEHAT";
}

async function getRecentMeasurements({ deviceId, limit = 100 }) {
  const db = getDatabase();
  const ref = db.ref(`${MEASUREMENTS_ROOT}/${deviceId}`);
  const snapshot = await ref
    .orderByKey()
    .limitToLast(limit)
    .get();

  if (!snapshot.exists()) return [];

  const raw = snapshot.val();
  const result = Object.entries(raw).map(([ts, value]) => ({
    timestamp: Number(ts),
    ...value,
  }));

  // urutkan dari paling baru
  result.sort((a, b) => b.timestamp - a.timestamp);
  return result;
}

async function getAggregatedMeasurements({ deviceId, intervalMinutes = 10, points = 24 }) {
  // Contoh agregasi sederhana: ambil N titik terakhir dan hitung rata-rata
  const limit = intervalMinutes * points; // masih sederhana; bisa disesuaikan
  const measurements = await getRecentMeasurements({ deviceId, limit });

  // Untuk kesederhanaan, di sini kita hanya kembalikan data mentah.
  // Agregasi lebih lanjut bisa ditambahkan (average/min/max per bucket waktu).
  return measurements;
}

module.exports = {
  saveMeasurement,
  getRecentMeasurements,
  getAggregatedMeasurements,
  computeStatusFromPm25,
};

