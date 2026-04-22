import { apiFetch } from '../api/httpClient';

export const catalogRepository = {
  async getMalls() {
    const res = await apiFetch('/malls');
    if (!res.ok) throw new Error('Error al cargar centros comerciales');
    return await res.json();
  },

  async getCuisineTypes(ownerId = null) {
    const path = ownerId ? `/cuisine-types/owner/${ownerId}` : '/cuisine-types';
    const res = await apiFetch(path);
    if (!res.ok) throw new Error('Error al cargar tipos de cocina');
    return await res.json();
  },

  async createCuisineType(name, ownerId) {
    const res = await apiFetch('/cuisine-types', {
      method: 'POST',
      body: JSON.stringify({ name, ownerId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear tipo de cocina');
    }
    return await res.json();
  }
};
