/**
 * @typedef {Object} MenuItem
 * @property {string} id
 * @property {string} restaurantId
 * @property {string} categoryId
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {number} prepTime
 * @property {string | null} imageUrl
 * @property {boolean} isAvailable
 * @property {Array} groups
 */

/**
 * Creates a normalized MenuItem entity from raw API data.
 * @param {Object} raw
 * @returns {MenuItem}
 */
export const createMenuItem = (raw) => ({
  id: raw.id ?? raw.ID ?? '',
  restaurantId: raw.restaurant_id ?? raw.restaurantId ?? '',
  categoryId: raw.category_id ?? raw.categoryId ?? '',
  name: raw.name ?? '',
  description: raw.description ?? '',
  price: typeof raw.price === 'number' ? raw.price : parseFloat(raw.price ?? 0),
  prepTime: typeof raw.prep_time === 'number' ? raw.prep_time : parseInt(raw.prepTime ?? raw.prep_time ?? 0),
  imageUrl: raw.image_url ?? raw.imageUrl ?? null,
  isAvailable: raw.is_available ?? raw.isAvailable ?? true,
  groups: raw.groups ?? [],
});
