import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, Loader2, Utensils, MessageSquareText, Bell, CheckCircle2, CalendarDays, History } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useOrders } from '../../hooks/useOrders';
import { orderRepository } from '../../../data/repositories/orderRepository';
import { mapOrder } from '../../../data/mappers/apiMappers';
import { ORDER_STATUS_META } from '../../../core/entities/Order';
import { formatCurrency } from '../../utils/formatter';

/**
 * OrderManager — Real-time order monitoring for restaurant staff.
 * Split into two sections:
 *   1. Active: Today's orders or any non-finalized (non-paid) orders
 *   2. Completed: Finalized (paid) orders grouped by day
 *
 * @param {{ restaurantId: string, currentUser: Object }} props
 */
const OrderManager = ({ restaurantId, currentUser }) => {
  const { orders, loading, error, refetch, changeStatus, addOrUpdateOrder } = useOrders(orderRepository, restaurantId);
  const { socket, notify } = useSocket();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'

  // Socket Listeners for Order Monitoring
  React.useEffect(() => {
    if (!socket || !restaurantId) return;

    // 1. Escuchar Nuevos Pedidos
    socket.on('new_order', (data) => {
      console.log('📦 [Socket] Nuevo pedido:', data);
      const orderData = data.order || data;
      addOrUpdateOrder(mapOrder(orderData));

      notify(`Nuevo Pedido - Mesa ${orderData.tableNumber || orderData.table_number}`, {
        body: 'Se ha recibido una nueva orden.',
        tag: `new-order-${orderData.id}`
      });
    });

    // 2. Escuchar Actualizaciones (ej: Solicitud de Pago)
    socket.on('order_status_update', (data) => {
      console.log('🔄 [Socket] Estado actualizado:', data);
      const orderData = data.order || data;
      addOrUpdateOrder(mapOrder(orderData));

      const mapped = mapOrder(orderData);
      if (mapped.status === 'payment_requested') {
        notify(`Pago solicitado - Mesa ${mapped.tableNumber}`, {
          body: 'El cliente ha solicitado la cuenta.',
          tag: `payment-req-${mapped.id}`
        });
      }
    });

    return () => {
      socket.off('new_order');
      socket.off('order_status_update');
    };
  }, [socket, restaurantId, addOrUpdateOrder, notify]);

  const statusList = Object.entries(ORDER_STATUS_META).map(([id, meta]) => ({ id, ...meta }));

  // ── Separate orders into active and completed ──────────────────────────────
  const { activeOrders, completedGrouped, completedCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = [];
    const completed = [];

    orders.forEach(order => {
      if (!order) return;
      if (order.status === 'paid' || order.status === 'cancelled') {
        completed.push(order);
      } else {
        active.push(order);
      }
    });

    // Sort active: most recent first
    active.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    // Sort completed: most recent first
    completed.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    // Group completed by day → then by table within each day
    const groupedByDay = {};
    completed.forEach(order => {
      const d = order.createdAt ? new Date(order.createdAt) : new Date();
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groupedByDay[dayKey]) groupedByDay[dayKey] = {};

      const tableKey = order.tableNumber || 'S/N';
      if (!groupedByDay[dayKey][tableKey]) groupedByDay[dayKey][tableKey] = [];
      groupedByDay[dayKey][tableKey].push(order);
    });

    return { activeOrders: active, completedGrouped: groupedByDay, completedCount: completed.length };
  }, [orders]);

  // ── Helper: Format day key to readable label ───────────────────────────────
  const formatDayLabel = (dayKey) => {
    const [y, m, d] = dayKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) return 'Hoy';
    if (date.getTime() === yesterday.getTime()) return 'Ayer';

    return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ── Render a single order card ─────────────────────────────────────────────
  const renderOrderCard = (order, idx, showActions = true) => {
    const statusMeta = ORDER_STATUS_META[order.status] || { name: order.status || 'Desconocido', color: 'var(--border)' };
    const isPaymentRequested = order.status === 'payment_requested';
    const isPaid = order.status === 'paid';

    if (isPaid) {
      return (
        <div
          key={order.id || idx}
          className="receipt-card"
          style={{
            background: '#ffffff',
            color: '#111827',
            padding: '1.5rem 1.5rem 2rem 1.5rem',
            borderRadius: '12px 12px 0 0',
            position: 'relative',
            overflow: 'visible',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          {/* Items List */}
          <div className="order-items" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(order.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: '#1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ flex: 1, paddingRight: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{item.quantity}x</span> 
                    {item.menuItemName || 'Plato'}
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#111827' }}>
                    ${formatCurrency((item.unitPrice || 0) * (item.quantity || 1))}
                  </span>
                </div>
                {item.modifiers?.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', paddingLeft: '1.2rem', marginTop: '0.1rem' }}>
                    {item.modifiers.map(m => `+ ${m.name}`).join(', ')}
                  </div>
                )}
                {item.notes && (
                  <div style={{ 
                    marginTop: '0.3rem', padding: '0.3rem 0.6rem', 
                    background: '#f3f4f6', borderRadius: '4px', 
                    fontSize: '0.7rem', color: '#4b5563',
                    display: 'flex', alignItems: 'center', gap: '0.3rem'
                  }}>
                    <MessageSquareText size={11} /> {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Divider before total */}
          <div style={{ borderTop: '1px dashed #9ca3af', margin: '0.5rem 0 0 0' }} />

          {/* Total section (double thick line border simulation) */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            margin: '0.2rem 0',
            padding: '0.6rem 0',
            borderTop: '2px solid #111827',
            borderBottom: '2px solid #111827',
          }}>
            <span style={{ fontWeight: '900', fontSize: '1.2rem', color: '#111827', letterSpacing: '1px' }}>TOTAL</span>
            <span style={{ fontWeight: '900', fontSize: '1.3rem', color: '#111827' }}>
              ${formatCurrency(order.totalPrice || 0)}
            </span>
          </div>

          {/* Jagged / wavy paper bottom border */}
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            left: 0,
            width: '100%',
            height: '10px',
            backgroundRepeat: 'repeat-x',
            backgroundSize: '16px 10px',
            backgroundImage: 'linear-gradient(-45deg, transparent 8px, #ffffff 8px), linear-gradient(45deg, transparent 8px, #ffffff 8px)',
            zIndex: 5
          }} />
        </div>
      );
    }

    return (
      <div
        key={order.id || idx}
        className={`glass-card order-card ${isPaymentRequested ? 'payment-alert' : ''}`}
        style={{
          padding: '1.5rem',
          borderLeft: `6px solid ${statusMeta.color}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          opacity: isPaid ? 0.75 : 1,
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

        {isPaid && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            background: '#1E4620', color: 'white',
            padding: '0.3rem 1rem', fontSize: '0.75rem', fontWeight: '900',
            borderBottomLeftRadius: '12px', display: 'flex',
            alignItems: 'center', gap: '0.4rem', zIndex: 10
          }}>
            <CheckCircle2 size={14} />
            PAGADO
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color={isPaymentRequested ? '#ec4899' : isPaid ? '#1E4620' : 'var(--primary)'} />
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Mesa {order.tableNumber || 'S.N.'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>#{String(order.id || '').slice(0, 5) || idx}</span>
            {order.createdAt && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {new Date(order.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
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
          <div style={{ textAlign: 'right', marginTop: '1rem', fontWeight: '900', fontSize: '1.2rem', color: isPaid ? '#1E4620' : 'var(--primary)' }}>
            Total: ${formatCurrency(order.totalPrice || 0)}
          </div>
        </div>

        {showActions && !isPaid && (
          <div className="order-actions">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Estado de la Orden</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {statusList.map((state) => (
                <button
                  key={state.id}
                  onClick={() => changeStatus(order.id, state.id, currentUser?.id)}
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
        )}
      </div>
    );
  };

  return (
    <div className="order-manager">
      {/* Header */}
      <div className="menu-header">
        <div>
          <h3>Monitor de Pedidos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Seguimiento en tiempo real de las órdenes</p>
        </div>
        <button className="btn-primary" onClick={refetch} style={{ padding: '0.5rem 1rem' }}>
          <Clock size={18} /> Actualizar
        </button>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '2rem', marginTop: '1rem',
        background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            flex: 1, padding: '0.7rem 1.2rem', borderRadius: '10px',
            background: activeTab === 'active' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'active' ? 'white' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Package size={18} /> Activos
          {activeOrders.length > 0 && (
            <span style={{
              background: activeTab === 'active' ? 'rgba(255,255,255,0.25)' : 'rgba(var(--primary-rgb), 0.2)',
              color: activeTab === 'active' ? 'white' : 'var(--primary)',
              padding: '0.1rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900'
            }}>
              {activeOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            flex: 1, padding: '0.7rem 1.2rem', borderRadius: '10px',
            background: activeTab === 'completed' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'completed' ? 'white' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            transition: 'all 0.2s ease'
          }}
        >
          <History size={18} /> Finalizados
          {completedCount > 0 && (
            <span style={{
              background: activeTab === 'completed' ? 'rgba(255,255,255,0.25)' : 'rgba(30, 70, 32, 0.15)',
              color: activeTab === 'completed' ? 'white' : '#1E4620',
              padding: '0.1rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900'
            }}>
              {completedCount}
            </span>
          )}
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
        <AnimatePresence mode="wait">
          {/* ── TAB: Activos ────────────────────────────────────────────────── */}
          {activeTab === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px dashed var(--border)' }}>
                  <Utensils size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
                  <h4>Sin pedidos activos</h4>
                  <p style={{ color: 'var(--text-muted)' }}>Cuando los clientes escaneen el QR y ordenen, aparecerán aquí.</p>
                </div>
              ) : (
                <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {activeOrders.map((order, idx) => renderOrderCard(order, idx, true))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── TAB: Finalizados (agrupados por día) ───────────────────────── */}
          {activeTab === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {Object.keys(completedGrouped).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px dashed var(--border)' }}>
                  <CheckCircle2 size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
                  <h4>Sin pedidos finalizados</h4>
                  <p style={{ color: 'var(--text-muted)' }}>Los pedidos pagados aparecerán aquí agrupados por día.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  {Object.entries(completedGrouped).map(([dayKey, tableGroups]) => {
                    const allDayOrders = Object.values(tableGroups).flat();
                    const dayTotal = allDayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
                    const tableKeys = Object.keys(tableGroups).sort((a, b) => Number(a) - Number(b));

                    return (
                      <div key={dayKey}>
                        {/* Day header */}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          marginBottom: '1.2rem', paddingBottom: '0.8rem',
                          borderBottom: '2px solid rgba(255,255,255,0.08)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <div style={{
                              background: 'rgba(var(--primary-rgb), 0.15)', padding: '0.5rem',
                              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <CalendarDays size={20} color="var(--primary)" />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', textTransform: 'capitalize' }}>
                                {formatDayLabel(dayKey)}
                              </h4>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {allDayOrders.length} {allDayOrders.length === 1 ? 'pedido' : 'pedidos'} • {tableKeys.length} {tableKeys.length === 1 ? 'mesa' : 'mesas'}
                              </span>
                            </div>
                          </div>
                          <div style={{
                            background: 'rgba(30, 70, 32, 0.1)', border: '1px solid rgba(30, 70, 32, 0.3)',
                            padding: '0.4rem 1rem', borderRadius: '10px',
                            color: '#1E4620', fontWeight: '900', fontSize: '1.1rem'
                          }}>
                            ${formatCurrency(dayTotal)}
                          </div>
                        </div>

                        {/* Tables within this day */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '0.5rem' }}>
                          {tableKeys.map(tableNum => {
                            const tableOrders = tableGroups[tableNum];
                            const tableTotal = tableOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

                            return (
                              <div key={tableNum}>
                                {/* Table sub-header */}
                                <div style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  marginBottom: '1rem', paddingBottom: '0.5rem',
                                  borderBottom: '1px dashed rgba(255,255,255,0.06)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Package size={16} color="var(--primary)" />
                                    <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'white' }}>
                                      Mesa {tableNum}
                                    </span>
                                    <span style={{
                                      fontSize: '0.75rem', color: 'var(--text-muted)',
                                      background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.5rem',
                                      borderRadius: '6px'
                                    }}>
                                      {tableOrders.length} {tableOrders.length === 1 ? 'pedido' : 'pedidos'}
                                    </span>
                                  </div>
                                  <span style={{ fontWeight: '800', color: '#1E4620', fontSize: '0.95rem' }}>
                                    ${formatCurrency(tableTotal)}
                                  </span>
                                </div>

                                {/* Orders for this table */}
                                <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                                  {tableOrders.map((order, idx) => renderOrderCard(order, idx, false))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default OrderManager;
