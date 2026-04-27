/**
 * loginUser — Use case: authenticates a user and persists session.
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
 * verifyUser — Use case: verifies a user account with OTP.
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
