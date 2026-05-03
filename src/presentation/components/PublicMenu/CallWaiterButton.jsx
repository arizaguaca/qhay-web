import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, Check, Loader2 } from 'lucide-react';
import './CallWaiterButton.css';

/**
 * CallWaiterButton — A floating action button (FAB) for the customer to request staff assistance.
 * Features 3 states: idle, calling, notified, with a debounced network simulation and 
 * high-fidelity Framer Motion animations.
 */
const CallWaiterButton = ({ restaurantId, tableNumber }) => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'calling' | 'notified'

  const handleCallWaiter = async () => {
    if (status !== 'idle') return;

    setStatus('calling');
    
    try {
      // TODO: Replace with real HTTP request to the notification endpoint
      // await httpClient.post(`/restaurants/${restaurantId}/tables/${tableNumber}/call-waiter`);
      
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus('notified');
      
      // Lock the button in 'notified' state for 15 seconds to prevent spam,
      // then reset to idle so they can call again if needed.
      setTimeout(() => {
        setStatus('idle');
      }, 15000);
      
    } catch (error) {
      console.error('Error calling waiter:', error);
      setStatus('idle');
    }
  };

  return (
    <div className="call-waiter-container">
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
