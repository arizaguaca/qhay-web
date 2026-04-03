import { apiFetch } from '../api/httpClient';
import { mapUser, mapCustomer } from '../mappers/apiMappers';

/**
 * HTTP implementation of IAuthRepository.
 * @implements {import('../../core/repositories/IAuthRepository').IAuthRepository}
 */
export const authRepository = {
  async login(email, password) {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Credenciales inválidas');
    }
    return mapUser(await res.json());
  },

  async register(data) {
    const res = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar usuario.');
    }
  },

  async sendCustomerCode(phone) {
    const res = await apiFetch('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al enviar el código.');

    if (data.exists) {
      return { exists: true, ...mapCustomer(data) };
    }
    return { exists: false };
  },

  async verifyCustomerCode(phone, code) {
    const res = await apiFetch('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Código incorrecto.');
    return mapCustomer({ ...data, phone });
  },
};
