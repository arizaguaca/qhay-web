/**
 * @typedef {'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled'} OrderStatus
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} menuItemId
 * @property {string} menuItemName
 * @property {number} quantity
 * @property {number} price
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} restaurantId
 * @property {string} customerId
 * @property {number} tableNumber
 * @property {number} totalPrice
 * @property {OrderStatus} status
 * @property {OrderItem[]} items
 */

/** @type {Record<OrderStatus, {name: string, color: string}>} */
export const ORDER_STATUS_META = {
  pending:    { name: 'Pendiente',  color: '#f59e0b' },
  preparing:  { name: 'Preparando', color: '#3b82f6' },
  ready:      { name: 'Listo',      color: '#10b981' },
  delivered:  { name: 'Entregado',  color: '#6366f1' },
  paid:       { name: 'Pagado',     color: '#4ade80' },
  cancelled:  { name: 'Cancelado',  color: '#f87171' },
};

/**
 * Creates a normalized Order entity from raw API data.
 * @param {Object} raw
 * @returns {Order}
 */
export const createOrder = (raw) => ({
  id: raw.id ?? raw.ID ?? '',
  restaurantId: String(raw.restaurant_id ?? raw.restaurantId ?? raw.RestaurantID ?? ''),
  customerId: raw.customer_id ?? raw.customerId ?? raw.CustomerID ?? '',
  tableNumber: raw.table_number ?? raw.tableNumber ?? raw.TableNumber ?? 1,
  totalPrice: raw.total_price ?? raw.totalPrice ?? raw.TotalPrice ?? 0,
  status: (raw.status ?? raw.Status ?? 'pending').toLowerCase(),
  items: (raw.items ?? []).map((item) => ({
    menuItemId: item.menu_item_id ?? item.menuItemId ?? item.MenuItemID ?? '',
    menuItemName: item.menu_item_name ?? item.menuItemName ?? item.name ?? item.MenuItemName ?? '',
    quantity: item.quantity ?? 1,
    price: item.price ?? 0,
    notes: item.notes ?? '',
  })),
});

/**
 * Returns true if the order is considered active (visible to customer).
 * @param {Order} order
 * @returns {boolean}
 */
export const isActiveOrder = (order) =>
  !['paid', 'cancelled'].includes(order.status);
