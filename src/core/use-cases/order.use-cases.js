/**
 * getOrdersByRestaurant — Use case: fetches all active orders for a restaurant.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} restaurantId
 * @returns {Promise<import('../entities/Order').Order[]>}
 */
export const getOrdersByRestaurant = (orderRepository, restaurantId) => {
  if (!restaurantId) throw new Error('Se requiere el ID del restaurante.');
  return orderRepository.getByRestaurant(restaurantId);
};

/**
 * getOrdersByCustomer — Use case: fetches all orders made by a customer, filtered by restaurant.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} customerId
 * @param {string} restaurantId
 * @returns {Promise<import('../entities/Order').Order[]>}
 */
export const getOrdersByCustomer = async (orderRepository, customerId, restaurantId) => {
  if (!customerId) throw new Error('Se requiere el ID del cliente.');
  const all = await orderRepository.getByCustomer(customerId);
  return all.filter((o) => o.restaurantId === String(restaurantId));
};

/**
 * placeOrder — Use case: submits a new order from the public menu cart.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.customerId
 * @param {number} params.tableNumber
 * @param {Array} params.cart - array of cart items with price and quantity
 * @returns {Promise<import('../entities/Order').Order>}
 */
export const placeOrder = (orderRepository, { restaurantId, customerId, tableNumber, cart }) => {
  if (!cart || cart.length === 0) throw new Error('El carrito está vacío.');
  if (!customerId) throw new Error('Se requiere identificación del cliente.');

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const orderPayload = {
    restaurantId: restaurantId,
    customerId: customerId,
    tableNumber: parseInt(tableNumber ?? 1),
    totalPrice: totalPrice,
    status: 'pending',
    items: cart.map((item) => ({
      menuItemId: item.id ?? item.ID,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes || '',
    })),
  };

  return orderRepository.create(orderPayload);
};

/**
 * updateOrderStatus — Use case: changes the status of an existing order.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} orderId
 * @param {import('../entities/Order').OrderStatus} status
 * @returns {Promise<void>}
 */
export const updateOrderStatus = (orderRepository, orderId, status) => {
  if (!orderId) throw new Error('Se requiere el ID de la orden.');
  if (!status) throw new Error('Se requiere el nuevo estado.');
  return orderRepository.updateStatus(orderId, status);
};
