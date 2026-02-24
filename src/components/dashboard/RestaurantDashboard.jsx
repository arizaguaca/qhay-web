import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Utensils, QrCode, ArrowLeft, Settings, Layout, Store } from 'lucide-react';
import MenuItemManager from './MenuItemManager';
import OperatingHoursManager from './OperatingHoursManager';
import QRManager from './QRManager';
import RestaurantInfoManager from './RestaurantInfoManager';
import './Dashboard.css';

const RestaurantDashboard = ({ restaurant: initialRestaurant, onBack }) => {
    const [restaurant, setRestaurant] = useState(initialRestaurant);
    const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'hours', 'qrs', 'info'

    const handleRestaurantUpdate = (updatedData) => {
        setRestaurant(updatedData);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{restaurant.name}</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Panel de Administración</p>
                    </div>
                </div>

                <div className="dashboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
                        onClick={() => setActiveTab('menu')}
                    >
                        <Utensils size={18} /> Carta
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'hours' ? 'active' : ''}`}
                        onClick={() => setActiveTab('hours')}
                    >
                        <Clock size={18} /> Horarios
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        <Store size={18} /> Perfil
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'qrs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('qrs')}
                    >
                        <QrCode size={18} /> QRs
                    </button>
                </div>
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'menu' && <MenuItemManager restaurantId={restaurant.id} />}
                {activeTab === 'hours' && <OperatingHoursManager restaurantId={restaurant.id} />}
                {activeTab === 'qrs' && <QRManager restaurantId={restaurant.id} />}
                {activeTab === 'info' && <RestaurantInfoManager restaurant={restaurant} onUpdate={handleRestaurantUpdate} />}
            </motion.div>
        </div>
    );
};

export default RestaurantDashboard;
