import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Plus, Download, Hash, Loader2, Layers, Type, Trash2, Printer, FileText } from 'lucide-react';
import { useQRCodes } from '../../hooks/useQRCodes';
import { printSingleQR, printAllQRs } from '../../utils/qrPrinter';

/**
 * QRManager — Generates and displays QR codes for restaurant tables.
 * Supports individual generation (with label) and bulk generation.
 *
 * @param {{ restaurantId: string, restaurantName: string }} props
 */
const QRManager = ({ restaurantId, restaurantName }) => {
  const { qrs, loading, generating, generate, generateBulk, getImageUrl } = useQRCodes(restaurantId);
  
  // Sorting QRs for consistent display and printing
  const sortedQrs = [...qrs].sort((a, b) => a.tableNumber - b.tableNumber);
  
  // States for individual generation
  const [newTableNumber, setNewTableNumber] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  
  // State for bulk generation
  const [quantity, setQuantity] = useState('');
  
  // Generation mode: 'single' or 'bulk'
  const [mode, setMode] = useState('single');

  const handleGenerateSingle = async () => {
    if (!newTableNumber) return;
    await generate(newTableNumber, linkLabel);
    setNewTableNumber('');
    setLinkLabel('');
  };

  const handleGenerateBulk = async () => {
    if (!quantity || quantity <= 0) return;
    await generateBulk(quantity);
    setQuantity('');
  };

  const handlePrintAll = () => {
    printAllQRs(sortedQrs, restaurantName);
  };

  const handlePrintIndividual = (qr) => {
    printSingleQR(qr, restaurantName);
  };

  return (
    <div className="qr-manager">
      <div className="menu-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Códigos QR / Mesas</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Genera códigos para tus mesas de forma individual o masiva</p>
        </div>
        
        {sortedQrs.length > 0 && (
          <button 
            className="btn-primary" 
            onClick={handlePrintAll}
            style={{ background: 'var(--primary)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
          >
            <FileText size={18} /> Exportar Todo a PDF
          </button>
        )}
      </div>

      {/* Control Panel */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <button 
            className={`tab-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: mode === 'single' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: mode === 'single' ? '2px solid var(--primary)' : '2px solid transparent',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <QrCode size={18} /> Uno a uno
          </button>
          <button 
            className={`tab-btn ${mode === 'bulk' ? 'active' : ''}`}
            onClick={() => setMode('bulk')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: mode === 'bulk' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: mode === 'bulk' ? '2px solid var(--primary)' : '2px solid transparent',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Layers size={18} /> Generación Masiva (Bulk)
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'single' ? (
            <motion.div 
              key="single"
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}
            >
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}># de Mesa</label>
                <div className="input-wrapper">
                  <Hash size={16} className="input-icon" />
                  <input
                    type="number"
                    placeholder="Mesa #"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0, flex: 2, minWidth: '200px' }}>
                <label style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>Etiqueta (Opcional)</label>
                <div className="input-wrapper">
                  <Type size={16} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Ej: Terraza VIP, Ventana..."
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                  />
                </div>
              </div>
              <button 
                className="btn-primary" 
                onClick={handleGenerateSingle} 
                disabled={generating || !newTableNumber || generating}
                style={{ height: '48px', padding: '0 1.5rem' }}
              >
                {generating ? <Loader2 className="spin" size={18} /> : <Plus size={18} />} 
                Generar QR
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="bulk"
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
              style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}
            >
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <label style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>Cantidad de QRs a generar</label>
                <div className="input-wrapper">
                  <Layers size={16} className="input-icon" />
                  <input
                    type="number"
                    placeholder="Ej: 10, 20..."
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    max="50"
                  />
                </div>
              </div>
              <button 
                className="btn-primary" 
                onClick={handleGenerateBulk} 
                disabled={generating || !quantity || generating}
                style={{ height: '48px', padding: '0 1.5rem' }}
              >
                {generating ? <Loader2 className="spin" size={18} /> : <Plus size={18} />} 
                Crear en Bloque
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 className="spin" size={40} color="var(--primary)" />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Cargando QRs...</p>
        </div>
      ) : (
        <div className="qr-grid">
          {sortedQrs.map((qr, index) => {
            const isTableActive = qr.isActive;
            
            return (
              <motion.div
                key={qr.id || index}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass-card qr-card ${!isTableActive ? 'qr-disabled' : ''}`}
                style={{ 
                  position: 'relative', 
                  textAlign: 'center',
                  opacity: isTableActive ? 1 : 0.6,
                  filter: isTableActive ? 'none' : 'grayscale(1)'
                }}
              >
                <div className="qr-image-container" style={{ 
                  background: 'white', 
                  padding: '1.25rem', 
                  borderRadius: '15px', 
                  marginBottom: '1.25rem', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '180px', 
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}>
                  {isTableActive ? (
                    <>
                      {/* Generamos el QR dinámicamente con el slugPath solicitado */}
                      <img
                        src={`https://quickchart.io/qr?text=${encodeURIComponent(window.location.origin + qr.slugPath)}&size=300&margin=1`}
                        alt={`Mesa ${qr.tableNumber}`}
                        style={{ width: '100%', height: 'auto', maxWidth: '140px' }}
                        onLoad={(e) => {
                          e.target.style.opacity = 1;
                        }}
                      />
                    </>
                  ) : (
                    <div style={{ flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#666', display: 'flex' }}>
                      <QrCode size={64} opacity={0.1} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f87171' }}>CÓDIGO INACTIVO</span>
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <h4 style={{ fontSize: '1.3rem', margin: 0 }}>Mesa {qr.tableNumber}</h4>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: isTableActive ? '#4ade80' : '#f87171',
                      boxShadow: isTableActive ? '0 0 8px #4ade80' : 'none'
                    }} />
                  </div>
                  {qr.label && (
                    <span style={{ fontSize: '0.75rem', color: isTableActive ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {qr.label}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isTableActive ? (
                    <>
                      <button 
                        onClick={() => handlePrintIndividual(qr)}
                        className="btn-primary" 
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }}
                        title="Imprimir"
                      >
                        <Printer size={18} />
                      </button>
                      <a
                        href={`https://quickchart.io/qr?text=${encodeURIComponent(window.location.origin + qr.slugPath)}&size=500&margin=1`}
                        download={`QR_Mesa_${qr.tableNumber}.png`}
                        className="btn-primary"
                        style={{ flex: 2, display: 'flex', justifyContent: 'center', textDecoration: 'none', padding: '0.6rem' }}
                        target="_blank"
                        rel="noreferrer"
                        title="Descargar Imagen"
                      >
                        <Download size={18} /> PNG
                      </a>
                    </>
                  ) : (
                    <button className="btn-primary" disabled style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      Mesa Desactivada
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {qrs.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1.5px dashed var(--border)' }}>
              <QrCode size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.1 }} />
              <h4 style={{ color: 'var(--text-muted)' }}>No has generado códigos QR todavía</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Utiliza el panel superior para crear códigos individuales o masivos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRManager;
