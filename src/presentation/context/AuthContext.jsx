import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isAdmin, isManager, isStaff, isCustomer, canAccessOrders } from '../../core/entities/User';

/**
 * @typedef {Object} AuthContextValue
 * @property {import('../../core/entities/User').User | null} user - Usuario activo
 * @property {boolean} isAuthenticated - true si hay sesión activa
 * @property {boolean} isLoading - true durante operaciones de auth
 * @property {string} error - Último mensaje de error
 * @property {Function} login - login(email, password)
 * @property {Function} verifyCode - verifyCode(contact, code) para clientes
 * @property {Function} logout - Cierra sesión en servidor y limpia estado local
 * @property {Function} isAdmin - isAdmin(user) → owner | admin
 * @property {Function} isManager - isManager(user) → owner | admin | manager
 * @property {Function} isStaff - isStaff(user) → cualquier rol excepto customer
 * @property {Function} isCustomer - isCustomer(user) → role === 'customer'
 * @property {Function} canAccessOrders - canAccessOrders(user)
 * @property {Function} hasRole - hasRole(roles[]) → true si el usuario tiene alguno de esos roles
 */

const AuthContext = createContext(null);

/**
 * AuthProvider — Provee el estado de autenticación a toda la aplicación.
 * Debe envolver la raíz de la app en main.jsx.
 *
 * @param {{ authRepository: Object, children: React.ReactNode }} props
 */
export const AuthProvider = ({ authRepository, children }) => {
  const { user, status, error, login, register, verify, verifyCode, logout } = useAuth(authRepository);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading: status === 'loading',
    error,

    // Acciones
    login,
    register,
    verify,
    verifyCode,
    logout,

    // Helpers de rol (usados como funciones para facilitar testeo)
    isAdmin: () => isAdmin(user),
    isManager: () => isManager(user),
    isStaff: () => isStaff(user),
    isCustomer: () => isCustomer(user),
    canAccessOrders: () => canAccessOrders(user),

    /**
     * hasRole — Verifica si el usuario activo tiene alguno de los roles dados.
     * @param {string[]} roles
     * @returns {boolean}
     */
    hasRole: (roles) => !!user && roles.includes(user.role),
  }), [user, status, error, login, register, verify, verifyCode, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuthContext — Hook para consumir el AuthContext.
 * Lanza un error claro si se usa fuera del AuthProvider.
 * @returns {AuthContextValue}
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an <AuthProvider>. Check your main.jsx.');
  }
  return context;
};
