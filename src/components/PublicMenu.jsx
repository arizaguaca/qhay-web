import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, MapPin, Phone, Info, ShoppingBag, ArrowLeft, Loader2, Star, Clock, LogOut } from 'lucide-react';
import CustomerVerification from './CustomerVerification';

const PublicMenu = ({ restaurantId, tableNumber }) => {
    // Utility to handle backend image URLs
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `http://localhost:8080/${url}`;
    };

    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isVerified, setIsVerified] = useState(() => {
        const session = localStorage.getItem('qhay_customer_session');
        return session ? JSON.parse(session).verified : false;
    });

    const handleLogout = () => {
        localStorage.removeItem('qhay_customer_session');
        setIsVerified(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch restaurant info
                const resResponse = await fetch(`http://localhost:8080/restaurants/${restaurantId}`);
                if (!resResponse.ok) throw new Error('Restaurante no encontrado');
                const resData = await resResponse.json();
                setRestaurant(resData);

                // Fetch menu items
                const menuResponse = await fetch(`http://localhost:8080/restaurants/${restaurantId}/menu`);
                if (menuResponse.ok) {
                    const menuData = await menuResponse.json();
                    setMenu(menuData || []);
                }
            } catch (err) {
                console.error("Error fetching public menu:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (restaurantId) {
            fetchData();
        }
    }, [restaurantId]);

    if (!isVerified) {
        return <CustomerVerification onVerified={() => setIsVerified(true)} />;
    }

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
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <Utensils size={64} color="#f87171" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>¡Ups! No encontramos el local</h2>
                    <p style={{ color: 'var(--text-muted)' }}>El enlace del QR parece ser inválido o el restaurante ya no está disponible.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="public-menu-container" style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', paddingBottom: '5rem' }}>
            {/* Header / Hero */}
            <div className="menu-hero" style={{ height: '30vh', position: 'relative', overflow: 'hidden' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Cerrar sesión"
                >
                    <LogOut size={20} />
                </button>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <img
                        src={getImageUrl(restaurant.logo_url) || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800"}
                        alt={restaurant.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3) blur(2px)' }}
                    />
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '2rem', zIndex: 2, background: 'linear-gradient(transparent, #0a0a0b)' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '20px', border: '3px solid white', overflow: 'hidden', background: 'white' }}>
                                <img src={getImageUrl(restaurant.logo_url) || "https://via.placeholder.com/150"} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.2rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{restaurant.name}</h1>
                                {tableNumber && (
                                    <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700' }}>
                                        Mesa {tableNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Restaurant Info */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="no-scrollbar">
                    <div className="glass-card" style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '15px' }}>
                        <MapPin size={16} color="var(--primary)" />
                        <span style={{ fontSize: '0.9rem' }}>{restaurant.address}</span>
                    </div>
                    <div className="glass-card" style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '15px' }}>
                        <Phone size={16} color="var(--primary)" />
                        <span style={{ fontSize: '0.9rem' }}>{restaurant.phone}</span>
                    </div>
                </div>

                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1rem' }}>
                    {restaurant.description}
                </p>
            </div>

            {/* Menu Items */}
            <div style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>
                    Nuestra Carta
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {menu.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <ShoppingBag size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
                            <p>No hay platos disponibles por el momento.</p>
                        </div>
                    ) : (
                        menu.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card"
                                style={{ display: 'flex', gap: '1.2rem', padding: '1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div style={{ width: '100px', height: '100px', borderRadius: '15px', overflow: 'hidden', flexShrink: 0 }}>
                                    <img
                                        src={getImageUrl(item.image_url) || "https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=200"}
                                        alt={item.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{item.name}</h3>
                                        <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.1rem' }}>${item.price}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.description}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'auto' }}>
                                        {item.prep_time > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                                <Clock size={12} />
                                                <span>{item.prep_time} min</span>
                                            </div>
                                        )}
                                        {!item.is_available && (
                                            <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Agotado</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom Navigation (Simulated) */}
            <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', zIndex: 100 }}>
                <div className="glass-card" style={{ borderRadius: '30px', padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingBag size={20} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mesa {tableNumber}</p>
                            <p style={{ fontSize: '0.9rem', fontWeight: '700' }}>Mi Pedido</p>
                        </div>
                    </div>
                    <button className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                        Pedir Ahora
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublicMenu;
