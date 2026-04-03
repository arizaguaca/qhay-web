import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Trash2, Edit2, Shield, User, Mail, Loader2, X, Check } from 'lucide-react';
import { useStaff } from '../../hooks/useRestaurantManagement';

/**
 * StaffManager — CRUD interface for restaurant staff members.
 * Uses useStaff hook for all operations.
 *
 * @param {{ restaurantId: string }} props
 */
const StaffManager = ({ restaurantId }) => {
  const { staff, loading, saving, save, remove } = useStaff(restaurantId);

  const roles = [
    { id: 'cook',    name: 'Cocinero', icon: '🍳' },
    { id: 'waiter',  name: 'Mesero',   icon: '🏃' },
    { id: 'cashier', name: 'Cajero',   icon: '💰' },
  ];

  const initialForm = { name: '', email: '', password: '', role: 'waiter' };
  const [formData, setFormData] = useState(initialForm);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => { setIsAdding(false); setEditingId(null); setFormData(initialForm); };

  const handleEdit = (member) => {
    setFormData({ ...member, password: '' });
    setEditingId(member.id);
    setIsAdding(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await save(formData, editingId);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar a este miembro del equipo?')) return;
    await remove(id);
  };

  const getRoleColor = (role) => ({
    cook:    { bg: 'rgba(245, 158, 11, 0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
    waiter:  { bg: 'rgba(59, 130, 246, 0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
    cashier: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  }[role] || { bg: 'transparent', color: 'var(--text-muted)', border: 'var(--border)' });

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
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-card menu-form-card" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingId ? <Edit2 size={18} /> : <UserPlus size={18} />}
                {editingId ? 'Editar Miembro' : 'Nuevo Miembro de Staff'}
              </h4>
              <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="register-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={18} />
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ej: Juan Pérez" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Rol</label>
                  <div className="input-wrapper">
                    <Shield className="input-icon" size={18} />
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', paddingLeft: '3rem' }}>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={18} />
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="staff@qhay.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label>{editingId ? 'Nueva Contraseña (opcional)' : 'Contraseña Provisional'}</label>
                  <div className="input-wrapper">
                    <Shield className="input-icon" size={18} />
                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingId} placeholder={editingId ? 'Dejar en blanco para no cambiar' : 'Mín. 6 caracteres'} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
                  {saving ? 'Guardando...' : (editingId ? 'Actualizar Miembro' : 'Crear Acceso')}
                </button>
                <button type="button" className="btn-primary" onClick={resetForm} style={{ background: 'transparent', border: '1px solid var(--border)' }}>Cancelar</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spin" size={32} color="var(--primary)" /></div>
      ) : (
        <div className="staff-list">
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                <tr>
                  {['Miembro', 'Rol', 'Email', 'Acciones'].map((h) => (
                    <th key={h} style={{ padding: '1rem', textAlign: h === 'Acciones' ? 'right' : 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const roleStyle = getRoleColor(member.role);
                  return (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {member.name?.charAt(0)}
                          </div>
                          <span style={{ fontWeight: '500' }}>{member.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}` }}>
                          {member.role?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{member.email}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleEdit(member)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px' }}><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(member.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {staff.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay miembros de staff registrados.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
