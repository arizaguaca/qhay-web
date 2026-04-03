/**
 * @typedef {Object} MenuItem
 * @property {string} id
 * @property {string} restaurantId
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {number} prepTime - preparation time in minutes
 * @property {string | null} imageUrl
 * @property {boolean} isAvailable
 */

/**
 * Creates a normalized MenuItem entity from raw API data.
 * @param {Object} raw
 * @returns {MenuItem}
 */
export const createMenuItem = (raw) => ({
  id: raw.id ?? raw.ID ?? '',
  restaurantId: raw.restaurant_id ?? raw.RestaurantID ?? '',
  name: raw.name ?? '',
  description: raw.description ?? '',
  price: typeof raw.price === 'number' ? raw.price : parseFloat(raw.price ?? 0),
  prepTime: typeof raw.prep_time === 'number' ? raw.prep_time : parseInt(raw.prep_time ?? 0),
  imageUrl: raw.image_url ?? raw.ImageURL ?? null,
  isAvailable: raw.is_available ?? raw.IsAvailable ?? true,
});
