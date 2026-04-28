import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, ShoppingBag, LogOut, Loader2, Info, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import CustomerVerification from '../components/CustomerVerification';
import { useCustomerVerification } from '../hooks/useCustomerVerification';
import { useCustomerOrders } from '../hooks/useOrders';
import { useMenu } from '../hooks/useMenu';
import { menuRepository } from '../../data/repositories/menuRepository';
import { orderRepository } from '../../data/repositories/orderRepository';
import { resolveImageUrl } from '../../data/api/httpClient';
import { ORDER_STATUS_META, isActiveOrder } from '../../core/entities/Order';
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
  const { orders, submitting, submitOrder, confirmPayment } = useCustomerOrders(
    orderRepository, customerId, restaurantId
  );

  const [restaurant, setRestaurant] = React.useState(null);
  const [resLoading, setResLoading] = React.useState(true);
  const [cart, setCart] = useState([]);
  const [itemNotes, setItemNotes] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  // Load restaurant info on mount
  React.useEffect(() => {
    if (!restaurantId) return;
    import('../../data/repositories/restaurantRepository').then(({ restaurantRepository: repo }) => {
      repo.getById(restaurantId)
        .then(setRestaurant)
        .finally(() => setResLoading(false));
    });
  }, [restaurantId]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing && existing.quantity > 1) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.id !== item.id);
    });
  };

  const getQuantity = (id) => cart.find((i) => i.id === id)?.quantity ?? 0;
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
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

  const activeOrders = orders.filter(isActiveOrder);
  const historyOrders = orders.filter((o) => !isActiveOrder(o));

  const groupedMenu = menu.reduce((acc, item) => {
    const cat = categories.find(c => c.id === item.categoryId) || { name: 'Otros', id: item.categoryId };
    if (!acc[cat.name]) acc[cat.name] = [];
    acc[cat.name].push(item);
    return acc;
  }, {});

  return (
    <div className="public-menu-container">
      <div className="menu-top-nav">
        {onBack && (
          <button onClick={onBack} className="back-btn" title="Volver">
            <ArrowLeft size={20} />
          </button>
        )}
        <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
          <LogOut size={20} />
        </button>
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
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{it.quantity}x {it.menuItemName || 'Plato'}</span>
                        <span>${(it.unitPrice * it.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="total-row">
                      <span>Total:</span>
                      <span style={{ color: 'white' }}>${(order.totalPrice || 0).toLocaleString()}</span>
                    </div>

                    {order.status === 'delivered' && (
                      <button
                        onClick={() => { if (confirm(`¿Confirmas el pago de $${(order.totalPrice || 0).toLocaleString()}?`)) confirmPayment(order.id); }}
                        className="pay-btn"
                      >
                        PAGAR
                      </button>
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
                    <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>${(order.totalPrice || 0).toLocaleString()}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}


        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1rem' }}>{restaurant.description}</p>
      </div>

      {/* Menu items */}
      <div style={{ padding: '1.5rem' }}>
        <h2 className="menu-section-title">Nuestra Carta</h2>
        <div style={{ marginLeft: '1.2rem', marginBottom: '2rem', marginTop: '-1rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', opacity: 0.9 }}>{restaurant.name}</span>
          {tableNumber && (
            <span style={{ marginLeft: '0.8rem', color: 'var(--primary)', fontWeight: '800' }}>• Mesa {tableNumber}</span>
          )}
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
                  className="glass-card item-card"
                >
                  <div className="item-img-box">
                    <img
                      src={resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=200'}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 className="item-name-h3">{item.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>{item.description}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="item-price-span">${item.price}</span>
                        {item.isAvailable !== false ? (
                          <div className="qty-control">
                            <button onClick={() => removeFromCart(item)} className="qty-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>-</button>
                            <span style={{ fontWeight: 'bold', minWidth: '15px', textAlign: 'center' }}>{getQuantity(item.id)}</span>
                            <button onClick={() => addToCart(item)} className="qty-btn" style={{ background: 'var(--primary)' }}>+</button>
                          </div>
                        ) : (
                          <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: '700' }}>AGOTADO</span>
                        )}
                      </div>
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
                {cart.map((cartItem) => (
                  <div key={cartItem.id} className="cart-item-row">
                    <div className="cart-item-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="cart-item-name">{cartItem.quantity}x {cartItem.name}</span>
                        <span className="cart-item-price">${(cartItem.price * cartItem.quantity).toLocaleString()}</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Nota: ej. sin cebolla, extra salsa..."
                        value={itemNotes[cartItem.id] || ''}
                        onChange={(e) => setItemNotes(prev => ({ ...prev, [cartItem.id]: e.target.value }))}
                        className="cart-note-input"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart footer */}
              <div className="cart-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div className="cart-icon-circle">
                    <ShoppingBag size={20} color="white" />
                    <span className="cart-qty-badge">{totalItems}</span>
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: '900', margin: 0 }}>${cartTotal.toLocaleString()}</p>
                </div>
                <button onClick={handlePlaceOrder} disabled={submitting} className="btn-primary" style={{ padding: '0.7rem 1.8rem', borderRadius: '20px' }}>
                  {submitting ? <Loader2 className="spin" size={18} /> : 'Pedir Ahora'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicMenuPage;
