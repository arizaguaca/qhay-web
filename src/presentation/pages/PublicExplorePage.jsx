import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Utensils, MapPin, Search, ChevronRight, Star, Navigation as NavigationIcon } from 'lucide-react';
import { restaurantRepository } from '../../data/repositories/restaurantRepository';
import { catalogRepository } from '../../data/repositories/catalogRepository';
import { resolveImageUrl } from '../../data/api/httpClient';
import './PublicExplorePage.css';

const PublicExplorePage = ({ onSelectRestaurant }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      restaurantRepository.getAll(),
      catalogRepository.getCities()
    ])
    .then(([restData, citiesData]) => {
      setRestaurants(restData);
      setCities(citiesData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const getCityName = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : '';
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.cuisineId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCityName(r.cityId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="explore-container">
      <header className="explore-header">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Descubre Sabores
        </motion.h1>
        <p>Explora los mejores restaurantes y reserva tu mesa en segundos</p>
        
        <div className="search-bar-container">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Busca por nombre, cocina o ciudad..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="explore-main">
        {loading ? (
          <div className="loading-state">Cargando restaurantes...</div>
        ) : (
          <div className="restaurant-grid">
            {filteredRestaurants.map((rest, idx) => (
              <motion.div 
                key={rest.id}
                className="glass-card restaurant-explore-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                onClick={() => onSelectRestaurant(rest.id)}
              >
                <div className="card-image">
                  <img 
                    src={resolveImageUrl(rest.logoUrl) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'} 
                    alt={rest.name} 
                  />
                  <div className="category-badge">{rest.cuisineId}</div>
                </div>
                <div className="card-content">
                  <h3>{rest.name}</h3>
                  <div className="info-row">
                    <MapPin size={14} />
                    <span>{rest.address}</span>
                  </div>
                  <div className="info-row">
                    <NavigationIcon size={14} />
                    <span>{getCityName(rest.cityId)}</span>
                  </div>
                  <div className="card-footer">
                    <div className="rating">
                      <Star size={14} fill="var(--primary)" color="var(--primary)" />
                      <span>4.8</span>
                    </div>
                    <button className="btn-explore">
                      Ver Menú <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicExplorePage;
