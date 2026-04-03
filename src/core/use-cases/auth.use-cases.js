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
  const { name, email, phone, password, role } = data;

  if (!name || !email || !password) {
    throw new Error('Nombre, correo y contraseña son obligatorios.');
  }

  return authRepository.register({ name, email, phone, password, role, isVerified: false });
};
