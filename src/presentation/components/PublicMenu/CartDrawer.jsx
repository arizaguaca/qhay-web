import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Minus, Loader, CheckCircle2 } from 'lucide-react';
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
        <div
          className="cart-handle-area"
          onClick={onToggle}
          style={{ cursor: 'pointer', paddingBottom: '0.5rem' }}
        >
          <div className="cart-handle" />
          {!isExpanded && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontWeight: '700',
                marginTop: '-4px',
              }}
            >
              Toca para ver tu pedido
            </div>
          )}
        </div>

        <div className="cart-items-list no-scrollbar">
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
                >
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    {item.selectedOptions?.length > 0 && (
                      <div className="cart-item-modifiers">
                        {item.selectedOptions.map((opt) => opt.name).join(', ')}
                      </div>
                    )}
                    <textarea
                      placeholder="Nota: ej. sin cebolla..."
                      className="cart-note-textarea no-scrollbar"
                      value={itemNotes[item.id] || ''}
                      onChange={(e) => onNotesChange(item.id, e.target.value)}
                      onFocus={() => { if (!isExpanded) onToggle(); }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0.8rem',
                    }}
                  >
                    <span style={{ fontWeight: '800', color: 'var(--primary)' }}>
                      ${formatCurrency((item.price + modsPrice) * item.quantity)}
                    </span>

                    <div
                      className="qty-control"
                      style={{ margin: 0, padding: '0.4rem', gap: '1rem' }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => onRemove(itemKey)}
                        className="qty-btn"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                      >
                        <Minus size={16} />
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
                        <Plus size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="cart-footer">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={`cart-icon-circle ${cartPulsing ? 'cart-pulse-animation' : ''}`}>
                <ShoppingBag size={24} color="black" />
                <div className="cart-qty-badge">{totalItems}</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontWeight: '700',
                  }}
                >
                  TOTAL ESTIMADO
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white' }}>
                  ${formatCurrency(cartTotal)}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onPlaceOrder}
            disabled={submitting}
            className="btn-primary"
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '18px',
              fontSize: '1.1rem',
              fontWeight: '900',
              boxShadow: '0 10px 25px rgba(var(--primary-rgb), 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
            }}
          >
            {submitting ? (
              <Loader size={22} className="spin" />
            ) : (
              <>
                <CheckCircle2 size={22} />
                Pedir Ahora
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
