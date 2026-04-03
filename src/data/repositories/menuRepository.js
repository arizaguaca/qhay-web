import { apiFetch } from '../api/httpClient';
import { mapMenuItem } from '../mappers/apiMappers';

/**
 * HTTP implementation of IMenuRepository.
 * @implements {import('../../core/repositories/IMenuRepository').IMenuRepository}
 */
export const menuRepository = {
  async getByRestaurant(restaurantId) {
    const res = await apiFetch(`/menu/?restaurant_id=${restaurantId}`);
    if (!res.ok) throw new Error('Error al cargar el menú.');
    return ((await res.json()) || []).map(mapMenuItem);
  },

  async create(data) {
    const res = await apiFetch('/menu/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear el plato.');
    }
    return mapMenuItem(await res.json());
  },

  async update(itemId, data) {
    const res = await apiFetch(`/menu/${itemId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el plato.');
    }
    return mapMenuItem(await res.json());
  },

  async delete(itemId) {
    const res = await apiFetch(`/menu/${itemId}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar el plato.');
  },

  async uploadImage(itemId, file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiFetch(`/menu/${itemId}/image/`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) console.warn('Plato guardado, pero hubo un error al subir la imagen.');
  },
};
