import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Shield, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import './UserRegister.css';

const UserRegister = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });

    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus('success');
                setMessage('¡Usuario registrado exitosamente!');
                setFormData({ name: '', email: '', password: '', role: 'user' });
            } else {
                const errorData = await response.json().catch(() => ({}));
                setStatus('error');
                setMessage(errorData.error || 'Error al registrar usuario. Por favor intenta de nuevo.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setStatus('error');
            setMessage('No se pudo conectar con el servidor. Verifica que la API esté corriendo.');
        }
    };

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
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Juan Pérez"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="juan@ejemplo.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Rol de Usuario</label>
                        <div className="input-wrapper">
                            <Shield className="input-icon" size={18} />
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
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
                        className={`btn-primary submit-btn ${status === 'loading' ? 'loading' : ''}`}
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? (
                            'Registrando...'
                        ) : (
                            <>
                                Registrar Usuario <ArrowRight size={18} />
                            </>
                        )}
                    </motion.button>

                    {status === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="alert alert-success"
                        >
                            <CheckCircle2 size={18} />
                            <span>{message}</span>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="alert alert-error"
                        >
                            <AlertCircle size={18} />
                            <span>{message}</span>
                        </motion.div>
                    )}
                </form>
            </motion.div>
        </div>
    );
};

export default UserRegister;
