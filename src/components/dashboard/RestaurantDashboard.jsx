import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Utensils, QrCode, ArrowLeft, Settings, Layout, Store } from 'lucide-react';
import MenuItemManager from './MenuItemManager';
import OperatingHoursManager from './OperatingHoursManager';
import QRManager from './QRManager';
import RestaurantInfoManager from './RestaurantInfoManager';
import StaffManager from './StaffManager';
import OrderManager from './OrderManager';
import { Users, ClipboardList } from 'lucide-react';
import './Dashboard.css';

const RestaurantDashboard = ({ restaurant: initialRestaurant, onBack }) => {
    const [restaurant, setRestaurant] = useState(initialRestaurant);
    
    // Detectar rol del usuario
    const savedUser = localStorage.getItem('qhay_user');
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    const isStaff = currentUser?.role && currentUser?.role !== 'owner';

    const [activeTab, setActiveTab] = useState(isStaff ? 'orders' : 'menu');

    const handleRestaurantUpdate = (updatedData) => {
        setRestaurant(updatedData);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem', alignSelf: 'center' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>{restaurant.name}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Panel de Administración</p>
                    </div>
                </div>

                <div className="dashboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <ClipboardList size={18} /> Pedidos
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
                        onClick={() => setActiveTab('menu')}
                    >
                        <Utensils size={18} /> Carta
                    </button>
                    
                    {!isStaff && (
                        <>
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
                                className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                                onClick={() => setActiveTab('staff')}
                            >
                                <Users size={18} /> Staff
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'qrs' ? 'active' : ''}`}
                                onClick={() => setActiveTab('qrs')}
                            >
                                <QrCode size={18} /> QRs
                            </button>
                        </>
                    )}
                </div>
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'menu' && <MenuItemManager restaurantId={restaurant.id || restaurant.ID} />}
                {activeTab === 'hours' && <OperatingHoursManager restaurantId={restaurant.id || restaurant.ID} />}
                {activeTab === 'staff' && <StaffManager restaurantId={restaurant.id || restaurant.ID} />}
                {activeTab === 'orders' && <OrderManager restaurantId={restaurant.id || restaurant.ID} />}
                {activeTab === 'qrs' && <QRManager restaurantId={restaurant.id || restaurant.ID} />}
                {activeTab === 'info' && <RestaurantInfoManager restaurant={restaurant} onUpdate={handleRestaurantUpdate} />}
            </motion.div>
        </div>
    );
};

export default RestaurantDashboard;
