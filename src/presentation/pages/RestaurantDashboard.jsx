import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Utensils, QrCode, ArrowLeft, Store, Users, ClipboardList } from 'lucide-react';
import MenuItemManager from '../components/dashboard/MenuItemManager';
import OperatingHoursManager from '../components/dashboard/OperatingHoursManager';
import QRManager from '../components/dashboard/QRManager';
import RestaurantInfoManager from '../components/dashboard/RestaurantInfoManager';
import StaffManager from '../components/dashboard/StaffManager';
import OrderManager from '../components/dashboard/OrderManager';
import { isStaff } from '../../core/entities/User';
import './RestaurantDashboard.css';

/**
 * RestaurantDashboard — Tab-based management panel for a single restaurant.
 * Reads current user from localStorage to determine available tabs.
 *
 * @param {{ restaurant: import('../../core/entities/Restaurant').Restaurant, onBack: Function | null }} props
 */
const RestaurantDashboard = ({ restaurant: initialRestaurant, onBack }) => {
  const [restaurant, setRestaurant] = useState(initialRestaurant);

  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem('qhay_user') || 'null'); } catch { return null; }
  })();
  const userIsStaff = savedUser ? isStaff(savedUser) : false;

  const [activeTab, setActiveTab] = useState(userIsStaff ? 'orders' : 'menu');

  const tabs = [
    { id: 'orders', label: 'Pedidos', icon: <ClipboardList size={18} />, ownerOnly: false },
    { id: 'menu',   label: 'Carta',   icon: <Utensils size={18} />,       ownerOnly: false },
    { id: 'hours',  label: 'Horarios', icon: <Clock size={18} />,         ownerOnly: true  },
    { id: 'info',   label: 'Perfil',  icon: <Store size={18} />,          ownerOnly: true  },
    { id: 'staff',  label: 'Staff',   icon: <Users size={18} />,          ownerOnly: true  },
    { id: 'qrs',    label: 'QRs',     icon: <QrCode size={18} />,         ownerOnly: true  },
  ];

  const visibleTabs = tabs.filter((t) => !t.ownerOnly || !userIsStaff);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {onBack && (
            <button onClick={onBack} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem', alignSelf: 'center' }}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>{restaurant.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Panel de Administración</p>
          </div>
        </div>

        <div className="dashboard-tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'menu'   && <MenuItemManager restaurantId={restaurant.id} />}
        {activeTab === 'orders' && <OrderManager restaurantId={restaurant.id} />}
        {activeTab === 'hours'  && <OperatingHoursManager restaurantId={restaurant.id} />}
        {activeTab === 'staff'  && <StaffManager restaurantId={restaurant.id} />}
        {activeTab === 'qrs'    && <QRManager restaurantId={restaurant.id} restaurantName={restaurant.name} />}
        {activeTab === 'info'   && <RestaurantInfoManager restaurant={restaurant} onUpdate={setRestaurant} />}
      </motion.div>
    </div>
  );
};

export default RestaurantDashboard;
