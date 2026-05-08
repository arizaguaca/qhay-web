import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Wallet, Check, Loader } from 'lucide-react';
import { formatCurrency } from '../../utils/formatter';
import './BillRequestBar.css';

/** Statuses that count as "ready for billing" */
const BILL_ELIGIBLE_STATUSES = ['delivered', 'payment_requested'];

/**
 * BillRequestBar — Sticky bottom bar that lets the customer request the bill
 * once ALL active orders have been delivered.
 *
 * Follows SRP: owns only bill-request UI logic. Derives all state from props.
 *
 * @param {Object} props
 * @param {import('../../../core/entities/Order').Order[]} props.activeOrders
 * @param {() => void} props.onRequestBill - called when the customer confirms the request
 * @param {boolean} props.isRequesting - true while the async operation is in-flight
 */
const BillRequestBar = ({ activeOrders, onRequestBill, isRequesting }) => {
  if (!activeOrders || activeOrders.length === 0) return null;

  const eligibleCount  = activeOrders.filter(o => BILL_ELIGIBLE_STATUSES.includes(o.status)).length;
  const canRequestBill = eligibleCount === activeOrders.length;
  const allRequested   = activeOrders.every(o => o.status === 'payment_requested');
  const pendingCount   = activeOrders.length - eligibleCount;
  const totalPrice     = activeOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const statusText = allRequested
    ? 'Mesero notificado'
    : canRequestBill
    ? `${activeOrders.length} pedido${activeOrders.length > 1 ? 's' : ''} entregado${activeOrders.length > 1 ? 's' : ''}`
    : `${pendingCount} pedido${pendingCount > 1 ? 's' : ''} por entregar`;

  return (
    <motion.div
      className="bill-request-bar"
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      exit={{ y: 80 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
    >
      {/* Left: receipt icon + total + status */}
      <div className="bill-bar-info">
        <div className={`bill-bar-icon ${allRequested ? 'bill-bar-icon--confirmed' : ''}`}>
          <Receipt size={20} strokeWidth={2} />
        </div>

        <div>
          <div className="bill-bar-total">${formatCurrency(totalPrice)}</div>
          <div className="bill-bar-status">{statusText}</div>

          {/* Per-order progress dots */}
          <div className="bill-bar-dots">
            {activeOrders.map((o) => (
              <div
                key={o.id}
                className={`bill-bar-dot ${
                  o.status === 'payment_requested'
                    ? 'bill-bar-dot--requested'
                    : BILL_ELIGIBLE_STATUSES.includes(o.status)
                    ? 'bill-bar-dot--delivered'
                    : ''
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: action */}
      <AnimatePresence mode="wait">
        {allRequested ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bill-bar-confirmed"
          >
            <Check size={18} strokeWidth={3} />
            Notificado
          </motion.div>
        ) : isRequesting ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bill-bar-btn bill-bar-btn--loading"
          >
            <Loader size={18} className="spin" />
          </motion.div>
        ) : (
          <motion.button
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={canRequestBill ? onRequestBill : undefined}
            disabled={!canRequestBill}
            className={`bill-bar-btn ${canRequestBill ? 'bill-bar-btn--active' : 'bill-bar-btn--disabled'}`}
            whileTap={canRequestBill ? { scale: 0.95 } : {}}
          >
            <Wallet size={18} />
            {canRequestBill ? 'Solicitar Cuenta' : `${pendingCount} por entregar`}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BillRequestBar;
