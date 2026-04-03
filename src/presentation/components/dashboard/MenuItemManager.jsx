import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Check, Loader2, Utensils, AlignLeft, DollarSign, Eye, EyeOff, Camera, Clock } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { menuRepository } from '../../../data/repositories/menuRepository';
import { resolveImageUrl } from '../../../data/api/httpClient';


/**
 * MenuItemManager — CRUD interface for restaurant menu items.
 * Uses useMenu hook for all data operations.
 *
 * @param {{ restaurantId: string }} props
 */
const MenuItemManager = ({ restaurantId }) => {
  const { items, loading, saving, save, remove } = useMenu(menuRepository, restaurantId);

  const initialForm = { restaurant_id: restaurantId, name: '', description: '', price: '', prep_time: '', image_url: '', is_available: true };
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFormData(initialForm);
    setImageFile(null);
    setPreviewUrl('');
    setIsAdding(false);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (item) => {
    setFormData({ ...item, id: item.id, price: item.price?.toString() ?? '', prep_time: item.prepTime?.toString() ?? '' });
    setPreviewUrl(resolveImageUrl(item.imageUrl));
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await save(formData, imageFile);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este plato?')) return;
    await remove(id);
  };

  return (
    <div className="menu-manager">
      <div className="menu-header">
        <div>
          <h3>Carta / Menú</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona los platos y precios de tu restaurante</p>
        </div>
        {!isAdding && (
          <button className="btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={18} /> Agregar Plato
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card menu-form-card"
            style={{ marginBottom: '2rem', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingId ? 'Editar Plato' : 'Nuevo Plato'}
              </h4>
              <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="register-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre del Plato</label>
                  <div className="input-wrapper">
                    <Utensils className="input-icon" size={18} />
                    <input type="text" placeholder="Ej: Pizza Napolitana" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Precio ($)</label>
                  <div className="input-wrapper">
                    <DollarSign className="input-icon" size={18} />
                    <input type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Tiempo prep. (min)</label>
                  <div className="input-wrapper">
                    <Clock className="input-icon" size={18} />
                    <input type="number" placeholder="Ej: 15" value={formData.prep_time} onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <div className="input-wrapper">
                  <AlignLeft className="input-icon" size={18} style={{ top: '1.1rem' }} />
                  <textarea placeholder="Ingredientes, tamaño..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" style={{ paddingLeft: '3rem', paddingTop: '0.875rem' }} />
                </div>
              </div>

              <div className="form-group">
                <label>Imagen del Plato</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div onClick={() => fileInputRef.current.click()} style={{ width: '120px', height: '100px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                    {previewUrl ? <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" /> : <Camera size={24} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sube una foto atractiva (PNG, JPG)</p>
                    <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setPreviewUrl(URL.createObjectURL(f)); } }} accept="image/*" hidden />
                    <button type="button" className="btn-secondary" onClick={() => fileInputRef.current.click()} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>Seleccionar Archivo</button>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ margin: '1rem 0' }}>
                <label>Disponibilidad</label>
                <div className="input-wrapper" onClick={() => setFormData({ ...formData, is_available: !formData.is_available })} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', height: '48px', padding: '0 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  {formData.is_available ? <Eye size={18} color="#4ade80" /> : <EyeOff size={18} color="#f87171" />}
                  <span style={{ marginLeft: '0.75rem', fontWeight: '500', color: formData.is_available ? '#4ade80' : '#f87171' }}>
                    {formData.is_available ? 'Disponible en Carta' : 'Agotado Temporalmente'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? <Loader2 className="spin" size={18} /> : (editingId ? <Save size={18} /> : <Plus size={18} />)}
                  {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar Plato')}
                </button>
                <button type="button" className="btn-primary" onClick={resetForm} style={{ background: 'transparent', border: '1px solid var(--border)' }}>Cancelar</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="spin" size={32} color="var(--primary)" />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Cargando carta...</p>
        </div>
      ) : (
        <div className="menu-grid">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card menu-item-card ${!item.isAvailable ? 'out-of-stock' : ''}`}
              >
                <div className="menu-item-image-container">
                  <img src={resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=500'} alt={item.name} className="menu-item-img" />
                  <span className="price-tag">${parseFloat(item.price).toFixed(2)}</span>
                  {!item.isAvailable && (
                    <div className="stock-overlay"><EyeOff size={24} /><span>AGOTADO</span></div>
                  )}
                </div>
                <div style={{ padding: '0.5rem 0' }}>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{item.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', minHeight: '2.5rem', lineHeight: '1.4' }}>{item.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.isAvailable ? '#4ade80' : '#f87171' }} />
                        <span style={{ fontSize: '0.8rem', color: item.isAvailable ? '#4ade80' : '#f87171', fontWeight: '500' }}>
                          {item.isAvailable ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                      {item.prepTime > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <Clock size={12} /><span>{item.prepTime} min</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(item)} className="action-btn edit" title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="action-btn delete" title="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MenuItemManager;
