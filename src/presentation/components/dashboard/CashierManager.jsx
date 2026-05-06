import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '../../hooks/useOrders';
import { useSocket } from '../../context/SocketContext';
import { orderRepository } from '../../../data/repositories/orderRepository';
import { formatCurrency } from '../../utils/formatter';
import { Wallet, Receipt, CheckCircle, Clock, Search, History, X, AlertCircle } from 'lucide-react';

/**
 * CashierManager — specialized view for the Cashier role.
 * Focused on financial reconciliation, payment requests, pre-billing, and transaction history.
 */
const CashierManager = ({ restaurantId }) => {
  const { orders, loading, changeStatus, refetch, addOrUpdateOrder } = useOrders(orderRepository, restaurantId);
  const { socket, notify, connect, disconnect } = useSocket();
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  // Socket Listeners for Cashier
  React.useEffect(() => {
    if (!socket || !restaurantId) return;

    // Connect with handshake data
    connect(restaurantId);

    socket.emit('join_restaurant', restaurantId);

    // 1. Escuchar Nuevos Pedidos (para actualizar totales de mesa)
    socket.on('new_order', (order) => {
      console.log('💰 [Socket] Nuevo pedido en caja:', order);
      addOrUpdateOrder(order);
    });

    // 2. Escuchar Actualizaciones (ej: Solicitud de Pago)
    socket.on('order_status_update', (data) => {
      console.log('🔄 [Socket] Estado actualizado en caja:', data);
      addOrUpdateOrder(data);
      
      if (data.status === 'payment_requested') {
        notify(`Mesa ${data.tableNumber} solicita la cuenta`, {
          body: 'Un cliente está esperando para pagar.',
          tag: `payment-req-${data.id}`
        });
      }
    });

    return () => {
      socket.emit('leave_restaurant', restaurantId);
      socket.off('new_order');
      socket.off('order_status_update');
      disconnect();
    };
  }, [socket, restaurantId, addOrUpdateOrder, notify, connect, disconnect]);

  // Extract all relevant active and history orders
  const activeOrders = orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled');
  const paidOrders = orders.filter(o => o.status === 'paid').sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 50);

  // Map active tables
  const TOTAL_TABLES = 16;
  const tableData = {};
  for (let i = 1; i <= TOTAL_TABLES; i++) {
    tableData[i] = { tableNumber: i.toString(), orders: [], status: 'libre' };
  }

  activeOrders.forEach(order => {
    const tNum = order.tableNumber;
    if (!tNum) return; // Skip orders without a table number to avoid crashes

    if (!tableData[tNum]) {
      tableData[tNum] = { tableNumber: String(tNum), orders: [], status: 'libre' };
    }
    tableData[tNum].orders.push(order);
    
    if (order.status === 'payment_requested') {
      tableData[tNum].status = 'esperando_cuenta'; // Green alert
    } else if (['pending', 'preparing', 'ready', 'delivered'].includes(order.status) && tableData[tNum].status !== 'esperando_cuenta') {
      tableData[tNum].status = 'ocupada'; // Default occupied
    }
  });

  const activeTablesList = Object.values(tableData);
  const tablesWaitingForBill = activeTablesList.filter(t => t.status === 'esperando_cuenta');

  const getTableStyle = (status) => {
    switch(status) {
      case 'esperando_cuenta':
        return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', color: '#10b981', text: 'Solicita Cuenta', alert: true };
      case 'ocupada':
        return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.5)', color: '#3b82f6', text: 'Ocupada', alert: false };
      default:
        return { bg: 'rgba(255, 255, 255, 0.02)', border: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', text: 'Libre', alert: false };
    }
  };

  const handleMarkPaid = async (orderId) => {
    await changeStatus(orderId, 'paid');
    // If the modal was open and only one order was left, close it
    if (selectedTable && selectedTable.orders.length <= 1) {
      setSelectedTable(null);
    }
  };

  return (
    <div className="cashier-manager" style={{ padding: '1rem 0' }}>
      <div className="menu-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Wallet size={28} color="var(--primary)" /> Control de Caja
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestión de cobros y facturación de mesas</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn-primary ${activeTab !== 'active' ? 'outline' : ''}`}
            onClick={() => setActiveTab('active')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'active' ? 'var(--primary)' : 'transparent', border: '1px solid var(--primary)' }}
          >
            Mesas Activas
          </button>
          <button 
            className={`btn-primary ${activeTab !== 'history' ? 'outline' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'history' ? 'var(--primary)' : 'transparent', border: '1px solid var(--primary)' }}
          >
            <History size={18} /> Historial
          </button>
          <button className="btn-primary" onClick={refetch} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
            <Clock size={18} />
          </button>
        </div>
      </div>

      {activeTab === 'active' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Alertas Rápidas */}
          {tablesWaitingForBill.length > 0 && (
            <div style={{ marginBottom: '2rem', padding: '1rem 1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertCircle color="#10b981" className="shake" />
              <span style={{ color: '#10b981', fontWeight: '800' }}>
                ¡Atención! {tablesWaitingForBill.length} {tablesWaitingForBill.length === 1 ? 'mesa ha' : 'mesas han'} solicitado la cuenta.
              </span>
            </div>
          )}

          {/* Mapa de Mesas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.2rem' }}>
            {activeTablesList.map((table) => {
              const style = getTableStyle(table.status);
              const tableTotal = table.orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
              const hasOrders = table.orders.length > 0;

              return (
                <motion.button
                  key={table.tableNumber}
                  whileHover={hasOrders ? { scale: 1.05 } : {}}
                  whileTap={hasOrders ? { scale: 0.95 } : {}}
                  onClick={() => hasOrders && setSelectedTable(table)}
                  style={{
                    background: style.bg,
                    border: `2px solid ${style.border}`,
                    borderRadius: '16px',
                    padding: '1.2rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: hasOrders ? 'pointer' : 'default',
                    position: 'relative',
                    minHeight: '120px',
                    boxShadow: style.alert ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: hasOrders ? 'white' : 'var(--text-muted)', margin: 0 }}>
                    {table.tableNumber}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: style.color, fontWeight: '700', marginTop: '0.3rem' }}>
                    {style.text}
                  </div>
                  {hasOrders && (
                    <div style={{ marginTop: '0.8rem', fontSize: '0.9rem', fontWeight: '800', color: 'white', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
                      ${formatCurrency(tableTotal)}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paidOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay transacciones recientes.</div>
            ) : (
              paidOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: 'white' }}>Ticket #{String(order.id).slice(0, 5)} - Mesa {order.tableNumber}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {new Date(order.updatedAt || Date.now()).toLocaleTimeString()} • {order.items?.length || 0} ítems
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: '#10b981', fontWeight: '800', fontSize: '1.1rem' }}>${formatCurrency(order.totalPrice)}</span>
                    <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>PAGADO</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Pre-cuenta Modal */}
      <AnimatePresence>
        {selectedTable && activeTab === 'active' && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '1rem' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            >
              <button onClick={() => setSelectedTable(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '0.5rem', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>Mesa {selectedTable.tableNumber}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Pre-cuenta y Facturación</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {selectedTable.orders.filter(o => o.status !== 'paid').map(order => (
                  <div key={order.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ fontWeight: '800', color: 'var(--primary)' }}>Ticket #{String(order.id).slice(0,5)}</span>
                      {order.status === 'payment_requested' && (
                        <span style={{ background: '#10b981', color: 'white', fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>PIDIÓ CUENTA</span>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                          <span>{item.quantity}x {item.menuItemName}</span>
                          <span>${formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px dashed rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>Total</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981' }}>${formatCurrency(order.totalPrice)}</div>
                    </div>

                    {order.status === 'payment_requested' ? (
                      <button 
                        onClick={() => handleMarkPaid(order.id)} 
                        style={{ 
                          width: '100%', marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', 
                          background: '#10b981', color: 'white', fontWeight: '900', fontSize: '1.1rem',
                          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)' 
                        }}
                      >
                        <Receipt size={20} /> Registrar Pago
                      </button>
                    ) : (
                      <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                        La mesa aún no ha solicitado la cuenta
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CashierManager;
