import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, Clock, Check, Loader2 } from 'lucide-react';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const OperatingHoursManager = ({ restaurantId }) => {
    const [hours, setHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        const fetchHours = async () => {
            try {
                const response = await fetch(`http://localhost:8080/restaurants/${restaurantId}/hours`);
                let data = null;

                if (response.ok) {
                    data = await response.json();
                }

                // If no data or empty list, generate defaults for all 7 days
                if (!data || data.length === 0) {
                    data = DAYS.map((_, index) => ({
                        restaurant_id: restaurantId,
                        day_of_week: index,
                        open_time: '08:00',
                        close_time: '20:00',
                        is_closed: false
                    }));
                } else if (data.length < 7) {
                    // In case some days are missing, fill the gaps
                    const existingDays = data.map(d => d.day_of_week);
                    const missingDays = DAYS.map((_, i) => i).filter(i => !existingDays.includes(i));

                    const filledData = [...data];
                    missingDays.forEach(dayIdx => {
                        filledData.push({
                            restaurant_id: restaurantId,
                            day_of_week: dayIdx,
                            open_time: '08:00',
                            close_time: '20:00',
                            is_closed: true
                        });
                    });
                    data = filledData.sort((a, b) => a.day_of_week - b.day_of_week);
                }

                setHours(data);
            } catch (error) {
                console.error("Error fetching hours:", error);
                setHours(DAYS.map((_, index) => ({
                    restaurant_id: restaurantId,
                    day_of_week: index,
                    open_time: '08:00',
                    close_time: '20:00',
                    is_closed: false
                })));
            } finally {
                setLoading(false);
            }
        };
        fetchHours();
    }, [restaurantId]);

    const handleUpdate = (index, field, value) => {
        const newHours = [...hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setHours(newHours);
    };

    const saveHours = async () => {
        setSaving(true);
        try {
            const response = await fetch(`http://localhost:8080/restaurants/${restaurantId}/hours`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hours)
            });
            if (response.ok) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch (error) {
            setStatus('error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 className="spin" size={32} color="var(--primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Cargando horarios...</p>
        </div>
    );

    return (
        <div className="hours-manager">
            <div className="menu-header">
                <div>
                    <h3>Horarios de Atención</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Define cuándo está abierto tu local al público</p>
                </div>
                <button className="btn-primary" onClick={saveHours} disabled={saving}>
                    {saving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                </button>
            </div>

            <div className="hours-grid">
                {hours.map((day, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`glass-card day-card ${day.is_closed ? 'closed-day' : ''}`}
                    >
                        <div className="day-card-header">
                            <div className="day-title">
                                <span className="day-dot"></span>
                                <h4>{DAYS[day.day_of_week]}</h4>
                            </div>
                            <label className="switch-container">
                                <input
                                    type="checkbox"
                                    checked={!day.is_closed}
                                    onChange={e => handleUpdate(index, 'is_closed', !e.target.checked)}
                                />
                                <span className={`status-badge ${day.is_closed ? 'status-closed' : 'status-open'}`}>
                                    {day.is_closed ? 'CERRADO' : 'ABIERTO'}
                                </span>
                            </label>
                        </div>

                        <div className="day-card-body">
                            <AnimatePresence mode="wait">
                                {!day.is_closed ? (
                                    <motion.div
                                        key="open"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="time-inputs-container"
                                    >
                                        <div className="time-select-group">
                                            <span className="time-label">Apertura</span>
                                            <div className="time-input-wrapper">
                                                <Clock size={16} />
                                                <input
                                                    type="time"
                                                    value={day.open_time}
                                                    onChange={e => handleUpdate(index, 'open_time', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="time-separator">
                                            <div className="line"></div>
                                        </div>

                                        <div className="time-select-group">
                                            <span className="time-label">Cierre</span>
                                            <div className="time-input-wrapper">
                                                <Clock size={16} />
                                                <input
                                                    type="time"
                                                    value={day.close_time}
                                                    onChange={e => handleUpdate(index, 'close_time', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="closed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="closed-placeholder"
                                    >
                                        <AlertCircle size={20} />
                                        <span>No se recibe público este día</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="alert alert-success floating-alert"
                    >
                        <Check size={18} />
                        ¡Horarios actualizados correctamente!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OperatingHoursManager;
