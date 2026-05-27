/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {'owner' | 'admin' | 'manager' | 'waiter' | 'cook' | 'cashier' | 'customer'} role
 * @property {boolean} isVerified
 * @property {string} [restaurantId]
 */

/**
 * Creates a normalized User entity from raw data.
 * Handles both camelCase and GORM uppercase ID fields.
 * Also handles the customer verify-code response shape: { entityId, entityType, role }
 * @param {Object} raw
 * @returns {User}
 */
export const createUser = (raw) => ({
  id: raw.id ?? raw.ID ?? raw.entityId ?? '',
  name: raw.fullName ?? raw.full_name ?? raw.name ?? '',
  email: raw.email ?? '',
  phone: raw.phone ?? raw.contact ?? '',
  role: raw.role ?? 'owner',
  isVerified: raw.isVerified ?? raw.is_verified ?? true,
  restaurantId: raw.restaurantId ?? raw.restaurant_id ?? raw.RestaurantID ?? null,
});

// ─── Role Helpers ─────────────────────────────────────────────────────────────

/** owner | admin — gestión total del sistema */
export const isAdmin = (user) => user?.role === 'owner' || user?.role === 'admin';

/** owner | admin | manager — gestión del restaurante */
export const isManager = (user) => ['owner', 'admin', 'manager'].includes(user?.role);

/**
 * isStaff — Mantiene la semántica original: cualquier rol que NO sea owner.
 * Usado por RestaurantsPage para distinguir owner (carga todos sus restaurantes)
 * de staff (auto-redirige a su restaurante asignado).
 */
export const isStaff = (user) => !!user?.role && user.role !== 'owner';

/**
 * isOperationalStaff — Cualquier rol de staff operacional (no customer).
 * Útil para guards de rutas internas.
 */
export const isOperationalStaff = (user) => user?.role !== 'customer' && !!user?.role;

/** customer — accede al menú y pedidos vía QR */
export const isCustomer = (user) => user?.role === 'customer';

/** owner | admin | manager | waiter | customer — puede crear/ver pedidos */
export const canAccessOrders = (user) => ['owner', 'admin', 'manager', 'waiter', 'customer'].includes(user?.role);

/** Alias backward-compat */
export const isOwner = (user) => user?.role === 'owner';

