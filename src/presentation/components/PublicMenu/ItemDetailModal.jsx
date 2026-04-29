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
      totalItemPrice: calculateTotal() / quantity // unit price including mods
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', 
          zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' 
        }}>
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="item-detail-panel"
            style={{ 
              width: '100%', maxWidth: '500px', background: '#1e293b', 
              borderTopLeftRadius: '30px', borderTopRightRadius: '30px', 
              maxHeight: '92vh', overflowY: 'auto', position: 'relative'
            }}
          >
            {/* Header / Image */}
            <div style={{ position: 'relative', height: '250px' }}>
              <img 
                src={resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=600'} 
                alt={item.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button onClick={onClose} style={{ 
                position: 'absolute', top: '1.5rem', right: '1.5rem', 
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', 
                padding: '0.5rem', color: 'white', cursor: 'pointer' 
              }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>{item.name}</h2>
                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>${formatCurrency(item.price)}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem', lineHeight: '1.6' }}>{item.description}</p>

              {/* Groups */}
              {(item.groups || []).map(group => (
                <div key={group.id} style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>
                      {group.title || group.name}
                      {group.isRequired && <span style={{ color: '#f87171', marginLeft: '0.5rem' }}>*</span>}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
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
                            borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', width: '100%'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '22px', height: '22px', borderRadius: group.maxSelectable === 1 ? '50%' : '6px',
                              border: '2px solid', borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isSelected ? 'var(--primary)' : 'transparent'
                            }}>
                              {isSelected && <Check size={14} color="white" strokeWidth={4} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: isSelected ? 'white' : 'rgba(255,255,255,0.8)' }}>{option.name}</div>
                              {!option.isAvailable && <span style={{ fontSize: '0.7rem', color: '#f87171' }}>No disponible</span>}
                            </div>
                          </div>
                          {parseFloat(option.extraPrice) > 0 && (
                            <span style={{ fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                              +${formatCurrency(option.extraPrice)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', margin: '3rem 0' }}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Minus size={24} />
                </button>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: 'white', minWidth: '40px', textAlign: 'center' }}>{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Plus size={24} />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', marginBottom: '1.5rem', fontSize: '0.9rem', background: 'rgba(248,113,113,0.1)', padding: '0.8rem', borderRadius: '12px' }}>
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}

              {/* Footer Button */}
              <button 
                onClick={handleAdd}
                className="btn-primary" 
                style={{ width: '100%', padding: '1.2rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: '900', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Agregar al pedido</span>
                <span>${formatCurrency(calculateTotal())}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ItemDetailModal;
