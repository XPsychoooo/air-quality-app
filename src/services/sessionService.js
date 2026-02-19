const { getDatabase } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

const SESSIONS_ROOT = "sessions";

/**
 * Create a new session (called on login)
 * Fields match proposal table:
 * session_id, user_id, token, ip_address, user_agent, is_active, expires_at, created_at, last_activity
 */
async function createSession({ user_id, token, ip_address, user_agent, expires_at }) {
    const db = getDatabase();
    const session_id = uuidv4();

    const data = {
        user_id,
        token,
        ip_address: ip_address || "unknown",
        user_agent: user_agent || null,
        is_active: true,
        expires_at,
        created_at: Date.now(),
        last_activity: Date.now(),
    };

    await db.ref(`${SESSIONS_ROOT}/${session_id}`).set(data);
    return { session_id, ...data };
}

/**
 * Get session by token
 */
async function getSessionByToken(token) {
    const db = getDatabase();
    const snapshot = await db.ref(SESSIONS_ROOT).get();
    if (!snapshot.exists()) return null;

    const sessions = snapshot.val();
    for (const [id, session] of Object.entries(sessions)) {
        if (session.token === token && session.is_active) {
            return { session_id: id, ...session };
        }
    }
    return null;
}

/**
 * Get session by ID
 */
async function getSessionById(sessionId) {
    const db = getDatabase();
    const snapshot = await db.ref(`${SESSIONS_ROOT}/${sessionId}`).get();
    if (!snapshot.exists()) return null;
    return { session_id: sessionId, ...snapshot.val() };
}

/**
 * Update last_activity timestamp
 */
async function updateLastActivity(sessionId) {
    const db = getDatabase();
    await db.ref(`${SESSIONS_ROOT}/${sessionId}`).update({
        last_activity: Date.now(),
    });
}

/**
 * Invalidate a session (called on logout)
 */
async function invalidateSession(token) {
    const session = await getSessionByToken(token);
    if (!session) return false;

    const db = getDatabase();
    await db.ref(`${SESSIONS_ROOT}/${session.session_id}`).update({
        is_active: false,
        last_activity: Date.now(),
    });
    return true;
}

/**
 * Invalidate all sessions for a user
 */
async function invalidateUserSessions(userId) {
    const db = getDatabase();
    const snapshot = await db.ref(SESSIONS_ROOT).get();
    if (!snapshot.exists()) return;

    const sessions = snapshot.val();
    for (const [id, session] of Object.entries(sessions)) {
        if (session.user_id === userId && session.is_active) {
            await db.ref(`${SESSIONS_ROOT}/${id}`).update({
                is_active: false,
                last_activity: Date.now(),
            });
        }
    }
}

/**
 * List all sessions (for admin view)
 */
async function listSessions() {
    const db = getDatabase();
    const snapshot = await db.ref(SESSIONS_ROOT).get();
    if (!snapshot.exists()) return [];

    return Object.entries(snapshot.val()).map(([id, session]) => ({
        session_id: id,
        ...session,
    }));
}

/**
 * List active sessions for a user
 */
async function listUserSessions(userId) {
    const sessions = await listSessions();
    return sessions.filter(s => s.user_id === userId && s.is_active);
}

/**
 * Delete a session permanently
 */
async function deleteSession(sessionId) {
    const db = getDatabase();
    const ref = db.ref(`${SESSIONS_ROOT}/${sessionId}`);
    const snapshot = await ref.get();
    if (!snapshot.exists()) return false;
    await ref.remove();
    return true;
}

/**
 * Clean expired sessions
 */
async function cleanExpiredSessions() {
    const db = getDatabase();
    const snapshot = await db.ref(SESSIONS_ROOT).get();
    if (!snapshot.exists()) return 0;

    const now = Date.now();
    const sessions = snapshot.val();
    let cleaned = 0;

    for (const [id, session] of Object.entries(sessions)) {
        if (session.expires_at && session.expires_at < now && session.is_active) {
            await db.ref(`${SESSIONS_ROOT}/${id}`).update({
                is_active: false,
            });
            cleaned++;
        }
    }
    return cleaned;
}

module.exports = {
    createSession,
    getSessionByToken,
    getSessionById,
    updateLastActivity,
    invalidateSession,
    invalidateUserSessions,
    listSessions,
    listUserSessions,
    deleteSession,
    cleanExpiredSessions,
};
