/**
 * verifyCustomer — Use case: initiates phone verification for a public-menu customer.
 * Returns existing customer directly if already registered, otherwise sends OTP.
 *
 * @param {import('../repositories/IAuthRepository').IAuthRepository} authRepository
 * @param {string} phone
 * @returns {Promise<{exists: boolean, customer?: import('../entities/Customer').Customer}>}
 */
export const verifyCustomerPhone = async (authRepository, phone) => {
  if (!phone || phone.length < 7) {
    throw new Error('Por favor ingresa un número de teléfono válido.');
  }
  return authRepository.sendCustomerCode(phone);
};

/**
 * confirmCustomerOtp — Use case: validates the OTP and returns the verified customer session.
 *
 * @param {import('../repositories/IAuthRepository').IAuthRepository} authRepository
 * @param {string} phone
 * @param {string} code
 * @returns {Promise<import('../entities/Customer').Customer>}
 */
export const confirmCustomerOtp = async (authRepository, phone, code) => {
  if (!code || code.length < 6) {
    throw new Error('El código debe tener 6 dígitos.');
  }
  return authRepository.verifyCustomerCode(phone, code);
};
