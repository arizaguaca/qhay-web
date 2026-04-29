/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {'owner' | 'admin' | 'editor' | 'waiter' | 'cook' | 'cashier'} role
 * @property {boolean} isVerified
 * @property {string} [restaurantId]
 */

/**
 * Creates a normalized User entity from raw data.
 * Handles both camelCase and GORM uppercase ID fields.
 * @param {Object} raw
 * @returns {User}
 */
export const createUser = (raw) => ({
  id: raw.id ?? raw.ID ?? '',
  name: raw.fullName ?? raw.full_name ?? raw.name ?? '',
  email: raw.email ?? '',
  phone: raw.phone ?? '',
  role: raw.role ?? 'owner',
  isVerified: raw.isVerified ?? raw.is_verified ?? false,
  restaurantId: raw.restaurantId ?? raw.restaurant_id ?? raw.RestaurantID ?? null,
});

/**
 * Returns true if the user is a restaurant owner.
 * @param {User} user
 * @returns {boolean}
 */
export const isOwner = (user) => user.role === 'owner';

/**
 * Returns true if the user is staff (not an owner).
 * @param {User} user
 * @returns {boolean}
 */
export const isStaff = (user) => user.role !== 'owner';
