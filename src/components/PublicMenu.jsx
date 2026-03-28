import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, MapPin, Phone, Info, ShoppingBag, ArrowLeft, Loader2, Star, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import CustomerVerification from './CustomerVerification';
import './PublicMenu.css';

const PublicMenu = ({ restaurantId, tableNumber }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `${API_URL}/${url}`;
    };

    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cart, setCart] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myOrders, setMyOrders] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const [isVerified, setIsVerified] = useState(() => {
        const session = localStorage.getItem('qhay_customer_session');
        return session ? JSON.parse(session).verified : false;
    });

    const handleLogout = () => {
        localStorage.removeItem('qhay_customer_session');
        setIsVerified(false);
    };

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => (i.id || i.ID) === (item.id || item.ID));
            if (existing) {
                return prev.map(i => (i.id || i.ID) === (item.id || item.ID) ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => (i.id || i.ID) === (item.id || item.ID));
            if (existing && existing.quantity > 1) {
                return prev.map(i => (i.id || i.ID) === (item.id || item.ID) ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => (i.id || i.ID) !== (item.id || item.ID));
        });
    };

    const getQuantity = (id) => {
        const item = cart.find(i => (i.id || i.ID) === id);
        return item ? item.quantity : 0;
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);
        try {
            const session = JSON.parse(localStorage.getItem('qhay_customer_session') || "{}");
            const customerId = session.customer_id;

            if (!customerId) {
                alert("Sesión expirada. Por favor identifícate de nuevo.");
                setIsVerified(null);
                setIsSubmitting(false);
                return;
            }

            const orderPayload = {
                restaurant_id: restaurantId,
                customer_id: customerId,
                table_number: parseInt(tableNumber || 1),
                total_price: cartTotal,
                items: cart.map(item => ({
                    menu_item_id: item.id || item.ID,
                    menu_item_name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            if (response.ok) {
                const orderData = await response.json();
                setMyOrders(prev => [orderData, ...prev]);
                alert("¡Pedido enviado con éxito!");
                setCart([]);
            } else {
                const err = await response.json();
                alert(`Error: ${err.error || 'Server error'}`);
            }
        } catch (err) {
            alert("No se pudo conectar con el servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const resResponse = await fetch(`${API_URL}/restaurants/${restaurantId}`);
                if (!resResponse.ok) throw new Error('Restaurante no encontrado');
                const resData = await resResponse.json();
                setRestaurant(resData);

                const menuResponse = await fetch(`${API_URL}/restaurants/${restaurantId}/menu/`);
                if (menuResponse.ok) {
                    const menuData = await menuResponse.json();
                    setMenu(menuData || []);
                }
                const session = JSON.parse(localStorage.getItem('qhay_customer_session') || "{}");
                const currentCustomerId = session.customer_id;

                if (currentCustomerId) {
                    const orderRes = await fetch(`${API_URL}/orders?customer_id=${currentCustomerId}`);
                    if (orderRes.ok) {
                        const allOrders = await orderRes.json();
                        const trackedOrders = allOrders.filter(o =>
                            String(o.restaurant_id || o.RestaurantID) === String(restaurantId)
                        );
                        setMyOrders(trackedOrders);
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (restaurantId) fetchData();
    }, [restaurantId]);

    useEffect(() => {
        let interval;
        if (myOrders.length > 0) {
            interval = setInterval(async () => {
                try {
                    const session = JSON.parse(localStorage.getItem('qhay_customer_session') || "{}");
                    const currentCustomerId = session.customer_id;
                    if (!currentCustomerId) return;
                    const orderRes = await fetch(`${API_URL}/orders?customer_id=${currentCustomerId}`);
                    if (orderRes.ok) {
                        const allOrders = await orderRes.json();
                        const updatedTracked = allOrders.filter(o =>
                            String(o.restaurant_id || o.RestaurantID) === String(restaurantId)
                        );
                        setMyOrders(updatedTracked);
                    }
                } catch (e) {}
            }, 15000);
        }
        return () => clearInterval(interval);
    }, [myOrders.length, restaurantId]);

    const getStatusInfo = (status) => {
        const s = String(status).toLowerCase();
        const states = {
            pending: { name: 'Pendiente', color: '#f59e0b', icon: <Clock size={16} /> },
            preparing: { name: 'Preparando', color: '#3b82f6', icon: <Loader2 size={16} className="spin" /> },
            ready: { name: 'Listo', color: '#10b981', icon: <CheckCircle2 size={16} /> },
            delivered: { name: 'Entregado', color: '#6366f1', icon: <Utensils size={16} /> }
        };
        return states[s] || { name: status, color: 'var(--text-muted)', icon: <Info size={16} /> };
    };

    if (!isVerified) return <CustomerVerification onVerified={() => setIsVerified(true)} />;

    if (loading) {
        return (
            <div className="public-menu-loading" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a' }}>
                <Loader2 className="spin" size={48} color="var(--primary)" />
                <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Cargando carta digital...</p>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="public-menu-error" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a', padding: '2rem', textAlign: 'center' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <Utensils size={64} color="#f87171" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>¡Ups! No encontramos el local</h2>
                    <p style={{ color: 'var(--text-muted)' }}>El enlace parece inválido o el restaurante no está disponible.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="public-menu-container">
            <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
                <LogOut size={20} />
            </button>

            {/* Restaurant Info / Active Orders */}
            <div className="menu-sections-wrapper">
                <AnimatePresence>
                    {myOrders.filter(o => !['paid', 'cancelled'].includes(o.status || o.Status)).map((order, idx) => (
                        <motion.div
                            key={order.id || order.ID}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="glass-card active-order-card"
                            style={{ borderLeft: `5px solid ${getStatusInfo(order.status || order.Status).color}` }}
                        >
                            <div className="order-header">
                                <div className="order-info-left">
                                    <div className="order-icon-box" style={{ background: `${getStatusInfo(order.status || order.Status).color}20` }}>
                                        <ShoppingBag size={20} color={getStatusInfo(order.status || order.Status).color} />
                                    </div>
                                    <div>
                                        <span className="order-text-main">PEDIDO #{idx + 1}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket: {String(order.id || order.ID).slice(-6)}</span>
                                    </div>
                                </div>
                                <span className="status-label" style={{ background: getStatusInfo(order.status || order.Status).color }}>
                                    {getStatusInfo(order.status || order.Status).icon}
                                    {getStatusInfo(order.status || order.Status).name.toUpperCase()}
                                </span>
                            </div>

                            <div className="order-details-box">
                                {order.items?.map((it, i) => {
                                    const mInfo = menu.find(m => (m.id || m.ID) === it.menu_item_id);
                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{it.quantity}x {mInfo ? mInfo.name : 'Plato'}</span>
                                            <span>${(it.price * it.quantity).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                                <div className="total-row">
                                    <span>Total:</span>
                                    <span style={{ color: 'white' }}>${(order.total_price || 0).toLocaleString()}</span>
                                </div>

                                {String(order.status || order.Status).toLowerCase() === 'delivered' && (
                                    <button
                                        onClick={async () => {
                                            if (confirm(`¿Confirmas el pago de $${(order.total_price || 0).toLocaleString()}?`)) {
                                                await fetch(`${API_URL}/orders/${order.id || order.ID}/status`, {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ status: 'paid' })
                                                });
                                            }
                                        }}
                                        className="pay-btn"
                                    >PAGAR MI CUENTA</button>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {myOrders.some(o => ['paid', 'cancelled'].includes(o.status || o.Status)) && (
                        <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                            <button onClick={() => setShowHistory(!showHistory)} className="history-toggle-btn">
                                {showHistory ? 'Ocultar Historial' : `Ver Historial (${myOrders.filter(o => ['paid', 'cancelled'].includes(o.status || o.Status)).length})`}
                            </button>
                        </div>
                    )}

                    {showHistory && myOrders.filter(o => ['paid', 'cancelled'].includes(o.status || o.Status)).map((order, idx) => (
                        <motion.div key={order.id || order.ID} className="history-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ color: String(order.status || order.Status).toLowerCase() === 'paid' ? '#4ade80' : '#f87171', fontWeight: '900', fontSize: '0.85rem' }}>
                                        {String(order.status || order.Status).toLowerCase() === 'paid' ? 'COBRADO ✓' : 'CANCELADO ✗'}
                                    </span>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Ticket: {String(order.id || order.ID).slice(-4)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>${(order.total_price || 0).toLocaleString()}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1rem' }}>
                    {restaurant.description}
                </p>
            </div>
            {/* Menu Items */}
            <div style={{ padding: '1.5rem' }}>
                <h2 className="menu-section-title">Nuestra Carta</h2>
                <div style={{ marginLeft: '1.2rem', marginBottom: '2rem', marginTop: '-1rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', opacity: 0.9 }}>
                        {restaurant.name}
                    </span>
                    {tableNumber && (
                        <span style={{ marginLeft: '0.8rem', color: 'var(--primary)', fontWeight: '800' }}>
                            • Mesa {tableNumber}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {menu.map((item, index) => (
                        <motion.div
                            key={item.id || item.ID}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card item-card"
                        >
                            <div className="item-img-box">
                                <img
                                    src={getImageUrl(item.image_url) || "https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=200"}
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
                                        {item.is_available !== false ? (
                                            <div className="qty-control">
                                                <button onClick={() => removeFromCart(item)} className="qty-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>-</button>
                                                <span style={{ fontWeight: 'bold', minWidth: '15px', textAlign: 'center' }}>{getQuantity(item.id || item.ID)}</span>
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

            {/* Carrito Flotante */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="floating-cart-bar">
                        <div className="glass-card floating-cart-content">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div className="cart-icon-circle">
                                    <ShoppingBag size={22} color="white" />
                                    <span className="cart-qty-badge">{totalItems}</span>
                                </div>
                                <div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: '900', margin: 0 }}>${cartTotal.toLocaleString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={handlePlaceOrder}
                                disabled={isSubmitting}
                                className="btn-primary"
                                style={{ padding: '0.7rem 1.8rem', borderRadius: '20px' }}
                            >
                                {isSubmitting ? <Loader2 className="spin" size={18} /> : 'Pedir Ahora'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PublicMenu;
