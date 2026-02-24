import React, { useState, useEffect } from 'react'
import { Plus, Table as TableIcon, Layout, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

function App() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTableName, setNewTableName] = useState('')

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

  return (
    <div className="app-container">
      <header>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Table System</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Gestión centralizada de mesas y datos</p>
        </motion.div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={fetchTables} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Nueva Mesa
          </button>
        </div>
      </header>

      <main>
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
