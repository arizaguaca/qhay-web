import React, { useState, useRef } from 'react';
import { Save, MapPin, Phone, AlignLeft, Utensils, Image as ImageIcon, Navigation, Loader2, Check, X, Upload, Link } from 'lucide-react';
import { useRestaurant } from '../../hooks/useRestaurants';
import { restaurantRepository } from '../../../data/repositories/restaurantRepository';
import { resolveImageUrl } from '../../../data/api/httpClient';

/**
 * RestaurantInfoManager — Edits basic info and logo of a restaurant.
 * Uses useRestaurant hook for update operations.
 *
 * @param {{ restaurant: import('../../../core/entities/Restaurant').Restaurant, onUpdate: Function }} props
 */
const RestaurantInfoManager = ({ restaurant, onUpdate }) => {
  const { update } = useRestaurant(restaurantRepository, null); // null = skip initial fetch

  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    logo_url: restaurant.logoUrl || '',
    latitude: restaurant.latitude || '',
    longitude: restaurant.longitude || '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoMode, setLogoMode] = useState('url');
  const [previewUrl, setPreviewUrl] = useState(resolveImageUrl(restaurant.logoUrl) || '');
  const [status, setStatus] = useState('idle');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'logo_url' && logoMode === 'url') setPreviewUrl(value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setFormData((prev) => ({ ...prev, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() })),
      () => alert('No pudimos obtener tu ubicación automáticamente.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const file = logoMode === 'file' ? logoFile : null;
      const payload = { ...formData, logo_url: logoMode === 'file' ? '' : formData.logo_url };

      // Direct repository call since the hook's update needs a loaded restaurant
      const updated = await restaurantRepository.update(restaurant.id, payload);
      if (file) await restaurantRepository.uploadLogo(restaurant.id, file);

      setStatus('success');
      if (onUpdate) onUpdate(updated);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Error updating restaurant:', err);
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
        <button className="btn-primary" onClick={handleSubmit} disabled={status === 'loading'} style={{ position: 'relative', overflow: 'hidden' }}>
          {status === 'loading' ? <Loader2 className="spin" size={18} />
            : status === 'success' ? <><Check size={18} /> Guardado</>
              : <><Save size={18} /> Guardar Cambios</>}
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
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: La Pizzería Gourmet" required />
                </div>
              </div>
              <div className="form-group">
                <label>Teléfono de Contacto</label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+57 321 000 0000" />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Descripción Corta</label>
              <div className="input-wrapper">
                <AlignLeft className="input-icon" size={18} style={{ top: '1.2rem' }} />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Cuéntale a tus clientes qué hace especial a tu local..." rows="3" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Dirección Física</label>
              <div className="input-wrapper">
                <MapPin className="input-icon" size={18} />
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Calle 123 #45-67, Ciudad" />
              </div>
            </div>
          </div>

          <div className="glass-card info-card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation size={18} color="var(--primary)" /> Coordenadas Geográficas
              </h4>
              <button type="button" className="btn-secondary" onClick={handleGetLocation} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                Obtener Mi Ubicación
              </button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Latitud</label>
                <div className="input-wrapper">
                  <input type="text" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="9.123456" />
                </div>
              </div>
              <div className="form-group">
                <label>Longitud</label>
                <div className="input-wrapper">
                  <input type="text" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="-75.123456" />
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
              Las coordenadas ayudan a los clientes a encontrarte en el mapa.
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
                  <button type="button" className="remove-logo" onClick={() => { setPreviewUrl(''); setFormData((p) => ({ ...p, logo_url: '' })); }}>
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
              <button type="button" className={logoMode === 'url' ? 'active' : ''} onClick={() => setLogoMode('url')}><Link size={14} /> URL</button>
              <button type="button" className={logoMode === 'file' ? 'active' : ''} onClick={() => setLogoMode('file')}><Upload size={14} /> Archivo</button>
            </div>

            {logoMode === 'url' ? (
              <div className="input-wrapper">
                <Link className="input-icon" size={16} />
                <input type="text" name="logo_url" value={formData.logo_url} onChange={handleChange} placeholder="https://..." style={{ fontSize: '0.85rem' }} />
              </div>
            ) : (
              <div className="file-upload-box" onClick={() => fileInputRef.current.click()}>
                <Upload size={20} />
                <span>Subir Imagen</span>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" hidden />
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default RestaurantInfoManager;
