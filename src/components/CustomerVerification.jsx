import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle2, ArrowRight, ShieldCheck, Loader2, X } from 'lucide-react';

const CustomerVerification = ({ onVerified }) => {
    const [step, setStep] = useState('phone'); // 'phone' or 'otp'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (phoneNumber.length < 7) {
            setError('Por favor ingresa un número válido');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8080/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneNumber })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.exists) {
                    // SI YA EXISTE: Saltamos la verificación y entramos directo
                    const customerData = {
                        phone: phoneNumber,
                        verified: true,
                        customer_id: data.customer_id,
                        customer: data.customer
                    };
                    localStorage.setItem('qhay_customer_session', JSON.stringify(customerData));
                    onVerified(customerData);
                    return;
                }
                // SI ES NUEVO: Vamos al paso de OTP
                setStep('otp');
            } else {
                setError(data.message || 'Error al enviar el código. Intenta de nuevo.');
            }
        } catch (err) {
            setError('Error al enviar el código. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8080/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phoneNumber,
                    code: code
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Save complete customer session from backend
                const customerData = {
                    phone: phoneNumber,
                    verified: data.verified,
                    customer_id: data.customer_id,
                    customer: data.customer
                };
                localStorage.setItem('qhay_customer_session', JSON.stringify(customerData));
                onVerified(customerData);
            } else {
                const data = await response.json();
                setError(data.message || 'Código incorrecto. Verifica e intenta de nuevo.');
            }
        } catch (err) {
            setError('Código incorrecto. Verifica e intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    return (
        <div className="verification-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: '#0a0a0b',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '2.5rem',
                    textAlign: 'center',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: 'var(--primary)'
                }}>
                    {step === 'phone' ? <Phone size={32} /> : <ShieldCheck size={32} />}
                </div>

                <AnimatePresence mode="wait">
                    {step === 'phone' ? (
                        <motion.div
                            key="phone-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Bienvenido</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                Para continuar e ingresar al menú, por favor verifica tu número de teléfono.
                            </p>

                            <form onSubmit={handleSendCode}>
                                <div className="input-wrapper" style={{ marginBottom: '1.5rem' }}>
                                    <Phone className="input-icon" size={18} />
                                    <input
                                        type="tel"
                                        placeholder="Tu número de teléfono"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        style={{ paddingLeft: '3rem' }}
                                        required
                                    />
                                </div>

                                {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                    style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    {loading ? <Loader2 className="spin" size={20} /> : <>Siguiente <ArrowRight size={20} /></>}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="otp-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Verifica tu código</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                Hemos enviado un código de 6 dígitos a <br />
                                <strong style={{ color: 'white' }}>{phoneNumber}</strong>
                            </p>

                            <form onSubmit={handleVerifyOtp}>
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
                                            style={{
                                                width: '45px',
                                                height: '55px',
                                                textAlign: 'center',
                                                fontSize: '1.5rem',
                                                fontWeight: '700',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                color: 'white'
                                            }}
                                        />
                                    ))}
                                </div>

                                {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading || otp.join('').length < 6}
                                    style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center' }}
                                >
                                    {loading ? <Loader2 className="spin" size={20} /> : 'Verificar y Entrar'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('phone')}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '1.5rem', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Cambiar número de teléfono
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default CustomerVerification;
