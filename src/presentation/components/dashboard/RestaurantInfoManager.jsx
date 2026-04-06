import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, MapPin, Phone, AlignLeft, Utensils, Image as ImageIcon, Navigation, Loader2, Check, X, Upload, Link, Building2 } from 'lucide-react';
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
  const { update } = useRestaurant(restaurantRepository, restaurant.id);

  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    locationType: restaurant.locationType || '',
    cuisineType: restaurant.cuisineType || '',
    mallName: restaurant.mallName || '',
    link: restaurant.link || '',
    logo_url: restaurant.logoUrl || '',
  });

  const shoppingMalls = ['Andino', 'Unicentro', 'Titán Plaza', 'Santafé', 'Parque La Colina', 'Gran Estación', 'Fontanar', 'El Tesoro', 'Viva Envigado'];
  const cuisineTypes = ['Colombiana', 'Mexicana', 'Peruana', 'Italiana', 'Asiática', 'Comida Rápida', 'Vegetariana/Vegana', 'Parrilla/Asados'];

  const [logoFile, setLogoFile] = useState(null);
  const [logoMode, setLogoMode] = useState('url');
  const [previewUrl, setPreviewUrl] = useState(resolveImageUrl(restaurant.logoUrl) || '');
  const [status, setStatus] = useState('idle');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      if (name === 'locationType' && value === 'Stand-alone') {
        newState.mallName = '';
      }
      return newState;
    });
    if (name === 'logo_url' && logoMode === 'url') setPreviewUrl(value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const file = logoMode === 'file' ? logoFile : null;
      const linkTrimmed = (formData.link || '').trim();
      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        locationType: formData.locationType,
        cuisineType: formData.cuisineType,
        mallName: formData.mallName,
        link: linkTrimmed,
        logoUrl: logoMode === 'file' ? '' : (formData.logo_url || '').trim(),
      };

      // Use the 'update' function from useRestaurant hook, which handles single-request multipart updates.
      const updated = await update(payload, file);

      setFormData((prev) => ({
        ...prev,
        logo_url: updated.logoUrl || '',
      }));
      setPreviewUrl(resolveImageUrl(updated.logoUrl) || '');
      setLogoFile(null);
      setLogoMode('url');

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
            <div className="form-group">
              <label>Nombre del Restaurante</label>
              <div className="input-wrapper">
                <Utensils className="input-icon" size={18} />
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: La Pizzería Gourmet" required />
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
              <label>Teléfono de Contacto</label>
              <div className="input-wrapper">
                <Phone className="input-icon" size={18} />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+57 321 000 0000" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Dirección Física</label>
              <div className="input-wrapper">
                <MapPin className="input-icon" size={18} />
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Calle 123 #45-67, Ciudad" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>¿Dónde se encuentra su local?</label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="locationType"
                    value="Stand-alone"
                    checked={formData.locationType === 'Stand-alone'}
                    onChange={handleChange}
                  />
                  Local Independiente
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="locationType"
                    value="Food Court"
                    checked={formData.locationType === 'Food Court'}
                    onChange={handleChange}
                  />
                  Plazoleta de Comidas
                </label>
              </div>
            </div>

            <AnimatePresence>
              {formData.locationType === 'Food Court' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label>Seleccione el centro comercial</label>
                    <div className="input-wrapper">
                      <Building2 className="input-icon" size={18} />
                      <select
                        name="mallName"
                        value={formData.mallName}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona uno…</option>
                        {shoppingMalls.map((mall) => (
                          <option key={mall} value={mall}>{mall}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-grid" style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>¿Qué tipo de comida ofrece?</label>
                <div className="input-wrapper">
                  <Utensils className="input-icon" size={18} />
                  <select
                    name="cuisineType"
                    value={formData.cuisineType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona uno…</option>
                    {cuisineTypes.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Enlace (web o red social) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                <div className="input-wrapper">
                  <Link className="input-icon" size={18} />
                  <input type="url" name="link" value={formData.link} onChange={handleChange} placeholder="https://instagram.com/milocal" />
                </div>
              </div>
            </div>
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
