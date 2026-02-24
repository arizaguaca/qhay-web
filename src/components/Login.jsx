import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, LogIn, AlertCircle } from 'lucide-react';
import './Login.css';

const Login = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            // Assuming login endpoint is /login
            const response = await fetch('http://localhost:8080/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const userData = await response.json();
                setStatus('success');
                onLoginSuccess(userData); // Should contain user id
            } else {
                const errorData = await response.json().catch(() => ({}));
                setStatus('error');
                setMessage(errorData.error || 'Credenciales inválidas');
            }
        } catch (error) {
            console.error('Login error:', error);
            setStatus('error');
            setMessage('Error de conexión con el servidor');

            // FOR DEMO PURPOSES: If API is not ready, simulate success with a fake user
            /*
            setTimeout(() => {
              onLoginSuccess({
                id: 'demo-user-123',
                name: 'Usuario Demo',
                email: formData.email,
                role: 'admin'
              });
            }, 1000);
            */
        }
    };

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
                        className={`btn-primary submit-btn ${status === 'loading' ? 'loading' : ''}`}
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? 'Iniciando sesión...' : <>Entrar <ArrowRight size={18} /></>}
                    </motion.button>

                    {status === 'error' && (
                        <div className="alert alert-error">
                            <AlertCircle size={18} />
                            <span>{message}</span>
                        </div>
                    )}

                    <div className="login-footer">
                        <p>¿No tienes cuenta? <button type="button" onClick={onSwitchToRegister}>Regístrate aquí</button></p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
