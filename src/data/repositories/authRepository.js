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

  async createCustomer({ name, phone, channel }) {
    const res = await apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify({ name, phone, channel }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Error al crear el cliente.');
    return mapCustomer(data);
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

  async verifyCode(contact, code) {
    const res = await apiFetch('/verification/verify-code', {
      method: 'POST',
      body: JSON.stringify({ contact, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Código incorrecto.');
    return mapCustomer({ ...data, contact });
  },
};
