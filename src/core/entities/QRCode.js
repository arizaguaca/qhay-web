/**
 * @typedef {Object} QRCode
 * @property {string} id
 * @property {string} restaurantId
 * @property {number} tableNumber
 * @property {string} code
 */

/**
 * Creates a normalized QRCode entity.
 * @param {Object} raw
 * @returns {QRCode}
 */
export const createQRCode = (raw) => ({
  id: raw.id ?? raw.ID ?? '',
  restaurantId: raw.restaurant_id ?? raw.RestaurantID ?? '',
  tableNumber: raw.table_number ?? raw.TableNumber ?? 0,
  code: raw.code ?? '',
});
