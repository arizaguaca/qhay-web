import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Check, Loader2, Utensils, AlignLeft, DollarSign, Eye, EyeOff, Camera, Clock } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { menuRepository } from '../../../data/repositories/menuRepository';
import { resolveImageUrl } from '../../../data/api/httpClient';
import { processImage } from '../../utils/imageProcessor';
import { formatCurrency } from '../../utils/formatter';
import './MenuItemManager.css';

/**
 * MenuItemManager — CRUD interface for restaurant menu items.
 * Uses useMenu hook for all data operations.
 *
 * @param {{ restaurantId: string }} props
 */
const MenuItemManager = ({ restaurantId }) => {
  const { items, categories, loading, saving, save, remove, saveCategory, toggleAvailability } = useMenu(menuRepository, restaurantId);

  const initialForm = {
    restaurant_id: restaurantId,
    categoryId: '',
    name: '',
    description: '',
    price: '',
    prepTime: '',
    image_url: '',
    isAvailable: true,
    groups: [],
  };

  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [requiresPrep, setRequiresPrep] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmItemName, setDeleteConfirmItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFormData(initialForm);
    setImageFile(null);
    setPreviewUrl('');
    setIsAdding(false);
    setIsProcessingImage(false);
    setEditingId(null);
    setShowNewCategory(false);
    setNewCategoryName('');
    setRequiresPrep(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const processedFile = await processImage(file);
      setImageFile(processedFile);
      setPreviewUrl(URL.createObjectURL(processedFile));
    } catch (err) {
      alert(err.message);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      id: item.id,
      price: item.price?.toString() ?? '',
      prepTime: item.prepTime?.toString() ?? '',
      isAvailable: item.isAvailable,
      groups: (item.groups || []).map(g => ({
        ...g,
        id: g.id,
        title: g.title || g.name || '',
        isRequired: Boolean(g.isRequired),
        minSelectable: g.minSelectable ?? 0,
        maxSelectable: g.maxSelectable ?? 1,
        options: (g.options || []).map(o => ({
          ...o,
          id: o.id,
          name: o.name || '',
          extraPrice: typeof o.extraPrice === 'number' ? o.extraPrice : parseFloat(o.extraPrice || 0),
          isAvailable: o.isAvailable !== false
        }))
      }))
    });
    setPreviewUrl(resolveImageUrl(item.imageUrl));
    setEditingId(item.id);
    setIsAdding(true);
    setShowNewCategory(false);
    setRequiresPrep(item.prepTime > 0);
  };

  const handleAddGroup = () => {
    const newGroup = {
      title: '',
      isRequired: false,
      minSelectable: 0,
      maxSelectable: 1,
      options: [{ name: '', extraPrice: 0, isAvailable: true }]
    };
    setFormData(prev => ({ ...prev, groups: [...prev.groups, newGroup] }));
  };

  const handleRemoveGroup = (index) => {
    setFormData(prev => ({ ...prev, groups: prev.groups.filter((_, i) => i !== index) }));
  };

  const handleGroupChange = (index, field, value) => {
    setFormData(prev => {
      const groups = [...prev.groups];
      groups[index] = { ...groups[index], [field]: value };
      return { ...prev, groups };
    });
  };

  const handleAddOption = (groupIndex) => {
    setFormData(prev => {
      const groups = [...prev.groups];
      const targetGroup = { ...groups[groupIndex] };
      targetGroup.options = [...targetGroup.options, { name: '', extraPrice: 0, isAvailable: true }];
      groups[groupIndex] = targetGroup;
      return { ...prev, groups };
    });
  };

  const handleOptionChange = (groupIndex, optIndex, field, value) => {
    setFormData(prev => {
      const groups = [...prev.groups];
      const targetGroup = { ...groups[groupIndex] };
      const options = [...targetGroup.options];
      options[optIndex] = { ...options[optIndex], [field]: value };
      targetGroup.options = options;
      groups[groupIndex] = targetGroup;
      return { ...prev, groups };
    });
  };

  const handleRemoveOption = (groupIndex, optIndex) => {
    setFormData(prev => {
      const groups = [...prev.groups];
      const targetGroup = { ...groups[groupIndex] };
      targetGroup.options = targetGroup.options.filter((_, i) => i !== optIndex);
      groups[groupIndex] = targetGroup;
      return { ...prev, groups };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isProcessingImage) return;
    let currentFormData = { ...formData };
    
    if (!requiresPrep) {
      currentFormData.prepTime = '0';
    }

    try {
      if (showNewCategory && newCategoryName.trim()) {
        const newCat = await saveCategory(newCategoryName.trim());
        if (newCat) currentFormData.categoryId = newCat.id;
      }
      
      await save(currentFormData, imageFile);
      resetForm();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteClick = (item) => {
    setDeleteConfirmId(item.id);
    setDeleteConfirmItemName(item.name);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await remove(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteConfirmItemName('');
    } catch (err) {
      alert('Error al eliminar el plato: ' + err.message);
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      await toggleAvailability(item.id, !item.isAvailable);
    } catch (err) {
      alert('Error al cambiar disponibilidad: ' + err.message);
    }
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const cat = categories.find(c => c.id === item.categoryId) || { name: 'Sin Categoría', id: item.categoryId };
    if (!acc[cat.name]) acc[cat.name] = [];
    acc[cat.name].push(item);
    return acc;
  }, {});

  const usedCategories = categories.filter(cat => 
    items.some(item => item.categoryId === cat.id)
  );

  const displayedGroupNames = selectedCategory === 'all' 
    ? Object.keys(groupedItems) 
    : Object.keys(groupedItems).filter(name => {
        const cat = categories.find(c => c.name === name);
        return cat?.id === selectedCategory;
      });

  return (
    <div className="menu-manager">
      <div className="menu-header">
        <div>
          <h3>Carta / Menú</h3>
          <p className="menu-header-text-muted">Gestiona los platos y precios de tu restaurante</p>
        </div>
        {!isAdding && (
          <button className="btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={18} /> Agregar Plato
          </button>
        )}
      </div>

      {/* Categoría Filtros */}
      {!loading && usedCategories.length > 0 && !isAdding && (
        <div className="category-filters">
          <button 
            className={`filter-btn-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Todos
          </button>
          {usedCategories.map(cat => (
            <button 
              key={cat.id}
              className={`filter-btn-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card menu-form-card"
          >
            <div className="menu-form-header">
              <h4>
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingId ? 'Editar Plato' : 'Nuevo Plato'}
              </h4>
              <button onClick={resetForm} className="menu-form-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="register-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Categoría</label>
                  <div className="input-col-wrapper">
                    <div className="input-wrapper">
                      <AlignLeft className="input-icon" size={18} />
                      <select
                        value={showNewCategory ? 'new' : formData.categoryId}
                        onChange={(e) => {
                          if (e.target.value === 'new') {
                            setShowNewCategory(true);
                            setFormData({ ...formData, categoryId: '' });
                          } else {
                            setShowNewCategory(false);
                            setFormData({ ...formData, categoryId: e.target.value });
                          }
                        }}
                        required
                      >
                        <option value="" disabled>Selecciona una categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                        <option value="new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Nueva categoría...</option>
                      </select>
                    </div>

                    <AnimatePresence>
                      {showNewCategory && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="input-wrapper">
                            <Plus className="input-icon" size={18} />
                            <input
                              type="text"
                              placeholder="Nombre de la nueva categoría"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              autoFocus
                              required={showNewCategory}
                            />
                            <button 
                              type="button" 
                              onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                              className="input-wrapper-inner-x"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="form-group">
                  <label>Nombre del Plato</label>
                  <div className="input-wrapper">
                    <Utensils className="input-icon" size={18} />
                    <input type="text" placeholder="Ej: Pizza Napolitana" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Precio ($)</label>
                  <div className="input-wrapper">
                    <DollarSign className="input-icon" size={18} />
                    <input type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>¿Requiere preparación?</label>
                  <div 
                    className="input-wrapper requires-prep-switch-wrapper" 
                    onClick={() => setRequiresPrep(!requiresPrep)}
                  >
                    <Clock className="input-icon" size={18} color={requiresPrep ? 'var(--primary)' : 'var(--text-muted)'} />
                    <span className="requires-prep-label-span" style={{ color: requiresPrep ? 'var(--text)' : 'var(--text-muted)' }}>
                      {requiresPrep ? 'Sí, necesita tiempo' : 'No, entrega inmediata'}
                    </span>
                    <div className={`requires-prep-toggle-track ${requiresPrep ? 'active' : 'inactive'}`}>
                      <div className="requires-prep-toggle-knob" />
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {requiresPrep && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="form-group">
                      <label>Tiempo estimado (minutos)</label>
                      <div className="input-wrapper">
                        <Clock className="input-icon" size={18} />
                        <input 
                          type="number" 
                          placeholder="Ej: 15" 
                          value={formData.prepTime} 
                          onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} 
                          required={requiresPrep}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="form-group">
                <label>Descripción</label>
                <div className="input-wrapper textarea-prep-wrapper">
                  <AlignLeft className="input-icon" size={18} style={{ top: '1.1rem' }} />
                  <textarea placeholder="Ingredientes, tamaño..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" />
                </div>
              </div>

              {/* Adiciones / Grupos */}
              <div className="form-group">
                <div className="additions-header-wrapper">
                  <label className="additions-header-label">Grupos de Adiciones / Opciones</label>
                  <button type="button" onClick={handleAddGroup} className="btn-secondary additions-add-group-btn">
                    <Plus size={14} /> Añadir Grupo
                  </button>
                </div>

                <div className="additions-groups-flex">
                  {formData.groups.map((group, gIdx) => (
                    <motion.div
                      key={gIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card addition-group-glass-card"
                    >
                      <div className="addition-group-header">
                        <div style={{ flex: 1 }}>
                          <div className="form-group">
                            <div className="input-wrapper">
                              <input
                                type="text"
                                placeholder="Título (ej: Salsa, Acompañamiento...)"
                                value={group.title}
                                onChange={(e) => handleGroupChange(gIdx, 'title', e.target.value)}
                                className="addition-group-title-input"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="addition-group-required-checkbox">
                          <input type="checkbox" id={`req-${gIdx}`} checked={group.isRequired} onChange={(e) => handleGroupChange(gIdx, 'isRequired', e.target.checked)} />
                          <label htmlFor={`req-${gIdx}`}>Obligatorio</label>
                        </div>
                        <button type="button" onClick={() => handleRemoveGroup(gIdx)} className="addition-group-remove-btn">
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="addition-group-minmax-grid">
                        <div className="form-group">
                          <label>Mín. de selecciones</label>
                          <div className="input-wrapper">
                            <input type="number" min="0" value={group.minSelectable} onChange={(e) => handleGroupChange(gIdx, 'minSelectable', parseInt(e.target.value) || 0)} className="addition-group-title-input" />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Máx. de selecciones</label>
                          <div className="input-wrapper">
                            <input type="number" min="0" value={group.maxSelectable} onChange={(e) => handleGroupChange(gIdx, 'maxSelectable', parseInt(e.target.value) || 1)} className="addition-group-title-input" />
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.2rem' }}>
                        <label className="addition-group-options-title">Opciones del grupo</label>
                        {(group.options || []).map((opt, oIdx) => (
                          <div key={oIdx} className="addition-group-option-row">
                            <div className="input-wrapper">
                              <input type="text" placeholder="Nombre de la opción" value={opt.name} onChange={(e) => handleOptionChange(gIdx, oIdx, 'name', e.target.value)} />
                            </div>
                            <div className="input-wrapper">
                              <DollarSign className="input-icon" size={14} style={{ left: '0.8rem' }} />
                              <input type="number" placeholder="Extra" value={opt.extraPrice} onChange={(e) => handleOptionChange(gIdx, oIdx, 'extraPrice', parseFloat(e.target.value) || 0)} className="addition-group-option-row-extra" />
                            </div>
                            <button type="button" onClick={() => handleRemoveOption(gIdx, oIdx)} className="addition-group-option-remove-btn">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => handleAddOption(gIdx)} className="addition-group-add-option-dashed-btn">
                          <Plus size={14} /> Añadir una opción a este grupo
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Imagen del Plato</label>
                <div className="item-image-selection-flex">
                  <div 
                    onClick={() => !isProcessingImage && fileInputRef.current.click()} 
                    className={`item-image-upload-dashed-box ${isProcessingImage ? 'not-clickable' : 'clickable'}`}
                  >
                    {previewUrl && !isProcessingImage ? (
                      <img src={previewUrl} alt="preview" />
                    ) : (
                      <div className="item-image-upload-inner-text">
                        {isProcessingImage ? <Loader2 className="spin" size={24} color="var(--primary)" /> : <Camera size={24} color="var(--text-muted)" />}
                        {isProcessingImage && <p>Optimizando...</p>}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="item-image-instructions-text">Sube una foto atractiva (Max 2MB. Se comprimirá automáticamente)</p>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" hidden />
                    <button type="button" className="btn-secondary item-image-select-btn" onClick={() => fileInputRef.current.click()} disabled={isProcessingImage}>
                      {isProcessingImage ? 'Procesando...' : 'Seleccionar Archivo'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Disponibilidad</label>
                <div className="item-availability-row-wrapper" onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}>
                  {formData.isAvailable ? <Eye size={18} color="#4ade80" /> : <EyeOff size={18} color="#f87171" />}
                  <span className="item-availability-label" style={{ color: formData.isAvailable ? '#4ade80' : '#f87171' }}>
                    {formData.isAvailable ? 'Disponible en Carta' : 'Agotado Temporalmente'}
                  </span>
                </div>
              </div>

              <div className="form-actions-flex">
                <button type="submit" className="btn-primary form-actions-flex-btn-submit" disabled={saving || isProcessingImage}>
                  {saving ? <Loader2 className="spin" size={18} /> : (editingId ? <Save size={18} /> : <Plus size={18} />)}
                  {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar Plato')}
                </button>
                <button type="button" className="btn-primary form-actions-flex-btn-cancel" onClick={resetForm}>Cancelar</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="menu-loading-container">
          <Loader2 className="spin" size={32} color="var(--primary)" />
          <p className="menu-loading-text">Cargando carta...</p>
        </div>
      ) : (
        <div className="menu-sections">
          {displayedGroupNames.map((catName) => (
            <div key={catName} className="menu-category-section">
              <h4 className="menu-category-title-header">
                <Utensils size={24} />
                {catName}
                <span className="menu-category-title-count">
                  {groupedItems[catName].length} platos
                </span>
              </h4>
              
              <div className="menu-grid">
                <AnimatePresence>
                  {groupedItems[catName].map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className={`glass-card admin-item-card ${item.isAvailable ? 'is-available' : 'is-unavailable'}`}
                    >
                      {/* Image Area */}
                      <div className="admin-item-image-container">
                        <img 
                          src={resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=500'} 
                          alt={item.name} 
                          className="admin-item-img" 
                        />
                        
                        {/* High contrast Price Badge aligned top-left */}
                        <span className="admin-item-price-tag">
                          ${formatCurrency(item.price)}
                        </span>

                        {/* Top-Right High Contrast Prep Time badge */}
                        {item.prepTime > 0 && (
                          <div className="admin-item-prep-badge">
                            <Clock size={11} style={{ color: '#f97316' }} />
                            <span>{item.prepTime} min</span>
                          </div>
                        )}

                        {/* Red AGOTADO overlay when unavailable */}
                        {!item.isAvailable && (
                          <div className="admin-item-out-of-stock-overlay">
                            <EyeOff size={22} />
                            <span className="admin-item-out-of-stock-badge">AGOTADO</span>
                          </div>
                        )}
                      </div>

                      {/* Content panel */}
                      <div className="admin-item-content">
                        {/* Title showing completely up to 2 lines, reserved min height for vertical alignment grid */}
                        <h4 className="admin-item-title" title={item.name}>
                          {item.name}
                        </h4>

                        <div className="admin-item-footer">
                          {/* Modern Toggle Switch for instant stock control */}
                          <div className="admin-item-stock-toggle">
                            <button
                              type="button"
                              onClick={() => handleToggleAvailable(item)}
                              className={`admin-toggle-switch ${item.isAvailable ? 'available' : 'unavailable'}`}
                              title={item.isAvailable ? 'Marcar como Agotado' : 'Marcar como Disponible'}
                            >
                              <div className="admin-toggle-knob" />
                            </button>
                            {/* Word 'Disponible' colored in solid White */}
                            <span className={`admin-stock-label ${item.isAvailable ? 'available' : 'unavailable'}`}>
                              {item.isAvailable ? 'Disponible' : 'Agotado'}
                            </span>
                          </div>

                          {/* Action Buttons separated into individual high contrast black glass circles */}
                          <div className="admin-actions-flex">
                            <button 
                              onClick={() => handleEdit(item)} 
                              className="admin-action-btn-circle edit"
                              title="Editar"
                            >
                              <Edit2 size={13} strokeWidth={2.2} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(item)} 
                              className="admin-action-btn-circle delete"
                              title="Eliminar"
                            >
                              <Trash2 size={13} strokeWidth={2.2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {items.length === 0 && !loading && (
            <div className="menu-empty-state-container">
              <Utensils size={48} className="menu-empty-state-icon" />
              <p className="menu-empty-state-text">No hay platos registrados en esta carta.</p>
            </div>
          )}
        </div>
      )}

      {/* Premium Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="admin-delete-modal-overlay"
            onClick={() => { setDeleteConfirmId(null); setDeleteConfirmItemName(''); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="glass-card admin-delete-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-delete-modal-icon-container">
                <Trash2 size={32} />
              </div>
              <h3 className="admin-delete-modal-title">¿Eliminar Plato?</h3>
              <p className="admin-delete-modal-description">
                ¿Estás seguro de que deseas eliminar permanentemente este plato? Esta acción no se puede deshacer.
                <span className="admin-delete-modal-item-name">"{deleteConfirmItemName}"</span>
              </p>
              <div className="admin-delete-modal-actions">
                <button 
                  type="button" 
                  onClick={() => { setDeleteConfirmId(null); setDeleteConfirmItemName(''); }}
                  className="admin-delete-modal-btn-cancel"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleConfirmDelete}
                  className="admin-delete-modal-btn-confirm"
                >
                  Sí, Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuItemManager;
