import { useState, useCallback } from 'react';
import { loginUser, logoutUser, registerUser, verifyUser, verifyCustomerCode } from '../../core/use-cases/auth.use-cases';

const SESSION_KEY = 'qhay_user';

/**
 * useAuth — Manages admin/staff user authentication state.
 * Persists session to localStorage. Cookie is managed by the browser automatically.
 *
 * @param {import('../../core/repositories/IAuthRepository').IAuthRepository} authRepository
 */
export const useAuth = (authRepository) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState('idle'); // idle | loading | error | success | verified
  const [error, setError] = useState('');

  const login = useCallback(async (credentials) => {
    setStatus('loading');
    setError('');
    try {
      const userData = await loginUser(authRepository, credentials);
      localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      setUser(userData);
      setStatus('idle');
      return userData;
    } catch (err) {
      setError(err.message);
      setStatus('error');
      throw err;
    }
  }, [authRepository]);

  const register = useCallback(async (data) => {
    setStatus('loading');
    setError('');
    try {
      await registerUser(authRepository, data);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
      throw err;
    }
  }, [authRepository]);

  const verify = useCallback(async (email, code) => {
    setStatus('loading');
    setError('');
    try {
      await verifyUser(authRepository, email, code);
      setStatus('verified');
    } catch (err) {
      setError(err.message);
      setStatus('error');
      throw err;
    }
  }, [authRepository]);

  const verifyCode = useCallback(async (contact, code) => {
    setStatus('loading');
    setError('');
    try {
      const customerData = await verifyCustomerCode(authRepository, contact, code);
      localStorage.setItem(SESSION_KEY, JSON.stringify(customerData));
      setUser(customerData);
      setStatus('idle');
      return customerData;
    } catch (err) {
      setError(err.message);
      setStatus('error');
      throw err;
    }
  }, [authRepository]);

  const logout = useCallback(async () => {
    setStatus('loading');
    try {
      // Invalida la cookie HttpOnly en el servidor
      await logoutUser(authRepository);
    } catch (err) {
      console.warn('[useAuth] logout backend error (ignoring):', err.message);
    } finally {
      // Siempre limpiar la sesión local, independientemente del resultado del servidor
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      setStatus('idle');
    }
  }, [authRepository]);

  return { user, status, error, login, register, verify, verifyCode, logout };
};

