/**
 * @typedef {Object} Restaurant
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} address
 * @property {string} phone
 * @property {string} userId
 * @property {string | null} logoUrl
 * @property {string} locationType
 * @property {string} cuisineId
 * @property {string} [mallId]
 * @property {string} [mallName]
 * @property {string} [link]
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
  userId: raw.user_id ?? raw.userId ?? raw.owner_id ?? raw.OwnerID ?? raw.ownerId ?? '',
  logoUrl: raw.logo_url ?? raw.LogoURL ?? raw.logoUrl ?? null,
  locationType: raw.location_type ?? raw.locationType ?? raw.restaurant_type ?? raw.restaurantType ?? '',
  cuisineId: raw.cuisine_id ?? raw.cuisineId ?? raw.cuisine_type ?? raw.cuisineType ?? '',
  cityId: raw.city_id ?? raw.cityId ?? '',
  mallId: raw.mall_id ?? raw.mallId ?? '',
  mallName: raw.mall_name ?? raw.mallName ?? raw.shopping_mall ?? raw.shoppingMall ?? '',
  link: raw.link ?? raw.Link ?? '',
});
