import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, MapPin, Phone, AlignLeft, Utensils, Image as ImageIcon, Navigation, Loader2, Check, X, Upload, Link } from 'lucide-react';

const RestaurantInfoManager = ({ restaurant, onUpdate }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    const BASE_URL = API_URL.replace('/api/v1', '');

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
        return `${BASE_URL}/${url}`;
    };

    const [formData, setFormData] = useState({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        logo_url: restaurant.logo_url || '',
        latitude: restaurant.latitude || '',
        longitude: restaurant.longitude || ''
    });

    const [logoFile, setLogoFile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [logoMode, setLogoMode] = useState('url');
    const [previewUrl, setPreviewUrl] = useState(getImageUrl(restaurant.logo_url) || '');
    const fileInputRef = useRef(null);

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

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                }));
            }, (error) => {
                console.error("Error getting location:", error);
                alert("No pudimos obtener tu ubicación automáticamente.");
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            let finalLogoUrl = formData.logo_url;

            // Si hay un archivo seleccionado, primero lo subimos
            if (logoMode === 'file' && logoFile) {
                const uploadData = new FormData();
                uploadData.append('logo', logoFile); // Campo 'logo' según indica el backend

                const uploadRes = await fetch(`${API_URL}/restaurants/${restaurant.id}/logo`, {
                    method: 'POST',
                    body: uploadData,
                });

                if (uploadRes.ok) {
                    const uploadResult = await uploadRes.json();
                    finalLogoUrl = uploadResult.logo_url; // Campo 'logo_url' según indica el backend
                } else {
                    throw new Error('Error al subir la imagen');
                }
            }

            const response = await fetch(`${API_URL}/restaurants/${restaurant.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...restaurant,
                    ...formData,
                    logo_url: finalLogoUrl
                })
            });

            if (response.ok) {
                const updatedRestaurant = await response.json();
                setStatus('success');
                if (onUpdate) onUpdate(updatedRestaurant);
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error("Error updating restaurant:", error);
            setStatus('error');
        }
    };

    return (
        <div className="info-manager">
            <div className="menu-header">
                <div>
                    <h3>Perfil del Restaurante</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Actualiza la información básica y ubicación de tu negocio</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={status === 'loading'}
                    style={{ position: 'relative', overflow: 'hidden' }}
                >
                    {status === 'loading' ? (
                        <Loader2 className="spin" size={18} />
                    ) : status === 'success' ? (
                        <><Check size={18} /> Guardado</>
                    ) : (
                        <><Save size={18} /> Guardar Cambios</>
                    )}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="info-form-grid">
                <div className="info-main-section">
                    <div className="glass-card info-card">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre del Restaurante</label>
                                <div className="input-wrapper">
                                    <Utensils className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ej: La Pizzería Gourmet"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Teléfono de Contacto</label>
                                <div className="input-wrapper">
                                    <Phone className="input-icon" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+57 321 000 0000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label>Descripción Corta</label>
                            <div className="input-wrapper">
                                <AlignLeft className="input-icon" size={18} style={{ top: '1.2rem' }} />
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Cuéntale a tus clientes qué hace especial a tu local..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label>Dirección Física</label>
                            <div className="input-wrapper">
                                <MapPin className="input-icon" size={18} />
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Calle 123 #45-67, Ciudad"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card info-card" style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Navigation size={18} color="var(--primary)" /> Coordenadas Geográficas
                            </h4>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleGetLocation}
                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                            >
                                Obtener Mi Ubicación actual
                            </button>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Latitud</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        name="latitude"
                                        value={formData.latitude}
                                        onChange={handleChange}
                                        placeholder="9.123456"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Longitud</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        name="longitude"
                                        value={formData.longitude}
                                        onChange={handleChange}
                                        placeholder="-75.123456"
                                    />
                                </div>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
                            Las coordenadas ayudan a los clientes a encontrarte más fácil en el mapa.
                        </p>
                    </div>
                </div>

                <div className="info-sidebar">
                    <div className="glass-card info-card logo-config">
                        <h4>Logo del Restaurante</h4>
                        <div className="logo-preview-container">
                            {previewUrl ? (
                                <div className="logo-preview">
                                    <img src={previewUrl} alt="Preview" />
                                    <button type="button" className="remove-logo" onClick={() => { setPreviewUrl(''); setFormData(p => ({ ...p, logo_url: '' })) }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="logo-placeholder">
                                    <ImageIcon size={48} opacity={0.2} />
                                </div>
                            )}
                        </div>

                        <div className="logo-mode-selector">
                            <button
                                type="button"
                                className={logoMode === 'url' ? 'active' : ''}
                                onClick={() => setLogoMode('url')}
                            >
                                <Link size={14} /> URL
                            </button>
                            <button
                                type="button"
                                className={logoMode === 'file' ? 'active' : ''}
                                onClick={() => setLogoMode('file')}
                            >
                                <Upload size={14} /> Archivo
                            </button>
                        </div>

                        {logoMode === 'url' ? (
                            <div className="input-wrapper">
                                <Link className="input-icon" size={16} />
                                <input
                                    type="text"
                                    name="logo_url"
                                    value={logoMode === 'url' ? formData.logo_url : ''}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </div>
                        ) : (
                            <div className="file-upload-box" onClick={() => fileInputRef.current.click()}>
                                <Upload size={20} />
                                <span>Subir Imagen</span>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    hidden
                                />
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default RestaurantInfoManager;
