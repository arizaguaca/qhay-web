/**
 * @typedef {Object} QRCode
 * @property {string} id
 * @property {string} restaurantId
 * @property {number} tableNumber
 * @property {string} label
 * @property {string} code
 * @property {string} slugPath
 * @property {boolean} isActive
 */

/**
 * Creates a normalized QRCode entity.
 * @param {Object} raw
 * @returns {QRCode}
 */
export const createQRCode = (raw) => ({
  id: raw.id ?? raw.ID ?? '',
  restaurantId: raw.restaurantId ?? raw.restaurant_id ?? raw.RestaurantID ?? '',
  tableNumber: raw.tableNumber ?? raw.table_number ?? raw.TableNumber ?? 0,
  label: raw.label ?? '',
  code: raw.code ?? '',
  slugPath: raw.slugPath ?? '',
  isActive: raw.isActive ?? false,
});
