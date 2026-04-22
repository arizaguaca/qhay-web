import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, AlignLeft, MapPin, Phone, Image as ImageIcon, ArrowRight, CheckCircle2, AlertCircle, Upload, Link, X, Plus, ChevronRight, Building2, Navigation as NavigationIcon } from 'lucide-react';
import { useRestaurants, useRestaurant } from '../hooks/useRestaurants';
import { isStaff } from '../../core/entities/User';
import { resolveImageUrl } from '../../data/api/httpClient';
import { catalogRepository } from '../../data/repositories/catalogRepository';
import RestaurantDashboard from './RestaurantDashboard';
import './RestaurantsPage.css';

/**
 * RestaurantsPage — Manages the list of restaurants and creation form.
 * Delegates data orchestration to useRestaurants hook.
 *
 * @param {{ restaurantRepository: Object, currentUser: import('../../core/entities/User').User }} props
 */
const RestaurantsPage = ({ restaurantRepository, currentUser }) => {
  const ownerId = currentUser?.id;
  const userIsStaff = isStaff(currentUser);
  const staffRestaurantId = currentUser?.restaurantId;

  const { restaurants, loading, create } = useRestaurants(
    restaurantRepository,
    userIsStaff ? null : ownerId
  );

  // Staff users load their specific restaurant via useRestaurant
  const { restaurant: staffRestaurant, loading: staffLoading } = useRestaurant(
    restaurantRepository,
    userIsStaff ? staffRestaurantId : null
  );

  const [view, setView] = useState('list'); // 'list' | 'register' | 'dashboard'
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [logoMode, setLogoMode] = useState('url');
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', description: '', address: '', phone: '',
    locationType: '', cuisineType: '', cityId: '', mallId: '', link: '',
    owner_id: ownerId, logo_url: '',
  });

  const [malls, setMalls] = useState([]);
  const [cities, setCities] = useState([]);
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [showCustomCuisine, setShowCustomCuisine] = useState(false);
  const [customCuisine, setCustomCuisine] = useState('');

  React.useEffect(() => {
    const loadInitialCatalogs = async () => {
      try {
        const [citiesData, cuisineData] = await Promise.all([
          catalogRepository.getCities(),
          catalogRepository.getCuisineTypes(ownerId)
        ]);
        setCities(citiesData);
        setCuisineTypes(cuisineData);
      } catch (err) {
        console.error('Error loading catalogs:', err);
      }
    };
    loadInitialCatalogs();
  }, [ownerId]);

  // Fetch malls when cityId changes
  React.useEffect(() => {
    if (!formData.cityId) {
      setMalls([]);
      return;
    }
    catalogRepository.getMallsByCity(formData.cityId)
      .then(setMalls)
      .catch(err => console.error('Error loading malls for city:', err));
  }, [formData.cityId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cuisineType' && value === 'CUSTOM') {
      setShowCustomCuisine(true);
      return;
    }
    
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      // Reset mallId if locationType changes back to Stand-alone
      if (name === 'locationType' && value === 'Stand-alone') {
        newState.mallId = '';
      }
      if (name === 'cityId') {
        newState.mallId = '';
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

  const removeImage = () => {
    setPreviewUrl('');
    setLogoFile(null);
    setFormData((prev) => ({ ...prev, logo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenDashboard = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setView('dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus('loading');
    try {
      if (!formData.cityId) {
        throw new Error('Debe seleccionar una ciudad.');
      }
      if (formData.locationType === 'Food Court' && !formData.mallId) {
        throw new Error('Debe seleccionar un centro comercial para locales en Plazoleta de Comidas.');
      }
      let finalCuisineType = formData.cuisineType;
      
      // If a custom cuisine was entered, we create the cuisine type record first
      // to get the ID, and then send that ID to the restaurant creation.
      if (showCustomCuisine && customCuisine) {
        try {
          // Creating custom cuisine type with ownerId
          const newCuisine = await catalogRepository.createCuisineType(customCuisine, ownerId);
          finalCuisineType = newCuisine.id;
        } catch (cErr) {
          console.error('Failed to create custom cuisine type:', cErr);
          throw new Error('No se pudo crear el nuevo tipo de cocina. Por favor intente de nuevo.');
        }
      }

      const createdRestaurant = await create(
        {
          ...formData,
          cuisineType: finalCuisineType,
          cityId: formData.cityId,
          logoMode,
          logo_url: typeof formData.logo_url === 'string' ? formData.logo_url.trim() : formData.logo_url,
        },
        logoFile
      );

      // Since we already created it and got the ID, 
      // the backend should have the association if it stores the ID.
      // If we need to UPDATE the cuisine type with the new restaurant ID:
      if (showCustomCuisine && createdRestaurant.id && finalCuisineType) {
        try {
          // This part depends on if the backend needs an explicit update of the cuisine type 
          // to link it to the restaurant. The user's curl had restaurantId in the POST.
          // Since we didn't have it before, we might need a way to link it, 
          // but the restaurant record itself now points to this cuisine type ID.
        } catch (cErr) {
          console.warn('Failed to link custom cuisine type:', cErr);
        }
      }

      setSaveStatus('success');
      setSaveMessage('¡Restaurante registrado exitosamente!');
      setTimeout(() => {
        setView('list');
        setSaveStatus('idle');
        setFormData({
          name: '', description: '', address: '', phone: '',
          locationType: '', cuisineType: '', cityId: '', mallId: '', link: '',
          owner_id: ownerId, logo_url: '',
        });
        setPreviewUrl('');
        setLogoFile(null);
      }, 2000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(err.message);
    }
  };

  // Staff auto-redirect to their restaurant
  if (userIsStaff && staffRestaurant && view !== 'dashboard') {
    return <RestaurantDashboard restaurant={staffRestaurant} onBack={null} />;
  }

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
                {restaurants.map((rest) => (
                  <motion.div
                    key={rest.id}
                    className="glass-card restaurant-card"
                    whileHover={{ y: -5, borderColor: 'var(--primary)' }}
                    onClick={() => handleOpenDashboard(rest)}
                  >
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {rest.logoUrl
                          ? <img src={resolveImageUrl(rest.logoUrl)} alt={rest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Utensils size={24} color="var(--primary)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{rest.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{rest.address}
                        </p>
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
                <div className="icon-badge"><Plus size={32} color="var(--primary)" /></div>
                <button onClick={() => setView('list')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
              <h2>Nuevo Restaurante</h2>
              <p>Ingresa los detalles de tu nuevo establecimiento</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="name">Nombre</label>
                <div className="input-wrapper">
                  <Utensils className="input-icon" size={18} />
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre del local" required />
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
                <label htmlFor="phone">Teléfono</label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Dirección</label>
                <div className="input-wrapper">
                  <MapPin className="input-icon" size={18} />
                  <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Dirección física" required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cityId">Ciudad</label>
                <div className="input-wrapper">
                  <NavigationIcon className="input-icon" size={18} />
                  <select
                    id="cityId"
                    name="cityId"
                    value={formData.cityId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione una ciudad...</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>¿Dónde se encuentra su local?</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="locationType"
                      value="Stand-alone"
                      checked={formData.locationType === 'Stand-alone'}
                      onChange={handleChange}
                      required
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
                    <div className="form-group">
                      <label htmlFor="mallId">Seleccione el centro comercial</label>
                      <div className="input-wrapper">
                        <Building2 className="input-icon" size={18} />
                        <select
                          id="mallId"
                          name="mallId"
                          value={formData.mallId}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Selecciona uno…</option>
                          {malls.map((mall) => (
                            <option key={mall.id} value={mall.id}>{mall.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="cuisineType">¿Qué tipo de comida ofrece?</label>
                  <div className="input-wrapper">
                    <Utensils className="input-icon" size={18} />
                    <select
                      id="cuisineType"
                      name="cuisineType"
                      value={formData.cuisineType}
                      onChange={handleChange}
                      required={!showCustomCuisine}
                    >
                      <option value="">Selecciona uno…</option>
                      {cuisineTypes.map((cuisine) => (
                        <option key={cuisine.id} value={cuisine.id}>{cuisine.name}</option>
                      ))}
                      <option value="CUSTOM">+ Otro (Crear nuevo...)</option>
                    </select>
                  </div>
                </div>

                <AnimatePresence>
                  {showCustomCuisine && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', gridColumn: 'span 2' }}
                    >
                      <div className="form-group" style={{ marginTop: '0.5rem' }}>
                        <label>Nombre del nuevo tipo de cocina</label>
                        <div className="input-wrapper">
                          <Plus className="input-icon" size={18} />
                          <input
                            type="text"
                            value={customCuisine}
                            onChange={(e) => setCustomCuisine(e.target.value)}
                            placeholder="Ej: Comida Mediterránea"
                            required
                          />
                          <button 
                            type="button" 
                            onClick={() => { setShowCustomCuisine(false); setCustomCuisine(''); setFormData(p => ({...p, cuisineType: ''})); }}
                            style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="form-group">
                  <label htmlFor="link">Enlace (web o red social) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <div className="input-wrapper">
                    <Link className="input-icon" size={18} />
                    <input
                      type="url"
                      id="link"
                      name="link"
                      value={formData.link}
                      onChange={handleChange}
                      placeholder="https://instagram.com/milocal"
                    />
                  </div>
                </div>
              </div>

              <div className="logo-section">
                <div className="logo-header">
                  <label>Logo</label>
                  <div className="mode-selector">
                    <button
                      type="button"
                      className={logoMode === 'url' ? 'active' : ''}
                      onClick={() => {
                        if (logoMode === 'file') {
                          setLogoFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          setPreviewUrl('');
                        }
                        setLogoMode('url');
                      }}
                    >
                      <Link size={14} /> URL
                    </button>
                    <button
                      type="button"
                      className={logoMode === 'file' ? 'active' : ''}
                      onClick={() => {
                        setLogoMode('file');
                        setFormData((prev) => ({ ...prev, logo_url: '' }));
                        setPreviewUrl('');
                      }}
                    >
                      <Upload size={14} /> Subir
                    </button>
                  </div>
                </div>
                <div className="logo-content">
                  {logoMode === 'url' ? (
                    <div className="input-wrapper">
                      <ImageIcon className="input-icon" size={18} />
                      <input
                        type="text"
                        inputMode="url"
                        autoComplete="off"
                        id="logo_url"
                        name="logo_url"
                        value={formData.logo_url}
                        onChange={handleChange}
                        placeholder="https://…"
                      />
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
                className={`btn-primary submit-btn ${saveStatus === 'loading' ? 'loading' : ''}`}
                disabled={saveStatus === 'loading'}
              >
                {saveStatus === 'loading' ? 'Registrando...' : 'Crear Restaurante'}
              </motion.button>

              {saveStatus === 'success' && <div className="alert alert-success"><CheckCircle2 size={18} /><span>{saveMessage}</span></div>}
              {saveStatus === 'error' && <div className="alert alert-error"><AlertCircle size={18} /><span>{saveMessage}</span></div>}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantsPage;
