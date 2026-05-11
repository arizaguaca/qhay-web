import { useState, useEffect, useCallback } from 'react';
import {
  getOrdersByRestaurant,
  getOrdersByCustomer,
  getOrdersByTable,
  placeOrder,
  updateOrderStatus,
  requestBillForCustomer,
  requestTableBill as requestTableBillUseCase,
} from '../../core/use-cases/order.use-cases';
import { mapOrder } from '../../data/mappers/apiMappers';

/**
 * useOrders — Manages orders for a restaurant dashboard (with polling).
 *
 * @param {import('../../core/repositories/IOrderRepository').IOrderRepository} orderRepository
 * @param {string} restaurantId
 * @param {number} [pollInterval=30000] - polling interval in ms
 */
export const useOrders = (orderRepository, restaurantId, statuses = null, pollInterval = 30000) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStatuses, setCurrentStatuses] = useState(statuses);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const data = await getOrdersByRestaurant(orderRepository, restaurantId, currentStatuses);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    }
  }, [orderRepository, restaurantId, currentStatuses]);

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
 * @param {string|number|null} [tableNumber=null]
 * @param {number} [pollInterval=15000]
 */
export const useCustomerOrders = (orderRepository, customerId, restaurantId, tableNumber = null, pollInterval = 15000) => {
  const [orders, setOrders] = useState([]);
  const [tableOrders, setTableOrders] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!customerId) return;
    try {
      const data = await getOrdersByCustomer(orderRepository, customerId, restaurantId);
      setOrders(data);
    } catch { }
  }, [orderRepository, customerId, restaurantId]);

  const fetchTableOrders = useCallback(async () => {
    if (!restaurantId || tableNumber == null) return;
    try {
      const data = await getOrdersByTable(orderRepository, restaurantId, tableNumber);
      setTableOrders(data);
    } catch { }
  }, [orderRepository, restaurantId, tableNumber]);

  useEffect(() => {
    fetchOrders();
    fetchTableOrders();
  }, [fetchOrders, fetchTableOrders]);

  useEffect(() => {
    if (orders.length === 0 && tableOrders.length === 0) return;
    const timer = setInterval(() => {
      fetchOrders();
      fetchTableOrders();
    }, pollInterval);
    return () => clearInterval(timer);
  }, [orders.length, tableOrders.length, fetchOrders, fetchTableOrders, pollInterval]);

  const submitOrder = useCallback(async (cart, tNumber) => {
    if (!customerId) throw new Error('Sesión expirada. Por favor identifícate de nuevo.');
    setSubmitting(true);
    try {
      const newOrder = await placeOrder(orderRepository, {
        restaurantId,
        customerId,
        tableNumber: tNumber,
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

  const requestTableBill = useCallback(async () => {
    if (!customerId) throw new Error('Sesión expirada. Por favor identifícate de nuevo.');
    await requestTableBillUseCase(orderRepository, restaurantId, tableNumber, customerId);
    await fetchTableOrders();
  }, [orderRepository, restaurantId, tableNumber, customerId, fetchTableOrders]);

  const refetchAll = useCallback(async () => {
    await fetchOrders();
    await fetchTableOrders();
  }, [fetchOrders, fetchTableOrders]);

  return {
    orders,
    tableOrders,
    submitting,
    submitOrder,
    confirmPayment,
    updateStatus,
    requestBill,
    requestTableBill,
    refetch: refetchAll,
  };
};
