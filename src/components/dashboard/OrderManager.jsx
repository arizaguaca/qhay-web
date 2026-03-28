import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, CheckCircle2, ChevronRight, DollarSign, Loader2, Utensils, MessageCircle, AlertCircle } from 'lucide-react';

const OrderManager = ({ restaurantId }) => {
    const [orders, setOrders] = useState([]);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);

    const states = [
        { id: 'pending', name: 'Pendiente', color: '#f59e0b' },
        { id: 'preparing', name: 'Preparando', color: '#3b82f6' },
        { id: 'ready', name: 'Listo', color: '#10b981' },
        { id: 'delivered', name: 'Entregado', color: '#6366f1' },
        { id: 'paid', name: 'Pagado', color: '#4ade80' },
        { id: 'cancelled', name: 'Cancelado', color: '#f87171' }
    ];

    const fetchOrders = async () => {
        try {
            const response = await fetch(`http://localhost:8080/orders?restaurant_id=${restaurantId}`);
            if (response.ok) {
                const data = await response.json();
                setOrders(data || []);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const fetchMenu = async () => {
        try {
            const response = await fetch(`http://localhost:8080/restaurants/${restaurantId}/menu/`);
            if (response.ok) {
                const data = await response.json();
                setMenu(data || []);
            }
        } catch (error) {
            console.error("Error fetching menu:", error);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchOrders(), fetchMenu()]);
            setLoading(false);
        };
        loadAll();
        // Polling cada 30 segundos
        const timer = setInterval(fetchOrders, 30000);
        return () => clearInterval(timer);
    }, [restaurantId]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:8080/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setOrders(orders.map(o => (o.id || o.ID) === orderId ? { ...o, status: newStatus } : o));
            }
        } catch (error) {
            console.error("Error updating order status:", error);
        }
    };

    return (
        <div className="order-manager">
            <div className="menu-header">
                <div>
                    <h3>Monitor de Pedidos</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Seguimiento en tiempo real de las órdenes actuales</p>
                </div>
                <button className="btn-primary" onClick={fetchOrders} style={{ padding: '0.5rem 1rem' }}>
                    <Clock size={18} /> Actualizar
                </button>
            </div>

            {loading && orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="spin" size={32} color="var(--primary)" />
                </div>
            ) : (
                <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    <AnimatePresence>
                        {orders.map((order, idx) => (
                            <motion.div
                                key={order.id || order.ID}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card order-card"
                                style={{ padding: '1.5rem', borderLeft: `4px solid ${states.find(s => s.id === order.status)?.color || 'var(--border)'}` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={20} color="var(--primary)" />
                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Mesa {order.table_number || 'S.N.'}</span>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>#{order.id?.slice(0, 5) || idx}</span>
                                </div>

                                <div className="order-items" style={{ marginBottom: '1.5rem' }}>
                                    {order.items?.map((item, i) => {
                                        const menuItem = menu.find(m => (m.id || m.ID) === item.menu_item_id);
                                        const itemName = menuItem ? menuItem.name : (item.menu_item_name || 'Plato');
                                        
                                        return (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                                                <span><span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{item.quantity}x</span> {itemName}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>${(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                    <div style={{ textAlign: 'right', marginTop: '1rem', fontWeight: '900', fontSize: '1.2rem', color: 'var(--primary)' }}>
                                        Total: ${(order.total_price || 0).toLocaleString()}
                                    </div>
                                </div>

                                <div className="order-actions">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Estado de la Orden</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {states.map(state => (
                                            <button
                                                key={state.id}
                                                onClick={() => handleStatusChange(order.id || order.ID, state.id)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    border: '1px solid var(--border)',
                                                    background: order.status === state.id ? state.color : 'transparent',
                                                    color: order.status === state.id ? '#000' : 'var(--text-muted)',
                                                    fontWeight: 'bold',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {state.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {orders.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px dashed var(--border)' }}>
                    <Utensils size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
                    <h4>Sin pedidos activos</h4>
                    <p style={{ color: 'var(--text-muted)' }}>Cuando los clientes escaneen el QR y ordenen, aparecerán aquí.</p>
                </div>
            )}
        </div>
    );
};

export default OrderManager;
