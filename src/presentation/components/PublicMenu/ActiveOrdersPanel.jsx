import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Bell,
  Receipt,
  Wallet,
  Check,
  Loader,
  ChevronUp,
} from 'lucide-react';
import { ORDER_STATUS_META } from '../../../core/entities/Order';
import { formatCurrency } from '../../utils/formatter';
import './ActiveOrdersPanel.css';

const BILL_ELIGIBLE_STATUSES = ['delivered', 'payment_requested'];

/**
 * ActiveOrdersPanel — Fixed bottom panel showing the customer's active orders.
 *
 * Collapsed: sticky bar with the order total + bill-request action (always visible).
 * Expanded:  full bottom sheet with all active order cards and progress trackers.
 *
 * Follows SRP: owns only active-order display and bill-request UI.
 * All order data is injected via props; no direct API calls (DIP).
 *
 * @param {Object}   props
 * @param {import('../../../core/entities/Order').Order[]} props.activeOrders
 * @param {() => Promise<void>} props.onRequestBill
 * @param {(expanded: boolean) => void} [props.onExpandChange] - notifies parent of expand state
 */
const ActiveOrdersPanel = ({ activeOrders, onRequestBill, onExpandChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = (next) => {
    setIsExpanded(next);
    onExpandChange?.(next);
  };
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!activeOrders || activeOrders.length === 0) return null;

  const totalPrice    = activeOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const eligibleCount = activeOrders.filter((o) => BILL_ELIGIBLE_STATUSES.includes(o.status)).length;
  const canRequestBill = eligibleCount === activeOrders.length;
  const allRequested   = activeOrders.every((o) => o.status === 'payment_requested');
  const pendingCount   = activeOrders.length - eligibleCount;

  const handleConfirmBill = async () => {
    setShowPaymentModal(false);
    setIsRequesting(true);
    try {
      await onRequestBill();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <>
      {/* ── Toast ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -50, opacity: 0, x: '-50%' }}
            className="toast-notification"
            style={{ zIndex: 3100 }}
          >
            <div className="toast-icon-box">
              <Check size={18} />
            </div>
            <span>El personal ha sido avisado. En un momento traerán tu cuenta.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Backdrop ──────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="orders-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleExpand(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Main panel ────────────────────────────────────── */}
      <motion.div
        className="active-orders-panel"
        animate={{ y: isExpanded ? 0 : 'calc(100% - 88px)' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      >
        {/* ── Collapsed bar — always visible ── */}
        <div className="orders-panel-bar">
          {/* Handle: clicking it toggles expand */}
          <div
            className="orders-panel-handle"
            onClick={() => toggleExpand(!isExpanded)}
            role="button"
            aria-expanded={isExpanded}
            aria-label="Ver pedidos activos"
          />

          <div className="orders-bar-content">
            {/* Left: info — clicking expands the panel */}
            <div
              className="orders-bar-left"
              onClick={() => toggleExpand(!isExpanded)}
              style={{ cursor: 'pointer', flex: 1 }}
            >
              <div className={`orders-bar-icon ${allRequested ? 'orders-bar-icon--confirmed' : ''}`}>
                <Receipt size={20} strokeWidth={2} />
              </div>
              <div>
                <div className="orders-bar-total">${formatCurrency(totalPrice)}</div>
                <div className="orders-bar-status">
                  {allRequested
                    ? 'Mesero notificado'
                    : `${activeOrders.length} pedido${activeOrders.length > 1 ? 's' : ''} activo${activeOrders.length > 1 ? 's' : ''}`}
                </div>
              </div>
              <span
                className="orders-bar-chevron"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', marginLeft: '0.4rem' }}
              >
                <ChevronUp size={16} />
              </span>
            </div>

            {/* Right: bill action — always visible, no expand needed */}
            <div onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                {allRequested ? (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bill-bar-confirmed"
                  >
                    <Check size={16} strokeWidth={3} />
                    <span className="btn-label">Notificado</span>
                  </motion.div>
                ) : isRequesting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bill-bar-btn bill-bar-btn--loading"
                  >
                    <Loader size={16} className="spin" />
                  </motion.div>
                ) : (
                  <motion.button
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={canRequestBill ? () => setShowPaymentModal(true) : undefined}
                    disabled={!canRequestBill}
                    className={`bill-bar-btn ${canRequestBill ? 'bill-bar-btn--active' : 'bill-bar-btn--disabled'}`}
                    whileTap={canRequestBill ? { scale: 0.95 } : {}}
                  >
                    <Wallet size={16} />
                    <span className="btn-label">
                      {canRequestBill ? 'Solicitar Cuenta' : `${pendingCount} por entregar`}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Expanded content: order cards only ── */}
        <div className="orders-panel-content no-scrollbar">
          <div className="orders-panel-list">
            <AnimatePresence mode="popLayout">
              {activeOrders.map((order) => {
                const meta =
                  ORDER_STATUS_META[order.status] || { name: order.status, color: 'var(--border)' };
                const flow = ['pending', 'preparing', 'ready', 'delivered'];
                const currentStepIndex = flow.indexOf(order.status);
                const progressWidth =
                  currentStepIndex === -1 ? 0 : (currentStepIndex / (flow.length - 1)) * 100;
                const statusToRgb = {
                  pending: '245, 158, 11',
                  preparing: '59, 130, 246',
                  ready: '59, 130, 246',
                  delivered: '139, 92, 246',
                  payment_requested: '236, 72, 153',
                };

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`glass-card active-order-card ${order.status === 'preparing' ? 'breathing-bg' : ''}`}
                    style={{
                      padding: '1.75rem',
                      marginBottom: 0,
                      border: `1px solid ${meta.color}40`,
                      boxShadow: `0 10px 30px -10px ${meta.color}30`,
                    }}
                  >
                    {/* Glowing perimeter */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        boxShadow: `inset 0 0 20px ${meta.color}15`,
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Order header — estado como título principal */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                      }}
                    >
                      {/* Icono coloreado por estado */}
                      <div
                        style={{
                          background: `${meta.color}20`,
                          padding: '0.75rem',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: `1px solid ${meta.color}30`,
                        }}
                      >
                        {order.status === 'ready' ? (
                          <Bell size={24} color={meta.color} className="bounce-animation" />
                        ) : (
                          <ShoppingBag size={24} color={meta.color} />
                        )}
                      </div>

                      {/* Estado como título con animación en cambio */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={order.status}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                fontWeight: '900',
                                fontSize: '1.05rem',
                                color: meta.color,
                                letterSpacing: '0.3px',
                              }}
                            >
                              {meta.name.toUpperCase()}
                            </span>
                            {order.status === 'ready' && (
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: meta.color,
                                  boxShadow: `0 0 10px ${meta.color}`,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </div>
                          {order.status === 'ready' && (
                            <span
                              style={{
                                fontSize: '0.78rem',
                                color: 'rgba(255,255,255,0.55)',
                                marginTop: '0.2rem',
                                display: 'block',
                              }}
                            >
                              ¡Tu pedido está listo para ser servido!
                            </span>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Items list */}
                    <div className="order-items-container" style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {order.items?.map((it, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                                <span
                                  style={{ color: 'var(--primary)', marginRight: '4px' }}
                                >
                                  {it.quantity}x
                                </span>{' '}
                                {it.menuItemName}
                              </span>
                              {it.modifiers?.length > 0 && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px',
                                  }}
                                >
                                  {it.modifiers.map((m) => m.name).join(', ')}
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                color: 'rgba(255,255,255,0.7)',
                              }}
                            >
                              $
                              {formatCurrency(
                                (Number(it.unitPrice || 0) +
                                  (it.modifiers || []).reduce(
                                    (s, m) => s + Number(m.price || 0),
                                    0
                                  )) *
                                  it.quantity
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '1.2rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            fontWeight: '600',
                          }}
                        >
                          TOTAL PEDIDO
                        </span>
                        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white' }}>
                          ${formatCurrency(order.totalPrice || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="order-tracker-container">
                      {/* Dots + fill bar */}
                      <div className="tracker-bar-bg">
                        <div
                          className="tracker-bar-fill"
                          style={{
                            width: `${progressWidth}%`,
                            background: meta.color,
                            boxShadow: `0 0 10px ${meta.color}40`,
                          }}
                        />
                        {flow.map((step, sIdx) => (
                          <div
                            key={step}
                            className={`tracker-step ${sIdx <= currentStepIndex ? 'completed' : ''} ${sIdx === currentStepIndex ? 'active' : ''}`}
                            style={{
                              ...(sIdx <= currentStepIndex
                                ? { borderColor: meta.color, background: meta.color }
                                : {}),
                              ...(sIdx === currentStepIndex
                                ? { '--node-glow-rgb': statusToRgb[step] }
                                : {}),
                            }}
                          />
                        ))}
                      </div>

                      {/* Labels row — flex independiente para evitar desbordamiento */}
                      <div className="tracker-labels-row">
                        {flow.map((step, sIdx) => (
                          <span
                            key={step}
                            className={`tracker-label-item ${sIdx === currentStepIndex ? 'tracker-label-item--active' : ''}`}
                          >
                            {ORDER_STATUS_META[step].name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Payment confirmation modal ─────────────────────── */}
      <AnimatePresence>
        {showPaymentModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '400px',
                position: 'relative',
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(236, 72, 153, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  color: '#ec4899',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                }}
              >
                <Wallet size={32} />
              </div>

              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '900',
                  color: 'white',
                  marginBottom: '0.5rem',
                }}
              >
                ¿Solicitar cuenta?
              </h2>
              <p
                style={{
                  color: 'var(--text-muted)',
                  marginBottom: '2rem',
                  lineHeight: '1.5',
                }}
              >
                Se notificará al personal para traer la cuenta por un total de
                <br />
                <span
                  style={{ color: 'white', fontWeight: '900', fontSize: '1.4rem' }}
                >
                  ${formatCurrency(totalPrice)}
                </span>
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmBill}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '14px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(var(--primary-rgb), 0.3)',
                  }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ActiveOrdersPanel;
