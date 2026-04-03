import { apiFetch, apiUrl } from '../api/httpClient';
import { mapRestaurant, mapUser } from '../mappers/apiMappers';

/**
 * HTTP implementation of IRestaurantRepository.
 * @implements {import('../../core/repositories/IRestaurantRepository').IRestaurantRepository}
 */
export const restaurantRepository = {
  async getByOwner(ownerId) {
    const res = await apiFetch(`/restaurants/owner/${ownerId}`);
    if (res.ok) {
      const data = await res.json();
      return (data || []).map(mapRestaurant);
    }
    // Fallback to query param variant
    const fallback = await apiFetch(`/restaurants?owner_id=${ownerId}`);
    if (fallback.ok) {
      const data = await fallback.json();
      return (data || []).map(mapRestaurant);
    }
    throw new Error('Error al cargar los restaurantes.');
  },

  async getById(restaurantId) {
    const res = await apiFetch(`/restaurants/${restaurantId}`);
    if (!res.ok) throw new Error('Restaurante no encontrado.');
    return mapRestaurant(await res.json());
  },

  async create(data) {
    const res = await apiFetch('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar el restaurante.');
    }
    return mapRestaurant(await res.json());
  },

  async update(restaurantId, data) {
    const res = await apiFetch(`/restaurants/${restaurantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el restaurante.');
    }
    return mapRestaurant(await res.json());
  },

  async uploadLogo(restaurantId, file) {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await apiFetch(`/restaurants/${restaurantId}/logo`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) console.warn('Error al subir el logo del restaurante.');
  },

  async getStaff(restaurantId) {
    const res = await apiFetch(`/users?restaurant_id=${restaurantId}`);
    if (!res.ok) throw new Error('Error al cargar el staff.');
    return ((await res.json()) || []).map(mapUser);
  },

  async createStaff(data) {
    const res = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear el miembro del staff.');
    }
    return mapUser(await res.json());
  },

  async updateStaff(staffId, data) {
    const res = await apiFetch(`/users?id=${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el miembro del staff.');
    }
    return mapUser(await res.json());
  },

  async deleteStaff(staffId) {
    const res = await apiFetch(`/users?id=${staffId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar el miembro del staff.');
  },

  async getOperatingHours(restaurantId) {
    const res = await apiFetch(`/restaurants/${restaurantId}/hours`);
    if (!res.ok) return [];
    return (await res.json()) || [];
  },

  async saveOperatingHours(restaurantId, hours) {
    const res = await apiFetch(`/restaurants/${restaurantId}/hours`, {
      method: 'PUT',
      body: JSON.stringify(hours),
    });
    if (!res.ok) throw new Error('Error al guardar los horarios.');
  },
};
