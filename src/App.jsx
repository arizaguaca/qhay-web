import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Utensils, LogOut, User as UserIcon } from 'lucide-react';
import LoginPage from './presentation/pages/LoginPage';
import RegisterPage from './presentation/pages/RegisterPage';
import RestaurantsPage from './presentation/pages/RestaurantsPage';
import PublicMenuPage from './presentation/pages/PublicMenuPage';
import PublicExplorePage from './presentation/pages/PublicExplorePage';
import './App.css';

/**
 * App — Root component. Acts as the application router and dependency injector.
 * Repositories are passed as props so the presentation layer stays decoupled.
 *
 * @param {{ authRepository: Object, restaurantRepository: Object }} props
 */
function App({ authRepository, restaurantRepository }) {
  const [currentView, setCurrentView] = useState('restaurants');
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [publicRoute, setPublicRoute] = useState(null);

  useEffect(() => {
    // Detect public QR route: /restaurants/:id?table=:num
    const parts = window.location.pathname.split('/');
    if (parts.length === 3 && parts[1] === 'restaurants') {
      const restaurantId = parts[2];
      const tableNumber = new URLSearchParams(window.location.search).get('table');
      setPublicRoute({ restaurantId, tableNumber });
    }

    try {
      const saved = localStorage.getItem('qhay_user');
      if (saved) setUser(JSON.parse(saved));
    } catch { }

    setIsAuthChecking(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('qhay_user', JSON.stringify(userData));
    setCurrentView('restaurants');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qhay_user');
    setCurrentView('login');
  };

  // Public QR menu route — no auth required
  if (publicRoute) {
    return (
      <PublicMenuPage
        authRepository={authRepository}
        restaurantId={publicRoute.restaurantId}
        tableNumber={publicRoute.tableNumber}
        onBack={() => {
          setPublicRoute(null);
          window.history.pushState(null, '', '/');
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <header>

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
            {!user && currentView !== 'register' ? (
              <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <LoginPage
                  authRepository={authRepository}
                  onLoginSuccess={handleLoginSuccess}
                  onSwitchToRegister={() => setCurrentView('register')}
                />
              </motion.div>
            ) : currentView === 'register' ? (
              <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <RegisterPage
                  authRepository={authRepository}
                  onSwitchToLogin={() => setCurrentView('login')}
                />
              </motion.div>
            ) : currentView === 'explore' ? (
              <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PublicExplorePage onSelectRestaurant={(id) => setPublicRoute({ restaurantId: id })} />
              </motion.div>
            ) : (
              <motion.div key="restaurants" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <RestaurantsPage
                  restaurantRepository={restaurantRepository}
                  currentUser={user}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

export default App;
