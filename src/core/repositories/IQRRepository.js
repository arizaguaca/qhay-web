/**
 * IQRRepository — Contract for QR code data operations.
 *
 * @interface
 */
export const IQRRepository = {
  /**
   * Fetches all QR codes for a restaurant.
   * @param {string} restaurantId
   * @returns {Promise<import('../entities/QRCode').QRCode[]>}
   */
  getByRestaurant: async (_restaurantId) => { throw new Error('Not implemented'); },

  /**
   * Generates a new QR code for a table.
   * @param {string} restaurantId
   * @param {number} tableNumber
   * @returns {Promise<import('../entities/QRCode').QRCode>}
   */
  generate: async (_restaurantId, _tableNumber) => { throw new Error('Not implemented'); },

  /**
   * Returns the image URL for a QR code.
   * @param {string} qrId
   * @returns {string}
   */
  getImageUrl: (_qrId) => { throw new Error('Not implemented'); },
};
