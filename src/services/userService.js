const { getDatabase } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

const USERS_ROOT = "users";

async function findUserByEmailOrUsername(identifier) {
  const db = getDatabase();
  const ref = db.ref(USERS_ROOT);
  const snapshot = await ref.get();
  if (!snapshot.exists()) return null;

  const users = snapshot.val();
  for (const [id, user] of Object.entries(users)) {
    if (user.email === identifier || user.username === identifier) {
      return { id, ...user };
    }
  }
  return null;
}

async function createUser({ email, username, password, full_name, role = "OPERATOR", phone_number = null, organization = null }) {
  const db = getDatabase();
  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);

  const data = {
    email,
    username,
    password_hash,
    full_name,
    phone_number: phone_number || null,
    organization: organization || null,
    role,
    is_active: true,
    email_verified: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    last_login: null,
  };

  await db.ref(`${USERS_ROOT}/${id}`).set(data);
  return { id, ...data };
}

async function listUsers() {
  const db = getDatabase();
  const snapshot = await db.ref(USERS_ROOT).get();
  if (!snapshot.exists()) return [];

  return Object.entries(snapshot.val()).map(([id, user]) => ({
    id,
    ...user,
  }));
}

module.exports = {
  findUserByEmailOrUsername,
  createUser,
  listUsers,
};

