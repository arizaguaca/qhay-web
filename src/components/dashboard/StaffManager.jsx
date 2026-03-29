import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Trash2, Edit2, Shield, User, Mail, Loader2, X, Check, Search, Filter } from 'lucide-react';

const StaffManager = ({ restaurantId: initialRestaurantId }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    // Asegurarnos de tener el ID correcto (GORM usa ID a veces)
    const restaurantId = initialRestaurantId;
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        name: '',
        email: '',
        password: '',
        role: 'waiter',
        restaurant_id: restaurantId
    };

    const [formData, setFormData] = useState(initialForm);

    const roles = [
        { id: 'cook', name: 'Cocinero', icon: '🍳' },
        { id: 'waiter', name: 'Mesero', icon: '🏃' },
        { id: 'cashier', name: 'Cajero', icon: '💰' }
    ];

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/restaurants/${restaurantId}/staff`);
            if (response.ok) {
                const data = await response.json();
                setStaff(data || []);
            }
        } catch (error) {
            console.error("Error fetching staff:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, [restaurantId]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${API_URL}/restaurants/${restaurantId}/staff/${editingId}` : `${API_URL}/restaurants/${restaurantId}/staff`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    restaurant_id: restaurantId
                })
            });

            if (response.ok) {
                fetchStaff();
                resetForm();
            } else {
                const err = await response.json();
                alert(err.error || "Error al procesar solicitud");
            }
        } catch (error) {
            console.error("Error saving staff:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData(initialForm);
    };

    const handleEdit = (member) => {
        setFormData({
            ...member,
            password: '', // No cargamos la contraseña por seguridad
        });
        setEditingId(member.id || member.ID);
        setIsAdding(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar a este miembro del equipo?')) return;
        try {
            const response = await fetch(`${API_URL}/restaurants/${restaurantId}/staff/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setStaff(staff.filter(s => (s.id || s.ID) !== id));
            }
        } catch (error) {
            console.error("Error deleting staff:", error);
        }
    };

    return (
        <div className="staff-manager">
            <div className="menu-header">
                <div>
                    <h3>Equipo / Staff</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona los accesos de tus meseros y cocineros</p>
                </div>
                {!isAdding && (
                    <button className="btn-primary" onClick={() => setIsAdding(true)}>
                        <UserPlus size={18} /> Agregar Miembro
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card menu-form-card"
                        style={{ marginBottom: '2rem', overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {editingId ? <Edit2 size={18} /> : <UserPlus size={18} />}
                                {editingId ? 'Editar Miembro' : 'Nuevo Miembro de Staff'}
                            </h4>
                            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="register-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nombre Completo</label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="Ej: Juan Pérez"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Rol</label>
                                    <div className="input-wrapper">
                                        <Shield className="input-icon" size={18} />
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            style={{ width: '100%', paddingLeft: '3rem' }}
                                        >
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.icon} {role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Correo Electrónico</label>
                                    <div className="input-wrapper">
                                        <Mail className="input-icon" size={18} />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            placeholder="staff@qhay.com"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{editingId ? 'Nueva Contraseña (opcional)' : 'Contraseña Provisional'}</label>
                                    <div className="input-wrapper">
                                        <Shield className="input-icon" size={18} />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingId}
                                            placeholder={editingId ? "Dejar en blanco para no cambiar" : "Mín. 6 caracteres"}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
                                    {isSaving ? 'Guardando...' : (editingId ? 'Actualizar Miembro' : 'Crear Acceso')}
                                </button>
                                <button type="button" className="btn-primary" onClick={resetForm} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="spin" size={32} color="var(--primary)" />
                </div>
            ) : (
                <div className="staff-list">
                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Miembro</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rol</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff
                                    .filter(member => member.restaurant_id === restaurantId || member.RestaurantID === restaurantId)
                                    .map((member) => (
                                    <tr key={member.id || member.ID} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    {member.name?.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: '500' }}>{member.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                background: member.role === 'cook' ? 'rgba(245, 158, 11, 0.1)' : member.role === 'waiter' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: member.role === 'cook' ? '#f59e0b' : member.role === 'waiter' ? '#3b82f6' : '#10b981',
                                                border: `1px solid ${member.role === 'cook' ? 'rgba(245, 158, 11, 0.2)' : member.role === 'waiter' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                                            }}>
                                                {member.role?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{member.email}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px' }}
                                                    className="action-btn-hover"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member.id || member.ID)}
                                                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px' }}
                                                    className="action-btn-hover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {staff.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No hay miembros de staff registrados.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManager;
