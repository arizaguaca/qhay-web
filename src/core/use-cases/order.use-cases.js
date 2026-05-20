/**
 * getOrdersByRestaurant — Use case: fetches all active orders for a restaurant.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} restaurantId
 * @returns {Promise<import('../entities/Order').Order[]>}
 */
export const getOrdersByRestaurant = (orderRepository, restaurantId, statuses) => {
  if (!restaurantId) throw new Error('Se requiere el ID del restaurante.');
  return orderRepository.getByRestaurant(restaurantId, statuses);
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
  return all
    .filter((o) => o.restaurantId === String(restaurantId))
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
};

/**
 * getAllPaidOrdersByCustomer — Use case: fetches all paid orders made by a customer across all restaurants.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} customerId
 * @returns {Promise<import('../entities/Order').Order[]>}
 */
export const getAllPaidOrdersByCustomer = async (orderRepository, customerId) => {
  if (!customerId) throw new Error('Se requiere el ID del cliente.');
  const all = await orderRepository.getByCustomer(customerId);
  return all
    .filter((o) => o.status === 'paid')
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
};

/**
 * placeOrder — Use case: submits a new order from the public menu cart.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {Object} params
 * @param {string} params.restaurantId
 * @param {string} params.customerId
 * @param {number} params.tableNumber
 * @param {Array} params.cart - array of cart items with unitPrice and quantity
 * @returns {Promise<import('../entities/Order').Order>}
 */
export const placeOrder = (orderRepository, { restaurantId, customerId, tableNumber, cart }) => {
  if (!cart || cart.length === 0) throw new Error('El carrito está vacío.');
  if (!customerId) throw new Error('Se requiere identificación del cliente.');

  const totalPrice = cart.reduce((sum, item) => {
    const itemBase = item.price * item.quantity;
    const mods = (item.selectedOptions || []).reduce((mSum, opt) => mSum + (opt.extraPrice || 0), 0) * item.quantity;
    return sum + itemBase + mods;
  }, 0);

  const orderPayload = {
    restaurantId: restaurantId,
    customerId: customerId,
    tableNumber: parseInt(tableNumber ?? 1),
    totalAmount: totalPrice, // Changed from totalPrice to totalAmount to match backend Order entity
    status: 'pending',
    items: cart.map((item) => ({
      menuItemId: item.id ?? item.ID,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      notes: item.notes || '',
      modifiers: (item.selectedOptions || []).map(opt => ({
        productOptionId: opt.optionId,
        name: opt.name,
        price: opt.extraPrice || 0
      }))
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
 * @param {string|null} [userId] - ID of the user performing the change (for audit history)
 * @returns {Promise<void>}
 */
export const updateOrderStatus = (orderRepository, orderId, status, userId = null) => {
  if (!orderId) throw new Error('Se requiere el ID de la orden.');
  if (!status) throw new Error('Se requiere el nuevo estado.');
  return orderRepository.updateStatus(orderId, status, userId);
};

/**
 * getOrdersByTable — Use case: fetches all orders for a specific table.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} restaurantId
 * @param {number|string} tableNumber
 * @returns {Promise<import('../entities/Order').Order[]>}
 */
export const getOrdersByTable = (orderRepository, restaurantId, tableNumber) => {
  if (!restaurantId) throw new Error('Se requiere el ID del restaurante.');
  if (tableNumber == null) throw new Error('Se requiere el número de mesa.');
  return orderRepository.getByTable(restaurantId, tableNumber);
};

/**
 * requestTableBill — Use case: processes the payment for all active orders of a table.
 * Validates that all active table orders are in "ready" status before proceeding.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} restaurantId
 * @param {number|string} tableNumber
 * @param {string} customerId - ID of the customer paying for the entire table
 * @returns {Promise<void>}
 */
export const requestTableBill = async (orderRepository, restaurantId, tableNumber, customerId) => {
  if (!restaurantId) throw new Error('Se requiere el ID del restaurante.');
  if (tableNumber == null) throw new Error('Se requiere el número de mesa.');
  if (!customerId) throw new Error('Se requiere el ID del cliente.');

  const tableOrders = await orderRepository.getByTable(restaurantId, tableNumber);
  const activeOrders = tableOrders.filter((o) => !['paid', 'cancelled'].includes(o.status));

  if (activeOrders.length === 0) {
    throw new Error('No hay pedidos activos en esta mesa.');
  }

  const allDelivered = activeOrders.every((o) => o.status === 'delivered');
  if (!allDelivered) {
    throw new Error('Todos los pedidos de la mesa deben estar entregados para poder pagar.');
  }

  await orderRepository.updateTablePaymentStatus(restaurantId, tableNumber, customerId);
};

/**
 * requestBillForCustomer — Use case: marks all delivered orders of a customer as payment_requested.
 * Operates on the customer's session as a whole, not on individual orders.
 *
 * @param {import('../repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} customerId
 * @param {string} restaurantId
 * @returns {Promise<string[]>} IDs of the orders updated
 */
export const requestBillForCustomer = async (orderRepository, customerId, restaurantId) => {
  if (!customerId) throw new Error('Se requiere el ID del cliente.');
  if (!restaurantId) throw new Error('Se requiere el ID del restaurante.');

  const all = await orderRepository.getByCustomer(customerId);
  const deliveredOrders = all.filter(
    (o) => o.restaurantId === String(restaurantId) && o.status === 'delivered'
  );

  if (deliveredOrders.length === 0) {
    throw new Error('No hay pedidos entregados para solicitar la cuenta.');
  }

  await Promise.all(
    deliveredOrders.map((o) => orderRepository.updateStatus(o.id, 'payment_requested'))
  );

  return deliveredOrders.map((o) => o.id);
};
