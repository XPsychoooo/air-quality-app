const { getDatabase } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

const LOGS_ROOT = "activity_logs";

async function logActivity(payload) {
  const db = getDatabase();
  const logId = uuidv4();

  const data = {
    ...payload,
    created_at: Date.now(),
  };

  await db.ref(`${LOGS_ROOT}/${logId}`).set(data);
  return { id: logId, ...data };
}

async function listLogs(limit = 100) {
  const db = getDatabase();
  const snapshot = await db
    .ref(LOGS_ROOT)
    .limitToLast(limit)
    .get();

  if (!snapshot.exists()) return [];

  const logs = Object.entries(snapshot.val()).map(([id, log]) => ({
    id,
    ...log,
  }));

  logs.sort((a, b) => b.created_at - a.created_at);
  return logs;
}

module.exports = {
  logActivity,
  listLogs,
};

