import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Info, Plus, Minus, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatter';
import { resolveImageUrl } from '../../../data/api/httpClient';

/**
 * ItemDetailModal — Modal to configure a menu item with groups and options.
 * 
 * @param {{ 
 *   item: Object, 
 *   isOpen: boolean, 
 *   onClose: () => void, 
 *   onConfirm: (itemWithSelections: Object) => void 
 * }} props
 */
const ItemDetailModal = ({ item, isOpen, onClose, onConfirm }) => {
  const [selections, setSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setSelections({});
      setQuantity(1);
      setError(null);
      
      // Pre-select defaults if needed (e.g. first radio option if required)
      const initial = {};
      (item.groups || []).forEach(group => {
        if (group.isRequired && group.maxSelectable === 1 && group.options?.length > 0) {
          // You could auto-select the first one here if desired
          // initial[group.id] = [group.options[0]];
        }
      });
      setSelections(initial);
    }
  }, [isOpen, item]);

  if (!item) return null;

  const handleOptionToggle = (group, option) => {
    setSelections(prev => {
      const current = prev[group.id] || [];
      const exists = current.find(o => o.id === option.id);
      
      let next;
      if (exists) {
        next = current.filter(o => o.id !== option.id);
      } else {
        if (group.maxSelectable === 1) {
          next = [option];
        } else if (current.length < group.maxSelectable) {
          next = [...current, option];
        } else {
          // Already at max
          return prev;
        }
      }
      
      return { ...prev, [group.id]: next };
    });
    setError(null);
  };

  const calculateTotal = () => {
    let base = item.price;
    Object.values(selections).forEach(opts => {
      opts.forEach(opt => {
        base += (parseFloat(opt.extraPrice) || 0);
      });
    });
    return base * quantity;
  };

  const validate = () => {
    for (const group of (item.groups || [])) {
      const current = selections[group.id] || [];
      if (group.isRequired && current.length < (group.minSelectable || 1)) {
        setError(`Por favor selecciona al menos ${group.minSelectable || 1} opción en "${group.title || group.name}"`);
        return false;
      }
    }
    return true;
  };

  const handleAdd = () => {
    if (!validate()) return;
    
    setIsSuccess(true);
    
    setTimeout(() => {
      const selectedOptions = [];
      Object.entries(selections).forEach(([groupId, opts]) => {
        const group = item.groups.find(g => g.id === groupId);
        opts.forEach(opt => {
          selectedOptions.push({
            groupId,
            groupTitle: group.title || group.name,
            optionId: opt.id,
            name: opt.name,
            extraPrice: parseFloat(opt.extraPrice) || 0
          });
        });
      });

      onConfirm({
        ...item,
        quantity,
        selectedOptions,
        totalItemPrice: calculateTotal() / quantity
      });
      setIsSuccess(false);
      onClose();
    }, 600); // Wait for success animation
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', inset: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', 
          zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' 
        }}>
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="item-detail-panel"
            style={{ 
              width: '100%', maxWidth: '500px', background: 'rgba(15, 23, 42, 0.95)', 
              backdropFilter: 'blur(20px)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', 
              maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
            }}
          >
            {/* Drag Handle */}
            <div onClick={onClose} style={{ width: '100%', padding: '12px 0', cursor: 'pointer', display: 'flex', justifyContent: 'center', position: 'absolute', top: 0, zIndex: 10 }}>
              <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
            </div>

            {/* Header / Image */}
            <div style={{ position: 'relative', height: '280px', flexShrink: 0 }}>
              <img 
                src={resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=600'} 
                alt={item.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: '30px', borderTopRightRadius: '30px' }}
              />
              {/* Gradient Overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.4) 40%, transparent 100%)', pointerEvents: 'none' }} />
              
              <button onClick={onClose} style={{ 
                position: 'absolute', top: '1.5rem', right: '1.5rem', 
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '50%', padding: '0.6rem', color: 'white', cursor: 'pointer', zIndex: 10
              }}>
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ padding: '0 1.5rem 1.5rem', overflowY: 'auto', flex: 1 }} className="no-scrollbar">
              <div style={{ marginTop: '-40px', position: 'relative', zIndex: 5 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{item.name}</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', margin: '0.8rem 0 2rem', lineHeight: '1.6', letterSpacing: '0.3px', fontWeight: '500' }}>
                  {item.description}
                </p>
              </div>

              {/* Groups */}
              {(item.groups || []).map(group => (
                <div key={group.id} style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white' }}>
                      {group.title || group.name}
                      {group.isRequired && <span style={{ color: '#ec4899', marginLeft: '0.5rem' }}>*</span>}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.08)', padding: '0.3rem 0.8rem', borderRadius: '12px', fontWeight: '700' }}>
                      {group.maxSelectable === 1 ? 'Selecciona 1' : `Máximo ${group.maxSelectable}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {(group.options || []).map(option => {
                      const isSelected = (selections[group.id] || []).find(o => o.id === option.id);
                      return (
                        <button 
                          key={option.id}
                          onClick={() => handleOptionToggle(group, option)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1.2rem', borderRadius: '16px', border: '1px solid',
                            borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.03)',
                            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', width: '100%'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '24px', height: '24px', borderRadius: group.maxSelectable === 1 ? '50%' : '8px',
                              border: '2px solid', borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isSelected ? 'var(--primary)' : 'transparent',
                              transition: 'all 0.2s ease'
                            }}>
                              {isSelected && <Check size={14} color="white" strokeWidth={4} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: isSelected ? 'white' : 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>{option.name}</div>
                              {!option.isAvailable && <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: '600' }}>No disponible</span>}
                            </div>
                          </div>
                          {parseFloat(option.extraPrice) > 0 && (
                            <span style={{ fontWeight: '800', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                              +${formatCurrency(option.extraPrice)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky Action Footer */}
            <div style={{ 
              padding: '1.5rem', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0
            }}>
              
              {/* Quantity Selector */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '30px', padding: '0.3rem', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Minus size={20} strokeWidth={2.5} />
                  </motion.button>
                  
                  <div style={{ width: '50px', height: '30px', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={quantity}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ position: 'absolute', fontSize: '1.3rem', fontWeight: '900', color: 'white' }}
                      >
                        {quantity}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.4)' }}
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ec4899', marginBottom: '1rem', fontSize: '0.9rem', background: 'rgba(236,72,153,0.1)', padding: '0.8rem', borderRadius: '12px', fontWeight: '600' }}>
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}

              {/* Footer Button */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                className="btn-primary" 
                style={{ 
                  width: '100%', height: '56px', borderRadius: '18px', fontSize: '1.1rem', fontWeight: '900', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem',
                  boxShadow: '0 10px 25px rgba(var(--primary-rgb), 0.3)',
                  background: isSuccess ? '#10b981' : 'var(--primary)',
                  transition: 'background 0.3s ease'
                }}
              >
                {isSuccess ? (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={24} strokeWidth={3} />
                    Agregado
                  </motion.div>
                ) : (
                  <>
                    <span>Agregar al pedido</span>
                    <span style={{ background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.8rem', borderRadius: '12px' }}>
                      ${formatCurrency(calculateTotal())}
                    </span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ItemDetailModal;
