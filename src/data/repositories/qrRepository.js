import { apiFetch, apiUrl } from '../api/httpClient';
import { mapQRCode } from '../mappers/apiMappers';

/**
 * HTTP implementation of IQRRepository.
 * @implements {import('../../core/repositories/IQRRepository').IQRRepository}
 */
export const qrRepository = {
  async getByRestaurant(restaurantId) {
    const res = await apiFetch(`/restaurants/${restaurantId}/qrs`);
    if (!res.ok) throw new Error('Error al cargar los QRs.');
    return ((await res.json()) || []).map(mapQRCode);
  },

  async generate(restaurantId, tableNumber) {
    const res = await apiFetch('/qrcodes', {
      method: 'POST',
      body: JSON.stringify({
        restaurant_id: restaurantId,
        table_number: parseInt(tableNumber),
        code: `${window.location.origin}/restaurants/${restaurantId}?table=${tableNumber}`,
      }),
    });
    if (!res.ok) throw new Error('Error al generar el QR.');
    return mapQRCode(await res.json());
  },

  getImageUrl(qrId) {
    return apiUrl(`/qrcodes/image?id=${qrId}`);
  },
};
