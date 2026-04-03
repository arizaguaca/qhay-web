/**
 * IRestaurantRepository — Contract for restaurant data operations.
 *
 * @interface
 */
export const IRestaurantRepository = {
  /**
   * Fetches all restaurants belonging to an owner.
   * @param {string} ownerId
   * @returns {Promise<import('../entities/Restaurant').Restaurant[]>}
   */
  getByOwner: async (_ownerId) => { throw new Error('Not implemented'); },

  /**
   * Fetches a single restaurant by its ID.
   * @param {string} restaurantId
   * @returns {Promise<import('../entities/Restaurant').Restaurant>}
   */
  getById: async (_restaurantId) => { throw new Error('Not implemented'); },

  /**
   * Creates a new restaurant.
   * @param {Object} data
   * @returns {Promise<import('../entities/Restaurant').Restaurant>}
   */
  create: async (_data) => { throw new Error('Not implemented'); },

  /**
   * Updates an existing restaurant's info.
   * @param {string} restaurantId
   * @param {Object} data
   * @returns {Promise<import('../entities/Restaurant').Restaurant>}
   */
  update: async (_restaurantId, _data) => { throw new Error('Not implemented'); },

  /**
   * Uploads a logo file for a restaurant.
   * @param {string} restaurantId
   * @param {File} file
   * @returns {Promise<void>}
   */
  uploadLogo: async (_restaurantId, _file) => { throw new Error('Not implemented'); },

  /**
   * Fetches all staff members for a restaurant.
   * @param {string} restaurantId
   * @returns {Promise<import('../entities/User').User[]>}
   */
  getStaff: async (_restaurantId) => { throw new Error('Not implemented'); },

  /**
   * Creates a new staff member for a restaurant.
   * @param {Object} data
   * @returns {Promise<import('../entities/User').User>}
   */
  createStaff: async (_data) => { throw new Error('Not implemented'); },

  /**
   * Updates an existing staff member.
   * @param {string} staffId
   * @param {Object} data
   * @returns {Promise<import('../entities/User').User>}
   */
  updateStaff: async (_staffId, _data) => { throw new Error('Not implemented'); },

  /**
   * Deletes a staff member by ID.
   * @param {string} staffId
   * @returns {Promise<void>}
   */
  deleteStaff: async (_staffId) => { throw new Error('Not implemented'); },

  /**
   * Fetches operating hours for a restaurant.
   * @param {string} restaurantId
   * @returns {Promise<Object[]>}
   */
  getOperatingHours: async (_restaurantId) => { throw new Error('Not implemented'); },

  /**
   * Saves operating hours for a restaurant.
   * @param {string} restaurantId
   * @param {Object[]} hours
   * @returns {Promise<void>}
   */
  saveOperatingHours: async (_restaurantId, _hours) => { throw new Error('Not implemented'); },
};
