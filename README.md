# Website Monitoring Polusi Udara – Node.js + Firebase

Website ini dibangun berdasarkan proposal **“Perancangan Website Monitoring Polusi Udara di Wilayah Tambang Batu Bara Berbasis Cloud Data (Studi Kasus: Tanjung Selor)”**.

Backend menggunakan **Node.js + Express**, penyimpanan data di **Firebase Realtime Database**, dan tampilan dashboard menggunakan **EJS** dengan tema biru modern.

## 1. Fitur Utama

- **Login pengguna** (email/username + password, JWT di cookie).
- **Dashboard**:
  - Ringkasan PM2.5, PM10, dan status kualitas udara (BAIK/SEDANG/TIDAK SEHAT).
  - Grafik tren PM2.5 dan PM10.
- **Monitoring Data**:
  - Tabel data historis kualitas udara (timestamp, lokasi, PM2.5, PM10, status).
- **Manajemen Pengguna**:
  - Tabel daftar pengguna.
  - Form tambah pengguna dengan role: `SUPER_ADMIN`, `ADMIN_TAMBANG`, `OPERATOR`, `VIEWER`.
- **Activity Logs**:
  - Tabel log aktivitas (LOGIN, LOGOUT, akses modul, dll).
- **API untuk sensor**:
  - `POST /api/measurements` – menerima data dari sensor/publisher dan menyimpan ke Firebase Realtime Database.

## 2. Struktur Proyek

```text
air-quality-monitoring-node/
  package.json
  .env                      # tidak dikomit – untuk konfigurasi rahasia
  architecture-and-pages.md # dokumen rancangan dari proposal
  src/
    app.js
    config/
      firebase.js
    middleware/
      authMiddleware.js
      logMiddleware.js
    services/
      measurementService.js
      userService.js
      logService.js
    routes/
      auth.js
      dashboard.js
      users.js
      logs.js
      api.js
    views/
      layouts/
        main.ejs
      auth/
        login.ejs
      dashboard/
        index.ejs
        monitoring.ejs
      users/
        index.ejs
      logs/
        index.ejs
    public/
      css/
        style.css
```

## 3. Persiapan Firebase Realtime Database

1. Buat project di **Firebase Console**.
2. Aktifkan **Realtime Database** dan pilih mode rules yang sesuai (untuk produksi gunakan rules yang ketat).
3. Buat **Service Account** untuk **Firebase Admin SDK**:
   - Buka: *Project Settings* → *Service accounts* → *Generate new private key*.
   - Simpan file JSON tersebut di luar repo (misalnya `serviceAccountKey.json` di root proyek, tetapi jangan dikomit).

## 4. Konfigurasi Environment (`.env`)

Buat file `.env` di root proyek:

```env
PORT=3000
JWT_SECRET=ubah_ini_ke_string_yang_sulit

# Opsi 1: gunakan path file service account
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://<project-id>-default-rtdb.firebaseio.com

# Atau Opsi 2: langsung dari variabel environment (jika tidak pakai path)
# FIREBASE_PROJECT_ID=...
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> **Penting**: Jangan pernah meng-commit file kredensial Firebase atau isi private key ke repository publik.

## 5. Instalasi & Menjalankan Proyek

Di folder `air-quality-monitoring-node`:

```bash
npm install
npm run dev   # untuk pengembangan (nodemon)
# atau
npm start     # menjalankan sekali
```

Akses website di `http://localhost:3000`.

## 6. Data Awal (Seeding Sederhana)

Untuk bisa login pertama kali, Anda perlu menambahkan user awal ke node `users` di Firebase Realtime Database secara manual atau dengan script tambahan (misalnya menggunakan Node.js satu kali) yang:

1. Membuat user dengan field:
   - `email`
   - `username`
   - `password_hash` (hash bcrypt, **bukan** password asli)
   - `full_name`
   - `role` (misal: `SUPER_ADMIN`)
   - `is_active` (true)
2. Setelah itu Anda dapat login melalui `/login`.

Contoh paling sederhana (pseudo):

```js
// gunakan fungsi createUser di src/services/userService.js dalam script terpisah
```

## 7. Format Data Sensor ke Endpoint `/api/measurements`

Endpoint: `POST /api/measurements`

Header:

- `Content-Type: application/json`
- `X-API-Key: <api-key-anda>`

Body JSON:

```json
{
  "deviceId": "tanjung-selor-device-1",
  "pm25": 42.5,
  "pm10": 67.8,
  "location": "Tanjung Selor",
  "timestamp": 1739420000000
}
```

Respons sukses:

```json
{
  "success": true,
  "data": {
    "deviceId": "tanjung-selor-device-1",
    "timestamp": 1739420000000,
    "pm25": 42.5,
    "pm10": 67.8,
    "location": "Tanjung Selor",
    "status": "SEDANG",
    "created_at": 1739420000000
  }
}
```

## 8. Catatan Pengembangan Lanjutan

- **RBAC lengkap & API Key**: di `routes/api.js` masih terdapat TODO untuk validasi API key terhadap node `api_keys` di Firebase, bisa dikembangkan sesuai tabel `API_Keys` di proposal.
- **Agregasi data**: saat ini agregasi di `measurementService.js` masih sederhana. Untuk mengikuti proposal sepenuhnya, bisa ditambah perhitungan rata-rata / maksimum / minimum per interval 10 menit dan perbandingan baku mutu PP No. 22 Tahun 2021.
- **Integrasi Telegram Bot**: dapat ditambahkan modul baru yang membaca data dari Firebase dan mengirimkan alert ke Telegram jika PM2.5 > 55 μg/m³ dalam 24 jam.

