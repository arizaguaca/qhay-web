/**
 * @typedef {Object} Restaurant
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} address
 * @property {string} phone
 * @property {string} ownerId
 * @property {string | null} logoUrl
 */

/**
 * Creates a normalized Restaurant entity from raw API data.
 * @param {Object} raw
 * @returns {Restaurant}
 */
export const createRestaurant = (raw) => ({
  id: raw.id ?? raw.ID ?? '',
  name: raw.name ?? '',
  description: raw.description ?? '',
  address: raw.address ?? '',
  phone: raw.phone ?? '',
  ownerId: raw.owner_id ?? raw.OwnerID ?? '',
  logoUrl: raw.logo_url ?? raw.LogoURL ?? null,
});
