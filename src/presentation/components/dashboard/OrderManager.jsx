import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, Loader2, Utensils, MessageSquareText, Bell } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { orderRepository } from '../../../data/repositories/orderRepository';
import { ORDER_STATUS_META } from '../../../core/entities/Order';
import { formatCurrency } from '../../utils/formatter';

/**
 * OrderManager — Real-time order monitoring for restaurant staff.
 * Uses useOrders hook with 30-second polling.
 *
 * @param {{ restaurantId: string }} props
 */
const OrderManager = ({ restaurantId }) => {
  const { orders, loading, error, refetch, changeStatus } = useOrders(orderRepository, restaurantId);

  const statusList = Object.entries(ORDER_STATUS_META).map(([id, meta]) => ({ id, ...meta }));

  return (
    <div className="order-manager">
      <div className="menu-header">
        <div>
          <h3>Monitor de Pedidos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Seguimiento en tiempo real de las órdenes actuales</p>
        </div>
        <button className="btn-primary" onClick={refetch} style={{ padding: '0.5rem 1rem' }}>
          <Clock size={18} /> Actualizar
        </button>
      </div>

      {error && (
        <div style={{ margin: '1rem 0', padding: '1rem', borderRadius: '12px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', color: '#f87171', fontSize: '0.9rem' }}>
          Error: {error}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 className="spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {orders.map((order, idx) => {
            if (!order) return null;
            const statusMeta = ORDER_STATUS_META[order.status] || { name: order.status || 'Desconocido', color: 'var(--border)' };
            const isPaymentRequested = order.status === 'payment_requested';
            
            return (
              <div
                key={order.id || idx}
                className={`glass-card order-card ${isPaymentRequested ? 'payment-alert' : ''}`}
                style={{ 
                  padding: '1.5rem', 
                  borderLeft: `6px solid ${statusMeta.color}`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {isPaymentRequested && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    background: '#ec4899', color: 'white',
                    padding: '0.3rem 1rem', fontSize: '0.75rem', fontWeight: '900',
                    borderBottomLeftRadius: '12px', display: 'flex',
                    alignItems: 'center', gap: '0.4rem', zIndex: 10
                  }}>
                    <Bell size={14} className="shake" />
                    SOLICITA PAGO
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={20} color={isPaymentRequested ? '#ec4899' : 'var(--primary)'} />
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Mesa {order.tableNumber || 'S.N.'}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>#{String(order.id || '').slice(0, 5) || idx}</span>
                </div>

                <div className="order-items" style={{ marginBottom: '1.5rem' }}>
                  {(order.items || []).map((item, i) => (
                    <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>
                          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{item.quantity}x</span> {item.menuItemName || 'Plato'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>${formatCurrency((item.unitPrice || 0) * (item.quantity || 1))}</span>
                      </div>
                      {item.modifiers?.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', paddingLeft: '1.2rem' }}>
                          {item.modifiers.map(m => `+ ${m.name}`).join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ 
                          marginTop: '0.4rem', padding: '0.5rem 0.8rem', 
                          background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', color: '#fbbf24',
                          display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
                        }}>
                          <MessageSquareText size={15} style={{ flexShrink: 0, marginTop: '1px' }} /> {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', marginTop: '1rem', fontWeight: '900', fontSize: '1.2rem', color: 'var(--primary)' }}>
                    Total: ${formatCurrency(order.totalPrice || 0)}
                  </div>
                </div>

                <div className="order-actions">
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Estado de la Orden</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {statusList.map((state) => (
                      <button
                        key={state.id}
                        onClick={() => changeStatus(order.id, state.id)}
                        style={{
                          padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem',
                          cursor: 'pointer', border: '1px solid var(--border)',
                          background: order.status === state.id ? state.color : 'transparent',
                          color: order.status === state.id ? '#000' : 'var(--text-muted)',
                          fontWeight: 'bold', transition: 'all 0.2s ease'
                        }}
                      >
                        {state.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {orders.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px dashed var(--border)' }}>
          <Utensils size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
          <h4>Sin pedidos activos</h4>
          <p style={{ color: 'var(--text-muted)' }}>Cuando los clientes escaneen el QR y ordenen, aparecerán aquí.</p>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
