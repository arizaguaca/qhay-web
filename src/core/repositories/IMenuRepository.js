/**
 * IMenuRepository — Contract for menu item data operations.
 *
 * @interface
 */
export const IMenuRepository = {
  /**
   * Fetches all menu items for a restaurant.
   * @param {string} restaurantId
   * @returns {Promise<import('../entities/MenuItem').MenuItem[]>}
   */
  getByRestaurant: async (_restaurantId) => { throw new Error('Not implemented'); },

  /**
   * Creates a new menu item.
   * @param {Object} data
   * @returns {Promise<import('../entities/MenuItem').MenuItem>}
   */
  create: async (_data) => { throw new Error('Not implemented'); },

  /**
   * Updates an existing menu item.
   * @param {string} itemId
   * @param {Object} data
   * @returns {Promise<import('../entities/MenuItem').MenuItem>}
   */
  update: async (_itemId, _data) => { throw new Error('Not implemented'); },

  /**
   * Deletes a menu item.
   * @param {string} itemId
   * @returns {Promise<void>}
   */
  delete: async (_itemId) => { throw new Error('Not implemented'); },

  /**
   * Uploads an image for a menu item.
   * @param {string} itemId
   * @param {File} file
   * @returns {Promise<void>}
   */
  uploadImage: async (_itemId, _file) => { throw new Error('Not implemented'); },
};
