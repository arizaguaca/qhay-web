import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Check, Loader2, Utensils, AlignLeft, DollarSign, Eye, EyeOff, Camera, Clock } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { menuRepository } from '../../../data/repositories/menuRepository';
import { resolveImageUrl } from '../../../data/api/httpClient';
import { processImage } from '../../utils/imageProcessor';

/**
 * MenuItemManager — CRUD interface for restaurant menu items.
 * Uses useMenu hook for all data operations.
 *
 * @param {{ restaurantId: string }} props
 */
const MenuItemManager = ({ restaurantId }) => {
  const { items, categories, loading, saving, save, remove, saveCategory } = useMenu(menuRepository, restaurantId);

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
      groups: item.groups ? JSON.parse(JSON.stringify(item.groups)) : [],
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

  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este plato?')) return;
    await remove(id);
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona los platos y precios de tu restaurante</p>
        </div>
        {!isAdding && (
          <button className="btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={18} /> Agregar Plato
          </button>
        )}
      </div>

      {/* Categoría Filtros */}
      {!loading && usedCategories.length > 0 && !isAdding && (
        <div className="category-filters" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginTop: '1rem', scrollbarWidth: 'none' }}>
          <button 
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
            style={{ 
              padding: '0.5rem 1.25rem', 
              borderRadius: '20px', 
              border: '1px solid var(--border)', 
              background: selectedCategory === 'all' ? 'var(--primary)' : 'transparent',
              color: selectedCategory === 'all' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s',
              fontWeight: '500'
            }}
          >
            Todos
          </button>
          {usedCategories.map(cat => (
            <button 
              key={cat.id}
              className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
              style={{ 
                padding: '0.5rem 1.25rem', 
                borderRadius: '20px', 
                border: '1px solid var(--border)', 
                background: selectedCategory === cat.id ? 'var(--primary)' : 'transparent',
                color: selectedCategory === cat.id ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s',
                fontWeight: '500'
              }}
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
            style={{ marginBottom: '2rem' }}
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
                  <label>Categoría</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                              style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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

              <div className="form-grid" style={{ marginTop: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Precio ($)</label>
                  <div className="input-wrapper">
                    <DollarSign className="input-icon" size={18} />
                    <input type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>¿Requiere preparación?</label>
                  <div 
                    className="input-wrapper" 
                    onClick={() => setRequiresPrep(!requiresPrep)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', height: '100%', minHeight: '48px', padding: '0 1rem' }}
                  >
                    <Clock className="input-icon" size={18} color={requiresPrep ? 'var(--primary)' : 'var(--text-muted)'} />
                    <span style={{ marginLeft: '2.5rem', fontSize: '0.9rem', color: requiresPrep ? 'var(--text)' : 'var(--text-muted)' }}>
                      {requiresPrep ? 'Sí, necesita tiempo' : 'No, entrega inmediata'}
                    </span>
                    <div style={{ marginLeft: 'auto', width: '40px', height: '20px', borderRadius: '10px', background: requiresPrep ? 'var(--primary)' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.3s' }}>
                      <div style={{ position: 'absolute', left: requiresPrep ? '22px' : '2px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
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
                    <div className="form-group" style={{ marginTop: '1.25rem' }}>
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

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Descripción</label>
                <div className="input-wrapper">
                  <AlignLeft className="input-icon" size={18} style={{ top: '1.1rem' }} />
                  <textarea placeholder="Ingredientes, tamaño..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" style={{ paddingLeft: '3rem', paddingTop: '0.875rem' }} />
                </div>
              </div>

              {/* Adiciones / Grupos */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ margin: 0, color: 'var(--primary)', fontWeight: '600' }}>Grupos de Adiciones / Opciones</label>
                  <button type="button" onClick={handleAddGroup} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}>
                    <Plus size={14} /> Añadir Grupo
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {formData.groups.map((group, gIdx) => (
                    <motion.div
                      key={gIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card"
                      style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.2rem' }}>
                        <div style={{ flex: 1 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <div className="input-wrapper">
                              <input
                                type="text"
                                placeholder="Título (ej: Salsa, Acompañamiento...)"
                                value={group.title}
                                onChange={(e) => handleGroupChange(gIdx, 'title', e.target.value)}
                                style={{ paddingLeft: '1.2rem' }}
                              />
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                          <input type="checkbox" id={`req-${gIdx}`} checked={group.isRequired} onChange={(e) => handleGroupChange(gIdx, 'isRequired', e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                          <label htmlFor={`req-${gIdx}`} style={{ margin: 0, fontSize: '0.85rem', cursor: 'pointer' }}>Obligatorio</label>
                        </div>
                        <button type="button" onClick={() => handleRemoveGroup(gIdx)} style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mín. de selecciones</label>
                          <div className="input-wrapper">
                            <input type="number" min="0" value={group.minSelectable} onChange={(e) => handleGroupChange(gIdx, 'minSelectable', parseInt(e.target.value) || 0)} style={{ paddingLeft: '1.2rem' }} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Máx. de selecciones</label>
                          <div className="input-wrapper">
                            <input type="number" min="0" value={group.maxSelectable} onChange={(e) => handleGroupChange(gIdx, 'maxSelectable', parseInt(e.target.value) || 1)} style={{ paddingLeft: '1.2rem' }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.2rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem', display: 'block' }}>Opciones del grupo</label>
                        {group.options.map((opt, oIdx) => (
                          <div key={oIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-wrapper">
                              <input type="text" placeholder="Nombre de la opción" value={opt.name} onChange={(e) => handleOptionChange(gIdx, oIdx, 'name', e.target.value)} style={{ paddingLeft: '1.2rem', fontSize: '0.9rem' }} />
                            </div>
                            <div className="input-wrapper">
                              <DollarSign className="input-icon" size={14} style={{ left: '0.8rem' }} />
                              <input type="number" placeholder="Extra" value={opt.extraPrice} onChange={(e) => handleOptionChange(gIdx, oIdx, 'extraPrice', parseFloat(e.target.value) || 0)} style={{ paddingLeft: '2.2rem', fontSize: '0.9rem' }} />
                            </div>
                            <button type="button" onClick={() => handleRemoveOption(gIdx, oIdx)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => handleAddOption(gIdx)} style={{ background: 'transparent', border: '1px dashed var(--primary)', borderRadius: '8px', color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.6rem', width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <Plus size={14} /> Añadir una opción a este grupo
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Imagen del Plato</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div 
                    onClick={() => !isProcessingImage && fileInputRef.current.click()} 
                    style={{ 
                      width: '120px', 
                      height: '100px', 
                      borderRadius: '15px', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '2px dashed var(--border)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: isProcessingImage ? 'not-allowed' : 'pointer', 
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {previewUrl && !isProcessingImage ? (
                      <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        {isProcessingImage ? <Loader2 className="spin" size={24} color="var(--primary)" /> : <Camera size={24} color="var(--text-muted)" />}
                        {isProcessingImage && <p style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>Optimizando...</p>}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sube una foto atractiva (Max 2MB. Se comprimirá automáticamente)</p>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" hidden />
                    <button type="button" className="btn-secondary" onClick={() => fileInputRef.current.click()} disabled={isProcessingImage} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                      {isProcessingImage ? 'Procesando...' : 'Seleccionar Archivo'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ margin: '1.5rem 0' }}>
                <label>Disponibilidad</label>
                <div className="input-wrapper" onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', height: '48px', padding: '0 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  {formData.isAvailable ? <Eye size={18} color="#4ade80" /> : <EyeOff size={18} color="#f87171" />}
                  <span style={{ marginLeft: '0.75rem', fontWeight: '500', color: formData.isAvailable ? '#4ade80' : '#f87171' }}>
                    {formData.isAvailable ? 'Disponible en Carta' : 'Agotado Temporalmente'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving || isProcessingImage}>
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
        <div className="menu-sections">
          {displayedGroupNames.map((catName) => (
            <div key={catName} className="menu-category-section" style={{ marginBottom: '3rem' }}>
              <h4 style={{ 
                fontSize: '1.5rem', 
                marginBottom: '1.5rem', 
                color: 'var(--primary)', 
                borderBottom: '2px solid rgba(var(--primary-rgb), 0.2)',
                paddingBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Utensils size={24} />
                {catName}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: 'auto' }}>
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
                      className={`glass-card menu-item-card ${!item.isAvailable ? 'out-of-stock' : ''}`}
                    >
                      <div className="menu-item-image-container">
                        <img src={resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=500'} alt={item.name} className="menu-item-img" />
                        <span className="price-tag">${parseFloat(item.price).toFixed(2)}</span>
                        {!item.isAvailable && (
                          <div className="stock-overlay"><EyeOff size={24} /><span>AGOTADO</span></div>
                        )}
                      </div>
                      <div style={{ padding: '1.25rem' }}>
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
            </div>
          ))}

          {items.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
              <Utensils size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)' }}>No hay platos registrados en esta carta.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuItemManager;
