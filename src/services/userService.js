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

async function getUserById(id) {
  const db = getDatabase();
  const snapshot = await db.ref(`${USERS_ROOT}/${id}`).get();
  if (!snapshot.exists()) return null;
  return { id, ...snapshot.val() };
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

async function updateUser(id, updates) {
  const db = getDatabase();
  const ref = db.ref(`${USERS_ROOT}/${id}`);
  const snapshot = await ref.get();
  if (!snapshot.exists()) return null;

  const updateData = {
    updated_at: Date.now(),
  };

  if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.username !== undefined) updateData.username = updates.username;
  if (updates.phone_number !== undefined) updateData.phone_number = updates.phone_number || null;
  if (updates.organization !== undefined) updateData.organization = updates.organization || null;
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (updates.email_verified !== undefined) updateData.email_verified = updates.email_verified;

  // If password is provided, hash it
  if (updates.password && updates.password.trim()) {
    updateData.password_hash = await bcrypt.hash(updates.password, 10);
  }

  await ref.update(updateData);
  return { id, ...snapshot.val(), ...updateData };
}

async function deleteUser(id) {
  const db = getDatabase();
  const ref = db.ref(`${USERS_ROOT}/${id}`);
  const snapshot = await ref.get();
  if (!snapshot.exists()) return false;
  await ref.remove();
  return true;
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
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  listUsers,
};
