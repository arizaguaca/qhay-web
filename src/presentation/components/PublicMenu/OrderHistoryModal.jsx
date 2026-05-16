import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, History } from 'lucide-react';
import { formatCurrency } from '../../utils/formatter';
import { getAllPaidOrdersByCustomer } from '../../../core/use-cases/order.use-cases';
import { orderRepository } from '../../../data/repositories/orderRepository';
import { restaurantRepository } from '../../../data/repositories/restaurantRepository';
import './OrderHistoryModal.css';

/**
 * OrderHistoryModal — Shows the customer's paid orders grouped by restaurant, looking like a paper receipt.
 */
const OrderHistoryModal = ({ isOpen, onClose, customerId }) => {
  const [groupedOrders, setGroupedOrders] = useState({});
  const [restaurantsMap, setRestaurantsMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isOpen || !customerId) return;
      setLoading(true);
      try {
        const historyOrders = await getAllPaidOrdersByCustomer(orderRepository, customerId);
        
        // Group by restaurant
        const grouped = {};
        const restIds = new Set();
        
        historyOrders.forEach(order => {
          if (!grouped[order.restaurantId]) {
            grouped[order.restaurantId] = [];
            restIds.add(order.restaurantId);
          }
          grouped[order.restaurantId].push(order);
        });
        
        setGroupedOrders(grouped);

        // Fetch restaurant names
        const rMap = {};
        for (const rId of restIds) {
          try {
            const rest = await restaurantRepository.getById(rId);
            rMap[rId] = rest?.name || `Restaurante ${rId}`;
          } catch {
            rMap[rId] = `Restaurante ${rId}`;
          }
        }
        setRestaurantsMap(rMap);
      } catch (err) {
        console.error("Error fetching order history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="history-modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="history-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="history-modal-header">
            <h2 className="history-modal-title">
              <History size={24} />
              Historial de Pedidos
            </h2>
            <button className="history-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="history-modal-content no-scrollbar">
            {loading ? (
              <div className="history-empty">
                Cargando historial...
              </div>
            ) : Object.keys(groupedOrders).length === 0 ? (
              <div className="history-empty">
                <Receipt size={48} opacity={0.5} />
                <p>Aún no tienes pedidos completados.</p>
              </div>
            ) : (
              Object.entries(groupedOrders).map(([restId, orders]) => (
                <div key={restId}>
                  {orders.map((order, idx) => {
                    const date = new Date(order.createdAt || Date.now());
                    
                    return (
                      <div key={order.id} className="receipt-card">
                        <div className="receipt-header">
                          <div className="receipt-divider"></div>
                          <div className="receipt-shop-name">{restaurantsMap[restId]}</div>
                          <div className="receipt-divider"></div>
                        </div>

                        {order.items?.map((item, itemIdx) => {
                          const itemTotal = (Number(item.unitPrice || 0) + 
                            (item.modifiers || []).reduce((sum, mod) => sum + Number(mod.price || 0), 0)) * item.quantity;
                            
                          return (
                            <React.Fragment key={itemIdx}>
                              <div className="receipt-item">
                                <div className="receipt-item-left">
                                  <span className="receipt-item-qty">{item.quantity}x</span>
                                  <span className="receipt-item-name">{item.menuItemName}</span>
                                </div>
                                <span className="receipt-item-price">${formatCurrency(itemTotal)}</span>
                              </div>
                              {item.modifiers?.map((mod, mIdx) => (
                                <div key={mIdx} className="receipt-modifiers">
                                  + {mod.name}
                                </div>
                              ))}
                            </React.Fragment>
                          );
                        })}

                        <div className="receipt-totals">
                          <div className="receipt-divider-dashed"></div>
                          <div className="receipt-total-row">
                            <span className="receipt-total-label">TOTAL</span>
                            <span>${formatCurrency(order.totalPrice || 0)}</span>
                          </div>
                          <div className="receipt-divider-dashed"></div>
                        </div>

                        <div className="receipt-date">
                          {date.toLocaleDateString()} {date.toLocaleTimeString()}
                          <br />
                          Mesa {order.tableNumber} | Orden #{String(order.id).slice(-4).toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderHistoryModal;
