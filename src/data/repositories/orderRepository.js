import { apiFetch } from '../api/httpClient';
import { mapOrder } from '../mappers/apiMappers';

/**
 * HTTP implementation of IOrderRepository.
 * @implements {import('../../core/repositories/IOrderRepository').IOrderRepository}
 */
export const orderRepository = {
  async getByRestaurant(restaurantId) {
    const res = await apiFetch(`/orders?restaurant_id=${restaurantId}`);
    if (!res.ok) throw new Error('Error al cargar los pedidos.');
    return ((await res.json()) || []).map(mapOrder);
  },

  async getByCustomer(customerId) {
    const res = await apiFetch(`/orders?customer_id=${customerId}`);
    if (!res.ok) throw new Error('Error al cargar los pedidos del cliente.');
    return ((await res.json()) || []).map(mapOrder);
  },

  async create(data) {
    const res = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al enviar el pedido.');
    }
    return mapOrder(await res.json());
  },

  async updateStatus(orderId, status) {
    const res = await apiFetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Error al actualizar el estado del pedido.');
  },
};
