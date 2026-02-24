import React, { useState, useEffect } from 'react'
import { Plus, Table as TableIcon, Layout, RefreshCw, UserPlus, Grid, Utensils, LogOut, User as UserIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import UserRegister from './components/UserRegister'
import RestaurantRegister from './components/RestaurantRegister'
import Login from './components/Login'
import PublicMenu from './components/PublicMenu'
import './App.css'

function App() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [currentView, setCurrentView] = useState('tables')
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
    setCurrentView('tables')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('qhay_user')
    setCurrentView('login')
  }

  const fetchTables = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8080/tables')
      if (response.ok) {
        const data = await response.json()
        setTables(data || [])
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
      // Fallback data for demo
      setTables([
        { id: '1', name: 'Mesa Principal', columns: ['Item', 'Precio'], created_at: new Date().toISOString() },
        { id: '2', name: 'Mesa Terraza', columns: ['Pedido', 'Notas'], created_at: new Date().toISOString() }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])

  const handleCreateTable = async (e) => {
    e.preventDefault()
    if (!newTableName) return

    const newTable = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTableName,
      columns: ['Nombre', 'Cantidad'],
      created_at: new Date().toISOString()
    }

    try {
      const response = await fetch('http://localhost:8080/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTable)
      })

      if (response.ok) {
        setTables([...tables, newTable])
      } else {
        setTables([...tables, newTable]) // Adding to state even if server fails for demo
      }
    } catch (error) {
      console.error("Error creating table:", error)
      setTables([...tables, newTable])
    }

    setNewTableName('')
    setIsModalOpen(false)
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
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Gestión centralizada de mesas y datos</p>
        </motion.div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!user ? (
            <>
              <button
                className={`btn-primary ${currentView === 'login' ? 'active' : ''}`}
                onClick={() => setCurrentView('login')}
                style={{ background: currentView === 'login' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)' }}
              >
                Iniciar Sesión
              </button>
              <button
                className={`btn-primary ${currentView === 'register' ? 'active' : ''}`}
                onClick={() => setCurrentView('register')}
                style={{ background: currentView === 'register' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)' }}
              >
                Registrarse
              </button>
            </>
          ) : (
            <>
              <button
                className={`btn-primary ${currentView === 'tables' ? 'active' : ''}`}
                onClick={() => setCurrentView('tables')}
                style={{ background: currentView === 'tables' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)' }}
              >
                <Grid size={18} />
                Mesas
              </button>
              <button
                className={`btn-primary ${currentView === 'restaurants' ? 'active' : ''}`}
                onClick={() => setCurrentView('restaurants')}
                style={{ background: currentView === 'restaurants' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)' }}
              >
                <Utensils size={18} />
                Restaurantes
              </button>

              <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ padding: '0.4rem', background: 'var(--primary)', borderRadius: '8px' }}>
                  <UserIcon size={16} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user.name || 'Admin'}</span>
                <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                  <LogOut size={18} />
                </button>
              </div>

              {currentView === 'tables' && (
                <>
                  <button className="btn-primary" onClick={fetchTables} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
                    <RefreshCw size={18} className={loading ? 'spin' : ''} />
                  </button>
                  <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Nueva Mesa
                  </button>
                </>
              )}
            </>
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
            ) : currentView === 'restaurants' ? (
              <motion.div
                key="restaurant-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RestaurantRegister currentUser={user} />
              </motion.div>
            ) : (
              <motion.div
                key="tables-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {loading && tables.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <RefreshCw className="spin" size={48} color="var(--primary)" />
                  </div>
                ) : (
                  <div className="grid">
                    <AnimatePresence>
                      {tables.map((table, index) => (
                        <motion.div
                          key={table.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="glass-card"
                          style={{ cursor: 'pointer' }}
                          whileHover={{ y: -5, borderColor: 'var(--primary)' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
                              <TableIcon size={24} color="var(--primary)" />
                            </div>
                            <div>
                              <h3 style={{ fontSize: '1.25rem' }}>{table.name}</h3>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Creado: {new Date(table.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div style={{ marginTop: '1.5rem' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Columnas:</p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {table.columns.map(col => (
                                <span key={col} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                  {col}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Modal - Basic Implementation */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass-card modal-content"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '400px' }}
          >
            <h2 style={{ marginBottom: '1.5rem' }}>Crear Mesa</h2>
            <form onSubmit={handleCreateTable}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nombre de la Mesa</label>
                <input
                  autoFocus
                  type="text"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'white',
                    outline: 'none'
                  }}
                  placeholder="Ej: Mesa VIP"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default App
