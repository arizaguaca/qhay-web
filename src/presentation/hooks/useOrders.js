import { useState, useEffect, useCallback } from 'react';
import {
  getOrdersByRestaurant,
  getOrdersByCustomer,
  placeOrder,
  updateOrderStatus,
  requestBillForCustomer,
} from '../../core/use-cases/order.use-cases';
import { mapOrder } from '../../data/mappers/apiMappers';

/**
 * useOrders — Manages orders for a restaurant dashboard (with polling).
 *
 * @param {import('../../core/repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} restaurantId
 * @param {number} [pollInterval=30000] - polling interval in ms
 */
export const useOrders = (orderRepository, restaurantId, pollInterval = 30000) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const data = await getOrdersByRestaurant(orderRepository, restaurantId);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    }
  }, [orderRepository, restaurantId]);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  /**
   * addOrUpdateOrder — Accepts raw socket payloads or already-mapped entities.
   * Always normalizes through mapOrder so field names (tableNumber, totalPrice, etc.)
   * are consistent regardless of the backend field casing (ID, table_number, etc.).
   */
  const addOrUpdateOrder = useCallback((order) => {
    setOrders((prev) => {
      const exists = prev.find((o) => o.id === order.id);
      if (exists) {
        // Realizamos un merge inteligente para no perder datos (como tableNumber) 
        // si el objeto de actualización viene parcial
        const merged = { ...exists };
        Object.keys(order).forEach(key => {
          const newValue = order[key];
          if (newValue !== null && newValue !== undefined) {
            // Evitamos que actualizaciones parciales (ej: solo status) borren datos existentes
            if (key === 'tableNumber' && newValue === null) return;
            if (key === 'totalPrice' && newValue === 0 && exists.totalPrice > 0) return;
            if (key === 'items' && Array.isArray(newValue) && newValue.length === 0 && (exists.items || []).length > 0) return;
            
            merged[key] = newValue;
          }
        });
        return prev.map((o) => (o.id === order.id ? merged : o));
      }
      return [order, ...prev];
    });
  }, []);

  const changeStatus = useCallback(async (orderId, status) => {
    await updateOrderStatus(orderRepository, orderId, status);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }, [orderRepository]);

  return { orders, loading, error, refetch: fetchOrders, changeStatus, addOrUpdateOrder, mapOrder };
};

/**
 * useCustomerOrders — Manages orders for the public menu (customer view).
 *
 * @param {import('../../core/repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string | null} customerId
 * @param {string} restaurantId
 * @param {number} [pollInterval=15000]
 */
export const useCustomerOrders = (orderRepository, customerId, restaurantId, pollInterval = 15000) => {
  const [orders, setOrders] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!customerId) return;
    try {
      const data = await getOrdersByCustomer(orderRepository, customerId, restaurantId);
      setOrders(data);
    } catch { }
  }, [orderRepository, customerId, restaurantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (orders.length === 0) return;
    const timer = setInterval(fetchOrders, pollInterval);
    return () => clearInterval(timer);
  }, [orders.length, fetchOrders, pollInterval]);

  const submitOrder = useCallback(async (cart, tableNumber) => {
    if (!customerId) throw new Error('Sesión expirada. Por favor identifícate de nuevo.');
    setSubmitting(true);
    try {
      const newOrder = await placeOrder(orderRepository, {
        restaurantId,
        customerId,
        tableNumber,
        cart,
      });
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } finally {
      setSubmitting(false);
    }
  }, [orderRepository, restaurantId, customerId]);

  const updateStatus = useCallback(async (orderId, status) => {
    await updateOrderStatus(orderRepository, orderId, status);
    await fetchOrders();
  }, [orderRepository, fetchOrders]);

  const confirmPayment = useCallback(async (orderId) => {
    return updateStatus(orderId, 'paid');
  }, [updateStatus]);

  const requestBill = useCallback(async () => {
    if (!customerId) throw new Error('Sesión expirada. Por favor identifícate de nuevo.');
    await requestBillForCustomer(orderRepository, customerId, restaurantId);
    await fetchOrders();
  }, [orderRepository, customerId, restaurantId, fetchOrders]);

  return { orders, submitting, submitOrder, confirmPayment, updateStatus, requestBill, refetch: fetchOrders };
};
