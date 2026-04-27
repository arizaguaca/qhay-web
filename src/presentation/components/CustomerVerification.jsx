import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck, Loader2, User } from 'lucide-react';
import { useCustomerVerification } from '../hooks/useCustomerVerification';

/**
 * CustomerVerification — Two-step phone OTP verification for public menu access.
 * Uses useCustomerVerification hook to delegate all business logic.
 *
 * @param {{ authRepository: Object, onVerified: Function }} props
 */
const CustomerVerification = ({ authRepository, onVerified }) => {
  const { step, setStep, fullName, setFullName, phone, loading, error, createCustomer, verifyOtp } = useCustomerVerification(authRepository);
  const [countryCode, setCountryCode] = useState('+57');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const countryRef = useRef(null);

  const countryOptions = useMemo(() => ([
    { label: 'USA (+1)', value: '+1' },
    { label: 'CAN (+1)', value: '+1' },
    { label: 'MEX (+52)', value: '+52' },
    { label: 'ARG (+54)', value: '+54' },
    { label: 'BRA (+55)', value: '+55' },
    { label: 'CHL (+56)', value: '+56' },
    { label: 'COL (+57)', value: '+57' },
    { label: 'VEN (+58)', value: '+58' },
  ]), []);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (!countryRef.current) return;
      if (!countryRef.current.contains(e.target)) setIsCountryOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      setFullName(fullNameInput);
      const fullPhone = `${countryCode}${phoneInput}`.replace(/\s+/g, '');
      await createCustomer({ fullName: fullNameInput, phone: fullPhone });
    } catch {}
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    try {
      await verifyOtp(code);
      onVerified();
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0b', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)' }}
      >
        <div style={{ width: '64px', height: '64px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
          {step === 'phone' ? <Phone size={32} /> : <ShieldCheck size={32} />}
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div key="phone-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Bienvenido</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Para continuar e ingresar al menú, por favor verifica tu número de teléfono.
              </p>
              <form onSubmit={handleCreateCustomer}>
                <div className="input-wrapper" style={{ marginBottom: '1rem' }}>
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    style={{ paddingLeft: '3rem' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div ref={countryRef} style={{ position: 'relative', width: '30%' }}>
                    <button
                      type="button"
                      aria-label="Indicativo internacional"
                      aria-haspopup="listbox"
                      aria-expanded={isCountryOpen}
                      onClick={() => setIsCountryOpen((v) => !v)}
                      style={{
                        width: '100%',
                        padding: '0.95rem 1rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        color: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                      }}
                    >
                      {countryCode}
                    </button>

                    {isCountryOpen && (
                      <div
                        role="listbox"
                        aria-label="Opciones de indicativo internacional"
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: 0,
                          right: 0,
                          background: '#0f0f12',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          zIndex: 10,
                          boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                        }}
                      >
                        {countryOptions.map((opt, idx) => (
                          <button
                            key={`${opt.label}-${idx}`}
                            type="button"
                            role="option"
                            aria-selected={opt.value === countryCode}
                            onClick={() => {
                              setCountryCode(opt.value);
                              setIsCountryOpen(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '0.75rem 0.9rem',
                              background: opt.value === countryCode ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                              border: 'none',
                              borderBottom: '1px solid rgba(255,255,255,0.06)',
                              color: 'white',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.80rem',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="input-wrapper" style={{ marginBottom: 0, flex: 1 }}>
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    placeholder="Número de teléfono"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    style={{ paddingLeft: '3rem' }}
                    required
                  />
                </div>
                </div>
                {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  {loading ? <Loader2 className="spin" size={20} /> : <>Siguiente <ArrowRight size={20} /></>}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="otp-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Verifica tu código</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Hemos enviado un código de 6 dígitos a <br />
                <strong style={{ color: 'white' }}>{phone}</strong>
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
                      style={{ width: '45px', height: '55px', textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '12px', color: 'white' }}
                    />
                  ))}
                </div>
                {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading || otp.join('').length < 6} style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                  {loading ? <Loader2 className="spin" size={20} /> : 'Verificar y Entrar'}
                </button>
                <button type="button" onClick={() => setStep('phone')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '1.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
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
