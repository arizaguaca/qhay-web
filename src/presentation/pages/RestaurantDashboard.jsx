import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Utensils, QrCode, ArrowLeft, Store, Users, ClipboardList, Calendar, BarChart3, ChefHat, Wallet } from 'lucide-react';
import MenuItemManager from '../components/dashboard/MenuItemManager';
import OperatingHoursManager from '../components/dashboard/OperatingHoursManager';
import QRManager from '../components/dashboard/QRManager';
import RestaurantInfoManager from '../components/dashboard/RestaurantInfoManager';
import StaffManager from '../components/dashboard/StaffManager';
import OrderManager from '../components/dashboard/OrderManager';
import TableManager from '../components/dashboard/TableManager';
import KDSManager from '../components/dashboard/KDSManager';
import CashierManager from '../components/dashboard/CashierManager';
import { isStaff } from '../../core/entities/User';
import { useSocket } from '../context/SocketContext';
import './RestaurantDashboard.css';

/**
 * RestaurantDashboard — Tab-based management panel for a single restaurant.
 * Reads current user from localStorage to determine available tabs.
 *
 * @param {{ restaurant: import('../../core/entities/Restaurant').Restaurant, onBack: Function | null }} props
 */
const RestaurantDashboard = ({ restaurant: initialRestaurant, onBack }) => {
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const { connect, disconnect } = useSocket();

  React.useEffect(() => {
    if (restaurant.id) {
      connect(restaurant.id);
    }
    return () => disconnect();
  }, [restaurant.id, connect, disconnect]);

  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem('qhay_user') || 'null'); } catch { return null; }
  })();
  const userIsStaff = savedUser ? isStaff(savedUser) : false;
  const isCook = savedUser?.role === 'cook';
  const isCashier = savedUser?.role === 'cashier';

  const [activeTab, setActiveTab] = useState(isCook ? 'kds' : isCashier ? 'caja' : userIsStaff ? 'tables' : 'menu');

  const tabs = [
    { id: 'tables', label: 'Mesas', icon: <Store size={18} />, ownerOnly: false },
    { id: 'orders', label: 'Pedidos', icon: <ClipboardList size={18} />, ownerOnly: false },
    { id: 'kds', label: 'Cocina', icon: <ChefHat size={18} />, ownerOnly: false },
    { id: 'caja', label: 'Caja', icon: <Wallet size={18} />, ownerOnly: false },
    { id: 'reservations', label: 'Reservas', icon: <Calendar size={18} />, ownerOnly: false },
    { id: 'menu', label: 'Carta', icon: <Utensils size={18} />, ownerOnly: false },
    { id: 'hours', label: 'Horarios', icon: <Clock size={18} />, ownerOnly: true },
    { id: 'metrics', label: 'Métricas', icon: <BarChart3 size={18} />, ownerOnly: true },
    { id: 'info', label: 'Perfil', icon: <Store size={18} />, ownerOnly: true },
    { id: 'staff', label: 'Staff', icon: <Users size={18} />, ownerOnly: true },
    { id: 'qrs', label: 'QRs', icon: <QrCode size={18} />, ownerOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.ownerOnly || !userIsStaff);

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            {onBack && (
              <button onClick={onBack} className="sidebar-back-btn">
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="qhay-brand">
              <h1>Qhaay</h1>
            </div>
          </div>
          <div className="restaurant-brand">
            <h2>{restaurant.name}</h2>
          </div>
        </div>

        <div className="dashboard-sidebar-nav">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <p className="version-tag">Qhay v1.0</p>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <h3>{tabs.find(t => t.id === activeTab)?.label}</h3>
        </header>

        <div className="main-content">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'menu' && <MenuItemManager restaurantId={restaurant.id} />}
            {activeTab === 'tables' && <TableManager restaurantId={restaurant.id} />}
            {activeTab === 'orders' && <OrderManager restaurantId={restaurant.id} />}
            {activeTab === 'kds' && <KDSManager restaurantId={restaurant.id} />}
            {activeTab === 'caja' && <CashierManager restaurantId={restaurant.id} />}
            {activeTab === 'reservations' && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <Calendar size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Gestión de Reservas</h3>
                <p style={{ color: 'var(--text-muted)' }}>Próximamente: Administra las reservas de tus clientes aquí.</p>
              </div>
            )}
            {activeTab === 'metrics' && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <BarChart3 size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Métricas y Estadísticas</h3>
                <p style={{ color: 'var(--text-muted)' }}>Próximamente: Analiza el rendimiento y ventas de tu local.</p>
              </div>
            )}
            {activeTab === 'hours' && <OperatingHoursManager restaurantId={restaurant.id} />}
            {activeTab === 'staff' && <StaffManager restaurantId={restaurant.id} />}
            {activeTab === 'qrs' && <QRManager restaurantId={restaurant.id} restaurantName={restaurant.name} />}
            {activeTab === 'info' && <RestaurantInfoManager restaurant={restaurant} onUpdate={setRestaurant} />}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantDashboard;
