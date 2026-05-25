import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useOrders } from '../../hooks/useOrders';
import { orderRepository } from '../../../data/repositories/orderRepository';
import { mapOrder } from '../../../data/mappers/apiMappers';
import { Clock, ChefHat, AlertCircle, CheckCircle2, PlayCircle, UtensilsCrossed } from 'lucide-react';

/**
 * KDSManager (Kitchen Display System) — Read-only + state action view for Cooks.
 * Prioritizes FIFO ordering, displays notes clearly, and tracks time elapsed.
 */
const KDSManager = ({ restaurantId, currentUser }) => {
  const { orders, loading, changeStatus, refetch, addOrUpdateOrder } = useOrders(orderRepository, restaurantId, ['pending', 'preparing']);
  const { socket, notify, connect, disconnect } = useSocket();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Socket Listeners for Kitchen (FIFO)
  useEffect(() => {
    if (!socket || !restaurantId) return;

    // Escuchar nuevas órdenes para la cocina
    socket.on('new_order', (data) => {
      console.log('🍳 [Socket] Nueva comanda recibida:', data);
      const orderData = data.order || data;
      addOrUpdateOrder(mapOrder(orderData)); // Actualizar localmente sin refetch

      notify(`Nueva Orden - Mesa ${orderData.tableNumber || orderData.table_number}`, {
        body: 'Hay una nueva comanda pendiente en cocina.',
        tag: `new-order-${orderData.id}`
      });
    });

    return () => {
      socket.off('new_order');
    };
  }, [socket, restaurantId, addOrUpdateOrder, notify]);

  // Update timer every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter only orders relevant to the kitchen and sort FIFO (oldest first)
  // New: Only show orders that have at least one item requiring preparation (prepTime > 0)
  const kitchenOrders = orders
    .filter(o => (o.status === 'pending' || o.status === 'preparing') && (o.items || []).some(item => (item.prepTime || 0) > 0))
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : parseInt(a.id);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : parseInt(b.id);
      return dateA - dateB;
    });

  const getElapsedMinutes = (createdAt) => {
    if (!createdAt) return 0;
    const orderTime = new Date(createdAt).getTime();
    return Math.max(0, Math.floor((currentTime - orderTime) / 60000));
  };

  return (
    <div className="kds-manager" style={{ padding: '1rem 0' }}>
      <div className="menu-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#1c1917' }}>
            <ChefHat size={28} color="var(--primary)" /> Kitchen Display System
          </h3>
          <p style={{ color: '#57534e', fontSize: '0.9rem' }}>Vista FIFO para preparación de comandos</p>
        </div>
        <button className="btn-primary" onClick={refetch} style={{ padding: '0.5rem 1rem' }}>
          <Clock size={18} /> Sincronizar
        </button>
      </div>

      {/* Daily Metrics Banner */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px', background: '#1c1917', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
          <span style={{ color: '#a8a29e', fontSize: '0.9rem', fontWeight: '600' }}>Pendientes</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>{orders.filter(o => o.status === 'pending' && (o.items || []).some(i => (i.prepTime || 0) > 0)).length}</span>
        </div>
        <div style={{ flex: 1, minWidth: '150px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#3b82f6', fontSize: '0.9rem', fontWeight: '600' }}>En Preparación</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#3b82f6' }}>{orders.filter(o => o.status === 'preparing' && (o.items || []).some(i => (i.prepTime || 0) > 0)).length}</span>
        </div>
        <div style={{ flex: 1, minWidth: '150px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: '600' }}>Listos</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981' }}>{orders.filter(o => o.status === 'ready').length}</span>
        </div>
      </div>

      {loading && kitchenOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <ChefHat className="spin" size={32} color="var(--primary)" />
        </div>
      ) : kitchenOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '2px dashed rgba(0,0,0,0.1)' }}>
          <CheckCircle2 size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h4 style={{ color: '#1c1917' }}>Sin comandas pendientes</h4>
          <p style={{ color: '#57534e' }}>La cocina está al día. ¡Buen trabajo!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <AnimatePresence>
            {kitchenOrders.map((order, idx) => {
              // Mocking createdAt for old orders that might not have it in dev environment
              const orderDate = order.createdAt || new Date(Date.now() - (idx * 5 * 60000)).toISOString();
              const elapsedMinutes = getElapsedMinutes(orderDate);
              const isDelayed = elapsedMinutes >= 15; // 15 mins threshold for red alert
              const isWarning = elapsedMinutes >= 10 && elapsedMinutes < 15; // 10 mins threshold for yellow

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: '#1c1917',
                    border: `2px solid ${isDelayed ? '#ef4444' : order.status === 'preparing' ? '#3b82f6' : 'rgba(255,255,255,0.03)'}`,
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: isDelayed ? '0 8px 25px rgba(239, 68, 68, 0.2)' : '0 10px 30px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* KDS Header */}
                  <div style={{
                    padding: '1rem',
                    background: isDelayed ? '#ef4444' : order.status === 'preparing' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', fontWeight: '900', color: isDelayed ? 'white' : 'var(--primary)' }}>
                        Mesa {order.tableNumber || 'S/N'}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: isDelayed ? 'rgba(255,255,255,0.8)' : '#a8a29e' }}>
                        Ticket #{String(order.id).slice(0, 5)}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '20px',
                      color: isDelayed ? 'white' : isWarning ? '#fbbf24' : '#10b981', fontWeight: '800'
                    }}>
                      <Clock size={16} />
                      {elapsedMinutes} min
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                    {(order.items || []).map((item, i) => (
                      <div key={i} style={{ marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                          <span style={{
                            background: 'var(--primary)', color: 'white', fontWeight: '900',
                            padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '1.1rem'
                          }}>
                            {item.quantity}x
                          </span>
                          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', lineHeight: '1.4' }}>
                            {item.menuItemName}
                          </span>
                        </div>

                        {/* Modifiers */}
                        {item.modifiers?.length > 0 && (
                          <div style={{ marginLeft: '2.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {item.modifiers.map((mod, idx) => (
                              <div key={idx} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%' }} />
                                {mod.name}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Customer Notes */}
                        {item.notes && (
                          <div style={{
                            marginLeft: '2.5rem', marginTop: '0.8rem', padding: '0.6rem',
                            background: 'rgba(239, 68, 68, 0.15)', borderLeft: '3px solid #ef4444',
                            borderRadius: '0 8px 8px 0', fontSize: '0.9rem', color: '#fca5a5', fontWeight: '600',
                            display: 'flex', gap: '0.5rem'
                          }}>
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => changeStatus(order.id, 'preparing', currentUser?.id)}
                        style={{
                          width: '100%', padding: '1rem', borderRadius: '12px',
                          background: '#3b82f6', color: 'white', fontWeight: '900', fontSize: '1.1rem',
                          border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                        }}
                      >
                        <PlayCircle size={20} /> Empezar a Preparar
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => changeStatus(order.id, 'ready', currentUser?.id)}
                        style={{
                          width: '100%', padding: '1rem', borderRadius: '12px',
                          background: '#10b981', color: 'white', fontWeight: '900', fontSize: '1.1rem',
                          border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        <UtensilsCrossed size={20} /> Marcar Listo
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default KDSManager;
