import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '../../hooks/useOrders';
import { useSocket } from '../../context/SocketContext';
import { orderRepository } from '../../../data/repositories/orderRepository';
import { mapOrder } from '../../../data/mappers/apiMappers';
import { formatCurrency } from '../../utils/formatter';
import { Wallet, Receipt, CheckCircle, Clock, Search, History, X, AlertCircle, Users } from 'lucide-react';

/**
 * CashierManager — specialized view for the Cashier role.
 * Focused on financial reconciliation, payment requests, pre-billing, and transaction history.
 */
const CashierManager = ({ restaurantId, currentUser }) => {
  const { orders, loading, changeStatus, refetch, addOrUpdateOrder } = useOrders(orderRepository, restaurantId);
  const { socket, notify, connect, disconnect } = useSocket();
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  // Socket Listeners for Cashier
  React.useEffect(() => {
    if (!socket || !restaurantId) return;

    // 1. Escuchar Nuevos Pedidos (para actualizar totales de mesa)
    socket.on('new_order', (data) => {
      console.log('💰 [Socket] Nuevo pedido en caja:', data);
      const orderData = data.order || data;
      addOrUpdateOrder(mapOrder(orderData));
    });

    // 2. Escuchar Actualizaciones (ej: Solicitud de Pago)
    socket.on('order_status_update', (data) => {
      console.log('🔄 [Socket] Estado actualizado en caja:', data);
      const orderData = data.order || data;
      const mapped = mapOrder(orderData);
      addOrUpdateOrder(mapped);
      
      if (mapped.status === 'payment_requested') {
        notify(`Mesa ${mapped.tableNumber} solicita la cuenta`, {
          body: 'Un cliente está esperando para pagar.',
          tag: `payment-req-${mapped.id}`
        });
      }
    });

    return () => {
      socket.off('new_order');
      socket.off('order_status_update');
    };
  }, [socket, restaurantId, addOrUpdateOrder, notify]);

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
  const currentSelectedTable = selectedTableNumber ? tableData[selectedTableNumber] : null;

  const getTableStyle = (status) => {
    switch (status) {
      case 'esperando_cuenta':
        return { bg: '#10b981', border: '#059669', color: 'white', text: 'Solicita Cuenta', alert: true };
      case 'ocupada':
        return { bg: '#1c1917', border: 'rgba(0,0,0,0.1)', color: '#a8a29e', text: 'Ocupada', alert: false };
      default:
        return { bg: '#E3F2FD', border: 'rgba(0,0,0,0.05)', color: '#57534e', text: 'Libre', alert: false };
    }
  };

  // Auto-close modal if no active orders remain
  React.useEffect(() => {
    if (selectedTableNumber) {
      const table = tableData[selectedTableNumber];
      const activeInTable = table?.orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled') || [];
      if (activeInTable.length === 0) {
        setSelectedTableNumber(null);
      }
    }
  }, [selectedTableNumber, tableData]);

  const handleMarkPaid = async (orderId) => {
    await changeStatus(orderId, 'paid', currentUser?.id);
  };

  return (
    <div className="cashier-manager" style={{ padding: '1rem 0' }}>
      <div className="menu-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#1c1917' }}>
            <Wallet size={28} color="var(--primary)" /> Control de Caja
          </h3>
          <p style={{ color: '#57534e', fontSize: '0.9rem' }}>Gestión de cobros y facturación de mesas</p>
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
            className="btn-primary"
            onClick={() => setActiveTab('history')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'history' ? 'var(--primary)' : 'transparent', color: activeTab === 'history' ? 'white' : 'var(--primary)', border: '1px solid var(--primary)' }}
          >
            <History size={18} /> Historial
          </button>
            <button
              className="btn-primary"
              onClick={refetch}
              style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none' }}
            >
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
                  onClick={() => hasOrders && setSelectedTableNumber(table.tableNumber)}
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
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: hasOrders ? 'white' : '#1c1917', margin: 0 }}>
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
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1917', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
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
        {currentSelectedTable && activeTab === 'active' && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '1rem' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            >
              <button onClick={() => setSelectedTableNumber(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', padding: '0.5rem', color: '#1c1917', cursor: 'pointer', transition: 'background 0.2s' }}>
                <X size={20} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#1c1917' }}>Mesa {currentSelectedTable.tableNumber}</h2>
                <p style={{ color: '#57534e' }}>Pre-cuenta y Facturación</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {(() => {
                  const ordersToDisplay = currentSelectedTable.orders.filter(o => o.status !== 'paid');
                  // Group orders by customerId
                  const groupedByCustomer = {};
                  ordersToDisplay.forEach(o => {
                    const cid = o.customerId || 'default';
                    if (!groupedByCustomer[cid]) {
                      groupedByCustomer[cid] = {
                        customerId: cid,
                        orders: [],
                        totalPrice: 0,
                        hasRequestedBill: false,
                        customerName: o.customerName || 'Cliente'
                      };
                    }
                    groupedByCustomer[cid].orders.push(o);
                    groupedByCustomer[cid].totalPrice += (o.totalPrice || 0);
                    if (o.status === 'payment_requested') {
                      groupedByCustomer[cid].hasRequestedBill = true;
                    }
                  });

                  return Object.values(groupedByCustomer).map(customerGroup => (
                    <div key={customerGroup.customerId} style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      border: customerGroup.hasRequestedBill ? '1px solid rgba(16, 185, 129, 0.4)' : '1px dashed rgba(255,255,255,0.15)', 
                      borderRadius: '16px', 
                      padding: '1.5rem',
                      boxShadow: customerGroup.hasRequestedBill ? '0 0 15px rgba(16, 185, 129, 0.1)' : 'none'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <Users size={18} color="var(--primary)" />
                          <span style={{ fontWeight: '900', color: '#1c1917', fontSize: '1.1rem' }}>{customerGroup.customerName}</span>
                        </div>
                        {customerGroup.hasRequestedBill && (
                          <span style={{ background: '#10b981', color: 'white', fontSize: '0.75rem', fontWeight: '800', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>PAGO SOLICITADO</span>
                        )}
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        {customerGroup.orders.map(order => (
                          <div key={order.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '0.8rem', color: '#57534e', marginBottom: '0.5rem', fontWeight: 'bold' }}>Ticket #{String(order.id).slice(0, 5)}</div>
                            {(order.items || []).map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#1c1917', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                <span>{item.quantity}x {item.menuItemName}</span>
                                <span>${formatCurrency(item.unitPrice * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-muted)' }}>Total Cliente</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#10b981' }}>${formatCurrency(customerGroup.totalPrice)}</div>
                      </div>

                      {customerGroup.hasRequestedBill ? (
                        <button
                          onClick={async () => {
                            // Marcar como pagados todos los pedidos de este cliente en esta mesa
                            for (const order of customerGroup.orders) {
                              await handleMarkPaid(order.id);
                            }
                          }}
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
                        <div style={{ 
                          marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', 
                          background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', 
                          textAlign: 'center', fontWeight: '700', fontSize: '0.9rem',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          El cliente aún no ha solicitado la cuenta
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CashierManager;
