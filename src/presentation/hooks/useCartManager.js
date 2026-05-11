import { useState, useEffect, useCallback } from 'react';

/**
 * useCartManager — Manages the customer's in-session shopping cart.
 *
 * Follows SRP: owns only cart state and operations.
 * Has no knowledge of orders, menu items, or API calls.
 *
 * @returns {{
 *   cart: Array,
 *   itemNotes: Object,
 *   setItemNotes: Function,
 *   isCartExpanded: boolean,
 *   setIsCartExpanded: Function,
 *   cartPulsing: boolean,
 *   cartTotal: number,
 *   totalItems: number,
 *   addToCart: Function,
 *   removeFromCart: Function,
 *   getQuantity: Function,
 *   clearCart: Function
 * }}
 */
export const useCartManager = () => {
  const [cart, setCart] = useState([]);
  const [itemNotes, setItemNotes] = useState({});
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [cartPulsing, setCartPulsing] = useState(false);

  useEffect(() => {
    if (cart.length > 0) {
      setCartPulsing(true);
      const timer = setTimeout(() => setCartPulsing(false), 400);
      return () => clearTimeout(timer);
    }
  }, [cart.length]);

  const addToCart = useCallback((itemWithSelections) => {
    setCart((prev) => {
      const optionsKey = (itemWithSelections.selectedOptions || [])
        .map(o => o.optionId)
        .sort()
        .join(',');

      const existingIndex = prev.findIndex(
        (i) => i.id === itemWithSelections.id && i.optionsKey === optionsKey
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + (itemWithSelections.quantity || 1),
        };
        return next;
      }

      return [
        ...prev,
        { ...itemWithSelections, optionsKey, quantity: itemWithSelections.quantity || 1 },
      ];
    });
  }, []);

  const removeFromCart = useCallback((cartItemKey) => {
    setCart((prev) => {
      const toKey = (i) => (i.optionsKey ? `${i.id}-${i.optionsKey}` : i.id);
      const existing = prev.find((i) => toKey(i) === cartItemKey);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          toKey(i) === cartItemKey ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => toKey(i) !== cartItemKey);
    });
  }, []);

  const getQuantity = useCallback(
    (id) => cart.filter((i) => i.id === id).reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  );

  const cartTotal = cart.reduce((sum, i) => {
    const base = i.price * i.quantity;
    const mods =
      (i.selectedOptions || []).reduce((mSum, opt) => mSum + (opt.extraPrice || 0), 0) *
      i.quantity;
    return sum + base + mods;
  }, 0);

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const clearCart = useCallback(() => {
    setCart([]);
    setItemNotes({});
    setIsCartExpanded(false);
  }, []);

  return {
    cart,
    itemNotes,
    setItemNotes,
    isCartExpanded,
    setIsCartExpanded,
    cartPulsing,
    cartTotal,
    totalItems,
    addToCart,
    removeFromCart,
    getQuantity,
    clearCart,
  };
};
