const admin = require("firebase-admin");
const path = require("path");

// Inisialisasi Firebase Admin SDK
// Catatan: Jangan menyimpan kredensial service account di repo.
// Gunakan variabel lingkungan untuk path file JSON atau isi credential.

function initFirebase() {
  if (admin.apps.length) {
    return admin.app();
  }

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_DATABASE_URL,
    FIREBASE_SERVICE_ACCOUNT_PATH,
  } = process.env;

  let credential;

  if (FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Opsi 1: gunakan path ke file service account JSON
    // misalnya diset di .env: FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
    const serviceAccount = require(path.resolve(
      process.cwd(),
      FIREBASE_SERVICE_ACCOUNT_PATH
    ));
    credential = admin.credential.cert(serviceAccount);
  } else if (
    FIREBASE_PROJECT_ID &&
    FIREBASE_CLIENT_EMAIL &&
    FIREBASE_PRIVATE_KEY
  ) {
    // Opsi 2: gunakan variabel environment
    credential = admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  } else {
    throw new Error(
      "Konfigurasi Firebase tidak lengkap. Set FIREBASE_SERVICE_ACCOUNT_PATH atau trio FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }

  admin.initializeApp({
    credential,
    databaseURL: FIREBASE_DATABASE_URL,
  });

  return admin.app();
}

module.exports = {
  initFirebase,
  getDatabase: () => {
    const app = initFirebase();
    return app.database();
  },
};

