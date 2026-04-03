/**
 * IAuthRepository — Contract for authentication operations.
 * Implementations live in src/data/repositories/
 *
 * @interface
 */
export const IAuthRepository = {
  /**
   * Logs in a user with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<import('../entities/User').User>}
   */
  login: async (_email, _password) => { throw new Error('Not implemented'); },

  /**
   * Registers a new user account.
   * @param {Omit<import('../entities/User').User, 'id'> & {password: string}} data
   * @returns {Promise<void>}
   */
  register: async (_data) => { throw new Error('Not implemented'); },

  /**
   * Sends an OTP code to a customer phone number.
   * @param {string} phone
   * @returns {Promise<{exists: boolean, customer_id?: string, customer?: Object}>}
   */
  sendCustomerCode: async (_phone) => { throw new Error('Not implemented'); },

  /**
   * Verifies an OTP code for a customer phone.
   * @param {string} phone
   * @param {string} code
   * @returns {Promise<import('../entities/Customer').Customer>}
   */
  verifyCustomerCode: async (_phone, _code) => { throw new Error('Not implemented'); },
};
