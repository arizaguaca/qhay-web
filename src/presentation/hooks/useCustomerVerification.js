import { useState, useCallback } from 'react';
import {
  createCustomerVerification,
  confirmCustomerOtp,
} from '../../core/use-cases/customer.use-cases';

const SESSION_KEY = 'qhay_customer_session';

/**
 * useCustomerVerification — Manages the phone OTP verification flow for public menu.
 *
 * @param {import('../../core/repositories/IAuthRepository').IAuthRepository} authRepository
 */
export const useCustomerVerification = (authRepository) => {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isVerified = (() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session).verified : false;
    } catch {
      return false;
    }
  })();

  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const createCustomer = useCallback(async ({ fullName: customerFullName, phone: phoneNumber }) => {
    setLoading(true);
    setError('');
    try {
      const normalizedFullName = (customerFullName ?? '').trim();
      const normalizedPhone = (phoneNumber ?? '').trim();

      await createCustomerVerification(authRepository, {
        fullName: normalizedFullName,
        phone: normalizedPhone,
        channel: 'whatsapp',
      });

      setFullName(normalizedFullName);
      setPhone(normalizedPhone);

      const session = { fullName: normalizedFullName, phone: normalizedPhone, verified: false };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      setStep('otp');
      return { verified: false };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  const verifyOtp = useCallback(async (code) => {
    setLoading(true);
    setError('');
    try {
      const customer = await confirmCustomerOtp(authRepository, phone, code);
      const session = { fullName, phone, verified: true, customer_id: customer.customerId, customer: customer.customer };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return customer;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authRepository, name, phone]);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return { step, setStep, fullName, setFullName, phone, loading, error, isVerified, getSession, createCustomer, verifyOtp, logout };
};
