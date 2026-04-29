import { useState, useEffect, useCallback } from 'react';
import {
  getOrdersByRestaurant,
  getOrdersByCustomer,
  placeOrder,
  updateOrderStatus,
} from '../../core/use-cases/order.use-cases';

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

    const timer = setInterval(fetchOrders, pollInterval);
    return () => clearInterval(timer);
  }, [fetchOrders, pollInterval]);

  const changeStatus = useCallback(async (orderId, status) => {
    await updateOrderStatus(orderRepository, orderId, status);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }, [orderRepository]);

  return { orders, loading, error, refetch: fetchOrders, changeStatus };
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
    } catch {}
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

  return { orders, submitting, submitOrder, confirmPayment, updateStatus, refetch: fetchOrders };
};
