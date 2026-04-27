import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './RegisterPage.css';

/**
 * RegisterPage — Handles new user account registration.
 * All API logic is delegated to the useAuth hook.
 *
 * @param {{ authRepository: Object, onSwitchToLogin: Function }} props
 */
const RegisterPage = ({ authRepository, onSwitchToLogin }) => {
  const { register, verify, status, error } = useAuth(authRepository);
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      setRegisteredEmail(formData.email);
      setStep('verify');
    } catch {
      // error already set in hook
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    try {
      await verify(registeredEmail, code);
    } catch {}
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const isLoading = status === 'loading';
  const isVerified = status === 'verified';

  useEffect(() => {
    if (isVerified && onSwitchToLogin) {
      const timer = setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVerified, onSwitchToLogin]);

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
            {step === 'register' ? <User size={32} color="var(--primary)" /> : <ShieldCheck size={32} color="var(--primary)" />}
          </div>
          <h2>{step === 'register' ? 'Registro de Usuario' : 'Verifica tu cuenta'}</h2>
          <p>{step === 'register' ? 'Completa los datos para crear una nueva cuenta' : `Ingresa el código enviado a ${registeredEmail}`}</p>
        </div>

        {step === 'register' ? (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="fullName">Nombre Completo</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Juan Pérez" required />
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={`btn-primary submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Registrando...' : <><span>Registrar Usuario</span> <ArrowRight size={18} /></>}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="register-form">
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{ width: '40px', height: '50px', textAlign: 'center', fontSize: '1.25rem', fontWeight: '700', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'white' }}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={`btn-primary submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || otp.join('').length < 6}
            >
              {isLoading ? 'Verificando...' : <><span>Verificar Código</span> <ArrowRight size={18} /></>}
            </motion.button>
            
            <button type="button" onClick={() => setStep('register')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '1rem', cursor: 'pointer', fontSize: '0.85rem', width: '100%' }}>
              Volver al registro
            </button>
          </form>
        )}

        {isVerified && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-success" style={{ marginTop: '1rem' }}>
            <CheckCircle2 size={18} />
            <span>¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-error" style={{ marginTop: '1rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </motion.div>
        )}

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
