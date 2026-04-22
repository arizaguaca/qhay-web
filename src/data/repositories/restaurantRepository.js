import { apiFetch } from '../api/httpClient';
import { mapRestaurant, mapUser } from '../mappers/apiMappers';

/**
 * Construye un FormData con los campos del restaurante.
 * @param {Object} data  - campos del restaurante
 * @param {File|null} logoFile - archivo de imagen (opcional)
 * @returns {FormData}
 */
const buildRestaurantFormData = (data, logoFile = null) => {
  const fd = new FormData();

  // Mapeo explícito para que los nombres de campo coincidan EXACTAMENTE con el backend
  // Referencia: curl -F "name=..." -F "ownerId=..." -F "locationType=..." -F "cuisineType=..." -F "logo=@file"
  if (data.name)           fd.append('name',           data.name);
  if (data.description)    fd.append('description',    data.description);
  if (data.address)        fd.append('address',        data.address);
  if (data.phone)          fd.append('phone',          data.phone);
  if (data.locationType)   fd.append('locationType',   data.locationType);
  if (data.cuisineType)    fd.append('cuisineType',    data.cuisineType);
  if (data.mallId)         fd.append('mallId',         data.mallId);
  // ownerId puede venir como ownerId o como owner_id (legacy)
  const ownerId = data.ownerId ?? data.owner_id ?? '';
  if (ownerId)             fd.append('ownerId',        ownerId);
  if (data.link)           fd.append('link',           data.link);
  // logo como URL de texto (modo URL)
  if (data.logoUrl)        fd.append('logoUrl',        data.logoUrl);
  // logo como archivo binario (modo archivo) — campo "logo" igual que en el curl
  if (logoFile)            fd.append('logo',           logoFile);

  return fd;
};

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

  /**
   * Crea un restaurante enviando multipart/form-data en un solo request.
   * El backend espera los campos + el archivo "logo" en el mismo POST.
   * @param {Object} data
   * @param {File|null} logoFile
   */
  async create(data, logoFile = null) {
    const fd = buildRestaurantFormData(data, logoFile);
    const res = await apiFetch('/restaurants', {
      method: 'POST',
      body: fd, // FormData → el browser pone Content-Type: multipart/form-data automáticamente
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar el restaurante.');
    }
    return mapRestaurant(await res.json());
  },

  /**
   * Actualiza un restaurante enviando multipart/form-data.
   * @param {string} restaurantId
   * @param {Object} data
   * @param {File|null} logoFile
   */
  async update(restaurantId, data, logoFile = null) {
    const fd = buildRestaurantFormData(data, logoFile);
    const res = await apiFetch(`/restaurants/${restaurantId}`, {
      method: 'PUT',
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el restaurante.');
    }
    return mapRestaurant(await res.json());
  },

  /**
   * @returns {Promise<import('../../core/entities/Restaurant').Restaurant | null>}
   */
  async uploadLogo(restaurantId, file) {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await apiFetch(`/restaurants/${restaurantId}/logo`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || err.message || `HTTP ${res.status}`;
      console.error('[uploadLogo] failed:', msg);
      throw new Error(msg);
    }
    const text = await res.text();
    if (!text?.trim()) return null;
    try {
      return mapRestaurant(JSON.parse(text));
    } catch (parseErr) {
      console.warn('[uploadLogo] response not JSON, will refetch:', parseErr);
      return null;
    }
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
