import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Shield, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './RegisterPage.css';

/**
 * RegisterPage — Handles new user account registration.
 * All API logic is delegated to the useAuth hook.
 *
 * @param {{ authRepository: Object, onSwitchToLogin: Function }} props
 */
const RegisterPage = ({ authRepository, onSwitchToLogin }) => {
  const { register, status, error } = useAuth(authRepository);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'owner',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'owner' });
    } catch {
      // error already set in hook
    }
  };

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <div className="register-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card register-card"
      >
        <div className="register-header">
          <div className="icon-badge">
            <User size={32} color="var(--primary)" />
          </div>
          <h2>Registro de Usuario</h2>
          <p>Completa los datos para crear una nueva cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Nombre Completo</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Juan Pérez" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="juan@ejemplo.com" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+573001234567" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Rol de Usuario</label>
            <div className="input-wrapper">
              <Shield className="input-icon" size={18} />
              <select id="role" name="role" value={formData.role} onChange={handleChange} required>
                <option value="owner">Propietario</option>
                <option value="user">Usuario Estándar</option>
                <option value="admin">Administrador</option>
                <option value="editor">Editor</option>
              </select>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`btn-primary submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : <><span>Registrar Usuario</span> <ArrowRight size={18} /></>}
          </motion.button>

          {isSuccess && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>¡Usuario registrado exitosamente!</span>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}
        </form>

        {onSwitchToLogin && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              ¿Ya tienes cuenta?{' '}
              <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={onSwitchToLogin}>
                Inicia sesión
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RegisterPage;
