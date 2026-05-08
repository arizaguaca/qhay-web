import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, ShoppingBag, LogOut, Loader2, Info, Clock, CheckCircle2, ArrowLeft, Plus, Minus, User, Bell, ChevronDown, Settings, Pizza, Coffee, IceCream, Grape, Beef, Salad, Search, ChevronUp, Loader, Wallet, Check } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import CustomerVerification from '../components/CustomerVerification';
import { useCustomerVerification } from '../hooks/useCustomerVerification';
import { useCustomerOrders } from '../hooks/useOrders';
import { useMenu } from '../hooks/useMenu';
import { menuRepository } from '../../data/repositories/menuRepository';
import { orderRepository } from '../../data/repositories/orderRepository';
import { resolveImageUrl } from '../../data/api/httpClient';
import { ORDER_STATUS_META, isActiveOrder } from '../../core/entities/Order';
import { formatCurrency } from '../utils/formatter';
import ItemDetailModal from '../components/PublicMenu/ItemDetailModal';
import CallWaiterButton from '../components/PublicMenu/CallWaiterButton';
import BillRequestBar from '../components/PublicMenu/BillRequestBar';
import './PublicMenuPage.css';

/**
 * PublicMenuPage — Customer-facing digital menu accessed via QR code.
 * Orchestrates: customer verification → menu display → cart → order placement.
 *
 * @param {{ authRepository: Object, restaurantId: string, tableNumber: string }} props
 */
const PublicMenuPage = ({ authRepository, restaurantId, tableNumber, onBack }) => {
  const { isVerified, getSession, logout } = useCustomerVerification(authRepository);

  const session = getSession();
  const customerId = session.customer_id || session.customer?.CustomerID || session.customer?.id || session.phone || null;
  const { socket, notify, connect, disconnect } = useSocket();

  const { items: menu, categories, loading: menuLoading, error: menuError, refetch: refetchMenu } = useMenu(menuRepository, restaurantId);
  const { orders, submitting, submitOrder, requestBill, refetch: refetchOrders } = useCustomerOrders(
    orderRepository, customerId, restaurantId
  );

  // Real-time Socket Listeners for Customers
  React.useEffect(() => {
    if (!socket || !restaurantId || !customerId) return;

    // Connect with handshake data
    connect(restaurantId);

    // Join rooms for specific restaurant and customer updates
    socket.emit('join_restaurant', restaurantId);
    socket.emit('join_customer', customerId);

    // 1. Listen for order status changes (e.g. "Order Ready")
    socket.on('order_status_update', (data) => {
      console.log('📦 [Socket] Pedido actualizado:', data);
      refetchOrders();

      if (data.status === 'ready') {
        notify('¡Tu pedido está listo!', {
          body: `El pedido #${String(data.id).slice(-4)} ya puede ser retirado.`,
          tag: `order-ready-${data.id}`
        });
      }
    });

    // 2. Listen for menu updates (price changes, stock, etc)
    socket.on('menu_update', () => {
      console.log('📖 [Socket] El menú ha sido actualizado');
      refetchMenu();
    });

    return () => {
      socket.emit('leave_restaurant', restaurantId);
      socket.emit('leave_customer', customerId);
      socket.off('order_status_update');
      socket.off('menu_update');
      disconnect(); // Detener conexión al salir del menú
    };
  }, [socket, restaurantId, customerId, refetchOrders, refetchMenu, notify, connect, disconnect]);

  const [restaurant, setRestaurant] = React.useState(null);
  const [resLoading, setResLoading] = React.useState(true);
  const [cart, setCart] = useState([]);
  const [itemNotes, setItemNotes] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState('all');

  // Load restaurant info on mount
  React.useEffect(() => {
    if (!restaurantId) return;
    import('../../data/repositories/restaurantRepository').then(({ restaurantRepository: repo }) => {
      repo.getById(restaurantId)
        .then(setRestaurant)
        .finally(() => setResLoading(false));
    });
  }, [restaurantId]);

  const addToCart = (itemWithSelections) => {
    setCart((prev) => {
      const optionsKey = (itemWithSelections.selectedOptions || [])
        .map(o => o.optionId)
        .sort()
        .join(',');

      const existingIndex = prev.findIndex((i) =>
        i.id === itemWithSelections.id && i.optionsKey === optionsKey
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + (itemWithSelections.quantity || 1)
        };
        return next;
      }

      return [...prev, { ...itemWithSelections, optionsKey, quantity: itemWithSelections.quantity || 1 }];
    });
  };

  const removeFromCart = (cartItemKey) => {
    setCart((prev) => {
      const existing = prev.find((i) => (i.optionsKey ? `${i.id}-${i.optionsKey}` : i.id) === cartItemKey);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => (i.optionsKey ? `${i.id}-${i.optionsKey}` : i.id) === cartItemKey ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter((i) => (i.optionsKey ? `${i.id}-${i.optionsKey}` : i.id) !== cartItemKey);
    });
  };

  const getQuantity = (id) => cart.filter((i) => i.id === id).reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => {
    const itemBase = i.price * i.quantity;
    const mods = (i.selectedOptions || []).reduce((mSum, opt) => mSum + (opt.extraPrice || 0), 0) * i.quantity;
    return sum + itemBase + mods;
  }, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [cartPulsing, setCartPulsing] = useState(false);
  const [showPaymentToast, setShowPaymentToast] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ show: false, total: 0 });

  const activeOrders   = orders.filter(isActiveOrder);
  const totalActivePrice = activeOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const handleOpenBillModal = () => {
    setPaymentModal({ show: true, total: totalActivePrice });
  };

  const confirmPaymentRequest = async () => {
    setPaymentModal({ show: false, total: 0 });
    setIsRequestingBill(true);
    try {
      await requestBill();
      setShowPaymentToast(true);
      setTimeout(() => setShowPaymentToast(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRequestingBill(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      const cartWithNotes = cart.map((item) => ({
        ...item,
        notes: itemNotes[item.id] || '',
      }));
      await submitOrder(cartWithNotes, tableNumber);
      setCart([]);
      setItemNotes({});
      setIsCartExpanded(false);
    } catch (err) {
      alert(err.message);
    }
  };

  // Pulse effect when cart size changes
  React.useEffect(() => {
    if (cart.length > 0) {
      setCartPulsing(true);
      const timer = setTimeout(() => setCartPulsing(false), 400);
      return () => clearTimeout(timer);
    }
  }, [cart.length]);

  const historyOrders = orders.filter((o) => !isActiveOrder(o));

  const activeCategories = React.useMemo(() => {
    const usedIds = new Set(menu.map(item => item.categoryId));
    return categories.filter(c => usedIds.has(c.id));
  }, [menu, categories]);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  if (!isVerified) {
    return <CustomerVerification authRepository={authRepository} onVerified={() => window.location.reload()} />;
  }

  // Solo mostrar loader si es la carga inicial y no tenemos datos
  if (resLoading || (menuLoading && menu.length === 0)) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a' }}>
        <Loader2 className="spin" size={48} color="var(--primary)" />
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Cargando carta digital...</p>
      </div>
    );
  }

  if (menuError || !restaurant) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a', padding: '2rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <Utensils size={64} color="#f87171" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>¡Ups! No encontramos el local</h2>
          <p style={{ color: 'var(--text-muted)' }}>El enlace parece inválido o el restaurante no está disponible.</p>
        </div>
      </div>
    );
  }

  const groupedMenu = menu.reduce((acc, item) => {
    if (activeCategoryId !== 'all' && item.categoryId !== activeCategoryId) return acc;

    const cat = categories.find(c => c.id === item.categoryId) || { name: 'Otros', id: item.categoryId };
    if (!acc[cat.name]) acc[cat.name] = [];
    acc[cat.name].push(item);
    return acc;
  }, {});

  return (
    <div className="public-menu-container">
      <AnimatePresence>
        {showPaymentToast && (
          <motion.div 
            initial={{ y: -50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -50, opacity: 0, x: '-50%' }}
            className="toast-notification"
          >
            <div className="toast-icon-box">
              <Check size={18} />
            </div>
            <span>El personal ha sido avisado. En un momento traerán tu cuenta.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="menu-top-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.8rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              padding: '0.4rem 0.8rem', borderRadius: '30px', color: 'white', cursor: 'pointer'
            }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem'
            }}>
              {(session.fullName || 'C').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{session.fullName || 'Cliente'}</span>
            <ChevronDown size={16} style={{ opacity: 0.5, transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="glass-card"
                style={{
                  position: 'absolute', top: '120%', right: 0, width: '250px',
                  zIndex: 1000, padding: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Identificado como</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{session.fullName || 'Cliente'}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.phone}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.8rem 0.5rem', borderRadius: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem' }}>
                      <Bell size={18} color={notificationsEnabled ? 'var(--primary)' : 'var(--text-muted)'} />
                      Notificaciones
                    </div>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      style={{
                        width: '40px', height: '22px', borderRadius: '20px',
                        background: notificationsEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                        position: 'absolute', top: '3px', left: notificationsEnabled ? '21px' : '3px',
                        transition: 'all 0.2s'
                      }} />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowHistory(!showHistory);
                      setShowUserMenu(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.8rem',
                      padding: '0.8rem 0.5rem', borderRadius: '10px', background: 'transparent',
                      border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left',
                      fontSize: '0.9rem', width: '100%', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Clock size={18} color="var(--text-muted)" />
                    {showHistory ? 'Ocultar Historial' : 'Ver Historial de pedidos'}
                  </button>

                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.8rem',
                      padding: '0.8rem 0.5rem', borderRadius: '10px', background: 'transparent',
                      border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left',
                      fontSize: '0.9rem', fontWeight: '800', width: '100%', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={18} />
                    Cerrar sesión
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Restaurant Hero */}
      <div className="menu-hero">
        <div className="hero-bg-wrapper">
          <img src={resolveImageUrl(restaurant.bannerUrl) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000'} className="hero-bg-image" alt="banner" />
        </div>
        <div className="hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="restaurant-logo-container">
              <img src={resolveImageUrl(restaurant.logoUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=200'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="logo" />
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="restaurant-title" style={{ fontSize: '2.5rem', margin: 0, WebkitTextFillColor: 'white', background: 'none' }}>{restaurant.name}</h1>
              {tableNumber && (
                <div className="table-badge" style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Utensils size={14} />
                  <span>Mesa {tableNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active orders and history */}
      <div className="menu-sections-wrapper">
        <div className="orders-grid">
          <AnimatePresence mode="popLayout">
            {activeOrders.map((order, idx) => {
              const meta = ORDER_STATUS_META[order.status] || { name: order.status, color: 'var(--border)' };
              const flow = ['pending', 'preparing', 'ready', 'delivered'];
              const currentStepIndex = flow.indexOf(order.status);
              const progressWidth = currentStepIndex === -1 ? 0 : (currentStepIndex / (flow.length - 1)) * 100;

              const statusToRgb = {
                pending: '245, 158, 11',
                preparing: '59, 130, 246',
                ready: '59, 130, 246',
                delivered: '139, 92, 246',
                payment_requested: '236, 72, 153'
              };

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{
                    opacity: 1, y: 0, scale: 1,
                    transition: { type: 'spring', damping: 20, stiffness: 100 }
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  className={`glass-card active-order-card ${order.status === 'preparing' ? 'breathing-bg' : ''}`}
                  style={{
                    '--glow-color': `${meta.color}40`,
                    padding: '1.75rem',
                    marginBottom: 0,
                    border: `1px solid ${meta.color}40`,
                    boxShadow: `0 10px 30px -10px ${meta.color}30`
                  }}
                >
                  {/* Glowing perimeter effect */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 'inherit',
                    boxShadow: `inset 0 0 20px ${meta.color}15`, pointerEvents: 'none'
                  }} />

                  <div className="order-header" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="order-icon-box" style={{
                        background: `${meta.color}20`,
                        padding: '0.6rem', borderRadius: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {order.status === 'ready' ? (
                          <Bell size={22} color={meta.color} className="bounce-animation" />
                        ) : (
                          <ShoppingBag size={22} color={meta.color} />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.5px' }}>PEDIDO #{idx + 1}</span>
                          {order.status === 'ready' && <div className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>ID: {String(order.id).slice(-8).toUpperCase()}</span>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.span
                        key={order.status}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        style={{
                          padding: '0.4rem 0.9rem', borderRadius: '30px',
                          fontSize: '0.7rem', fontWeight: '900',
                          background: `${meta.color}25`, color: meta.color,
                          border: `1px solid ${meta.color}40`,
                          letterSpacing: '0.5px'
                        }}
                      >
                        {meta.name.toUpperCase()}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <div className="order-items-container" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {order.items?.map((it, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                              <span style={{ color: 'var(--primary)', marginRight: '4px' }}>{it.quantity}x</span> {it.menuItemName}
                            </span>
                            {it.modifiers?.length > 0 && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {it.modifiers.map(m => m.name).join(', ')}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
                            ${formatCurrency((Number(it.unitPrice || 0) + (it.modifiers || []).reduce((s, m) => s + Number(m.price || 0), 0)) * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL PAGADO</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white' }}>${formatCurrency(order.totalPrice || 0)}</span>
                    </div>
                  </div>

                  {/* Dynamic Progress Timeline */}
                  <div className="order-tracker-container">
                    <div className="tracker-bar-bg">
                      <div className="tracker-bar-fill" style={{ width: `${progressWidth}%`, background: meta.color, boxShadow: `0 0 10px ${meta.color}40` }} />
                      {flow.map((step, sIdx) => (
                        <div
                          key={step}
                          className={`tracker-step ${sIdx <= currentStepIndex ? 'completed' : ''} ${sIdx === currentStepIndex ? 'active' : ''}`}
                          style={{
                            ...(sIdx <= currentStepIndex ? { borderColor: meta.color, background: meta.color } : {}),
                            ...(sIdx === currentStepIndex ? { '--node-glow-rgb': statusToRgb[step] } : {})
                          }}
                        >
                          <span className="step-label" style={sIdx === currentStepIndex ? { color: 'white' } : {}}>
                            {ORDER_STATUS_META[step].name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {historyOrders.length > 0 && (
          <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
            <button onClick={() => setShowHistory(!showHistory)} className="history-toggle-btn">
              {showHistory ? 'Ocultar Historial' : `Ver Historial (${historyOrders.length})`}
            </button>
          </div>
        )}

        {showHistory && (
          <div className="orders-grid">
            {historyOrders.map((order) => (
              <motion.div key={order.id} className="history-card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: order.status === 'paid' ? '#4ade80' : '#f87171', fontWeight: '900', fontSize: '0.85rem' }}>
                      {order.status === 'paid' ? 'COBRADO ✓' : 'CANCELADO ✗'}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Ticket: {String(order.id).slice(-4)}</div>
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>${formatCurrency(order.totalPrice || 0)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}


        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1rem' }}>{restaurant.description}</p>
      </div>

      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        {/* Category Sticky Scroller */}
        <div className="category-scroller-container no-scrollbar">
          <div className="category-flex-wrapper no-scrollbar">
            <button
              onClick={() => setActiveCategoryId('all')}
              className={`category-pill ${activeCategoryId === 'all' ? 'active' : ''}`}
            >
              {activeCategoryId === 'all' && (
                <motion.div layoutId="activePill" className="active-pill-bg" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
              )}
              <Utensils size={18} />
              Todos
            </button>
            {activeCategories.map((cat) => {
              const IconComponent = {
                'Entradas': Salad,
                'Platos Fuertes': Beef,
                'Bebidas': Coffee,
                'Postres': IceCream,
                'Pizzas': Pizza,
                'Vinos': Grape
              }[cat.name] || Utensils;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`category-pill ${activeCategoryId === cat.id ? 'active' : ''}`}
                >
                  {activeCategoryId === cat.id && (
                    <motion.div layoutId="activePill" className="active-pill-bg" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                  )}
                  <IconComponent size={18} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeCategoryId}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
          >
            {Object.keys(groupedMenu).map((catName) => (
              <div key={catName} style={{ marginBottom: '3rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  marginBottom: '1.5rem', 
                  color: 'white',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem'
                }}>
                  <div style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }} />
                  {catName}
                </h3>
                
                <div className="menu-customer-grid">
                  {groupedMenu[catName].map((item) => (
                    <motion.div
                      key={item.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                      }}
                      className={`menu-item-card ${!item.isAvailable ? 'unavailable-item' : ''}`}
                      onClick={() => item.isAvailable && setSelectedItem(item)}
                    >
                      <div className="aspect-16-9">
                        <img
                          src={resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=500'}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className="floating-price-badge">
                          ${formatCurrency(item.price)}
                        </div>
                      </div>

                      <div style={{ padding: '1.25rem', paddingBottom: '2rem', position: 'relative' }}>
                        <h4 className="item-card-title">{item.name}</h4>
                        <p className="item-card-desc">
                          {item.description}
                        </p>
                        
                        <motion.button 
                          whileTap={item.isAvailable ? { scale: 0.85 } : {}}
                          className="circular-add-btn"
                          disabled={!item.isAvailable}
                          onClick={(e) => {
                            e.stopPropagation();
                            if(item.isAvailable) setSelectedItem(item);
                          }}
                        >
                          <Plus size={24} strokeWidth={3} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Cart Drawer */}
      <AnimatePresence>
        {cart.length > 0 && (
          <div className="floating-cart-bar">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: isCartExpanded ? 0 : "calc(100% - 100px)" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="floating-cart-panel"
            >
              <div 
                className="cart-handle-area" 
                onClick={() => setIsCartExpanded(!isCartExpanded)}
                style={{ cursor: 'pointer', paddingBottom: '0.5rem' }}
              >
                <div className="cart-handle" />
                {!isCartExpanded && (
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', marginTop: '-4px' }}>
                    Toca para ver tu pedido
                  </div>
                )}
              </div>

              <div className="cart-items-list no-scrollbar">
                <AnimatePresence mode="popLayout">
                  {cart.map((item) => {
                    const itemKey = item.optionsKey ? `${item.id}-${item.optionsKey}` : item.id;
                    const modsPrice = (item.selectedOptions || []).reduce((sum, opt) => sum + (opt.extraPrice || 0), 0);
                    
                    return (
                      <motion.div 
                        key={itemKey}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="cart-item-row"
                      >
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.name}</div>
                          {item.selectedOptions?.length > 0 && (
                            <div className="cart-item-modifiers">
                              {item.selectedOptions.map(opt => opt.name).join(', ')}
                            </div>
                          )}
                          <textarea
                            placeholder="Nota: ej. sin cebolla..."
                            className="cart-note-textarea no-scrollbar"
                            value={itemNotes[item.id] || ''}
                            onChange={(e) => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onFocus={() => setIsCartExpanded(true)}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                          <span style={{ fontWeight: '800', color: 'var(--primary)' }}>
                            ${formatCurrency((item.price + modsPrice) * item.quantity)}
                          </span>
                          <div className="qty-control" style={{ margin: 0, padding: '0.4rem', gap: '1rem' }}>
                            <motion.button 
                              whileTap={{ scale: 0.85 }}
                              onClick={() => removeFromCart(itemKey)} 
                              className="qty-btn" 
                              style={{ background: 'rgba(255,255,255,0.1)' }}
                            >
                              <Minus size={16} />
                            </motion.button>
                            
                            <div className="counter-wrapper">
                              <AnimatePresence mode="wait">
                                <motion.span 
                                  key={item.quantity}
                                  initial={{ y: 10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: -10, opacity: 0 }}
                                  className="counter-number"
                                >
                                  {item.quantity}
                                </motion.span>
                              </AnimatePresence>
                            </div>

                            <motion.button 
                              whileTap={{ scale: 0.85 }}
                              onClick={() => addToCart(item)} 
                              className="qty-btn" 
                              style={{ background: 'var(--primary)' }}
                            >
                              <Plus size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="cart-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className={`cart-icon-circle ${cartPulsing ? 'cart-pulse-animation' : ''}`}>
                      <ShoppingBag size={24} color="black" />
                      <div className="cart-qty-badge">{totalItems}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL ESTIMADO</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white' }}>${formatCurrency(cartTotal)}</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="btn-primary"
                  style={{ 
                    width: '100%', height: '56px', borderRadius: '18px', 
                    fontSize: '1.1rem', fontWeight: '900',
                    boxShadow: '0 10px 25px rgba(var(--primary-rgb), 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem'
                  }}
                >
                  {submitting ? (
                    <Loader size={22} className="spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={22} />
                      Pedir Ahora
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paymentModal.show && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPaymentModal({ show: false, total: 0 })}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card"
              style={{ 
                width: '100%', maxWidth: '400px', position: 'relative', 
                padding: '2rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.2)'
              }}>
                <Wallet size={32} />
              </div>
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem' }}>¿Solicitar cuenta?</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
                Se notificará al personal para traer la cuenta por un total de <br/>
                <span style={{ color: 'white', fontWeight: '900', fontSize: '1.4rem' }}>${formatCurrency(paymentModal.total)}</span>
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setPaymentModal({ show: false, total: 0 })}
                  style={{ 
                    flex: 1, padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.05)',
                    color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmPaymentRequest}
                  style={{ 
                    flex: 1, padding: '1rem', borderRadius: '14px', background: 'var(--primary)',
                    color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(var(--primary-rgb), 0.3)'
                  }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onConfirm={addToCart}
      />

      {/* Bill request bar: only when cart is empty so it doesn't clash with the cart drawer */}
      <AnimatePresence>
        {cart.length === 0 && (
          <BillRequestBar
            activeOrders={activeOrders}
            onRequestBill={handleOpenBillModal}
            isRequesting={isRequestingBill}
          />
        )}
      </AnimatePresence>

      {/* CallWaiterButton floats above the bill bar when it is visible */}
      <CallWaiterButton
        restaurantId={restaurantId}
        tableNumber={tableNumber}
        customerId={customerId}
        billBarVisible={cart.length === 0 && activeOrders.length > 0}
      />
    </div>
  );
};

export default PublicMenuPage;
