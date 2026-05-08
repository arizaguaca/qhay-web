import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, Check, Loader2 } from 'lucide-react';
import { apiFetch } from '../../../data/api/httpClient';
import './CallWaiterButton.css';

/**
 * CallWaiterButton — A floating pill button for the customer to request staff assistance.
 * Checks for existing pending requests on mount and polls every 15s.
 * The customer cannot send a new request until the waiter resolves the current one.
 *
 * @param {boolean} [props.billBarVisible] - when true, floats above the BillRequestBar
 */
const CallWaiterButton = ({ restaurantId, tableNumber, customerId, billBarVisible = false }) => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'calling' | 'notified'

  // Check if there's already a pending service request for this table
  const checkPendingRequest = useCallback(async () => {
    try {
      const res = await apiFetch(`/customers/${customerId}/service-requests?status=pending`);
      if (res.ok) {
        const data = await res.json();
        const requests = Array.isArray(data) ? data : data.data || [];
        const tableNum = parseInt(tableNumber) || tableNumber;
        const hasPending = requests.some(
          sr => (sr.table_number === tableNum || sr.tableNumber === tableNum)
        );

        if (hasPending && status !== 'calling') {
          setStatus('notified');
        } else if (!hasPending && status === 'notified') {
          // Waiter resolved the request — unlock the button
          setStatus('idle');
        }
      }
    } catch (err) {
      console.error('Error checking pending requests:', err);
    }
  }, [restaurantId, tableNumber, status]);

  // On mount: check for existing pending request
  // Then poll every 15 seconds to detect when the waiter resolves it
  useEffect(() => {
    checkPendingRequest();
    const interval = setInterval(checkPendingRequest, 15000);
    return () => clearInterval(interval);
  }, [checkPendingRequest]);

  const handleCallWaiter = async () => {
    if (status !== 'idle') return;

    setStatus('calling');
    
    try {
      const response = await apiFetch('/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId,
          tableNumber: parseInt(tableNumber) || tableNumber,
          customerId
        })
      });

      if (!response.ok) {
        throw new Error('Error al notificar al mesero');
      }

      setStatus('notified');
      // No timer — stays locked until the waiter resolves the request
      
    } catch (error) {
      console.error('Error calling waiter:', error);
      setStatus('idle');
    }
  };

  return (
    <div className={`call-waiter-container ${billBarVisible ? 'call-waiter-container--above-bill' : ''}`}>
      <motion.button
        className={`call-fab-pill ${status === 'notified' ? 'success' : ''}`}
        onClick={handleCallWaiter}
        whileTap={status === 'idle' ? { scale: 0.95 } : {}}
        disabled={status !== 'idle'}
      >
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BellRing size={20} strokeWidth={2.5} />
              <span className="btn-text">Llamar Mesero</span>
            </motion.div>
          )}
          {status === 'calling' && (
            <motion.div key="calling" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Loader2 size={20} className="spin" strokeWidth={2.5} />
              <span className="btn-text">Notificando...</span>
            </motion.div>
          )}
          {status === 'notified' && (
            <motion.div key="notified" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Check size={20} strokeWidth={3} />
              <span className="btn-text">Mesero en camino</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default CallWaiterButton;
