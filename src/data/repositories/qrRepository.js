import { apiFetch, apiUrl } from '../api/httpClient';
import { mapQRCode } from '../mappers/apiMappers';

/**
 * HTTP implementation of IQRRepository.
 * @implements {import('../../core/repositories/IQRRepository').IQRRepository}
 */
export const qrRepository = {
  async getByRestaurant(restaurantId) {
    const res = await apiFetch(`/qrcodes/restaurant/${restaurantId}`);
    if (!res.ok) throw new Error('Error al cargar los QRs.');
    return ((await res.json()) || []).map(mapQRCode);
  },

  async generate(restaurantId, tableNumber, label = '') {
    const res = await apiFetch('/qrcodes', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId,
        tableNumber: parseInt(tableNumber),
        label
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al generar el QR.');
    }
    return mapQRCode(await res.json());
  },

  async generateBulk(restaurantId, quantity) {
    const res = await apiFetch('/qrcodes', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId,
        quantity: parseInt(quantity)
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al generar los QRs en bloque.');
    }
    return ((await res.json()) || []).map(mapQRCode);
  },

  getImageUrl(qrId) {
    return apiUrl(`/qrcodes/image?id=${qrId}`);
  },
};
