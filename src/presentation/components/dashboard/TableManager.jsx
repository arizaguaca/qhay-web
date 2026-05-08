import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useOrders } from '../../hooks/useOrders';
import { orderRepository } from '../../../data/repositories/orderRepository';
import { apiFetch } from '../../../data/api/httpClient';
import { formatCurrency } from '../../utils/formatter';
import { Package, BellRing, Wallet, CheckCircle2, Clock, X, Check, Utensils, LayoutGrid, Users } from 'lucide-react';

/* ─── SVG Circular Progress Ring ─── */
const ProgressRing = ({ elapsed, maxMinutes = 45, size = 32 }) => {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(elapsed / maxMinutes, 1);
  const offset = circumference * (1 - progress);
  const color = progress >= 0.8 ? '#ef4444' : progress >= 0.5 ? '#fbbf24' : '#10b981';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={color}
        fontSize={size * 0.28} fontWeight="800" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {elapsed}
      </text>
    </svg>
  );
};

/* ─── Table shape configs ─── */
const TABLE_SHAPES = {
  round:  { borderRadius: '50%', width: '140px', height: '140px', aspectRatio: '1/1' },
  square: { borderRadius: '18px', width: '140px', height: '140px', aspectRatio: '1/1' },
  long:   { borderRadius: '18px', width: '100%', height: 'auto', minHeight: '100px', gridColumn: 'span 2' },
};

/* ─── Simulated layout — can be replaced by API config ─── */
const TABLE_CONFIG = [
  { id: 1, type: 'round' }, { id: 2, type: 'round' }, { id: 3, type: 'square' }, { id: 4, type: 'square' },
  { id: 5, type: 'long' },  { id: 6, type: 'round' }, { id: 7, type: 'round' },  { id: 8, type: 'square' },
  { id: 9, type: 'square' },{ id: 10, type: 'long' }, { id: 11, type: 'round' }, { id: 12, type: 'round' },
  { id: 13, type: 'square' },{ id: 14, type: 'square' },{ id: 15, type: 'long' }, { id: 16, type: 'round' },
];

/**
 * TableManager — Premium visual grid map of restaurant tables for Waiters/Managers/Owners.
 * Supports dynamic shapes (round, square, long), service request alerts,
 * circular wait-time indicators, customer avatars, and Glassmorphism aesthetics.
 */
const TableManager = ({ restaurantId }) => {
  const { orders, loading, changeStatus, refetch, addOrUpdateOrder } = useOrders(orderRepository, restaurantId);
  const { socket, notify, connect, disconnect } = useSocket();
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  const [filter, setFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [serviceRequests, setServiceRequests] = useState([]);

  const fetchServiceRequests = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const response = await apiFetch(`/restaurants/${restaurantId}/service-requests?status=pending`);
      if (response.ok) {
        const data = await response.json();
        setServiceRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching service requests:', err);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  // Socket Listeners for Real-time Dashboard
  useEffect(() => {
    if (!socket || !restaurantId) return;

    // Connect with handshake data
    connect(restaurantId);

    // Join restaurant room (backup if server doesn't use handshake for room)
    socket.emit('join_restaurant', restaurantId);

    // 1. Escuchar Llamados al Mesero (Assistance)
    socket.on('call_waiter', (newRequest) => {
      console.log('🔔 [Socket] Nuevo llamado:', newRequest);
      setServiceRequests(prev => {
        if (prev.find(r => r.id === newRequest.id)) return prev;
        return [newRequest, ...prev];
      });
      
      // Feedback visual y sonoro
      notify(`Mesa ${newRequest.tableNumber} solicita atención`, {
        body: 'El cliente está esperando asistencia.',
        tag: `call-${newRequest.id}`
      });
    });

    // 2. Escuchar Actualizaciones de Pedidos
    socket.on('order_status_update', (updatedOrder) => {
      console.log('📦 [Socket] Pedido actualizado:', updatedOrder);
      // Actualizar el estado local vía hook si lo soporta, o refetch
      if (addOrUpdateOrder) {
        addOrUpdateOrder(updatedOrder);
      } else {
        refetch();
      }
    });

    return () => {
      socket.emit('leave_restaurant', restaurantId);
      socket.off('call_waiter');
      socket.off('order_status_update');
      disconnect(); // Detener conexión al salir del dashboard
    };
  }, [socket, restaurantId, notify, refetch, connect, disconnect, addOrUpdateOrder]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ─── Process Data ─── */
  const tableData = {};
  TABLE_CONFIG.forEach(cfg => {
    tableData[cfg.id] = { tableNumber: cfg.id.toString(), orders: [], status: 'idle', serviceRequest: null, type: cfg.type, customers: [] };
  });

  orders.forEach(order => {
    const tNum = order.tableNumber;
    if (!tableData[tNum]) {
      tableData[tNum] = { tableNumber: String(tNum), orders: [], status: 'idle', serviceRequest: null, type: 'square', customers: [] };
    }

    if (order.status !== 'paid' && order.status !== 'cancelled') {
      tableData[tNum].orders.push(order);

      // Collect unique customer names for avatar row
      const cName = order.customerName || order.customer_name;
      if (cName && !tableData[tNum].customers.includes(cName)) {
        tableData[tNum].customers.push(cName);
      }

      if (order.status === 'payment_requested') {
        tableData[tNum].status = 'payment';
      } else if (['pending', 'preparing', 'ready', 'delivered'].includes(order.status) && tableData[tNum].status !== 'payment' && tableData[tNum].status !== 'assistance') {
        tableData[tNum].status = 'pending';
      }
    }
  });

  serviceRequests.forEach(sr => {
    const tNum = sr.table_number || sr.tableNumber;
    if (!tableData[tNum]) {
      tableData[tNum] = { tableNumber: String(tNum), orders: [], status: 'idle', serviceRequest: null, type: 'square', customers: [] };
    }
    tableData[tNum].serviceRequest = sr;
    if (tableData[tNum].status !== 'payment') {
      tableData[tNum].status = 'assistance';
    }
  });

  const allTables = Object.values(tableData);
  const currentSelectedTable = selectedTableNumber ? tableData[selectedTableNumber] : null;

  const filteredTables = allTables.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'idle') return t.status === 'idle';
    if (filter === 'occupied') return t.status === 'pending';
    if (filter === 'alert') return t.status === 'assistance' || t.status === 'payment';
    return true;
  });

  const counts = {
    all: allTables.length,
    idle: allTables.filter(t => t.status === 'idle').length,
    occupied: allTables.filter(t => t.status === 'pending').length,
    alert: allTables.filter(t => t.status === 'assistance' || t.status === 'payment').length,
  };

  const getTableColors = (status) => {
    switch (status) {
      case 'payment':
        return { bg: 'rgba(16, 185, 129, 0.08)', border: '#10b981', text: '#10b981', label: 'Pago', icon: <Wallet size={15} /> };
      case 'assistance':
        return { bg: 'rgba(6, 182, 212, 0.08)', border: '#06b6d4', text: '#06b6d4', label: 'Llamada', icon: <BellRing size={15} /> };
      case 'pending':
        return { bg: 'rgba(249, 115, 22, 0.08)', border: '#f97316', text: '#f97316', label: 'Pedido', icon: <Utensils size={15} /> };
      default:
        return { bg: 'rgba(255, 255, 255, 0.02)', border: 'rgba(255, 255, 255, 0.06)', text: 'var(--text-muted)', label: 'Libre', icon: <CheckCircle2 size={15} /> };
    }
  };

  const getElapsedMinutes = (tableOrders) => {
    if (!tableOrders.length) return 0;
    const oldest = tableOrders.reduce((min, o) => {
      const t = o.createdAt ? new Date(o.createdAt).getTime() : Date.now();
      return t < min ? t : min;
    }, Date.now());
    return Math.floor((currentTime - oldest) / 60000);
  };

  const handleDeliverOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Excepción: Si no requiere preparación, se puede entregar aunque esté 'pending'
    const needsPrep = (order.items || []).some(item => (item.prepTime || 0) > 0);
    const canDeliver = order.status === 'ready' || (!needsPrep && order.status === 'pending');

    if (!canDeliver) return;

    await changeStatus(orderId, 'delivered');
    
    // Al usar currentSelectedTable (vinculado a tableData), el popup se refrescará solo.
    if (currentSelectedTable) {
      const remainingActive = currentSelectedTable.orders.filter(o => o.id !== orderId && o.status !== 'delivered');
      if (remainingActive.length === 0 && !currentSelectedTable.serviceRequest) {
        setSelectedTableNumber(null);
      }
    }
  };

  const handleMarkPaid = async (orderId) => { await changeStatus(orderId, 'paid'); setSelectedTableNumber(null); };
  const handleResolveServiceRequest = async (requestId) => {
    try {
      await apiFetch(`/service-requests/${requestId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'resolved' }) });
      await fetchServiceRequests();
      setSelectedTableNumber(null);
    } catch (err) { console.error('Error resolving service request:', err); }
  };

  const filterButtons = [
    { id: 'all', label: 'Todas', icon: <LayoutGrid size={16} /> },
    { id: 'idle', label: 'Libres', icon: <CheckCircle2 size={16} /> },
    { id: 'occupied', label: 'Ocupadas', icon: <Utensils size={16} /> },
    { id: 'alert', label: 'Alertas', icon: <BellRing size={16} /> },
  ];

  /* ─── Keyframe injection for neon border animation ─── */
  const neonKeyframes = `
    @keyframes neonPulse {
      0%, 100% { box-shadow: 0 0 8px #10b981, 0 0 20px rgba(16,185,129,0.3), inset 0 0 10px rgba(16,185,129,0.05); border-color: #10b981; }
      50% { box-shadow: 0 0 20px #10b981, 0 0 40px rgba(16,185,129,0.5), inset 0 0 20px rgba(16,185,129,0.1); border-color: #34d399; }
    }
    @keyframes cyanPulse {
      0%, 100% { box-shadow: 0 0 10px rgba(6,182,212,0.4), 0 0 25px rgba(6,182,212,0.2); }
      50% { box-shadow: 0 0 25px rgba(6,182,212,0.7), 0 0 50px rgba(6,182,212,0.35); }
    }
  `;

  return (
    <div className="table-manager" style={{ padding: '1rem 0' }}>
      <style>{neonKeyframes}</style>

      {/* Header */}
      <div className="menu-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <LayoutGrid size={28} color="var(--primary)" /> Mapa de Mesas
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vista en tiempo real del estado de cada mesa</p>
        </div>
        <button className="btn-primary" onClick={() => { refetch(); fetchServiceRequests(); }} style={{ padding: '0.5rem 1rem' }}>
          <Clock size={18} /> Refrescar
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {filterButtons.map(fb => (
          <button key={fb.id} onClick={() => setFilter(fb.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', borderRadius: '12px',
              background: filter === fb.id ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.03)',
              border: filter === fb.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
              color: filter === fb.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s ease', backdropFilter: 'blur(8px)'
            }}
          >
            {fb.icon} {fb.label}
            <span style={{
              background: filter === fb.id ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
              color: filter === fb.id ? 'white' : 'var(--text-muted)',
              padding: '0.1rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800'
            }}>{counts[fb.id]}</span>
          </button>
        ))}
      </div>

      {/* Table Grid */}
      {loading && allTables.every(t => t.orders.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><Clock className="spin" size={32} color="var(--primary)" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          <AnimatePresence>
            {filteredTables.map((table) => {
              const colors = getTableColors(table.status);
              const shape = TABLE_SHAPES[table.type] || TABLE_SHAPES.square;
              const isOccupied = table.status !== 'idle';
              const elapsed = getElapsedMinutes(table.orders);
              const tableTotal = table.orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

              const dynamicAnimation =
                table.status === 'assistance' ? 'cyanPulse 2s ease-in-out infinite' :
                table.status === 'payment' ? 'neonPulse 2s ease-in-out infinite' : 'none';

              return (
                <motion.button
                  key={table.tableNumber}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => isOccupied && setSelectedTableNumber(table.tableNumber)}
                  style={{
                    ...shape,
                    background: colors.bg,
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${isOccupied ? colors.border : 'rgba(255, 255, 255, 0.1)'}`,
                    padding: table.type === 'long' ? '1rem 1.5rem' : '1rem',
                    display: 'flex',
                    flexDirection: table.type === 'long' ? 'row' : 'column',
                    alignItems: 'center',
                    justifyContent: table.type === 'long' ? 'space-between' : 'center',
                    cursor: isOccupied ? 'pointer' : 'default',
                    position: 'relative', overflow: 'visible',
                    animation: dynamicAnimation,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Customer avatars — top right */}
                  {table.customers.length > 0 && (
                    <div style={{
                      position: 'absolute', top: table.type === 'round' ? '0.3rem' : '0.5rem', right: table.type === 'round' ? '0.3rem' : '0.5rem',
                      display: 'flex', gap: '-0.3rem',
                    }}>
                      {table.customers.slice(0, 3).map((name, idx) => (
                        <div key={idx} style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: `hsl(${(idx * 90 + 30) % 360}, 60%, 50%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem', fontWeight: '800', color: 'white',
                          border: '2px solid rgba(15,23,42,0.8)', marginLeft: idx > 0 ? '-6px' : '0',
                          zIndex: 3 - idx,
                        }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {table.customers.length > 3 && (
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.55rem', fontWeight: '800', color: 'var(--text-muted)',
                          border: '2px solid rgba(15,23,42,0.8)', marginLeft: '-6px',
                        }}>
                          +{table.customers.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Circular progress ring — bottom left */}
                  {isOccupied && (
                    <div style={{ position: 'absolute', bottom: table.type === 'round' ? '0.2rem' : '0.5rem', left: table.type === 'round' ? '0.2rem' : '0.5rem' }}>
                      <ProgressRing elapsed={elapsed} />
                    </div>
                  )}

                  {/* Table content */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', zIndex: 1 }}>
                    <h2 style={{ fontSize: table.type === 'long' ? '1.6rem' : '2rem', fontWeight: '900', color: isOccupied ? 'white' : 'rgba(255,255,255,0.12)', margin: 0, lineHeight: 1 }}>
                      {table.tableNumber}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: colors.text, fontWeight: '700', fontSize: '0.75rem' }}>
                      {colors.icon} {colors.label}
                    </div>
                    {table.orders.length > 0 && (
                      <div style={{
                        marginTop: '0.2rem', background: 'rgba(255,255,255,0.1)',
                        padding: '0.15rem 0.5rem', borderRadius: '8px',
                        fontSize: '0.7rem', fontWeight: '800', color: 'rgba(255,255,255,0.8)',
                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        <Package size={11} /> {table.orders.length} {table.orders.length === 1 ? 'pedido' : 'pedidos'}
                      </div>
                    )}
                  </div>

                  {/* Total — bottom right for long, or badge for others */}
                  {isOccupied && (
                    <div style={{
                      ...(table.type === 'long'
                        ? { fontSize: '1.1rem', fontWeight: '900', color: 'white' }
                        : { position: 'absolute', bottom: table.type === 'round' ? '0.2rem' : '0.5rem', right: table.type === 'round' ? '0.2rem' : '0.5rem',
                            background: 'rgba(0,0,0,0.5)', padding: '0.15rem 0.4rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', color: 'white' })
                    }}>
                      ${formatCurrency(tableTotal)}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Table Details Modal */}
      <AnimatePresence>
        {currentSelectedTable && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '1rem' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            >
              <button onClick={() => setSelectedTableNumber(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '0.5rem', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', marginBottom: '1.5rem' }}>
                Mesa {currentSelectedTable.tableNumber}
              </h2>

              {/* Service Request Alert Banner */}
              {currentSelectedTable.serviceRequest && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid #06b6d4', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#22d3ee', fontWeight: '800' }}>
                      <BellRing size={20} /> Solicitud de Asistencia
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {currentSelectedTable.serviceRequest.created_at ? new Date(currentSelectedTable.serviceRequest.created_at).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleResolveServiceRequest(currentSelectedTable.serviceRequest.id)}
                    style={{
                      width: '100%', padding: '0.8rem', borderRadius: '12px',
                      background: '#06b6d4', color: 'white', fontWeight: '900', fontSize: '1rem',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                      boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)'
                    }}
                  >
                    <Check size={18} strokeWidth={3} /> Finalizar Atención
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {currentSelectedTable.orders.filter(o => o.status !== 'delivered').map(order => (
                  <div key={order.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: '800', color: 'var(--primary)' }}>Ticket #{String(order.id).slice(0,5)}</span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        background: order.status === 'ready' ? '#10b981' : 'rgba(255,255,255,0.08)',
                        color: order.status === 'ready' ? 'white' : 'var(--text-muted)',
                        padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '800'
                      }}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{item.quantity}x {item.menuItemName}</span>
                            {(item.prepTime || 0) === 0 && (
                              <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '800' }}>Instant</span>
                            )}
                          </div>
                          <span>${formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                      <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '1.2rem', color: 'white', marginTop: '1rem' }}>
                        Total: ${formatCurrency(order.totalPrice)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {order.status !== 'payment_requested' && (
                        <button 
                          onClick={() => handleDeliverOrder(order.id)} 
                          disabled={!(() => {
                            const needsPrep = (order.items || []).some(item => (item.prepTime || 0) > 0);
                            return order.status === 'ready' || (!needsPrep && order.status === 'pending');
                          })()}
                          style={{ 
                            flex: 1, padding: '0.8rem', borderRadius: '12px', 
                            background: (() => {
                              const needsPrep = (order.items || []).some(item => (item.prepTime || 0) > 0);
                              const canDeliver = order.status === 'ready' || (!needsPrep && order.status === 'pending');
                              return canDeliver ? 'var(--primary)' : 'rgba(255,255,255,0.05)';
                            })(),
                            color: (() => {
                              const needsPrep = (order.items || []).some(item => (item.prepTime || 0) > 0);
                              const canDeliver = order.status === 'ready' || (!needsPrep && order.status === 'pending');
                              return canDeliver ? 'white' : 'rgba(255,255,255,0.2)';
                            })(),
                            fontWeight: '800', border: 'none', 
                            cursor: (() => {
                              const needsPrep = (order.items || []).some(item => (item.prepTime || 0) > 0);
                              const canDeliver = order.status === 'ready' || (!needsPrep && order.status === 'pending');
                              return canDeliver ? 'pointer' : 'not-allowed';
                            })(),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Check size={18} strokeWidth={3} /> 
                          {(() => {
                            const needsPrep = (order.items || []).some(item => (item.prepTime || 0) > 0);
                            if (order.status === 'ready') return 'Marcar Entregado';
                            if (!needsPrep && order.status === 'pending') return 'Entrega Inmediata';
                            return 'En preparación...';
                          })()}
                        </button>
                      )}
                      
                      {order.status === 'payment_requested' && (
                        <button onClick={() => handleMarkPaid(order.id)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#10b981', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                          <Wallet size={18} strokeWidth={3} /> Cobrar y Cerrar
                        </button>
                      )}
                    </div>
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

export default TableManager;
