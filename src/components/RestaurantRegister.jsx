import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, AlignLeft, MapPin, Phone, User, Image, ArrowRight, CheckCircle2, AlertCircle, Upload, Link, X, Plus, ChevronRight, Layout } from 'lucide-react';
import './RestaurantRegister.css';
import RestaurantDashboard from './dashboard/RestaurantDashboard';

const RestaurantRegister = ({ currentUser }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    // Base URL for images (without /api/v1)
    const BASE_URL = API_URL.replace('/api/v1', '');

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `${BASE_URL}/${url}`;
    };

    // Views: 'list', 'register', 'dashboard'
    const [view, setView] = useState('list');
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        phone: '',
        owner_id: currentUser?.id || currentUser?.ID || '',
        logo_url: ''
    });

    const [logoMode, setLogoMode] = useState('url'); // 'url' or 'file'
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    const fetchRestaurants = async () => {
        const userId = currentUser?.id || currentUser?.ID;
        if (!userId) {
            console.warn("No se encontró ID de usuario para cargar restaurantes");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/users/${userId}/restaurants`);
            if (response.ok) {
                const data = await response.json();
                setRestaurants(data || []);
            } else {
                console.error("Error al cargar restaurantes:", response.status);
            }
        } catch (error) {
            console.error("Error de red al cargar restaurantes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userId = currentUser?.id || currentUser?.ID;
        const userRole = currentUser?.role;
        const userRestId = currentUser?.restaurant_id || currentUser?.RestaurantID;

        if (userId) {
            if (userRole && userRole !== 'owner' && userRestId) {
                // Es Staff, cargar su restaurante específico directamente
                const fetchMyRestaurant = async () => {
                    setLoading(true);
                    try {
                        const res = await fetch(`${API_URL}/restaurants/${userRestId}`);
                        if (res.ok) {
                            const data = await res.json();
                            setSelectedRestaurant(data);
                            setView('dashboard');
                        }
                    } catch (e) {
                        console.error("Error loading staff restaurant", e);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchMyRestaurant();
            } else {
                // Es Owner, cargar su lista de locales
                fetchRestaurants();
            }
        }
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'logo_url' && logoMode === 'url') {
            setPreviewUrl(value);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const localUrl = URL.createObjectURL(file);
            setPreviewUrl(localUrl);
        }
    };

    const removeImage = () => {
        setPreviewUrl('');
        setLogoFile(null);
        setFormData(prev => ({ ...prev, logo_url: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            // Step 1: Create the restaurant first to get an ID
            const response = await fetch(`${API_URL}/restaurants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    logo_url: logoMode === 'url' ? formData.logo_url : '' // Send URL if provided, otherwise empty
                }),
            });

            if (response.ok) {
                const newRestaurant = await response.json();
                const restaurantId = newRestaurant.id || newRestaurant.ID; // Handle different casing if necessary

                // Step 2: If a logo file was selected, upload it to the specific restaurant endpoint
                if (logoMode === 'file' && logoFile && restaurantId) {
                    const uploadData = new FormData();
                    uploadData.append('logo', logoFile); // Campo 'logo' según backend

                    const uploadRes = await fetch(`${API_URL}/restaurants/${restaurantId}/logo`, {
                        method: 'POST',
                        body: uploadData,
                    });

                    if (!uploadRes.ok) {
                        console.warn('El restaurante se creó pero hubo un error al subir el logo.');
                    }
                }

                setStatus('success');
                setMessage('¡Restaurante registrado exitosamente!');
                setTimeout(() => {
                    fetchRestaurants();
                    setView('list');
                    setStatus('idle');
                    setFormData({
                        name: '',
                        description: '',
                        address: '',
                        phone: '',
                        owner_id: currentUser?.id || '',
                        logo_url: ''
                    });
                    setPreviewUrl('');
                    setLogoFile(null);
                }, 2000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setStatus('error');
                setMessage(errorData.error || 'Error al registrar el restaurante.');
            }
        } catch (error) {
            console.error('Error in registration flow:', error);
            setStatus('error');
            setMessage('Error de conexión o en el proceso de registro.');
        }
    };

    const handleOpenDashboard = (restaurant) => {
        setSelectedRestaurant(restaurant);
        setView('dashboard');
    };

    if (view === 'dashboard' && selectedRestaurant) {
        return <RestaurantDashboard restaurant={selectedRestaurant} onBack={() => setView('list')} />;
    }

    return (
        <div className="register-container">
            <AnimatePresence mode="wait">
                {view === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="restaurant-manager-list"
                        style={{ width: '100%' }}
                    >
                        <div className="list-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>Mis Restaurantes</h2>
                                <p style={{ color: 'var(--text-muted)' }}>Gestiona y configura tus locales registrados</p>
                            </div>
                            <button className="btn-primary" onClick={() => setView('register')}>
                                <Plus size={20} /> Nuevo Local
                            </button>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando tus restaurantes...</div>
                        ) : restaurants.length === 0 ? (
                            <motion.div
                                className="glass-card new-restaurant-card"
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setView('register')}
                            >
                                <Utensils size={48} />
                                <p>Aún no tienes restaurantes registrados</p>
                                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Haz clic aquí para crear el primero</span>
                            </motion.div>
                        ) : (
                            <div className="restaurant-list-grid">
                                {restaurants.map(rest => (
                                    <motion.div
                                        key={rest.id || rest.ID}
                                        className="glass-card restaurant-card"
                                        whileHover={{ y: -5, borderColor: 'var(--primary)' }}
                                        onClick={() => handleOpenDashboard(rest)}
                                    >
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {rest.logo_url ? <img src={getImageUrl(rest.logo_url)} alt={rest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Utensils size={24} color="var(--primary)" />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{rest.name}</h3>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{rest.address}</p>
                                            </div>
                                            <ChevronRight size={20} color="var(--text-muted)" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="register"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card register-card"
                    >
                        <div className="register-header">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="icon-badge">
                                    <Plus size={32} color="var(--primary)" />
                                </div>
                                <button onClick={() => setView('list')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <h2>Nuevo Restaurante</h2>
                            <p>Ingresa los detalles de tu nuevo establecimiento</p>
                        </div>

                        <form onSubmit={handleSubmit} className="register-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="name">Nombre</label>
                                    <div className="input-wrapper">
                                        <Utensils className="input-icon" size={18} />
                                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre del local" required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Teléfono</label>
                                    <div className="input-wrapper">
                                        <Phone className="input-icon" size={18} />
                                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" required />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Descripción</label>
                                <div className="input-wrapper">
                                    <AlignLeft className="input-icon" size={18} style={{ top: '1.1rem' }} />
                                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Breve descripción..." required rows="3" style={{ paddingLeft: '3rem', paddingTop: '0.875rem' }} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Dirección</label>
                                <div className="input-wrapper">
                                    <MapPin className="input-icon" size={18} />
                                    <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Dirección física" required />
                                </div>
                            </div>

                            <div className="logo-section">
                                <div className="logo-header">
                                    <label>Logo</label>
                                    <div className="mode-selector">
                                        <button type="button" className={logoMode === 'url' ? 'active' : ''} onClick={() => setLogoMode('url')}><Link size={14} /> URL</button>
                                        <button type="button" className={logoMode === 'file' ? 'active' : ''} onClick={() => setLogoMode('file')}><Upload size={14} /> Subir</button>
                                    </div>
                                </div>
                                <div className="logo-content">
                                    {logoMode === 'url' ? (
                                        <div className="input-wrapper">
                                            <Image className="input-icon" size={18} />
                                            <input type="url" id="logo_url" name="logo_url" value={formData.logo_url} onChange={handleChange} placeholder="https://..." />
                                        </div>
                                    ) : (
                                        <div className="file-upload-zone" onClick={() => fileInputRef.current.click()}>
                                            <Upload size={24} />
                                            <p>Seleccionar archivo</p>
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                                        </div>
                                    )}
                                    <AnimatePresence>
                                        {previewUrl && (
                                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="logo-preview-container">
                                                <img src={previewUrl} alt="Preview" className="logo-preview" />
                                                <button type="button" className="remove-logo" onClick={removeImage}><X size={14} /></button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className={`btn-primary submit-btn ${status === 'loading' ? 'loading' : ''}`}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'Registrando...' : 'Crear Restaurante'}
                            </motion.button>

                            {status === 'success' && <div className="alert alert-success">{message}</div>}
                            {status === 'error' && <div className="alert alert-error">{message}</div>}
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RestaurantRegister;
