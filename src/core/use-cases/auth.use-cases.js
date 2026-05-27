/**
 * loginUser — Use case: authenticates a staff/owner user and persists session.
 *
 * @param {import('../repositories/IAuthRepository').IAuthRepository} authRepository
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<import('../entities/User').User>}
 */
export const loginUser = async (authRepository, credentials) => {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new Error('El correo y la contraseña son obligatorios.');
  }

  return authRepository.login(email, password);
};

/**
 * logoutUser — Use case: ends the user session, invalidating the server-side cookie.
 *
 * @param {import('../repositories/IAuthRepository').IAuthRepository} authRepository
 * @returns {Promise<void>}
 */
export const logoutUser = async (authRepository) => {
  return authRepository.logout();
};

/**
 * registerUser — Use case: registers a new user account.
 *
 * @param {import('../repositories/IAuthRepository').IAuthRepository} authRepository
 * @param {Object} data
 * @returns {Promise<void>}
 */
export const registerUser = async (authRepository, data) => {
  const { fullName, email, phone, password } = data;

  if (!fullName || !email || !password) {
    throw new Error('Nombre, correo y contraseña son obligatorios.');
  }

  return authRepository.register({ fullName, email, phone, password, isVerified: false });
};

/**
 * verifyCustomerCode — Use case: verifies a customer OTP and establishes their session.
 *
 * @param {import('../repositories/IAuthRepository').IAuthRepository} authRepository
 * @param {string} contact - Phone number of the customer
 * @param {string} code - OTP code received via SMS/WhatsApp
 * @returns {Promise<import('../entities/Customer').Customer>}
 */
export const verifyCustomerCode = async (authRepository, contact, code) => {
  if (!contact || !code) {
    throw new Error('El teléfono y el código son obligatorios.');
  }
  return authRepository.verifyCode(contact, code);
};

/**
 * verifyUser — Use case: verifies a user account with OTP (staff registration flow).
 *
 * @param {import('../repositories/IAuthRepository').IAuthRepository} authRepository
 * @param {string} email
 * @param {string} code
 * @returns {Promise<void>}
 */
export const verifyUser = async (authRepository, email, code) => {
  if (!email || !code) {
    throw new Error('El correo y el código son obligatorios.');
  }
  return authRepository.verifyCode(email, code);
};

