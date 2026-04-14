/**
 * createCustomerVerification — Use case: creates a customer and triggers verification (OTP)
 * using the chosen channel (e.g. WhatsApp).
 *
 * @param {import('../repositories/IAuthRepository').IAuthRepository} authRepository
 * @param {{name: string, phone: string, channel: 'whatsapp' | 'sms'}} data
 * @returns {Promise<import('../entities/Customer').Customer>}
 */
export const createCustomerVerification = async (authRepository, data) => {
  const name = (data?.name ?? '').trim();
  const phone = (data?.phone ?? '').trim();
  const channel = data?.channel ?? 'whatsapp';

  if (!name || name.length < 2) {
    throw new Error('Por favor ingresa tu nombre.');
  }
  if (!phone || phone.length < 7) {
    throw new Error('Por favor ingresa un número de teléfono válido.');
  }
  return authRepository.createCustomer({ name, phone, channel });
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
  return authRepository.verifyCode(phone, code);
};
