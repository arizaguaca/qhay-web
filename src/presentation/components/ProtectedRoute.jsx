import React from 'react';
import { motion } from 'framer-motion';
import { ShieldX, Loader2 } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

/**
 * ProtectedRoute — Guardia de rutas basada en roles.
 *
 * Uso:
 * ```jsx
 * <ProtectedRoute allowedRoles={['owner', 'admin', 'manager']}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 *
 * // Para cualquier usuario autenticado:
 * <ProtectedRoute>
 *   <ProfilePage />
 * </ProtectedRoute>
 * ```
 *
 * @param {{
 *   allowedRoles?: string[],
 *   fallback?: React.ReactNode,
 *   onUnauthorized?: () => void,
 *   children: React.ReactNode
 * }} props
 */
const ProtectedRoute = ({ allowedRoles, fallback, onUnauthorized, children }) => {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  // 1. Mientras se verifica el estado de auth (ej: rehidratación inicial)
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        color: 'var(--text-secondary, #94a3b8)',
      }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary, #6366f1)' }} />
        <p style={{ fontSize: '0.9rem' }}>Verificando sesión...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. No autenticado → ejecutar callback o renderizar fallback
  if (!isAuthenticated) {
    if (onUnauthorized) {
      onUnauthorized();
      return null;
    }
    return fallback ?? <UnauthorizedView message="Debes iniciar sesión para ver esta página." />;
  }

  // 3. Autenticado pero sin el rol requerido → 403
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <ForbiddenView
        userRole={user.role}
        allowedRoles={allowedRoles}
      />
    );
  }

  // 4. Todo OK — renderizar la ruta protegida
  return children;
};

// ─── Vistas de error ──────────────────────────────────────────────────────────

const UnauthorizedView = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      color: 'var(--text-secondary, #94a3b8)',
      textAlign: 'center',
      padding: '2rem',
    }}
  >
    <ShieldX size={56} style={{ color: 'var(--primary, #6366f1)', opacity: 0.6 }} />
    <h2 style={{ fontSize: '1.4rem', color: 'var(--text, #f1f5f9)', margin: 0 }}>Acceso requerido</h2>
    <p style={{ maxWidth: '360px', lineHeight: 1.6 }}>{message}</p>
  </motion.div>
);

const ForbiddenView = ({ userRole, allowedRoles }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem',
    }}
  >
    <div style={{
      padding: '1.5rem',
      borderRadius: '50%',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '2px solid rgba(239, 68, 68, 0.3)',
    }}>
      <ShieldX size={48} style={{ color: '#ef4444' }} />
    </div>
    <h2 style={{ fontSize: '1.5rem', color: 'var(--text, #f1f5f9)', margin: 0 }}>Acceso Denegado</h2>
    <p style={{ color: 'var(--text-secondary, #94a3b8)', maxWidth: '380px', lineHeight: 1.6 }}>
      Tu rol <strong style={{ color: 'var(--primary, #6366f1)' }}>{userRole}</strong> no tiene permiso
      para acceder a esta sección.
    </p>
    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
      Roles permitidos: {allowedRoles.join(', ')}
    </p>
  </motion.div>
);

export default ProtectedRoute;
