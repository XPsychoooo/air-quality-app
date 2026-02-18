const { getDatabase } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

const ROLES_ROOT = "roles";

// Default roles sesuai proposal
const DEFAULT_ROLES = [
    {
        role_name: "SUPER_ADMIN",
        description: "Akses penuh ke seluruh sistem. Dapat mengelola pengguna, sensor, dan konfigurasi sistem. Dapat mengekspor dan menghapus data.",
        permissions: JSON.stringify({
            dashboard: true,
            monitoring: true,
            users: { read: true, create: true, update: true, delete: true },
            roles: { read: true, create: true, update: true, delete: true },
            sensors: { read: true, create: true, update: true, delete: true },
            logs: true,
            settings: true,
            export_data: true,
            delete_data: true,
            reports: { view: true, create: true, export: true },
            config: true
        })
    },
    {
        role_name: "ADMIN_TAMBANG",
        description: "Akses ke dashboard monitoring. Dapat melihat dan mengekspor laporan. Dapat mengelola sensor di area tambang. Tidak dapat menghapus data historis.",
        permissions: JSON.stringify({
            dashboard: true,
            monitoring: true,
            users: { read: true, create: true, update: true, delete: false },
            roles: { read: true, create: false, update: false, delete: false },
            sensors: { read: true, create: true, update: true, delete: false },
            logs: true,
            settings: false,
            export_data: true,
            delete_data: false,
            reports: { view: true, create: true, export: true },
            config: false
        })
    },
    {
        role_name: "OPERATOR",
        description: "Akses ke dashboard monitoring (read-only). Dapat melihat data real-time dan historis. Dapat membuat laporan. Tidak dapat mengubah konfigurasi.",
        permissions: JSON.stringify({
            dashboard: true,
            monitoring: true,
            users: { read: false, create: false, update: false, delete: false },
            roles: { read: false, create: false, update: false, delete: false },
            sensors: { read: true, create: false, update: false, delete: false },
            logs: false,
            settings: false,
            export_data: false,
            delete_data: false,
            reports: { view: true, create: true, export: false },
            config: false
        })
    },
    {
        role_name: "VIEWER",
        description: "Akses terbatas ke dashboard publik. Hanya dapat melihat data kualitas udara. Tidak dapat mengekspor atau membuat laporan.",
        permissions: JSON.stringify({
            dashboard: true,
            monitoring: true,
            users: { read: false, create: false, update: false, delete: false },
            roles: { read: false, create: false, update: false, delete: false },
            sensors: { read: false, create: false, update: false, delete: false },
            logs: false,
            settings: false,
            export_data: false,
            delete_data: false,
            reports: { view: false, create: false, export: false },
            config: false,
            public_dashboard_only: true
        })
    }
];

async function listRoles() {
    const db = getDatabase();
    const snapshot = await db.ref(ROLES_ROOT).get();
    if (!snapshot.exists()) return [];

    return Object.entries(snapshot.val()).map(([id, role]) => ({
        role_id: id,
        ...role,
    }));
}

async function getRoleById(roleId) {
    const db = getDatabase();
    const snapshot = await db.ref(`${ROLES_ROOT}/${roleId}`).get();
    if (!snapshot.exists()) return null;
    return { role_id: roleId, ...snapshot.val() };
}

async function getRoleByName(roleName) {
    const roles = await listRoles();
    return roles.find(r => r.role_name === roleName) || null;
}

async function createRole({ role_name, description = null, permissions = "{}" }) {
    const db = getDatabase();
    const role_id = uuidv4();

    const data = {
        role_name,
        description: description || null,
        permissions: permissions || "{}",
        created_at: Date.now(),
        updated_at: Date.now(),
    };

    await db.ref(`${ROLES_ROOT}/${role_id}`).set(data);
    return { role_id, ...data };
}

async function updateRole(roleId, updates) {
    const db = getDatabase();
    const ref = db.ref(`${ROLES_ROOT}/${roleId}`);
    const snapshot = await ref.get();
    if (!snapshot.exists()) return null;

    const updateData = { updated_at: Date.now() };
    if (updates.role_name !== undefined) updateData.role_name = updates.role_name;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions || "{}";

    await ref.update(updateData);
    return { role_id: roleId, ...snapshot.val(), ...updateData };
}

async function deleteRole(roleId) {
    const db = getDatabase();
    const ref = db.ref(`${ROLES_ROOT}/${roleId}`);
    const snapshot = await ref.get();
    if (!snapshot.exists()) return false;
    await ref.remove();
    return true;
}

async function seedDefaultRoles() {
    const db = getDatabase();
    const snapshot = await db.ref(ROLES_ROOT).get();

    if (snapshot.exists()) {
        const existing = Object.entries(snapshot.val());

        for (const role of DEFAULT_ROLES) {
            const found = existing.find(([, r]) => r.role_name === role.role_name);
            if (found) {
                // Update existing role with latest description & permissions
                const [id] = found;
                await db.ref(`${ROLES_ROOT}/${id}`).update({
                    description: role.description,
                    permissions: role.permissions,
                    updated_at: Date.now(),
                });
                console.log(`Updated role: ${role.role_name}`);
            } else {
                await createRole(role);
                console.log(`Seeded role: ${role.role_name}`);
            }
        }
    } else {
        for (const role of DEFAULT_ROLES) {
            await createRole(role);
            console.log(`Seeded role: ${role.role_name}`);
        }
    }
}

module.exports = {
    listRoles,
    getRoleById,
    getRoleByName,
    createRole,
    updateRole,
    deleteRole,
    seedDefaultRoles,
};
