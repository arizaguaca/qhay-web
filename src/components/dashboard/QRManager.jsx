import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Plus, Download, Trash2, Hash } from 'lucide-react';

const QRManager = ({ restaurantId }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    const [qrs, setQrs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTableNumber, setNewTableNumber] = useState('');

    const fetchQRs = async () => {
        try {
            const response = await fetch(`${API_URL}/restaurants/${restaurantId}/qrs`);
            if (response.ok) {
                const data = await response.json();
                if (data && Array.isArray(data)) {
                    data.sort((a, b) => a.table_number - b.table_number);
                }
                setQrs(data || []);
            }
        } catch (error) {
            console.error("Error fetching QRs:", error);
            // Demo data
            setQrs([
                { id: '1', table_number: 1, code: `http://qhay.app/r/${restaurantId}/t/1` },
                { id: '2', table_number: 2, code: `http://qhay.app/r/${restaurantId}/t/2` }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQRs();
    }, [restaurantId]);

    const generateQR = async () => {
        if (!newTableNumber) return;
        try {
            const response = await fetch(`${API_URL}/qrcodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    table_count: parseInt(newTableNumber)
                })
            });
            if (response.ok) {
                fetchQRs();
                setNewTableNumber('');
            }
        } catch (error) {
            // Error handling placeholder
            console.error("Error generating QRs:", error);
        }
    };

    return (
        <div className="qr-manager">
            <div className="menu-header">
                <div>
                    <h3>Generación de QRs</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Genera códigos en lote para tus mesas</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="input-wrapper" style={{ width: '150px' }}>
                        <Hash size={16} className="input-icon" />
                        <input
                            type="number"
                            placeholder="Cant. Mesas"
                            value={newTableNumber}
                            onChange={e => setNewTableNumber(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                            min="1"
                        />
                    </div>
                    <button className="btn-primary" onClick={generateQR}>
                        <Plus size={18} /> Generar Todos
                    </button>
                </div>
            </div>

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
                                src={`${API_URL}/qrcodes/image?id=${qr.id}`}
                                alt={`Mesa ${qr.table_number}`}
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
                        <h4 style={{ marginBottom: '0.3rem', fontSize: '1.2rem' }}>Mesa {qr.table_number}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {qr.code}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <a
                                href={`${API_URL}/qrcodes/image?id=${qr.id}`}
                                download={`QR_Mesa_${qr.table_number}.png`}
                                className="btn-primary"
                                style={{ padding: '0.5rem', flex: 1, display: 'flex', justifyContent: 'center', textDecoration: 'none' }}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Download size={18} />
                            </a>
                            <button className="btn-primary" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default QRManager;
