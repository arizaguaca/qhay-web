import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Info, Plus, Minus, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/formatter';
import { resolveImageUrl } from '../../../data/api/httpClient';
import './ItemDetailModal.css';

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
        <div className="modal-overlay">
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="item-detail-panel"
          >
            {/* Drag Handle */}
            <div className="drag-handle-container" onClick={onClose}>
              <div className="drag-handle" />
            </div>

            {/* Header / Image */}
            <div className="item-image-container">
              <img 
                src={resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1495195129352-aed325a55b65?w=600'} 
                alt={item.name} 
                className="item-image"
              />
              {/* Gradient Overlay */}
              <div className="image-gradient" />
              
              <button className="close-modal-btn" onClick={onClose}>
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="modal-scroll-content no-scrollbar">
              <div className="item-info-header">
                <h2 className="item-title">{item.name}</h2>
                <p className="item-description">
                  {item.description}
                </p>
                {item.prepTime > 0 && (
                  <div className="prep-time-badge">
                    <Clock size={16} strokeWidth={3} />
                    Tiempo de preparación: {item.prepTime} min
                  </div>
                )}
              </div>

              {/* Groups */}
              {(item.groups || []).map(group => (
                <div key={group.id} className="group-container">
                  <div className="group-header">
                    <h4 className="group-title">
                      {group.title || group.name}
                      {group.isRequired && <span className="required-mark">*</span>}
                    </h4>
                    <span className="selection-hint">
                      {group.maxSelectable === 1 ? 'Selecciona 1' : `Máximo ${group.maxSelectable}`}
                    </span>
                  </div>

                  <div className="options-list">
                    {(group.options || []).map(option => {
                      const isSelected = (selections[group.id] || []).find(o => o.id === option.id);
                      return (
                        <button 
                          key={option.id}
                          onClick={() => handleOptionToggle(group, option)}
                          className="option-button"
                          style={{
                            borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.03)',
                          }}
                        >
                          <div className="option-left">
                            <div className="option-checkbox" style={{ 
                              borderRadius: group.maxSelectable === 1 ? '50%' : '8px',
                              borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                              background: isSelected ? 'var(--primary)' : 'transparent',
                            }}>
                              {isSelected && <Check size={14} color="white" strokeWidth={4} />}
                            </div>
                            <div>
                              <div className="option-name" style={{ color: isSelected ? 'white' : 'rgba(255,255,255,0.7)' }}>{option.name}</div>
                              {!option.isAvailable && <span className="unavailable-text">No disponible</span>}
                            </div>
                          </div>
                          {parseFloat(option.extraPrice) > 0 && (
                            <span className="extra-price" style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
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
            <div className="modal-footer">
              
              {/* Quantity Selector */}
              <div className="quantity-container">
                <div className="quantity-selector">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn"
                  >
                    <Minus size={20} strokeWidth={2.5} />
                  </motion.button>
                  
                  <div className="quantity-display">
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={quantity}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="quantity-number"
                      >
                        {quantity}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="quantity-btn quantity-btn-plus"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="error-message">
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}

              {/* Footer Button */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                className={`add-button ${isSuccess ? 'add-button-success' : ''}`}
              >
                {isSuccess ? (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="success-content">
                    <Check size={24} strokeWidth={3} />
                    Agregado
                  </motion.div>
                ) : (
                  <>
                    <span>Agregar al pedido</span>
                    <span className="price-tag">
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
