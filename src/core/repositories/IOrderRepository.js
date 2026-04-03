/**
 * IOrderRepository — Contract for order data operations.
 *
 * @interface
 */
export const IOrderRepository = {
  /**
   * Fetches all orders for a restaurant.
   * @param {string} restaurantId
   * @returns {Promise<import('../entities/Order').Order[]>}
   */
  getByRestaurant: async (_restaurantId) => { throw new Error('Not implemented'); },

  /**
   * Fetches all orders for a customer.
   * @param {string} customerId
   * @returns {Promise<import('../entities/Order').Order[]>}
   */
  getByCustomer: async (_customerId) => { throw new Error('Not implemented'); },

  /**
   * Creates a new order.
   * @param {Object} data
   * @returns {Promise<import('../entities/Order').Order>}
   */
  create: async (_data) => { throw new Error('Not implemented'); },

  /**
   * Updates the status of an existing order.
   * @param {string} orderId
   * @param {import('../entities/Order').OrderStatus} status
   * @returns {Promise<void>}
   */
  updateStatus: async (_orderId, _status) => { throw new Error('Not implemented'); },
};
