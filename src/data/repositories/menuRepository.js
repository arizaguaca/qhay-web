import { apiFetch } from '../api/httpClient';
import { mapMenuItem } from '../mappers/apiMappers';

/**
 * HTTP implementation of IMenuRepository.
 * @implements {import('../../core/repositories/IMenuRepository').IMenuRepository}
 */
export const menuRepository = {
  async getByRestaurant(restaurantId) {
    const res = await apiFetch(`/menus/restaurant/${restaurantId}`);
    if (!res.ok) throw new Error('Error al cargar el menú.');
    return ((await res.json()) || []).map(mapMenuItem);
  },

  async getCategories(restaurantId) {
    const res = await apiFetch(`/menus/categories/restaurant/${restaurantId}`);
    if (!res.ok) throw new Error('Error al cargar las categorías.');
    return (await res.json()) || [];
  },

  async createCategory(data) {
    const res = await apiFetch('/menus/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear la categoría.');
    }
    return await res.json();
  },

  async create(data, imageFile) {
    const formData = this._buildFormData(data, imageFile);
    const res = await apiFetch('/menus', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear el plato.');
    }
    return mapMenuItem(await res.json());
  },

  async update(itemId, data, imageFile) {
    const formData = this._buildFormData(data, imageFile);
    const res = await apiFetch(`/menus/${itemId}`, {
      method: 'PUT',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el plato.');
    }
    return mapMenuItem(await res.json());
  },

  async delete(itemId) {
    const res = await apiFetch(`/menus/${itemId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar el plato.');
  },

  _buildFormData(data, imageFile) {
    const fd = new FormData();
    if (data.restaurantId) fd.append('restaurantId', data.restaurantId);
    if (data.categoryId)   fd.append('categoryId',   data.categoryId);
    if (data.name)         fd.append('name',         data.name);
    if (data.description)  fd.append('description',  data.description);
    if (data.price !== undefined) fd.append('price', data.price);
    if (data.prepTime !== undefined) fd.append('prepTime', data.prepTime);
    fd.append('isAvailable', String(data.isAvailable ?? true));
    
    if (data.groups) {
      fd.append('groups', JSON.stringify(data.groups));
    }
    
    if (imageFile) {
      fd.append('image', imageFile);
    }
    return fd;
  }
};
