const { getDatabase } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

const ROLES_ROOT = "roles";

// Default roles sesuai proposal
const DEFAULT_ROLES = [
    {
        role_name: "SUPER_ADMIN",
        description: "Administrator utama dengan akses penuh ke semua fitur sistem",
        permissions: JSON.stringify({
            dashboard: true,
            monitoring: true,
            users: { read: true, create: true, update: true, delete: true },
            roles: { read: true, create: true, update: true, delete: true },
            logs: true,
            settings: true
        })
    },
    {
        role_name: "ADMIN_TAMBANG",
        description: "Administrator tambang dengan akses manajemen pengguna dan monitoring",
        permissions: JSON.stringify({
            dashboard: true,
            monitoring: true,
            users: { read: true, create: true, update: true, delete: false },
            roles: { read: true, create: false, update: false, delete: false },
            logs: true,
            settings: false
        })
    },
    {
        role_name: "OPERATOR",
        description: "Operator lapangan yang mengelola perangkat sensor dan data monitoring",
        permissions: JSON.stringify({
            dashboard: true,
            monitoring: true,
            users: { read: false, create: false, update: false, delete: false },
            roles: { read: false, create: false, update: false, delete: false },
            logs: false,
            settings: false
        })
    },
    {
        role_name: "VIEWER",
        description: "Pengguna yang hanya dapat melihat data dashboard dan monitoring",
        permissions: JSON.stringify({
            dashboard: true,
            monitoring: true,
            users: { read: false, create: false, update: false, delete: false },
            roles: { read: false, create: false, update: false, delete: false },
            logs: false,
            settings: false
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

async function seedDefaultRoles() {
    const db = getDatabase();
    const snapshot = await db.ref(ROLES_ROOT).get();

    if (snapshot.exists()) {
        const existing = Object.values(snapshot.val());
        const existingNames = existing.map(r => r.role_name);

        for (const role of DEFAULT_ROLES) {
            if (!existingNames.includes(role.role_name)) {
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
    seedDefaultRoles,
};
