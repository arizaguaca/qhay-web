import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Plus, Download, Hash, Loader2 } from 'lucide-react';
import { useQRCodes } from '../../hooks/useQRCodes';

/**
 * QRManager — Generates and displays QR codes for restaurant tables.
 * Uses useQRCodes hook for all operations.
 *
 * @param {{ restaurantId: string }} props
 */
const QRManager = ({ restaurantId }) => {
  const { qrs, loading, generating, generate, getImageUrl } = useQRCodes(restaurantId);
  const [newTableNumber, setNewTableNumber] = useState('');

  const handleGenerate = async () => {
    if (!newTableNumber) return;
    await generate(newTableNumber);
    setNewTableNumber('');
  };

  return (
    <div className="qr-manager">
      <div className="menu-header">
        <h3>Generación de QRs</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="input-wrapper" style={{ width: '120px' }}>
            <Hash size={16} className="input-icon" />
            <input
              type="number"
              placeholder="Mesa #"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="spin" size={18} /> : <Plus size={18} />} Generar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 className="spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="qr-grid">
          {qrs.map((qr, index) => (
            <motion.div
              key={qr.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card qr-card"
            >
              <div className="qr-image-container" style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px' }}>
                <img
                  src={getImageUrl(qr.id)}
                  alt={`Mesa ${qr.tableNumber}`}
                  style={{ width: '100%', height: 'auto', maxWidth: '160px' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="qr-error-placeholder" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
                  <QrCode size={64} opacity={0.3} />
                  <span style={{ fontSize: '0.7rem' }}>Error al cargar QR</span>
                </div>
              </div>
              <h4 style={{ marginBottom: '0.3rem', fontSize: '1.2rem' }}>Mesa {qr.tableNumber}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {qr.code}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <a
                  href={getImageUrl(qr.id)}
                  download={`QR_Mesa_${qr.tableNumber}.png`}
                  className="btn-primary"
                  style={{ padding: '0.5rem', flex: 1, display: 'flex', justifyContent: 'center', textDecoration: 'none' }}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={18} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QRManager;
