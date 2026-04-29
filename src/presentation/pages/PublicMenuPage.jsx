import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, ShoppingBag, LogOut, Loader2, Info, Clock, CheckCircle2, ArrowLeft, Plus, Minus, User, Bell, ChevronDown, Settings } from 'lucide-react';
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

  const { items: menu, categories, loading: menuLoading, error: menuError } = useMenu(menuRepository, restaurantId);
  const { orders, submitting, submitOrder, confirmPayment, updateStatus } = useCustomerOrders(
    orderRepository, customerId, restaurantId
  );

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
    } catch (err) {
      alert(err.message);
    }
  };

  const activeOrders = orders.filter(isActiveOrder);
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

  if (resLoading || menuLoading) {
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
          <AnimatePresence>
            {activeOrders.map((order, idx) => {
              const meta = ORDER_STATUS_META[order.status] || { name: order.status, color: 'var(--border)' };
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card active-order-card"
                  style={{ borderLeft: `5px solid ${meta.color}`, marginBottom: 0 }}
                >
                  <div className="order-header">
                    <div className="order-info-left">
                      <div className="order-icon-box" style={{ background: `${meta.color}20` }}>
                        <ShoppingBag size={20} color={meta.color} />
                      </div>
                      <div>
                        <span className="order-text-main">PEDIDO #{idx + 1}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket: {String(order.id).slice(-6)}</span>
                      </div>
                    </div>
                    <span className="status-label" style={{ background: meta.color }}>
                      {meta.name.toUpperCase()}
                    </span>
                  </div>

                  <div className="order-details-box">
                    {order.items?.map((it, i) => (
                      <React.Fragment key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{it.quantity}x {it.menuItemName || 'Plato'}</span>
                          <span>${formatCurrency((Number(it.unitPrice || 0) + (it.modifiers || []).reduce((s, m) => s + Number(m.price || 0), 0)) * it.quantity)}</span>
                        </div>
                        {it.modifiers?.length > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-0.2rem', marginBottom: '0.3rem', paddingLeft: '1.2rem' }}>
                            {it.modifiers.map(m => `+ ${m.name}`).join(', ')}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                    <div className="total-row">
                      <span>Total:</span>
                      <span style={{ color: 'white' }}>${formatCurrency(order.totalPrice || 0)}</span>
                    </div>

                    {order.status === 'delivered' && (
                      <button
                        onClick={() => { if (confirm(`¿Solicitar la cuenta por $${formatCurrency(order.totalPrice || 0)}?`)) updateStatus(order.id, 'payment_requested'); }}
                        className="pay-btn"
                        style={{ background: '#ec4899', color: 'white' }}
                      >
                        Solicitar Pago
                      </button>
                    )}

                    {order.status === 'payment_requested' && (
                      <div style={{ 
                        marginTop: '1.2rem', padding: '0.8rem', borderRadius: '12px', 
                        background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', 
                        textAlign: 'center', fontWeight: '900', border: '1px dashed #ec4899'
                      }}>
                        Esperando Cobro...
                      </div>
                    )}
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

      {/* Menu items */}
      <div style={{ padding: '1.5rem' }}>
        {/* Category Scroller */}
        <div style={{ 
          display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '1rem', 
          marginBottom: '2rem', scrollbarWidth: 'none', msOverflowStyle: 'none'
        }} className="no-scrollbar">
          <button
            onClick={() => setActiveCategoryId('all')}
            style={{
              padding: '0.6rem 1.2rem', borderRadius: '12px', whiteSpace: 'nowrap',
              background: activeCategoryId === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: activeCategoryId === 'all' ? 'white' : 'var(--text-muted)',
              border: '1px solid', borderColor: activeCategoryId === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              cursor: 'pointer', transition: 'all 0.3s', fontWeight: '700', fontSize: '0.9rem'
            }}
          >
            Todos
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              style={{
                padding: '0.6rem 1.2rem', borderRadius: '12px', whiteSpace: 'nowrap',
                background: activeCategoryId === cat.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: activeCategoryId === cat.id ? 'white' : 'var(--text-muted)',
                border: '1px solid', borderColor: activeCategoryId === cat.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                cursor: 'pointer', transition: 'all 0.3s', fontWeight: '700', fontSize: '0.9rem'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {Object.keys(groupedMenu).map((catName) => (
          <div key={catName} style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ 
              fontSize: '1.4rem', 
              marginBottom: '1.2rem', 
              color: 'var(--primary)', 
              borderBottom: '2px solid rgba(var(--primary-rgb), 0.2)',
              paddingBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Utensils size={20} />
              {catName}
            </h3>
            
            <div className="menu-customer-grid">
              {groupedMenu[catName].map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-card menu-item-card ${!item.isAvailable ? 'out-of-stock' : ''}`}
                  onClick={() => item.isAvailable && setSelectedItem(item)}
                >
                  <div className="menu-item-image-container">
                    <img
                      src={resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=500'}
                      alt={item.name}
                      className="menu-item-img"
                    />
                    <span className="price-tag">${formatCurrency(item.price)}</span>
                    {!item.isAvailable && (
                      <div className="stock-overlay">
                        <EyeOff size={24} />
                        <span>AGOTADO</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: '800' }}>{item.name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1, lineHeight: '1.4' }}>{item.description}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto' }}>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '10px' }}
                        disabled={!item.isAvailable}
                      >
                        <Plus size={16} />
                        Añadir
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating cart */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="floating-cart-bar">
            <div className="glass-card floating-cart-panel">
              {/* Cart item list */}
              <div className="cart-items-list">
                {cart.map((cartItem, idx) => {
                  const itemKey = cartItem.optionsKey ? `${cartItem.id}-${cartItem.optionsKey}` : cartItem.id;
                  const itemTotal = (cartItem.price + (cartItem.selectedOptions || []).reduce((s, o) => s + o.extraPrice, 0)) * cartItem.quantity;
                  return (
                    <div key={`${itemKey}-${idx}`} className="cart-item-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div className="cart-item-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="cart-item-name" style={{ fontWeight: '800' }}>{cartItem.quantity}x {cartItem.name}</span>
                              <button onClick={() => removeFromCart(itemKey)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: '0 0.5rem', cursor: 'pointer' }}><Minus size={14} /></button>
                              <button onClick={() => addToCart({ ...cartItem, quantity: 1 })} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: '0 0.5rem', cursor: 'pointer' }}><Plus size={14} /></button>
                            </div>
                            {cartItem.selectedOptions?.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', paddingLeft: '1.5rem' }}>
                                {cartItem.selectedOptions.map(o => o.name).join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="cart-item-price" style={{ fontWeight: '800' }}>${formatCurrency(itemTotal)}</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Nota: ej. sin cebolla..."
                          value={itemNotes[`${itemKey}-${idx}`] || ''}
                          onChange={(e) => setItemNotes(prev => ({ ...prev, [`${itemKey}-${idx}`]: e.target.value }))}
                          className="cart-note-input"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart footer */}
              <div className="cart-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div className="cart-icon-circle">
                    <ShoppingBag size={20} color="white" />
                    <span className="cart-qty-badge">{totalItems}</span>
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: '900', margin: 0 }}>${formatCurrency(cartTotal)}</p>
                </div>
                <button onClick={handlePlaceOrder} disabled={submitting} className="btn-primary" style={{ padding: '0.7rem 1.8rem', borderRadius: '20px' }}>
                  {submitting ? <Loader2 className="spin" size={18} /> : 'Pedir Ahora'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ItemDetailModal 
        item={selectedItem} 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)}
        onConfirm={addToCart}
      />
    </div>
  );
};

export default PublicMenuPage;
