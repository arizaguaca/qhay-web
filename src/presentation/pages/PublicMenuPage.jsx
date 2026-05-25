import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  LogOut,
  Loader2,
  Bell,
  ChevronDown,
  Pizza,
  Coffee,
  IceCream,
  Grape,
  Beef,
  Salad,
  Plus,
  Clock,
  Receipt,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import CustomerVerification from '../components/CustomerVerification';
import { useCustomerVerification } from '../hooks/useCustomerVerification';
import { useCustomerOrders } from '../hooks/useOrders';
import { useMenu } from '../hooks/useMenu';
import { useCartManager } from '../hooks/useCartManager';
import { menuRepository } from '../../data/repositories/menuRepository';
import { orderRepository } from '../../data/repositories/orderRepository';
import { resolveImageUrl } from '../../data/api/httpClient';
import { isActiveOrder } from '../../core/entities/Order';
import { formatCurrency } from '../utils/formatter';
import ItemDetailModal from '../components/PublicMenu/ItemDetailModal';
import OrderHistoryModal from '../components/PublicMenu/OrderHistoryModal';
import CartDrawer from '../components/PublicMenu/CartDrawer';
import ActiveOrdersPanel from '../components/PublicMenu/ActiveOrdersPanel';
import CallWaiterButton from '../components/PublicMenu/CallWaiterButton';
import './PublicMenuPage.css';

const CATEGORY_ICONS = {
  Entradas: Salad,
  'Platos Fuertes': Beef,
  Bebidas: Coffee,
  Postres: IceCream,
  Pizzas: Pizza,
  Vinos: Grape,
};

/**
 * PublicMenuPage — Customer-facing digital menu accessed via QR code.
 *
 * Acts as the top-level orchestrator for the public menu experience:
 * wires hooks (menu, orders, cart) to presentation components and
 * manages socket subscriptions and restaurant data loading.
 *
 * @param {{ authRepository: Object, restaurantId: string, tableNumber: string }} props
 */
const PublicMenuPage = ({ authRepository, restaurantId, tableNumber }) => {
  const { isVerified, getSession, logout } = useCustomerVerification(authRepository);

  const session = getSession();
  const customerId =
    session.customer_id ||
    session.customer?.CustomerID ||
    session.customer?.id ||
    session.phone ||
    null;

  const { socket, notify, connect, disconnect } = useSocket();

  const {
    items: menu,
    categories,
    loading: menuLoading,
    error: menuError,
    refetch: refetchMenu,
  } = useMenu(menuRepository, restaurantId);

  const { orders, tableOrders, submitting, submitOrder, requestBill, requestTableBill, refetch: refetchOrders, fetchTableOrders } =
    useCustomerOrders(orderRepository, customerId, restaurantId, tableNumber);

  const {
    cart,
    itemNotes,
    setItemNotes,
    isCartExpanded,
    setIsCartExpanded,
    cartPulsing,
    cartTotal,
    totalItems,
    addToCart,
    removeFromCart,
    clearCart,
  } = useCartManager();

  const [restaurant, setRestaurant] = React.useState(null);
  const [resLoading, setResLoading] = React.useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [isOrdersPanelExpanded, setIsOrdersPanelExpanded] = useState(false);

  // ── Socket subscriptions ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (!socket || !restaurantId || !customerId) return;

    connect(restaurantId);
    socket.emit('join_restaurant', restaurantId);
    socket.emit('join_customer', customerId);

    socket.on('order_status_update', (data) => {
      console.log('📦 [Socket] Pedido actualizado:', data);
      refetchOrders();
      if (data.status === 'ready') {
        notify('¡Tu pedido está listo!', {
          body: `El pedido #${String(data.id).slice(-4)} ya puede ser retirado.`,
          tag: `order-ready-${data.id}`,
        });
      }
    });

    socket.on('menu_update', () => {
      console.log('📖 [Socket] El menú ha sido actualizado');
      refetchMenu();
    });

    return () => {
      socket.emit('leave_restaurant', restaurantId);
      socket.emit('leave_customer', customerId);
      socket.off('order_status_update');
      socket.off('menu_update');
      disconnect();
    };
  }, [socket, restaurantId, customerId, refetchOrders, refetchMenu, notify, connect, disconnect]);

  // ── Restaurant info ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!restaurantId) return;
    import('../../data/repositories/restaurantRepository').then(
      ({ restaurantRepository: repo }) => {
        repo
          .getById(restaurantId)
          .then(setRestaurant)
          .finally(() => setResLoading(false));
      }
    );
  }, [restaurantId]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeOrders = orders.filter(isActiveOrder);

  const activeCategories = React.useMemo(() => {
    const usedIds = new Set(menu.map((item) => item.categoryId));
    return categories.filter((c) => usedIds.has(c.id));
  }, [menu, categories]);

  const groupedMenu = menu.reduce((acc, item) => {
    if (activeCategoryId !== 'all' && item.categoryId !== activeCategoryId) return acc;
    const cat = categories.find((c) => c.id === item.categoryId) || {
      name: 'Otros',
      id: item.categoryId,
    };
    if (!acc[cat.name]) acc[cat.name] = [];
    acc[cat.name].push(item);
    return acc;
  }, {});

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      const cartWithNotes = cart.map((item) => ({
        ...item,
        notes: itemNotes[item.id] || '',
      }));
      await submitOrder(cartWithNotes, tableNumber);
      clearCart();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!isVerified) {
    return (
      <CustomerVerification
        authRepository={authRepository}
        onVerified={() => window.location.reload()}
      />
    );
  }

  if (resLoading || (menuLoading && menu.length === 0)) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#0f172a',
        }}
      >
        <Loader2 className="spin" size={48} color="var(--primary)" />
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Cargando carta digital...
        </p>
      </div>
    );
  }

  if (menuError || !restaurant) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#0f172a',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div className="glass-card" style={{ padding: '2rem' }}>
          <Utensils size={64} color="#f87171" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>
            ¡Ups! No encontramos el local
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            El enlace parece inválido o el restaurante no está disponible.
          </p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="public-menu-container">
      {/* ── Restaurant hero ── */}
      <div className="menu-hero">
        <div className="hero-bg-wrapper">
          <img
            src={
              resolveImageUrl(restaurant.bannerUrl) ||
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000'
            }
            className="hero-bg-image"
            alt="banner"
          />
        </div>
        <div className="hero-content">
          <div className="hero-content-flex">
            <div className="hero-left-group">
              <div className="restaurant-logo-container">
                <img
                  src={
                    resolveImageUrl(restaurant.logoUrl) ||
                    'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=200'
                  }
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt="logo"
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 className="restaurant-title" style={{ margin: 0 }}>
                  {restaurant.name}
                </h1>
                {tableNumber && (
                  <div
                    className="table-badge"
                    style={{
                      marginTop: '0.4rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Utensils size={13} />
                    <span>Mesa {tableNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Dropdown inside Hero */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="profile-btn-container"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '30px',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {(session.fullName || 'C').charAt(0).toUpperCase()}
                </div>
                <span className="profile-btn-text" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  {session.fullName || 'Cliente'}
                </span>
                <span className="profile-btn-chevron" style={{ display: 'flex', alignItems: 'center' }}>
                  <ChevronDown
                    size={15}
                    style={{
                      opacity: 0.8,
                      transform: showUserMenu ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  />
                </span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: '120%',
                      right: 0,
                      width: '250px',
                      zIndex: 1000,
                      padding: '1rem',
                      background: '#ffffff',
                      borderRadius: '20px',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      color: '#1c1917',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Identificado como
                      </p>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem', color: '#1c1917' }}>
                        {session.fullName || 'Cliente'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {session.phone}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.8rem 0.5rem',
                          borderRadius: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            fontSize: '0.9rem',
                          }}
                        >
                          <Bell
                            size={18}
                            color={notificationsEnabled ? 'var(--primary)' : 'var(--text-muted)'}
                          />
                          Notificaciones
                        </div>
                        <button
                          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                          style={{
                            width: '40px',
                            height: '22px',
                            borderRadius: '20px',
                            background: notificationsEnabled
                              ? 'var(--primary)'
                              : '#e5e7eb',
                            border: 'none',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: 'white',
                              position: 'absolute',
                              top: '3px',
                              left: notificationsEnabled ? '21px' : '3px',
                              transition: 'all 0.2s',
                            }}
                          />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setShowHistory(true);
                          setShowUserMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.8rem',
                          padding: '0.8rem 0.5rem',
                          borderRadius: '10px',
                          background: 'transparent',
                          border: 'none',
                          color: '#1c1917',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          fontWeight: '800',
                          width: '100%',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        <Receipt size={18} />
                        Historial de pedidos
                      </button>

                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.8rem',
                          padding: '0.8rem 0.5rem',
                          borderRadius: '10px',
                          background: 'transparent',
                          border: 'none',
                          color: '#e11d48',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          fontWeight: '800',
                          width: '100%',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(225, 29, 72, 0.08)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
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
        </div>
      </div>



      {/* ── Menu: categories + products ── */}
      <div style={{ padding: '0 1.5rem 8rem' }}>
        {/* Sticky category pills */}
        <div className="category-scroller-container no-scrollbar">
          <div className="category-flex-wrapper no-scrollbar">
            <button
              onClick={() => setActiveCategoryId('all')}
              className={`category-pill ${activeCategoryId === 'all' ? 'active' : ''}`}
            >
              {activeCategoryId === 'all' && (
                <motion.div
                  layoutId="activePill"
                  className="active-pill-bg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Utensils size={18} />
              Todos
            </button>

            {activeCategories.map((cat) => {
              const IconComponent = CATEGORY_ICONS[cat.name] || Utensils;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`category-pill ${activeCategoryId === cat.id ? 'active' : ''}`}
                >
                  {activeCategoryId === cat.id && (
                    <motion.div
                      layoutId="activePill"
                      className="active-pill-bg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <IconComponent size={18} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategoryId}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
          >
            {Object.keys(groupedMenu).map((catName) => (
              <div key={catName} style={{ marginBottom: '3rem' }}>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    marginBottom: '1.5rem',
                    color: '#1c1917',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height: '24px',
                      background: 'var(--primary)',
                      borderRadius: '4px',
                    }}
                  />
                  {catName}
                </h3>

                <div className="menu-customer-grid">
                  {groupedMenu[catName].map((item) => (
                    <motion.div
                      key={item.id}
                      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                      className={`menu-item-card ${!item.isAvailable ? 'unavailable-item' : ''}`}
                      onClick={() => item.isAvailable && setSelectedItem(item)}
                    >
                      <div className="aspect-16-9">
                        <img
                          src={
                            resolveImageUrl(item.imageUrl) ||
                            'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=500'
                          }
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {item.prepTime > 0 && (
                          <div className="floating-time-badge">
                            <Clock size={14} strokeWidth={2.5} />
                            {item.prepTime} <span>min</span>
                          </div>
                        )}
                        <div className="floating-price-badge">
                          ${formatCurrency(item.price)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '1.25rem',
                          paddingBottom: '2rem',
                          position: 'relative',
                        }}
                      >
                        <h4 className="item-card-title">{item.name}</h4>
                        <p className="item-card-desc">{item.description}</p>

                        <motion.button
                          whileTap={item.isAvailable ? { scale: 0.85 } : {}}
                          className="circular-add-btn"
                          disabled={!item.isAvailable}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.isAvailable) setSelectedItem(item);
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

      {/* ── Cart drawer (items pending to order) ── */}
      <CartDrawer
        cart={cart}
        itemNotes={itemNotes}
        onNotesChange={(id, val) =>
          setItemNotes((prev) => ({ ...prev, [id]: val }))
        }
        isExpanded={isCartExpanded}
        onToggle={() => setIsCartExpanded(!isCartExpanded)}
        cartTotal={cartTotal}
        totalItems={totalItems}
        cartPulsing={cartPulsing}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        submitting={submitting}
      />

      {/* ── Active orders panel (bottom sheet, shown when cart is empty) ── */}
      {cart.length === 0 && (
        <ActiveOrdersPanel
          activeOrders={activeOrders}
          tableOrders={tableNumber ? tableOrders : null}
          onRequestBill={requestBill}
          onRequestTableBill={requestTableBill}
          onExpandChange={setIsOrdersPanelExpanded}
          onRefreshTableOrders={fetchTableOrders}
        />
      )}

      {/* ── Item detail modal ── */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onConfirm={addToCart}
      />

      {/* ── Call waiter FAB: hidden when orders panel is expanded ── */}
      {!isOrdersPanelExpanded && (
        <CallWaiterButton
          restaurantId={restaurantId}
          tableNumber={tableNumber}
          customerId={customerId}
          billBarVisible={cart.length === 0 && activeOrders.length > 0}
        />
      )}

      {/* ── Order History Modal ── */}
      <OrderHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        customerId={customerId}
      />
    </div>
  );
};

export default PublicMenuPage;
