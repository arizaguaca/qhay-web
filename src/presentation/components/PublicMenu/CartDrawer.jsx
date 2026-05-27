import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Minus, Loader, CheckCircle2, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatter';

/**
 * CartDrawer — Floating bottom drawer showing cart items before placing an order.
 *
 * Follows SRP: owns only the cart display and in-cart interaction.
 * All state is managed externally and injected via props (DIP).
 *
 * @param {Object} props
 * @param {Array}    props.cart
 * @param {Object}   props.itemNotes
 * @param {Function} props.onNotesChange       (itemId: string, value: string) => void
 * @param {boolean}  props.isExpanded
 * @param {Function} props.onToggle
 * @param {number}   props.cartTotal
 * @param {number}   props.totalItems
 * @param {boolean}  props.cartPulsing
 * @param {Function} props.onAdd               (item) => void
 * @param {Function} props.onRemove            (cartItemKey: string) => void
 * @param {Function} props.onPlaceOrder        () => void
 * @param {boolean}  props.submitting
 */
const CartDrawer = ({
  cart,
  itemNotes,
  onNotesChange,
  isExpanded,
  onToggle,
  cartTotal,
  totalItems,
  cartPulsing,
  onAdd,
  onRemove,
  onPlaceOrder,
  submitting,
}) => {
  return (
    <AnimatePresence>
      {cart.length > 0 && (
    <div className="floating-cart-bar">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: isExpanded ? 0 : 'calc(100% - 100px)' }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="floating-cart-panel"
      >
        <motion.div
          className="cart-handle-area"
          onClick={onToggle}
          style={{ cursor: 'pointer', paddingBottom: '0.5rem' }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="cart-handle" />
          <motion.div
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: 'easeInOut',
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontWeight: '700',
              marginTop: '-4px',
              userSelect: 'none',
            }}
          >
            <span>
              {isExpanded ? 'Toca para ocultar el pedido' : 'Toca para ver tu pedido'}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <ChevronUp size={14} color="var(--text-muted)" style={{ marginTop: '1px' }} />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="cart-items-list">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => {
              const itemKey = item.optionsKey ? `${item.id}-${item.optionsKey}` : item.id;
              const modsPrice = (item.selectedOptions || []).reduce(
                (sum, opt) => sum + (opt.extraPrice || 0),
                0
              );
              return (
                <motion.div
                  key={itemKey}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="cart-item-row"
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.8rem 0' }}
                >
                  {/* Top Part: Title + Modifiers on left, Price on right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cart-item-name">{item.name}</div>
                      {item.selectedOptions?.length > 0 && (
                        <div className="cart-item-modifiers" style={{ margin: 0 }}>
                          {item.selectedOptions.map((opt) => opt.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1rem', flexShrink: 0 }}>
                      ${formatCurrency((item.price + modsPrice) * item.quantity)}
                    </span>
                  </div>

                  {/* Bottom Part: Note Input on left, Qty Control on right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Nota: ej. sin cebolla..."
                        className="cart-note-input"
                        style={{ marginTop: 0 }}
                        value={itemNotes[item.id] || ''}
                        onChange={(e) => onNotesChange(item.id, e.target.value)}
                        onFocus={() => { if (!isExpanded) onToggle(); }}
                        maxLength={100}
                      />
                    </div>
                    <div
                      className="qty-control"
                      style={{ margin: 0, padding: '0.2rem 0.3rem', gap: '0.6rem', flexShrink: 0, height: '28px' }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => onRemove(itemKey)}
                        className="qty-btn"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                      >
                        <Minus size={12} />
                      </motion.button>

                      <div className="counter-wrapper">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={item.quantity}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="counter-number"
                          >
                            {item.quantity}
                          </motion.span>
                        </AnimatePresence>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => onAdd(item)}
                        className="qty-btn"
                        style={{ background: 'var(--primary)' }}
                      >
                        <Plus size={12} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="cart-footer" style={{ padding: '0.8rem 1.2rem' }}>
          <button
            onClick={onPlaceOrder}
            disabled={submitting}
            className="btn-primary"
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '16px',
              boxShadow: '0 8px 25px rgba(var(--primary-rgb), 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1.2rem',
            }}
          >
            {submitting ? (
              <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                <Loader size={20} className="spin" />
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    className={`cart-icon-circle-mini ${cartPulsing ? 'cart-pulse-animation' : ''}`}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: 'rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <ShoppingBag size={16} color="black" />
                    <div
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        minWidth: '18px',
                        height: '18px',
                        fontSize: '0.65rem',
                        padding: '0 4px',
                        background: 'white',
                        color: 'black',
                        fontWeight: '900',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                      }}
                    >
                      {totalItems}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '1rem', fontWeight: '900', color: 'black', letterSpacing: '0.5px' }}>
                  Pedir Ahora
                </div>

                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: '900',
                    color: 'black',
                    background: 'rgba(0, 0, 0, 0.12)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                  }}
                >
                  ${formatCurrency(cartTotal)}
                </div>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
