/**
 * Script untuk menambahkan data dummy pengukuran kualitas udara ke Firebase.
 * Jalankan: node scripts/seed-dummy-measurements.js
 */

require("dotenv").config();
const { initFirebase, getDatabase } = require("../src/config/firebase");

const DEVICE_ID = "tanjung-selor-device-1";
const MEASUREMENTS_ROOT = "measurements";

function computeStatus(pm25) {
  if (pm25 <= 55) return "BAIK";
  if (pm25 <= 150) return "SEDANG";
  return "TIDAK SEHAT";
}

function randomInRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

async function seedDummyMeasurements() {
  console.log("Inisialisasi Firebase...");
  initFirebase();
  const db = getDatabase();

  // Generate data untuk 48 jam terakhir (setiap 10 menit = 288 titik)
  const now = Date.now();
  const TEN_MIN = 10 * 60 * 1000;
  const measurements = [];

  for (let i = 0; i < 144; i++) {
    const timestamp = now - i * TEN_MIN;
    // Variasi PM2.5: 15-80 (kadang BAIK, kadang SEDANG)
    const pm25 = randomInRange(15, 80);
    // PM10 biasanya lebih tinggi dari PM2.5
    const pm10 = randomInRange(pm25 + 5, pm25 + 40);
    const status = computeStatus(pm25);

    measurements.push({
      timestamp,
      data: {
        pm25,
        pm10,
        location: "Tanjung Selor",
        status,
        created_at: timestamp,
      },
    });
  }

  console.log(`Menambahkan ${measurements.length} data dummy ke Firebase...`);

  const ref = db.ref(MEASUREMENTS_ROOT).child(DEVICE_ID);
  const updates = {};
  for (const { timestamp, data } of measurements) {
    updates[String(timestamp)] = data;
  }

  await ref.update(updates);

  console.log("✓ Data dummy berhasil ditambahkan!");
  console.log(`  Device: ${DEVICE_ID}`);
  console.log(`  Jumlah: ${measurements.length} pengukuran`);
  console.log(`  Rentang waktu: ~24 jam terakhir`);
  console.log("\nRefresh halaman Dashboard untuk melihat data.");
  process.exit(0);
}

seedDummyMeasurements().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
