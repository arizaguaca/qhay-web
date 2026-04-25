/**
 * @typedef {Object} Customer
 * @property {string} customerId
 * @property {string} phone
 * @property {boolean} verified
 * @property {Object} [customer]
 */

/**
 * Creates a normalized Customer session entity.
 * @param {Object} raw
 * @returns {Customer}
 */
export const createCustomer = (raw) => ({
  customerId: raw.entityId ?? raw.customer_id ?? raw.CustomerID ?? raw.customerId ?? raw.customer?.CustomerID ?? raw.customer?.id ?? raw.id ?? '',
  phone: raw.phone ?? '',
  verified: raw.verified ?? false,
  customer: raw.customer ?? null,
});
