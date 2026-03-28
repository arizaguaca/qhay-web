import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UserRegister from './components/UserRegister'
import RestaurantRegister from './components/RestaurantRegister'
import Login from './components/Login'
import PublicMenu from './components/PublicMenu'
import './App.css'

import { RefreshCw, Utensils, LogOut, User as UserIcon } from 'lucide-react'

function App() {
  const [currentView, setCurrentView] = useState('restaurants')
  const [user, setUser] = useState(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  // Public Menu State (for QR Code scanning)
  const [publicRoute, setPublicRoute] = useState(null);

  useEffect(() => {
    // Detect public restaurant URL: /restaurants/:id?table=:num
    const path = window.location.pathname;
    const parts = path.split('/');

    if (parts.length === 3 && parts[1] === 'restaurants') {
      const restaurantId = parts[2];
      const params = new URLSearchParams(window.location.search);
      const tableNumber = params.get('table');
      setPublicRoute({ restaurantId, tableNumber });
    }

    const savedUser = localStorage.getItem('qhay_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsAuthChecking(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('qhay_user', JSON.stringify(userData))
    setCurrentView('restaurants')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('qhay_user')
    setCurrentView('login')
  }

  if (publicRoute) {
    return <PublicMenu restaurantId={publicRoute.restaurantId} tableNumber={publicRoute.tableNumber} />;
  }

  return (
    <div className="app-container">
      <header>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Qhay</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: user ? '1rem' : '0' }}>Gestión centralizada de restaurantes y menús</p>

          {user && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn-primary active"
                style={{ background: 'var(--primary)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem' }}
              >
                <Utensils size={18} /> Restaurantes
              </button>
            </div>
          )}
        </motion.div>

        <div className="user-nav">
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ padding: '0.4rem', background: 'var(--primary)', borderRadius: '8px' }}>
                <UserIcon size={16} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user.name || 'Admin'}</span>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main>
        {isAuthChecking ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <RefreshCw className="spin" size={48} color="var(--primary)" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {(!user && currentView !== 'register') ? (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Login onLoginSuccess={handleLogin} onSwitchToRegister={() => setCurrentView('register')} />
              </motion.div>
            ) : currentView === 'register' ? (
              <motion.div
                key="register-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <UserRegister />
                {!user && (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>¿Ya tienes cuenta? <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setCurrentView('login')}>Inicia sesión</button></p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="restaurant-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RestaurantRegister currentUser={user} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

    </div>
  )
}

export default App
