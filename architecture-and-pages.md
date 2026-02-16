## Rancangan Website Monitoring Polusi Udara (Node.js + Firebase)

### 1. Tujuan Sistem
- **Monitoring polusi udara real-time dan historis** di wilayah tambang batu bara Tanjung Selor.
- **Berbasis cloud data** menggunakan Firebase Realtime Database.
- **Backend** menggunakan Node.js + Express sebagai API dan server web.
- **Frontend** berupa dashboard web modern untuk admin/operator/publik.

### 2. Halaman Utama Website

1. **Halaman Login**
   - Form: email / username + password.
   - Validasi kredensial ke backend (simulasi atau terhubung ke Firebase Auth di masa depan).
   - Setelah sukses, redirect ke `Dashboard`.

2. **Dashboard**
   - Ringkasan kualitas udara terkini:
     - Kartu AQI / status kualitas udara (misal: Good / Tidak Sehat) untuk Tanjung Selor.
     - Nilai rata-rata PM2.5 dan PM10 interval terakhir (mis. 10 menit / 1 jam).
   - Grafik tren singkat (line chart) PM2.5 / PM10 beberapa jam terakhir.
   - Informasi lokasi aktif (dropdown lokasi sensor jika multi-lokasi).

3. **Halaman Monitoring Kualitas Udara**
   - Tabel data historis:
     - Kolom: waktu (timestamp), lokasi, PM2.5, PM10, status (Baik / Sedang / Tidak Sehat).
   - Filter:
     - Rentang waktu (hari/jam).
     - Lokasi sensor.
   - Grafik:
     - Grafik garis PM2.5 & PM10 per waktu.

4. **Halaman Manajemen Pengguna**
   - Daftar pengguna (username, email, role, status).
   - Form tambah / edit pengguna (disimulasikan di backend, disimpan ke Firebase di node `users`).
   - Role berbasis proposal:
     - Super Admin, Admin Tambang, Operator, Viewer.

5. **Halaman Log Aktivitas**
   - Tabel log:
     - Waktu, user, modul (AUTH, DASHBOARD, SENSOR, REPORT), aksi (LOGIN, VIEW, CREATE, UPDATE, DELETE), status (SUCCESS/FAILED).
   - Data diambil dari node `activity_logs` pada Firebase.

6. **Halaman Settings (opsional/minimal)**
   - Placeholder untuk pengaturan dasar (misalnya: zona waktu, interval agregasi).

### 3. Arsitektur Teknis

#### 3.1 Stack Utama
- **Backend**: Node.js + Express.
- **View engine**: EJS (server-side rendering, mudah di-deploy).
- **Database cloud**: Firebase Realtime Database.
- **Autentikasi**: Untuk contoh dasar, autentikasi JWT sederhana di backend dengan penyimpanan user di Firebase node `users`. (Bisa diganti / diintegrasikan dengan Firebase Auth jika diperlukan).

#### 3.2 Struktur Direktori Proyek

```text
air-quality-monitoring-node/
  package.json
  README.md
  .env (tidak dikomit, berisi konfigurasi Firebase dan JWT secret)
  src/
    app.js                # Entry Express
    config/
      firebase.js         # Inisialisasi Firebase Admin SDK
    routes/
      auth.js             # Login/logout
      dashboard.js        # Dashboard & monitoring view
      users.js            # Manajemen pengguna
      logs.js             # Activity logs
      api.js              # Endpoint REST (misal /api/measurements)
    middleware/
      authMiddleware.js   # Cek JWT & role
      logMiddleware.js    # Catat aktivitas ke Firebase
    services/
      measurementService.js # Query & agregasi data kualitas udara
      userService.js         # CRUD user
      logService.js          # Simpan dan baca activity logs
    views/
      layouts/
        main.ejs          # Layout dasar
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
        style.css         # Tema biru modern sesuai proposal
      js/
        charts.js         # Inisialisasi grafik (Chart.js atau sejenis)
```

#### 3.3 Model Data di Firebase Realtime Database (NoSQL)

Root node kira-kira:

```json
{
  "users": {
    "<userId>": {
      "email": "...",
      "username": "...",
      "role": "ADMIN_TAMBANG",
      "full_name": "...",
      "is_active": true,
      "created_at": 1739412345678
    }
  },
  "measurements": {
    "<deviceId>": {
      "<timestampEpoch>": {
        "pm25": 35.2,
        "pm10": 50.1,
        "location": "Tanjung Selor",
        "status": "BAIK"
      }
    }
  },
  "activity_logs": {
    "<logId>": {
      "user_id": "<userId>",
      "action_type": "LOGIN",
      "module": "AUTH",
      "description": "User login berhasil",
      "status": "SUCCESS",
      "ip_address": "127.0.0.1",
      "created_at": 1739412345678
    }
  },
  "api_keys": {
    "<apiKeyId>": {
      "user_id": "<userId>",
      "key_name": "Sensor Tanjung Selor",
      "api_key_hash": "...",
      "permissions": {
        "can_publish_measurement": true
      },
      "is_active": true
    }
  }
}
```

Struktur ini mengikuti konsep tabel `Users`, `Activity_Logs`, `API_Keys`, dan log data kualitas udara dari proposal, tetapi disesuaikan dengan bentuk JSON tree Firebase.

### 4. Alur Utama Sistem (Disederhanakan)

1. **Sensor/Publisher** mengirim data kualitas udara ke backend (misalnya HTTP POST ke `/api/measurements`).
2. **Backend (Express)**:
   - Validasi API key / token.
   - Simpan data ke node `measurements` di Firebase.
3. **Backend (job periodik sederhana)**:
   - Melakukan agregasi per interval (mis. per 10 menit) untuk Dashboard.
4. **Website (User via browser)**:
   - Login ke sistem (`/login`).
   - Akses `Dashboard` untuk melihat ringkasan kualitas udara.
   - Akses `Monitoring` untuk melihat detail historis dan grafik.
   - Admin dapat mengelola `Users` dan melihat `Activity Logs`.

### 5. Desain UI Singkat

- **Tema warna**: Biru tua pada sidebar + aksen hijau/biru gradasi pada card AQI, latar utama putih.
- **Layout utama**:
  - Sidebar kiri: logo/nama sistem + menu `Dashboard`, `Monitoring Data`, `User Management`, `Activity Logs`, `Settings`.
  - Header atas: judul halaman, user info (nama, role, tombol logout).
  - Konten: card ringkasan + grafik + tabel sesuai halaman.

