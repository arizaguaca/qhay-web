import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.css';

/**
 * LoginPage — Handles user authentication form.
 * All API logic is delegated to the useAuth hook.
 *
 * @param {{ authRepository: Object, onLoginSuccess: Function, onSwitchToRegister: Function }} props
 */
const LoginPage = ({ authRepository, onLoginSuccess, onSwitchToRegister }) => {
  const { login, status, error } = useAuth(authRepository);
  const [formData, setFormData] = React.useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(formData);
      onLoginSuccess(user);
    } catch {
      // error already set in hook
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="login-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card login-card"
      >
        <div className="login-header">
          <div className="icon-badge">
            <LogIn size={32} color="var(--primary)" />
          </div>
          <h2>Bienvenido</h2>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Correo Electrónico</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`btn-primary submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : <><span>Entrar</span> <ArrowRight size={18} /></>}
          </motion.button>

          {status === 'error' && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-footer">
            <p>
              ¿No tienes cuenta?{' '}
              <button type="button" onClick={onSwitchToRegister}>
                Regístrate aquí
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
